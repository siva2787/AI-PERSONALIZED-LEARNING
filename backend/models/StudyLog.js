const mongoose = require('mongoose');

// ── IST date helper ─────────────────────────────────────────────────────────
// Returns today's date as "YYYY-MM-DD" in Asia/Kolkata (IST = UTC+5:30)
// Stored as a plain string — zero timezone confusion on read
function getTodayIST() {
    const now = new Date();
    const ist = new Date(now.getTime() + 330 * 60 * 1000); // +5h30m
    return ist.toISOString().slice(0, 10);
}

const studyLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    date: {
        type: String,           // "YYYY-MM-DD" IST — not a Date object
        required: true,
        default: getTodayIST,
    },
    studiedToday: {
        type: Boolean,
        required: true,
        default: true,
    },
    studyHours: {
        type: Number,
        min: 0,
        max: 24,
        default: null,
    },
    topic: {
        type: String,
        trim: true,
        default: '',
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium',
    },
}, { timestamps: true });

// One entry per user per day — enforce at DB level
studyLogSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('StudyLog', studyLogSchema);
module.exports.getTodayIST = getTodayIST;