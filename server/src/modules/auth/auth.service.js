const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const { getDatabase } = require('../../core/database');
const config = require('../../../config/default');
const { AppError } = require('../../core/middleware/error-handler');
const { sendWelcomeEmail } = require('../../utils/mailer');

class AuthService {
  constructor() {
    this.db = () => getDatabase();
  }

  /**
   * Register a new admin user
   */
  async registerAdmin({ email, password, firstName, lastName, role = 'content_editor' }) {
    const db = this.db();
    const existing = await db('admin_users').where({ email }).first();
    if (existing) {
      throw new AppError('Email already registered', 409);
    }

    const hashedPassword = await bcrypt.hash(password, config.security.bcryptRounds);
    const id = uuid();

    const [user] = await db('admin_users')
      .insert({
        id,
        email,
        password: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        role,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning(['id', 'email', 'first_name', 'last_name', 'role']);

    return user;
  }

  /**
   * Admin login with lockout protection
   */
  async loginAdmin({ email, password }) {
    const db = this.db();
    const user = await db('admin_users').where({ email }).first();

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    if (!user.is_active) {
      throw new AppError('Account deactivated', 403);
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    await db('admin_users').where({ id: user.id }).update({
      last_login: new Date(),
    });

    const tokens = this.generateTokens(user);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
      ...tokens,
    };
  }

  /**
   * Register a storefront customer
   */
  async registerCustomer({ email, password, firstName, lastName, phone }) {
    const db = this.db();
    const existing = await db('customers').where({ email }).first();
    if (existing) {
      throw new AppError('Email already registered', 409);
    }

    const hashedPassword = await bcrypt.hash(password, config.security.bcryptRounds);
    const id = uuid();

    const [customer] = await db('customers')
      .insert({
        id,
        email,
        password: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning(['id', 'email', 'first_name', 'last_name', 'phone']);

    const tokens = this.generateTokens({ ...customer, role: 'customer' });
    await this.storeRefreshToken(id, tokens.refreshToken);

    // Send welcome email (non-blocking)
    sendWelcomeEmail({ email, firstName }).catch(() => {});

    return { customer, ...tokens };
  }

  /**
   * Customer login
   */
  async loginCustomer({ email, password }) {
    const db = this.db();
    const customer = await db('customers').where({ email }).first();

    if (!customer) {
      throw new AppError('Invalid credentials', 401);
    }

    if (!customer.is_active) {
      throw new AppError('Account deactivated', 403);
    }

    const validPassword = await bcrypt.compare(password, customer.password);
    if (!validPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    await db('customers').where({ id: customer.id }).update({ last_login: new Date() });

    const tokens = this.generateTokens({ ...customer, role: 'customer' });
    await this.storeRefreshToken(customer.id, tokens.refreshToken);

    return {
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
      },
      ...tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.security.jwt.refreshSecret);
      const db = this.db();

      const stored = await db('refresh_tokens')
        .where({ token: refreshToken, user_id: decoded.id, revoked: false })
        .first();

      if (!stored) {
        throw new AppError('Invalid refresh token', 401);
      }

      // Revoke old token
      await db('refresh_tokens').where({ id: stored.id }).update({ revoked: true });

      // Generate new tokens
      const tokens = this.generateTokens(decoded);
      await this.storeRefreshToken(decoded.id, tokens.refreshToken);

      return tokens;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Invalid refresh token', 401);
    }
  }

  /**
   * Logout - revoke refresh token
   */
  async logout(refreshToken) {
    const db = this.db();
    await db('refresh_tokens').where({ token: refreshToken }).update({ revoked: true });
  }

  /**
   * Change password
   */
  async changePassword(userId, { currentPassword, newPassword }, isAdmin = false) {
    const db = this.db();
    const table = isAdmin ? 'admin_users' : 'customers';
    const user = await db(table).where({ id: userId }).first();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      throw new AppError('Current password is incorrect', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, config.security.bcryptRounds);
    await db(table).where({ id: userId }).update({
      password: hashedPassword,
      updated_at: new Date(),
    });

    // Revoke all refresh tokens for this user
    await db('refresh_tokens').where({ user_id: userId }).update({ revoked: true });
  }

  // ─── Admin Users Management ────────────────────────

  async listAdmins() {
    const db = this.db();
    return db('admin_users')
      .select('id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'last_login', 'created_at')
      .orderBy('created_at', 'desc');
  }

  async updateAdmin(id, data) {
    const db = this.db();
    const updateData = { updated_at: new Date() };

    if (data.firstName !== undefined) updateData.first_name = data.firstName;
    if (data.lastName !== undefined) updateData.last_name = data.lastName;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    const [user] = await db('admin_users')
      .where({ id })
      .update(updateData)
      .returning(['id', 'email', 'first_name', 'last_name', 'role', 'is_active']);

    if (!user) throw new AppError('Admin user not found', 404);
    return user;
  }

  async deleteAdmin(id) {
    const db = this.db();
    await db('refresh_tokens').where({ user_id: id }).update({ revoked: true });
    const deleted = await db('admin_users').where({ id }).del();
    if (!deleted) throw new AppError('Admin user not found', 404);
  }

  // ─── Private Helpers ─────────────────────────────

  generateTokens(user) {
    const payload = { id: user.id, email: user.email, role: user.role };

    const accessToken = jwt.sign(payload, config.security.jwt.secret, {
      expiresIn: config.security.jwt.expiresIn,
    });

    const refreshToken = jwt.sign(payload, config.security.jwt.refreshSecret, {
      expiresIn: config.security.jwt.refreshExpiresIn,
    });

    return { accessToken, refreshToken };
  }

  async storeRefreshToken(userId, token) {
    const db = this.db();
    await db('refresh_tokens').insert({
      id: uuid(),
      user_id: userId,
      token,
      revoked: false,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      created_at: new Date(),
    });
  }
}

module.exports = new AuthService();
