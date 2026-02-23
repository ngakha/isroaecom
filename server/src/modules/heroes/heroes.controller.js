const heroesService = require('./heroes.service');
const settingsService = require('../settings/settings.service');

class HeroesController {
  async listPublic(req, res, next) {
    try {
      const [slides, heroMode] = await Promise.all([
        heroesService.listPublic(),
        settingsService.get('hero_mode'),
      ]);
      res.json({ data: { slides, heroMode: heroMode || 'carousel' } });
    } catch (error) {
      next(error);
    }
  }

  async listAll(req, res, next) {
    try {
      const slides = await heroesService.listAll();
      res.json({ data: slides });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const slide = await heroesService.findById(req.params.id);
      res.json({ data: slide });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const slide = await heroesService.create(req.body);
      res.status(201).json({ data: slide });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const slide = await heroesService.update(req.params.id, req.body);
      res.json({ data: slide });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await heroesService.delete(req.params.id);
      res.json({ message: 'Hero slide deleted' });
    } catch (error) {
      next(error);
    }
  }

  async reorder(req, res, next) {
    try {
      const slides = await heroesService.reorder(req.body.slideIds);
      res.json({ data: slides });
    } catch (error) {
      next(error);
    }
  }

  async getMode(req, res, next) {
    try {
      const heroMode = await settingsService.get('hero_mode');
      res.json({ data: { heroMode: heroMode || 'carousel' } });
    } catch (error) {
      next(error);
    }
  }

  async updateMode(req, res, next) {
    try {
      await settingsService.set('hero_mode', req.body.heroMode, 'store', 'string');
      res.json({ data: { heroMode: req.body.heroMode } });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new HeroesController();
