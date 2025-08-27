const Category = require('../models/Category');

exports.list = async (_req, res) => {
  const items = await Category.find().sort({ name:1 });
  res.json({ items });
};

exports.create = async (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ message:'Name required' });
  const doc = await Category.create({ name });
  res.json({ category: doc });
};

exports.update = async (req, res) => {
  const { name } = req.body || {};
  const doc = await Category.findById(req.params.id);
  if (!doc) return res.status(404).json({ message:'Not found' });
  if (name) doc.name = name;
  await doc.save();
  res.json({ category: doc });
};

exports.remove = async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ ok:true });
};
