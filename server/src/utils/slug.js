const slugify = require('slugify');
const { getDatabase } = require('../core/database');

/**
 * Generate a unique slug for a given value and table
 */
async function generateUniqueSlug(value, table, existingId = null) {
  const db = getDatabase();
  let slug = slugify(value, { lower: true, strict: true });

  let query = db(table).where({ slug });
  if (existingId) {
    query = query.whereNot({ id: existingId });
  }

  const existing = await query.first();

  if (existing) {
    // Append a random suffix if slug exists
    const suffix = Date.now().toString(36);
    slug = `${slug}-${suffix}`;
  }

  return slug;
}

module.exports = { generateUniqueSlug };
