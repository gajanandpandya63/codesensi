import express from 'express';
import cors from 'cors';
import { questions } from './questions.js';
import { evaluateCode } from './llmService.js';
import { getPastMistakes, storeMistake } from './memoryService.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/get-question', (req, res) => {
  try {
    const randomIndex = Math.floor(Math.random() * questions.length);
    res.json(questions[randomIndex]);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/api/submit', async (req, res) => {
  const { userName, code, topic } = req.body;
  if (!userName || !code || !topic) return res.status(400).json({ error: 'userName, code, and topic required' });

  try {
    const pastMistakes = await getPastMistakes(userName, topic);
    console.log("PAST MISTAKES:", pastMistakes);

    const result = await evaluateCode(code, topic, pastMistakes);
    console.log("RESULT:", result);

    if (result && result.toLowerCase().includes("incorrect")) {
      await storeMistake(userName, topic, result);
    }

    res.json({
      feedback: result,
      pastMistakes: pastMistakes || []
    });
  } catch (err) {
    console.error("Evaluation error:", err);
    res.status(500).json({ error: 'Internal server error while evaluating code' });
  }
});

app.get('/api/status', (req, res) => {
    res.json({ status: 'Backend is running!' });
});

app.listen(PORT, () => {
  console.log(`[SYS] Server running on port ${PORT}`);
});
