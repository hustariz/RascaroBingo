const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // req.user is set by the auth middleware
    if (!req.user) {
      return res.status(401).json({ msg: 'No authentication token, authorization denied' });
    }

    const user = await User.findById(req.user.id);
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
    }

    next();
  } catch (err) {
    console.error('Admin middleware error:', err);
    res.status(500).json({ msg: 'Server error in admin authorization' });
  }
};
