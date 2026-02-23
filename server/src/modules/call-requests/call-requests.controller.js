const callRequestsService = require('./call-requests.service');
const settingsService = require('../settings/settings.service');

class CallRequestsController {
  async getMode(req, res, next) {
    try {
      const mode = await settingsService.get('call_request_mode');
      res.json({ data: { callRequestMode: mode === true || mode === 'true' } });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const request = await callRequestsService.create(req.body);
      res.status(201).json({ data: request });
    } catch (error) {
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const result = await callRequestsService.list(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await callRequestsService.getStats();
      res.json({ data: stats });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const request = await callRequestsService.findById(req.params.id);
      res.json({ data: request });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const request = await callRequestsService.updateStatus(req.params.id, req.body.status);
      res.json({ data: request });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await callRequestsService.delete(req.params.id);
      res.json({ message: 'Call request deleted' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CallRequestsController();
