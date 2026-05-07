const dbConfig = require('../config/db');

exports.createSession = async (req, res, next) => {
  try {
    const { taskId, durationSeconds, startedAt, endedAt, phase } = req.body || {};
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const payload = { userId: req.userId, taskId: taskId || null, durationSeconds: durationSeconds || 0, startedAt: startedAt || new Date().toISOString(), endedAt: endedAt || new Date().toISOString(), phase: phase || 'work' };
    if (dbConfig.lowdb) {
      const created = dbConfig.lowdb.createPomodoroSession(payload);
      return res.json(created);
    }
    // If using mongoose, implement a session model (not present), fallback
    return res.status(501).json({ message: 'Pomodoro sessions not implemented for mongoose' });
  } catch (err) { next(err); }
};

exports.listSessions = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (dbConfig.lowdb) {
      const items = dbConfig.lowdb.getPomodoroSessions({ userId });
      return res.json({ sessions: items });
    }
    return res.status(501).json({ message: 'Pomodoro sessions not implemented for mongoose' });
  } catch (err) { next(err); }
};
