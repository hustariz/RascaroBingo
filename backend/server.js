// Core imports
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const history = require('connect-history-api-fallback');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3004;

// Import routes
const userRoutes = require('./routes/userRoutes');
const bingoCardRoutes = require('./routes/bingoCardRoutes');
const tradeRoutes = require('./routes/tradeRoutes');
const riskManagementRoutes = require('./routes/riskManagementRoutes');
const { initializeScheduler } = require('./services/schedulerService');

// CORS Configuration
const corsOptions = {
  origin: [
    'http://localhost:8080',
    'http://localhost:3004',
    'https://rascarobingo.onrender.com',
    'https://rascarobingo-wley.onrender.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
  exposedHeaders: ['Authorization']
};

// Apply CORS first
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // enable pre-flight

// Global Middleware
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`🔄 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('📨 Headers:', {
    ...req.headers,
    authorization: req.headers.authorization ? 'Bearer [REDACTED]' : undefined
  });
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Body:', {
      ...req.body,
      password: req.body.password ? '[REDACTED]' : undefined
    });
  }

  const oldSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    console.log(`✅ Response sent in ${duration}ms:`, {
      status: res.statusCode,
      contentLength: data?.length || 0
    });
    return oldSend.apply(res, arguments);
  };

  next();
});

// Database Connection
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('📚 MongoDB connected'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});
initializeScheduler();

// Routes Configuration (in order of priority)
// 1. Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// 1. API Routes first
app.use('/api/users', userRoutes);
app.use('/api/bingo', bingoCardRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/risk-management', riskManagementRoutes);

// 2. API Info Route
app.get('/api', (req, res) => {
  res.json({
    message: 'RascaroBingo API',
    version: '1.0',
    status: 'running'
  });
});

// 3. API 404 Handler
app.use('/api/*', (req, res) => {
  console.log('API 404:', req.method, req.url);
  res.status(404).json({
    error: 'API Route Not Found',
    message: `Route ${req.method} ${req.url} not found`
  });
});

// 4. History middleware (after API routes, before static files)
app.use(history());

// 5. Static files and SPA routes
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, 'dist');
  console.log('📂 Production dist path:', distPath);
  
  app.use(express.static(distPath));
}

// 6. Global Error Handlers
app.use((req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', true);
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`
  });
});

app.use((err, req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', true);
  
  console.error('❌ Server error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.errors
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: err.message
    });
  }

  res.status(err.status || 500).json({
    error: 'Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Process Handlers
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  if (process.env.NODE_ENV === 'production') process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  if (process.env.NODE_ENV === 'production') process.exit(1);
});

process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  try {
    await mongoose.connection.close();
    console.log('📚 MongoDB connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

const startServer = async () => {
  try {
    await new Promise((resolve, reject) => {
      const server = app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
        console.log(`🔒 CORS enabled for:`, corsOptions.origin);
        resolve(server);
      });
      server.on('error', reject);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start Server
startServer();

module.exports = app;