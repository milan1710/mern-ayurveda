const router = require('express').Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');

// Public: List products (with optional featured/limit/q)
router.get('/products', async (req, res) => {
  const { featured, q='', limit=60 } = req.query;
  const where = {};
  if (featured === 'true') where.featured = true;
  if (q) where.name = { $regex:q, $options:'i' };
  const lm = Math.max(1, Math.min(100, Number(limit)||60));
  const items = await Product.find(where).sort({ createdAt:-1 }).limit(lm);
  res.json({ items });
});

// Public: product details
router.get('/products/:id', async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ message:'Not found' });
  res.json({ product:p });
});

// Public: categories
router.get('/categories', async (_req, res) => {
  const items = await Category.find().sort({ name:1 });
  res.json({ items });
});

// Public: create order (Buy Now) -> status 'new'
router.post('/orders', async (req, res) => {
  const { items=[], info={} } = req.body || {};
  if (!Array.isArray(items) || items.length===0) {
    return res.status(400).json({ message:'Items required' });
  }
  // Validate products
  for (const it of items) {
    const p = await Product.findById(it.product);
    if (!p) return res.status(400).json({ message:'Invalid product in items' });
  }
  const order = await Order.create({
    info: {
      name: info.name||'',
      phone: info.phone||'',
      address: info.address||'',
      city: info.city||'',
      state: info.state||'',
      pin: info.pin||'',
      paymentMethod: info.paymentMethod || 'COD',
    },
    status: 'new',
    items: items.map(it => ({ product: it.product, qty: Number(it.qty)||1 }))
  });
  res.json({ order });
});

module.exports = router;
