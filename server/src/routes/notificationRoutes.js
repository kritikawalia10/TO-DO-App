const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');
const { listNotifications, markRead } = require('../controllers/notificationController');

router.use(auth);
router.get('/', listNotifications);
router.put('/:id/read', markRead);

module.exports = router;
