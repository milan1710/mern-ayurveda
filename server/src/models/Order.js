const { Schema, model, Types } = require('mongoose');

const orderItemSchema = new Schema({
  product: { type: Types.ObjectId, ref: 'Product', required: true },
  qty: { type: Number, required: true, min: 1 },
  priceOverride: { type: Number, default: null } // admin/staff override per item
}, { _id: false });

const commentSchema = new Schema({
  by: { type: Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  at: { type: Date, default: Date.now }
}, { _id: false });

const orderSchema = new Schema({
  info: {
    name: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    pin: String,
    paymentMethod: { type: String, default: 'COD' }
  },
  status: {
    type: String,
    enum: ['new', 'placed', 'confirmed', 'call_not_pickup', 'call_later', 'cancelled', 'delivered'],
    default: 'new'
  },
  items: [orderItemSchema],

  // ✅ Order auto-assign to subAdmin (from Product)
  assignedTo: { type: Types.ObjectId, ref: 'User', default: null }, // sub_admin

  // ✅ SubAdmin → Staff assignment
  staffAssignedTo: { type: Types.ObjectId, ref: 'User', default: null },

  comments: [commentSchema],

  // ✅ (Optional) track karne ke liye field
  lastOrderAt: { type: Date, default: Date.now }  

}, { timestamps: true });

module.exports = model('Order', orderSchema);
