const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late'],
    required: true,
    default: 'absent',
  },
  subject: {
    type: String,
    default: 'General',
  },
  markedBy: {
    type: String,
    default: 'QR',
  },
  qrCode: {
    type: String,
    default: '',
  },
  sessionId: {
    type: String,
    default: '',
  },
}, { timestamps: true });

attendanceSchema.index({ student: 1, date: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);


// ── QR Session Schema ─────────────────────────────────────────────
const qrSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

module.exports.QRSession = mongoose.model('QRSession', qrSessionSchema);