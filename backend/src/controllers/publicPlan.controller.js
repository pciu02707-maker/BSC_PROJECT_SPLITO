const PublicPlan = require('../models/PublicPlan');
const Trip = require('../models/Trip');

// Get all public plans
const getPublicPlans = async (req, res, next) => {
  try {
    const plans = await PublicPlan.find()
      .populate('creator', 'name avatar')
      .sort({ likes: -1, createdAt: -1 });

    res.json({ success: true, plans });
  } catch (err) {
    next(err);
  }
};

// Publish a trip's itinerary
const publishPlan = async (req, res, next) => {
  try {
    const { tripId } = req.body;
    if (!tripId) return res.status(400).json({ success: false, message: 'tripId is required.' });

    const trip = await Trip.findById(tripId).populate('host', 'name');
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });

    // Only members or hosts can publish
    const isHost = (trip.host?._id || trip.host).toString() === req.user._id.toString();
    const isMember = trip.members?.some(m => (m.user?._id || m.user).toString() === req.user._id.toString());
    if (!isHost && !isMember) {
      return res.status(403).json({ success: false, message: 'Only members of this trip can share this plan.' });
    }

    if (!trip.itinerary?.days?.length) {
      return res.status(400).json({ success: false, message: 'Cannot share a plan with an empty itinerary.' });
    }

    // Clean and prepare itinerary to exclude private references (like expenses)
    const cleanedDays = trip.itinerary.days.map(day => ({
      label: day.label,
      stops: (day.stops || []).map(stop => ({
        name: stop.name,
        time: stop.time,
        category: stop.category,
        notes: stop.notes,
      }))
    }));

    // Find if already published, update or create
    let publicPlan = await PublicPlan.findOne({ originalTrip: trip._id });
    if (publicPlan) {
      publicPlan.name = trip.name;
      publicPlan.destination = trip.destination;
      publicPlan.description = trip.description;
      publicPlan.coverColor = trip.coverColor;
      publicPlan.itinerary = { days: cleanedDays };
      await publicPlan.save();
    } else {
      publicPlan = new PublicPlan({
        name: trip.name,
        destination: trip.destination,
        description: trip.description,
        coverColor: trip.coverColor,
        authorName: trip.host?.name || 'Splito Traveler',
        itinerary: { days: cleanedDays },
        creator: req.user._id,
        originalTrip: trip._id,
      });
      await publicPlan.save();
    }

    res.json({ success: true, message: 'Plan shared to Landing Page successfully!', plan: publicPlan });
  } catch (err) {
    next(err);
  }
};

// Toggle like a public plan
const likePlan = async (req, res, next) => {
  try {
    const plan = await PublicPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Public plan not found.' });

    const userId = req.user._id;
    const likedIndex = plan.likedBy.indexOf(userId);

    if (likedIndex >= 0) {
      // Unlike
      plan.likedBy.splice(likedIndex, 1);
      plan.likes = Math.max(0, plan.likes - 1);
    } else {
      // Like
      plan.likedBy.push(userId);
      plan.likes += 1;
    }

    await plan.save();
    res.json({ success: true, likes: plan.likes, liked: likedIndex < 0 });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPublicPlans,
  publishPlan,
  likePlan,
};
