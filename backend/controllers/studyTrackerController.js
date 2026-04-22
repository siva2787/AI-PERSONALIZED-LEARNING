const StudyLog = require('../models/StudyLog');
const User = require('../models/User');
const { getTodayIST } = require('../models/StudyLog');

// ── IST helpers ──────────────────────────────────────────────────────────────
function getYesterdayIST() {
  const now = new Date();
  const ist = new Date(now.getTime() + 330 * 60 * 1000 - 86400000);
  return ist.toISOString().slice(0, 10);
}

function getDateDaysAgoIST(n) {
  const now = new Date();
  const ist = new Date(now.getTime() + 330 * 60 * 1000 - n * 86400000);
  return ist.toISOString().slice(0, 10);
}

// ── Streak calculator ────────────────────────────────────────────────────────
// Reads all logs sorted desc, walks back from today counting consecutive days
function calcStreak(logs) {
  if (!logs.length) return 0;
  const dateSet = new Set(logs.filter(l => l.studiedToday).map(l => l.date));
  let streak = 0;
  let cursor = getTodayIST();

  // Allow streak to continue if today OR yesterday was the last study day
  if (!dateSet.has(cursor)) {
    cursor = getYesterdayIST();
    if (!dateSet.has(cursor)) return 0;
    streak = 1;
    cursor = getDateDaysAgoIST(2);
  } else {
    streak = 1;
    cursor = getYesterdayIST();
  }

  // Walk backwards counting consecutive days
  let daysBack = cursor === getYesterdayIST() ? 2 : 3;
  while (dateSet.has(cursor)) {
    streak++;
    cursor = getDateDaysAgoIST(daysBack++);
  }
  return streak;
}

// ── Rule-based insights ──────────────────────────────────────────────────────
function generateInsights(logs, streak, consistencyScore) {
  const insights = [];
  const todayIST = getTodayIST();

  // Last 7 days
  const last7 = logs.filter(l => l.date >= getDateDaysAgoIST(6));
  const studied7 = last7.filter(l => l.studiedToday).length;

  // Last 14 days split into two weeks
  const thisWeek = logs.filter(l => l.date >= getDateDaysAgoIST(6) && l.studiedToday).length;
  const lastWeek = logs.filter(l =>
    l.date >= getDateDaysAgoIST(13) && l.date < getDateDaysAgoIST(6) && l.studiedToday
  ).length;

  // Weekend check (Sat=6, Sun=0)
  const weekendLogs = logs.filter(l => {
    const day = new Date(l.date + 'T00:00:00+05:30').getDay();
    return (day === 0 || day === 6) && l.studiedToday;
  });
  const weekdayLogs = logs.filter(l => {
    const day = new Date(l.date + 'T00:00:00+05:30').getDay();
    return day !== 0 && day !== 6 && l.studiedToday;
  });

  // Streak insights
  if (streak >= 7) insights.push({ type: 'success', text: `🔥 Incredible! ${streak}-day streak — you are on fire!` });
  else if (streak >= 3) insights.push({ type: 'success', text: `✅ Great consistency! You've studied ${streak} days in a row.` });
  else if (streak === 1) insights.push({ type: 'info', text: '📅 Good start! Study tomorrow to build your streak.' });
  else insights.push({ type: 'warning', text: '⚠️ No active streak. Start today to build momentum!' });

  // Weekly comparison
  if (lastWeek > 0) {
    if (thisWeek > lastWeek) insights.push({ type: 'success', text: `📈 You studied more this week (${thisWeek} days) vs last week (${lastWeek} days). Keep it up!` });
    else if (thisWeek < lastWeek) insights.push({ type: 'warning', text: `📉 Your study dropped this week (${thisWeek} days) compared to last week (${lastWeek} days).` });
    else insights.push({ type: 'info', text: `📊 Same pace as last week (${thisWeek} days). Try to push a little more!` });
  }

  // Weekend vs weekday
  const totalWeekend = logs.filter(l => {
    const day = new Date(l.date + 'T00:00:00+05:30').getDay();
    return day === 0 || day === 6;
  }).length;
  const totalWeekday = logs.filter(l => {
    const day = new Date(l.date + 'T00:00:00+05:30').getDay();
    return day !== 0 && day !== 6;
  }).length;

  if (totalWeekend >= 4 && totalWeekday >= 4) {
    const weekendRate = weekendLogs.length / totalWeekend;
    const weekdayRate = weekdayLogs.length / totalWeekday;
    if (weekendRate < weekdayRate - 0.3) {
      insights.push({ type: 'info', text: '📅 You tend to study less on weekends. Try a light session on Saturdays!' });
    }
  }

  // Consistency insights
  if (consistencyScore >= 80) insights.push({ type: 'success', text: `🏆 ${Math.round(consistencyScore)}% consistency — excellent discipline!` });
  else if (consistencyScore >= 50) insights.push({ type: 'info', text: `💪 ${Math.round(consistencyScore)}% consistency. You're doing well — aim for 80%!` });
  else if (consistencyScore > 0) insights.push({ type: 'warning', text: `📚 ${Math.round(consistencyScore)}% consistency. Small daily habits make a big difference.` });

  // Difficulty trend
  const recentDifficult = last7.filter(l => l.difficulty === 'hard').length;
  if (recentDifficult >= 3) insights.push({ type: 'info', text: '🧠 You\'ve been tackling hard topics lately — great growth mindset!' });

  // Studied today
  const studiedToday = logs.some(l => l.date === todayIST && l.studiedToday);
  if (!studiedToday) insights.push({ type: 'warning', text: "⏰ You haven't logged today yet. Don't break your streak!" });

  return insights;
}

