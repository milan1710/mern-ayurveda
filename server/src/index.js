require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');

const connectDB = require('./config/db');

const app = express();

/* ---------- DB ---------- */
connectDB(process.env.MONGO_URI);

/* ---------- CORS ---------- */
const parseOrigins = (val) => {
  if (!val) return null;
  return val.split(/[, ]+/).map(s => s.trim()).filter(Boolean);
};
const envOrigins = parseOrigins(process.env.ALLOW_ORIGIN);
const DEV_DEFAULT_ORIGINS = [
  'http://localhost:5173','http://127.0.0.1:5173',
  'http://localhost:5174','http://127.0.0.1:5174',
  'http://localhost:3000','http://127.0.0.1:3000'
];
app.use(cors({ origin: envOrigins || DEV_DEFAULT_ORIGINS, credentials: true }));

/* ---------- Core middleware ---------- */
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ---------- Static ---------- */
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

/* ---------- Health ---------- */
app.get('/', (_req, res) => res.send('API running'));

/* ---------- Routes ---------- */
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/orders', require('./routes/orders.routes'));
app.use('/api/stats', require('./routes/stats.routes'));
app.use('/api/products', require('./routes/products.routes'));
app.use('/api/upload', require('./routes/upload.routes'));
app.use('/api/categories', require('./routes/categories.routes'));
app.use('/api/collections', require('./routes/collections.routes'));
app.use('/api/public', require('./routes/public.routes'));
app.use('/api/wallet', require('./routes/wallet.routes'));


/* ---------- 404 handler ---------- */
app.use((req, res, _next) => {
  return res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

/* ---------- error handler ---------- */
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

/* ---------- Server ---------- */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
