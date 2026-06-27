const Expense = require('../models/Expense');
const Trip = require('../models/Trip');
const Activity = require('../models/Activity');
const { emitToTrip } = require('../socket/socket');

const canAccess = (trip, userId) => {
  const uid = userId.toString();
  const hostId = (trip.host?._id || trip.host)?.toString();
  return hostId === uid || trip.members?.some(m => (m.user?._id || m.user)?.toString() === uid);
};

const populateExpense = (query) =>
  query
    .populate('paidBy.user', 'name avatar email')
    .populate('participants.user', 'name avatar email')
    .populate('addedBy', 'name');

// GET /api/expenses/trip/:tripId
const getExpensesByTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });
    if (!canAccess(trip, req.user._id)) return res.status(403).json({ success: false, message: 'Access denied.' });

    const expenses = await populateExpense(
      Expense.find({ trip: req.params.tripId }).sort({ createdAt: -1 })
    );
    res.json({ success: true, expenses });
  } catch (err) { next(err); }
};

// GET /api/expenses/:id
const getExpenseById = async (req, res, next) => {
  try {
    const expense = await populateExpense(Expense.findById(req.params.id));
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found.' });
    const trip = await Trip.findById(expense.trip);
    if (!canAccess(trip, req.user._id)) return res.status(403).json({ success: false, message: 'Access denied.' });
    res.json({ success: true, expense });
  } catch (err) { next(err); }
};

// POST /api/expenses
const createExpense = async (req, res, next) => {
  try {
    const { tripId, title, amount, paidBy, participants, splitType, category, note } = req.body;

    if (!tripId || !title || !amount || !paidBy?.length || !participants?.length) {
      return res.status(400).json({ success: false, message: 'tripId, title, amount, paidBy[], and participants[] are required.' });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });
    if (trip.status !== 'active') return res.status(400).json({ success: false, message: 'Cannot add expenses to a locked or closed trip.' });
    if (!canAccess(trip, req.user._id)) return res.status(403).json({ success: false, message: 'Access denied.' });

    // Validate paidBy amounts sum to total
    const paidTotal = paidBy.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
    if (Math.abs(paidTotal - parseFloat(amount)) > 0.01) {
      return res.status(400).json({ success: false, message: `Payer amounts (${paidTotal.toFixed(2)}) must equal total amount (${amount}).` });
    }

    if (splitType === 'custom') {
      const shareTotal = participants.reduce((s, p) => s + (parseFloat(p.share) || 0), 0);
      if (Math.abs(shareTotal - parseFloat(amount)) > 0.01) {
        return res.status(400).json({ success: false, message: `Custom shares (${shareTotal.toFixed(2)}) must equal total amount (${amount}).` });
      }
    }

    const expense = await Expense.create({
      trip: tripId, title,
      amount: parseFloat(amount),
      paidBy: paidBy.map(p => ({ user: p.user, amount: parseFloat(p.amount) })),
      participants,
      splitType: splitType || 'equal',
      category: category || 'other',
      note: note || '',
      addedBy: req.user._id,
    });

    const populated = await populateExpense(Expense.findById(expense._id));

    // Build readable payer names for activity
    const payerNames = paidBy.length === 1
      ? req.user.name
      : `${paidBy.length} people`;

    await Activity.create({
      trip: tripId, user: req.user._id, type: 'expense_added',
      message: `${req.user.name} added "${title}" — ${trip.currency} ${amount} (paid by ${payerNames})`,
      meta: { amount, category },
    });

    const io = req.app.get('io');
    emitToTrip(io, tripId, 'expense:added', { expense: populated });
    emitToTrip(io, tripId, 'balance:updated', { tripId });

    res.status(201).json({ success: true, expense: populated });
  } catch (err) { next(err); }
};

// PUT /api/expenses/:id
const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found.' });

    const trip = await Trip.findById(expense.trip);
    if (trip.status !== 'active') return res.status(400).json({ success: false, message: 'Cannot edit expenses in a locked or closed trip.' });

    const isHostOrCreator =
      (trip.host?._id || trip.host)?.toString() === req.user._id.toString() ||
      expense.addedBy?.toString() === req.user._id.toString();
    if (!isHostOrCreator) return res.status(403).json({ success: false, message: 'Only the expense creator or trip host can edit this.' });

    const { title, amount, paidBy, participants, splitType, category, note } = req.body;

    if (title) expense.title = title;
    if (amount) expense.amount = parseFloat(amount);
    if (paidBy?.length) {
      const paidTotal = paidBy.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
      const totalAmt = parseFloat(amount || expense.amount);
      if (Math.abs(paidTotal - totalAmt) > 0.01) {
        return res.status(400).json({ success: false, message: `Payer amounts (${paidTotal.toFixed(2)}) must equal total (${totalAmt}).` });
      }
      expense.paidBy = paidBy.map(p => ({ user: p.user, amount: parseFloat(p.amount) }));
    }
    if (participants) expense.participants = participants;
    if (splitType) expense.splitType = splitType;
    if (category) expense.category = category;
    if (note !== undefined) expense.note = note;

    await expense.save();
    const populated = await populateExpense(Expense.findById(expense._id));

    await Activity.create({
      trip: expense.trip, user: req.user._id, type: 'expense_edited',
      message: `${req.user.name} edited "${expense.title}"`,
      meta: { amount: expense.amount },
    });

    const io = req.app.get('io');
    emitToTrip(io, expense.trip.toString(), 'expense:updated', { expense: populated });
    emitToTrip(io, expense.trip.toString(), 'balance:updated', { tripId: expense.trip });

    res.json({ success: true, expense: populated });
  } catch (err) { next(err); }
};

// DELETE /api/expenses/:id
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found.' });

    const trip = await Trip.findById(expense.trip);
    if (trip.status !== 'active') return res.status(400).json({ success: false, message: 'Cannot delete from a locked/closed trip.' });

    const isHostOrCreator =
      (trip.host?._id || trip.host)?.toString() === req.user._id.toString() ||
      expense.addedBy?.toString() === req.user._id.toString();
    if (!isHostOrCreator) return res.status(403).json({ success: false, message: 'Only the creator or host can delete this.' });

    const tripId = expense.trip.toString();
    const title = expense.title;
    await expense.deleteOne();

    await Activity.create({
      trip: tripId, user: req.user._id, type: 'expense_deleted',
      message: `${req.user.name} deleted "${title}"`,
    });

    const io = req.app.get('io');
    emitToTrip(io, tripId, 'expense:deleted', { expenseId: req.params.id });
    emitToTrip(io, tripId, 'balance:updated', { tripId });

    res.json({ success: true, message: 'Expense deleted.' });
  } catch (err) { next(err); }
};

module.exports = { getExpensesByTrip, getExpenseById, createExpense, updateExpense, deleteExpense };
