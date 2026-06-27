const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      enum: [
        'expense_added',
        'expense_edited',
        'expense_deleted',
        'member_joined',
        'member_left',
        'trip_created',
        'trip_closed',
        'trip_locked',
        'itinerary_updated',
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed, // extra data (expense amount, etc.)
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Activity', activitySchema);
