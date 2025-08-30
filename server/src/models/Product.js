const { Schema, model, Types } = require('mongoose');

const productSchema = new Schema({
  name: { type: String, required: true },
  sku: { type: String, unique: true, sparse: true },
  price: { type: Number, required: true },
  oldPrice: { type: Number, default: null },
  stock: { type: Number, default: 0 },
  description: { type: String, default: '' },
  images: [{ type: String }],
  featured: { type: Boolean, default: false },

  category: { type: Types.ObjectId, ref: 'Category', default: null },
  collection: { type: Types.ObjectId, ref: 'Collection', default: null },

  // ✅ New fields
  createdBy: { type: Types.ObjectId, ref: 'User', required: true },
  createdByRole: { type: String, enum: ['admin', 'sub_admin', 'staff'], required: true },
  assignedTo: { type: Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = model('Product', productSchema);
