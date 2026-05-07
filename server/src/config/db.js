const dotenv = require('dotenv');
dotenv.config();

// Try to use MongoDB by default; if it fails, fall back to LowDB (developer friendly)
const mongoose = require('mongoose');
const lowdb = require('../lib/lowdbAdapter');
let isLowDB = false;

const connectDB = async () => {
  // If explicitly requested, use LowDB immediately
  if (process.env.USE_LOWDB === 'true') {
    lowdb.init();
    isLowDB = true;
    console.log('LowDB initialized at', process.env.LOWDB_PATH || 'data/db.json');
    return { lowdb };
  }

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/task_manager';
  try {
    await mongoose.connect(uri, { autoIndex: true });
    console.log('MongoDB connected');
    return { mongoose };
  } catch (err) {
    console.warn('MongoDB connection error - falling back to LowDB', err.message || err);
    try {
      lowdb.init();
      isLowDB = true;
      console.log('LowDB initialized at', process.env.LOWDB_PATH || 'data/db.json');
      return { lowdb };
    } catch (e) {
      console.error('LowDB initialization failed', e);
      process.exit(1);
    }
  }
};

module.exports = { connectDB, lowdb, getIsLowDB: () => isLowDB };
