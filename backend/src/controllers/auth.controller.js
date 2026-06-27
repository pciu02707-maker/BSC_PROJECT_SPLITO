const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Generate JWT ─────────────────────────────────────────────────────────────
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const formatUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  authProvider: user.authProvider,
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const user = await User.create({ name, email, password, authProvider: 'local' });
    const token = generateToken(user._id);

    res.status(201).json({ success: true, token, user: formatUser(user) });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
const login = (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ success: false, message: info?.message || 'Login failed.' });

    const token = generateToken(user._id);
    res.json({ success: true, token, user: formatUser(user) });
  })(req, res, next);
};

// ─── GET /api/auth/google ─────────────────────────────────────────────────────
const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
});

// ─── GET /api/auth/google/callback ───────────────────────────────────────────
const googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user) => {
    if (err || !user) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=google_failed`);
    }

    const token = generateToken(user._id);
    // Redirect to frontend with token in query param
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  })(req, res, next);
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  res.json({ success: true, user: formatUser(req.user) });
};

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
const logout = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
};

module.exports = { register, login, googleAuth, googleCallback, getMe, logout };
