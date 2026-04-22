const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Task description is required'],
  },
  subject: {
    type: String,
    default: 'General',
  },
  type: {
    type: String,
    enum: ['generative', 'quiz', 'essay', 'project', 'reading'],
    default: 'generative',
  },
  status: {
    type: String,
    enum: ['new', 'in_progress', 'completed'],
    default: 'new',
  },
  prompt: {
    type: String,
    default: '',
  },
  resources: [
    {
      name: String,
      url: String,
    },
  ],
  response: {
    type: String,
    default: '',
  },
  dueDate: {
    type: Date,
  },
  submittedAt: {
    type: Date,
  },
  score: {
    type: Number,
    default: null,
  },
  feedback: {
    type: String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
