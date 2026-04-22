import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { scoresAPI, attendanceAPI, trackerAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { ProgressBar } from '../components/common/index.jsx'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

const DEMO_SCORES = {
  summary: { overall: 85, letterGrade: 'A-', bySubject: [] },
  grouped: {
    assignments: [
      { _id: 'a1', title: 'Python Basics Script', subject: 'Python Programming', score: 90, maxScore: 100, dueDate: '2024-10-20', type: 'assignment' },
      { _id: 'a2', title: 'Decision Trees Paper', subject: 'Machine Learning', score: 80, maxScore: 100, dueDate: '2024-10-15', type: 'assignment' },
    ],
    quizzes: [
      { _id: 'q1', title: 'SQL Joins Practice', subject: 'Database Management Systems', score: 85, maxScore: 100, dueDate: '2024-10-25', type: 'quiz' },
      { _id: 'q2', title: 'Python Basics', subject: 'Python Programming', score: 60, maxScore: 100, dueDate: '2024-10-20', type: 'quiz' },
      { _id: 'q3', title: 'Machine Learning Intro', subject: 'Machine Learning', score: 72, maxScore: 100, dueDate: '2024-10-22', type: 'quiz' },
      { _id: 'q4', title: 'Data Structures', subject: 'Data Structures', score: 80, maxScore: 100, dueDate: '2024-10-28', type: 'quiz' },
      { _id: 'q5', title: 'AI Fundamentals', subject: 'Artificial Intelligence', score: 85, maxScore: 100, dueDate: '2024-10-30', type: 'quiz' },
    ],
    exams: [],
    projects: [],
  },
}

// ─── Quiz Tooltip ──────────────────────────────────────────────────────────
function QuizTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10,
      padding: '8px 14px', fontSize: 13, boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
      maxWidth: 200,
    }}>
      <p style={{ fontWeight: 700, color: '#137fec', marginBottom: 4 }}>{label}</p>
      {d?.title && <p style={{ color: '#64748b', fontSize: 11, marginBottom: 6 }}>{d.title}</p>}
      <p style={{ color: '#1e293b', fontWeight: 600 }}>{payload[0].value}%</p>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color = '#137fec', bg = '#e8f3fd' }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-sm p-4 flex items-center gap-3">
      <div style={{
        background: bg, borderRadius: 12, width: 44, height: 44,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span className="material-symbols-outlined icon-filled" style={{ color, fontSize: 22 }}>{icon}</span>
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-lg font-black dark:text-white">{value}</p>
      </div>
    </div>
  )
}

