const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3004;

// Import middleware
const auth = require('./middleware/auth');

// Import routes
const userRoutes = require('./routes/user');
const bingoCardRoutes = require('./routes/bingoCardRoutes');

// CORS Configuration
const corsOptions = {
  origin: [
    'http://localhost:8080',
    'http://localhost:3004',
    'https://rascarobingo.onrender.com',
    'https://rascarobingo-wley.onrender.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
  exposedHeaders: ['Authorization']
};

// Global Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Mount routes
app.use('/api/users', userRoutes);
app.use('/api/bingo', bingoCardRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    msg: 'Server error', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Start server with error handling
const startServer = () => {
  try {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('Environment:', process.env.NODE_ENV);
      console.log('CORS enabled for:', corsOptions.origin);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Global error handlers
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Start the server
startServer();

module.exports = app;