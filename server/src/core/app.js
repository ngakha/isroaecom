const express = require('express');
const morgan = require('morgan');
const path = require('path');
const config = require('../../config/default');
const { testConnection } = require('./database');
const AutoRouter = require('./router');
const { helmetMiddleware, corsMiddleware, rateLimitMiddleware } = require('./middleware/security');
const { sanitize } = require('./middleware/validate');
const { errorHandler, notFoundHandler } = require('./middleware/error-handler');
const PluginManager = require('../plugins/plugin-manager');

const app = express();

// ─── Security Middleware ───────────────────────────
app.use(helmetMiddleware());
app.use(corsMiddleware());
app.use(rateLimitMiddleware());

// ─── Body Parsing ──────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── XSS Sanitization ─────────────────────────────
app.use(sanitize);

// ─── Request Logging ───────────────────────────────
if (config.app.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ─── Static Files (uploads) ────────────────────────
app.use('/uploads', express.static(path.resolve(config.upload.dir)));

// ─── Health Check ──────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── Load Plugins ──────────────────────────────────
const pluginManager = new PluginManager();
pluginManager.loadAll();

// ─── Auto-load Module Routes ───────────────────────
const autoRouter = new AutoRouter(app);
autoRouter.loadModules();

// ─── 404 & Error Handling ──────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start Server ──────────────────────────────────
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

module.exports = app;
