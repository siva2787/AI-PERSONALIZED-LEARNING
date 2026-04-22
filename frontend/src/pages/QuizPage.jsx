import { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { PageHeader } from '../components/common/index.jsx'
import { scoresAPI } from '../services/api'

export default function QuizPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const location = useLocation()

    const [answers, setAnswers] = useState({})
    const [submitted, setSubmitted] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    // Subject passed from wherever quiz is launched
    const subject = location.state?.subject || 'General'

    const passedQuestions = location.state?.questions || []

    const questions = passedQuestions.length > 0
        ? passedQuestions.map((q, i) => ({
            id: i,
            text: q.question,
            options: q.options,
            correct: q.answer
        }))
        : Array.from({ length: 10 }).map((_, i) => ({
            id: i,
            text: `Sample Question ${i + 1} for Quiz ${id}?`,
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correct: 0
        }))

    const handleSelect = (qId, oIdx) => {
        if (submitted) return
        setAnswers(prev => ({ ...prev, [qId]: oIdx }))
    }

    const score = Object.entries(answers).reduce((acc, [qId, oIdx]) => {
        return acc + (questions[qId].correct === oIdx ? 1 : 0)
    }, 0)

    const handleSubmit = async () => {
        setSubmitted(true)
        setSaving(true)

        // FIX: save score to backend so ScorerPage shows real data
        try {
            await scoresAPI.add({
                title: `${subject} Quiz`,
                subject,
                type: 'quiz',
                score,
                maxScore: questions.length,
            })
            setSaved(true)
        } catch (err) {
            console.error('Could not save score:', err)
            setSaved(false)
        } finally {
            setSaving(false)
        }
    }

    const percentage = Math.round((score / questions.length) * 100)
    const grade = percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F'
    const gradeColor = percentage >= 80 ? '#10b981' : percentage >= 60 ? '#f59e0b' : '#ef4444'

    return (
        <div className="page-enter pb-28">
            <PageHeader title="Quiz" onBack={() => navigate('/tasks')} />
            <main className="p-4 space-y-5">
                <h2 className="text-xl font-bold dark:text-white">Quiz Activity</h2>

                {submitted ? (
                    <div className="space-y-4">

                        {/* Score card */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm text-center">
                            <div style={{
                                width: 90, height: 90, borderRadius: '50%',
                                background: `${gradeColor}18`, border: `3px solid ${gradeColor}`,
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
                            }}>
                                <p className="text-2xl font-black" style={{ color: gradeColor }}>{percentage}%</p>
                                <p className="text-sm font-bold" style={{ color: gradeColor }}>{grade}</p>
                            </div>
                            <h3 className="text-lg font-bold dark:text-white mb-1">Quiz Completed!</h3>
                            <p className="text-gray-400 text-sm">{subject}</p>
                            <p className="text-3xl font-black dark:text-white mt-2">{score} / {questions.length}</p>
                        </div>

                        {/* Save status */}
                        <div className={`rounded-xl p-3 text-center text-sm font-medium ${
                            saving ? 'bg-blue-50 text-blue-600' :
                            saved  ? 'bg-green-50 text-green-700' :
                                     'bg-red-50 text-red-600'
                        }`}>
                            {saving ? '⏳ Saving your score...' :
                             saved  ? '✅ Score saved to your profile!' :
                                      '⚠ Score could not be saved'}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate('/scorer')}
                                className="btn-ghost flex-1"
                            >
                                View Analytics
                            </button>
                            <button
                                onClick={() => navigate('/tasks')}
                                className="btn-primary flex-1"
                            >
                                Back to Tasks
                            </button>
                        </div>

                        {/* Answer review */}
                        <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-sm p-4">
                            <p className="font-bold dark:text-white mb-3">Review Answers</p>
                            <div className="space-y-2">
                                {questions.map((q, i) => {
                                    const chosen = answers[q.id]
                                    const correct = chosen === q.correct
                                    return (
                                        <div key={q.id} className="p-3 rounded-xl"
                                            style={{ background: correct ? '#dcfce7' : '#fee2e2' }}>
                                            <p className="text-xs font-semibold" style={{ color: correct ? '#15803d' : '#b91c1c' }}>
                                                {correct ? '✅' : '❌'} {i + 1}. {q.text}
                                            </p>
                                            {!correct && (
                                                <p className="text-xs mt-1" style={{ color: '#15803d' }}>
                                                    Correct: {q.options[q.correct]}
                                                </p>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {questions.map((q, i) => (
                            <div key={q.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                                <p className="font-bold mb-3 dark:text-white">{i + 1}. {q.text}</p>
                                <div className="space-y-2">
                                    {q.options.map((opt, oIdx) => {
                                        const isSelected = answers[q.id] === oIdx
                                        return (
                                            <button
                                                key={oIdx}
                                                onClick={() => handleSelect(q.id, oIdx)}
                                                className={`w-full text-left p-3 rounded-lg border transition ${isSelected
                                                    ? 'border-primary bg-primary/10 text-primary font-medium shadow-sm'
                                                    : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 dark:bg-slate-800 hover:bg-black/5 dark:hover:bg-white/5'
                                                    }`}
                                            >
                                                {opt}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={handleSubmit}
                            disabled={Object.keys(answers).length < questions.length}
                            className="w-full py-3 bg-primary text-white rounded-xl font-bold transition disabled:opacity-50 shadow-md hover:shadow-lg focus:ring-4 focus:ring-primary/20"
                        >
                            Submit Quiz
                        </button>
                    </div>
                )}
            </main>
        </div>
    )
}