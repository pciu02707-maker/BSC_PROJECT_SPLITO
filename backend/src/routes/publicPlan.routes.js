const express = require('express');
const router = express.Router();
const {
  getPublicPlans,
  publishPlan,
  likePlan,
} = require('../controllers/publicPlan.controller');
const { protect } = require('../middleware/auth.middleware');

// Public listing
router.get('/', getPublicPlans);

// Protected publishing and liking actions
router.post('/', protect, publishPlan);
router.post('/:id/like', protect, likePlan);

module.exports = router;
