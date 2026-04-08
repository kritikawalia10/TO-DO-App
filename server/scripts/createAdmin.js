const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const bcrypt = require('bcryptjs');
const dbConfig = require('../src/config/db');

const run = async () => {
  if (process.env.USE_LOWDB === 'true') {
    dbConfig.lowdb.init();
    const existing = dbConfig.lowdb.getUserByEmail('admin@local');
    if (existing) return console.log('Admin already exists');
    const hashed = await bcrypt.hash('password', 10);
    dbConfig.lowdb.createUser({ name: 'Admin', email: 'admin@local', password: hashed, role: 'admin' });
    console.log('Admin created (lowdb)');
    process.exit(0);
  }

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/task_manager';
  await mongoose.connect(uri);
  const User = require('../src/models/User');
  const existing = await User.findOne({ email: 'admin@local' });
  if (existing) return console.log('Admin already exists');
  const hashed = await bcrypt.hash('password', 10);
  await User.create({ name: 'Admin', email: 'admin@local', password: hashed, role: 'admin' });
  console.log('Admin created');
  process.exit(0);
};

run().catch((e) => { console.error(e); process.exit(1); });
