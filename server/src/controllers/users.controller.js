const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.listStaff = async (req, res) => {
  const items = await User.find({ role:'staff' }).select('-password').sort({ createdAt:-1 });
  res.json({ items });
};

exports.createStaff = async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ message:'Missing fields' });
  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists) return res.status(400).json({ message:'Email already used' });
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email:String(email).toLowerCase(), password:hash, role:'staff' });
  const safe = user.toObject(); delete safe.password;
  res.json({ user:safe });
};
