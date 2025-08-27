const mongoose = require('mongoose');

module.exports = async function connectDB(uri){
  if(!uri) {
    console.error('MONGO_URI missing in .env');
    process.exit(1);
  }
  mongoose.set('strictQuery', false);
  await mongoose.connect(uri);
  console.log('✅ MongoDB connected');
};
