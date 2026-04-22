// Toast.jsx
export function Toast({ message, type = 'success' }) {
  const bg = type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#1e293b'
  return (
    <div style={{
      position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
      zIndex: 999, background: bg, color: 'white', padding: '10px 20px',
      borderRadius: 99, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)', animation: 'fadeUp 0.2s ease',
    }}>
      {message}
    </div>
  )
}

export default Toast

// Spinner.jsx
export function Spinner({ size = 24, color = '#137fec' }) {
  return (
    <div style={{
      width: size, height: size, border: `3px solid ${color}20`,
      borderTop: `3px solid ${color}`, borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
  )
}

// Avatar.jsx
export function Avatar({ name = '', src, size = 48 }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  if (src) {
    return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
  }
  const colors = ['#137fec','#8b5cf6','#10b981','#f59e0b','#ef4444']
  const color = colors[name.charCodeAt(0) % colors.length] || '#137fec'
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontWeight: 700, fontSize: size * 0.35,
    }}>
      {initials}
    </div>
  )
}

// PageHeader.jsx
export function PageHeader({ title, onBack, rightEl }) {
  return (
    <header className="sticky top-0 z-10 bg-bg-light/90 dark:bg-bg-dark/90 backdrop-blur-sm border-b border-gray-100 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
      {onBack && (
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-primary/10 transition">
          <span className="material-symbols-outlined text-gray-600 dark:text-gray-300" style={{ fontSize: 20 }}>arrow_back_ios_new</span>
        </button>
      )}
      <h1 className="flex-1 text-center text-lg font-bold dark:text-white"
        style={{ marginRight: onBack && !rightEl ? 36 : 0 }}>
        {title}
      </h1>
      {rightEl && <div>{rightEl}</div>}
    </header>
  )
}

// ProgressBar.jsx
export function ProgressBar({ value, max = 100, color = '#137fec', height = 8 }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="progress-bar" style={{ height }}>
      <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

// StatusPill.jsx
export function StatusPill({ status }) {
  const map = {
    new:         { label: 'New',         cls: 'pill-new' },
    in_progress: { label: 'In Progress', cls: 'pill-progress' },
    completed:   { label: 'Completed',   cls: 'pill-done' },
  }
  const { label, cls } = map[status] || map.new
  return <span className={`pill ${cls}`}>{label}</span>
}
