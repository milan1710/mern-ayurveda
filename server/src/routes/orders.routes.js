const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const allowRoles = require('../middleware/allowRoles');
const Orders = require('../controllers/orders.controller');

router.get('/', requireAuth, Orders.list);
router.get('/:id', requireAuth, Orders.getOne);

router.put('/:id/info', requireAuth, Orders.updateInfo);
router.put('/:id/status', requireAuth, Orders.updateStatus);

// ✅ ab admin + sub_admin dono assign kar sakte hain
router.put('/:id/assign', requireAuth, allowRoles('admin', 'sub_admin'), Orders.assign);

router.put('/:id/items', requireAuth, Orders.updateItems);
router.post('/:id/comment', requireAuth, Orders.addComment);

router.delete('/:id', requireAuth, allowRoles('admin'), Orders.remove);

module.exports = router;
