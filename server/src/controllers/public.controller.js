const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const WalletTx = require('../models/WalletTx'); // 👈 add for wallet logs

exports.publicProducts = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '20', 10)));
    const featured = String(req.query.featured||'').toLowerCase()==='true';

    const filter = {};
    if (q) filter.name = { $regex: q, $options: 'i' };
    if (featured) filter.featured = true;

    const items = await Product.find(filter)
      .select('name price oldPrice images featured')
      .sort({ createdAt:-1 })
      .limit(limit)
      .lean();

    res.json({ items });
  } catch (e) { next(e); }
};

exports.publicProductById = async (req, res, next) => {
  try {
    const p = await Product.findById(req.params.id).lean();
    if (!p) return res.status(404).json({ message: 'Not found' });
    res.json({ product: p });
  } catch (e) { next(e); }
};

exports.placeOrder = async (req, res, next) => {
  try {
    const { items, info } = req.body || {};
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: 'No items' });
    if (!info || !info.name || !info.phone || !info.address) return res.status(400).json({ message: 'Missing info' });

    // ✅ Fetch products
    const productIds = items.map(it => it.product);
    const products = await Product.find({ _id: { $in: productIds } }).select('_id assignedTo').lean();

    // ✅ Determine assignedTo (first product with assignment)
    let assignedTo = null;
    for (const prod of products) {
      if (prod.assignedTo) {
        assignedTo = prod.assignedTo;
        break;
      }
    }

    // ✅ Create order
    const order = await Order.create({
      items: items.map(it=>({ product: it.product, qty: Number(it.qty||1) })),
      info,
      status: 'placed',
      assignedTo
    });

    // ✅ Wallet deduction if assigned to sub_admin
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
          method: 'public_order',
          status: 'success',
          meta: {
            orderId: order._id,
            customerName: info.name,
            customerPhone: info.phone
          }
        });
      }
    }

    res.status(201).json({ ok: true, id: order._id });
  } catch (e) {
    console.error("❌ Public order create error:", e);
    next(e);
  }
};
