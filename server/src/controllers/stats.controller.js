const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');

function isAdmin(user) { return user?.role === 'admin'; }
function isSubAdmin(user) { return user?.role === 'sub_admin'; }
function isStaff(user) { return user?.role === 'staff'; }

exports.summary = async (req, res) => {
  try {
    const { from, to, staff } = req.query;

    const match = {};

    // ✅ Date range filter
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to) match.createdAt.$lte = new Date(to);
    }

    // ✅ Role based filtering
    if (isStaff(req.user)) {
      match.assignedTo = req.user._id;
    } else if (isSubAdmin(req.user)) {
      const staffIds = await User.find({ parent: req.user._id, role: 'staff' }).distinct('_id');
      match.$or = [{ assignedTo: req.user._id }];
      if (staffIds.length) {
        match.$or.push({ assignedTo: { $in: staffIds } });
      }
    } else if (isAdmin(req.user)) {
      // admin → sab data
    }

    // ✅ Staff dropdown filter (admin / sub_admin ke liye)
    if (staff && staff !== 'all') {
      if (staff === 'unassigned') {
        match.assignedTo = null;
      } else if (mongoose.Types.ObjectId.isValid(staff)) {
        match.assignedTo = new mongoose.Types.ObjectId(staff);
      }
    }

    // ---- Aggregation ----
    const orders = await Order.find(match).lean();

    const byStatus = {};
    let totalOrders = 0;
    let placedOrders = 0;
    let confirmedOrders = 0;
    let totalSalesPlaced = 0;

    for (const o of orders) {
      byStatus[o.status] = (byStatus[o.status] || 0) + 1;
      totalOrders++;
      if (o.status === 'placed') placedOrders++;
      if (o.status === 'confirmed') confirmedOrders++;
      if (o.status === 'placed') {
        const amt = o.overrideAmount || o.items.reduce((s,i)=>s+(i.price*i.qty),0);
        totalSalesPlaced += amt;
      }
    }

    // ✅ Staff list for dropdown
    let staffUsers = [];
    if (isAdmin(req.user)) {
      staffUsers = await User.find({ role: 'staff' }).select('name email').lean();
    } else if (isSubAdmin(req.user)) {
      staffUsers = await User.find({ parent: req.user._id, role: 'staff' }).select('name email').lean();
    }

    res.json({
      byStatus,
      totals: { totalOrders, placedOrders, confirmedOrders, totalSalesPlaced },
      staffUsers
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Stats error' });
  }
};
