const authService = require('./auth.service');

class AuthController {
  // ─── Admin Auth ──────────────────────────────────

  async adminRegister(req, res, next) {
    try {
      const user = await authService.registerAdmin(req.body);
      res.status(201).json({ data: user });
    } catch (error) {
      next(error);
    }
  }

  async adminLogin(req, res, next) {
    try {
      const result = await authService.loginAdmin(req.body);
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  // ─── Customer Auth ───────────────────────────────

  async customerRegister(req, res, next) {
    try {
      const result = await authService.registerCustomer(req.body);
      res.status(201).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async customerLogin(req, res, next) {
    try {
      const result = await authService.loginCustomer(req.body);
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  // ─── Shared ──────────────────────────────────────

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token required' });
      }
      const tokens = await authService.refreshToken(refreshToken);
      res.json({ data: tokens });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const isAdmin = ['super_admin', 'shop_manager', 'content_editor'].includes(req.user.role);
      await authService.changePassword(req.user.id, req.body, isAdmin);
      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  }

  async me(req, res) {
    res.json({ data: req.user });
  }
}

module.exports = new AuthController();
