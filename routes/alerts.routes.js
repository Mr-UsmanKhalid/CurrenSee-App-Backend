const express = require('express');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/alerts
router.get('/', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM alerts WHERE user_id = ? ORDER BY created_at DESC',
    [req.userId]
  );
  res.json(rows);
});

// POST /api/alerts
router.post('/', async (req, res) => {
  const { baseCurrency, targetCurrency, threshold, condition } = req.body;

  if (!baseCurrency || !targetCurrency || threshold == null || !['above', 'below'].includes(condition)) {
    return res.status(400).json({ error: 'baseCurrency, targetCurrency, threshold and condition (above|below) are required' });
  }

  const [result] = await pool.query(
    `INSERT INTO alerts (user_id, base_currency, target_currency, threshold, \`condition\`, created_at)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [req.userId, baseCurrency, targetCurrency, threshold, condition]
  );

  const [rows] = await pool.query('SELECT * FROM alerts WHERE id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
});

// PUT /api/alerts/:id  -> toggle active / mark triggered
router.put('/:id', async (req, res) => {
  const { isActive, isTriggered } = req.body;

  await pool.query(
    `UPDATE alerts SET
       is_active = COALESCE(?, is_active),
       is_triggered = COALESCE(?, is_triggered)
     WHERE id = ? AND user_id = ?`,
    [
      isActive === undefined ? null : (isActive ? 1 : 0),
      isTriggered === undefined ? null : (isTriggered ? 1 : 0),
      req.params.id,
      req.userId,
    ]
  );

  const [rows] = await pool.query('SELECT * FROM alerts WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  if (rows.length === 0) return res.status(404).json({ error: 'Alert not found' });
  res.json(rows[0]);
});

// DELETE /api/alerts/:id
router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM alerts WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  res.status(204).send();
});

module.exports = router;
