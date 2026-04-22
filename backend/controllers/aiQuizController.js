const axios = require("axios")
const Quiz = require("../models/Quiz")

exports.generateQuiz = async (req, res) => {
    try {
        const { subject, difficulty, questions } = req.body

        const existingQuiz = await Quiz.findOne({
            subject, difficulty, questionsCount: questions
        })

        if (existingQuiz) {
            if (existingQuiz.expiresAt && existingQuiz.expiresAt > new Date()) {
                console.log("Quiz loaded from MongoDB cache")
                return res.json({ questions: existingQuiz.questions })
            } else {
                await Quiz.deleteOne({ _id: existingQuiz._id })
            }
        }

        const prompt = `Generate ${questions} multiple choice questions for ${subject}. Difficulty: ${difficulty}. Return ONLY a valid JSON array, no markdown, no code blocks, no explanation. Format: [{"question":"text","options":["A","B","C","D"],"answer":0}]`

        console.log("Generating new quiz from AI")

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openrouter/free",
                messages: [{ role: "user", content: prompt }]
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        )

        let text = response.data.choices[0].message.content

        // Strip markdown code blocks if AI wraps response in them
        text = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim()

        let parsed
        try {
            parsed = JSON.parse(text)
        } catch {
            // Try to extract JSON array from text
            const match = text.match(/\[[\s\S]*\]/)
            if (match) {
                try {
                    parsed = JSON.parse(match[0])
                } catch {
                    // Clean common JSON issues — trailing commas
                    const cleaned = match[0].replace(/,\s*([}\]])/g, '$1')
                    parsed = JSON.parse(cleaned)
                }
            } else {
                parsed = []
            }
        }

        if (!parsed || parsed.length === 0) {
            return res.status(500).json({ message: "Failed to parse quiz questions" })
        }

        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        await Quiz.create({ subject, difficulty, questionsCount: questions, questions: parsed, expiresAt })

        res.json({ questions: parsed })

    } catch (error) {
        console.error("OPENROUTER ERROR:", error.response?.data || error.message)
        res.status(500).json({ message: "Failed to generate quiz" })
    }
}