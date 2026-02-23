const express = require('express');
const morgan = require('morgan');
const path = require('path');
const config = require('../../config/default');
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

// ─── DB Health Check (diagnostic) ──────────────────
app.get('/api/health/db', async (req, res) => {
  try {
    const { getDatabase } = require('./database');
    const db = getDatabase();
    await db.raw('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      db: 'failed',
      message: error.message,
      code: error.code,
      host: process.env.DB_HOST || 'not set',
      port: process.env.DB_PORT || 'not set',
      dbName: process.env.DB_NAME || 'not set',
    });
  }
});

// ─── Load Plugins ──────────────────────────────────
const pluginManager = new PluginManager();
pluginManager.loadAll();

// ─── Auto-load Module Routes ───────────────────────
const autoRouter = new AutoRouter(app);
autoRouter.loadModules();

// ─── Serve Built Frontends in Production ───────────
if (config.app.env === 'production') {
  const adminBuildPath = path.resolve(__dirname, '../../../admin/dist');
  app.use('/admin', express.static(adminBuildPath));
  app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(adminBuildPath, 'index.html'));
  });

  const storefrontBuildPath = path.resolve(__dirname, '../../../storefront/dist');
  app.use(express.static(storefrontBuildPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(storefrontBuildPath, 'index.html'));
  });
}

// ─── 404 & Error Handling ──────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
