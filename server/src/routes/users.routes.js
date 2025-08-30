const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const allowRoles = require('../middleware/allowRoles');
const Users = require('../controllers/users.controller');

// staff list
router.get('/staff', requireAuth, Users.listStaff);
router.post('/staff', requireAuth, Users.createStaff);
router.delete('/staff/:id', requireAuth, Users.removeStaff);

// assignables for products
router.get('/assignables', requireAuth, Users.listAssignable);
module.exports = router;
