const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function requireAuth(req, res, next) {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization) {
      const [type, val] = String(req.headers.authorization).split(' ');
      if (type?.toLowerCase() === 'bearer') token = val;
    }
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select('-password');
    if (!user) return res.status(401).json({ message:'Unauthorized' });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message:'Unauthorized' });
  }
};
