const express = require('express');
const pool = require('../db/pool');
const verifyToken = require('../middleware/auth');

const router = express.Router();

// All routes in this file require a valid token
router.use(verifyToken);

// GET /api/tasks  — get today's tasks (or all with ?all=true)
router.get('/', async (req, res) => {
  try {
    const { all, date } = req.query;
    let query, params;

    if (all === 'true') {
      query = `SELECT * FROM tasks
               WHERE user_id = $1
               ORDER BY task_date DESC, scheduled_time ASC NULLS LAST`;
      params = [req.user.id];
    } else {
      // Default: today's tasks
      const targetDate = date || new Date().toISOString().split('T')[0];
      query = `SELECT * FROM tasks
               WHERE user_id = $1 AND task_date = $2
               ORDER BY scheduled_time ASC NULLS LAST, created_at ASC`;
      params = [req.user.id, targetDate];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);

  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
});
router.post('/', async (req, res) => {
  const { title, category, scheduled_time, task_date } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Task title is required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO tasks (user_id, title, category, scheduled_time, task_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        req.user.id,
        title,
        category || 'personal',
        scheduled_time || null,
        task_date || new Date().toISOString().split('T')[0]
      ]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

// PUT /api/tasks/:id  — update a task (title, time, category)
router.put('/:id', async (req, res) => {
  const { title, category, scheduled_time, task_date } = req.body;

  try {
    const result = await pool.query(
      `UPDATE tasks
       SET title = COALESCE($1, title),
           category = COALESCE($2, category),
           scheduled_time = COALESCE($3, scheduled_time),
           task_date = COALESCE($4, task_date)
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [title, category, scheduled_time, task_date, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Failed to update task.' });
  }
});
// PATCH /api/tasks/:id/toggle  — toggle done/not done
router.patch('/:id/toggle', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE tasks
       SET is_done = NOT is_done
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error('Toggle task error:', err);
    res.status(500).json({ error: 'Failed to toggle task.' });
  }
});

// DELETE /api/tasks/:id  — delete a task
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    res.json({ message: 'Task deleted.', id: result.rows[0].id });

  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

module.exports = router;