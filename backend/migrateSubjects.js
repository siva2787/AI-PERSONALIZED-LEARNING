// Run this once: node migrateSubjects.js
// Removes old non-AI/DS subjects from ALL existing users in MongoDB

const mongoose = require('mongoose')
require('dotenv').config()

const VALID_SUBJECTS = [
  'Machine Learning',
  'Artificial Intelligence',
  'Deep Learning',
  'Data Structures & Algorithms',
  'Python Programming',
  'Data Science',
  'Neural Networks',
  'Natural Language Processing',
  'Computer Vision',
  'Database Management Systems',
  'Statistics for Data Science',
  'Big Data Analytics',
  'Cloud Computing',
  'Reinforcement Learning',
  'Data Mining',
  'Programming in C',
]

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smartacademics')
  console.log('Connected to MongoDB')

  const User = require('./models/User')
  const users = await User.find({ preferredSubjects: { $exists: true } })

  console.log(`Found ${users.length} users to check...`)

  let updated = 0
  for (const user of users) {
    const cleaned = user.preferredSubjects.filter(s => VALID_SUBJECTS.includes(s))
    if (cleaned.length !== user.preferredSubjects.length) {
      const removed = user.preferredSubjects.filter(s => !VALID_SUBJECTS.includes(s))
      console.log(`User ${user.name}: removing [${removed.join(', ')}]`)
      user.preferredSubjects = cleaned
      await user.save()
      updated++
    }
  }

  console.log(`✅ Migration done. Updated ${updated} users.`)
  await mongoose.disconnect()
}

migrate().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})