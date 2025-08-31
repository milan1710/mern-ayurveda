const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const WalletTx = require('../models/WalletTx'); // transaction logging

function isAdmin(user) { return user && user.role === 'admin'; }
function isSubAdmin(user) { return user && user.role === 'sub_admin'; }
function isStaff(user) { return user && user.role === 'staff'; }

function canAccessOrder(order, user) {
  if (isAdmin(user)) return true;
  if (isSubAdmin(user)) {
    if (String(order.assignedTo?._id) === String(user._id)) return true;
    if (String(order.assignedTo?.parent) === String(user._id)) return true;
    return false;
  }
  if (isStaff(user)) {
    return String(order.assignedTo?._id) === String(user._id);
  }
  return false;
}

async function buildListMatch(req) {
  const q = (req.query.q || '').trim();
  const status = (req.query.status || '').trim();
  const match = {};

  if (q) {
    const rx = new RegExp(q, 'i');
    match.$or = [{ 'info.name': rx }, { 'info.phone': rx }];
  }

  if (status && status !== 'all') {
    match.status = status;
  }

  if (isStaff(req.user)) {
    match.assignedTo = req.user._id;
  } else if (isSubAdmin(req.user)) {
    const staffIds = await User.find({ parent: req.user._id, role: 'staff' }).distinct('_id');
    match.$or = match.$or || [];
    match.$or.push({ assignedTo: req.user._id });
    if (staffIds.length) {
      match.$or.push({ assignedTo: { $in: staffIds } });
    }
  }

  return match;
}

/* -------------------- LIST -------------------- */
exports.list = async function list(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '10', 10)));
    const skip = (page - 1) * limit;

    const match = await buildListMatch(req);

    const [items, total] = await Promise.all([
      Order.find(match)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('items.product', 'name price')
        .populate('assignedTo', 'name email parent role')
        .lean(),
      Order.countDocuments(match),
    ]);

    res.json({ items, page, pages: Math.max(1, Math.ceil(total / limit)), total });
  } catch (err) { next(err); }
};

/* -------------------- GET ONE -------------------- */
exports.getOne = async function getOne(req, res, next) {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = await Order.findById(id)
      .populate('items.product', 'name price')
      .populate('assignedTo', 'name email parent role')
      .lean();

    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!canAccessOrder(order, req.user)) return res.status(403).json({ message: 'Forbidden' });

    res.json({ order });
  } catch (err) { next(err); }
};

/* -------------------- CREATE -------------------- */
exports.create = async function create(req, res, next) {
  try {
    const body = req.body || {};
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }

    const productIds = body.items
      .map(i => i.product)
      .filter(id => mongoose.Types.ObjectId.isValid(id));

    const products = await Product.find({ _id: { $in: productIds } })
      .select('_id assignedTo price')
      .lean();

    if (!products.length) return res.status(400).json({ message: 'Invalid products' });

    let assignedTo = null;
    for (const prod of products) {
      if (prod.assignedTo) {
        assignedTo = prod.assignedTo;
        break;
      }
    }

    const items = body.items.map(it => {
      const product = products.find(p => String(p._id) === String(it.product));
      return {
        product: it.product,
        qty: it.qty || 1,
        priceOverride: (it.price === null || it.price === undefined)
          ? null
          : Number(it.price),
      };
    });

    const order = await Order.create({
      info: {
        name: body.name,
        phone: body.phone,
        address: body.address,
        city: body.city,
        state: body.state,
        pin: body.pin,
        paymentMethod: body.paymentMethod || 'COD',
      },
      status: 'new',
      items,
      assignedTo,
    });

    /* ✅ Wallet Deduction if already assigned to Sub Admin */
    if (assignedTo) {
      const subAdmin = await User.findById(assignedTo);
      if (subAdmin && subAdmin.role === 'sub_admin') {
        const charge = subAdmin.orderCharge > 0 ? subAdmin.orderCharge : 20;
        if (subAdmin.wallet < charge) {
          return res.status(400).json({ message: `Insufficient balance in Sub Admin wallet (Need ₹${charge})` });
        }

        subAdmin.wallet -= charge;
        await subAdmin.save();

        await WalletTx.create({
          user: subAdmin._id,
          amount: charge,
          type: 'debit',
          method: 'auto_assign',
          status: 'success',
          meta: {
            orderId: order._id,
            customerName: body.name,
            customerPhone: body.phone
          }
        });
      }
    }

    const fresh = await Order.findById(order._id)
      .populate('items.product', 'name price')
      .populate('assignedTo', 'name email parent role')
      .lean();

    res.json({ order: fresh });
  } catch (err) {
    console.error("❌ Order create error:", err);
    next(err);
  }
};

