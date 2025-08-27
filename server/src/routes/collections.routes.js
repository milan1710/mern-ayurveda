const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const allowRoles = require('../middleware/allowRoles');
const Cols = require('../controllers/collections.controller');

router.get('/', requireAuth, Cols.list);
router.post('/', requireAuth, allowRoles('admin'), Cols.create);
router.put('/:id', requireAuth, allowRoles('admin'), Cols.update);
router.delete('/:id', requireAuth, allowRoles('admin'), Cols.remove);

module.exports = router;
