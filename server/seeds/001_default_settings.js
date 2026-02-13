const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');

exports.seed = async function (knex) {
  // ─── Default Settings ────────────────────────────
  await knex('settings').del();
  await knex('settings').insert([
    // Store
    { key: 'store_name', value: 'My Store', type: 'string', group: 'store', label: 'Store Name' },
    { key: 'store_description', value: 'An awesome ecommerce store', type: 'string', group: 'store', label: 'Store Description' },
    { key: 'store_currency', value: 'GEL', type: 'string', group: 'store', label: 'Currency' },
    { key: 'store_language', value: 'ka', type: 'string', group: 'store', label: 'Language' },
    { key: 'store_email', value: 'info@mystore.com', type: 'string', group: 'store', label: 'Contact Email' },
    { key: 'store_phone', value: '', type: 'string', group: 'store', label: 'Contact Phone' },
    { key: 'store_address', value: '', type: 'string', group: 'store', label: 'Store Address' },

    // Tax
    { key: 'tax_enabled', value: 'true', type: 'boolean', group: 'tax', label: 'Enable Tax' },
    { key: 'tax_rate', value: '18', type: 'number', group: 'tax', label: 'Default Tax Rate (%)' },
    { key: 'tax_included_in_price', value: 'true', type: 'boolean', group: 'tax', label: 'Tax Included in Price' },

    // Orders
    { key: 'order_confirmation_email', value: 'true', type: 'boolean', group: 'orders', label: 'Send Order Confirmation Email' },
    { key: 'low_stock_notification', value: 'true', type: 'boolean', group: 'orders', label: 'Low Stock Notification' },

    // Checkout
    { key: 'guest_checkout', value: 'true', type: 'boolean', group: 'checkout', label: 'Allow Guest Checkout' },
    { key: 'minimum_order_amount', value: '0', type: 'number', group: 'checkout', label: 'Minimum Order Amount' },
  ]);

  // ─── Default Super Admin ─────────────────────────
  await knex('admin_users').del();
  const hashedPassword = await bcrypt.hash('admin123', 12);
  await knex('admin_users').insert({
    id: uuid(),
    email: 'admin@prshark.com',
    password: hashedPassword,
    first_name: 'Super',
    last_name: 'Admin',
    role: 'super_admin',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  });

  // ─── Default Shipping Zone ───────────────────────
  await knex('shipping_zones').del();
  await knex('shipping_zones').insert([
    {
      id: uuid(),
      name: 'Georgia',
      country: 'Georgia',
      regions: JSON.stringify(['Tbilisi', 'Batumi', 'Kutaisi']),
      flat_rate: 5.00,
      free_shipping_threshold: 100.00,
      is_active: true,
      created_at: new Date(),
    },
    {
      id: uuid(),
      name: 'International',
      country: '*',
      regions: JSON.stringify([]),
      flat_rate: 25.00,
      free_shipping_threshold: null,
      is_active: true,
      created_at: new Date(),
    },
  ]);

  // ─── Sample Categories ───────────────────────────
  await knex('categories').del();
  const electronicsId = uuid();
  const clothingId = uuid();

  await knex('categories').insert([
    {
      id: electronicsId,
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and gadgets',
      parent_id: null,
      sort_order: 1,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuid(),
      name: 'Smartphones',
      slug: 'smartphones',
      description: 'Mobile phones',
      parent_id: electronicsId,
      sort_order: 1,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: clothingId,
      name: 'Clothing',
      slug: 'clothing',
      description: 'Apparel and fashion',
      parent_id: null,
      sort_order: 2,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);

  console.log('Seed data inserted successfully');
  console.log('Default admin: admin@prshark.com / admin123');
};
