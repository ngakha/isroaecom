exports.up = async (knex) => {
  await knex.schema.alterTable('product_variants', (table) => {
    table.uuid('image_id').nullable().references('id').inTable('product_images').onDelete('SET NULL');
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable('product_variants', (table) => {
    table.dropColumn('image_id');
  });
};
