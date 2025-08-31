const User = require('../models/User');
const WalletTx = require('../models/WalletTx');
const Order = require('../models/Order');

exports.assignOrder = async (req, res) => {
  try {
    const { staffId } = req.body;
    const orderId = req.params.id;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (!staffId) {
      order.assignedTo = null;
      await order.save();
      return res.json({ message: 'Order unassigned', order });
    }

    const staff = await User.findById(staffId);
    if (!staff) return res.status(404).json({ message: 'User not found' });

    // ✅ check charge condition
    let charge = 0;
    if (staff.applyCharge) {
      charge = staff.orderCharge > 0 ? staff.orderCharge : 20;

      if (staff.wallet < charge) {
        return res.status(400).json({
          message: `Insufficient balance. You need at least ₹${charge} in wallet.`
        });
      }

      // ✅ deduct charge
      staff.wallet -= charge;
      await staff.save();

      // ✅ save transaction
      await WalletTx.create({
        user: staff._id,
        amount: charge,
        type: 'debit',
        status: 'success',
        method: 'wallet',
        note: `Order assigned (${order._id})`
      });
    }

    order.assignedTo = staffId;
    await order.save();

    res.json({ message: `Order assigned & ₹${charge} deducted`, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to assign order' });
  }
};
