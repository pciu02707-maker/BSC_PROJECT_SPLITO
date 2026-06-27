const Trip = require('../models/Trip');
const Expense = require('../models/Expense');
const Activity = require('../models/Activity');
const User = require('../models/User');
const { calculateBalances, optimizeSettlements, getMemberSummary } = require('../utils/balanceEngine');
const { emitToTrip } = require('../socket/socket');

// ─── Shared access helper ─────────────────────────────────────────────────────
const canAccessTrip = (trip, userId) => {
  const uid = userId.toString();
  const hostId = (trip.host?._id || trip.host)?.toString();
  const isMember = trip.members?.some(m => {
    const mid = (m.user?._id || m.user)?.toString();
    return mid === uid;
  });
  return hostId === uid || isMember;
};

const normalizeItinerary = (days = []) => ({
  days: days.map((day) => ({
    _id: day._id,
    label: (day.label || '').trim(),
    date: day.date || undefined,
    stops: (day.stops || []).map((stop) => ({
      _id: stop._id,
      name: (stop.name || '').trim(),
      time: stop.time || '',
      category: stop.category || 'sightseeing',
      notes: (stop.notes || '').trim(),
      expense: stop.expense || null,
      completed: Boolean(stop.completed),
    })).filter((stop) => stop.name),
  })).filter((day) => day.label),
});


// ─── GET /api/trips ───────────────────────────────────────────────────────────
// Get all trips where the current user is host or member
const getMyTrips = async (req, res, next) => {
  try {
    const trips = await Trip.find({
      'members.user': req.user._id,
    })
      .populate('host', 'name avatar email')
      .populate('members.user', 'name avatar email')
      .sort({ createdAt: -1 });

    // Attach expense count and total for each trip
    const tripsWithStats = await Promise.all(
      trips.map(async (trip) => {
        const expenses = await Expense.find({ trip: trip._id });
        const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
        return {
          ...trip.toObject(),
          expenseCount: expenses.length,
          totalAmount: Math.round(totalAmount * 100) / 100,
        };
      })
    );

    res.json({ success: true, trips: tripsWithStats });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/trips/:id ───────────────────────────────────────────────────────
const getTripById = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('host', 'name avatar email')
      .populate('members.user', 'name avatar email')
      .populate('itinerary.days.stops.expense', 'title amount category');

    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });

    const userId = req.user._id.toString();
    const isMember = trip.members.some(m => {
      const id = m.user?._id ? m.user._id.toString() : m.user.toString();
      return id === userId;
    });
    const isHost = (trip.host?._id ? trip.host._id.toString() : trip.host.toString()) === userId;

    if (!isMember && !isHost) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, trip });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/trips ──────────────────────────────────────────────────────────
const createTrip = async (req, res, next) => {
  try {
    const { name, description, destination, currency, coverColor, startDate, endDate } = req.body;

    if (!name) return res.status(400).json({ success: false, message: 'Trip name is required.' });

    const trip = await Trip.create({
      name,
      description,
      destination,
      currency: currency || 'BDT',
      coverColor: coverColor || '#6366f1',
      startDate,
      endDate,
      host: req.user._id,
      members: [{ user: req.user._id, role: 'host' }],
    });

    await Activity.create({
      trip: trip._id,
      user: req.user._id,
      type: 'trip_created',
      message: `${req.user.name} created the trip "${trip.name}"`,
    });

    const populated = await trip.populate('host members.user', 'name avatar email');
    res.status(201).json({ success: true, trip: populated });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/trips/:id ───────────────────────────────────────────────────────
const updateTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });
    if (!canAccessTrip(trip, req.user._id) || (trip.host?._id || trip.host)?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the host can edit this trip.' });
    }

    const { name, description, destination, currency, coverColor, startDate, endDate } = req.body;
    if (name) trip.name = name;
    if (description !== undefined) trip.description = description;
    if (destination !== undefined) trip.destination = destination;
    if (currency) trip.currency = currency;
    if (coverColor) trip.coverColor = coverColor;
    if (startDate) trip.startDate = startDate;
    if (endDate) trip.endDate = endDate;

    await trip.save();
    const populated = await trip.populate('host members.user', 'name avatar email');

    const io = req.app.get('io');
    emitToTrip(io, trip._id.toString(), 'trip:updated', { trip: populated });

    res.json({ success: true, trip: populated });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/trips/:id ────────────────────────────────────────────────────
// PATCH /api/trips/:id/itinerary
const updateTripItinerary = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });
    if (!canAccessTrip(trip, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (trip.status === 'closed') {
      return res.status(400).json({ success: false, message: 'Closed trips cannot be edited.' });
    }

    const incomingDays = req.body?.days;
    if (!Array.isArray(incomingDays)) {
      return res.status(400).json({ success: false, message: 'days must be an array.' });
    }

    const expenseIds = incomingDays.flatMap((day) => (day.stops || []).map((stop) => stop.expense).filter(Boolean));
    if (expenseIds.length) {
      const uniqueExpenseIds = [...new Set(expenseIds.map(String))];
      const foundExpenses = await Expense.countDocuments({ _id: { $in: uniqueExpenseIds }, trip: trip._id });
      if (foundExpenses !== uniqueExpenseIds.length) {
        return res.status(400).json({ success: false, message: 'Linked expenses must belong to this trip.' });
      }
    }

    trip.itinerary = normalizeItinerary(incomingDays);
    await trip.save();

    await Activity.create({
      trip: trip._id,
      user: req.user._id,
      type: 'itinerary_updated',
      message: `${req.user.name} updated the tour plan`,
    });

    const populated = await Trip.findById(trip._id)
      .populate('host', 'name avatar email')
      .populate('members.user', 'name avatar email')
      .populate('itinerary.days.stops.expense', 'title amount category');

    const io = req.app.get('io');
    emitToTrip(io, trip._id.toString(), 'trip:itinerary-updated', { trip: populated });

    res.json({ success: true, trip: populated });
  } catch (err) {
    next(err);
  }
};

const deleteTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });
    if ((trip.host?._id || trip.host)?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the host can delete this trip.' });
    }

    await Expense.deleteMany({ trip: trip._id });
    await Activity.deleteMany({ trip: trip._id });
    await trip.deleteOne();

    res.json({ success: true, message: 'Trip deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/trips/join ─────────────────────────────────────────────────────
const joinTrip = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) return res.status(400).json({ success: false, message: 'Invite code is required.' });

    const trip = await Trip.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!trip) return res.status(404).json({ success: false, message: 'Invalid invite code.' });
    if (trip.status === 'closed') return res.status(400).json({ success: false, message: 'This trip is closed.' });

    if (canAccessTrip(trip, req.user._id)) {
      return res.status(400).json({ success: false, message: 'You are already a member of this trip.' });
    }

    trip.members.push({ user: req.user._id, role: 'member' });
    await trip.save();

    await Activity.create({
      trip: trip._id,
      user: req.user._id,
      type: 'member_joined',
      message: `${req.user.name} joined the trip`,
    });

    const populated = await trip.populate('host members.user', 'name avatar email');
    const io = req.app.get('io');
    emitToTrip(io, trip._id.toString(), 'member:joined', { user: req.user, trip: populated });

    res.json({ success: true, trip: populated });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/trips/:id/leave ────────────────────────────────────────────────
const leaveTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });
    const leaveUid = req.user._id.toString();
    const tripHostId = (trip.host?._id || trip.host)?.toString();
    if (tripHostId === leaveUid) {
      return res.status(400).json({ success: false, message: 'Host cannot leave. Delete or transfer the trip.' });
    }
    const isTripMember = trip.members?.some(m => (m.user?._id || m.user)?.toString() === leaveUid);
    if (!isTripMember) {
      return res.status(400).json({ success: false, message: 'You are not a member of this trip.' });
    }

    trip.members = trip.members.filter((m) => (m.user?._id || m.user)?.toString() !== leaveUid);
    await trip.save();

    await Activity.create({
      trip: trip._id,
      user: req.user._id,
      type: 'member_left',
      message: `${req.user.name} left the trip`,
    });

    const io = req.app.get('io');
    emitToTrip(io, trip._id.toString(), 'member:left', { userId: req.user._id });

    res.json({ success: true, message: 'You left the trip.' });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/trips/:id/remove-member ───────────────────────────────────────
const removeMember = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });
    if ((trip.host?._id || trip.host)?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the host can remove members.' });
    }

    const { memberId } = req.body;
    if (!memberId) return res.status(400).json({ success: false, message: 'memberId is required.' });

    trip.members = trip.members.filter((m) => m.user.toString() !== memberId);
    await trip.save();

    const io = req.app.get('io');
    emitToTrip(io, trip._id.toString(), 'member:left', { userId: memberId });

    res.json({ success: true, message: 'Member removed.' });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/trips/:id/status ─────────────────────────────────────────────
const updateTripStatus = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });
    if ((trip.host?._id || trip.host)?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the host can change the trip status.' });
    }

    const { status } = req.body;
    if (!['active', 'locked', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Use: active, locked, closed.' });
    }

    trip.status = status;
    await trip.save();

    const typeMap = { locked: 'trip_locked', closed: 'trip_closed' };
    if (typeMap[status]) {
      await Activity.create({
        trip: trip._id,
        user: req.user._id,
        type: typeMap[status],
        message: `${req.user.name} ${status} the trip`,
      });
    }

    const io = req.app.get('io');
    emitToTrip(io, trip._id.toString(), `trip:${status}`, { tripId: trip._id, status });

    res.json({ success: true, trip });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/trips/:id/balances ──────────────────────────────────────────────
const getTripBalances = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id).populate('members.user', 'name avatar email');
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });
    if (!canAccessTrip(trip, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const expenses = await Expense.find({ trip: trip._id })
      .populate('paidBy', 'name avatar')
      .populate('participants.user', 'name avatar');

    const members = trip.members.map((m) => m.user);
    const balances = calculateBalances(expenses);
    const settlements = optimizeSettlements(balances, members);
    const summary = getMemberSummary(expenses, members);
    const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);

    res.json({
      success: true,
      balances,
      settlements,
      summary,
      totalExpense: Math.round(totalExpense * 100) / 100,
      currency: trip.currency,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/trips/:id/activities ───────────────────────────────────────────
const getTripActivities = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });

    const activities = await Activity.find({ trip: req.params.id })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, activities });
  } catch (err) {
    next(err);
  }
};

module.exports = {
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
};
