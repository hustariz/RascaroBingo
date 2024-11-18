// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    console.log('Auth header:', authHeader);
    
    if (!authHeader) {
      console.log('❌ No Authorization header');
      return res.status(401).json({ 
        msg: 'No authorization header found',
        code: 'NO_AUTH_HEADER'
      });
    }

    // Extract token
    const token = authHeader.replace('Bearer ', '');
    console.log('Extracted token:', token);
    
    if (!token) {
      console.log('❌ No token found in Authorization header');
      return res.status(401).json({ 
        msg: 'No token found',
        code: 'NO_TOKEN'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded);
      
      if (!decoded.user || !decoded.user.id) {
        console.log('❌ Invalid token payload');
        return res.status(401).json({
          msg: 'Invalid token payload',
          code: 'INVALID_PAYLOAD'
        });
      }

      // Find user and verify token is still valid
      const user = await User.findById(decoded.user.id);
      if (!user) {
        console.log('❌ User not found');
        return res.status(401).json({
          msg: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Check if token is in user's valid tokens
      const isValidToken = user.refreshTokens?.some(t => 
        t.token === token && new Date(t.expiresAt) > new Date()
      );

      if (!isValidToken) {
        console.log('❌ Token not found in user refresh tokens');
        // Instead of immediately rejecting, try to refresh
        try {
          // Generate new token
          const newPayload = {
            user: {
              id: user.id,
              username: user.username,
              email: user.email
            }
          };

          const newToken = jwt.sign(
            newPayload,
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
          );

          // Update user's refresh tokens
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 24);

          user.refreshTokens = user.refreshTokens || [];
          user.refreshTokens.push({
            token: newToken,
            expiresAt
          });

          // Clean up old tokens
          user.refreshTokens = user.refreshTokens.filter(t => 
            new Date(t.expiresAt) > new Date()
          );

          await user.save();

          // Set new token in response header
          res.setHeader('Authorization', `Bearer ${newToken}`);
          
          // Set user info in request
          req.user = decoded.user;
          req.token = newToken;  // Store new token
          
          console.log('✅ Token refreshed for user:', decoded.user.id);
          return next();
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
          return res.status(401).json({
            msg: 'Token refresh failed',
            code: 'REFRESH_FAILED'
          });
        }
      }

      // Set user info in request
      req.user = decoded.user;
      req.token = token;
      req.user.refreshTokens = user.refreshTokens; // Add refresh tokens to request

      console.log('✅ Auth successful for user:', decoded.user.id);
      next();
      
    } catch (jwtError) {
      console.error('🔑 JWT verification failed:', jwtError.message);
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          msg: 'Token has expired',
          code: 'TOKEN_EXPIRED'
        });
      }

      return res.status(401).json({
        msg: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(500).json({
      msg: 'Server error during authentication',
      code: 'AUTH_ERROR'
    });
  }
};