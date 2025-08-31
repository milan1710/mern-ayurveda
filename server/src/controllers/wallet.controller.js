const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
const WalletTx = require('../models/WalletTx');

// Razorpay client
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* -------------------- CREATE RAZORPAY ORDER -------------------- */
exports.createOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

    const options = {
      amount: amount * 100, // in paise
      currency: 'INR',
      receipt: 'wallet_' + Date.now(),
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    await WalletTx.create({
      user: req.user._id,
      amount,
      type: 'credit',
      status: 'pending',
      txnId: order.id,
      method: 'razorpay'
    });

    res.json({ order });
  } catch (err) {
    console.error("Razorpay order error:", err);
    res.status(500).json({ message: 'Razorpay order failed' });
  }
};

/* -------------------- VERIFY PAYMENT -------------------- */
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    const tx = await WalletTx.findOne({ txnId: razorpay_order_id, user: req.user._id });
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });

    tx.status = 'success';
    tx.txnId = razorpay_payment_id;
    await tx.save();

    await User.findByIdAndUpdate(req.user._id, { $inc: { wallet: tx.amount } });

    res.json({ success: true, balanceAdded: tx.amount });
  } catch (err) {
    console.error("Verify payment error:", err);
    res.status(500).json({ message: 'Verify failed' });
  }
};

/* -------------------- GET WALLET BALANCE -------------------- */
exports.getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('wallet');
    res.json({ balance: user.wallet || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Balance error' });
  }
};

/* -------------------- GET WALLET TRANSACTIONS -------------------- */
exports.getTransactions = async (req, res) => {
  try {
    const txs = await WalletTx.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({ items: txs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Transactions error' });
  }
};
