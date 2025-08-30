const bcrypt = require('bcryptjs');
const User = require('../models/User');

// ----------------------------
// Staff/SubAdmin list
// ----------------------------
exports.listStaff = async (req, res) => {
  try {
    let query = { role: { $in: ['staff', 'sub_admin'] } };

    // Agar sub_admin login hai → sirf apne staff dikhe
    if (req.user.role === 'sub_admin') {
      query = { role: 'staff', parent: req.user._id };
    }

    const items = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// ----------------------------
// Create Staff/SubAdmin
// ----------------------------
exports.createStaff = async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    // Role validate
    let newRole = role || 'staff';
    if (!['staff', 'sub_admin'].includes(newRole)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Agar sub_admin login hai → sirf staff bana sakta hai
    if (req.user.role === 'sub_admin' && newRole === 'sub_admin') {
      return res.status(403).json({ message: 'Sub Admin cannot create another Sub Admin' });
    }

    // Email check
    const exists = await User.findOne({ email: String(email).toLowerCase() });
    if (exists) return res.status(400).json({ message: 'Email already used' });

    const hash = await bcrypt.hash(password, 10);

    const data = {
      name,
      email: String(email).toLowerCase(),
      password: hash,
      role: newRole,
    };

    // Agar sub_admin staff create kare → parent=sub_admin._id
    if (req.user.role === 'sub_admin' && newRole === 'staff') {
      data.parent = req.user._id;
    }

    const user = await User.create(data);

    const safe = user.toObject();
    delete safe.password;

    res.json({ user: safe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ----------------------------
// Delete Staff/SubAdmin
// ----------------------------
exports.removeStaff = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'Missing user id' });

    const target = await User.findById(id);
    if (!target) return res.status(404).json({ message: 'User not found' });

    // Agar sub_admin hai → sirf apne staff ko delete kar sakta hai
    if (req.user.role === 'sub_admin') {
      if (String(target.parent) !== String(req.user._id) || target.role !== 'staff') {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    await User.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Delete failed' });
  }
};

// ----------------------------
// Assignable Users (for Product assignment)
// ----------------------------
exports.listAssignable = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'admin') {
      query.role = { $in: ['sub_admin', 'staff'] };
    } else if (req.user.role === 'sub_admin') {
      query.role = 'staff';
      query.parent = req.user._id;
    } else {
      return res.json({ items: [] });
    }

    const users = await User.find(query)
      .select('_id name email role')
      .sort({ name: 1 });

    res.json({ items: users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load assignable users' });
  }
};
