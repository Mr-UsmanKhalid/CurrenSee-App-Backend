const express = require('express');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// POST /api/feedback
router.post('/', async (req, res) => {
  const { subject, message, rating } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ error: 'subject and message are required' });
  }

  const [result] = await pool.query(
    `INSERT INTO feedback (user_id, subject, message, rating, created_at) VALUES (?, ?, ?, ?, NOW())`,
    [req.userId, subject, message, rating ?? null]
  );
  const [rows] = await pool.query('SELECT * FROM feedback WHERE id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
});

// GET /api/feedback  -> the current user's own feedback history
router.get('/', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM feedback WHERE user_id = ? ORDER BY created_at DESC',
    [req.userId]
  );
  res.json(rows);
});

module.exports = router;
