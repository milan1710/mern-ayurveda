const Product = require('../models/Product');
const mongoose = require('mongoose');

// List products
exports.list = async (req, res) => {
  try {
    const { q = '', page = 1, limit = 10 } = req.query;
    let where = {};

    // Search filter
    if (q) {
      where.$or = [
        { name: { $regex: q, $options: 'i' } },
        { sku: { $regex: q, $options: 'i' } },
      ];
    }

    // Role based access
    if (req.user.role === 'admin') {
      where = {};
      if (q) {
        where.$or = [
          { name: { $regex: q, $options: 'i' } },
          { sku: { $regex: q, $options: 'i' } },
        ];
      }
    } else if (req.user.role === 'sub_admin') {
      where.$or = [
        { createdBy: req.user._id },
        { assignedTo: req.user._id },
        { createdByRole: 'staff', assignedTo: req.user._id }
      ];
    } else if (req.user.role === 'staff') {
      where.assignedTo = req.user._id;
    }

    const pg = Math.max(1, Number(page) || 1);
    const lm = Math.max(1, Math.min(100, Number(limit) || 10));

    const [items, total] = await Promise.all([
      Product.find(where)
        .populate('category')
        .populate('collection')
        .populate('assignedTo', 'name email role')
        .sort({ createdAt: -1 })
        .skip((pg - 1) * lm)
        .limit(lm),
      Product.countDocuments(where),
    ]);

    res.json({ items, page: pg, pages: Math.max(1, Math.ceil(total / lm)), total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};

// Get single product
exports.getOne = async (req, res) => {
  try {
    const p = await Product.findById(req.params.id)
      .populate('category')
      .populate('collection')
      .populate('assignedTo', 'name email role');
    if (!p) return res.status(404).json({ message: 'Not found' });
    res.json({ product: p });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Fetch failed' });
  }
};

// Create product
exports.create = async (req, res) => {
  try {
    const body = req.body || {};

    // ✅ assignedTo सिर्फ़ तभी set होगा जब दिया गया हो
    let assignedTo = null;
    if (body.assignedTo && mongoose.Types.ObjectId.isValid(body.assignedTo)) {
      assignedTo = body.assignedTo;
    }

    const doc = await Product.create({
      name: body.name,
      sku: body.sku,
      price: Number(body.price) || 0,
      oldPrice: body.oldPrice ? Number(body.oldPrice) : null,
      stock: Number(body.stock) || 0,
      description: body.description || '',
      images: Array.isArray(body.images) ? body.images : [],
      featured: Boolean(body.featured),
      category: body.category && body.category !== 'none' ? body.category : null,
      collection: body.collection && body.collection !== 'none' ? body.collection : null,
      createdBy: req.user._id,
      createdByRole: req.user.role,
      assignedTo,   // ✅ अब सही तरीके से save होगा
    });

    res.json({ product: doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Create product failed' });
  }
};

// Update product
exports.update = async (req, res) => {
  try {
    const body = req.body || {};
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Not found' });

    p.name = body.name ?? p.name;
    p.sku = body.sku ?? p.sku;
    if (body.price !== undefined) p.price = Number(body.price) || 0;
    if (body.oldPrice !== undefined) p.oldPrice = body.oldPrice === '' ? null : Number(body.oldPrice);
    if (body.stock !== undefined) p.stock = Number(body.stock) || 0;
    p.description = body.description ?? p.description;
    if (Array.isArray(body.images)) p.images = body.images;
    if (body.featured !== undefined) p.featured = Boolean(body.featured);
    p.category = body.category && body.category !== 'none' ? body.category : null;
    p.collection = body.collection && body.collection !== 'none' ? body.collection : null;

    // ✅ assignedTo update या unassign
    if (body.assignedTo && mongoose.Types.ObjectId.isValid(body.assignedTo)) {
      p.assignedTo = body.assignedTo;
    } else if (body.assignedTo === null || body.assignedTo === '') {
      p.assignedTo = null; // unassign
    }

    await p.save();

    res.json({ product: p });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Update failed' });
  }
};

// Delete product
exports.remove = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Delete failed' });
  }
};
