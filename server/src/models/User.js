const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true },
  password: { type: String, required: true },

  role: {
    type: String,
    enum: ['admin', 'sub_admin', 'staff'],
    default: 'staff'
  },

  parent: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    default: null
  }, // sub_admin parent for staff

  wallet: { type: Number, default: 0 },   // ✅ wallet balance

  orderCharge: { type: Number, default: 20 },   // ✅ default ₹20
applyCharge: { type: Boolean, default: true } // ✅ default true
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
