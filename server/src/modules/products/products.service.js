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

    const [product] = await db('products')
      .insert({
        id,
        name: data.name,
        slug,
        description: data.description || null,
        short_description: data.shortDescription || null,
        sku: data.sku || null,
        price: data.price,
        sale_price: data.salePrice || null,
        cost_price: data.costPrice || null,
        tax_rate: data.taxRate || 0,
        stock_quantity: data.stockQuantity || 0,
        low_stock_threshold: data.lowStockThreshold || 5,
        track_inventory: data.trackInventory !== false,
        weight: data.weight || null,
        status: data.status || 'draft',
        meta_title: data.metaTitle || null,
        meta_description: data.metaDescription || null,
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
    if (data.shortDescription !== undefined) updateData.short_description = data.shortDescription;
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
    // Move child categories to parent
    const category = await db('categories').where({ id }).first();
    if (!category) throw new AppError('Category not found', 404);

    await db('categories').where({ parent_id: id }).update({ parent_id: category.parent_id });
    await db('product_categories').where({ category_id: id }).del();
    await db('categories').where({ id }).del();
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
