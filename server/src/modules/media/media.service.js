const { v4: uuid } = require('uuid');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { getDatabase } = require('../../core/database');
const { AppError } = require('../../core/middleware/error-handler');
const config = require('../../../config/default');

class MediaService {
  constructor() {
    this.db = () => getDatabase();
    this.uploadDir = path.resolve(config.upload.dir);

    // Ensure upload directory exists
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
   * Upload and process a file
   */
  async upload(file, folder = '') {
    const db = this.db();
    const id = uuid();
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${id}${ext}`;

    // Create subfolder if needed
    const targetDir = folder
      ? path.join(this.uploadDir, folder)
      : this.uploadDir;

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, filename);
    const relativePath = folder ? `${folder}/${filename}` : filename;

    // Process images with sharp
    let width = null;
    let height = null;
    let thumbnailPath = null;

    if (file.mimetype.startsWith('image/')) {
      // Optimize image
      const image = sharp(file.buffer || file.path);
      const metadata = await image.metadata();
      width = metadata.width;
      height = metadata.height;

      // Save optimized version
      await image
        .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toFile(filePath);

      // Generate thumbnail
      const thumbFilename = `thumb_${filename}`;
      thumbnailPath = folder ? `${folder}/${thumbFilename}` : thumbFilename;
      await image
        .resize(300, 300, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(path.join(targetDir, thumbFilename));
    } else {
      // Non-image file: move/copy as-is
      if (file.buffer) {
        fs.writeFileSync(filePath, file.buffer);
      } else if (file.path) {
        fs.copyFileSync(file.path, filePath);
      }
    }

    const [media] = await db('media')
      .insert({
        id,
        original_name: file.originalname,
        filename,
        path: relativePath,
        thumbnail_path: thumbnailPath,
        mime_type: file.mimetype,
        size: file.size,
        width,
        height,
        folder: folder || null,
        url: `/uploads/${relativePath}`,
        thumbnail_url: thumbnailPath ? `/uploads/${thumbnailPath}` : null,
        created_at: new Date(),
      })
      .returning('*');

    return media;
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

    // Delete physical files
    const filePath = path.join(this.uploadDir, media.path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    if (media.thumbnail_path) {
      const thumbPath = path.join(this.uploadDir, media.thumbnail_path);
      if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
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
