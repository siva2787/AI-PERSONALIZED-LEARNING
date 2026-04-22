const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { markAttendance, getMyAttendance, getTodayAttendance, validateLocation } = require('../controllers/attendanceController');

router.post('/mark', protect, markAttendance);
router.post('/validate-location', protect, validateLocation);
router.get('/me', protect, getMyAttendance);
router.get('/today', protect, getTodayAttendance);

module.exports = router;