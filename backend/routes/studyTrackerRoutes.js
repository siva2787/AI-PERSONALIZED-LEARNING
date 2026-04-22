const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { checkIn, getStats, getInsights } = require('../controllers/studyTrackerController');

router.post('/checkin', protect, checkIn);
router.get('/stats', protect, getStats);
router.get('/insights', protect, getInsights);

module.exports = router;