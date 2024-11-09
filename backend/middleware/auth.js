// middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      console.log('❌ No Authorization header');
      return res.status(401).json({ 
        msg: 'No authorization header found',
        code: 'NO_AUTH_HEADER'
      });
    }

    // Extract token
    const token = authHeader.replace('Bearer ', '');
    
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
      
      if (!decoded.user || !decoded.user.id) {
        console.log('❌ Invalid token payload');
        return res.status(401).json({
          msg: 'Invalid token payload',
          code: 'INVALID_PAYLOAD'
        });
      }

      // Set user info in request
      req.user = decoded.user;
      req.token = token;  // Store token for potential use in routes

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