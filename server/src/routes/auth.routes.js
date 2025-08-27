const router = require('express').Router();
const Auth = require('../controllers/auth.controller');
const requireAuth = require('../middleware/requireAuth');

router.post('/login', Auth.login);
router.post('/logout', Auth.logout);
router.get('/me', requireAuth, Auth.me);

module.exports = router;
