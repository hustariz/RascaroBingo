const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();



const app = express();
const PORT = process.env.PORT || 3004;

app.use(express.static(path.join(__dirname, '../dist')));


// Import routes
const userRoutes = require('./routes/userRoutes');
const bingoCardRoutes = require('./routes/bingoCardRoutes');
const tradeRoutes = require('./routes/tradeRoutes');

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

// Global Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Enhanced logging middleware
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

  // Add response logging
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

// Connect to MongoDB with enhanced options
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('📚 MongoDB connected'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Mount routes with version prefix
app.use('/api/users', userRoutes);
app.use('/api/bingo', bingoCardRoutes);
app.use('/api/trades', tradeRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({
    message: 'RascaroBingo API',
    version: '1.0',
    status: 'running'
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`
  });
});

// Then 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API Route Not Found',
    message: `Route ${req.method} ${req.url} not found`
  });
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  // Handle specific error types
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

// Start server with enhanced error handling
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

// Enhanced global error handlers
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  mongoose.connection.close(false, () => {
    console.log('📚 MongoDB connection closed.');
    process.exit(0);
  });
});

// Start the server
startServer();

module.exports = app;