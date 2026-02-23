exports.up = async function (knex) {
  await knex.schema.alterTable('orders', (table) => {
    table.boolean('is_archived').defaultTo(false);
    table.index('is_archived');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('orders', (table) => {
    table.dropIndex('is_archived');
    table.dropColumn('is_archived');
  });
};
