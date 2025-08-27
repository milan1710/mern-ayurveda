const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const requireAuth = require('../middleware/requireAuth');
const allowRoles = require('../middleware/allowRoles');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive:true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = Date.now() + '-' + Math.round(Math.random()*1e9);
    cb(null, base + ext);
  }
});
const upload = multer({ storage });

router.post('/images', requireAuth, allowRoles('admin'),
  upload.array('files', 10),
  (req, res) => {
    const urls = (req.files||[]).map(f => `/uploads/${path.basename(f.path)}`);
    res.json({ urls });
  }
);

module.exports = router;
