const Attendance = require('../models/Attendance');
const { QRSession } = require('../models/Attendance');

const CLASSROOM_LAT = 11.014457801154123;
const CLASSROOM_LNG = 79.40993416863417;

function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const markAttendance = async (req, res) => {
  try {
    const { sessionId, status, subject, qrCode, markedBy, date, latitude, longitude } = req.body;

    let finalStatus = status || 'present';

    if (sessionId) {
      const session = await QRSession.findOne({ sessionId });
      if (!session) return res.status(404).json({ success: false, message: 'Invalid QR code' });
      const now = new Date();
      finalStatus = now >= session.expiresAt ? 'late' : 'present';
    }

    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    const existing = await Attendance.findOne({
      student: req.user._id,
      date: attendanceDate,
      subject: subject || 'General',
    });

    if (existing) {
      existing.status = finalStatus;
      existing.markedBy = markedBy || (sessionId ? 'QR' : 'Manual');
      existing.sessionId = sessionId || '';
      await existing.save();
      return res.json({ success: true, message: 'Attendance updated', attendance: existing });
    }

    const attendance = await Attendance.create({
      student: req.user._id,
      date: attendanceDate,
      status: finalStatus,
      subject: subject || 'General',
      markedBy: markedBy || (sessionId ? 'QR' : 'Manual'),
      qrCode: qrCode || '',
      sessionId: sessionId || '',
    });

    res.status(201).json({ success: true, message: 'Attendance marked', attendance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMyAttendance = async (req, res) => {
  try {
    const { month, year, subject } = req.query;
    const query = { student: req.user._id };

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      query.date = { $gte: start, $lte: end };
    }
    if (subject) query.subject = subject;

    const records = await Attendance.find(query).sort({ date: -1 });
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const percentage = total ? ((present / total) * 100).toFixed(1) : 0;

    res.json({ success: true, records, stats: { total, present, absent, late, percentage } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getTodayAttendance = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const record = await Attendance.findOne({
      student: req.user._id,
      date: { $gte: today, $lt: tomorrow },
    });

    res.json({ success: true, status: record ? record.status : 'not_marked', record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const validateLocation = (req, res) => {
  try {
    const { latitude, longitude, accuracy } = req.body;

    if (latitude === undefined || longitude === undefined ||
      latitude === null || longitude === null) {
      return res.json({ allowed: false, reason: 'Location data is missing. Please enable GPS and try again.' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng)) {
      return res.json({ allowed: false, reason: 'Invalid location data received.' });
    }

    if (accuracy !== undefined && accuracy !== null) {
      const acc = parseFloat(accuracy);
      if (!isNaN(acc) && acc > 50) {
        return res.json({
          allowed: false,
          reason: `GPS signal too weak (accuracy: ${Math.round(acc)}m). Move near a window and retry.`,
          accuracy: Math.round(acc),
        });
      }
    }

    const distance = getDistanceMeters(lat, lng, CLASSROOM_LAT, CLASSROOM_LNG);
    const distanceRounded = Math.round(distance);

    if (distance <= 75) {
      return res.json({ allowed: true, reason: `You are ${distanceRounded}m from the classroom. QR scanner unlocked.`, distance: distanceRounded });
    } else {
      return res.json({ allowed: false, reason: `You are ${distanceRounded}m away. Must be within 75m of the classroom.`, distance: distanceRounded });
    }
  } catch (err) {
    return res.status(500).json({ allowed: false, reason: 'Server error during location validation.' });
  }
};

module.exports = { markAttendance, getMyAttendance, getTodayAttendance, validateLocation };