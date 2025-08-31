const dotenv = require("dotenv");
dotenv.config();

function superAdminAuth(req, res, next) {
  const { email, password } = req.body;

  console.log("👉 Frontend sent:", email, password);
  console.log("👉 Server ENV   :", process.env.SUPER_ADMIN_EMAIL, process.env.SUPER_ADMIN_PASSWORD);

  if (
    email === process.env.SUPER_ADMIN_EMAIL &&
    password === process.env.SUPER_ADMIN_PASSWORD
  ) {
    return next();
  }

  return res.status(401).json({ message: "Unauthorized Super Admin" });
}

module.exports = superAdminAuth;
