const router = require('express').Router();
const multer = require('multer');
const controller = require('./media.controller');
const { authenticate, authorize } = require('../../core/middleware/auth');
const config = require('../../../config/default');

// Configure multer with security restrictions
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.upload.maxFileSize,
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

// All media routes require admin auth
router.get('/', authenticate, authorize('shop_manager', 'content_editor'), controller.list);
router.get('/:id', authenticate, authorize('shop_manager', 'content_editor'), controller.getById);
router.post('/',
  authenticate,
  authorize('shop_manager', 'content_editor'),
  upload.array('files', 10),
  controller.upload
);
router.delete('/:id', authenticate, authorize('shop_manager'), controller.delete);

module.exports = router;
