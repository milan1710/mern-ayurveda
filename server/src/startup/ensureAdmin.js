// server/src/startup/ensureAdmin.js
const User = require('../models/User');

module.exports = async function ensureAdmin(){
  const email = (process.env.ADMIN_DEFAULT_EMAIL || '').toLowerCase().trim();
  const password = process.env.ADMIN_DEFAULT_PASSWORD || '';
  const name = process.env.ADMIN_DEFAULT_NAME || 'Admin';

  if (!email || !password) {
    console.warn('⚠️ ADMIN_DEFAULT_* env not set — skipping ensureAdmin()');
    return;
  }

  let u = await User.findOne({ email });
  if (!u) {
    u = await User.create({ name, email, password, role: 'admin' });
    console.log('👑 Created default admin:', email);
  } else if (u.role !== 'admin') {
    u.role = 'admin';
    await u.save();
    console.log('🔧 Updated user to admin:', email);
  } else {
    console.log('✅ Admin exists:', email);
  }
};
