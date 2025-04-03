// controllers/userController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailVerificationController = require('./emailVerification');
const Trade = require('../models/Trade');
const crypto = require('crypto');

// Add this helper function to calculate stats from trade history
const calculateTradeStats = (trades) => {
  const stats = {
    trades: trades.length,
    wins: 0,
    losses: 0,
    totalGain: 0,
    totalRisk: 0,
    totalReward: 0,
    averageRR: 0
  };

  trades.forEach(trade => {
    // Only count closed trades
    if (trade.status === 'OPEN') return;

    // Calculate win/loss based on status
    if (trade.status === 'TARGET_HIT') {
      stats.wins++;
      stats.totalGain += trade.actualProfit || 0;
    } else if (trade.status === 'STOPLOSS_HIT') {
      stats.losses++;
      stats.totalGain += trade.actualProfit || 0;
    }

    // Add to total R/R calculation
    if (trade.riskRewardRatio) {
      stats.totalReward += trade.riskRewardRatio;
    }
  });

  // Calculate average R/R ratio
  if (stats.trades > 0) {
    stats.averageRR = stats.totalReward / stats.trades;
  }

  // Round total gain to 2 decimal places
  stats.totalGain = Math.round(stats.totalGain * 100) / 100;

  return stats;
};

// Add this function to update user stats
const updateUserStats = async (userId) => {
  try {
    const user = await User.findById(userId).populate('tradeHistory');
    if (!user || !user.tradeHistory) return;

    const stats = calculateTradeStats(user.tradeHistory);
    
    user.riskManagement.totalStats = stats;
    await user.save();
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
};

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
    const users = await User.find().select('_id username email isPaidUser isAdmin isEmailVerified');
    res.json(users);
  } catch (err) {
    console.error('Error getting users:', err);
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

exports.updateUserAdminStatus = async (req, res) => {
  try {
    const { userId, isAdmin } = req.body;
    
    // Validate request
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    if (typeof isAdmin !== 'boolean') {
      return res.status(400).json({ message: 'isAdmin must be a boolean value' });
    }

    // Find user and update
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent self-demotion for safety
    if (user._id.toString() === req.user.id && !isAdmin) {
      return res.status(403).json({ message: 'Cannot remove admin status from yourself' });
    }

    user.isAdmin = isAdmin;
    await user.save();

    res.json({ 
      message: `Admin status ${isAdmin ? 'granted to' : 'removed from'} user`,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        isPaidUser: user.isPaidUser
      }
    });
  } catch (error) {
    console.error('Error updating admin status:', error);
    res.status(500).json({ message: 'Server error while updating admin status' });
  }
};

