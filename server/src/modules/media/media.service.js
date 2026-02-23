const { v4: uuid } = require('uuid');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { getDatabase } = require('../../core/database');
const { AppError } = require('../../core/middleware/error-handler');
const config = require('../../../config/default');

/**
 * Image size presets for ecommerce
 *
 * full   — Product detail page zoom / lightbox (1400px max)
 * md     — Product cards in listing grid (600px max)
 * thumb  — Admin panel, cart items, square crop (300x300)
 * micro  — Mini cart, order line items, square crop (80x80)
 */
const IMAGE_SIZES = {
  full:  { width: 1400, height: 1400, fit: 'inside', quality: 85 },
  md:    { width: 600,  height: 600,  fit: 'inside', quality: 80 },
  thumb: { width: 300,  height: 300,  fit: 'cover',  quality: 75 },
  micro: { width: 80,   height: 80,   fit: 'cover',  quality: 70 },
};

class MediaService {
  constructor() {
    this.db = () => getDatabase();
    this.uploadDir = path.resolve(config.upload.dir);

    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async list({ page = 1, limit = 50, type, search }) {
    const db = this.db();
    let query = db('media');

    if (type) query = query.where('mime_type', 'like', `${type}/%`);
    if (search) query = query.whereILike('original_name', `%${search}%`);

    const [{ count }] = await query.clone().count('id as count');
    const offset = (page - 1) * limit;

    const files = await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      data: files,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(count),
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Upload and process a file with multiple optimized sizes (WebP)
   */
  async upload(file, folder = '') {
    const db = this.db();
    const id = uuid();

    const targetDir = folder
      ? path.join(this.uploadDir, folder)
      : this.uploadDir;

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const prefixPath = folder ? `${folder}/` : '';

    if (file.mimetype.startsWith('image/')) {
      // ─── Image Processing ─────────────────────────
      const source = sharp(file.buffer || file.path).rotate(); // auto-rotate from EXIF
      const metadata = await source.metadata();

      const generated = {};

      for (const [sizeName, preset] of Object.entries(IMAGE_SIZES)) {
        const suffix = sizeName === 'full' ? '' : `_${sizeName}`;
        const filename = `${id}${suffix}.webp`;
        const filePath = path.join(targetDir, filename);
        const relativePath = `${prefixPath}${filename}`;

        await source
          .clone()
          .resize({
            width: preset.width,
            height: preset.height,
            fit: preset.fit,
            withoutEnlargement: true,
          })
          .webp({ quality: preset.quality })
          .toFile(filePath);

        generated[sizeName] = `/uploads/${relativePath}`;
      }

      const fullFilename = `${id}.webp`;
      const fullRelativePath = `${prefixPath}${fullFilename}`;

      const [media] = await db('media')
        .insert({
          id,
          original_name: file.originalname,
          filename: fullFilename,
          path: fullRelativePath,
          thumbnail_path: `${prefixPath}${id}_thumb.webp`,
          mime_type: 'image/webp',
          size: file.size,
          width: metadata.width,
          height: metadata.height,
          folder: folder || null,
          url: generated.full,
          thumbnail_url: generated.thumb,
          created_at: new Date(),
        })
        .returning('*');

      // Attach all size URLs to the response
      media.sizes = generated;

      return media;
    } else {
      // ─── Non-image file ───────────────────────────
      const ext = path.extname(file.originalname).toLowerCase();
      const filename = `${id}${ext}`;
      const filePath = path.join(targetDir, filename);
      const relativePath = `${prefixPath}${filename}`;

      if (file.buffer) {
        fs.writeFileSync(filePath, file.buffer);
      } else if (file.path) {
        fs.copyFileSync(file.path, filePath);
      }

      const [media] = await db('media')
        .insert({
          id,
          original_name: file.originalname,
          filename,
          path: relativePath,
          thumbnail_path: null,
          mime_type: file.mimetype,
          size: file.size,
          width: null,
          height: null,
          folder: folder || null,
          url: `/uploads/${relativePath}`,
          thumbnail_url: null,
          created_at: new Date(),
        })
        .returning('*');

      return media;
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultiple(files, folder = '') {
    const results = [];
    for (const file of files) {
      const media = await this.upload(file, folder);
      results.push(media);
    }
    return results;
  }

  async findById(id) {
    const db = this.db();
    const media = await db('media').where({ id }).first();
    if (!media) throw new AppError('Media not found', 404);
    return media;
  }

  async delete(id) {
    const db = this.db();
    const media = await db('media').where({ id }).first();
    if (!media) throw new AppError('Media not found', 404);

    const dir = media.folder
      ? path.join(this.uploadDir, media.folder)
      : this.uploadDir;

    // Delete all generated WebP size variants
    for (const suffix of ['', '_md', '_thumb', '_micro']) {
      const filePath = path.join(dir, `${id}${suffix}.webp`);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    // Also clean up legacy JPEG files (uploaded before WebP migration)
    const legacyPath = path.join(this.uploadDir, media.path);
    if (fs.existsSync(legacyPath) && !legacyPath.endsWith('.webp')) {
      fs.unlinkSync(legacyPath);
    }
    if (media.thumbnail_path) {
      const legacyThumb = path.join(this.uploadDir, media.thumbnail_path);
      if (fs.existsSync(legacyThumb) && !legacyThumb.endsWith('.webp')) {
        fs.unlinkSync(legacyThumb);
      }
    }

    await db('media').where({ id }).del();
  }

  /**
   * Attach media to a product
   */
  async attachToProduct(productId, mediaId, sortOrder = 0) {
    const db = this.db();
    const media = await this.findById(mediaId);

    await db('product_images').insert({
      id: uuid(),
      product_id: productId,
      media_id: mediaId,
      url: media.url,
      thumbnail_url: media.thumbnail_url,
      sort_order: sortOrder,
    });
  }
}

module.exports = new MediaService();
