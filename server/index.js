require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const auth = require('./middleware/auth');
const createRateLimiter = require('./middleware/rateLimit');

const isProd = process.env.NODE_ENV === 'production';

if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET. Copy .env.example to .env and set a strong random secret.');
  process.exit(1);
}
if (isProd && (process.env.JWT_SECRET === 'change-this-to-a-long-random-string' || process.env.JWT_SECRET.length < 16)) {
  console.error('Insecure JWT_SECRET in production. Set a strong random secret (at least 16 characters).');
  process.exit(1);
}
if (isProd && !process.env.MONGO_URI) {
  console.error('Missing MONGO_URI environment variable in production.');
  process.exit(1);
}

const normalizeOrigin = (url) => String(url || '').trim().replace(/\/+$/, '');
const rawClientUrls = process.env.CLIENT_URL || (isProd ? '' : 'http://localhost:5173');
const allowedOrigins = rawClientUrls.split(',').map(normalizeOrigin).filter(Boolean);
if (isProd && allowedOrigins.length === 0) {
  console.warn('Warning: CLIENT_URL is not set in production. Browser requests from external origins will be blocked by CORS.');
}

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Basic security headers without extra runtime dependencies
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without an Origin header (e.g. health checks, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(normalizeOrigin(origin))) return callback(null, true);
      const err = new Error('Not allowed by CORS');
      err.status = 403;
      return callback(err);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '100kb' }));

// Concise production-safe request logger (does not log request bodies or tokens)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
  });
  next();
});

const authLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 40 });

// Public routes & health checks
const healthHandler = (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(dbConnected ? 200 : 503).json({
    ok: dbConnected,
    status: dbConnected ? 'ok' : 'degraded',
    db: dbConnected ? 'connected' : 'disconnected',
    uptime: Math.round(process.uptime()),
  });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);
app.use('/api/auth', authLimiter, require('./routes/auth'));

// Private routes (a valid login token is required)
app.use('/api/transactions', auth, require('./routes/transactions'));
app.use('/api/budgets', auth, require('./routes/budgets'));
app.use('/api/dashboard', auth, require('./routes/dashboard'));
app.use('/api/reports', auth, require('./routes/reports'));
app.use('/api/profile', auth, require('./routes/profile'));
app.use('/api/categories', auth, (req, res) => res.json(require('./utils/categorize').CATEGORIES));

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: 'A record with this value already exists' });
  }
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({ error: err.message || 'Invalid input' });
  }
  if (!err.status || err.status >= 500) {
    console.error(err);
  }
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Something went wrong on the server' });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/expense-tracker';

if (require.main === module) {
  mongoose.connection.on('error', (err) => console.error('MongoDB error:', err.message));
  mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));

  let server;
  mongoose
    .connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 })
    .then(() => {
      server = app.listen(PORT, () => console.log(`API running on port ${PORT}`));
    })
    .catch((err) => {
      console.error('MongoDB connection failed:', err.message);
      process.exit(1);
    });

  async function shutdown(signal) {
    console.log(`${signal} received, shutting down gracefully...`);
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.connection.close();
    process.exit(0);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = app;
