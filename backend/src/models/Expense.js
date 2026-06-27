const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  share: { type: Number, default: 0 },
});

// Multiple payers: each payer paid a specific portion
const payerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 0 },
});

const expenseSchema = new mongoose.Schema(
  {
    trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    title: { type: String, required: [true, 'Expense title is required'], trim: true },
    amount: { type: Number, required: [true, 'Amount is required'], min: [0.01, 'Amount must be > 0'] },
    // paidBy is now an array — one OR multiple payers
    paidBy: [payerSchema],
    participants: [participantSchema],
    splitType: { type: String, enum: ['equal', 'custom'], default: 'equal' },
    category: {
      type: String,
      enum: ['food', 'hotel', 'transport', 'entertainment', 'shopping', 'other'],
      default: 'other',
    },
    note: { type: String, default: '', trim: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);
