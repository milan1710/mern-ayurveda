const router = require('express').Router();
const User = require('../models/User');
const WalletTx = require('../models/WalletTx');
const superAdminAuth = require('../middleware/superAdminAuth');

// ✅ Super Admin Login (via .env)
router.post('/login', superAdminAuth, (req, res) => {
  res.json({ success: true, message: 'Super Admin Logged In' });
});

// ✅ Get all Sub Admins with balance
router.get('/sub-admins', async (req, res) => {
  try {
    const subs = await User.find({ role: 'sub_admin' }).select('name email wallet');
    res.json(subs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get transaction history of a sub admin
router.get('/sub-admins/:id/transactions', async (req, res) => {
  try {
    const txs = await WalletTx.find({ user: req.params.id }).sort({ createdAt: -1 });
    res.json(txs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Manual Fund Add
router.post('/sub-admins/:id/add-fund', async (req, res) => {
  try {
    const { amount } = req.body;
    const sub = await User.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: 'Sub Admin not found' });

    sub.wallet += amount;
    await sub.save();

    // log in wallet transaction
    await WalletTx.create({
      user: sub._id,
      type: 'credit',
      amount,
      note: 'Manual fund add by Super Admin'
    });

    res.json({ success: true, wallet: sub.wallet });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
