// controllers/userController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt for username:', username);

  try {
    const user = await User.findOne({ username });
    if (!user) {
      console.log('User not found');
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password does not match');
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Store token in user's refresh tokens
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push({
      token,
      expiresAt,
      lastUsed: new Date()
    });

    // Clean up old tokens
    user.refreshTokens = user.refreshTokens.filter(t => 
      new Date(t.expiresAt) > new Date()
    );

    await user.save();
    console.log('Token generated and stored successfully');

    res.json({ 
      token, 
      username: user.username,
      email: user.email
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.register = async (req, res) => {
  try {
      const { username, email, password } = req.body;

      // Check if user already exists
      let user = await User.findOne({ username });
      if (user) {
          return res.status(400).json({ msg: 'User already exists' });
      }

      // Check if email is already in use
      user = await User.findOne({ email });
      if (user) {
          return res.status(400).json({ msg: 'Email already in use' });
      }

      // Create new user
      user = new User({
          username,
          email,
          password
      });

      // Hash password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      // Save user
      await user.save();

      // Create JWT payload
      const payload = {
          user: {
              id: user.id,
              username: user.username,
              email: user.email
          }
      };

      // Generate token
      const token = jwt.sign(
          payload,
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
      );

      // Initialize refresh tokens array
      user.refreshTokens = [{
          token,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          lastUsed: new Date()
      }];

      await user.save();

      // Send response
      res.status(201).json({
          token,
          username: user.username,
          email: user.email
      });

  } catch (err) {
      console.error('Registration Error:', err);
      res.status(500).json({ msg: 'Server error during registration' });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ msg: 'User not authenticated' });
    }

    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const token = req.header('Authorization')?.replace('Bearer ', '');
    const validToken = user.refreshTokens?.some(t => 
      t.token === token && new Date(t.expiresAt) > new Date()
    );

    if (!validToken) {
      return res.status(401).json({ 
        msg: 'Token not valid',
        code: 'TOKEN_INVALID'
      });
    }

    // Update last used timestamp
    const tokenIndex = user.refreshTokens.findIndex(t => t.token === token);
    if (tokenIndex !== -1) {
      user.refreshTokens[tokenIndex].lastUsed = new Date();
      await user.save();
    }

    res.json(user);
  } catch (err) {
    console.error('Error in /me route:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ msg: 'No token provided' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.user.id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      const validToken = user.refreshTokens?.some(t => 
        t.token === token && new Date(t.expiresAt) > new Date()
      );

      if (!validToken) {
        return res.status(401).json({ msg: 'Token not valid' });
      }

      const payload = {
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      };

      const newToken = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      user.refreshTokens = user.refreshTokens.filter(t => t.token !== token);
      
      user.refreshTokens.push({
        token: newToken,
        expiresAt,
        lastUsed: new Date()
      });

      user.refreshTokens = user.refreshTokens.filter(t => 
        new Date(t.expiresAt) > new Date()
      );

      await user.save();
      console.log('Token refreshed successfully');

      res.json({
        token: newToken,
        username: user.username,
        email: user.email
      });

    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          msg: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      throw err;
    }

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ msg: 'Server error during token refresh' });
  }
};