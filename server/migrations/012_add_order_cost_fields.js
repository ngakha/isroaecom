exports.up = async (knex) => {
  await knex.schema.alterTable('orders', (table) => {
    table.string('phone2', 20).nullable();
    table.string('payment_type', 30).nullable(); // on_delivery, warehouse_pickup, bank_transfer
  });

  await knex.schema.alterTable('order_items', (table) => {
    table.decimal('cost_price', 12, 2).nullable();
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable('orders', (table) => {
    table.dropColumn('phone2');
    table.dropColumn('payment_type');
  });

  await knex.schema.alterTable('order_items', (table) => {
    table.dropColumn('cost_price');
  });
};
