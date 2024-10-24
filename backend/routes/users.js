const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');


// Get all users
router.get('/', async (req, res) => {
    try {
      const users = await User.find().select('-password'); // Exclude password field
      res.json(users);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });

// Delete user
router.delete('/:id', async (req, res) => {
    try {
      console.log('Attempting to delete user with ID:', req.params.id);
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) {
        console.log('User not found');
        return res.status(404).json({ msg: 'User not found' });
      }
      console.log('User deleted successfully');
      res.json({ msg: 'User removed' });
    } catch (err) {
      console.error('Error in delete route:', err);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'User not found' });
      }
      res.status(500).send('Server error');
    }
  });
  
// Update user
router.put('/:id', async (req, res) => {
    const { username, password } = req.body;
  
    try {
      let user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
  
      if (username) user.username = username;
      if (password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
      }
  
      await user.save();
      res.json({ msg: 'User updated', user: { id: user.id, username: user.username } });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'User not found' });
      }
      res.status(500).send('Server error');
    }
  });  
 

  router.post('/register', async (req, res) => {
    console.log('Register route hit');
    console.log('Request body:', req.body);
    const { username, email, password } = req.body;
  
    try {
      // Check username and email separately to give better error messages
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        console.log('Username already exists');
        return res.status(400).json({ msg: 'Username already taken' });
      }
  
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        console.log('Email already exists');
        return res.status(400).json({ msg: 'Email already registered' });
      }
  
      // If we get here, neither username nor email exists
      const user = new User({
        username,
        email,
        password
      });
  
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
  
      await user.save();
      console.log('User saved successfully');
  
      const payload = {
        user: {
          id: user.id
        }
      };
  
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: 3600 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error('Registration error:', err);
      res.status(500).send('Server error');
    }
  });
  


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
  
      // Add debug logging
      console.log('JWT_SECRET:', process.env.JWT_SECRET);
  
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '1h' },
        (err, token) => {
          if (err) {
            console.error('JWT Sign Error:', err);
            return res.status(500).json({ msg: 'Error generating token' });
          }
          console.log('Token generated successfully');
          res.json({ token, username: user.username });
        }
      );
    } catch (err) {
      console.error('Login Error:', err);
      res.status(500).json({ msg: 'Server error', error: err.message });
    }
  });
  

module.exports = router;