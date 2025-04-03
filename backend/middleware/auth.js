// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    console.log(' [AUTH] Request:', {
      method: req.method,
      path: req.path,
      authHeader: authHeader ? 'Present' : 'Missing',
      headers: {
        ...req.headers,
        authorization: req.headers.authorization ? 'Bearer [REDACTED]' : undefined
      }
    });
    
    if (!authHeader) {
      console.log(' [AUTH] No Authorization header');
      return res.status(401).json({ 
        success: false,
        message: 'No authorization header found',
        code: 'NO_AUTH_HEADER'
      });
    }

    // Extract token
    const token = authHeader.replace('Bearer ', '');
    console.log(' [AUTH] Token extracted');
    
    if (!token) {
      console.log(' [AUTH] No token found in Authorization header');
      return res.status(401).json({ 
        success: false,
        message: 'No token found',
        code: 'NO_TOKEN'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(' [AUTH] Token verified:', {
        userId: decoded.user?.id,
        username: decoded.user?.username,
        iat: decoded.iat,
        exp: decoded.exp,
        now: Math.floor(Date.now() / 1000)
      });
      
      if (!decoded.user || !decoded.user.id) {
        console.log(' [AUTH] Invalid token payload');
        return res.status(401).json({
          success: false,
          message: 'Invalid token payload',
          code: 'INVALID_PAYLOAD'
        });
      }

      // Find user and verify token is still valid
      const user = await User.findById(decoded.user.id).select('-password');
      if (!user) {
        console.log(' [AUTH] User not found:', decoded.user.id);
        return res.status(401).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Set user in request
      req.user = {
        id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin
      };
      
      console.log(' [AUTH] Authentication successful:', {
        userId: user._id,
        username: user.username,
        method: req.method,
        path: req.path
      });
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        console.log(' [AUTH] Token expired:', error);
        return res.status(401).json({
          success: false,
          message: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      } else if (error.name === 'JsonWebTokenError') {
        console.log(' [AUTH] Invalid token:', error);
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      }
      
      console.error(' [AUTH] Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Token verification failed',
        code: 'TOKEN_VERIFICATION_FAILED'
      });
    }
  } catch (error) {
    console.error(' [AUTH] Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication',
      code: 'AUTH_SERVER_ERROR'
    });
  }
};