const axios = require('axios')
const User = require('../models/User')
const Score = require('../models/Score')

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

// In-memory cache: { userId -> { videos, time } }
const cache = {}
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

const getDifficultyFromScore = (pct) => {
  if (pct === null || pct === undefined) return 'beginner'
  if (pct < 50)  return 'beginner'
  if (pct <= 75) return 'intermediate'
  return 'advanced'
}

const QUERY_VARIANTS = {
  beginner: [
    'tutorial for beginners full course',
    'basics explained for beginners',
    'beginner guide complete tutorial',
    'introduction full course',
    'learn from scratch tutorial',
  ],
  intermediate: [
    'intermediate tutorial explained',
    'intermediate concepts course',
    'hands on tutorial intermediate',
    'practical tutorial intermediate level',
    'intermediate full course',
  ],
  advanced: [
    'advanced concepts deep dive',
    'advanced tutorial full course',
    'expert level tutorial',
    'advanced techniques explained',
    'advanced masterclass',
  ],
}

const fetchYouTubeVideo = async (topic, subject, difficulty, attempt = 0) => {
  const variants = QUERY_VARIANTS[difficulty] || QUERY_VARIANTS.beginner
  // Use attempt index to pick different variant each refresh
  const suffix = variants[attempt % variants.length]
  const query = `${topic} ${suffix} tamil OR english`

  console.log(`Searching: "${query}"`)

  try {
    const res = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        maxResults: 8,
        type: 'video',
        q: query,
        key: YOUTUBE_API_KEY,
        videoEmbeddable: 'true',
      },
      timeout: 8000,
    })

    const items = res.data.items || []
    if (items.length === 0) return null

    let chosen = null

    // Tamil first
    chosen = items.find(item => {
      const title = (item.snippet.title || '').toLowerCase()
      const channel = (item.snippet.channelTitle || '').toLowerCase()
      const isHindi = title.includes('hindi') || channel.includes('hindi')
      const isTamil = title.includes('tamil') || channel.includes('tamil')
      return isTamil && !isHindi
    })

    // Fallback English (no Hindi)
    if (!chosen) {
      chosen = items.find(item => {
        const title = (item.snippet.title || '').toLowerCase()
        const channel = (item.snippet.channelTitle || '').toLowerCase()
        return !title.includes('hindi') && !channel.includes('hindi')
      })
    }

    if (!chosen) return null

    const titleLower = chosen.snippet.title.toLowerCase()
    const channelLower = chosen.snippet.channelTitle.toLowerCase()
    const isTamil = titleLower.includes('tamil') || channelLower.includes('tamil')

    return {
      title: chosen.snippet.title,
      videoId: chosen.id.videoId,
      thumbnail: chosen.snippet.thumbnails?.medium?.url || chosen.snippet.thumbnails?.default?.url,
      channel: chosen.snippet.channelTitle,
      subject,
      difficulty,
      language: isTamil ? 'Tamil' : 'English',
    }
  } catch (err) {
    console.error(`YouTube fetch failed for "${topic}":`, err.message)
    return null
  }
}

const getRecommendedVideos = async (req, res) => {
  try {
    const userId = req.user._id.toString()
    const forceRefresh = req.query.refresh === 'true'  // ← refresh button check

    // Serve from cache unless forceRefresh or cache expired
    if (!forceRefresh && cache[userId] && (Date.now() - cache[userId].time) < CACHE_DURATION) {
      console.log('Serving from cache for user:', userId)
      return res.json({ success: true, videos: cache[userId].videos, cached: true })
    }

    console.log(forceRefresh ? 'Force refresh requested' : 'Cache miss — fetching from YouTube')

    // 1. Get preferred subjects
    const user = await User.findById(userId).select('preferredSubjects')
    const preferredSubjects = user?.preferredSubjects || []

    // 2. Get scores
    const scores = await Score.find({ student: userId }).select('subject score maxScore')

    // 3. Build scoreMap — skip "General"
    const scoreMap = {}
    scores.forEach(s => {
      if (!s.subject || s.subject === 'General') return
      const maxScore = s.maxScore || 100
      const pct = Math.round((s.score / maxScore) * 100)
      if (!(s.subject in scoreMap) || pct < scoreMap[s.subject]) {
        scoreMap[s.subject] = pct
      }
    })

    console.log('preferredSubjects:', preferredSubjects)
    console.log('scoreMap:', scoreMap)

    // 4. Merge + deduplicate
    const allSubjects = [...new Set([...preferredSubjects, ...Object.keys(scoreMap)])]

    // 5. Sort lowest score first
    allSubjects.sort((a, b) => (scoreMap[a] ?? 999) - (scoreMap[b] ?? 999))

    // 6. Top 5
    const topics = allSubjects.slice(0, 5)

    if (topics.length === 0) {
      return res.json({ success: true, videos: [], message: 'Add preferred subjects in your profile.' })
    }

    console.log('Fetching videos for:', topics)

    // 7. Fetch videos — use refresh count to vary query each time
    const attempt = cache[userId]?.refreshCount || 0
    const videoPromises = topics.map(topic => {
      const pct = scoreMap[topic] ?? null
      const difficulty = getDifficultyFromScore(pct)
      return fetchYouTubeVideo(topic, topic, difficulty, attempt)
    })

    const results = await Promise.all(videoPromises)
    const videos = results.filter(Boolean)

    console.log('videos fetched:', videos.length)

    // 8. Update cache — increment refreshCount so next refresh uses different query
    const prevCount = cache[userId]?.refreshCount || 0
    cache[userId] = { videos, time: Date.now(), refreshCount: prevCount + 1 }

    return res.json({ success: true, videos, cached: false })

  } catch (err) {
    console.error('Recommendation error:', err)
    return res.status(500).json({ success: false, message: 'Failed to fetch recommendations', error: err.message })
  }
}

module.exports = { getRecommendedVideos }