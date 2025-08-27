const Collection = require('../models/Collection');

exports.list = async (_req, res) => {
  const items = await Collection.find().sort({ name:1 });
  res.json({ items });
};

exports.create = async (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ message:'Name required' });
  const doc = await Collection.create({ name });
  res.json({ collection: doc });
};

exports.update = async (req, res) => {
  const { name } = req.body || {};
  const doc = await Collection.findById(req.params.id);
  if (!doc) return res.status(404).json({ message:'Not found' });
  if (name) doc.name = name;
  await doc.save();
  res.json({ collection: doc });
};

exports.remove = async (req, res) => {
  await Collection.findByIdAndDelete(req.params.id);
  res.json({ ok:true });
};
