import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV_ITEMS = [
  { path: '/tracker', icon: 'local_library', label: 'Tracker' },
  { path: '/scorer', icon: 'emoji_events', label: 'Scorer', filled: true },
  { path: '/tasks', icon: 'checklist', label: 'Tasks' },
  { path: '/profile', icon: 'person', label: 'Profile' },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { darkMode } = useAuth()
  const isActive = (path) => location.pathname.startsWith(path)

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: darkMode ? '#0f172a' : 'rgba(255,255,255,0.97)',
      backdropFilter: 'blur(12px)',
      borderTop: darkMode ? '1px solid #1e293b' : '1px solid #f1f5f9',
      padding: '8px 8px 18px',
    }}>
      <div className="flex justify-around max-w-md mx-auto">
        {NAV_ITEMS.map(item => {
          const active = isActive(item.path)
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 2, padding: '4px 12px', borderRadius: 12, border: 'none',
                background: 'none', cursor: 'pointer', fontFamily: 'Lexend, sans-serif',
                fontSize: 11, fontWeight: active ? 700 : 500,
                color: active ? '#137fec' : darkMode ? '#64748b' : '#94a3b8',
                transition: 'color 0.15s',
              }}
            >
              <span
                className={`material-symbols-outlined ${item.filled && active ? 'icon-filled' : ''}`}
                style={{ fontSize: 22 }}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}