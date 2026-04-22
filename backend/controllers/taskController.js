const Task = require('../models/Task');

// @desc    Get all my tasks
// @route   GET /api/tasks
// @access  Private
const getMyTasks = async (req, res) => {
  try {
    const { status, subject, type } = req.query;
    const query = { student: req.user._id };
    if (status) query.status = status;
    if (subject) query.subject = subject;
    if (type) query.type = type;

    const tasks = await Task.find(query).sort({ createdAt: -1 });

    const stats = {
      total: tasks.length,
      new: tasks.filter(t => t.status === 'new').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
    };

    res.json({ success: true, tasks, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, student: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  try {
    const task = await Task.create({ ...req.body, student: req.user._id });
    res.status(201).json({ success: true, message: 'Task created', task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update task (save progress or submit)
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const { response, status } = req.body;
    const update = { ...req.body };

    if (status === 'completed' && !req.body.submittedAt) {
      update.submittedAt = new Date();
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, student: req.user._id },
      update,
      { new: true, runValidators: true }
    );

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    res.json({ success: true, message: 'Task updated', task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Submit task
// @route   POST /api/tasks/:id/submit
// @access  Private
const submitTask = async (req, res) => {
  try {
    const { response } = req.body;
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, student: req.user._id },
      { response, status: 'completed', submittedAt: new Date() },
      { new: true }
    );
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, message: 'Task submitted successfully!', task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, student: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getMyTasks, getTask, createTask, updateTask, submitTask, deleteTask };
