const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const allowRoles = require('../middleware/allowRoles');
const Products = require('../controllers/products.controller');

router.get('/', requireAuth, Products.list);
router.get('/:id', requireAuth, Products.getOne);

router.post('/', requireAuth, allowRoles('admin'), Products.create);
router.put('/:id', requireAuth, allowRoles('admin'), Products.update);
router.delete('/:id', requireAuth, allowRoles('admin'), Products.remove);

module.exports = router;
