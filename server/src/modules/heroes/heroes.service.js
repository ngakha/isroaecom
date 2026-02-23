const { v4: uuid } = require('uuid');
const { getDatabase } = require('../../core/database');
const { AppError } = require('../../core/middleware/error-handler');

class HeroesService {
  constructor() {
    this.db = () => getDatabase();
  }

  async listPublic() {
    const db = this.db();
    return db('hero_slides')
      .where({ is_active: true })
      .orderBy('sort_order', 'asc');
  }

  async listAll() {
    const db = this.db();
    return db('hero_slides').orderBy('sort_order', 'asc');
  }

  async findById(id) {
    const db = this.db();
    const slide = await db('hero_slides').where({ id }).first();
    if (!slide) throw new AppError('Hero slide not found', 404);
    return slide;
  }

  async create(data) {
    const db = this.db();
    const id = uuid();

    let imageUrl = null;
    let thumbnailUrl = null;
    if (data.mediaId) {
      const media = await db('media').where({ id: data.mediaId }).first();
      if (media) {
        imageUrl = media.url;
        thumbnailUrl = media.thumbnail_url;
      }
    }

    let sortOrder = data.sortOrder;
    if (sortOrder === undefined || sortOrder === null) {
      const max = await db('hero_slides').max('sort_order as max').first();
      sortOrder = (max?.max ?? -1) + 1;
    }

    const [slide] = await db('hero_slides')
      .insert({
        id,
        title: data.title || null,
        subtitle: data.subtitle || null,
        button_text: data.buttonText || null,
        button_url: data.buttonUrl || null,
        image_url: imageUrl,
        thumbnail_url: thumbnailUrl,
        media_id: data.mediaId || null,
        sort_order: sortOrder,
        is_active: data.isActive !== false,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    return slide;
  }

  async update(id, data) {
    const db = this.db();
    const existing = await db('hero_slides').where({ id }).first();
    if (!existing) throw new AppError('Hero slide not found', 404);

    const updateData = { updated_at: new Date() };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.subtitle !== undefined) updateData.subtitle = data.subtitle;
    if (data.buttonText !== undefined) updateData.button_text = data.buttonText;
    if (data.buttonUrl !== undefined) updateData.button_url = data.buttonUrl;
    if (data.sortOrder !== undefined) updateData.sort_order = data.sortOrder;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    if (data.mediaId !== undefined) {
      updateData.media_id = data.mediaId;
      if (data.mediaId) {
        const media = await db('media').where({ id: data.mediaId }).first();
        if (media) {
          updateData.image_url = media.url;
          updateData.thumbnail_url = media.thumbnail_url;
        }
      } else {
        updateData.image_url = null;
        updateData.thumbnail_url = null;
      }
    }

    const [slide] = await db('hero_slides').where({ id }).update(updateData).returning('*');
    return slide;
  }

  async delete(id) {
    const db = this.db();
    const deleted = await db('hero_slides').where({ id }).del();
    if (!deleted) throw new AppError('Hero slide not found', 404);
  }

  async reorder(slideIds) {
    const db = this.db();
    await db.transaction(async (trx) => {
      for (let i = 0; i < slideIds.length; i++) {
        await trx('hero_slides')
          .where({ id: slideIds[i] })
          .update({ sort_order: i, updated_at: new Date() });
      }
    });
    return this.listAll();
  }
}

module.exports = new HeroesService();
