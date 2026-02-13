const jwt = require('jsonwebtoken');
const config = require('../../../config/default');
const { getDatabase } = require('../database');

/**
 * JWT Authentication Middleware
 * Verifies the access token from Authorization header
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.security.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Optional Authentication
 * Doesn't fail if no token, but attaches user if present
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    req.user = jwt.verify(token, config.security.jwt.secret);
  } catch {
    req.user = null;
  }

  next();
}

/**
 * Role-Based Access Control (RBAC)
 * Restricts access to specific roles
 *
 * Roles hierarchy:
 * - super_admin: Full access to everything
 * - shop_manager: Manage products, orders, customers
 * - content_editor: Manage products and media only
 * - customer: Storefront access only
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Super admin bypasses all checks
    if (req.user.role === 'super_admin') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

/**
 * Resource ownership check
 * Ensures customers can only access their own resources
 */
function ownerOrAdmin(userIdParam = 'id') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const resourceUserId = req.params[userIdParam];
    const isOwner = req.user.id === resourceUserId;
    const isAdmin = ['super_admin', 'shop_manager'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  };
}

/**
 * Check if admin account is locked out
 */
async function checkAccountLockout(req, res, next) {
  const { email } = req.body;
  if (!email) return next();

  const db = getDatabase();

  try {
    const user = await db('admin_users').where({ email }).first();

    if (user && user.locked_until && new Date(user.locked_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      return res.status(423).json({
        error: `Account locked. Try again in ${minutesLeft} minutes.`,
        code: 'ACCOUNT_LOCKED',
      });
    }

    next();
  } catch {
    next();
  }
}

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  ownerOrAdmin,
  checkAccountLockout,
};
