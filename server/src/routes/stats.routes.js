const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const requireAuth = require('../middleware/requireAuth');
const allowRoles = require('../middleware/allowRoles');

const Order = require('../models/Order');
const User = require('../models/User');

router.get(
  '/summary',
  requireAuth,
  allowRoles('admin', 'sub_admin', 'staff'),
  async (req, res, next) => {
    try {
      const { from, to, staff = 'all' } = req.query;

      // default time window
      const now = new Date();
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      last.setHours(23, 59, 59, 999);

      const fromDate = from ? new Date(from) : first;
      const toDate = to ? new Date(to) : last;

      const match = { createdAt: { $gte: fromDate, $lte: toDate } };

      // ✅ Role based restriction
      if (req.user.role === 'staff') {
        // staff → sirf apne
        match.assignedTo = req.user._id;
      } else if (req.user.role === 'sub_admin') {
        // sub_admin → apne + apne staff ke
        const staffIds = await User.find({ parent: req.user._id, role: 'staff' }).distinct('_id');
        match.$or = [{ assignedTo: req.user._id }];
        if (staffIds.length) {
          match.$or.push({ assignedTo: { $in: staffIds } });
        }
      } else if (req.user.role === 'admin') {
        // admin → sab
      }

      // ✅ Staff dropdown filter (extra filter apply)
      if (staff && staff !== 'all') {
        if (staff === 'unassigned') {
          match.$or = [{ assignedTo: null }, { assignedTo: { $exists: false } }];
        } else if (mongoose.Types.ObjectId.isValid(staff)) {
          match.assignedTo = new mongoose.Types.ObjectId(staff);
        }
      }

      const KNOWN_STATUSES = [
        'new',
        'placed',
        'confirmed',
        'call_not_pickup',
        'call_later',
        'cancelled',
        'delivered',
      ];

      // ---- aggregation ----
      const agg = await Order.aggregate([
        { $match: match },
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id: null,
                  totalOrders: { $sum: 1 },
                  placedOrders: { $sum: { $cond: [{ $eq: ['$status', 'placed'] }, 1, 0] } },
                  confirmedOrders: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
                },
              },
            ],
            byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
            placedSales: [
              { $match: { status: 'placed' } },
              { $unwind: { path: '$items', preserveNullAndEmptyArrays: true } },
              {
                $group: {
                  _id: null,
                  total: {
                    $sum: {
                      $multiply: [
                        { $ifNull: ['$items.qty', 0] },
                        { $ifNull: ['$items.price', 0] },
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      ]);

      const facet = agg[0] || { totals: [], byStatus: [], placedSales: [] };

      const t = facet.totals[0] || { totalOrders: 0, placedOrders: 0, confirmedOrders: 0 };

      const byStatusRaw = {};
      (facet.byStatus || []).forEach(r => {
        if (r && r._id) byStatusRaw[String(r._id)] = r.count || 0;
      });
      const byStatusOut = {};
      KNOWN_STATUSES.forEach(k => { byStatusOut[k] = Number(byStatusRaw[k] || 0); });

      const salesPlaced = facet.placedSales[0]?.total || 0;

      // staff list for dropdown
      let staffUsers = [];
      if (req.user.role === 'admin') {
        staffUsers = await User.find({ role: 'staff' }).select('_id name email').lean();
      } else if (req.user.role === 'sub_admin') {
        staffUsers = await User.find({ parent: req.user._id, role: 'staff' })
          .select('_id name email')
          .lean();
      }

      res.json({
        totals: {
          totalOrders: Number(t.totalOrders || 0),
          placedOrders: Number(t.placedOrders || 0),
          confirmedOrders: Number(t.confirmedOrders || 0),
          totalSalesPlaced: Number(salesPlaced || 0),
        },
        byStatus: byStatusOut,
        sales: { placed: Number(salesPlaced || 0) },
        staffUsers,
      });
    } catch (err) {
      console.error(err);
      next(err);
    }
  }
);

module.exports = router;
