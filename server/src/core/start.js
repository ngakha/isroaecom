const app = require('./app');
const config = require('../../config/default');
const { testConnection } = require('./database');

async function start() {
  try {
    await testConnection();

    app.listen(config.app.port, () => {
      console.log('═══════════════════════════════════════════');
      console.log(`  PRShark Ecommerce Engine`);
      console.log(`  Environment: ${config.app.env}`);
      console.log(`  Server:      ${config.app.url}`);
      console.log(`  Admin:       ${config.app.adminUrl}`);
      console.log('═══════════════════════════════════════════');
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

start();
