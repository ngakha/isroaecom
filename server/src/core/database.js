const knex = require('knex');
const dbConfig = require('../../config/database');

let db;

function getDatabase() {
  if (!db) {
    db = knex(dbConfig);
  }
  return db;
}

async function testConnection() {
  const database = getDatabase();
  try {
    await database.raw('SELECT 1');
    console.log('[Database] PostgreSQL connected successfully');
    return true;
  } catch (error) {
    console.error('[Database] Connection failed:', error.message);
    throw error;
  }
}

async function closeDatabase() {
  if (db) {
    await db.destroy();
    db = null;
  }
}

module.exports = { getDatabase, testConnection, closeDatabase };
