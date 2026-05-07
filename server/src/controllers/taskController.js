const taskService = require('../services/taskService');
const { sendMail } = require('../utils/mailer');
const dbConfig = require('../config/db');

const createTask = async (req, res, next) => {
  try {
    const task = await taskService.createTask(req.body, req.userId || (req.user && req.user._id));
    // Emit socket event to notify clients
    const io = req.app.get('io');
    try { io.to(String(req.userId || (req.user && req.user._id))).emit('taskCreated', task); } catch (e) {}
    // If assignedTo, create notification and send email (best-effort)
    if (task.assignedTo) {
      const notifPayload = { user: task.assignedTo, type: 'assigned', message: `You were assigned task: ${task.title}`, data: { taskId: task._id || task.id } };
      if (dbConfig.getIsLowDB()) dbConfig.lowdb.createNotification(notifPayload);
      else {
        const Notification = require('../models/Notification');
        await Notification.create(notifPayload);
      }
      try {
        // fetch assigned user email
        const User = require('../models/User');
        let assigned;
        const dbConfig = require('../config/db');
        if (dbConfig.getIsLowDB()) assigned = dbConfig.lowdb.getUserById(task.assignedTo);
        else assigned = await User.findById(task.assignedTo);
        if (assigned && assigned.email) await sendMail({ to: assigned.email, subject: 'New Task Assigned', text: `You were assigned: ${task.title}` });
      } catch (e) { console.warn('Mail error', e); }
    }

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
};

const listTasks = async (req, res, next) => {
  try {
    const userId = req.userId || (req.user && req.user._id);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const result = await taskService.getTasks(req.query, userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const getTask = async (req, res, next) => {
  try {
    const userId = req.userId || (req.user && req.user._id);
    const task = await taskService.getTaskById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Not found' });
    // Ownership check for lowdb/mongo (task may have createdBy or user id)
    if (userId && task.createdBy && String(task.createdBy) !== String(userId)) return res.status(403).json({ message: 'Forbidden' });
    res.json(task);
  } catch (err) { next(err); }
};

const updateTask = async (req, res, next) => {
  try {
    const task = await taskService.updateTask(req.params.id, req.body);
    const io = req.app.get('io');
    io.emit('taskUpdated', task);
    res.json(task);
  } catch (err) {
    next(err);
  }
};

const removeTask = async (req, res, next) => {
  try {
    await taskService.deleteTask(req.params.id);
    const io = req.app.get('io');
    io.emit('taskDeleted', { id: req.params.id });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = { createTask, listTasks, getTask, updateTask, removeTask };
