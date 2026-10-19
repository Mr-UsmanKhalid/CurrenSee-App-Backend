require('dotenv').config();
const express = require('express');
const cors = require('cors');

const pool = require('./db'); // change this path to where your pool file is, e.g. './config/db'

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/users.routes');
const conversionRoutes = require('./routes/conversions.routes');
const alertRoutes = require('./routes/alerts.routes');
const notificationRoutes = require('./routes/notifications.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const supportRoutes = require('./routes/support.routes');

const app = express();
app.set('trust proxy', 1);

// CORS must come before the routes. Leave CORS_ORIGINS unset to allow all origins.
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Mobile apps and tools like Postman send no Origin header
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      cb(new Error('Not allowed by CORS'));
    },
  })
);
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// TEMPORARY: remove after debugging. Shows DB errors publicly.
app.get('/health/db', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS tables_count FROM information_schema.tables WHERE table_schema = ?',
      [process.env.DB_NAME]
    );
    res.json({ db: 'ok', tables: rows[0].tables_count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ db: 'error', code: err.code, message: err.sqlMessage || err.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversions', conversionRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/support', supportRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Fallback error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Local: listen. Vercel: just export the app.
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`CurrenSee backend listening on port ${PORT}`);
  });
}

module.exports = app;