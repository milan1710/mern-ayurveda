const Product = require('../models/Product');
const Order = require('../models/Order');

exports.publicProducts = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '20', 10)));
    const featured = String(req.query.featured||'').toLowerCase()==='true';

    const filter = {};
    if (q) filter.name = { $regex: q, $options: 'i' };
    if (featured) filter.featured = true;

    const items = await Product.find(filter)
      .select('name price oldPrice images featured')
      .sort({ createdAt:-1 })
      .limit(limit)
      .lean();

    res.json({ items });
  } catch (e) { next(e); }
};

exports.publicProductById = async (req, res, next) => {
  try {
    const p = await Product.findById(req.params.id).lean();
    if (!p) return res.status(404).json({ message: 'Not found' });
    res.json({ product: p });
  } catch (e) { next(e); }
};

exports.placeOrder = async (req, res, next) => {
  try {
    const { items, info } = req.body || {};
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: 'No items' });
    if (!info || !info.name || !info.phone || !info.address) return res.status(400).json({ message: 'Missing info' });

    const doc = await Order.create({
      items: items.map(it=>({ product: it.product, qty: Number(it.qty||1) })),
      info,
      status: 'placed',
      assignedTo: null
    });

    res.status(201).json({ ok: true, id: doc._id });
  } catch (e) { next(e); }
};
