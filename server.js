require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/users.routes');
const conversionRoutes = require('./routes/conversions.routes');
const alertRoutes = require('./routes/alerts.routes');
const notificationRoutes = require('./routes/notifications.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const supportRoutes = require('./routes/support.routes');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversions', conversionRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/support', supportRoutes);

// Fallback error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`CurrenSee backend listening on http://localhost:${PORT}`);
});
