const express = require('express');
const pool = require('../db/pool');
const verifyToken = require('../middleware/auth');

const router = express.Router();

// All routes in this file require a valid token
router.use(verifyToken);

// GET /api/expenses — get expenses with optional filters
router.get('/', async (req, res) => {
  try {
    const { date, startDate, endDate, category } = req.query;
    let query = 'SELECT * FROM expenses WHERE user_id = $1';
    const params = [req.user.id];
    let paramIndex = 2;

    // Filter by specific date
    if (date) {
      query += ` AND expense_date = $${paramIndex}`;
      params.push(date);
      paramIndex++;
    }
    // Filter by date range
    else if (startDate && endDate) {
      query += ` AND expense_date BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      params.push(startDate, endDate);
      paramIndex += 2;
    }

    // Filter by category
    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    query += ' ORDER BY expense_date DESC, created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);

  } catch (err) {
    console.error('Get expenses error:', err);
    res.status(500).json({ error: 'Failed to fetch expenses.' });
  }
});

// GET /api/expenses/analytics/weekly — get weekly expense summary
router.get('/analytics/weekly', async (req, res) => {
  try {
    const { startDate } = req.query;
    
    // Default to current week if no start date provided
    const weekStart = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const weekEnd = new Date(new Date(weekStart).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get total by category for the week
    const categoryQuery = `
      SELECT 
        category,
        SUM(amount) as total,
        COUNT(*) as count
      FROM expenses
      WHERE user_id = $1 
        AND expense_date BETWEEN $2 AND $3
      GROUP BY category
      ORDER BY total DESC
    `;

    // Get daily totals for the week
    const dailyQuery = `
      SELECT 
        expense_date,
        SUM(amount) as total,
        COUNT(*) as count
      FROM expenses
      WHERE user_id = $1 
        AND expense_date BETWEEN $2 AND $3
      GROUP BY expense_date
      ORDER BY expense_date ASC
    `;

    // Get overall total
    const totalQuery = `
      SELECT 
        SUM(amount) as total,
        COUNT(*) as count
      FROM expenses
      WHERE user_id = $1 
        AND expense_date BETWEEN $2 AND $3
    `;

    const [categoryResult, dailyResult, totalResult] = await Promise.all([
      pool.query(categoryQuery, [req.user.id, weekStart, weekEnd]),
      pool.query(dailyQuery, [req.user.id, weekStart, weekEnd]),
      pool.query(totalQuery, [req.user.id, weekStart, weekEnd])
    ]);

    res.json({
      period: 'weekly',
      startDate: weekStart,
      endDate: weekEnd,
      total: parseFloat(totalResult.rows[0]?.total || 0),
      count: parseInt(totalResult.rows[0]?.count || 0),
      byCategory: categoryResult.rows.map(row => ({
        category: row.category,
        total: parseFloat(row.total),
        count: parseInt(row.count)
      })),
      byDay: dailyResult.rows.map(row => ({
        date: row.expense_date,
        total: parseFloat(row.total),
        count: parseInt(row.count)
      }))
    });

  } catch (err) {
    console.error('Get weekly analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch weekly analytics.' });
  }
});

// GET /api/expenses/analytics/monthly — get monthly expense summary
router.get('/analytics/monthly', async (req, res) => {
  try {
    const { year, month } = req.query;
    
    // Default to current month if not provided
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || (now.getMonth() + 1);
    
    const monthStart = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const nextMonth = targetMonth === 12 ? 1 : parseInt(targetMonth) + 1;
    const nextYear = targetMonth === 12 ? parseInt(targetYear) + 1 : targetYear;
    const monthEnd = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

    // Get total by category for the month
    const categoryQuery = `
      SELECT 
        category,
        SUM(amount) as total,
        COUNT(*) as count
      FROM expenses
      WHERE user_id = $1 
        AND expense_date >= $2 
        AND expense_date < $3
      GROUP BY category
      ORDER BY total DESC
    `;

    // Get weekly totals for the month
    const weeklyQuery = `
      SELECT 
        DATE_TRUNC('week', expense_date) as week_start,
        SUM(amount) as total,
        COUNT(*) as count
      FROM expenses
      WHERE user_id = $1 
        AND expense_date >= $2 
        AND expense_date < $3
      GROUP BY week_start
      ORDER BY week_start ASC
    `;

    // Get overall total
    const totalQuery = `
      SELECT 
        SUM(amount) as total,
        COUNT(*) as count
      FROM expenses
      WHERE user_id = $1 
        AND expense_date >= $2 
        AND expense_date < $3
    `;

    const [categoryResult, weeklyResult, totalResult] = await Promise.all([
      pool.query(categoryQuery, [req.user.id, monthStart, monthEnd]),
      pool.query(weeklyQuery, [req.user.id, monthStart, monthEnd]),
      pool.query(totalQuery, [req.user.id, monthStart, monthEnd])
    ]);

    res.json({
      period: 'monthly',
      year: parseInt(targetYear),
      month: parseInt(targetMonth),
      startDate: monthStart,
      total: parseFloat(totalResult.rows[0]?.total || 0),
      count: parseInt(totalResult.rows[0]?.count || 0),
      byCategory: categoryResult.rows.map(row => ({
        category: row.category,
        total: parseFloat(row.total),
        count: parseInt(row.count)
      })),
      byWeek: weeklyResult.rows.map(row => ({
        weekStart: row.week_start,
        total: parseFloat(row.total),
        count: parseInt(row.count)
      }))
    });

  } catch (err) {
    console.error('Get monthly analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch monthly analytics.' });
  }
});

// POST /api/expenses — create a new expense
router.post('/', async (req, res) => {
  const { amount, category, description, expense_date } = req.body;

  if (!amount || !category) {
    return res.status(400).json({ error: 'Amount and category are required.' });
  }

  if (!['food', 'groceries', 'travel', 'petrol', 'other'].includes(category)) {
    return res.status(400).json({ error: 'Invalid category.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO expenses (user_id, amount, category, description, expense_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        req.user.id,
        amount,
        category,
        description || null,
        expense_date || new Date().toISOString().split('T')[0]
      ]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error('Create expense error:', err);
    res.status(500).json({ error: 'Failed to create expense.' });
  }
});

// PUT /api/expenses/:id — update an expense
router.put('/:id', async (req, res) => {
  const { amount, category, description, expense_date } = req.body;

  if (category && !['food', 'groceries', 'travel', 'petrol', 'other'].includes(category)) {
    return res.status(400).json({ error: 'Invalid category.' });
  }

  try {
    const result = await pool.query(
      `UPDATE expenses
       SET amount = COALESCE($1, amount),
           category = COALESCE($2, category),
           description = COALESCE($3, description),
           expense_date = COALESCE($4, expense_date),
           updated_at = NOW()
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [amount, category, description, expense_date, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found.' });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error('Update expense error:', err);
    res.status(500).json({ error: 'Failed to update expense.' });
  }
});

// DELETE /api/expenses/:id — delete an expense
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found.' });
    }

    res.json({ message: 'Expense deleted.', id: result.rows[0].id });

  } catch (err) {
    console.error('Delete expense error:', err);
    res.status(500).json({ error: 'Failed to delete expense.' });
  }
});

module.exports = router;

// Made with Bob
