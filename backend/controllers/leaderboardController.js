const Score = require('../models/Score');
const User = require('../models/User');

const getLeaderboard = async (req, res) => {
    try {
        const scores = await Score.find({});

        const userScores = {};

        scores.forEach(score => {
            const userId = score.student.toString();
            if (!userScores[userId]) {
                userScores[userId] = { totalCorrect: 0, totalQuestions: 0 };
            }
            userScores[userId].totalCorrect += score.score;
            // Assuming maxScore holds the total questions per quiz, or defaulting to 10
            userScores[userId].totalQuestions += score.maxScore || 100;
        });

        const userIds = Object.keys(userScores);
        const users = await User.find({ _id: { $in: userIds } });

        const leaderboardResults = users.map(user => {
            const stats = userScores[user._id.toString()];
            const percentage = stats.totalQuestions > 0
                ? (stats.totalCorrect / stats.totalQuestions) * 100
                : 0;

            return {
                name: user.name,
                averageScore: Math.round(percentage)
            };
        });

        leaderboardResults.sort((a, b) => b.averageScore - a.averageScore);

        const rankedLeaderboard = leaderboardResults.map((item, index) => ({
            rank: index + 1,
            name: item.name,
            averageScore: item.averageScore
        }));

        res.json({ leaderboard: rankedLeaderboard });

    } catch (error) {
        console.error('Leaderboard generation error:', error);
        res.status(500).json({ message: 'Failed to generate leaderboard' });
    }
};

module.exports = {
    getLeaderboard
};
