import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { scoresAPI } from '../services/api'
import { Avatar, ProgressBar } from '../components/common/index.jsx'
import { getLetterGrade } from '../utils/helpers'

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
  "Data Structures": "#137fec",
  "General": "#94a3b8",
}

const subjectIcons = {
  "Programming in C": "terminal",
  "Data Structures & Algorithms": "account_tree",
  "Data Structures": "account_tree",
  "Database Management Systems": "storage",
  "Statistics for Data Science": "query_stats",
  "Machine Learning": "psychology",
  "Artificial Intelligence": "smart_toy",
  "Cloud Computing": "cloud",
  "Deep Learning": "neurology",
  "Natural Language Processing": "translate",
  "Python Programming": "code",
  "Data Science": "analytics",
  "Neural Networks": "hub",
  "Computer Vision": "visibility",
  "Big Data Analytics": "bar_chart",
  "Reinforcement Learning": "model_training",
  "Data Mining": "search",
  "General": "quiz",
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [scores, setScores] = useState(null)
  const [recentQuizzes, setRecentQuizzes] = useState([])
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, pRes, qRes] = await Promise.all([
          scoresAPI.getMe(),
          scoresAPI.getProgress(),
          scoresAPI.getRecentQuizzes(),
        ])
        setScores(sRes.data)
        setProgress(pRes.data.progress || [])
        setRecentQuizzes(qRes.data.quizzes || [])
      } catch (e) {
        setScores({
          summary: { overall: 0, letterGrade: 'N/A', bySubject: [] },
          grouped: { assignments: [], quizzes: [], exams: [] }
        })
        setProgress([])
        setRecentQuizzes([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const overall = scores?.summary?.overall || 0
  const bySubject = scores?.summary?.bySubject || []

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div style={{ width: 32, height: 32, border: '3px solid #137fec20', borderTop: '3px solid #137fec', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div className="page-enter pb-28">

      {/* Header */}
      <header className="flex items-center justify-between p-4 pt-6">
        <button onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/10">
          <span className="material-symbols-outlined text-gray-500 dark:text-gray-300" style={{ fontSize: 20 }}>menu</span>
        </button>
        <h1 className="text-lg font-bold dark:text-white">Dashboard</h1>
        <div className="w-10" />
      </header>

      <main className="px-4 space-y-6">

        {/* Profile card */}
        <section className="flex items-center gap-4">
          <Avatar name={user?.name || 'Student'} size={56} />
          <div>
            <p className="text-xl font-bold dark:text-white">{user?.name || 'Student'}</p>
            <p className="text-sm text-gray-400">ID: {user?.studentId || '------'}</p>
          </div>
        </section>

        {/* Overall score */}
        <section className="rounded-2xl bg-primary p-6 text-white shadow-lg shadow-primary/25">
          <p className="text-sm font-medium opacity-80 mb-1">Overall Score</p>
          <p className="text-5xl font-black">{overall}%</p>
          <p className="text-xs opacity-60 mt-1">Grade: {getLetterGrade(overall)} · Keep it up!</p>
        </section>

        {/* Score breakdown */}
        <section>
          <h2 className="text-lg font-bold mb-3 dark:text-white">Score Breakdown</h2>
          <div className="rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-sm space-y-4">
            {bySubject.length ? bySubject.map(({ subject, average }) => (
              <div key={subject} className="grid items-center gap-3" style={{ gridTemplateColumns: '64px 1fr 44px' }}>
                <p className="text-sm font-medium text-gray-400 truncate">{subject}</p>
                <ProgressBar value={average} />
                <p className="text-sm font-bold text-right dark:text-white">{average}%</p>
              </div>
            )) : (
              <p className="text-sm text-gray-400 text-center py-2">No scores yet. Take a quiz to see breakdown.</p>
            )}
          </div>
        </section>

        {/* Progress chart */}
        {progress.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-3 dark:text-white">Progress Over Time</h2>
            <div className="rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-sm">
              <svg viewBox="0 0 320 120" width="100%" style={{ display: 'block', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="pgrd" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#137fec" stopOpacity="0.22" />
                    <stop offset="1" stopColor="#137fec" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0, 25, 50, 75, 100].map(v => {
                  const y = 10 + (1 - v / 100) * 90
                  return (
                    <g key={v}>
                      <line x1={36} y1={y} x2={310} y2={y} stroke="#94a3b8" strokeOpacity="0.15" strokeWidth="1" strokeDasharray="4 3" />
                      <text x={32} y={y + 3.5} textAnchor="end" fontSize="8" fill="#94a3b8" opacity="0.8">{v}</text>
                    </g>
                  )
                })}
                <polyline
                  points={progress.map((p, i) => {
                    if (p.average === null || p.average === undefined) return null
                    const x = 36 + (i / (progress.length - 1)) * 274
                    const y = 10 + (1 - p.average / 100) * 90
                    return `${x},${y}`
                  }).filter(Boolean).join(' ')}
                  fill="none" stroke="#137fec" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                />
                {progress.map((p, i) => {
                  if (p.average === null || p.average === undefined) return null
                  const x = 36 + (i / (progress.length - 1)) * 274
                  const y = 10 + (1 - p.average / 100) * 90
                  return (
                    <g key={i}>
                      <text x={x} y={p.average < 10 ? y + 18 : y - 8} textAnchor="middle" fontSize="9" fontWeight="600" fill="#137fec">{p.average}%</text>
                      <circle cx={x} cy={y} r={5} fill="#137fec" opacity="0.2" />
                      <circle cx={x} cy={y} r={3.5} fill="#137fec" />
                    </g>
                  )
                })}
              </svg>
              <div className="flex justify-between text-xs font-medium text-gray-400 mt-1" style={{ paddingLeft: 36, paddingRight: 6 }}>
                {progress.map(p => <span key={p.week}>{p.week}</span>)}
              </div>
            </div>
          </section>
        )}

        {/* Recent Quizzes */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold dark:text-white">Recent Quizzes</h2>
            <button
              onClick={() => navigate('/quiz-history')}
              className="text-sm text-primary font-medium"
            >
              See all
            </button>
          </div>

          <div className="space-y-2">
            {recentQuizzes.length ? recentQuizzes.slice(0, 1).map(quiz => {
              const color = subjectColors[quiz.subject] || '#137fec'
              const icon = subjectIcons[quiz.subject] || 'quiz'
              const pct = quiz.percentage
              const scoreColor = pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'
              return (
                <div key={quiz._id}
                  className="flex items-center gap-3 rounded-2xl bg-white dark:bg-slate-800 p-3 shadow-sm">
                  {/* Icon */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: color + '18' }}>
                    <span className="material-symbols-outlined icon-filled" style={{ fontSize: 22, color }}>{icon}</span>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate dark:text-white">{quiz.subject}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{quiz.difficulty} · {new Date(quiz.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                  {/* Score */}
                  <div className="text-right shrink-0">
                    <p className="text-lg font-black" style={{ color: scoreColor }}>{pct}%</p>
                    <p className="text-xs font-bold" style={{ color: scoreColor }}>{quiz.grade}</p>
                  </div>
                </div>
              )
            }) : (
              <div className="rounded-2xl bg-white dark:bg-slate-800 p-5 text-center">
                <span className="material-symbols-outlined text-gray-300 dark:text-slate-600" style={{ fontSize: 40 }}>quiz</span>
                <p className="text-sm text-gray-400 mt-2">No quizzes yet</p>
                <button onClick={() => navigate('/tasks')}
                  className="text-primary text-sm font-medium mt-1">Take a Quiz →</button>
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  )
}