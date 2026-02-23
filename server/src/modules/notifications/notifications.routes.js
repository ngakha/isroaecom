const router = require('express').Router();
const jwt = require('jsonwebtoken');
const config = require('../../../config/default');
const eventBus = require('../../core/events');

// SSE stream for admin real-time notifications
router.get('/stream', (req, res) => {
  const token = req.query.token;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, config.security.jwt.secret);
    if (!['super_admin', 'shop_manager'].includes(decoded.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Heartbeat every 30s to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  // Push notification events to this client
  const onNotification = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  eventBus.on('notification', onNotification);

  // Clean up on disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    eventBus.off('notification', onNotification);
  });
});

module.exports = router;
