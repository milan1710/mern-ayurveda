const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const allowRoles = require('../middleware/allowRoles');
const Users = require('../controllers/users.controller');

// staff list
router.get('/staff', requireAuth, allowRoles('admin'), Users.listStaff);
// create staff
router.post('/staff', requireAuth, allowRoles('admin'), Users.createStaff);

module.exports = router;
