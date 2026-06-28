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

// Protected publishing actions
router.post('/', protect, publishPlan);

// Public liking action (anyone can like without accounts!)
router.post('/:id/like', likePlan);

module.exports = router;
