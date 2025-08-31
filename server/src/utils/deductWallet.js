// server/src/utils/deductWallet.js
const User = require('../models/User');
const WalletTx = require('../models/WalletTx');

module.exports = async function deductWallet(userId, order, method = "order_assign") {
  try {
    const user = await User.findById(userId);
    if (!user) return { ok: false, reason: "User not found" };

    if (user.role !== "sub_admin") {
      return { ok: true, reason: "Not a sub_admin" };
    }

    // ✅ हमेशा charge कटेगा
    const charge = user.orderCharge > 0 ? user.orderCharge : 20;

    if (user.wallet < charge) {
      return { ok: false, reason: `Insufficient balance. Need ₹${charge}, Current ₹${user.wallet}` };
    }

    user.wallet -= charge;
    await user.save();

    await WalletTx.create({
      user: user._id,
      amount: charge,
      type: "debit",
      method,
      status: "success",
      meta: {
        orderId: order?._id,
        customerName: order?.info?.name,
        customerPhone: order?.info?.phone,
      },
    });

    return { ok: true };
  } catch (err) {
    console.error("❌ deductWallet error:", err);
    return { ok: false, reason: "Exception in deductWallet" };
  }
};
