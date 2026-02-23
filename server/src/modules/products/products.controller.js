const productsService = require('./products.service');

class ProductsController {
  // ─── Products ────────────────────────────────────

  async list(req, res, next) {
    try {
      const result = await productsService.list(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async search(req, res, next) {
    try {
      const results = await productsService.search(req.query.q, parseInt(req.query.limit) || 6);
      res.json({ data: results });
    } catch (error) {
      next(error);
    }
  }

  async getRelated(req, res, next) {
    try {
      const related = await productsService.getRelated(req.params.id, parseInt(req.query.limit) || 4);
      res.json({ data: related });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const product = await productsService.findById(req.params.id);
      res.json({ data: product });
    } catch (error) {
      next(error);
    }
  }

  async getBySlug(req, res, next) {
    try {
      const product = await productsService.findBySlug(req.params.slug);
      res.json({ data: product });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const product = await productsService.create(req.body);
      res.status(201).json({ data: product });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const product = await productsService.update(req.params.id, req.body);
      res.json({ data: product });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await productsService.delete(req.params.id);
      res.json({ message: 'Product deleted' });
    } catch (error) {
      next(error);
    }
  }

  // ─── Variants ────────────────────────────────────

  async addVariant(req, res, next) {
    try {
      const variant = await productsService.addVariant(req.params.id, req.body);
      res.status(201).json({ data: variant });
    } catch (error) {
      next(error);
    }
  }

  async updateVariant(req, res, next) {
    try {
      const variant = await productsService.updateVariant(req.params.variantId, req.body);
      res.json({ data: variant });
    } catch (error) {
      next(error);
    }
  }

  async deleteVariant(req, res, next) {
    try {
      await productsService.deleteVariant(req.params.variantId);
      res.json({ message: 'Variant deleted' });
    } catch (error) {
      next(error);
    }
  }

  // ─── Images ─────────────────────────────────────

  async addImages(req, res, next) {
    try {
      const images = await productsService.addImages(req.params.id, req.body.mediaIds);
      res.status(201).json({ data: images });
    } catch (error) {
      next(error);
    }
  }

  async removeImage(req, res, next) {
    try {
      await productsService.removeImage(req.params.id, req.params.imageId);
      res.json({ message: 'Image removed' });
    } catch (error) {
      next(error);
    }
  }

  async reorderImages(req, res, next) {
    try {
      const images = await productsService.reorderImages(req.params.id, req.body.imageIds);
      res.json({ data: images });
    } catch (error) {
      next(error);
    }
  }

  // ─── Attributes ─────────────────────────────────

  async addAttribute(req, res, next) {
    try {
      const attribute = await productsService.addAttribute(req.params.id, req.body);
      res.status(201).json({ data: attribute });
    } catch (error) {
      next(error);
    }
  }

  async updateAttribute(req, res, next) {
    try {
      const attribute = await productsService.updateAttribute(req.params.attributeId, req.body);
      res.json({ data: attribute });
    } catch (error) {
      next(error);
    }
  }

  async deleteAttribute(req, res, next) {
    try {
      await productsService.deleteAttribute(req.params.attributeId);
      res.json({ message: 'Attribute deleted' });
    } catch (error) {
      next(error);
    }
  }

  // ─── Categories ──────────────────────────────────

  async listCategories(req, res, next) {
    try {
      const categories = await productsService.listCategories();
      res.json({ data: categories });
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req, res, next) {
    try {
      const category = await productsService.createCategory(req.body);
      res.status(201).json({ data: category });
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req, res, next) {
    try {
      const category = await productsService.updateCategory(req.params.id, req.body);
      res.json({ data: category });
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req, res, next) {
    try {
      await productsService.deleteCategory(req.params.id);
      res.json({ message: 'Category deleted' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductsController();
