const express = require('express');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/users/me
router.get('/me', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, name, email, profile_picture_path, default_currency, created_at
     FROM users WHERE id = ?`,
    [req.userId]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
});

// PUT /api/users/me
router.put('/me', async (req, res) => {
  const { name, defaultCurrency, profilePicturePath } = req.body;

  await pool.query(
    `UPDATE users SET
       name = COALESCE(?, name),
       default_currency = COALESCE(?, default_currency),
       profile_picture_path = COALESCE(?, profile_picture_path)
     WHERE id = ?`,
    [name, defaultCurrency, profilePicturePath, req.userId]
  );

  const [rows] = await pool.query(
    `SELECT id, name, email, profile_picture_path, default_currency, created_at
     FROM users WHERE id = ?`,
    [req.userId]
  );
  res.json(rows[0]);
});

// GET /api/users/me/preferences
router.get('/me/preferences', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM preferences WHERE user_id = ?', [req.userId]);
  res.json(rows[0] || null);
});

// PUT /api/users/me/preferences
router.put('/me/preferences', async (req, res) => {
  const { defaultBaseCurrency, notificationsEnabled, themeMode } = req.body;

  await pool.query(
    `INSERT INTO preferences (user_id, default_base_currency, notifications_enabled, theme_mode)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       default_base_currency = VALUES(default_base_currency),
       notifications_enabled = VALUES(notifications_enabled),
       theme_mode = VALUES(theme_mode)`,
    [req.userId, defaultBaseCurrency || 'USD', notificationsEnabled ? 1 : 0, themeMode || 'light']
  );

  const [rows] = await pool.query('SELECT * FROM preferences WHERE user_id = ?', [req.userId]);
  res.json(rows[0]);
});

module.exports = router;
