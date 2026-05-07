require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connectDB } = require('./config/db');

const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

// Attach Socket.IO
const { Server } = require('socket.io');
const io = new Server(server, { cors: { origin: '*' } });
app.set('io', io);

io.on('connection', (socket) => {
  console.log('Socket connected', socket.id);
  socket.on('joinTask', (taskId) => socket.join(taskId));
  socket.on('leaveTask', (taskId) => socket.leave(taskId));
  socket.on('disconnect', () => {});
});

const start = async () => {
  await connectDB();
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

// Periodic check for tasks nearing due date -> create notifications
const taskService = require('./services/taskService');
const dbConfig = require('./config/db');
let NotificationModel;
try { NotificationModel = require('./models/Notification'); } catch (e) { NotificationModel = null; }

const checkDueTasks = async () => {
  try {
    // notify thresholds in hours (defaults: 24 and 12)
    const thresholds = (process.env.NOTIFY_THRESHOLDS || '24,12').split(',').map(x => parseInt(x, 10)).filter(Boolean).sort((a,b)=>b-a);
    const { tasks } = await taskService.getTasks({ limit: 10000 });
    const now = new Date();
    for (const task of tasks) {
      if (!task || !task.dueDate) continue;
      const due = new Date(task.dueDate);
      if (due <= now) continue; // already past
      const hours = (due - now) / (1000 * 60 * 60);
      const userId = task.assignedTo || task.createdBy;
      if (!userId) continue;

      for (const thresholdHours of thresholds) {
        // create notification when we are within this threshold and haven't already created one for this (task,threshold)
        if (hours <= thresholdHours) {
          // check existing notification for that threshold
          let already = false;
          if (dbConfig.getIsLowDB()) {
            const notifs = dbConfig.lowdb.getNotifications(userId) || [];
            already = notifs.some(n => n.type === 'due_soon' && n.data && (n.data.taskId === (task.id || task._id)) && n.data.threshold === thresholdHours);
          } else if (NotificationModel) {
            const found = await NotificationModel.findOne({ user: userId, type: 'due_soon', 'data.taskId': task._id || task.id, 'data.threshold': thresholdHours });
            already = !!found;
          }
          if (already) continue;

          const message = `Task \"${task.title}\" is due in ${Math.ceil(hours)} hour(s)`;
          const payload = { user: userId, type: 'due_soon', message, data: { taskId: task._id || task.id, threshold: thresholdHours } };

          if (dbConfig.getIsLowDB()) dbConfig.lowdb.createNotification(payload);
          else if (NotificationModel) await NotificationModel.create(payload);

          // emit via socket to the user room
          try { io.to(String(userId)).emit('taskDueSoon', payload); } catch (e) {}
        }
      }
    }
  } catch (e) { console.error('Due-check error', e); }
};

start().then(() => {
  // run on startup and then periodically (after DB connected)
  checkDueTasks();
  const intervalMin = parseInt(process.env.NOTIFY_INTERVAL_MIN || '10', 10);
  setInterval(checkDueTasks, Math.max(1, intervalMin) * 60 * 1000);
}).catch(err => {
  console.error('Server failed to start', err);
});
