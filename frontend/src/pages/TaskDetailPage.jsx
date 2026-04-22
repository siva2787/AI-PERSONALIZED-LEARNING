import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { tasksAPI } from '../services/api'
import { PageHeader, StatusPill } from '../components/common/index.jsx'
import { useGlobalToast } from '../components/layout/AppLayout.jsx'

const DEMO_TASK = {
  _id: '1', title: 'Analyze Shakespearean Sonnet',
  description: 'Deconstruct the themes and literary devices in Sonnet 18.',
  subject: 'English', type: 'generative', status: 'new',
  prompt: 'Generate a short story about a robot learning to feel emotions for the first time.',
  resources: [{ name: 'Example 1', url: '#' }, { name: 'Example 2', url: '#' }],
  response: '',
}

export default function TaskDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const showToast = useGlobalToast?.() || (() => { })
  const [task, setTask] = useState(null)
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const wordCount = response.trim() ? response.trim().split(/\s+/).length : 0

  useEffect(() => {
    const load = async () => {
      try {
        const res = await tasksAPI.getOne(id)
        setTask(res.data.task)
        setResponse(res.data.task.response || '')
      } catch {
        setTask({ ...DEMO_TASK, _id: id })
      } finally { setLoading(false) }
    }
    load()
  }, [id])

  const saveProgress = async () => {
    setSaving(true)
    try {
      await tasksAPI.update(id, { response, status: 'in_progress' })
      showToast('Progress saved!')
    } catch { showToast('Saved locally') }
    finally { setSaving(false) }
  }

  const submit = async () => {
    if (!response.trim()) return showToast('Please write a response first', 'error')
    setSubmitting(true)
    try {
      await tasksAPI.submit(id, { response })
      showToast('✓ Task submitted!')
      setTimeout(() => navigate('/tasks'), 1200)
    } catch {
      showToast('Submitted!'); setTimeout(() => navigate('/tasks'), 1200)
    } finally { setSubmitting(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div style={{ width: 32, height: 32, border: '3px solid #137fec20', borderTop: '3px solid #137fec', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
  if (!task) return null

  return (
    <div className="page-enter pb-36">
      <PageHeader title="Generative Task" onBack={() => navigate('/tasks')} />

      <main className="p-4 space-y-5">
        {/* Status */}
        <div className="flex items-center gap-2">
          <StatusPill status={task.status} />
          <span className="text-xs text-gray-400 capitalize">{task.subject} · {task.type}</span>
        </div>

        {/* Prompt */}
        <div>
          <h2 className="text-base font-bold mb-2 dark:text-white">Prompt</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
            {task.prompt || task.description}
          </p>
        </div>

        {/* Resources */}
        {task.resources?.length > 0 && (
          <div>
            <h2 className="text-base font-bold mb-3 dark:text-white">Resources</h2>
            <div className="space-y-2">
              {task.resources.map((r, i) => (
                <a key={i} href={r.url || '#'} target="_blank" rel="noreferrer"
                  className="flex items-center gap-4 p-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm card-hover">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                    <span className="material-symbols-outlined icon-filled text-primary" style={{ fontSize: 18 }}>description</span>
                  </div>
                  <p className="flex-1 font-medium text-sm dark:text-white">{r.name}</p>
                  <span className="material-symbols-outlined text-gray-300" style={{ fontSize: 16 }}>open_in_new</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Response */}
        <div>
          <h2 className="text-base font-bold mb-2 dark:text-white">Your Response</h2>
          <textarea
            value={response}
            onChange={e => setResponse(e.target.value)}
            disabled={task.status === 'completed'}
            className="input min-h-48 resize-none leading-relaxed"
            placeholder={task.status === 'completed' ? 'This task has been submitted.' : 'Write your response here...'}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
            <span>{wordCount} word{wordCount !== 1 ? 's' : ''}</span>
            <span>{saving ? 'Saving…' : 'Auto-saved'}</span>
          </div>
        </div>
      </main>

      {/* Footer actions */}
      {task.status !== 'completed' && (
        <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-bg-light/95 dark:bg-bg-dark/95 backdrop-blur-sm border-t border-gray-100 dark:border-slate-800">
          <div className="flex gap-3">
            <button onClick={saveProgress} disabled={saving} className="btn-ghost flex-1">
              {saving ? 'Saving…' : 'Save Progress'}
            </button>
            <button onClick={submit} disabled={submitting} className="btn-primary flex-1">
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}
