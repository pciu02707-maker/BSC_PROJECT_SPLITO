const mongoose = require('mongoose');

const publicItineraryStopSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  time: { type: String, default: '', trim: true },
  category: {
    type: String,
    enum: ['sightseeing', 'food', 'hotel', 'transport', 'activity', 'other'],
    default: 'sightseeing',
  },
  notes: { type: String, default: '', trim: true },
});

const publicItineraryDaySchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true },
  stops: [publicItineraryStopSchema],
});

const publicPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    destination: { type: String, default: '', trim: true },
    coverColor: { type: String, default: '#bf654d' },
    authorName: { type: String, required: true },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    itinerary: {
      days: [publicItineraryDaySchema],
    },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    originalTrip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PublicPlan', publicPlanSchema);
