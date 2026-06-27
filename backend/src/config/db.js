const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MONGODB_URI is missing. Add it to backend/.env.');
    }

    const conn = await mongoose.connect(mongoUri, {
      dbName: 'splito',
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    if (error.message.includes('querySrv')) {
      console.error('Hint: MongoDB Atlas SRV lookup failed. Check your network/DNS, Atlas cluster hostname, or use the standard connection string from Atlas.');
    }

    process.exit(1);
  }
};

module.exports = connectDB;
