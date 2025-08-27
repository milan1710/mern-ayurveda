require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../src/models/User');

(async ()=>{
  try{
    await mongoose.connect(process.env.MONGO_URI);
    const email = process.env.ADMIN_DEFAULT_EMAIL;
    const password = process.env.ADMIN_DEFAULT_PASSWORD;
    const name = process.env.ADMIN_DEFAULT_NAME || 'Admin';

    if(!email || !password) throw new Error('Set ADMIN_DEFAULT_EMAIL & ADMIN_DEFAULT_PASSWORD in .env');

    let u = await User.findOne({ email });
    if(!u){
      const hash = await bcrypt.hash(password, 10);
      u = await User.create({ name, email, password: hash, role:'admin' });
      console.log('Created admin:', email);
    }else{
      console.log('Admin exists:', email);
    }
    process.exit(0);
  }catch(e){
    console.error(e);
    process.exit(1);
  }
})();
