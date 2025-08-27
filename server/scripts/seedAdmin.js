require('dotenv').config();
const connectDB = require('../src/config/db');
const User = require('../src/models/User');

(async () => {
  await connectDB(process.env.MONGO_URI);
  const email = process.env.ADMIN_DEFAULT_EMAIL;
  let admin = await User.findOne({ email });
  if(admin){
    console.log('Admin already exists:', admin.email);
    process.exit(0);
  }
  admin = await User.create({
    name: process.env.ADMIN_DEFAULT_NAME || 'Admin',
    email,
    password: process.env.ADMIN_DEFAULT_PASSWORD,
    role: 'admin'
  });
  console.log('✅ Admin created:', admin.email);
  process.exit(0);
})();
