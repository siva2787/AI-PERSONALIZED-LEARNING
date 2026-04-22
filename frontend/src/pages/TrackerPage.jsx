import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { trackerAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

// ── Tooltip ───────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
        <div style={{
            background: '#1e2a4a', border: '1px solid #137fec40', borderRadius: 10,
            padding: '8px 12px', fontSize: 12,
        }}>
            <p style={{ color: '#94a3b8', marginBottom: 2 }}>{d.label}</p>
            <p style={{ color: d.studied ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                {d.studied ? `Studied${d.hours ? ` · ${d.hours}h` : ''}` : 'Skipped'}
            </p>
            {d.topic && <p style={{ color: '#64748b', marginTop: 2 }}>{d.topic}</p>}
        </div>
    )
}

// ── Insight Card ──────────────────────────────────────────────────────────
function InsightCard({ type, text }) {
    const styles = {
        success: { bg: '#0d4a2a', border: '#10b981', icon: '✅' },
        warning: { bg: '#4a2a0d', border: '#f59e0b', icon: '⚠️' },
        info: { bg: '#0c2a4a', border: '#137fec', icon: '💡' },
    }
    const s = styles[type] || styles.info
    return (
        <div style={{
            background: s.bg, border: `1px solid ${s.border}40`,
            borderLeft: `3px solid ${s.border}`,
            borderRadius: 10, padding: '10px 14px',
            fontSize: 13, color: '#e2e8f0', lineHeight: 1.5,
        }}>
            {text}
        </div>
    )
}

// ── Stat Pill ─────────────────────────────────────────────────────────────
function StatPill({ label, value, color, bg, icon }) {
    return (
        <div className="rounded-2xl p-4 flex flex-col gap-1" style={{ background: bg }}>
            <span className="material-symbols-outlined icon-filled text-sm" style={{ color, fontSize: 20 }}>{icon}</span>
            <p className="text-2xl font-black" style={{ color }}>{value}</p>
            <p className="text-xs font-semibold" style={{ color: color + 'aa' }}>{label}</p>
        </div>
    )
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function TrackerPage() {
    const { user } = useAuth()
    const navigate = useNavigate()

    const [stats, setStats] = useState(null)
    const [insights, setInsights] = useState([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [success, setSuccess] = useState(null)
    const [error, setError] = useState(null)
    const [activeTab, setActiveTab] = useState('tracker') // tracker | insights

    const [form, setForm] = useState({
        studiedToday: true,
        studyHours: '',
        topic: '',
        difficulty: 'medium',
    })

    const load = async () => {
        try {
            const [sRes, iRes] = await Promise.all([
                trackerAPI.getStats(),
                trackerAPI.getInsights(),
            ])
            setStats(sRes.data)
            setInsights(iRes.data.insights || [])
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const handleSubmit = async () => {
        setSubmitting(true)
        setError(null)
        try {
            const payload = {
                studiedToday: form.studiedToday,
                difficulty: form.difficulty,
                topic: form.topic || undefined,
                studyHours: form.studyHours ? parseFloat(form.studyHours) : undefined,
            }
            const res = await trackerAPI.checkIn(payload)
            setSuccess(`Checked in! 🔥 Streak: ${res.data.streak} day${res.data.streak !== 1 ? 's' : ''}`)
            setShowForm(false)
            setForm({ studiedToday: true, studyHours: '', topic: '', difficulty: 'medium' })
            await load()
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to check in'
            setError(msg)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div style={{
                width: 32, height: 32,
                border: '3px solid #137fec20', borderTop: '3px solid #137fec',
                borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            }} />
        </div>
    )

    const alreadyCheckedIn = !!stats?.todayEntry
    const chartData = stats?.last14 || []

    // Consistency ring
    const score = stats?.consistencyScore || 0
    const ringColor = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
    const circumference = 2 * Math.PI * 36
    const dash = (score / 100) * circumference

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
                    <h1 className="flex-1 text-center text-lg font-bold dark:text-white pr-9">Study Tracker</h1>
                </div>

                {/* Tabs */}
                <div className="flex px-4 pb-2 gap-2">
                    {['tracker', 'insights'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className="flex-1 py-1.5 rounded-xl text-sm font-semibold capitalize transition"
                            style={{
                                background: activeTab === tab ? '#137fec' : 'transparent',
                                color: activeTab === tab ? '#fff' : '#94a3b8',
                            }}
                        >
                            {tab === 'tracker' ? '📊 Tracker' : '💡 Insights'}
                        </button>
                    ))}
                </div>
            </header>

            <main className="p-4 space-y-4">

                {activeTab === 'tracker' && (
                    <>
                        {/* Today's Check-in Card */}
                        <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-sm p-4">
                            <div className="flex items-center justify-between mb-1">
                                <div>
                                    <p className="text-xs text-gray-400 font-medium">Today's Check-in</p>
                                    <p className="text-lg font-black dark:text-white">
                                        {alreadyCheckedIn
                                            ? stats.todayEntry.studiedToday
                                                ? `Studied ✅${stats.todayEntry.studyHours ? ` · ${stats.todayEntry.studyHours}h` : ''}`
                                                : 'Logged as rest day 😴'
                                            : `Hello, ${user?.name?.split(' ')[0] || 'there'} 👋`}
                                    </p>
                                    {alreadyCheckedIn && stats.todayEntry.topic && (
                                        <p className="text-sm text-gray-400 mt-0.5">Topic: {stats.todayEntry.topic}</p>
                                    )}
                                    {!alreadyCheckedIn && (
                                        <p className="text-sm text-gray-400 mt-0.5">Have you studied today?</p>
                                    )}
                                </div>
                                {alreadyCheckedIn ? (
                                    <div style={{
                                        width: 44, height: 44, borderRadius: '50%',
                                        background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <span className="material-symbols-outlined icon-filled" style={{ color: '#10b981', fontSize: 24 }}>check_circle</span>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowForm(true)}
                                        style={{ background: '#137fec', color: '#fff', borderRadius: 12, padding: '8px 16px', fontSize: 13, fontWeight: 700 }}
                                    >
                                        Check In
                                    </button>
                                )}
                            </div>

                            {/* Success / Error */}
                            {success && (
                                <div style={{ background: '#d1fae5', borderRadius: 10, padding: '8px 12px', marginTop: 8, color: '#065f46', fontSize: 13, fontWeight: 600 }}>
                                    {success}
                                </div>
                            )}
                            {error && (
                                <div style={{ background: '#fee2e2', borderRadius: 10, padding: '8px 12px', marginTop: 8, color: '#991b1b', fontSize: 13 }}>
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* Check-in Form */}
                        {showForm && !alreadyCheckedIn && (
                            <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-sm p-4 space-y-4">
                                <p className="font-bold dark:text-white">Log Today's Study</p>

                                {/* Studied today toggle */}
                                <div className="flex gap-2">
                                    {[{ val: true, label: '✅ Studied', color: '#10b981' }, { val: false, label: '😴 Rest Day', color: '#64748b' }].map(opt => (
                                        <button
                                            key={String(opt.val)}
                                            onClick={() => setForm(f => ({ ...f, studiedToday: opt.val }))}
                                            className="flex-1 py-2 rounded-xl text-sm font-semibold transition"
                                            style={{
                                                background: form.studiedToday === opt.val ? opt.color + '20' : '#f8fafc',
                                                border: `2px solid ${form.studiedToday === opt.val ? opt.color : '#e2e8f0'}`,
                                                color: form.studiedToday === opt.val ? opt.color : '#94a3b8',
                                            }}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>

                                {form.studiedToday && (
                                    <>
                                        {/* Study hours */}
                                        <div>
                                            <label className="text-xs font-semibold text-gray-400 mb-1 block">Study Hours (optional)</label>
                                            <input
                                                type="number" min="0" max="24" step="0.5"
                                                placeholder="e.g. 2.5"
                                                value={form.studyHours}
                                                onChange={e => setForm(f => ({ ...f, studyHours: e.target.value }))}
                                                className="w-full rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                            />
                                        </div>

                                        {/* Topic */}
                                        <div>
                                            <label className="text-xs font-semibold text-gray-400 mb-1 block">Topic (optional)</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Machine Learning, Python..."
                                                value={form.topic}
                                                onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                                                className="w-full rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                            />
                                        </div>

                                        {/* Difficulty */}
                                        <div>
                                            <label className="text-xs font-semibold text-gray-400 mb-1 block">Difficulty</label>
                                            <div className="flex gap-2">
                                                {[
                                                    { val: 'easy', label: '🟢 Easy', color: '#10b981' },
                                                    { val: 'medium', label: '🟡 Medium', color: '#f59e0b' },
                                                    { val: 'hard', label: '🔴 Hard', color: '#ef4444' },
                                                ].map(opt => (
                                                    <button
                                                        key={opt.val}
                                                        onClick={() => setForm(f => ({ ...f, difficulty: opt.val }))}
                                                        className="flex-1 py-2 rounded-xl text-xs font-semibold transition"
                                                        style={{
                                                            background: form.difficulty === opt.val ? opt.color + '20' : '#f8fafc',
                                                            border: `2px solid ${form.difficulty === opt.val ? opt.color : '#e2e8f0'}`,
                                                            color: form.difficulty === opt.val ? opt.color : '#94a3b8',
                                                        }}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Submit */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setShowForm(false); setError(null) }}
                                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                                        style={{ background: '#f1f5f9', color: '#64748b' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition"
                                        style={{ background: submitting ? '#93c5fd' : '#137fec' }}
                                    >
                                        {submitting ? 'Saving…' : 'Submit'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <StatPill icon="local_fire_department" label="Current Streak" value={`${stats?.streak || 0}d`} color="#f59e0b" bg="#fef3c7" />
                            <StatPill icon="event_available" label="Days Studied" value={stats?.daysStudied || 0} color="#10b981" bg="#d1fae5" />
                            <StatPill icon="calendar_month" label="Total Logged" value={stats?.totalDaysTracked || 0} color="#137fec" bg="#e8f3fd" />
                            <StatPill icon="schedule" label="Total Hours" value={`${stats?.totalHours || 0}h`} color="#8b5cf6" bg="#f3f0ff" />
                        </div>

                        {/* Consistency Ring */}
                        <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-sm p-4 flex items-center gap-5">
                            <svg width="90" height="90" viewBox="0 0 90 90">
                                <circle cx="45" cy="45" r="36" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                                <circle
                                    cx="45" cy="45" r="36" fill="none"
                                    stroke={ringColor} strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray={`${dash} ${circumference}`}
                                    strokeDashoffset={circumference * 0.25}
                                    style={{ transition: 'stroke-dasharray 0.6s ease' }}
                                />
                                <text x="45" y="49" textAnchor="middle" fontSize="15" fontWeight="800" fill={ringColor}>
                                    {Math.round(score)}%
                                </text>
                            </svg>
                            <div>
                                <p className="text-xs text-gray-400 font-medium mb-1">Consistency Score</p>
                                <p className="text-xl font-black dark:text-white">
                                    {score >= 80 ? 'Excellent 🏆' : score >= 50 ? 'Good 💪' : score > 0 ? 'Keep going 📚' : 'Just starting'}
                                </p>
                                <p className="text-sm text-gray-400 mt-0.5">
                                    {stats?.daysStudied || 0} of {stats?.totalDaysTracked || 0} days studied
                                </p>
                            </div>
                        </div>

                        {/* 14-day Activity Chart */}
                        {chartData.length > 0 && (
                            <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-sm p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="font-bold dark:text-white">14-Day Activity</p>
                                    <div className="flex gap-3">
                                        {[['#10b981', 'Studied'], ['#ef4444', 'Skipped']].map(([color, label]) => (
                                            <div key={label} className="flex items-center gap-1">
                                                <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                                                <span className="text-xs text-gray-400">{label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <ResponsiveContainer width="100%" height={140}>
                                    <BarChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barCategoryGap="25%">
                                        <XAxis
                                            dataKey="label"
                                            tick={{ fontSize: 8, fill: '#94a3b8' }}
                                            axisLine={false} tickLine={false} interval={1}
                                        />
                                        <YAxis hide domain={[0, 1]} />
                                        <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f1f5f920' }} />
                                        <Bar dataKey={() => 1} radius={[6, 6, 0, 0]} maxBarSize={20}>
                                            {chartData.map((entry, i) => (
                                                <Cell key={i} fill={entry.studied ? '#10b981' : '#ef444430'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </>
                )}

                {/* Insights Tab */}
                {activeTab === 'insights' && (
                    <>
                        <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-sm p-4">
                            <p className="font-bold dark:text-white mb-1">AI-Style Insights</p>
                            <p className="text-xs text-gray-400">Based on your study patterns</p>
                        </div>

                        {insights.length === 0 ? (
                            <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-sm p-6 text-center">
                                <p className="text-gray-400 text-sm">Log a few days to unlock insights!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {insights.map((ins, i) => (
                                    <InsightCard key={i} type={ins.type} text={ins.text} />
                                ))}
                            </div>
                        )}

                        {/* Difficulty breakdown */}
                        {stats?.last14?.some(d => d.difficulty) && (
                            <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-sm p-4">
                                <p className="font-bold dark:text-white mb-3">Recent Difficulty</p>
                                <div className="flex gap-2">
                                    {[
                                        { val: 'easy', label: 'Easy', color: '#10b981', bg: '#d1fae5' },
                                        { val: 'medium', label: 'Medium', color: '#f59e0b', bg: '#fef3c7' },
                                        { val: 'hard', label: 'Hard', color: '#ef4444', bg: '#fee2e2' },
                                    ].map(opt => {
                                        const count = stats.last14.filter(d => d.difficulty === opt.val).length
                                        return (
                                            <div key={opt.val} className="flex-1 rounded-xl py-2 px-1 text-center" style={{ background: opt.bg }}>
                                                <p className="text-base font-black" style={{ color: opt.color }}>{count}</p>
                                                <p className="text-xs font-semibold" style={{ color: opt.color }}>{opt.label}</p>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}

            </main>
        </div>
    )
}