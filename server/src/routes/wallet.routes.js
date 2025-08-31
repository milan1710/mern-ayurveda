const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const allowRoles = require('../middleware/allowRoles');
const razorpay = require('../config/razorpay');
const WalletTx = require('../models/WalletTx');
const User = require('../models/User');
const crypto = require('crypto');

/**
 * Create Razorpay Order
 */
router.post('/create-order', requireAuth, allowRoles('sub_admin'), async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const options = {
      amount: amount * 100, // in paise
      currency: 'INR',
      receipt: `wallet_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    const txn = await WalletTx.create({
      user: req.user._id,
      amount,
      type: 'credit',
      method: 'razorpay',
      txnId: order.id,  // store Razorpay order id
      status: 'pending',
    });

    res.json({ order, txnId: txn._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Order create failed' });
  }
});

/**
 * Verify Razorpay Payment
 */
router.post('/verify', requireAuth, allowRoles('sub_admin'), async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, txnId } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !txnId) {
      return res.status(400).json({ message: 'Missing payment data' });
    }

    // ✅ Signature verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Signature verification failed' });
    }

    const txn = await WalletTx.findById(txnId);
    if (!txn) return res.status(404).json({ message: 'Transaction not found' });

    txn.txnId = razorpay_payment_id; // store payment id
    txn.status = 'success';
    await txn.save();

    // ✅ Ensure wallet field exists (default 0)
    const user = await User.findById(txn.user);
    if (typeof user.wallet !== 'number') user.wallet = 0;
    user.wallet += txn.amount;
    await user.save();

    res.json({ message: 'Payment verified & wallet updated', txn, wallet: user.wallet });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Verify failed' });
  }
});

/**
 * Get Wallet Balance
 */
router.get('/balance', requireAuth, allowRoles('sub_admin'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('wallet');
    res.json({ wallet: user.wallet || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Balance fetch failed' });
  }
});

/**
 * Get Wallet Transactions
 */
router.get('/transactions', requireAuth, allowRoles('sub_admin'), async (req, res) => {
  try {
    const txns = await WalletTx.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ items: txns });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Transactions fetch failed' });
  }
});

module.exports = router;
