// server/src/models/WalletTx.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const walletTxSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref:'User', required:true },
  amount: { type:Number, required:true },
  type: { type:String, enum:['credit','debit'], required:true },
  method: { type:String, default:'razorpay' }, // 'razorpay' | 'order_assign'
  txnId: { type:String },
  status: { type:String, enum:['pending','success','failed'], default:'pending' },
  meta: { type: Object, default: {} }, // ✅ extra info (like order/customer)
}, { timestamps:true });

module.exports = mongoose.model('WalletTx', walletTxSchema);
