import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Pobierz top 10 wyników
app.get('/api/leaderboard', async (req, res) => {
  try {
    const scores = await prisma.score.findMany({
      orderBy: { points: 'desc' },
      take: 10,
    });
    res.json(scores);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Zapisz nowy wynik
app.post('/api/score', async (req, res) => {
  const { playerName, points, round } = req.body;
  
  if (!playerName || points === undefined) {
    return res.status(400).json({ error: 'Missing data' });
  }

  try {
    const newScore = await prisma.score.create({
      data: {
        playerName,
        points,
        round
      },
    });
    res.json(newScore);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save score' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});