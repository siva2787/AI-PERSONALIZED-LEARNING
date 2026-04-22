import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AttendancePage from './pages/AttendancePage'
import TrackerPage from './pages/TrackerPage'
import ScorerPage from './pages/ScorerPage'
import TasksPage from './pages/TasksPage'
import TaskDetailPage from './pages/TaskDetailPage'
import ProfilePage from './pages/ProfilePage'
import QuizPage from './pages/QuizPage'
import QuizHistoryPage from './pages/QuizHistoryPage'

const spinnerCSS = `@keyframes spin { to { transform: rotate(360deg); } }`

function PrivateRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { token } = useAuth()
  return token ? <Navigate to="/tracker" replace /> : children
}

export default function App() {
  return (
    <>
      <style>{spinnerCSS}</style>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

            <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
              <Route index element={<Navigate to="/tracker" replace />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/tracker" element={<TrackerPage />} />
              <Route path="/scorer" element={<ScorerPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/tasks/:id" element={<TaskDetailPage />} />
              <Route path="/quiz/:id" element={<QuizPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/quiz-history" element={<QuizHistoryPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/tracker" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </>
  )
}