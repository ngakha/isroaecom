const settingsService = require('./settings.service');

class SettingsController {
  async getAll(req, res, next) {
    try {
      const settings = await settingsService.getAll();
      res.json({ data: settings });
    } catch (error) {
      next(error);
    }
  }

  async getByGroup(req, res, next) {
    try {
      const settings = await settingsService.getByGroup(req.params.group);
      res.json({ data: settings });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const settings = await settingsService.updateBatch(req.body);
      res.json({ data: settings });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SettingsController();
