const express = require('express');
const pool = require('../db/pool');
const verifyToken = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

// GET /api/goals
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM goals
       WHERE user_id = $1
       ORDER BY target_date ASC NULLS LAST, created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch goals.' });
  }
});


// POST /api/goals
router.post('/', async (req, res) => {
  const { title, description, target_date } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Goal title is required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO goals (user_id, title, description, target_date)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id, title, description || null, target_date || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create goal.' });
  }
});

// PUT /api/goals/:id — edit title, description, target date
router.put('/:id', async (req, res) => {
  const { title, description, target_date } = req.body;

  try {
    const result = await pool.query(
      `UPDATE goals
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           target_date = COALESCE($3, target_date)
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [title, description, target_date, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update goal.' });
  }
});
// PATCH /api/goals/:id/progress — update just the progress (0-100)
router.patch('/:id/progress', async (req, res) => {
  const { progress } = req.body;

  if (progress === undefined || progress < 0 || progress > 100) {
    return res.status(400).json({ error: 'Progress must be 0–100.' });
  }

  try {
    const result = await pool.query(
      `UPDATE goals SET progress = $1
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [progress, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update progress.' });
  }
});

// DELETE /api/goals/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found.' });
    }
    res.json({ message: 'Goal deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete goal.' });
  }
});

module.exports = router;