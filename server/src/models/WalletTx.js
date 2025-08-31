const { Schema, model } = require('mongoose');

const walletTxSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref:'User', required:true },
  amount: { type:Number, required:true },
  type: { type:String, enum:['credit','debit'], required:true },
  method: { type:String, default:'razorpay' },
  txnId: { type:String }, // Razorpay payment_id
  status: { type:String, enum:['pending','success','failed'], default:'pending' },
}, { timestamps:true });

module.exports = model('WalletTx', walletTxSchema);
