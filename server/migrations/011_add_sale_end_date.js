exports.up = async (knex) => {
  await knex.schema.alterTable('products', (table) => {
    table.timestamp('sale_end_date').nullable();
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable('products', (table) => {
    table.dropColumn('sale_end_date');
  });
};
