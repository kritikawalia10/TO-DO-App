const dbConfig = require('../config/db');


// Basic auto-priority based on dueDate proximity
const computePriority = (dueDate) => {
  if (!dueDate) return 'low';
  const diff = new Date(dueDate) - new Date();
  const days = diff / (1000 * 60 * 60 * 24);
  if (days <= 1) return 'high';
  if (days <= 7) return 'medium';
  return 'low';
};

const createTask = async (payload, userId) => {
  if (payload.dueDate && !payload.priority) payload.priority = computePriority(payload.dueDate);
  payload.createdBy = userId;
  if (dbConfig.getIsLowDB()) {
    return dbConfig.lowdb.createTask(payload);
  }
  const Task = require('../models/Task');
  const task = await Task.create(payload);
  return task;
};

const updateTask = async (taskId, payload) => {
  if (payload.dueDate && !payload.priority) payload.priority = computePriority(payload.dueDate);
  if (dbConfig.getIsLowDB()) {
    return dbConfig.lowdb.updateTask(taskId, payload);
  }
  const Task = require('../models/Task');
  const task = await Task.findByIdAndUpdate(taskId, payload, { new: true });
  return task;
};

const deleteTask = async (taskId) => {
  if (dbConfig.getIsLowDB()) return dbConfig.lowdb.deleteTask(taskId);
  const Task = require('../models/Task');
  return await Task.findByIdAndDelete(taskId);
};

const getTasks = async ({ page = 1, limit = 20, search, tags, sortBy = 'createdAt', status, priority } = {}, userId) => {
  const query = {};
  if (search) query.title = { $regex: search, $options: 'i' };
  if (tags) query.tags = { $in: tags.split(',') };
  if (status) query.status = status;
  if (priority) query.priority = priority;

  // Pass userId to lowdb adapter so it can filter tasks by createdBy
  if (dbConfig.getIsLowDB()) return dbConfig.lowdb.getTasks({ page, limit, search, tags, sortBy, status, priority, userId });
  const skip = (page - 1) * limit;
  const Task = require('../models/Task');
  if (userId) query.createdBy = userId;
  const tasks = await Task.find(query).sort({ [sortBy]: -1 }).skip(skip).limit(parseInt(limit, 10));
  const total = await Task.countDocuments(query);
  return { tasks, total };
};

const getTaskById = async (id) => {
  if (dbConfig.getIsLowDB()) return dbConfig.lowdb.getTaskById(id);
  const Task = require('../models/Task');
  return await Task.findById(id);
};

module.exports = { createTask, updateTask, deleteTask, getTasks, getTaskById };


