exports.up = async (knex) => {
  const exists = await knex('settings').where({ key: 'whatsapp_number' }).first();
  if (!exists) {
    await knex('settings').insert({
      key: 'whatsapp_number',
      value: '',
      type: 'string',
      group: 'store',
      label: 'WhatsApp Number',
      created_at: new Date(),
      updated_at: new Date(),
    });
  }
};

exports.down = async (knex) => {
  await knex('settings').where({ key: 'whatsapp_number' }).del();
};
