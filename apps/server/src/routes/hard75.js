const express = require('express');
const pool = require('../db/pool');
const verifyToken = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

// GET /api/hard75/today — get today's log (auto-creates if missing)
router.get('/today', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  try {
    // Create today's entry if it doesn't exist yet
    await pool.query(
      `INSERT INTO hard75_logs (user_id, log_date)
       VALUES ($1, $2)
       ON CONFLICT (user_id, log_date) DO NOTHING`,
      [req.user.id, today]
    );

    const result = await pool.query(
      'SELECT * FROM hard75_logs WHERE user_id = $1 AND log_date = $2',
      [req.user.id, today]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch today log.' });
  }
});

router.patch('/today', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const VALID_FIELDS = [
    'workout1_done',
    'workout2_outdoor_done',
    'water_done',
    'reading_done',
    'photo_done'
  ];

  const { field } = req.body;

  if (!VALID_FIELDS.includes(field)) {
    return res.status(400).json({ error: `Invalid field. Must be one of: ${VALID_FIELDS.join(', ')}` });
  }

  try {
    // Toggle the boolean field by name
    // We use a safe whitelist check above so this interpolation is safe
    const result = await pool.query(
      `UPDATE hard75_logs
       SET ${field} = NOT ${field}
       WHERE user_id = $1 AND log_date = $2
       RETURNING *`,
      [req.user.id, today]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Log not found. Call GET /today first.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update habit.' });
  }
});


// GET /api/hard75/history — last 75 days for the heatmap
router.get('/history', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT log_date,
              workout1_done, workout2_outdoor_done,
              water_done, reading_done, photo_done,
              -- count how many of the 5 are done
              (workout1_done::int + workout2_outdoor_done::int +
               water_done::int + reading_done::int + photo_done::int) AS done_count,
              -- true only if all 5 are done
              (workout1_done AND workout2_outdoor_done AND
               water_done AND reading_done AND photo_done) AS all_done
       FROM hard75_logs
       WHERE user_id = $1
         AND log_date >= CURRENT_DATE - INTERVAL '75 days'
       ORDER BY log_date ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history.' });
  }
});


// GET /api/hard75/streak — current streak count
router.get('/streak', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT log_date FROM hard75_logs
       WHERE user_id = $1
         AND workout1_done = true
         AND workout2_outdoor_done = true
         AND water_done = true
         AND reading_done = true
         AND photo_done = true
       ORDER BY log_date DESC`,
      [req.user.id]
    );

    // Count consecutive days backwards from today
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < result.rows.length; i++) {
      const logDate = new Date(result.rows[i].log_date);
      const expected = new Date(today);
      expected.setDate(today.getDate() - i);
      expected.setHours(0, 0, 0, 0);
      logDate.setHours(0, 0, 0, 0);

      if (logDate.getTime() === expected.getTime()) {
        streak++;
      } else {
        break; // Gap found — streak is over
      }
    }

    res.json({ streak });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate streak.' });
  }
});
module.exports = router;