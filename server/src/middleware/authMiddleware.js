const jwt = require('jsonwebtoken');
const dbConfig = require('../config/db');

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    // support lowdb or mongoose
    if (dbConfig.lowdb) {
      const user = dbConfig.lowdb.getUserById(payload.id);
      if (!user) return res.status(401).json({ message: 'Invalid token' });
      req.user = user;
      req.userId = user.id;
      req.userRole = user.role;
    } else {
      const User = require('../models/User');
      const user = await User.findById(payload.id).select('-password');
      if (!user) return res.status(401).json({ message: 'Invalid token' });
      req.user = user;
      req.userId = user._id;
      req.userRole = user.role;
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const permit = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.userRole || req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  next();
};

module.exports = { auth, permit };
