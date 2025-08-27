const jwt = require('jsonwebtoken');

const TTL_MIN = Number(process.env.SESSION_TTL_MINUTES || 30);

exports.signToken = (userId) => {
  return jwt.sign({ uid: userId }, process.env.JWT_SECRET, {
    expiresIn: `${TTL_MIN}m`
  });
};

exports.cookieOpts = {
  httpOnly: true,
  secure: String(process.env.COOKIE_SECURE).toLowerCase() === 'true',
  sameSite: 'lax',
  maxAge: TTL_MIN * 60 * 1000,
  path: '/',  // ensure wide scope
};
