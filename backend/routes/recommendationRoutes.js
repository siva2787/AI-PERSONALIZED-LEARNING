const express = require('express')
const router = express.Router()
const { getRecommendedVideos } = require('../controllers/recommendationController')
const { protect } = require('../middleware/authMiddleware')

router.get('/videos', protect, getRecommendedVideos)

module.exports = router