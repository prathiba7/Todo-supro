const express = require('express');
const pool = require('../db/pool');
const verifyToken = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

// GET /api/habits - Get all habits for user
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM habits 
       WHERE user_id = $1 AND is_active = true 
       ORDER BY sort_order ASC, created_at ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch habits.' });
  }
});

// POST /api/habits - Create new habit
router.post('/', async (req, res) => {
  const { name, description, icon, color, repeat_type, repeat_days } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Habit name is required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO habits (user_id, name, description, icon, color, repeat_type, repeat_days)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.user.id,
        name.trim(),
        description || null,
        icon || 'ti-check',
        color || 'emerald',
        repeat_type || 'daily',
        repeat_days || 75
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create habit.' });
  }
});

// PATCH /api/habits/:id - Update habit
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, icon, color, repeat_type, repeat_days, sort_order } = req.body;

  try {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name.trim());
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (icon !== undefined) {
      updates.push(`icon = $${paramCount++}`);
      values.push(icon);
    }
    if (color !== undefined) {
      updates.push(`color = $${paramCount++}`);
      values.push(color);
    }
    if (repeat_type !== undefined) {
      updates.push(`repeat_type = $${paramCount++}`);
      values.push(repeat_type);
    }
    if (repeat_days !== undefined) {
      updates.push(`repeat_days = $${paramCount++}`);
      values.push(repeat_days);
    }
    if (sort_order !== undefined) {
      updates.push(`sort_order = $${paramCount++}`);
      values.push(sort_order);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update.' });
    }

    values.push(req.user.id, id);

    const result = await pool.query(
      `UPDATE habits 
       SET ${updates.join(', ')}
       WHERE user_id = $${paramCount++} AND id = $${paramCount++}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Habit not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update habit.' });
  }
});

// DELETE /api/habits/:id - Soft delete habit
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE habits 
       SET is_active = false 
       WHERE user_id = $1 AND id = $2
       RETURNING *`,
      [req.user.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Habit not found.' });
    }

    res.json({ message: 'Habit deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete habit.' });
  }
});

// GET /api/habits/today - Get today's habit logs
router.get('/today', async (req, res) => {
  // Use local date, not UTC
  const now = new Date();
  const today = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0');

  try {
    const result = await pool.query(
      `SELECT h.*, 
              COALESCE(hl.is_done, false) as is_done,
              hl.id as log_id
       FROM habits h
       LEFT JOIN habit_logs hl ON h.id = hl.habit_id 
         AND hl.user_id = $1 
         AND hl.log_date = $2
       WHERE h.user_id = $1 AND h.is_active = true
       ORDER BY h.sort_order ASC, h.created_at ASC`,
      [req.user.id, today]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch today\'s habits.' });
  }
});

// GET /api/habits/date/:date - Get habits for a specific date
router.get('/date/:date', async (req, res) => {
  const { date } = req.params;

  try {
    const result = await pool.query(
      `SELECT h.*,
              COALESCE(hl.is_done, false) as is_done,
              hl.id as log_id
       FROM habits h
       LEFT JOIN habit_logs hl ON h.id = hl.habit_id
         AND hl.user_id = $1
         AND hl.log_date = $2
       WHERE h.user_id = $1 AND h.is_active = true
       ORDER BY h.sort_order ASC, h.created_at ASC`,
      [req.user.id, date]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch habits for date.' });
  }
});

// POST /api/habits/:id/toggle - Toggle habit completion for today
router.post('/:id/toggle', async (req, res) => {
  const { id } = req.params;
  const { date } = req.body; // Allow passing a specific date
  
  // Use provided date or default to today
  let targetDate;
  if (date) {
    targetDate = date;
  } else {
    const now = new Date();
    targetDate = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0');
  }

  try {
    // Check if habit exists and belongs to user
    const habitCheck = await pool.query(
      'SELECT * FROM habits WHERE id = $1 AND user_id = $2 AND is_active = true',
      [id, req.user.id]
    );

    if (habitCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Habit not found.' });
    }

    // Toggle the log
    const result = await pool.query(
      `INSERT INTO habit_logs (user_id, habit_id, log_date, is_done)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (user_id, habit_id, log_date)
       DO UPDATE SET is_done = NOT habit_logs.is_done
       RETURNING *`,
      [req.user.id, id, targetDate]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to toggle habit.' });
  }
});

// GET /api/habits/history - Get habit history for heatmap
router.get('/history', async (req, res) => {
  const { days = 75 } = req.query;

  try {
    const result = await pool.query(
      `SELECT
         hl.log_date::text as log_date,
         hl.habit_id,
         hl.is_done,
         h.name,
         h.color
       FROM habit_logs hl
       JOIN habits h ON hl.habit_id = h.id
       WHERE hl.user_id = $1
         AND hl.log_date >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
       ORDER BY hl.log_date ASC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch history.' });
  }
});

// GET /api/habits/streak - Get current streak
router.get('/streak', async (req, res) => {
  try {
    // Get all active habits
    const habitsResult = await pool.query(
      'SELECT id FROM habits WHERE user_id = $1 AND is_active = true',
      [req.user.id]
    );

    const habitIds = habitsResult.rows.map(h => h.id);

    if (habitIds.length === 0) {
      return res.json({ streak: 0 });
    }

    // Get dates where ALL habits were completed
    const result = await pool.query(
      `SELECT log_date, COUNT(*) as completed_count
       FROM habit_logs
       WHERE user_id = $1 
         AND habit_id = ANY($2)
         AND is_done = true
       GROUP BY log_date
       HAVING COUNT(*) = $3
       ORDER BY log_date DESC`,
      [req.user.id, habitIds, habitIds.length]
    );

    // Count consecutive days backwards from today
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < result.rows.length; i++) {
      const logDate = new Date(result.rows[i].log_date);
      const expected = new Date(today);
      expected.setDate(today.getDate() - i);
      expected.setHours(0, 0, 0, 0);
      logDate.setHours(0, 0, 0, 0);

      if (logDate.getTime() === expected.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    res.json({ streak });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to calculate streak.' });
  }
});

// POST /api/habits/reorder - Update habit order
router.post('/reorder', async (req, res) => {
  const { habitIds } = req.body;

  if (!Array.isArray(habitIds) || habitIds.length === 0) {
    return res.status(400).json({ error: 'habitIds array is required.' });
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Update sort_order for each habit
    for (let i = 0; i < habitIds.length; i++) {
      await client.query(
        'UPDATE habits SET sort_order = $1 WHERE id = $2 AND user_id = $3',
        [i, habitIds[i], req.user.id]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Habit order updated successfully.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to update habit order.' });
  } finally {
    client.release();
  }
});

module.exports = router;

// Made with Bob
