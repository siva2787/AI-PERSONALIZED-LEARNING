import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { scoresAPI } from '../services/api'
import { PageHeader } from '../components/common/index.jsx'

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

export default function QuizHistoryPage() {
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await scoresAPI.getRecentQuizzes()
        setQuizzes(res.data.quizzes || [])
      } catch {
        setQuizzes([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div style={{ width: 32, height: 32, border: '3px solid #137fec20', borderTop: '3px solid #137fec', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div className="page-enter pb-28">
      <PageHeader title="Quiz History" onBack={() => navigate('/dashboard')} />

      <main className="p-4 space-y-3">

        {/* Summary bar */}
        {quizzes.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-2">
            {[
              { label: 'Total Quizzes', val: quizzes.length, color: '#137fec' },
              { label: 'Avg Score', val: Math.round(quizzes.reduce((s, q) => s + q.percentage, 0) / quizzes.length) + '%', color: '#10b981' },
              { label: 'Best Score', val: Math.max(...quizzes.map(q => q.percentage)) + '%', color: '#f59e0b' },
            ].map(({ label, val, color }) => (
              <div key={label} className="rounded-xl bg-white dark:bg-slate-800 p-3 text-center shadow-sm">
                <p className="text-lg font-black" style={{ color }}>{val}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Quiz list */}
        {quizzes.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-slate-800 p-8 text-center shadow-sm">
            <span className="material-symbols-outlined text-gray-300 dark:text-slate-600" style={{ fontSize: 48 }}>quiz</span>
            <p className="text-gray-400 mt-3 font-medium">No quizzes taken yet</p>
            <button onClick={() => navigate('/tasks')} className="text-primary text-sm font-medium mt-2">
              Take a Quiz →
            </button>
          </div>
        ) : quizzes.map((quiz, i) => {
          const color = subjectColors[quiz.subject] || '#137fec'
          const icon = subjectIcons[quiz.subject] || 'quiz'
          const pct = quiz.percentage
          const scoreColor = pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'
          const scoreBg = pct >= 75 ? '#dcfce7' : pct >= 50 ? '#fef9c3' : '#fee2e2'

          return (
            <div key={quiz._id}
              className="flex items-center gap-3 rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-sm">

              {/* Rank */}
              <div className="w-6 shrink-0 text-center">
                <p className="text-xs font-bold text-gray-300">#{i + 1}</p>
              </div>

              {/* Icon */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                style={{ background: color + '18' }}>
                <span className="material-symbols-outlined icon-filled" style={{ fontSize: 22, color }}>{icon}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm dark:text-white truncate">{quiz.subject}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">{quiz.difficulty}</span>
                  <span className="text-gray-200 dark:text-slate-600">·</span>
                  <span className="text-xs text-gray-400">
                    {new Date(quiz.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                {/* Score bar */}
                <div className="mt-2 h-1.5 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: scoreColor }} />
                </div>
              </div>

              {/* Score badge */}
              <div className="shrink-0 text-center px-3 py-2 rounded-xl" style={{ background: scoreBg }}>
                <p className="text-base font-black" style={{ color: scoreColor }}>{pct}%</p>
                <p className="text-xs font-bold" style={{ color: scoreColor }}>{quiz.grade}</p>
              </div>

            </div>
          )
        })}

      </main>
    </div>
  )
}