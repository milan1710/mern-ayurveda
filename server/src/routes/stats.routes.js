// server/src/routes/stats.routes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const requireAuth = require('../middleware/requireAuth');
const allowRoles = require('../middleware/allowRoles');

const Order = require('../models/Order');
const User = require('../models/User');

/**
 * GET /api/stats/summary?from=ISO&to=ISO&staff=all|unassigned|<staffId>
 * Response shape (frontend expects):
 * {
 *   totals: {
 *     totalOrders, placedOrders, confirmedOrders, totalSalesPlaced
 *   },
 *   byStatus: {
 *     new, placed, confirmed, call_not_pickup, call_later, cancelled, delivered
 *   },
 *   sales: { placed: <number> },
 *   staffUsers: [{ _id, name, email }]
 * }
 */
router.get(
  '/summary',
  requireAuth,
  allowRoles('admin', 'staff'),
  async (req, res, next) => {
    try {
      // ---- parse query ----
      const { from, to, staff = 'all' } = req.query;

      // time window (defaults: this month)
      const now = new Date();
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      last.setHours(23, 59, 59, 999);

      const fromDate = from ? new Date(from) : first;
      const toDate = to ? new Date(to) : last;

      const match = {
        createdAt: { $gte: fromDate, $lte: toDate },
      };

      // staff filter:
      // - all: no filter
      // - unassigned: assignedTo null/missing
      // - <id>: assignedTo = ObjectId(id)
      if (staff && staff !== 'all') {
        if (staff === 'unassigned') {
          match.$or = [{ assignedTo: null }, { assignedTo: { $exists: false } }];
        } else if (mongoose.Types.ObjectId.isValid(staff)) {
          match.assignedTo = new mongoose.Types.ObjectId(staff);
        }
      }

      // Common status list to ensure we always return all keys with 0 default
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

        // Compute counts and sales in one go using $facet
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id: null,
                  totalOrders: { $sum: 1 },
                  placedOrders: {
                    $sum: { $cond: [{ $eq: ['$status', 'placed'] }, 1, 0] },
                  },
                  confirmedOrders: {
                    $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] },
                  },
                },
              },
            ],

            byStatus: [
              {
                $group: {
                  _id: '$status',
                  count: { $sum: 1 },
                },
              },
            ],

            // Sales for placed orders only: sum(items.qty * product.price)
            // We may need price from Product, so lookup
            placedSales: [
              { $match: { status: 'placed' } },
              { $unwind: { path: '$items', preserveNullAndEmptyArrays: true } },
              {
                $lookup: {
                  from: 'products',
                  localField: 'items.product',
                  foreignField: '_id',
                  as: 'prod',
                },
              },
              { $unwind: { path: '$prod', preserveNullAndEmptyArrays: true } },
              {
                $group: {
                  _id: null,
                  total: {
                    $sum: {
                      $multiply: [
                        { $ifNull: ['$items.qty', 0] },
                        {
                          $ifNull: [
                            // अगर order item में price embedded है तो वही, वरना product.price
                            '$items.price',
                            { $ifNull: ['$prod.price', 0] },
                          ],
                        },
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

      // normalize totals
      const t = facet.totals[0] || {
        totalOrders: 0,
        placedOrders: 0,
        confirmedOrders: 0,
      };

      // normalize byStatus to include all known keys
      const byStatusRaw = {};
      (facet.byStatus || []).forEach((r) => {
        if (r && r._id) byStatusRaw[String(r._id)] = r.count || 0;
      });
      const byStatusOut = {};
      KNOWN_STATUSES.forEach((k) => {
        byStatusOut[k] = Number(byStatusRaw[k] || 0);
      });

      // placed sales number
      const salesPlaced = facet.placedSales[0]?.total || 0;

      // staff list for filter dropdown
      const staffUsers = await User.find({ role: 'staff' })
        .select('_id name email')
        .sort({ name: 1, email: 1 })
        .lean();

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
      next(err);
    }
  }
);

module.exports = router;
