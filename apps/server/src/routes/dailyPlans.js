const express = require('express');
const pool = require('../db/pool');
const verifyToken = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

// GET /api/daily-plans/today - Get today's plan
router.get('/today', async (req, res) => {
  const now = new Date();
  const today = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0');

  try {
    const result = await pool.query(
      `SELECT * FROM daily_plans 
       WHERE user_id = $1 AND plan_date = $2`,
      [req.user.id, today]
    );

    if (result.rows.length === 0) {
      // Return empty plan structure
      return res.json({
        plan_date: today,
        priority_1: null,
        priority_2: null,
        priority_3: null,
        morning_notes: null,
        morning_mood: null,
        morning_energy: null,
        morning_completed_at: null,
        evening_notes: null,
        evening_mood: null,
        evening_energy: null,
        day_rating: null,
        wins: null,
        improvements: null,
        gratitude: null,
        evening_completed_at: null,
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch daily plan.' });
  }
});

// GET /api/daily-plans/date/:date - Get plan for specific date
router.get('/date/:date', async (req, res) => {
  const { date } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM daily_plans 
       WHERE user_id = $1 AND plan_date = $2`,
      [req.user.id, date]
    );

    if (result.rows.length === 0) {
      return res.json({
        plan_date: date,
        priority_1: null,
        priority_2: null,
        priority_3: null,
        morning_notes: null,
        morning_mood: null,
        morning_energy: null,
        morning_completed_at: null,
        evening_notes: null,
        evening_mood: null,
        evening_energy: null,
        day_rating: null,
        wins: null,
        improvements: null,
        gratitude: null,
        evening_completed_at: null,
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch daily plan.' });
  }
});

// POST /api/daily-plans/morning - Save morning plan
router.post('/morning', async (req, res) => {
  const { plan_date, priority_1, priority_2, priority_3, morning_notes, morning_mood, morning_energy } = req.body;

  if (!plan_date) {
    return res.status(400).json({ error: 'Plan date is required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO daily_plans (
        user_id, plan_date, priority_1, priority_2, priority_3, 
        morning_notes, morning_mood, morning_energy, morning_completed_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (user_id, plan_date)
      DO UPDATE SET
        priority_1 = EXCLUDED.priority_1,
        priority_2 = EXCLUDED.priority_2,
        priority_3 = EXCLUDED.priority_3,
        morning_notes = EXCLUDED.morning_notes,
        morning_mood = EXCLUDED.morning_mood,
        morning_energy = EXCLUDED.morning_energy,
        morning_completed_at = NOW(),
        updated_at = NOW()
      RETURNING *`,
      [
        req.user.id,
        plan_date,
        priority_1 || null,
        priority_2 || null,
        priority_3 || null,
        morning_notes || null,
        morning_mood || null,
        morning_energy || null,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save morning plan.' });
  }
});

// POST /api/daily-plans/evening - Save evening review
router.post('/evening', async (req, res) => {
  const { plan_date, evening_notes, evening_mood, evening_energy, day_rating, wins, improvements, gratitude } = req.body;

  if (!plan_date) {
    return res.status(400).json({ error: 'Plan date is required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO daily_plans (
        user_id, plan_date, evening_notes, evening_mood, evening_energy,
        day_rating, wins, improvements, gratitude, evening_completed_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (user_id, plan_date)
      DO UPDATE SET
        evening_notes = EXCLUDED.evening_notes,
        evening_mood = EXCLUDED.evening_mood,
        evening_energy = EXCLUDED.evening_energy,
        day_rating = EXCLUDED.day_rating,
        wins = EXCLUDED.wins,
        improvements = EXCLUDED.improvements,
        gratitude = EXCLUDED.gratitude,
        evening_completed_at = NOW(),
        updated_at = NOW()
      RETURNING *`,
      [
        req.user.id,
        plan_date,
        evening_notes || null,
        evening_mood || null,
        evening_energy || null,
        day_rating || null,
        wins || null,
        improvements || null,
        gratitude || null,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save evening review.' });
  }
});

// GET /api/daily-plans/history - Get plan history
router.get('/history', async (req, res) => {
  const { days = 30 } = req.query;

  try {
    const result = await pool.query(
      `SELECT * FROM daily_plans
       WHERE user_id = $1
         AND plan_date >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
       ORDER BY plan_date DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch plan history.' });
  }
});

// GET /api/daily-plans/stats - Get planning statistics
router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        COUNT(*) as total_plans,
        COUNT(morning_completed_at) as morning_completions,
        COUNT(evening_completed_at) as evening_completions,
        AVG(day_rating) as avg_rating,
        AVG(morning_energy) as avg_morning_energy,
        AVG(evening_energy) as avg_evening_energy
       FROM daily_plans
       WHERE user_id = $1
         AND plan_date >= CURRENT_DATE - INTERVAL '30 days'`,
      [req.user.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch statistics.' });
  }
});

module.exports = router;

// Made with Bob