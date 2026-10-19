const express = require('express');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/notifications
router.get('/', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
    [req.userId]
  );
  res.json(rows);
});

// POST /api/notifications
router.post('/', async (req, res) => {
  const { title, message, type } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: 'title and message are required' });
  }

  const [result] = await pool.query(
    `INSERT INTO notifications (user_id, title, message, type, created_at)
     VALUES (?, ?, ?, ?, NOW())`,
    [req.userId, title, message, type || 'system']
  );
  const [rows] = await pool.query('SELECT * FROM notifications WHERE id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
});

// PUT /api/notifications/:id/read
router.put('/:id/read', async (req, res) => {
  await pool.query(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
    [req.params.id, req.userId]
  );
  const [rows] = await pool.query('SELECT * FROM notifications WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  if (rows.length === 0) return res.status(404).json({ error: 'Notification not found' });
  res.json(rows[0]);
});

// PUT /api/notifications/read-all
router.put('/read-all', async (req, res) => {
  await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.userId]);
  res.status(204).send();
});

// DELETE /api/notifications/:id
router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM notifications WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  res.status(204).send();
});

module.exports = router;