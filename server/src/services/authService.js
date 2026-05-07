const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dbConfig = require('../config/db');

const register = async ({ name, email, password }) => {
  if (dbConfig.lowdb) {
    const existing = dbConfig.lowdb.getUserByEmail(email);
    if (existing) throw new Error('Email already in use');
    const hashed = await bcrypt.hash(password, 10);
    const user = dbConfig.lowdb.createUser({ name, email, password: hashed, role: 'user' });
    const { password: _p, ...safe } = user;
    return safe;
  }

  const User = require('../models/User');
  const existing = await User.findOne({ email });
  if (existing) throw new Error('Email already in use');
  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed });
  const safeUser = user.toObject();
  delete safeUser.password;
  return safeUser;
};

const login = async ({ email, password }) => {
  if (dbConfig.lowdb) {
    const user = dbConfig.lowdb.getUserByEmail(email);
    if (!user) { const err = new Error('Invalid credentials'); err.status = 401; throw err; }
    const match = await bcrypt.compare(password, user.password);
    if (!match) { const err = new Error('Invalid credentials'); err.status = 401; throw err; }
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    const { password: _p, ...safe } = user;
    return { user: safe, token };
  }

  const User = require('../models/User');
  const user = await User.findOne({ email });
  if (!user) { const err = new Error('Invalid credentials'); err.status = 401; throw err; }
  const match = await bcrypt.compare(password, user.password);
  if (!match) { const err = new Error('Invalid credentials'); err.status = 401; throw err; }
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
  const safeUser = user.toObject();
  delete safeUser.password;
  return { user: safeUser, token };
};

module.exports = { register, login };
