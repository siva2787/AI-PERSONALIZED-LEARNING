import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authAPI, scoresAPI, trackerAPI } from '../services/api'
import { Avatar, Toast } from '../components/common/index.jsx'

function Toggle({ on, onToggle }) {
  return (
    <div
      onClick={onToggle}
      className={`toggle-track ${on ? 'toggle-on' : 'toggle-off'}`}
      style={{ background: on ? '#137fec' : '#e2e8f0' }}
    >
      <div className="toggle-thumb" />
    </div>
  )
}

function DataPrivacyModal({ user, onClose }) {
  const [showPass, setShowPass] = useState(false)
  const rows = [
    { label: 'Full Name', value: user?.name, icon: 'person', iconBg: '#e8f3fd', iconColor: '#137fec' },
    { label: 'Email Address', value: user?.email, icon: 'mail', iconBg: '#e8f3fd', iconColor: '#137fec' },
    { label: 'Student ID', value: user?.studentId, icon: 'badge', iconBg: '#f3f0ff', iconColor: '#8b5cf6' },
    {
      label: 'Account Created', value: user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'N/A', icon: 'calendar_today', iconBg: '#fef3c7', iconColor: '#f59e0b'
    },
  ]
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.55)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl p-6"
        style={{ paddingBottom: 36 }}>
        <div className="flex items-center justify-between mb-5">
          <p className="text-lg font-black text-gray-900 dark:text-white">Data & Privacy</p>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-slate-700">
            <span className="material-symbols-outlined text-gray-500 dark:text-gray-300" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>
        <div className="space-y-2">
          {rows.map(({ label, value, icon, iconBg, iconColor }) => (
            <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800">
              <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined icon-filled" style={{ color: iconColor, fontSize: 18 }}>{icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
                <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{value || '—'}</p>
              </div>
            </div>
          ))}

          {/* Password row with show/hide */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800">
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-outlined icon-filled" style={{ color: '#ef4444', fontSize: 18 }}>lock</span>
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400 dark:text-gray-500">Password</p>
              <p className="font-semibold text-sm text-gray-900 dark:text-white">
                {showPass ? '(hidden for security)' : '••••••••'}
              </p>
            </div>
            <button
              onClick={() => setShowPass(p => !p)}
              className="text-xs text-primary font-bold px-2 py-1 rounded-lg"
              style={{ background: '#e8f3fd' }}
            >
              {showPass ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-5">
          Your data is stored securely and never shared with third parties.
        </p>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { user, logout, updateUser, darkMode, toggleDark } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const [editing, setEditing] = useState(false)
  const VALID_SUBJECTS = [
    'Machine Learning', 'Artificial Intelligence', 'Deep Learning',
    'Data Structures & Algorithms', 'Python Programming', 'Data Science',
    'Neural Networks', 'Natural Language Processing', 'Computer Vision',
    'Database Management Systems', 'Statistics for Data Science',
    'Big Data Analytics', 'Cloud Computing', 'Reinforcement Learning',
    'Data Mining', 'Programming in C',
  ]

  const cleanedSubjects = (user?.preferredSubjects || []).filter(s => VALID_SUBJECTS.includes(s))

  const [form, setForm] = useState({
    name: user?.name || '',
    preferredSubjects: cleanedSubjects,
    notifications: user?.notifications ?? true,
  })

  const getInitialAvatar = (av) => {
    if (!av || av.includes('pravatar.cc')) return null
    return av
  }
  const [avatarPreview, setAvatarPreview] = useState(getInitialAvatar(user?.avatar))
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [stats, setStats] = useState({ quizzesDone: '—', avgScore: '—', totalLogged: '—' })

  useEffect(() => { setAvatarPreview(getInitialAvatar(user?.avatar)) }, [user?.avatar])

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [sRes, tRes] = await Promise.all([
          scoresAPI.getMe(),
          trackerAPI.getStats(),
        ])
        const quizzes = sRes.data?.grouped?.quizzes || []
        const allScores = [
          ...(sRes.data?.grouped?.assignments || []),
          ...quizzes,
          ...(sRes.data?.grouped?.exams || []),
        ]
        const avgScore = allScores.length
          ? Math.round(allScores.reduce((sum, s) => sum + (s.score / s.maxScore) * 100, 0) / allScores.length)
          : 0
        const totalLogged = tRes.data?.totalDaysTracked ?? 0
        setStats({ quizzesDone: quizzes.length, avgScore: `${avgScore}%`, totalLogged: `${totalLogged}d` })
      } catch (err) {
        console.error('ProfilePage loadStats error:', err?.response?.status, err?.response?.data || err?.message)
      }
    }
    loadStats()
  }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  const toggleSubject = (s) => {
    setForm(f => ({
      ...f,
      preferredSubjects: f.preferredSubjects.includes(s)
        ? f.preferredSubjects.filter(x => x !== s)
        : [...f.preferredSubjects, s],
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { showToast('Image must be under 2MB', 'error'); return }
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        preferredSubjects: form.preferredSubjects,
        notifications: form.notifications,
        avatar: avatarPreview || '',
      }
      const { data } = await authAPI.updateProfile(payload)
      const merged = { ...user, ...data.user }
      updateUser(merged)
      showToast('Profile updated!')
      setEditing(false)
    } catch {
      const merged = {
        ...user,
        name: form.name,
        preferredSubjects: form.preferredSubjects,
        notifications: form.notifications,
        avatar: avatarPreview || user?.avatar || '',
      }
      updateUser(merged)
      showToast('Profile updated!')
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="page-enter pb-28 min-h-screen bg-bg-light dark:bg-bg-dark">
      {toast && <Toast message={toast.message} type={toast.type} />}
      {showPrivacy && <DataPrivacyModal user={user} onClose={() => setShowPrivacy(false)} />}

      <header className="sticky top-0 z-10 bg-bg-light/90 dark:bg-bg-dark/90 backdrop-blur-sm border-b border-gray-100 dark:border-slate-800 p-4 flex items-center">
        <button onClick={() => navigate('/dashboard')} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-primary/10 transition">
          <span className="material-symbols-outlined text-gray-600 dark:text-gray-300" style={{ fontSize: 20 }}>arrow_back_ios_new</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-bold dark:text-white pr-9">Profile</h1>
      </header>

      <main className="p-4 space-y-6">

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            {avatarPreview ? (
              <img src={avatarPreview} alt={user?.name}
                style={{ width: 112, height: 112, borderRadius: '50%', objectFit: 'cover', border: '3px solid #e8f3fd' }} />
            ) : (
              <Avatar name={user?.name || 'U'} size={112} />
            )}
            <button onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-9 h-9 bg-primary rounded-full flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-white" style={{ fontSize: 16 }}>edit</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold dark:text-white">{user?.name}</h2>
            <p className="text-sm text-gray-400">ID: {user?.studentId}</p>
          </div>
        </div>

        {/* Personal Info */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Personal Information</h3>
            <button onClick={() => editing ? save() : setEditing(true)} className="text-xs text-primary font-bold">
              {editing ? (saving ? 'Saving…' : 'Save') : 'Edit'}
            </button>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50 dark:border-slate-700">
              <label className="text-xs text-gray-400">Name</label>
              {editing ? (
                <input className="input mt-1 py-2 text-sm" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              ) : (
                <p className="font-semibold dark:text-white">{user?.name}</p>
              )}
            </div>
            <div className="p-4 border-b border-gray-50 dark:border-slate-700">
              <label className="text-xs text-gray-400">Email</label>
              <p className="font-semibold dark:text-white">{user?.email}</p>
            </div>
            <div className="p-4 border-b border-gray-50 dark:border-slate-700">
              <label className="text-xs text-gray-400">Student ID</label>
              <p className="font-semibold dark:text-white">{user?.studentId}</p>
            </div>
            <div className="p-4">
              <label className="text-xs text-gray-400 mb-2 block">Preferred Subjects</label>
              {editing ? (
                <div className="flex flex-wrap gap-2 mt-1">
                  {VALID_SUBJECTS.map(s => (
                    <button key={s} type="button" onClick={() => toggleSubject(s)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition ${form.preferredSubjects.includes(s)
                          ? 'bg-primary text-white border-primary'
                          : 'bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-gray-300 border-gray-200 dark:border-slate-600'
                        }`}>
                      {s}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(user?.preferredSubjects?.length ? user.preferredSubjects : ['—']).map(s => (
                    <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">{s}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Settings */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Settings</h3>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-50 dark:border-slate-700">
              <p className="font-semibold text-sm dark:text-white">Notifications</p>
              <Toggle on={form.notifications} onToggle={() => setForm(f => ({ ...f, notifications: !f.notifications }))} />
            </div>
            <div className="flex items-center justify-between p-4 border-b border-gray-50 dark:border-slate-700">
              <p className="font-semibold text-sm dark:text-white">Dark Mode</p>
              <Toggle on={darkMode} onToggle={toggleDark} />
            </div>
            <button onClick={() => setShowPrivacy(true)} className="w-full flex items-center justify-between p-4">
              <p className="font-semibold text-sm dark:text-white">Data Privacy</p>
              <span className="material-symbols-outlined text-gray-300" style={{ fontSize: 20 }}>chevron_right</span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Quick Stats</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Quizzes Done', val: stats.quizzesDone, icon: 'task_alt', color: '#10b981' },
              { label: 'Avg Score', val: stats.avgScore, icon: 'analytics', color: '#137fec' },
              { label: 'Total Logged', val: stats.totalLogged, icon: 'local_library', color: '#f59e0b' },
            ].map(stat => (
              <div key={stat.label} className="bg-white dark:bg-slate-800 rounded-xl p-3 text-center shadow-sm">
                <span className="material-symbols-outlined icon-filled" style={{ fontSize: 20, color: stat.color }}>{stat.icon}</span>
                <p className="text-base font-black mt-1 dark:text-white">{stat.val}</p>
                <p className="text-xs text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Logout */}
        <button onClick={handleLogout}
          className="w-full py-3 rounded-2xl border-2 border-red-100 dark:border-red-900/30 text-red-400 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/10 transition">
          Log Out
        </button>

      </main>
    </div>
  )
}