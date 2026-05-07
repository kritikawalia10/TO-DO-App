const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');
const pomodoroController = require('../controllers/pomodoroController');

router.post('/', auth, pomodoroController.createSession);
router.get('/', auth, pomodoroController.listSessions);

module.exports = router;
