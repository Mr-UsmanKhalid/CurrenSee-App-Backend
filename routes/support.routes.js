const express = require('express');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// POST /api/support
router.post('/', async (req, res) => {
  const { subject, message } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ error: 'subject and message are required' });
  }

  const [result] = await pool.query(
    `INSERT INTO support_tickets (user_id, subject, message, status, created_at)
     VALUES (?, ?, ?, 'open', NOW())`,
    [req.userId, subject, message]
  );
  const [rows] = await pool.query('SELECT * FROM support_tickets WHERE id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
});

// GET /api/support -> the current user's own tickets
router.get('/', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC',
    [req.userId]
  );
  res.json(rows);
});

module.exports = router;
