const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
console.log('Connecting to database...');

mongoose.connect(uri)
  .then(async () => {
    console.log('Connected!');
    
    // Find all expenses in the DB
    const Expense = mongoose.model('Expense', new mongoose.Schema({}, { strict: false }));
    const expenses = await Expense.find({}).lean();
    console.log(`Total expenses in DB: ${expenses.length}`);
    expenses.forEach(e => {
      console.log(`ID: ${e._id}, Title: ${e.title}, Amount: ${e.amount}, Trip: ${e.trip}, AddedBy: ${e.addedBy}, PaidBy: ${JSON.stringify(e.paidBy)}`);
    });
    
    await mongoose.disconnect();
    console.log('Disconnected.');
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });
