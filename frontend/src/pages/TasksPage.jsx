import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { tasksAPI, aiAPI, recommendationsAPI } from '../services/api'

const subjectColors = {
  "Programming in C": "#ef4444",
  "Data Structures & Algorithms": "#137fec",
  "Database Management Systems": "#8b5cf6",
  "Statistics for Data Science": "#f59e0b",
  "Machine Learning": "#10b981",
  "Artificial Intelligence": "#6366f1",
  "Cloud Computing": "#0ea5e9",
  "Deep Learning": "#ec4899",
  "Python Programming": "#f97316",
  "Data Science": "#14b8a6",
  "Neural Networks": "#8b5cf6",
  "Natural Language Processing": "#06b6d4",
  "Computer Vision": "#84cc16",
  "Big Data Analytics": "#f59e0b",
  "Reinforcement Learning": "#6366f1",
  "Data Mining": "#10b981",
}

export default function TasksPage() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [genSubject, setGenSubject] = useState('Machine Learning')
  const [genDifficulty, setGenDifficulty] = useState('Medium')
  const [genQuestions, setGenQuestions] = useState(10)
  const [generating, setGenerating] = useState(false)
  const [videos, setVideos] = useState([])
  const [videosLoading, setVideosLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState(null)

  useEffect(() => {
    setLoading(false)
    loadVideos()
  }, [])

  const loadVideos = async (forceRefresh = false) => {
    setVideosLoading(true)
    try {
      const res = await recommendationsAPI.getVideos(forceRefresh)
      setVideos(res.data.videos || [])
    } catch (err) {
      console.error('Failed to load videos:', err)
      setVideos([])
    } finally {
      setVideosLoading(false)
    }
  }

  const handleGenerateAIQuiz = async () => {
    setGenerating(true)
    try {
      const res = await aiAPI.generateQuiz({
        subject: genSubject,
        difficulty: genDifficulty,
        questions: parseInt(genQuestions, 10),
      })
      navigate('/quiz/ai', { state: { questions: res.data.questions, subject: genSubject } })
    } catch (err) {
      console.error(err)
      alert('Failed to generate quiz')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div style={{ width: 32, height: 32, border: '3px solid #137fec20', borderTop: '3px solid #137fec', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div className="page-enter pb-28">

      {/* Header */}
      <header className="sticky top-0 z-10 bg-bg-light/90 dark:bg-bg-dark/90 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/5">
            <span className="material-symbols-outlined text-gray-500" style={{ fontSize: 20 }}>sort</span>
          </button>
          <h1 className="text-lg font-bold dark:text-white">AI Tasks</h1>
          <div className="w-9 h-9" />
        </div>
      </header>

      <main className="px-4 space-y-4 mt-4">

        {/* AI Quiz Generator */}
        <section className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm">
          <h2 className="text-lg font-bold dark:text-white mb-4">Generate AI Quiz</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Subject</label>
              <select
                className="w-full p-2 text-sm bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-lg outline-none"
                value={genSubject}
                onChange={e => setGenSubject(e.target.value)}
              >
                {Object.keys(subjectColors).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-400 block mb-1">Difficulty</label>
                <select
                  className="w-full p-2 text-sm bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-lg outline-none"
                  value={genDifficulty}
                  onChange={e => setGenDifficulty(e.target.value)}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 block mb-1">Questions</label>
                <select
                  className="w-full p-2 text-sm bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-lg outline-none"
                  value={genQuestions}
                  onChange={e => setGenQuestions(e.target.value)}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                </select>
              </div>
            </div>
            <button
              onClick={handleGenerateAIQuiz}
              disabled={generating}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              {generating ? 'Generating...' : 'Generate AI Quiz'}
            </button>
          </div>
        </section>

        {/* Recommended Videos */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold dark:text-white">Recommended Learning Videos</h2>
            <button onClick={() => loadVideos(true)} className="text-xs text-primary font-medium flex items-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>refresh</span>
              Refresh
            </button>
          </div>

          {videosLoading ? (
            <div className="flex items-center justify-center py-12">
              <div style={{ width: 28, height: 28, border: '3px solid #137fec20', borderTop: '3px solid #137fec', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : videos.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-center shadow-sm">
              <span className="material-symbols-outlined text-gray-300 dark:text-slate-600" style={{ fontSize: 40 }}>video_library</span>
              <p className="text-sm text-gray-400 mt-2 font-medium">No recommendations yet</p>
              <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Add preferred subjects in your profile or take a quiz first</p>
            </div>
          ) : (
            <div className="space-y-4">
              {videos.map((video, i) => (
                <div key={video.videoId || i} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">

                  {/* Tags row */}
                  <div className="px-4 pt-3 pb-1 flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: (subjectColors[video.subject] || '#137fec') + '18',
                        color: subjectColors[video.subject] || '#137fec',
                      }}>
                      {video.subject}
                    </span>
                    {video.language && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: video.language === 'Tamil' ? '#fdf2f8' : '#f0fdf4',
                          color: video.language === 'Tamil' ? '#db2777' : '#16a34a',
                        }}>
                        {video.language === 'Tamil' ? '🇮🇳 Tamil' : '🇬🇧 English'}
                      </span>
                    )}
                  </div>

                  {/* Title & channel */}
                  <div className="px-4 pb-2">
                    <h3 className="font-bold text-sm dark:text-white leading-snug line-clamp-2">{video.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{video.channel}</p>
                  </div>

                  {/* Thumbnail or player */}
                  {selectedVideo === video.videoId ? (
                    <iframe
                      width="100%" height="210"
                      src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1`}
                      title={video.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="relative cursor-pointer" onClick={() => setSelectedVideo(video.videoId)}>
                      <img src={video.thumbnail} alt={video.title} className="w-full object-cover" style={{ height: 200 }} />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                          <span className="material-symbols-outlined icon-filled text-white" style={{ fontSize: 28 }}>play_arrow</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* YouTube link */}
                  <div className="px-4 py-2 flex justify-end">
                    <a href={`https://www.youtube.com/watch?v=${video.videoId}`}
                      target="_blank" rel="noreferrer"
                      className="text-xs text-primary font-medium flex items-center gap-1">
                      Open in YouTube
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>open_in_new</span>
                    </a>
                  </div>

                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  )
}