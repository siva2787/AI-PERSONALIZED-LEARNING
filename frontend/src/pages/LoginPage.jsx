import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const result = await login(form.email, form.password)
    if (result.success) navigate('/dashboard')
    else setError(result.message)
  }

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex flex-col items-center justify-center p-6 page-enter">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-3 shadow-lg">
          <span className="material-symbols-outlined icon-filled text-white" style={{ fontSize: 32 }}>school</span>
        </div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">EduScore</h1>
        <p className="text-sm text-gray-400 mt-1">Smart Academics Portal</p>
      </div>

      <div className="w-full max-w-sm">
        <h2 className="text-xl font-bold mb-6 dark:text-white">Welcome back 👋</h2>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Email</label>
            <input
              type="email" required className="input"
              placeholder="you@school.edu"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'} required className="input pr-12"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
              <button type="button" onClick={() => setShowPw(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  {showPw ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>
          <button type="submit" className="btn-primary mt-2" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary font-bold">Register</Link>
        </p>

        {/* Demo hint */}
        <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/10 text-center">
          <p className="text-xs text-gray-400">Demo: register a new account to get started</p>
        </div>
      </div>
    </div>
  )
}
