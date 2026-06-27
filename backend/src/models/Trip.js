const mongoose = require('mongoose');
const { generateInviteCode } = require('../utils/generateCode');

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  joinedAt: { type: Date, default: Date.now },
  role: { type: String, enum: ['host', 'member'], default: 'member' },
});

const itineraryStopSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  time: { type: String, default: '', trim: true },
  category: {
    type: String,
    enum: ['sightseeing', 'food', 'hotel', 'transport', 'activity', 'other'],
    default: 'sightseeing',
  },
  notes: { type: String, default: '', trim: true },
  expense: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense', default: null },
  completed: { type: Boolean, default: false },
}, { timestamps: true });

const itineraryDaySchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true },
  date: { type: Date },
  stops: [itineraryStopSchema],
}, { timestamps: true });

const tripSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Trip name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    destination: {
      type: String,
      default: '',
      trim: true,
    },
    currency: {
      type: String,
      default: 'BDT',
      uppercase: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [memberSchema],
    inviteCode: {
      type: String,
      unique: true,
      default: () => generateInviteCode(),
    },
    status: {
      type: String,
      enum: ['active', 'locked', 'closed'],
      default: 'active',
    },
    coverColor: {
      type: String,
      default: '#6366f1', // indigo default
    },
    startDate: { type: Date },
    endDate: { type: Date },
    itinerary: {
      days: [itineraryDaySchema],
    },
  },
  { timestamps: true }
);

// Virtual: get all member user IDs (including host)
tripSchema.virtual('allMemberIds').get(function () {
  return this.members.map((m) => m.user);
});

// Method: check if a user is a member
// Handles both populated (object) and non-populated (ObjectId) states
tripSchema.methods.isMember = function (userId) {
  return this.members.some((m) => {
    const id = m.user?._id ? m.user._id : m.user;
    return id.toString() === userId.toString();
  });
};

// Method: check if a user is the host
tripSchema.methods.isHost = function (userId) {
  const id = this.host?._id ? this.host._id : this.host;
  return id.toString() === userId.toString();
};

module.exports = mongoose.model('Trip', tripSchema);
