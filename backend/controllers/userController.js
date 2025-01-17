// controllers/userController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailVerificationController = require('./emailVerification');

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
        email: user.email,
        isPaidUser: user.isPaidUser
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
      email: user.email,
      isPaidUser: user.isPaidUser
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
    const existingUser = await User.findOne({ 
      $or: [
        { username: username },
        { email: email }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        msg: existingUser.username === username ? 
          'Username already exists' : 
          'Email already registered'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    // Save user
    await user.save();

    // Send verification email
    const emailSent = await emailVerificationController.sendVerification(user);

    if (!emailSent) {
      // If email fails, still create account but inform user
      console.error('Failed to send verification email to:', email);
      return res.status(201).json({
        msg: 'Account created but verification email failed to send. Please try resending the verification email later.'
      });
    }

    res.status(201).json({
      msg: 'Registration successful! Please check your email to verify your account.'
    });
  } catch (error) {
    console.error('Registration error:', error);
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

    res.json({
      ...user._doc,
      isPaidUser: user.isPaidUser
    });
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
          email: user.email,
          isPaidUser: user.isPaidUser
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
        email: user.email,
        isPaidUser: user.isPaidUser
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

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, 'username email isPaidUser');
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.updateUserPremiumStatus = async (req, res) => {
  try {
    const { userId, isPaidUser } = req.body;
    const user = await User.findByIdAndUpdate(
      userId,
      { isPaidUser },
      { new: true, select: 'username email isPaidUser' }
    );

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Error updating user premium status:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};