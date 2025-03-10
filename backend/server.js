// Core imports
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const history = require('connect-history-api-fallback');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables
const envPath = path.join(__dirname, '.env');
console.log('Loading environment from:', envPath);
require('dotenv').config({ path: envPath });

// Log environment status (without sensitive info)
console.log('Environment Variables Status:', {
  hasEmailUser: !!process.env.EMAIL_USER,
  hasEmailPassword: !!process.env.EMAIL_PASSWORD,
  hasFrontendUrl: !!process.env.FRONTEND_URL,
  nodeEnv: process.env.NODE_ENV,
  availableEnvKeys: Object.keys(process.env)
});

// Configure CORS options
const corsOptions = {
  origin: [
    'http://localhost:8080',
    'http://localhost:3004',
    'https://rascarobingo.onrender.com',
    'https://rascarobingo-wley.onrender.com',
    'https://rascarobingo.com',
    'https://www.rascarobingo.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Create Express app
const app = express();
const PORT = process.env.PORT || 3004;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with CORS options
const io = new Server(server, {
  cors: corsOptions,
  allowEIO3: true // Allow Engine.IO version 3 clients
});

// Store socket connections by user
const socketConnections = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('register', (userId) => {
    console.log(`Registering socket for user ${userId}`);
    socketConnections.set(userId, socket);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Remove socket from connections
    for (const [userId, s] of socketConnections.entries()) {
      if (s.id === socket.id) {
        socketConnections.delete(userId);
        break;
      }
    }
  });
});

// Make io available to routes
app.set('io', io);
app.set('socketConnections', socketConnections);

// Enable CORS
app.use(cors(corsOptions));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  // Only log important operations (trades, user actions, errors)
  const shouldLog = 
    req.method === 'POST' || // Log all POST requests
    req.method === 'PUT' ||  // Log all PUT requests
    req.method === 'DELETE' || // Log all DELETE requests
    req.url.includes('/trade') || // Log trade-related requests
    req.url.includes('/auth') ||  // Log authentication requests
    req.url.includes('/users');   // Log user-related requests

  if (shouldLog) {
    const start = Date.now();
    console.log(`🔄 ${new Date().toISOString()} - ${req.method} ${req.url}`);

    // Only log headers for auth/user operations
    if (req.url.includes('/auth') || req.url.includes('/users')) {
      console.log('📨 Headers:', {
        ...req.headers,
        authorization: req.headers.authorization ? 'Bearer [REDACTED]' : undefined
      });
    }
    
    // Only log body for POST/PUT operations
    if ((req.method === 'POST' || req.method === 'PUT') && req.body && Object.keys(req.body).length > 0) {
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
  }

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

// Import routes
const userRoutes = require('./routes/userRoutes');
const bingoRoutes = require('./routes/bingo');
const tradeRoutes = require('./routes/tradeRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const emailVerificationRoutes = require('./routes/emailVerification');
const hyperliquidRoutes = require('./routes/hyperliquidRoutes');
const riskManagementRoutes = require('./routes/riskManagementRoutes');

// Initialize routes
app.use('/api/users', userRoutes);
app.use('/api/bingo', bingoRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/auth', emailVerificationRoutes);
app.use('/api/hyperliquid', hyperliquidRoutes);
app.use('/api/risk-management', riskManagementRoutes);

// API Info Route
app.get('/api', (req, res) => {
  res.json({
    message: 'RascaroBingo API',
    version: '1.0',
    status: 'running'
  });
});

// API 404 Handler - Only for /api routes that don't match any defined routes
app.all('/api/*', (req, res) => {
  console.log('API 404:', req.method, req.originalUrl);
  res.status(404).json({
    error: 'API Route Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// History middleware (after API routes, before static files)
app.use(history());

// Static files and SPA routes
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, 'dist');
  console.log('📂 Production dist path:', distPath);
  
  app.use(express.static(distPath));
}

// Global Error Handlers
app.use((req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', true);
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`
  });
});

app.use((err, req, res) => {
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

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔒 CORS enabled for:`, corsOptions.origin);
  // Initialize WebSocket updates after server is listening
});

module.exports = app;