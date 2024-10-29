const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Public Routes (No auth required)

// Login
router.post('/login', async (req, res) => {
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
        username: user.username
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) {
          console.error('JWT Sign Error:', err);
          return res.status(500).json({ msg: 'Error generating token' });
        }
        console.log('Token generated successfully');
        res.json({ 
          token, 
          username: user.username,
          email: user.email
        });
      }
    );
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Register
router.post('/register', async (req, res) => {
  console.log('Register attempt');
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        msg: existingUser.username === username 
          ? 'Username already taken' 
          : 'Email already registered' 
      });
    }

    const user = new User({
      username,
      email,
      password
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();
    console.log('User registered successfully');

    const payload = {
      user: {
        id: user.id,
        username: user.username
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ 
          token,
          username: user.username,
          email: user.email
        });
      }
    );
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Protected Routes (Auth required)

// Get current user
router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error in /me route:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error('Error getting users:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Make sure user can only update their own profile
    if (user.id.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    if (username) user.username = username;
    if (email) user.email = email;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    res.json({
      msg: 'User updated',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Update error:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Make sure user can only delete their own account
    if (user.id.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await user.deleteOne();
    res.json({ msg: 'User deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;