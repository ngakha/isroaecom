const router = require('express').Router();
const { authenticate, authorize } = require('../../core/middleware/auth');
const { getDatabase } = require('../../core/database');

// Poll for new notifications since a given timestamp
router.get('/poll', authenticate, authorize('shop_manager'), async (req, res, next) => {
  try {
    const db = getDatabase();
    const since = req.query.since || new Date(Date.now() - 30000).toISOString();

    const notifications = [];

    // Check for new orders since last poll
    const newOrders = await db('orders')
      .where('created_at', '>', since)
      .orderBy('created_at', 'desc')
      .limit(10)
      .select('id', 'order_number', 'customer_name', 'total', 'currency', 'created_at');

    for (const order of newOrders) {
      notifications.push({
        type: 'new_order',
        orderNumber: order.order_number,
        customerName: order.customer_name,
        total: order.total,
        currency: order.currency,
        createdAt: order.created_at,
      });
    }

    // Check for new call requests since last poll
    const newCallRequests = await db('call_requests')
      .where('created_at', '>', since)
      .orderBy('created_at', 'desc')
      .limit(10)
      .select('id', 'customer_name', 'phone', 'product_name', 'created_at');

    for (const cr of newCallRequests) {
      notifications.push({
        type: 'new_call_request',
        customerName: cr.customer_name,
        phone: cr.phone,
        productName: cr.product_name,
        createdAt: cr.created_at,
      });
    }

    // Sort by createdAt desc
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ data: notifications, serverTime: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
