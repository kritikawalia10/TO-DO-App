const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const aiRoutes = require('./routes/aiRoutes');
const pomodoroRoutes = require('./routes/pomodoroRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/pomodoro', pomodoroRoutes);

// Basic root route to avoid 404 on '/'
app.get('/', (req, res) => res.send('Todo React API')); 

// Respond to Chrome DevTools discovery request to avoid CSP/connect errors in devtools
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
	// Return no content to satisfy the client
	res.status(204).end();
});

// avoid 404 spam for favicon requests in dev
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.use(errorHandler);

module.exports = app;
