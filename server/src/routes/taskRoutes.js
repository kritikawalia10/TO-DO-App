const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');
const { createTask, listTasks, getTask, updateTask, removeTask } = require('../controllers/taskController');

router.use(auth);

router.post('/', createTask);
router.get('/', listTasks);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', removeTask);

module.exports = router;
