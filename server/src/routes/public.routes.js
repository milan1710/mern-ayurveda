const router = require('express').Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');
const WalletTx = require('../models/WalletTx');
const mongoose = require('mongoose');

// Public: List products
router.get('/products', async (req, res) => {
  const { featured, q = '', limit = 60 } = req.query;
  const where = {};
  if (featured === 'true') where.featured = true;
  if (q) where.name = { $regex: q, $options: 'i' };
  const lm = Math.max(1, Math.min(100, Number(limit) || 60));
  const items = await Product.find(where).sort({ createdAt: -1 }).limit(lm);
  res.json({ items });
});

// Public: product details
router.get('/products/:id', async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ message: 'Not found' });
  res.json({ product: p });
});

// Public: categories
router.get('/categories', async (_req, res) => {
  const items = await Category.find().sort({ name: 1 });
  res.json({ items });
});

// Public: create order (Buy Now) -> status 'new'
router.post('/orders', async (req, res) => {
  const { items = [], info = {} } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Items required' });
  }

  // fetch products (validate + get assignedTo)
  const productIds = items
    .map(it => it.product)
    .filter(id => mongoose.Types.ObjectId.isValid(id));

  const products = await Product.find({ _id: { $in: productIds } })
    .select('_id assignedTo price')
    .lean();

  if (!products.length) {
    return res.status(400).json({ message: 'Invalid product in items' });
  }

  // auto-assign staff (first product's assignedTo used)
  let assignedTo = null;
  for (const prod of products) {
    if (prod.assignedTo) {
      assignedTo = prod.assignedTo;
      break;
    }
  }

  // build order items
  const orderItems = items.map(it => {
    const product = products.find(p => String(p._id) === String(it.product));
    return {
      product: it.product,
      qty: Number(it.qty) || 1,
      priceOverride: (it.price === null || it.price === undefined)
        ? null
        : Number(it.price),
    };
  });

  // create order
  const order = await Order.create({
    info: {
      name: info.name || '',
      phone: info.phone || '',
      address: info.address || '',
      city: info.city || '',
      state: info.state || '',
      pin: info.pin || '',
      paymentMethod: info.paymentMethod || 'COD',
    },
    status: 'new',
    items: orderItems,
    assignedTo,
  });

  // ✅ Wallet deduction if assigned to SubAdmin
  if (assignedTo) {
    const subAdmin = await User.findById(assignedTo);
    if (subAdmin && subAdmin.role === 'sub_admin') {
      const charge = subAdmin.orderCharge > 0 ? subAdmin.orderCharge : 20;

      if (subAdmin.wallet < charge) {
        return res.status(400).json({
          message: `Insufficient balance in Sub Admin wallet (Need ₹${charge})`
        });
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

  res.json({ order });
});

module.exports = router;
