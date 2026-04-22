const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Score title is required'],
    trim: true,
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['assignment', 'quiz', 'exam', 'project'],
    required: true,
  },
  score: {
    type: Number,
    required: true,
    min: 0,
  },
  maxScore: {
    type: Number,
    required: true,
    default: 100,
  },
  gradingPeriod: {
    type: String,
    default: 'Q1',
  },
  dueDate: {
    type: Date,
  },
  feedback: {
    type: String,
    default: '',
  },
}, { timestamps: true });

// Virtual: percentage
scoreSchema.virtual('percentage').get(function () {
  return ((this.score / this.maxScore) * 100).toFixed(1);
});

// Virtual: letter grade
scoreSchema.virtual('letterGrade').get(function () {
  const pct = (this.score / this.maxScore) * 100;
  if (pct >= 93) return 'A';
  if (pct >= 90) return 'A-';
  if (pct >= 87) return 'B+';
  if (pct >= 83) return 'B';
  if (pct >= 80) return 'B-';
  if (pct >= 77) return 'C+';
  if (pct >= 73) return 'C';
  if (pct >= 70) return 'C-';
  if (pct >= 60) return 'D';
  return 'F';
});

scoreSchema.set('toJSON', { virtuals: true });
scoreSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Score', scoreSchema);
