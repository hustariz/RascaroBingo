const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('📚 MongoDB connected'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Get User model
const User = require('../models/User');

async function updateUser() {
  try {
    // Find and update the user
    const user = await User.findOne({ username: 'RascaroBingo' });
    if (!user) {
      console.error('User not found');
      process.exit(1);
    }

    // Update the user
    user.isEmailVerified = true;
    await user.save();
    
    console.log('✅ User updated successfully');
    console.log('User details:', {
      username: user.username,
      email: user.email,
      isEmailVerified: user.isEmailVerified
    });
  } catch (error) {
    console.error('Error updating user:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
  }
}

// Run the update
updateUser();
