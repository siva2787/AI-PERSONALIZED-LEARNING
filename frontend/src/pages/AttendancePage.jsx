import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { attendanceAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { PageHeader } from '../components/common/index.jsx'
import { getDaysInMonth, getFirstDayOfMonth } from '../utils/helpers'
import { Html5QrcodeScanner } from 'html5-qrcode'

export default function AttendancePage() {
  const navigate = useNavigate()
  const [today, setToday] = useState('not_marked')
  const [records, setRecords] = useState([])
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, late: 0, percentage: '0' })
  const [loading, setLoading] = useState(true)
  const [gpsCoords, setGpsCoords] = useState(null)
  const [gpsError, setGpsError] = useState(null)
  const [gpsLoading, setGpsLoading] = useState(true)

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  useEffect(() => { load() }, [])

  // Validate GPS location via backend before showing QR scanner
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError('GPS not supported on this device')
      setGpsLoading(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords
        setGpsCoords({ latitude, longitude })
        try {
          const res = await attendanceAPI.validateLocation({ latitude, longitude, accuracy })
          if (res.data.allowed) {
            setGpsLoading(false)
          } else {
            setGpsError(res.data.reason)
            setGpsLoading(false)
          }
        } catch {
          setGpsLoading(false)
        }
      },
      (err) => {
        const msg = err.code === 1
          ? 'Location access denied. Please allow GPS in browser settings.'
          : err.code === 2
            ? 'GPS signal unavailable. Try moving outdoors.'
            : 'GPS timed out. Please retry.'
        setGpsError(msg)
        setGpsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    )
  }, [])

  // QR Scanner
  useEffect(() => {
    if (today !== 'not_marked') return
    let scanner = null
    const timer = setTimeout(() => {
      try {
        scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: 250 }, false)
        scanner.render(
          async (decodedText) => {
            if (decodedText.startsWith('ATTENDANCE:')) {
              try { scanner.clear() } catch (_) { }
              const sessionId = decodedText.replace('ATTENDANCE:', '')
              try {
                const res = await attendanceAPI.mark({ sessionId, markedBy: 'QR', latitude: gpsCoords?.latitude, longitude: gpsCoords?.longitude })
                setToday(res.data.attendance?.status || 'present')
                await load()
              } catch (err) {
                if (err.response?.status === 403) {
                  setToday('absent')
                  await load()
                }
                console.error(err)
              }
            }
          },
          () => { }
        )
      } catch (err) {
        console.error('Scanner init error:', err)
      }
    }, 500)
    return () => {
      clearTimeout(timer)
      if (scanner) scanner.clear().catch(() => { })
    }
  }, [today])

  const load = async () => {
    try {
      const [todayRes, histRes] = await Promise.all([
        attendanceAPI.getToday(),
        attendanceAPI.getMe({ month, year }),
      ])
      setToday(todayRes.data.status || 'not_marked')
      setRecords(histRes.data.records || [])
      setStats(histRes.data.stats || { total: 0, present: 0, absent: 0, late: 0, percentage: '0' })
    } catch {
      setToday('not_marked')
      setRecords([])
      setStats({ total: 0, present: 0, absent: 0, late: 0, percentage: '0' })
    } finally {
      setLoading(false)
    }
  }

  const daysInMonth = getDaysInMonth(year, month - 1)
  const firstDay = getFirstDayOfMonth(year, month - 1)
  const dayMap = {}
  records.forEach(r => { dayMap[new Date(r.date).getDate()] = r.status })

  const statusColors = {
    present: { bg: '#dcfce7', text: '#16a34a' },
    absent: { bg: '#fee2e2', text: '#ef4444' },
    late: { bg: '#fef9c3', text: '#ca8a04' },
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div style={{ width: 32, height: 32, border: '3px solid #137fec20', borderTop: '3px solid #137fec', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div className="page-enter pb-28">
      <PageHeader title="Attendance" onBack={() => navigate('/dashboard')} />
      <main className="p-4 space-y-5">

        {/* GPS Status */}
        {today === 'not_marked' && (
          <div className={`rounded-2xl p-3 flex items-center gap-3 ${gpsLoading ? 'bg-blue-50 dark:bg-blue-900/20' :
              gpsError ? 'bg-red-50 dark:bg-red-900/20' :
                'bg-green-50 dark:bg-green-900/20'
            }`}>
            <span className="material-symbols-outlined icon-filled" style={{
              fontSize: 22,
              color: gpsLoading ? '#137fec' : gpsError ? '#ef4444' : '#10b981'
            }}>
              {gpsLoading ? 'location_searching' : gpsError ? 'location_off' : 'location_on'}
            </span>
            <p className="text-sm font-semibold" style={{
              color: gpsLoading ? '#137fec' : gpsError ? '#ef4444' : '#10b981'
            }}>
              {gpsLoading ? 'Getting your location…' : gpsError ? gpsError : 'Location verified ✓'}
            </p>
          </div>
        )}

        {/* QR Scanner — only shown when GPS is confirmed */}
        {today === 'not_marked' && !gpsLoading && !gpsError && (
          <>
            <h2 className="text-xl font-bold text-center dark:text-white">Scan QR Code</h2>
            <div id="qr-reader" style={{ width: '100%' }} />
            <p className="text-center text-sm text-gray-400">Place the QR code inside the frame</p>
          </>
        )}

        {/* Status card — shown after marking */}
        {today !== 'not_marked' && (
          <div className={`rounded-2xl p-5 text-center shadow-sm ${today === 'present' ? 'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800' :
              today === 'late' ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800' :
                'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800'
            }`}>
            <span className="material-symbols-outlined icon-filled" style={{
              fontSize: 48,
              color: today === 'present' ? '#16a34a' : today === 'late' ? '#ca8a04' : '#ef4444'
            }}>
              {today === 'present' ? 'check_circle' : today === 'late' ? 'schedule' : 'cancel'}
            </span>
            <p className="text-lg font-black mt-2" style={{
              color: today === 'present' ? '#16a34a' : today === 'late' ? '#ca8a04' : '#ef4444'
            }}>
              {today === 'present' ? "You're Present Today!" : today === 'late' ? 'Marked as Late' : 'Marked Absent'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Total', val: stats.total, color: '#137fec' },
            { label: 'Present', val: stats.present, color: '#16a34a' },
            { label: 'Absent', val: stats.absent, color: '#ef4444' },
            { label: 'Late', val: stats.late, color: '#ca8a04' },
          ].map(({ label, val, color }) => (
            <div key={label} className="rounded-xl bg-white dark:bg-slate-800 p-3 text-center shadow-sm">
              <p className="text-lg font-black" style={{ color }}>{val ?? 0}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Attendance rate */}
        <div className="rounded-xl bg-white dark:bg-slate-800 p-3 shadow-sm text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Attendance Rate</p>
          <p className="text-2xl font-black text-primary">{Math.round(parseFloat(stats.percentage || 0))}%</p>
        </div>

        {/* Calendar */}
        <div>
          <h3 className="font-bold text-base mb-3 dark:text-white">
            {now.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-400 mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i}>{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const status = dayMap[day]
              const colors = statusColors[status]
              const isToday = day === now.getDate()
              return (
                <div key={day}
                  className="aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition"
                  style={{
                    background: colors ? colors.bg : isToday ? '#e8f3fd' : '#f1f5f9',
                    color: colors ? colors.text : isToday ? '#137fec' : '#94a3b8',
                    border: isToday && !colors ? '1.5px solid #137fec' : 'none',
                  }}>
                  {day}
                </div>
              )
            })}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-gray-400">
            {[['#dcfce7', '#16a34a', 'Present'], ['#fee2e2', '#ef4444', 'Absent'], ['#fef9c3', '#ca8a04', 'Late']]
              .map(([bg, txt, label]) => (
                <div key={label} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ background: bg, border: `1px solid ${txt}` }} />
                  {label}
                </div>
              ))}
          </div>
        </div>

      </main>
    </div>
  )
}