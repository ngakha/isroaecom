const { v4: uuid } = require('uuid');
const { getDatabase } = require('../../core/database');
const { AppError } = require('../../core/middleware/error-handler');
const { generateUniqueSlug } = require('../../utils/slug');
const LifecycleHooks = require('../../plugins/hooks/lifecycle');

const hooks = new LifecycleHooks('products');

class ProductsService {
  constructor() {
    this.db = () => getDatabase();
  }

  /**
   * List products with filters, search, pagination
   */
  async list({ page = 1, limit = 25, search, categoryId, status, sortBy = 'created_at', sortOrder = 'desc' }) {
    const db = this.db();
    let query = db('products').where('products.is_deleted', false);

    if (search) {
      query = query.where((builder) => {
        builder
          .whereILike('products.name', `%${search}%`)
          .orWhereILike('products.sku', `%${search}%`);
      });
    }

    if (categoryId) {
      query = query
        .join('product_categories', 'products.id', 'product_categories.product_id')
        .where('product_categories.category_id', categoryId);
    }

    if (status) {
      query = query.where('products.status', status);
    }

    // Count total
    const [{ count }] = await query.clone().count('products.id as count');

    // Fetch with pagination
    const offset = (page - 1) * limit;
    const products = await query
      .select('products.*')
      .orderBy(`products.${sortBy}`, sortOrder)
      .limit(limit)
      .offset(offset);

    // Attach categories and variants for each product
    const productIds = products.map((p) => p.id);

    const categories = productIds.length
      ? await db('product_categories')
          .join('categories', 'product_categories.category_id', 'categories.id')
          .whereIn('product_categories.product_id', productIds)
          .select('product_categories.product_id', 'categories.*')
      : [];

    const variants = productIds.length
      ? await db('product_variants').whereIn('product_id', productIds)
      : [];

    const images = productIds.length
      ? await db('product_images').whereIn('product_id', productIds).orderBy('sort_order')
      : [];

    const data = products.map((product) => ({
      ...product,
      categories: categories.filter((c) => c.product_id === product.id),
      variants: variants.filter((v) => v.product_id === product.id),
      images: images.filter((i) => i.product_id === product.id),
    }));

    return {
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(count),
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Lightweight search for live/autocomplete (returns minimal data, fast)
   */
  async search(query, limit = 6) {
    const db = this.db();
    if (!query || query.length < 2) return [];

    const products = await db('products')
      .where('is_deleted', false)
      .where('status', 'published')
      .where((builder) => {
        builder
          .whereILike('name', `%${query}%`)
          .orWhereILike('sku', `%${query}%`);
      })
      .select('id', 'name', 'slug', 'price', 'sale_price')
      .orderBy('name')
      .limit(limit);

    const productIds = products.map((p) => p.id);
    const images = productIds.length
      ? await db('product_images')
          .whereIn('product_id', productIds)
          .where('sort_order', 0)
          .select('product_id', 'thumbnail_url', 'url')
      : [];

    return products.map((p) => ({
      ...p,
      image: images.find((i) => i.product_id === p.id)?.thumbnail_url
        || images.find((i) => i.product_id === p.id)?.url
        || null,
    }));
  }

  /**
   * Get related products for a given product
   * Strategy: same categories first, then same price range as fallback
   */
  async getRelated(productId, limit = 4) {
    const db = this.db();

    const product = await db('products').where({ id: productId, is_deleted: false }).first();
    if (!product) return [];

    // Get category IDs for this product
    const categoryLinks = await db('product_categories').where({ product_id: productId });
    const categoryIds = categoryLinks.map((c) => c.category_id);

    let relatedIds = [];

    // Strategy 1: Products in the same categories
    if (categoryIds.length > 0) {
      const sameCat = await db('product_categories')
        .whereIn('category_id', categoryIds)
        .whereNot('product_id', productId)
        .distinct('product_id')
        .limit(limit);
      relatedIds = sameCat.map((r) => r.product_id);
    }

    // Strategy 2: If not enough, fill with similar price range
    if (relatedIds.length < limit) {
      const remaining = limit - relatedIds.length;
      const priceRange = parseFloat(product.price) * 0.5;
      const priceLow = Math.max(0, parseFloat(product.price) - priceRange);
      const priceHigh = parseFloat(product.price) + priceRange;

      const priceBased = await db('products')
        .where('is_deleted', false)
        .where('status', 'published')
        .whereNot('id', productId)
        .whereNotIn('id', relatedIds)
        .whereBetween('price', [priceLow, priceHigh])
        .select('id')
        .orderByRaw('RANDOM()')
        .limit(remaining);

      relatedIds = [...relatedIds, ...priceBased.map((r) => r.id)];
    }

    if (relatedIds.length === 0) return [];

    // Fetch full product data
    const products = await db('products')
      .whereIn('id', relatedIds)
      .where('is_deleted', false)
      .where('status', 'published')
      .limit(limit);

    const ids = products.map((p) => p.id);

    const [categories, variants, images] = await Promise.all([
      db('product_categories')
        .join('categories', 'product_categories.category_id', 'categories.id')
        .whereIn('product_categories.product_id', ids)
        .select('product_categories.product_id', 'categories.*'),
      db('product_variants').whereIn('product_id', ids),
      db('product_images').whereIn('product_id', ids).orderBy('sort_order'),
    ]);

    return products.map((p) => ({
      ...p,
      categories: categories.filter((c) => c.product_id === p.id),
      variants: variants.filter((v) => v.product_id === p.id),
      images: images.filter((i) => i.product_id === p.id),
    }));
  }

  /**
   * Get single product by ID or slug
   */
  async findById(id) {
    const db = this.db();

    const product = await db('products').where({ id, is_deleted: false }).first();
    if (!product) throw new AppError('Product not found', 404);

    const [categories, variants, images, attributes] = await Promise.all([
      db('product_categories')
        .join('categories', 'product_categories.category_id', 'categories.id')
        .where('product_categories.product_id', id)
        .select('categories.*'),
      db('product_variants').where({ product_id: id }),
      db('product_images').where({ product_id: id }).orderBy('sort_order'),
      db('product_attributes').where({ product_id: id }),
    ]);

    return { ...product, categories, variants, images, attributes };
  }

  async findBySlug(slug) {
    const db = this.db();
    const product = await db('products').where({ slug, is_deleted: false }).first();
    if (!product) throw new AppError('Product not found', 404);
    return this.findById(product.id);
  }

  /**
   * Create product
   */
  async create(data) {
    await hooks.run('beforeCreate', data);
    const db = this.db();
    const id = uuid();
    const slug = await generateUniqueSlug(data.name, 'products');

    // Auto-generate SKU if not provided
    const sku = data.sku || await this.generateSku(data.name);

    // Auto-generate SEO fields if not provided
    const metaTitle = data.metaTitle || data.name;
    const metaDescription = data.metaDescription
      || (data.description ? data.description.substring(0, 160) : null);

    const [product] = await db('products')
      .insert({
        id,
        name: data.name,
        slug,
        description: data.description || null,
        sku,
        price: data.price,
        sale_price: data.salePrice || null,
        cost_price: data.costPrice || null,
        tax_rate: data.taxRate || 0,
        stock_quantity: data.stockQuantity || 0,
        low_stock_threshold: data.lowStockThreshold || 5,
        track_inventory: data.trackInventory !== false,
        weight: data.weight || null,
        status: data.status || 'draft',
        meta_title: metaTitle,
        meta_description: metaDescription,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    // Attach categories
    if (data.categoryIds?.length) {
      await db('product_categories').insert(
        data.categoryIds.map((categoryId) => ({
          product_id: id,
          category_id: categoryId,
        }))
      );
    }

    await hooks.run('afterCreate', product);
    return this.findById(id);
  }

  /**
   * Update product
   */
  async update(id, data) {
    await hooks.run('beforeUpdate', { id, ...data });
    const db = this.db();

    const existing = await db('products').where({ id, is_deleted: false }).first();
    if (!existing) throw new AppError('Product not found', 404);

    const updateData = {};
    if (data.name !== undefined) {
      updateData.name = data.name;
      updateData.slug = await generateUniqueSlug(data.name, 'products', id);
    }
    if (data.description !== undefined) updateData.description = data.description;
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.salePrice !== undefined) updateData.sale_price = data.salePrice;
    if (data.costPrice !== undefined) updateData.cost_price = data.costPrice;
    if (data.taxRate !== undefined) updateData.tax_rate = data.taxRate;
    if (data.stockQuantity !== undefined) updateData.stock_quantity = data.stockQuantity;
    if (data.lowStockThreshold !== undefined) updateData.low_stock_threshold = data.lowStockThreshold;
    if (data.trackInventory !== undefined) updateData.track_inventory = data.trackInventory;
    if (data.weight !== undefined) updateData.weight = data.weight;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.metaTitle !== undefined) updateData.meta_title = data.metaTitle;
    if (data.metaDescription !== undefined) updateData.meta_description = data.metaDescription;

    updateData.updated_at = new Date();

    await db('products').where({ id }).update(updateData);

    // Update categories if provided
    if (data.categoryIds) {
      await db('product_categories').where({ product_id: id }).del();
      if (data.categoryIds.length) {
        await db('product_categories').insert(
          data.categoryIds.map((categoryId) => ({
            product_id: id,
            category_id: categoryId,
          }))
        );
      }
    }

    const result = await this.findById(id);
    await hooks.run('afterUpdate', result);
    return result;
  }

  /**
   * Soft delete product
   */
  async delete(id) {
    await hooks.run('beforeDelete', { id });
    const db = this.db();

    const existing = await db('products').where({ id, is_deleted: false }).first();
    if (!existing) throw new AppError('Product not found', 404);

    await db('products').where({ id }).update({ is_deleted: true, updated_at: new Date() });
    await hooks.run('afterDelete', { id });
  }

  // ─── Variants ────────────────────────────────────

  async addVariant(productId, data) {
    const db = this.db();
    const id = uuid();

    const [variant] = await db('product_variants')
      .insert({
        id,
        product_id: productId,
        name: data.name,
        sku: data.sku || null,
        price: data.price,
        sale_price: data.salePrice || null,
        stock_quantity: data.stockQuantity || 0,
        attributes: JSON.stringify(data.attributes || {}),
        image_id: data.imageId || null,
        is_active: true,
        created_at: new Date(),
      })
      .returning('*');

    return variant;
  }

  async updateVariant(variantId, data) {
    const db = this.db();
    const updateData = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.salePrice !== undefined) updateData.sale_price = data.salePrice;
    if (data.stockQuantity !== undefined) updateData.stock_quantity = data.stockQuantity;
    if (data.attributes !== undefined) updateData.attributes = JSON.stringify(data.attributes);
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    if (data.imageId !== undefined) updateData.image_id = data.imageId || null;

    const [variant] = await db('product_variants')
      .where({ id: variantId })
      .update(updateData)
      .returning('*');

    if (!variant) throw new AppError('Variant not found', 404);
    return variant;
  }

  async deleteVariant(variantId) {
    const db = this.db();
    const deleted = await db('product_variants').where({ id: variantId }).del();
    if (!deleted) throw new AppError('Variant not found', 404);
  }

  // ─── Categories ──────────────────────────────────

  async listCategories() {
    const db = this.db();
    const categories = await db('categories').orderBy('sort_order');

    // Build tree structure
    return this.buildCategoryTree(categories);
  }

  async createCategory(data) {
    const db = this.db();
    const id = uuid();
    const slug = await generateUniqueSlug(data.name, 'categories');

    const [category] = await db('categories')
      .insert({
        id,
        name: data.name,
        slug,
        description: data.description || null,
        parent_id: data.parentId || null,
        image_url: data.imageUrl || null,
        sort_order: data.sortOrder || 0,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    return category;
  }

  async updateCategory(id, data) {
    const db = this.db();
    const updateData = { updated_at: new Date() };

    if (data.name !== undefined) {
      updateData.name = data.name;
      updateData.slug = await generateUniqueSlug(data.name, 'categories', id);
    }
    if (data.description !== undefined) updateData.description = data.description;
    if (data.parentId !== undefined) updateData.parent_id = data.parentId;
    if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
    if (data.sortOrder !== undefined) updateData.sort_order = data.sortOrder;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    const [category] = await db('categories').where({ id }).update(updateData).returning('*');
    if (!category) throw new AppError('Category not found', 404);
    return category;
  }

  async deleteCategory(id) {
    const db = this.db();
    const category = await db('categories').where({ id }).first();
    if (!category) throw new AppError('Category not found', 404);

    await db.transaction(async (trx) => {
      await trx('categories').where({ parent_id: id }).update({ parent_id: category.parent_id });
      await trx('product_categories').where({ category_id: id }).del();
      await trx('categories').where({ id }).del();
    });
  }

  // ─── Product Images ─────────────────────────────

  async addImages(productId, mediaIds) {
    const db = this.db();
    const existing = await db('products').where({ id: productId, is_deleted: false }).first();
    if (!existing) throw new AppError('Product not found', 404);

    const mediaService = require('../media/media.service');
    const currentMax = await db('product_images')
      .where({ product_id: productId })
      .max('sort_order as max')
      .first();
    let sortOrder = (currentMax?.max ?? -1) + 1;

    const images = [];
    for (const mediaId of mediaIds) {
      const media = await mediaService.findById(mediaId);
      const id = require('uuid').v4();
      const [image] = await db('product_images')
        .insert({
          id,
          product_id: productId,
          media_id: mediaId,
          url: media.url,
          thumbnail_url: media.thumbnail_url,
          sort_order: sortOrder++,
        })
        .returning('*');
      images.push(image);
    }
    return images;
  }

  async removeImage(productId, imageId) {
    const db = this.db();
    const deleted = await db('product_images')
      .where({ id: imageId, product_id: productId })
      .del();
    if (!deleted) throw new AppError('Image not found', 404);
  }

  async reorderImages(productId, imageIds) {
    const db = this.db();
    for (let i = 0; i < imageIds.length; i++) {
      await db('product_images')
        .where({ id: imageIds[i], product_id: productId })
        .update({ sort_order: i });
    }
    return db('product_images')
      .where({ product_id: productId })
      .orderBy('sort_order');
  }

  // ─── Product Attributes ────────────────────────

  async addAttribute(productId, data) {
    const db = this.db();
    const existing = await db('products').where({ id: productId, is_deleted: false }).first();
    if (!existing) throw new AppError('Product not found', 404);

    const id = uuid();
    const [attribute] = await db('product_attributes')
      .insert({
        id,
        product_id: productId,
        key: data.key,
        value: data.value,
      })
      .returning('*');

    return attribute;
  }

  async updateAttribute(attributeId, data) {
    const db = this.db();
    const updateData = {};
    if (data.key !== undefined) updateData.key = data.key;
    if (data.value !== undefined) updateData.value = data.value;

    const [attribute] = await db('product_attributes')
      .where({ id: attributeId })
      .update(updateData)
      .returning('*');

    if (!attribute) throw new AppError('Attribute not found', 404);
    return attribute;
  }

  async deleteAttribute(attributeId) {
    const db = this.db();
    const deleted = await db('product_attributes').where({ id: attributeId }).del();
    if (!deleted) throw new AppError('Attribute not found', 404);
  }

  /**
   * Generate a unique SKU from product name
   * Format: ABC-12345 (3-letter prefix from name + 5-digit number)
   */
  async generateSku(name) {
    const db = this.db();
    const prefix = name
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 3)
      .toUpperCase()
      .padEnd(3, 'X');

    // Find the highest existing numeric suffix for this prefix
    const existing = await db('products')
      .where('sku', 'like', `${prefix}-%`)
      .orderBy('sku', 'desc')
      .first();

    let num = 1;
    if (existing?.sku) {
      const match = existing.sku.match(/-(\d+)$/);
      if (match) num = parseInt(match[1], 10) + 1;
    }

    const sku = `${prefix}-${String(num).padStart(5, '0')}`;

    // Ensure uniqueness
    const duplicate = await db('products').where({ sku }).first();
    if (duplicate) {
      return `${prefix}-${String(Date.now() % 100000).padStart(5, '0')}`;
    }

    return sku;
  }

  buildCategoryTree(categories, parentId = null) {
    return categories
      .filter((c) => c.parent_id === parentId)
      .map((category) => ({
        ...category,
        children: this.buildCategoryTree(categories, category.id),
      }));
  }
}

module.exports = new ProductsService();