/* -------------------- UPDATE INFO -------------------- */
exports.updateInfo = async function updateInfo(req, res, next) {
  try {
    const id = req.params.id;
    const o = await Order.findById(id).populate('assignedTo', '_id parent role').exec();
    if (!o) return res.status(404).json({ message: 'Order not found' });
    if (!canAccessOrder(o, req.user)) return res.status(403).json({ message: 'Forbidden' });

    const body = req.body || {};
    const firstName = (body.firstName || '').trim();
    const lastName = (body.lastName || '').trim();

    const newName = (firstName || lastName)
      ? (firstName + ' ' + lastName).trim()
      : (o.info && o.info.name) ? o.info.name : '';

    o.info = o.info || {};
    o.info.name = newName;
    o.info.phone = body.phone ?? o.info.phone;
    o.info.address = body.address ?? o.info.address;
    o.info.city = body.city ?? o.info.city;
    o.info.state = body.state ?? o.info.state;
    o.info.pin = body.pin ?? o.info.pin;
    o.info.paymentMethod = body.paymentMethod ?? (o.info.paymentMethod || 'COD');

    await o.save();

    const fresh = await Order.findById(id)
      .populate('items.product', 'name price')
      .populate('assignedTo', 'name email parent role')
      .lean();

    res.json({ order: fresh });
  } catch (err) { next(err); }
};

