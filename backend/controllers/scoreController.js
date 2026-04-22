const Score = require('../models/Score');
const User = require('../models/User');
const { calculateOverallScore, getLetterGrade } = require('../utils/helpers');

// ─── IST Date Helper ────────────────────────────────────────────────────────
// Returns "YYYY-MM-DD" string in Asia/Kolkata timezone
// Using UTC+5:30 offset manually — no external package needed
function getTodayIST() {
  const now = new Date();
  // IST = UTC + 5h 30min = UTC + 330 minutes
  const istOffset = 330 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  return istDate.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

// Returns "YYYY-MM-DD" for yesterday in IST
function getYesterdayIST() {
  const now = new Date();
  const istOffset = 330 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset - 24 * 60 * 60 * 1000);
  return istDate.toISOString().slice(0, 10);
}

// ─── Streak Update Logic ────────────────────────────────────────────────────
// Called after every quiz submission
// Rules:
//   - Multiple quizzes same day → count as 1 day (no duplicate increment)
//   - Last quiz was yesterday  → streak + 1
//   - Last quiz was today      → streak stays same (already counted)
//   - Last quiz was older      → streak resets to 1
async function updateStreak(userId) {
  const user = await User.findById(userId).select('streak lastStreakDate');

  const todayIST = getTodayIST();
  const yesterdayIST = getYesterdayIST();
  const lastDate = user.lastStreakDate; // "YYYY-MM-DD" string or null

  let newStreak = user.streak || 0;

  if (!lastDate) {
    // First quiz ever
    newStreak = 1;
  } else if (lastDate === todayIST) {
    // Already counted today — do nothing
    return { streak: newStreak, updated: false };
  } else if (lastDate === yesterdayIST) {
    // Consecutive day — increment
    newStreak = newStreak + 1;
  } else {
    // Gap detected — reset to 1
    newStreak = 1;
  }

  await User.findByIdAndUpdate(userId, {
    streak: newStreak,
    lastStreakDate: todayIST,
  });

  return { streak: newStreak, updated: true };
}

