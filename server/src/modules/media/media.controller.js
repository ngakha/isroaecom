const mediaService = require('./media.service');

class MediaController {
  async list(req, res, next) {
    try {
      const result = await mediaService.list(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async upload(req, res, next) {
    try {
      if (!req.file && !req.files?.length) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const folder = req.body.folder || '';

      if (req.files?.length) {
        const media = await mediaService.uploadMultiple(req.files, folder);
        res.status(201).json({ data: media });
      } else {
        const media = await mediaService.upload(req.file, folder);
        res.status(201).json({ data: media });
      }
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const media = await mediaService.findById(req.params.id);
      res.json({ data: media });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await mediaService.delete(req.params.id);
      res.json({ message: 'Media deleted' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MediaController();
