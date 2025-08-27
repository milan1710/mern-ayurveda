require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const r1 = await Product.updateMany({ category: { $type: 'string' } },   { $set: { category: null } });
    const r2 = await Product.updateMany({ collection: { $type: 'string' } }, { $set: { collection: null } });
    console.log('Updated docs:', r1.modifiedCount, r2.modifiedCount);
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
})();