// ─── Level Card ───────────────────────────────────────────────────────────
function LevelCard({ level, xpInLevel, xpToNext, totalXP }) {
  const levelColors = ['#137fec', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']
  const color = levelColors[(level - 1) % levelColors.length]
  const titles = ['', 'Rookie', 'Explorer', 'Learner', 'Scholar', 'Expert', 'Master', 'Legend']
  const title = titles[Math.min(level, titles.length - 1)]

  return (
    <div className="rounded-2xl shadow-sm p-4" style={{
      background: `linear-gradient(135deg, ${color}18, ${color}08)`,
      border: `1.5px solid ${color}30`,
    }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-gray-400 font-medium">Current Level</p>
          <p className="text-2xl font-black">
            <span style={{ color }}>Level {level}</span>{' '}
            <span className="text-base font-semibold text-gray-400">{title}</span>
          </p>
        </div>
        <div style={{
          width: 52, height: 52, borderRadius: '50%', background: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 16px ${color}40`,
        }}>
          <span className="material-symbols-outlined icon-filled" style={{ color: 'white', fontSize: 28 }}>bolt</span>
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>Total XP: {totalXP}</span>
        <span>{xpInLevel} / {xpToNext} → Level {level + 1}</span>
      </div>
      <ProgressBar value={xpInLevel} max={xpToNext} color={color} height={8} />
    </div>
  )
}

// ─── Subject Bar ──────────────────────────────────────────────────────────
function SubjectBar({ subject, percentage, isStrongest, isWeakest }) {
  const color = percentage >= 80 ? '#10b981' : percentage >= 60 ? '#f59e0b' : '#ef4444'
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold dark:text-white">{subject}</span>
          {isStrongest && (
            <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
              🏆 Strongest
            </span>
          )}
          {isWeakest && (
            <span style={{ background: '#fee2e2', color: '#ef4444', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
              ⚠ Needs Work
            </span>
          )}
        </div>
        <span className="text-sm font-bold ml-2" style={{ color }}>{percentage}%</span>
      </div>
      <ProgressBar value={percentage} max={100} color={color} height={7} />
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function ScorerPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [scores, setScores] = useState(null)
  const [totalLogged, setTotalLogged] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, tRes] = await Promise.all([
          scoresAPI.getMe(),
          trackerAPI.getStats(),
        ])
        setScores(sRes.data)
        setTotalLogged(tRes.data?.totalDaysTracked ?? 0)
      } catch {
        setScores(DEMO_SCORES)
        setTotalLogged(7)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div style={{
        width: 32, height: 32, border: '3px solid #137fec20',
        borderTop: '3px solid #137fec', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  )

  if (!scores) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500 dark:text-gray-400 text-sm px-8 text-center">
        No learning analytics yet. Complete a quiz to see your progress.
      </p>
    </div>
  )

  // ── Derived data ──────────────────────────────────────────────────────
  const overall = scores?.summary?.overall || 0

  const allScores = [
    ...(scores?.grouped?.assignments || []),
    ...(scores?.grouped?.quizzes || []),
    ...(scores?.grouped?.exams || []),
    ...(scores?.grouped?.projects || []),
  ]

  // Subject performance
  const subjectMap = {}
  allScores.forEach(item => {
    if (!subjectMap[item.subject]) subjectMap[item.subject] = { total: 0, count: 0 }
    subjectMap[item.subject].total += (item.score / item.maxScore) * 100
    subjectMap[item.subject].count += 1
  })
  const subjectAverages = Object.entries(subjectMap)
    .map(([subject, { total, count }]) => ({ subject, percentage: Math.round(total / count) }))
    .sort((a, b) => b.percentage - a.percentage)

  const strongest = subjectAverages[0] || null
  const weakest = subjectAverages[subjectAverages.length - 1] || null

  // XP & Level
  const quizzes = scores?.grouped?.quizzes || []
  let totalXP = 0
  quizzes.forEach(q => {
    const pct = (q.score / q.maxScore) * 100
    totalXP += 50
    if (pct > 80) totalXP += 30
    if (pct === 100) totalXP += 50
  })
  const level = Math.floor(totalXP / 300) + 1
  const xpInLevel = totalXP % 300

  // Study streak
  const scoreDates = [...new Set(allScores.map(s =>
    new Date(s.createdAt || s.dueDate || Date.now()).toDateString()
  ))].sort((a, b) => new Date(b) - new Date(a))
  let studyStreak = 0
  let checkDate = new Date()
  for (const dateStr of scoreDates) {
    const d = new Date(dateStr)
    const diff = Math.round((checkDate - d) / (1000 * 60 * 60 * 24))
    if (diff <= 1) { studyStreak++; checkDate = d } else break
  }

  // Quiz chart data — strictly last 14, always numbered Q1–Q14
  const quizChartData = [...quizzes]
    .filter(q => q.createdAt || q.dueDate)
    .sort((a, b) => new Date(a.createdAt || a.dueDate) - new Date(b.createdAt || b.dueDate))
    .slice(-14)
    .map((q, i) => ({
      quiz: `Q${i + 1}`,
      score: Math.round((q.score / q.maxScore) * 100),
      title: q.title,
      subject: q.subject,
    }))

  return (
    <div className="page-enter pb-28">

      {/* Header */}
      <header className="sticky top-0 z-10 bg-bg-light/90 dark:bg-bg-dark/90 backdrop-blur-sm border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-primary/10 transition"
          >
            <span className="material-symbols-outlined text-gray-600 dark:text-gray-300" style={{ fontSize: 20 }}>
              arrow_back_ios_new
            </span>
          </button>
          <h1 className="flex-1 text-center text-lg font-bold dark:text-white pr-9">Scorer</h1>
        </div>
      </header>

      <main className="p-4 space-y-4">

        {/* Greeting */}
        <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-sm p-4">
          <p className="text-xs text-gray-400 font-medium mb-1">Learning Summary</p>
          <p className="text-xl font-black dark:text-white">
            Hello, {user?.name?.split(' ')[0] || 'Student'} 👋
          </p>
          <p className="text-sm text-gray-400 mt-0.5">Here's how you're doing</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon="emoji_events" label="Overall Score" value={`${overall}%`} color="#137fec" bg="#e8f3fd" />
          <StatCard icon="quiz" label="Quizzes Done" value={quizzes.length} color="#8b5cf6" bg="#f3f0ff" />
          <StatCard icon="calendar_month" label="Total Logged" value={`${totalLogged}d`} color="#10b981" bg="#d1fae5" />
          <StatCard icon="local_fire_department" label="Study Streak" value={`${studyStreak}d`} color="#f59e0b" bg="#fef3c7" />
        </div>

        {/* Level & XP */}
        <LevelCard level={level} xpInLevel={xpInLevel} xpToNext={300} totalXP={totalXP} />

        {/* Subject Performance */}
        <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-sm p-4">
          <p className="font-bold dark:text-white mb-3">Subject Performance</p>
          {subjectAverages.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No scores yet. Take a quiz to see your performance!
            </p>
          ) : (
            subjectAverages.map(s => (
              <SubjectBar
                key={s.subject}
                subject={s.subject}
                percentage={s.percentage}
                isStrongest={strongest?.subject === s.subject}
                isWeakest={weakest?.subject === s.subject && subjectAverages.length > 1}
              />
            ))
          )}
        </div>

        {/* Quiz Score Chart */}
        {quizChartData.length > 0 && (
          <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold dark:text-white">Quiz Score Progress</p>
              <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: '#e8f3fd', color: '#137fec' }}>
                {quizChartData.length} quizzes
              </span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={quizChartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="quizGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#137fec" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#137fec" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="quiz" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} interval={0} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<QuizTooltip />} cursor={{ stroke: '#137fec20', strokeWidth: 2 }} />
                <Line
                  type="monotone" dataKey="score" stroke="#137fec" strokeWidth={3}
                  dot={{ r: 5, fill: 'white', stroke: '#137fec', strokeWidth: 2.5 }}
                  activeDot={{ r: 7, fill: '#137fec', stroke: 'white', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

      </main>
    </div>
  )
}