const dbConfig = require('../config/db');

const listNotifications = async (req, res, next) => {
  try {
    if (dbConfig.lowdb) {
      const notifications = dbConfig.lowdb.getNotifications(req.userId || (req.user && req.user.id));
      return res.json(notifications);
    }
    const Notification = require('../models/Notification');
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) { next(err); }
};

const markRead = async (req, res, next) => {
  try {
    if (dbConfig.lowdb) {
      await dbConfig.lowdb.markNotificationRead(req.params.id);
      return res.status(204).send();
    }
    const Notification = require('../models/Notification');
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.status(204).send();
  } catch (err) { next(err); }
};

module.exports = { listNotifications, markRead };
