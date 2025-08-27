const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const allowRoles = require('../middleware/allowRoles');
const Cats = require('../controllers/categories.controller');

router.get('/', requireAuth, Cats.list);
router.post('/', requireAuth, allowRoles('admin'), Cats.create);
router.put('/:id', requireAuth, allowRoles('admin'), Cats.update);
router.delete('/:id', requireAuth, allowRoles('admin'), Cats.remove);

module.exports = router;