// ── POST /api/tracker/checkin ────────────────────────────────────────────────
const checkIn = async (req, res) => {
  try {
    const { studiedToday = true, studyHours, topic, difficulty = 'medium' } = req.body;
    const todayIST = getTodayIST();

    // One entry per day — check duplicate
    const existing = await StudyLog.findOne({ user: req.user._id, date: todayIST });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You already checked in today. Come back tomorrow!',
        entry: existing,
      });
    }

    // Create log entry
    const entry = await StudyLog.create({
      user: req.user._id,
      date: todayIST,
      studiedToday,
      studyHours: studyHours || null,
      topic: topic || '',
      difficulty,
    });

    // Update streak on User model
    const allLogs = await StudyLog.find({ user: req.user._id }).sort({ date: -1 });
    const streak = calcStreak(allLogs);
    await User.findByIdAndUpdate(req.user._id, { streak, lastStreakDate: todayIST });

    res.status(201).json({ success: true, entry, streak });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Already checked in today.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/tracker/stats ───────────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const logs = await StudyLog.find({ user: req.user._id }).sort({ date: -1 });

    const totalDaysTracked = logs.length;
    const daysStudied = logs.filter(l => l.studiedToday).length;
    const consistencyScore = totalDaysTracked
      ? parseFloat(((daysStudied / totalDaysTracked) * 100).toFixed(1))
      : 0;

    const streak = calcStreak(logs);

    // Total study hours
    const totalHours = logs.reduce((sum, l) => sum + (l.studyHours || 0), 0);

    // Last 14 days for chart
    const last14 = Array.from({ length: 14 }, (_, i) => {
      const date = getDateDaysAgoIST(13 - i);
      const log = logs.find(l => l.date === date);
      return {
        date,
        label: new Date(date + 'T00:00:00+05:30')
          .toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        studied: log?.studiedToday || false,
        hours: log?.studyHours || 0,
        difficulty: log?.difficulty || null,
        topic: log?.topic || '',
      };
    });

    // Today's entry
    const todayEntry = logs.find(l => l.date === getTodayIST()) || null;

    res.json({
      success: true,
      streak,
      totalDaysTracked,
      daysStudied,
      consistencyScore,
      totalHours: parseFloat(totalHours.toFixed(1)),
      last14,
      todayEntry,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/tracker/insights ────────────────────────────────────────────────
const getInsights = async (req, res) => {
  try {
    const logs = await StudyLog.find({ user: req.user._id }).sort({ date: -1 });
    const daysStudied = logs.filter(l => l.studiedToday).length;
    const consistencyScore = logs.length ? (daysStudied / logs.length) * 100 : 0;
    const streak = calcStreak(logs);
    const insights = generateInsights(logs, streak, consistencyScore);
    res.json({ success: true, insights });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { checkIn, getStats, getInsights };