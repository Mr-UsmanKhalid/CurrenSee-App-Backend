const express = require('express');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/conversions  -> conversion history for the logged-in user
router.get('/', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM conversions WHERE user_id = ? ORDER BY date DESC',
    [req.userId]
  );
  res.json(rows);
});

// POST /api/conversions -> save a conversion result
router.post('/', async (req, res) => {
  const { fromCurrency, toCurrency, amount, convertedAmount, rate } = req.body;

  if (!fromCurrency || !toCurrency || amount == null || convertedAmount == null || rate == null) {
    return res.status(400).json({ error: 'fromCurrency, toCurrency, amount, convertedAmount and rate are required' });
  }

  const [result] = await pool.query(
    `INSERT INTO conversions (user_id, from_currency, to_currency, amount, converted_amount, rate, date)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [req.userId, fromCurrency, toCurrency, amount, convertedAmount, rate]
  );

  const [rows] = await pool.query('SELECT * FROM conversions WHERE id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
});

// DELETE /api/conversions  -> clear the whole history for the logged-in user
router.delete('/', async (req, res) => {
  await pool.query('DELETE FROM conversions WHERE user_id = ?', [req.userId]);
  res.status(204).send();
});

// DELETE /api/conversions/:id
router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM conversions WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  res.status(204).send();
});

module.exports = router;