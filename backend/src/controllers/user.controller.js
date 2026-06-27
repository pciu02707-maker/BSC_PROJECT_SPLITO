const User = require('../models/User');
const bcrypt = require('bcryptjs');

// ─── GET /api/users/profile ───────────────────────────────────────────────────
const getProfile = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// ─── PUT /api/users/profile ───────────────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name.trim();
    // Accept avatar as URL or base64
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/users/change-password ──────────────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both fields are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user.password) {
      return res.status(400).json({ success: false, message: 'Google accounts cannot use password change.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/users/search?q=email ───────────────────────────────────────────
const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 3) {
      return res.status(400).json({ success: false, message: 'Search query must be at least 3 characters.' });
    }

    const users = await User.find({
      $or: [
        { email: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
      ],
      _id: { $ne: req.user._id },
    })
      .select('name email avatar')
      .limit(10);

    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile, changePassword, searchUsers };
