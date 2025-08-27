const Order = require('../models/Order');

exports.summary = async (req, res) => {
  const match = {};
  if (req.user?.role === 'staff') match.assignedTo = req.user._id;

  const totalOrders = await Order.countDocuments(match);
  const placed = await Order.countDocuments({ ...match, status:'placed' });
  const confirmed = await Order.countDocuments({ ...match, status:'confirmed' });
  const callNP = await Order.countDocuments({ ...match, status:'call_not_pickup' });
  const callLater = await Order.countDocuments({ ...match, status:'call_later' });

  res.json({
    totalOrders,
    placed,
    confirmed,
    call_not_pickup: callNP,
    call_later: callLater
  });
};
