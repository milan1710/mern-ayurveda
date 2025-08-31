const mongoose = require('mongoose');
const { Schema } = mongoose;

const walletTxSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref:'User', required:true },
  amount: { type:Number, required:true },
  type: { type:String, enum:['credit','debit'], required:true },
  method: { type:String, default:'razorpay' }, // 'razorpay' | 'order_assign'
  txnId: { type:String }, // Razorpay payment_id OR null
  status: { type:String, enum:['pending','success','failed'], default:'pending' },
  meta: { type: Object, default: {} } // optional extra info
}, { timestamps:true });

module.exports = mongoose.models.WalletTx || mongoose.model('WalletTx', walletTxSchema);
