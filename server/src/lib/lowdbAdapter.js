const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const { randomUUID } = require('crypto');
const fs = require('fs');

const DB_PATH = process.env.LOWDB_PATH || path.join(__dirname, '..', '..', 'data', 'db.json');

const ensureDbDir = () => {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

let db;

const init = () => {
  ensureDbDir();
  const adapter = new FileSync(DB_PATH);
  db = low(adapter);
  db.defaults({ users: [], tasks: [], notifications: [], pomodoroSessions: [] }).write();
};

const getUserByEmail = (email) => db.get('users').find({ email }).value();
const getUserById = (id) => db.get('users').find({ id }).value();
const createUser = (user) => {
  const id = randomUUID();
  const data = { id, ...user };
  db.get('users').push(data).write();
  return data;
};

const createTask = (payload) => {
  const id = randomUUID();
  const data = { id, ...payload, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  db.get('tasks').push(data).write();
  return data;
};

const updateTask = (id, payload) => {
  db.get('tasks').find({ id }).assign({ ...payload, updatedAt: new Date().toISOString() }).write();
  return db.get('tasks').find({ id }).value();
};

const deleteTask = (id) => db.get('tasks').remove({ id }).write();

const getTasks = ({ page = 1, limit = 20, search, tags, sortBy = 'createdAt', status, priority, userId } = {}) => {
  let coll = db.get('tasks');
  if (userId) coll = coll.filter(t => String(t.createdBy) === String(userId));
  if (search) coll = coll.filter(t => t.title && t.title.toLowerCase().includes(search.toLowerCase()));
  if (tags) {
    const arr = tags.split(',');
    coll = coll.filter(t => t.tags && t.tags.some(tag => arr.includes(tag)));
  }
  if (status) coll = coll.filter({ status });
  if (priority) coll = coll.filter({ priority });
  const total = coll.size().value();
  const items = coll.orderBy([sortBy], ['desc']).slice((page - 1) * limit, (page - 1) * limit + Number(limit)).value();
  return { tasks: items, total };
};

const getTaskById = (id) => db.get('tasks').find(t => t.id === id || t._id === id).value();

const createNotification = (payload) => {
  const id = randomUUID();
  const data = { id, ...payload, read: false, createdAt: new Date().toISOString() };
  db.get('notifications').push(data).write();
  return data;
};

const createPomodoroSession = (payload) => {
  const id = randomUUID();
  const data = { id, ...payload, createdAt: new Date().toISOString() };
  db.get('pomodoroSessions').push(data).write();
  return data;
};

const getPomodoroSessions = ({ userId } = {}) => {
  let coll = db.get('pomodoroSessions');
  if (userId) coll = coll.filter({ userId });
  return coll.orderBy(['createdAt'], ['desc']).value();
};

const getNotifications = (userId) => db.get('notifications').filter({ user: userId }).orderBy(['createdAt'], ['desc']).value();
const markNotificationRead = (id) => db.get('notifications').find({ id }).assign({ read: true }).write();

module.exports = {
  init,
  getUserByEmail,
  getUserById,
  createUser,
  createTask,
  updateTask,
  deleteTask,
  getTasks,
  getTaskById,
  createNotification,
  getNotifications,
  markNotificationRead
};