// ─── GET /api/scores/me ─────────────────────────────────────────────────────
const getMyScores = async (req, res) => {
  try {
    const { subject, type, gradingPeriod } = req.query;
    const query = { student: req.user._id };
    if (subject) query.subject = subject;
    if (type) query.type = type;
    if (gradingPeriod) query.gradingPeriod = gradingPeriod;

    const scores = await Score.find(query).sort({ createdAt: -1 });
    const overall = calculateOverallScore(scores);
    const letterGrade = getLetterGrade(overall);

    const bySubject = {};
    scores.forEach(s => {
      if (!bySubject[s.subject]) bySubject[s.subject] = [];
      bySubject[s.subject].push(s);
    });

    const subjectSummary = Object.entries(bySubject).map(([subject, items]) => ({
      subject,
      average: calculateOverallScore(items),
      count: items.length,
    }));

    const assignments = scores.filter(s => s.type === 'assignment');
    const quizzes = scores.filter(s => s.type === 'quiz');
    const exams = scores.filter(s => s.type === 'exam');
    const projects = scores.filter(s => s.type === 'project');

    // Include streak info in response
    const user = await User.findById(req.user._id).select('streak lastStreakDate xp level');

    res.json({
      success: true,
      scores,
      summary: { overall, letterGrade, bySubject: subjectSummary },
      grouped: { assignments, quizzes, exams, projects },
      streak: user.streak || 0,
      lastStreakDate: user.lastStreakDate || null,
      xp: user.xp || 0,
      level: user.level || 1,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/scores ───────────────────────────────────────────────────────
const addScore = async (req, res) => {
  try {
    const studentId = req.body.studentId || req.user._id;
    const score = await Score.create({ ...req.body, student: studentId });

    // ── XP Calculation ──────────────────────────────────────────────────────
    let xpEarned = 0;
    if (req.body.type === 'quiz') {
      const pct = Math.round((req.body.score / req.body.maxScore) * 100);
      xpEarned += 50;              // Base XP for completing quiz
      if (pct >= 80) xpEarned += 30;  // Bonus for 80%+
      if (pct === 100) xpEarned += 50; // Perfect score bonus

      // Update XP and level
      const user = await User.findById(studentId);
      const newXP = (user.xp || 0) + xpEarned;
      const newLevel = Math.floor(newXP / 300) + 1;
      await User.findByIdAndUpdate(studentId, { xp: newXP, level: newLevel });
    }

    // ── Streak Update ────────────────────────────────────────────────────────
    // Only update streak for quiz type — not assignments or exams
    let streakResult = { streak: 0, updated: false };
    if (req.body.type === 'quiz') {
      streakResult = await updateStreak(studentId);
    }

    // Fetch updated user for response
    const updatedUser = await User.findById(studentId).select('xp level streak lastStreakDate');

    res.status(201).json({
      success: true,
      score,
      xpEarned,
      xp: updatedUser.xp,
      level: updatedUser.level,
      streak: updatedUser.streak,
      streakUpdated: streakResult.updated,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/scores/leaderboard ────────────────────────────────────────────
const getLeaderboard = async (req, res) => {
  try {
    const { subject, gradingPeriod, limit = 10 } = req.query;
    const matchQuery = {};
    if (subject) matchQuery.subject = subject;
    if (gradingPeriod) matchQuery.gradingPeriod = gradingPeriod;

    const leaderboard = await Score.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$student',
          totalScore: { $sum: '$score' },
          totalMax: { $sum: '$maxScore' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          student: '$_id',
          averageScore: {
            $round: [{ $multiply: [{ $divide: ['$totalScore', '$totalMax'] }, 100] }, 1],
          },
          count: 1,
        },
      },
      { $sort: { averageScore: -1 } },
      { $limit: parseInt(limit) },
      { $lookup: { from: 'users', localField: 'student', foreignField: '_id', as: 'studentInfo' } },
      { $unwind: '$studentInfo' },
      {
        $project: {
          averageScore: 1,
          count: 1,
          name: '$studentInfo.name',
          studentId: '$studentInfo.studentId',
          avatar: '$studentInfo.avatar',
          streak: '$studentInfo.streak',
          xp: '$studentInfo.xp',
        },
      },
    ]);

    const myId = req.user._id.toString();
    const myRank = leaderboard.findIndex(l => l._id?.toString() === myId) + 1;

    res.json({ success: true, leaderboard, myRank: myRank || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/scores/progress ────────────────────────────────────────────────
const getWeeklyProgress = async (req, res) => {
  try {
    const now = new Date();
    const currentWeekNum = Math.ceil(now.getDate() / 7);
    const allScores = await Score.find({ student: req.user._id });
    const overall = calculateOverallScore(allScores);

    const weeks = [];
    for (let w = 1; w <= 4; w++) {
      let average = null;
      if (w < currentWeekNum) average = 0;
      if (w === currentWeekNum) average = overall;
      weeks.push({ week: 'W' + w, average });
    }

    res.json({ success: true, progress: weeks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/scores/recent-quizzes ─────────────────────────────────────────
const getRecentQuizzes = async (req, res) => {
  try {
    const quizzes = await Score.find({ student: req.user._id, type: 'quiz' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title subject score maxScore createdAt gradingPeriod');

    const result = quizzes.map(q => ({
      _id: q._id,
      title: q.title,
      subject: q.subject,
      score: q.score,
      maxScore: q.maxScore,
      percentage: Math.round((q.score / q.maxScore) * 100),
      grade: getLetterGrade(Math.round((q.score / q.maxScore) * 100)),
      difficulty: q.gradingPeriod || 'Medium',
      date: q.createdAt,
    }));

    res.json({ success: true, quizzes: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getMyScores, addScore, getLeaderboard, getWeeklyProgress, getRecentQuizzes };