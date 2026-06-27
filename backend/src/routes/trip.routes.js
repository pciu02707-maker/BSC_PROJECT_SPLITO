const express = require('express');
const router = express.Router();
const {
  getMyTrips,
  getTripById,
  createTrip,
  updateTrip,
  updateTripItinerary,
  deleteTrip,
  joinTrip,
  leaveTrip,
  removeMember,
  updateTripStatus,
  getTripBalances,
  getTripActivities,
} = require('../controllers/trip.controller');
const { protect } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

router.get('/', getMyTrips);
router.post('/', createTrip);
router.post('/join', joinTrip);

router.get('/:id', getTripById);
router.put('/:id', updateTrip);
router.patch('/:id/itinerary', updateTripItinerary);
router.delete('/:id', deleteTrip);

router.post('/:id/leave', leaveTrip);
router.post('/:id/remove-member', removeMember);
router.patch('/:id/status', updateTripStatus);
router.get('/:id/balances', getTripBalances);
router.get('/:id/activities', getTripActivities);

module.exports = router;
