const express = require('express');
const router = express.Router();
const { getMyScores, addScore, getLeaderboard, getWeeklyProgress, getRecentQuizzes } = require('../controllers/scoreController');
const { protect } = require('../middleware/authMiddleware');

router.get('/me',             protect, getMyScores);
router.post('/',              protect, addScore);
router.get('/leaderboard',    protect, getLeaderboard);
router.get('/progress',       protect, getWeeklyProgress);
router.get('/recent-quizzes', protect, getRecentQuizzes);

module.exports = router;