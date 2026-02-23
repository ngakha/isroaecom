exports.up = async function (knex) {
  await knex.schema.alterTable('products', (table) => {
    table.dropColumn('short_description');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('products', (table) => {
    table.string('short_description', 500).nullable();
  });
};
