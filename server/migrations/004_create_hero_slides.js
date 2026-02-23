exports.up = async function (knex) {
  await knex.schema.createTable('hero_slides', (table) => {
    table.uuid('id').primary();
    table.string('title', 500).nullable();
    table.string('subtitle', 1000).nullable();
    table.string('button_text', 200).nullable();
    table.string('button_url', 500).nullable();
    table.string('image_url', 500).nullable();
    table.string('thumbnail_url', 500).nullable();
    table.uuid('media_id').nullable().references('id').inTable('media').onDelete('SET NULL');
    table.integer('sort_order').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);

    table.index('sort_order');
    table.index('is_active');
  });

  const exists = await knex('settings').where({ key: 'hero_mode' }).first();
  if (!exists) {
    await knex('settings').insert({
      key: 'hero_mode',
      value: 'carousel',
      type: 'string',
      group: 'store',
      label: 'Hero Mode',
      created_at: new Date(),
      updated_at: new Date(),
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('hero_slides');
  await knex('settings').where({ key: 'hero_mode' }).del();
};
