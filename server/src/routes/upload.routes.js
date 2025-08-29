const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const requireAuth = require('../middleware/requireAuth');
const allowRoles = require('../middleware/allowRoles');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  }
});

const fileFilter = (_req, file, cb) => {
  if (!/^image\/(png|jpe?g|webp|gif|avif)$/i.test(file.mimetype)) {
    return cb(new Error('Only image files are allowed'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// trailing slash hatao
const baseUrl = (process.env.API_PUBLIC_URL || '').replace(/\/+$/, '');

router.post(
  '/images',
  requireAuth,
  allowRoles('admin'),
  upload.array('files', 10),
  (req, res) => {
    const files = Array.isArray(req.files) ? req.files : [];
    if (files.length === 0) return res.status(400).json({ message: 'No files uploaded' });

    const urls = files.map(f => {
      const rel = `/uploads/${path.basename(f.path)}`;
      return baseUrl ? `${baseUrl}${rel}` : rel; // hamesha absolute prefer
    });

    res.status(201).json({ urls });
  }
);

module.exports = router;
