exports.up = async (knex) => {
  await knex.schema.alterTable('products', (table) => {
    table.uuid('variant_group_id').nullable();
    table.index('variant_group_id');
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable('products', (table) => {
    table.dropIndex('variant_group_id');
    table.dropColumn('variant_group_id');
  });
};
