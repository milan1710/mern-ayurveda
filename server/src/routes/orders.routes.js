const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const allowRoles = require('../middleware/allowRoles');
const Orders = require('../controllers/orders.controller');

// -------------------- ORDERS ROUTES --------------------

// List all orders (with filters/pagination)
router.get('/', requireAuth, Orders.list);

// Get single order
router.get('/:id', requireAuth, Orders.getOne);

// Create new order (Customer place)
router.post('/', Orders.create);

// Update order info
router.put('/:id/info', requireAuth, Orders.updateInfo);

// Update order status
router.put('/:id/status', requireAuth, Orders.updateStatus);

// ✅ Admin + SubAdmin can assign (main assignment)
router.put('/:id/assign', requireAuth, allowRoles('admin', 'sub_admin'), Orders.assign);

// ✅ NEW: SubAdmin can assign to Staff
router.put('/:id/assign-staff', requireAuth, allowRoles('sub_admin'), Orders.assignToStaff);

// Update order items
router.put('/:id/items', requireAuth, Orders.updateItems);

// Add comment to order
router.post('/:id/comment', requireAuth, Orders.addComment);

// Delete order (Admin only)
router.delete('/:id', requireAuth, allowRoles('admin'), Orders.remove);

module.exports = router;
