const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// POST /api/ai/parse-task
router.post('/parse-task', aiController.parseTask);

module.exports = router;
