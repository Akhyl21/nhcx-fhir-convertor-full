require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const logger = require('./utils/logger');
const errorHandler = require('./utils/errorHandler');

// Routes
const convertRoutes = require('./routes/convert');
const validateRoutes = require('./routes/validate');
const schemaRoutes = require('./routes/schema');
const llmRoutes = require('./routes/llm');
const healthRoutes = require('./routes/health');
const metricsRoutes = require('./routes/metrics');

const app = express();
const PORT = process.env.PORT || 5001;

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Security
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS — allow all localhost origins for development
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (Postman, curl) or any localhost
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim());
    if (allowed.includes(origin)) return callback(null, true);
    callback(null, true); // Allow all in dev
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Rate limiting
app.use('/api/', rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 200,
  message: { error: 'Too many requests, please try again later.' }
}));

// Static uploads
app.use('/uploads', express.static(uploadDir));

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/convert', convertRoutes);
app.use('/api/validate', validateRoutes);
app.use('/api/schema', schemaRoutes);
app.use('/api/llm', llmRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: 'Route not found', path: req.originalUrl }));

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`🚀 NHCX FHIR Convertor running on http://localhost:${PORT}`);
  logger.info(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
  const llm = process.env.DEFAULT_LLM_PROVIDER || 'none configured';
  logger.info(`🤖 LLM Provider: ${llm}`);
  logger.info(`📁 Upload dir: ${uploadDir}`);
});

module.exports = app;
