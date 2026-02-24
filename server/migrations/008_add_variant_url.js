exports.up = async (knex) => {
  await knex.schema.alterTable('product_variants', (table) => {
    table.string('url', 500).nullable();
    table.dropColumn('image_id');
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable('product_variants', (table) => {
    table.dropColumn('url');
    table.uuid('image_id').nullable().references('id').inTable('product_images').onDelete('SET NULL');
  });
};
