/**
 * Drop unused order_counter table
 * The orders.service.js uses PostgreSQL sequence (order_counter_seq) directly,
 * so this table is never read or written to.
 */
exports.up = async function (knex) {
  await knex.schema.dropTableIfExists('order_counter');
};

exports.down = async function (knex) {
  await knex.schema.createTable('order_counter', (table) => {
    table.increments('id');
  });
};
