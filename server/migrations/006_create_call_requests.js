exports.up = async function (knex) {
  await knex.schema.createTable('call_requests', (table) => {
    table.uuid('id').primary();
    table.string('customer_name', 200).notNullable();
    table.string('phone', 50).notNullable();
    table.uuid('product_id').nullable().references('id').inTable('products').onDelete('SET NULL');
    table.string('product_name', 500).nullable();
    table.text('message').nullable();
    table.string('status', 20).defaultTo('new');
    table.timestamps(true, true);
    table.index('status');
    table.index('created_at');
  });

  const exists = await knex('settings').where({ key: 'call_request_mode' }).first();
  if (!exists) {
    await knex('settings').insert({
      key: 'call_request_mode',
      value: 'false',
      type: 'boolean',
      group: 'store',
      label: 'Call Request Mode',
      created_at: new Date(),
      updated_at: new Date(),
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('call_requests');
  await knex('settings').where({ key: 'call_request_mode' }).del();
};
