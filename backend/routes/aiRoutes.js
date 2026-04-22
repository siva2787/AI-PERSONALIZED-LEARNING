const express = require('express');
const router = express.Router();
const { generateQuiz } = require('../controllers/aiQuizController');

router.post('/generate-quiz', generateQuiz);

module.exports = router;
