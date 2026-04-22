import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const SUBJECTS = [
  "Programming in C",
  "Data Structures",
  "Database Management Systems",
  "Statistics for Data Science",
  "Machine Learning",
  "Artificial Intelligence",
  "Computer Networks",
  "Operating Systems",
  "Cloud Computing",
  "Deep Learning",
  "Natural Language Processing"
]

export default function RegisterPage() {
  const { register, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', preferredSubjects: [] })
  const [error, setError] = useState('')

  const toggleSubject = (s) => {
    setForm(f => ({
      ...f,
      preferredSubjects: f.preferredSubjects.includes(s)
        ? f.preferredSubjects.filter(x => x !== s)
        : [...f.preferredSubjects, s],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) return setError('Password must be at least 6 characters')
    const result = await register(form)
    if (result.success) navigate('/dashboard')
    else setError(result.message)
  }

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex flex-col items-center justify-center p-6 page-enter">
      <div className="w-full max-w-sm">
        <Link to="/login" className="flex items-center gap-1 text-gray-400 text-sm mb-6">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back_ios_new</span>
          Back to Login
        </Link>

        <h2 className="text-2xl font-black mb-1 dark:text-white">Create Account</h2>
        <p className="text-sm text-gray-400 mb-6">Join Smart Academics today</p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Full Name</label>
            <input type="text" required className="input" placeholder="Sophia Chen"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Email</label>
            <input type="email" required className="input" placeholder="you@school.edu"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Password</label>
            <input type="password" required className="input" placeholder="Min. 6 characters"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 block">Preferred Subjects (optional)</label>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map(s => (
                <button key={s} type="button" onClick={() => toggleSubject(s)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${form.preferredSubjects.includes(s)
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600'
                    }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="btn-primary mt-2" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-bold">Sign In</Link>
        </p>
      </div>
    </div>
  )
}