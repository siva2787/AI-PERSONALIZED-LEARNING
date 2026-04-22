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
