// server/routes/products.routes.js
const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const allowRoles = require('../middleware/allowRoles');
const Products = require('../controllers/products.controller');

/**
 * --- Image URL sanitize helpers ---
 * Rules:
 *  - Disallow: blob:/data: URLs (local preview; never save)
 *  - Allow: http(s)://... OR /uploads/...
 *  - If relative /uploads/..., convert to absolute using API_PUBLIC_URL
 *  - De-duplicate (case-insensitive)
 */
const ABS_BASE = (process.env.API_PUBLIC_URL || '').replace(/\/+$/, '');
const isBlobOrData = (u = '') => /^blob:|^data:/i.test(u);
const isHttpHttps = (u = '') => /^https?:\/\//i.test(u);
const isUploadsRel = (u = '') => typeof u === 'string' && u.startsWith('/uploads/');
const toAbs = (u = '') => (isUploadsRel(u) && ABS_BASE ? `${ABS_BASE}${u}` : u);

const sanitizeImages = (arr = []) => {
  const out = [];
  const seen = new Set();
  for (let u of arr) {
    if (typeof u !== 'string') continue;
    u = u.trim();
    if (!u || isBlobOrData(u)) continue;         // drop blob/data
    const abs = toAbs(u);
    if (!isHttpHttps(abs) && !isUploadsRel(u)) continue; // invalid form
    const key = abs.toLowerCase();
    if (seen.has(key)) continue;                 // de-dup
    seen.add(key);
    out.push(abs);
  }
  return out;
};

// Middleware: clean req.body.images for create/update
const sanitizeImagesMw = (req, _res, next) => {
  try {
    const body = req.body || {};
    if (Array.isArray(body.images)) {
      body.images = sanitizeImages(body.images);
    } else if (body.images == null) {
      // ignore if not sent
    } else if (typeof body.images === 'string') {
      // single string support -> array
      body.images = sanitizeImages([body.images]);
    } else {
      // unknown type -> drop
      body.images = [];
    }
    req.body = body;
    next();
  } catch (err) {
    next(err);
  }
};

/* ---------- Routes ---------- */
router.get('/', requireAuth, Products.list);
router.get('/:id', requireAuth, Products.getOne);

router.post('/', requireAuth, allowRoles('admin'), sanitizeImagesMw, Products.create);
router.put('/:id', requireAuth, allowRoles('admin'), sanitizeImagesMw, Products.update);
router.delete('/:id', requireAuth, allowRoles('admin'), Products.remove);

module.exports = router;
