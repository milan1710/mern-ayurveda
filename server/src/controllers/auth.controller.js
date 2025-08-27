const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

function cookieOptions() {
  const ttlMin = Number(process.env.SESSION_TTL_MINUTES || 30);
  const secure = String(process.env.COOKIE_SECURE || 'false').toLowerCase() === 'true';
  return { httpOnly:true, sameSite:'lax', secure, maxAge: ttlMin*60*1000, path:'/' };
}

function signToken(user) {
  return jwt.sign({ id:user._id, role:user.role }, process.env.JWT_SECRET, {
    expiresIn: `${Number(process.env.SESSION_TTL_MINUTES || 30)}m`,
  });
}

exports.login = async (req, res) => {
  const { email, password } = req.body || {};
  if(!email || !password) return res.status(400).json({ message:'Email & password required' });

  const user = await User.findOne({ email: String(email).toLowerCase() });
  if(!user) return res.status(401).json({ message:'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.password);
  if(!ok) return res.status(401).json({ message:'Invalid credentials' });

  const token = signToken(user);
  res.cookie('token', token, cookieOptions());
  const safe = user.toObject(); delete safe.password;
  res.json({ user: safe });
};

exports.logout = async (_req, res) => {
  res.clearCookie('token', { path:'/' });
  res.json({ ok:true });
};

exports.me = async (req, res) => {
  if(!req.user) return res.status(401).json({ message:'Unauthorized' });
  res.json({ user:req.user });
};