exports.updateUserEmail = async (req, res) => {
  try {
    const { userId, email } = req.body;

    // Validate request
    if (!userId || !email) {
      return res.status(400).json({ message: 'User ID and email are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if email is already in use
    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already in use' });
    }

    // Find and update user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update email and reset verification status
    user.email = email;
    user.isEmailVerified = false;
    await user.save();

    res.json({
      message: 'Email updated successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        isPaidUser: user.isPaidUser,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Error updating user email:', error);
    res.status(500).json({ message: 'Server error while updating email' });
  }
};

exports.sendVerificationEmail = async (req, res) => {
  try {
    const { userId } = req.body;

    // Validate request
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send verification email using the emailVerificationController
    await emailVerificationController.sendVerification(user);

    res.json({ message: 'Verification email sent successfully' });
  } catch (error) {
    console.error('Error sending verification email:', error);
    res.status(500).json({ message: 'Server error while sending verification email' });
  }
};

exports.updateUsername = async (req, res) => {
  try {
    const { userId, username } = req.body;

    // Validate request
    if (!userId || !username) {
      return res.status(400).json({ message: 'User ID and username are required' });
    }

    // Validate username format
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ message: 'Username must be between 3 and 30 characters' });
    }

    // Check if username is already in use
    const existingUser = await User.findOne({ username, _id: { $ne: userId } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username is already in use' });
    }

    // Find and update user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.username = username;
    await user.save();

    res.json({
      message: 'Username updated successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        isPaidUser: user.isPaidUser,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Error updating username:', error);
    res.status(500).json({ message: 'Server error while updating username' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate request
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent self-deletion
    if (user._id.toString() === req.user.id) {
      return res.status(403).json({ message: 'Cannot delete your own account' });
    }

    // Delete user
    await User.findByIdAndDelete(userId);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error while deleting user' });
  }
};

exports.addTrade = async (req, res) => {
  try {
    const { entryPrice, exitPrice, stopLoss, takeProfit, notes } = req.body;
    const userId = req.user.id;

    const trade = new Trade({
      user: userId,
      entryPrice,
      exitPrice,
      stopLoss,
      takeProfit,
      notes
    });

    await trade.save();

    // Add trade to user's history
    const user = await User.findById(userId);
    if (!user.tradeHistory) {
      user.tradeHistory = [];
    }
    user.tradeHistory.push(trade._id);
    await user.save();

    // Update user stats
    await updateUserStats(userId);

    res.json({ trade, msg: 'Trade added successfully' });
  } catch (error) {
    console.error('Error adding trade:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    // Get all users and populate their trade history
    const users = await User.find({})
      .populate('tradeHistory')
      .select('username isPaidUser tradeHistory')
      .lean();

    // Transform users data
    const transformedUsers = await Promise.all(users.map(async user => {
      // Calculate stats for each user
      const stats = calculateTradeStats(user.tradeHistory || []);

      return {
        id: user._id,
        username: user.username,
        isPremium: user.isPaidUser,
        totalTrades: stats.trades,
        totalGain: stats.totalGain,
        riskRewardRatio: stats.averageRR,
        winrate: stats.trades > 0 ? stats.wins / stats.trades : 0
      };
    }));

    // Sort by total trades descending
    transformedUsers.sort((a, b) => b.totalTrades - a.totalTrades);

    return res.json({ users: transformedUsers });
  } catch (error) {
    console.error('Error getting user stats:', error);
    return res.status(500).json({ msg: 'Server error' });
  }
};

exports.recalculateAllStats = async (req, res) => {
  try {
    const users = await User.find();
    
    for (const user of users) {
      await updateUserStats(user._id);
    }

    res.json({ msg: 'All user stats recalculated successfully' });
  } catch (error) {
    console.error('Error recalculating stats:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Password Reset Methods
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token (32 bytes = 64 hex characters)
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Save hashed token to database
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Create reset URL with the plain token
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    console.log('Generated reset URL:', resetUrl);

    // Send email
    const mailOptions = {
      from: {
        name: 'RascaroBingo',
        address: process.env.EMAIL_USER
      },
      to: user.email,
      subject: 'Reset Your RascaroBingo Password',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #eeb111; text-align: center;">Reset Your Password</h2>
          <p>Hello ${user.username},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #eeb111; 
                      color: black; 
                      padding: 12px 24px; 
                      text-decoration: none; 
                      border-radius: 25px;
                      font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p>If the button doesn't work, you can also click on this link:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>This reset link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
        </div>
      `
    };

    await emailVerificationController.transporter.sendMail(mailOptions);
    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Error in password reset request:', error);
    res.status(500).json({ message: 'Error sending reset email' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    console.log('Reset password attempt with token:', token);

    if (!token || !password) {
      return res.status(400).json({
        message: 'Missing required fields'
      });
    }

    // Find user with matching token that hasn't expired
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      console.log('Invalid token details:', {
        tokenProvided: token,
        userFound: !!user,
        tokenExpired: user ? Date.now() > user.resetPasswordExpires : null
      });
      return res.status(400).json({
        message: 'Password reset token is invalid or has expired'
      });
    }

    console.log('Found user for reset:', user.email);

    // Update password
    user.password = password; // Will be hashed by the pre-save middleware
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();
    console.log('Password reset successful for user:', user.email);

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Error in password reset:', error);
    res.status(500).json({ 
      message: 'Failed to reset password',
      error: error.message 
    });
  }
};

module.exports = exports;