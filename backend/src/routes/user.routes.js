const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, changePassword, searchUsers } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.get('/search', searchUsers);

module.exports = router;
