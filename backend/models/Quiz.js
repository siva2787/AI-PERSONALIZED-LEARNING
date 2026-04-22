const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true,
    },
    difficulty: {
        type: String,
        required: true,
    },
    questionsCount: {
        type: Number,
        required: true,
    },
    questions: [
        {
            question: String,
            options: [String],
            answer: Number
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    expiresAt: {
        type: Date
    }
});

quizSchema.index({
    subject: 1,
    difficulty: 1,
    questionsCount: 1
});

module.exports = mongoose.model('Quiz', quizSchema);
