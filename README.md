# Smart Academics v2 🎓

A full-stack student academic management app — React + Node.js/Express + MongoDB.

## Project Structure

```
smart-academics-v2/
├── backend/                   # Node.js + Express API
│   ├── config/db.js           # MongoDB connection
│   ├── controllers/           # Route handlers
│   ├── middleware/            # JWT auth middleware
│   ├── models/                # Mongoose schemas
│   ├── routes/                # Express routers
│   ├── utils/helpers.js       # Shared utilities
│   ├── .env.example           # Environment template
│   └── server.js              # Entry point
│
└── frontend/                  # React + Vite + Tailwind
    └── src/
        ├── components/
        │   ├── common/        # Toast, Avatar, ProgressBar, etc.
        │   └── layout/        # AppLayout, BottomNav
        ├── context/           # AuthContext (login, dark mode)
        ├── hooks/             # useFetch, useToast
        ├── pages/             # All 7 screens
        ├── services/api.js    # Axios API client
        └── utils/helpers.js   # Frontend utilities
```

## Quick Start

### 1. Backend
```bash
cd backend
cp .env.example .env
# Edit .env — set MONGO_URI and JWT_SECRET
npm install
npm run dev        # runs on http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev        # runs on http://localhost:5173
```

## API Endpoints

| Method | Endpoint                    | Description               |
|--------|-----------------------------|---------------------------|
| POST   | /api/auth/register          | Register new student      |
| POST   | /api/auth/login             | Login                     |
| GET    | /api/auth/me                | Get profile               |
| PUT    | /api/auth/profile           | Update profile            |
| POST   | /api/attendance/mark        | Mark attendance           |
| GET    | /api/attendance/me          | Get attendance records    |
| GET    | /api/attendance/today       | Today's status            |
| GET    | /api/scores/me              | My grades                 |
| GET    | /api/scores/leaderboard     | Class leaderboard         |
| GET    | /api/scores/progress        | Weekly progress           |
| GET    | /api/tasks                  | All my tasks              |
| GET    | /api/tasks/:id              | Single task               |
| PUT    | /api/tasks/:id              | Update task               |
| POST   | /api/tasks/:id/submit       | Submit task               |

## Features
- 🔐 JWT Authentication (register / login)
- 📊 Dashboard with score breakdown + progress chart
- 📅 Attendance with QR simulation + monthly calendar
- 🏆 Leaderboard + Grade Card
- ✅ AI Tasks list with status filtering
- ✍️ Generative task detail with save & submit
- 👤 Profile with dark mode toggle
- 🌙 Dark mode (persisted to localStorage)
- 📱 Mobile-first responsive design
