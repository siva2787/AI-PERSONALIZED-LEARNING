# Smart Academics Architecture

## Overview
```
Browser (React SPA)
      │  HTTP / JSON
      ▼
Express REST API  ←→  MongoDB Atlas
      │
   JWT Auth
```

## Frontend Pages
- `/login`        → LoginPage
- `/register`     → RegisterPage
- `/dashboard`    → DashboardPage (score summary, chart, tasks)
- `/attendance`   → AttendancePage (QR scanner, calendar grid)
- `/scorer`       → ScorerPage (leaderboard + grade card tabs)
- `/tasks`        → TasksPage (filter list)
- `/tasks/:id`    → TaskDetailPage (prompt + response + submit)
- `/profile`      → ProfilePage (edit + dark mode + logout)

## Data Models
- **User**: name, email, password(hashed), studentId, preferredSubjects, role
- **Attendance**: student, date, status(present/absent/late), subject, markedBy
- **Score**: student, title, subject, type, score, maxScore, gradingPeriod, dueDate
- **Task**: student, title, description, type, status, prompt, resources, response, dueDate

## Auth Flow
1. POST /api/auth/register → returns JWT + user
2. Token stored in localStorage
3. All /api/* requests attach `Authorization: Bearer <token>`
4. 401 response → redirect to /login
