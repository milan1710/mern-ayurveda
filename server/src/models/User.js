const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true },
  password: { type: String, required: true },

  role: {
    type: String,
    enum: ['admin', 'sub_admin', 'staff'],
    default: 'staff'
  },

  parent: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null
  }, // 👈 sub_admin parent for staff

  wallet: { 
    type: Number, 
    default: 0 
  } // 👈 ✅ wallet balance field
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
