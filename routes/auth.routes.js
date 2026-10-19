const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, defaultCurrency } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, default_currency, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [name, email, passwordHash, defaultCurrency || 'USD']
    );

    // Give the new user a default preferences row too
    await pool.query(
      `INSERT INTO preferences (user_id, default_base_currency) VALUES (?, ?)`,
      [result.insertId, defaultCurrency || 'USD']
    );

    const token = jwt.sign({ userId: result.insertId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.status(201).json({
      token,
      user: {
        id: result.insertId,
        name,
        email,
        defaultCurrency: defaultCurrency || 'USD',
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        defaultCurrency: user.default_currency,
        profilePicturePath: user.profile_picture_path,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/forgot-password
// NOTE: this matches your ForgotPasswordScreen's flow (email + new password,
// no verification step). That means anyone who knows a user's email can
// change their password. Fine for a class project; before anything real,
// add an emailed reset code/link step before allowing the update.
router.post('/forgot-password', async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ error: 'email and newPassword are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No account found with that email' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, rows[0].id]);

    res.json({ message: 'Password updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

module.exports = router;