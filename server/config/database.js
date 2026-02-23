require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

module.exports = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || 'prshark_ecommerce',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false,
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: require('path').resolve(__dirname, '../migrations'),
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: require('path').resolve(__dirname, '../seeds'),
  },
};
