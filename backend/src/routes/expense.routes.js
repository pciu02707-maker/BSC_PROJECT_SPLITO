const express = require('express');
const router = express.Router();
const {
  getExpensesByTrip,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
} = require('../controllers/expense.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/trip/:tripId', getExpensesByTrip);
router.get('/:id', getExpenseById);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
