const express = require('express');
const router = express.Router();
const { getMyTasks, getTask, createTask, updateTask, submitTask, deleteTask } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

router.get('/',              protect, getMyTasks);
router.post('/',             protect, createTask);
router.get('/:id',           protect, getTask);
router.put('/:id',           protect, updateTask);
router.post('/:id/submit',   protect, submitTask);
router.delete('/:id',        protect, deleteTask);

module.exports = router;
