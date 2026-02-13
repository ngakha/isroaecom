/**
 * PRShark Ecommerce Engine - Initial Database Schema
 * All tables needed for the ecommerce engine
 */
exports.up = async function (knex) {
  // ─── Order counter sequence ──────────────────────
  await knex.raw('CREATE SEQUENCE IF NOT EXISTS order_counter_seq START 1');

  // ─── Admin Users ─────────────────────────────────
  await knex.schema.createTable('admin_users', (table) => {
    table.uuid('id').primary();
    table.string('email', 255).unique().notNullable();
    table.string('password', 255).notNullable();
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.enum('role', ['super_admin', 'shop_manager', 'content_editor']).defaultTo('content_editor');
    table.boolean('is_active').defaultTo(true);
    table.integer('failed_login_attempts').defaultTo(0);
    table.timestamp('locked_until').nullable();
    table.timestamp('last_login').nullable();
    table.timestamps(true, true);

    table.index('email');
  });

  // ─── Refresh Tokens ──────────────────────────────
  await knex.schema.createTable('refresh_tokens', (table) => {
    table.uuid('id').primary();
    table.uuid('user_id').notNullable();
    table.text('token').notNullable();
    table.boolean('revoked').defaultTo(false);
    table.timestamp('expires_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('token');
    table.index('user_id');
  });

  // ─── Customers ───────────────────────────────────
  await knex.schema.createTable('customers', (table) => {
    table.uuid('id').primary();
    table.string('email', 255).unique().notNullable();
    table.string('password', 255).notNullable();
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('phone', 20).nullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamp('last_login').nullable();
    table.timestamps(true, true);

    table.index('email');
  });

  // ─── Customer Addresses ──────────────────────────
  await knex.schema.createTable('customer_addresses', (table) => {
    table.uuid('id').primary();
    table.uuid('customer_id').notNullable().references('id').inTable('customers').onDelete('CASCADE');
    table.string('label', 50).defaultTo('Home');
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('address_line1', 500).notNullable();
    table.string('address_line2', 500).nullable();
    table.string('city', 100).notNullable();
    table.string('state', 100).nullable();
    table.string('postal_code', 20).nullable();
    table.string('country', 100).notNullable();
    table.string('phone', 20).nullable();
    table.boolean('is_default').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('customer_id');
  });

  // ─── Categories ──────────────────────────────────
  await knex.schema.createTable('categories', (table) => {
    table.uuid('id').primary();
    table.string('name', 200).notNullable();
    table.string('slug', 250).unique().notNullable();
    table.text('description').nullable();
    table.uuid('parent_id').nullable().references('id').inTable('categories').onDelete('SET NULL');
    table.string('image_url', 500).nullable();
    table.integer('sort_order').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);

    table.index('slug');
    table.index('parent_id');
  });

  // ─── Products ────────────────────────────────────
  await knex.schema.createTable('products', (table) => {
    table.uuid('id').primary();
    table.string('name', 500).notNullable();
    table.string('slug', 550).unique().notNullable();
    table.text('description').nullable();
    table.string('short_description', 500).nullable();
    table.string('sku', 100).nullable();
    table.decimal('price', 12, 2).notNullable();
    table.decimal('sale_price', 12, 2).nullable();
    table.decimal('cost_price', 12, 2).nullable();
    table.decimal('tax_rate', 5, 2).defaultTo(0);
    table.integer('stock_quantity').defaultTo(0);
    table.integer('low_stock_threshold').defaultTo(5);
    table.boolean('track_inventory').defaultTo(true);
    table.decimal('weight', 8, 2).nullable();
    table.enum('status', ['draft', 'published', 'archived']).defaultTo('draft');
    table.boolean('is_deleted').defaultTo(false);
    table.string('meta_title', 200).nullable();
    table.string('meta_description', 500).nullable();
    table.timestamps(true, true);

    table.index('slug');
    table.index('status');
    table.index('sku');
    table.index('is_deleted');
  });

  // ─── Product Categories (M2M) ───────────────────
  await knex.schema.createTable('product_categories', (table) => {
    table.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    table.uuid('category_id').notNullable().references('id').inTable('categories').onDelete('CASCADE');
    table.primary(['product_id', 'category_id']);
  });

  // ─── Product Variants ────────────────────────────
  await knex.schema.createTable('product_variants', (table) => {
    table.uuid('id').primary();
    table.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    table.string('name', 200).notNullable();
    table.string('sku', 100).nullable();
    table.decimal('price', 12, 2).notNullable();
    table.decimal('sale_price', 12, 2).nullable();
    table.integer('stock_quantity').defaultTo(0);
    table.jsonb('attributes').defaultTo('{}'); // e.g. { "color": "red", "size": "XL" }
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('product_id');
    table.index('sku');
  });

  // ─── Product Attributes (dynamic fields) ────────
  await knex.schema.createTable('product_attributes', (table) => {
    table.uuid('id').primary();
    table.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    table.string('key', 100).notNullable();
    table.text('value').notNullable();

    table.index('product_id');
  });

  // ─── Media Library ───────────────────────────────
  await knex.schema.createTable('media', (table) => {
    table.uuid('id').primary();
    table.string('original_name', 500).notNullable();
    table.string('filename', 300).notNullable();
    table.string('path', 500).notNullable();
    table.string('thumbnail_path', 500).nullable();
    table.string('mime_type', 100).notNullable();
    table.integer('size').notNullable(); // bytes
    table.integer('width').nullable();
    table.integer('height').nullable();
    table.string('folder', 200).nullable();
    table.string('url', 500).notNullable();
    table.string('thumbnail_url', 500).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('folder');
    table.index('mime_type');
  });

  // ─── Product Images ──────────────────────────────
  await knex.schema.createTable('product_images', (table) => {
    table.uuid('id').primary();
    table.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    table.uuid('media_id').nullable().references('id').inTable('media').onDelete('SET NULL');
    table.string('url', 500).notNullable();
    table.string('thumbnail_url', 500).nullable();
    table.integer('sort_order').defaultTo(0);

    table.index('product_id');
  });

  // ─── Carts ───────────────────────────────────────
  await knex.schema.createTable('carts', (table) => {
    table.uuid('id').primary();
    table.uuid('customer_id').nullable().references('id').inTable('customers').onDelete('CASCADE');
    table.string('session_id', 100).nullable();
    table.timestamp('expires_at').nullable();
    table.timestamps(true, true);

    table.index('customer_id');
    table.index('session_id');
  });

  // ─── Cart Items ──────────────────────────────────
  await knex.schema.createTable('cart_items', (table) => {
    table.uuid('id').primary();
    table.uuid('cart_id').notNullable().references('id').inTable('carts').onDelete('CASCADE');
    table.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    table.uuid('variant_id').nullable().references('id').inTable('product_variants').onDelete('SET NULL');
    table.integer('quantity').notNullable().defaultTo(1);
    table.timestamps(true, true);

    table.index('cart_id');
  });

  // ─── Orders ──────────────────────────────────────
  await knex.schema.createTable('orders', (table) => {
    table.uuid('id').primary();
    table.string('order_number', 30).unique().notNullable();
    table.uuid('customer_id').nullable().references('id').inTable('customers').onDelete('SET NULL');
    table.string('customer_email', 255).notNullable();
    table.string('customer_name', 200).notNullable();
    table.enum('status', [
      'pending', 'confirmed', 'processing', 'shipped',
      'delivered', 'completed', 'cancelled', 'refund_requested', 'refunded',
    ]).defaultTo('pending');
    table.decimal('subtotal', 12, 2).notNullable();
    table.decimal('tax_amount', 12, 2).defaultTo(0);
    table.decimal('shipping_amount', 12, 2).defaultTo(0);
    table.decimal('discount_amount', 12, 2).defaultTo(0);
    table.decimal('total', 12, 2).notNullable();
    table.string('currency', 3).defaultTo('GEL');
    table.string('payment_method', 50).nullable();
    table.enum('payment_status', ['pending', 'processing', 'completed', 'failed', 'refunded']).defaultTo('pending');
    table.string('transaction_id', 200).nullable();
    table.string('coupon_code', 50).nullable();
    table.text('notes').nullable();
    table.timestamps(true, true);

    table.index('order_number');
    table.index('customer_id');
    table.index('status');
    table.index('payment_status');
    table.index('created_at');
  });

  // ─── Order Items ─────────────────────────────────
  await knex.schema.createTable('order_items', (table) => {
    table.uuid('id').primary();
    table.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE');
    table.uuid('product_id').nullable().references('id').inTable('products').onDelete('SET NULL');
    table.uuid('variant_id').nullable().references('id').inTable('product_variants').onDelete('SET NULL');
    table.string('name', 500).notNullable();
    table.string('sku', 100).nullable();
    table.decimal('price', 12, 2).notNullable();
    table.integer('quantity').notNullable();
    table.decimal('total', 12, 2).notNullable();

    table.index('order_id');
  });

  // ─── Order Addresses ─────────────────────────────
  await knex.schema.createTable('order_addresses', (table) => {
    table.uuid('id').primary();
    table.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE');
    table.enum('type', ['shipping', 'billing']).notNullable();
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('address_line1', 500).notNullable();
    table.string('address_line2', 500).nullable();
    table.string('city', 100).notNullable();
    table.string('state', 100).nullable();
    table.string('postal_code', 20).nullable();
    table.string('country', 100).notNullable();
    table.string('phone', 20).nullable();

    table.index('order_id');
  });

  // ─── Order Status History ────────────────────────
  await knex.schema.createTable('order_status_history', (table) => {
    table.uuid('id').primary();
    table.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE');
    table.string('status', 30).notNullable();
    table.string('note', 500).nullable();
    table.uuid('changed_by').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('order_id');
  });

  // ─── Discounts ───────────────────────────────────
  await knex.schema.createTable('discounts', (table) => {
    table.uuid('id').primary();
    table.string('name', 200).notNullable();
    table.string('code', 50).nullable().unique();
    table.enum('type', ['percentage', 'fixed', 'free_shipping']).notNullable();
    table.decimal('value', 12, 2).notNullable();
    table.decimal('minimum_order_amount', 12, 2).defaultTo(0);
    table.decimal('maximum_discount_amount', 12, 2).nullable();
    table.integer('usage_limit').nullable();
    table.integer('usage_count').defaultTo(0);
    table.integer('per_customer_limit').nullable();
    table.enum('applies_to', ['all', 'specific_products', 'specific_categories']).defaultTo('all');
    table.jsonb('applicable_ids').nullable();
    table.boolean('is_automatic').defaultTo(false);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('starts_at').notNullable();
    table.timestamp('ends_at').nullable();
    table.timestamps(true, true);

    table.index('code');
    table.index('is_active');
  });

  // ─── Wishlists ───────────────────────────────────
  await knex.schema.createTable('wishlists', (table) => {
    table.uuid('id').primary();
    table.uuid('customer_id').notNullable().references('id').inTable('customers').onDelete('CASCADE');
    table.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.unique(['customer_id', 'product_id']);
  });

  // ─── Shipping Zones ─────────────────────────────
  await knex.schema.createTable('shipping_zones', (table) => {
    table.uuid('id').primary();
    table.string('name', 200).notNullable();
    table.string('country', 100).defaultTo('*');
    table.jsonb('regions').defaultTo('[]');
    table.decimal('flat_rate', 12, 2).defaultTo(0);
    table.decimal('free_shipping_threshold', 12, 2).nullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // ─── Settings ────────────────────────────────────
  await knex.schema.createTable('settings', (table) => {
    table.string('key', 100).primary();
    table.text('value').notNullable();
    table.string('type', 20).defaultTo('string'); // string, number, boolean, json
    table.string('group', 50).defaultTo('general');
    table.string('label', 200).nullable();
    table.timestamps(true, true);

    table.index('group');
  });

  // ─── Order Counter ──────────────────────────────
  await knex.schema.createTable('order_counter', (table) => {
    table.increments('id');
  });
};

exports.down = async function (knex) {
  const tables = [
    'order_counter', 'settings', 'shipping_zones', 'wishlists',
    'discounts', 'order_status_history', 'order_addresses',
    'order_items', 'orders', 'cart_items', 'carts',
    'product_images', 'media', 'product_attributes',
    'product_variants', 'product_categories', 'products',
    'categories', 'customer_addresses', 'customers',
    'refresh_tokens', 'admin_users',
  ];

  for (const table of tables) {
    await knex.schema.dropTableIfExists(table);
  }

  await knex.raw('DROP SEQUENCE IF EXISTS order_counter_seq');
};