/* -------------------- UPDATE STATUS -------------------- */
exports.updateStatus = async function updateStatus(req, res, next) {
  try {
    const id = req.params.id;
    const o = await Order.findById(id).populate('assignedTo', '_id parent role').exec();
    if (!o) return res.status(404).json({ message: 'Order not found' });
    if (!canAccessOrder(o, req.user)) return res.status(403).json({ message: 'Forbidden' });

    const status = (req.body && req.body.status) ? String(req.body.status) : '';
    const allowed = ['new', 'placed', 'confirmed', 'call_not_pickup', 'call_later', 'cancelled', 'delivered'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    o.status = status;
    await o.save();

    const fresh = await Order.findById(id)
      .populate('items.product', 'name price')
      .populate('assignedTo', 'name email parent role')
      .lean();

    res.json({ order: fresh });
  } catch (err) { next(err); }
};

/* -------------------- ASSIGN (Admin + SubAdmin) -------------------- */
exports.assign = async function assign(req, res, next) {
  try {
    if (!isAdmin(req.user) && !isSubAdmin(req.user)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const id = req.params.id;
    const staffId = req.body ? req.body.staffId : null;

    const o = await Order.findById(id).exec();
    if (!o) return res.status(404).json({ message: 'Order not found' });

    if (!staffId) {
      o.assignedTo = null;
    } else {
      if (!mongoose.Types.ObjectId.isValid(staffId)) {
        return res.status(400).json({ message: 'Invalid staffId' });
      }

      if (isSubAdmin(req.user)) {
        const staff = await User.findOne({ _id: staffId, parent: req.user._id, role: 'staff' }).lean();
        if (!staff) {
          return res.status(403).json({ message: 'Not your staff' });
        }
      }

      const staffUser = await User.findById(staffId);
      if (!staffUser) return res.status(404).json({ message: 'Staff not found' });

      // Wallet deduction
      if (staffUser.applyCharge) {
        const charge = staffUser.orderCharge > 0 ? staffUser.orderCharge : 20;
        if (staffUser.wallet < charge) {
          return res.status(400).json({ message: `Insufficient balance. Need ₹${charge} in wallet.` });
        }

        staffUser.wallet -= charge;
        await staffUser.save();

        await WalletTx.create({
          user: staffUser._id,
          amount: charge,
          type: 'debit',
          method: 'order_assign',
          status: 'success',
          meta: {
            orderId: o._id,
            customerName: o.info?.name,
            customerPhone: o.info?.phone
          }
        });
      }

      o.assignedTo = new mongoose.Types.ObjectId(staffId);
    }

    await o.save();

    const fresh = await Order.findById(id)
      .populate('items.product', 'name price')
      .populate('assignedTo', 'name email parent role')
      .lean();

    res.json({ order: fresh });
  } catch (err) {
    console.error("❌ Assign error:", err);
    next(err);
  }
};

/* -------------------- ASSIGN TO STAFF (SubAdmin → Staff) -------------------- */
exports.assignToStaff = async function assignToStaff(req, res, next) {
  try {
    if (!isSubAdmin(req.user)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const id = req.params.id;
    const staffId = req.body ? req.body.staffId : null;

    const o = await Order.findById(id).exec();
    if (!o) return res.status(404).json({ message: 'Order not found' });

    if (!staffId || !mongoose.Types.ObjectId.isValid(staffId)) {
      return res.status(400).json({ message: 'Invalid staffId' });
    }

    // ensure staff belongs to this subadmin
    const staff = await User.findOne({ _id: staffId, parent: req.user._id, role: 'staff' });
    if (!staff) {
      return res.status(403).json({ message: 'Not your staff' });
    }

    // Wallet deduction
    if (staff.applyCharge) {
      const charge = staff.orderCharge > 0 ? staff.orderCharge : 20;
      if (staff.wallet < charge) {
        return res.status(400).json({ message: `Insufficient balance. Need ₹${charge} in wallet.` });
      }

      staff.wallet -= charge;
      await staff.save();

      await WalletTx.create({
        user: staff._id,
        amount: charge,
        type: 'debit',
        method: 'assign_staff',
        status: 'success',
        meta: {
          orderId: o._id,
          customerName: o.info?.name,
          customerPhone: o.info?.phone
        }
      });
    }

    o.assignedTo = new mongoose.Types.ObjectId(staffId);
    await o.save();

    const fresh = await Order.findById(id)
      .populate('items.product', 'name price')
      .populate('assignedTo', 'name email parent role')
      .lean();

    res.json({ order: fresh });
  } catch (err) {
    console.error("❌ assignToStaff error:", err);
    next(err);
  }
};

/* -------------------- UPDATE ITEMS -------------------- */
exports.updateItems = async function updateItems(req, res, next) {
  try {
    const id = req.params.id;
    const body = req.body || {};
    const o = await Order.findById(id).populate('assignedTo', '_id parent role').exec();
    if (!o) return res.status(404).json({ message: 'Order not found' });
    if (!canAccessOrder(o, req.user)) return res.status(403).json({ message: 'Forbidden' });

    if (Array.isArray(body.items)) {
      const normalized = [];
      for (const it of body.items) {
        if (!it.product || !mongoose.Types.ObjectId.isValid(it.product)) continue;
        const prod = await Product.findById(it.product).select('_id price name').lean();
        if (!prod) continue;
        const qty = Math.max(1, parseInt(it.qty || 1, 10));
        const price = (typeof it.price === 'number') ? it.price : (prod.price || 0);
        normalized.push({ product: prod._id, qty, priceOverride: price });
      }
      o.items = normalized;
    }

    if (body.overrideAmount !== undefined && body.overrideAmount !== null && body.overrideAmount !== '') {
      const n = Number(body.overrideAmount);
      if (isFinite(n) && n >= 0) {
        o.overrideAmount = n;
      }
    }

    await o.save();

    const fresh = await Order.findById(id)
      .populate('items.product', 'name price')
      .populate('assignedTo', 'name email parent role')
      .lean();

    res.json({ order: fresh });
  } catch (err) { next(err); }
};

/* -------------------- ADD COMMENT -------------------- */
exports.addComment = async function addComment(req, res, next) {
  try {
    const id = req.params.id;
    const text = (req.body.text || '').trim();

    const o = await Order.findById(id).populate('assignedTo', '_id parent role').exec();
    if (!o) return res.status(404).json({ message: 'Order not found' });
    if (!canAccessOrder(o, req.user)) return res.status(403).json({ message: 'Forbidden' });
    if (!text) return res.status(400).json({ message: 'Comment text required' });

    const note = {
      _id: new mongoose.Types.ObjectId(),
      text,
      by: { _id: req.user._id, name: req.user.name || req.user.email },
      at: new Date(),
    };

    if (!Array.isArray(o.comments)) o.comments = [];
    o.comments.unshift(note);

    await o.save();

    const fresh = await Order.findById(id)
      .populate('items.product', 'name price')
      .populate('assignedTo', 'name email parent role')
      .lean();

    res.json({ order: fresh });
  } catch (err) { next(err); }
};

/* -------------------- REMOVE -------------------- */
exports.remove = async function remove(req, res, next) {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Forbidden' });
    const id = req.params.id;
    const ok = await Order.findByIdAndDelete(id).lean();
    if (!ok) return res.status(404).json({ message: 'Order not found' });
    res.json({ success: true });
  } catch (err) { next(err); }
};
