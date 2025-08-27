const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  try {
    const bearer = req.headers.authorization || '';
    const token = req.cookies?.token || (bearer.startsWith('Bearer ') ? bearer.slice(7) : null);
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role, name }
    next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};
