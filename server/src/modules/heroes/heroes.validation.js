const Joi = require('joi');

const createSlide = Joi.object({
  title: Joi.string().allow('', null).max(500).optional(),
  subtitle: Joi.string().allow('', null).max(1000).optional(),
  buttonText: Joi.string().allow('', null).max(200).optional(),
  buttonUrl: Joi.string().allow('', null).max(500).optional(),
  mediaId: Joi.string().uuid().allow(null).optional(),
  sortOrder: Joi.number().integer().min(0).optional(),
  isActive: Joi.boolean().optional(),
});

const updateSlide = createSlide;

const reorderSlides = Joi.object({
  slideIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

const updateMode = Joi.object({
  heroMode: Joi.string().valid('carousel', 'static').required(),
});

module.exports = {
  createSlide,
  updateSlide,
  reorderSlides,
  updateMode,
};
