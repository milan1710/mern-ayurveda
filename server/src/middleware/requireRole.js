const { allowRoles } = require('./allowRoles');
const requireRole = (...roles)=>allowRoles(...roles);
module.exports = { requireRole, allowRoles };
