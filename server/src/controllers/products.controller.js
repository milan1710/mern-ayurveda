const Product = require('../models/Product');

exports.list = async (req, res) => {
  const { q='', page=1, limit=10 } = req.query;
  const where = {};
  if (q) {
    where.$or = [
      { name: { $regex: q, $options:'i' } },
      { sku:  { $regex: q, $options:'i' } },
    ];
  }
  const pg = Math.max(1, Number(page)||1);
  const lm = Math.max(1, Math.min(100, Number(limit)||10));
  const [items, total] = await Promise.all([
    Product.find(where).populate('category').populate('collection').sort({createdAt:-1}).skip((pg-1)*lm).limit(lm),
    Product.countDocuments(where)
  ]);
  res.json({ items, page:pg, pages: Math.max(1, Math.ceil(total/lm)), total });
};

exports.getOne = async (req, res) => {
  const p = await Product.findById(req.params.id).populate('category').populate('collection');
  if (!p) return res.status(404).json({ message:'Not found' });
  res.json({ product: p });
};

exports.create = async (req, res) => {
  const body = req.body || {};
  const doc = await Product.create({
    name: body.name,
    sku: body.sku,
    price: Number(body.price)||0,
    oldPrice: body.oldPrice ? Number(body.oldPrice) : null,
    stock: Number(body.stock)||0,
    description: body.description || '',
    images: Array.isArray(body.images)? body.images : [],
    featured: Boolean(body.featured),
    category: body.category && body.category!=='none' ? body.category : null,
    collection: body.collection && body.collection!=='none' ? body.collection : null,
  });
  res.json({ product: doc });
};

exports.update = async (req, res) => {
  const body = req.body || {};
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ message:'Not found' });

  p.name = body.name ?? p.name;
  p.sku = body.sku ?? p.sku;
  if (body.price !== undefined) p.price = Number(body.price)||0;
  if (body.oldPrice !== undefined) p.oldPrice = body.oldPrice===''? null : Number(body.oldPrice);
  if (body.stock !== undefined) p.stock = Number(body.stock)||0;
  p.description = body.description ?? p.description;
  if (Array.isArray(body.images)) p.images = body.images;
  if (body.featured !== undefined) p.featured = Boolean(body.featured);
  p.category = body.category && body.category!=='none' ? body.category : null;
  p.collection = body.collection && body.collection!=='none' ? body.collection : null;

  await p.save();
  res.json({ product: p });
};

exports.remove = async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ ok:true });
};
