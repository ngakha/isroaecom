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

// Use Vercel Blob when token is available, otherwise local filesystem
const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
let blob;
if (useBlob) {
  blob = require('@vercel/blob');
}

class MediaService {
  constructor() {
    this.db = () => getDatabase();

    if (!useBlob) {
      this.uploadDir = path.resolve(config.upload.dir);
      try {
        if (!fs.existsSync(this.uploadDir)) {
          fs.mkdirSync(this.uploadDir, { recursive: true });
        }
      } catch (err) {
        console.warn('[Media] Could not create upload dir:', err.message);
      }
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
   * Uses Vercel Blob in production, local filesystem in development
   */
  async upload(file, folder = '') {
    const db = this.db();
    const id = uuid();
    const prefixPath = folder ? `${folder}/` : '';

    if (file.mimetype.startsWith('image/')) {
      // ─── Image Processing ─────────────────────────
      const source = sharp(file.buffer || file.path).rotate();
      const metadata = await source.metadata();

      const generated = {};

      for (const [sizeName, preset] of Object.entries(IMAGE_SIZES)) {
        const suffix = sizeName === 'full' ? '' : `_${sizeName}`;
        const filename = `${id}${suffix}.webp`;

        const buffer = await source
          .clone()
          .resize({
            width: preset.width,
            height: preset.height,
            fit: preset.fit,
            withoutEnlargement: true,
          })
          .webp({ quality: preset.quality })
          .toBuffer();

        if (useBlob) {
          const { url } = await blob.put(`${prefixPath}${filename}`, buffer, {
            access: 'public',
            contentType: 'image/webp',
          });
          generated[sizeName] = url;
        } else {
          const targetDir = folder
            ? path.join(this.uploadDir, folder)
            : this.uploadDir;
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
          fs.writeFileSync(path.join(targetDir, filename), buffer);
          generated[sizeName] = `/uploads/${prefixPath}${filename}`;
        }
      }

      const fullFilename = `${id}.webp`;
      const fullRelativePath = `${prefixPath}${fullFilename}`;

      const [media] = await db('media')
        .insert({
          id,
          original_name: file.originalname,
          filename: fullFilename,
          path: fullRelativePath,
          thumbnail_path: useBlob ? generated.thumb : `${prefixPath}${id}_thumb.webp`,
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
      let fileUrl;

      if (useBlob) {
        const buffer = file.buffer || fs.readFileSync(file.path);
        const { url } = await blob.put(`${prefixPath}${filename}`, buffer, {
          access: 'public',
          contentType: file.mimetype,
        });
        fileUrl = url;
      } else {
        const targetDir = folder
          ? path.join(this.uploadDir, folder)
          : this.uploadDir;
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        const filePath = path.join(targetDir, filename);
        if (file.buffer) {
          fs.writeFileSync(filePath, file.buffer);
        } else if (file.path) {
          fs.copyFileSync(file.path, filePath);
        }
        fileUrl = `/uploads/${prefixPath}${filename}`;
      }

      const [media] = await db('media')
        .insert({
          id,
          original_name: file.originalname,
          filename,
          path: useBlob ? fileUrl : `${prefixPath}${filename}`,
          thumbnail_path: null,
          mime_type: file.mimetype,
          size: file.size,
          width: null,
          height: null,
          folder: folder || null,
          url: fileUrl,
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

    if (useBlob) {
      // Delete all blob variants for this media ID
      try {
        const prefix = media.folder ? `${media.folder}/${id}` : id;
        const { blobs: items } = await blob.list({ prefix });
        const urlsToDelete = items.map((b) => b.url);
        if (urlsToDelete.length > 0) {
          await blob.del(urlsToDelete);
        }
      } catch (err) {
        console.warn('[Media] Failed to delete blobs:', err.message);
      }
    } else {
      // Delete from local filesystem
      const dir = media.folder
        ? path.join(this.uploadDir, media.folder)
        : this.uploadDir;

      for (const suffix of ['', '_md', '_thumb', '_micro']) {
        const filePath = path.join(dir, `${id}${suffix}.webp`);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }

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
