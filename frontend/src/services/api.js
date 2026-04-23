import axios from 'axios'

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || '') + '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── AUTH ──────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
}

// ── ATTENDANCE ────────────────────────────────────────────────────
export const attendanceAPI = {
  generate: (data) => api.post('/attendance/generate', data),
  mark: (data) => api.post('/attendance/mark', data),
  validateLocation: (data) => api.post('/attendance/validate-location', data),
  getMe: (params) => api.get('/attendance/me', { params }),
  getToday: () => api.get('/attendance/today'),
  getTodayAll: () => api.get('/attendance/today-all'),
  getSession: (id) => api.get(`/attendance/session/${id}`),
  edit: (data) => api.put('/attendance/edit', data),
}

// ── SCORES ────────────────────────────────────────────────────────
export const scoresAPI = {
  getMe: (params) => api.get('/scores/me', { params }),
  add: (data) => api.post('/scores', data),
  getLeaderboard: (params) => api.get('/scores/leaderboard', { params }),
  getProgress: () => api.get('/scores/progress'),
  getRecentQuizzes: () => api.get('/scores/recent-quizzes'),
}

// ── AI ────────────────────────────────────────────────────────────
export const aiAPI = {
  generateQuiz: (data) => api.post('/ai/generate-quiz', data),
}

// ── RECOMMENDATIONS ───────────────────────────────────────────────
export const recommendationsAPI = {
  getVideos: (params) => api.get('/recommendations/videos', { params }),
}

// ── ANALYTICS ─────────────────────────────────────────────────────
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
}

// ── STUDY TRACKER ────────────────────────────────────────────────
export const trackerAPI = {
  checkIn: (data) => api.post('/tracker/checkin', data),
  getStats: () => api.get('/tracker/stats'),
  getInsights: () => api.get('/tracker/insights'),
}

// ── TASKS ─────────────────────────────────────────────────────────
export const tasksAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getOne: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  submit: (id, data) => api.post(`/tasks/${id}/submit`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
}

export default api