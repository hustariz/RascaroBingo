const nodemailer = require('nodemailer');
const crypto = require('crypto');
const User = require('../models/User');

// Validate environment variables
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.error('❌ Missing required environment variables for email service');
  console.error('Required variables:', {
    EMAIL_USER: !!process.env.EMAIL_USER,
    EMAIL_PASSWORD: !!process.env.EMAIL_PASSWORD,
    FRONTEND_URL: process.env.FRONTEND_URL || 'not set'
  });
}

// Create email transporter
console.log('📧 Creating email transporter with config:', {
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    hasPassword: !!process.env.EMAIL_PASSWORD
  }
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  debug: true,
  logger: true // Enable built-in logger
});

// Verify transporter configuration
transporter.verify(function(error) {
  if (error) {
    console.error('❌ Email transporter verification failed:', {
      error: error.message,
      code: error.code,
      command: error.command,
      stack: error.stack
    });
  } else {
    console.log('✅ Email transporter verified successfully');
  }
});

// Log environment variables (without sensitive info)
console.log('Email Configuration:', {
  emailUser: process.env.EMAIL_USER,
  frontendUrl: process.env.FRONTEND_URL,
  hasPassword: !!process.env.EMAIL_PASSWORD
});

// Generate verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Send verification email
const sendVerificationEmail = async (user, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
  console.log('🔗 Generated verification URL:', verificationUrl);

  const mailOptions = {
    from: {
      name: 'RascaroBingo',
      address: process.env.EMAIL_USER
    },
    to: user.email,
    subject: '✨ Welcome to RascaroBingo - Please Verify Your Email',
    headers: {
      'X-Entity-Ref-ID': token,
      'List-Unsubscribe': `<mailto:${process.env.EMAIL_USER}?subject=unsubscribe>`,
      'Precedence': 'bulk'
    },
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background-color: #1a1a1a; color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #eeb111; font-size: 32px; margin: 0;">RascaroBingo</h1>
          <p style="color: #888888; margin-top: 5px;">Transform Your Trading Journey</p>
        </div>
        <div style="background-color: #2a2a2a; border-radius: 10px; padding: 30px; margin-bottom: 30px;">
          <h2 style="color: #eeb111; text-align: center; margin-top: 0;">Welcome to RascaroBingo!</h2>
          <p>Hello ${user.username},</p>
          <p>Thank you for joining RascaroBingo! To get started and ensure the security of your account, please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #eeb111; 
                      color: black; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px;
                      font-weight: bold;
                      display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="margin-bottom: 5px;">If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="background-color: #1a1a1a; padding: 10px; border-radius: 5px; word-break: break-all;">
            <a href="${verificationUrl}" style="color: #eeb111; text-decoration: none;">${verificationUrl}</a>
          </p>
          <p style="color: #888888; font-size: 14px; margin-top: 20px;">This verification link will expire in 24 hours for security reasons.</p>
        </div>
        <div style="text-align: center; color: #888888; font-size: 12px;">
          <p>If you didn't create an account with RascaroBingo, please ignore this email.</p>
          <p> 2025 RascaroBingo. All rights reserved.</p>
        </div>
      </div>
    `
  };

  try {
    console.log(' Attempting to send email:', {
      to: user.email,
      from: process.env.EMAIL_USER,
      frontendUrl: process.env.FRONTEND_URL,
      smtpConfig: {
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          hasPassword: !!process.env.EMAIL_PASSWORD
        }
      }
    });
    
    const info = await transporter.sendMail(mailOptions);
    console.log(' Email sent successfully:', {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected
    });
    return true;
  } catch (error) {
    console.error(' Detailed email error:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      stack: error.stack,
      smtpError: error.message
    });
    throw error;
  }
};

// Controller methods
const emailVerificationController = {
  // Check if email exists
  checkEmail: async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      res.json({ 
        exists: !!user,
        username: user ? user.username : null 
      });
    } catch (error) {
      console.error('Check email error:', error);
      res.status(500).json({ message: 'Error checking email' });
    }
  },

  // Generate and send verification email
  sendVerification: async (user) => {
    try {
      const token = generateVerificationToken();
      
      // Save token and expiration
      user.emailVerificationToken = token;
      user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      await user.save();

      // Send verification email
      await sendVerificationEmail(user, token);
      
      return true;
    } catch (error) {
      console.error('Send verification error:', error);
      return false;
    }
  },

  // Verify email with token
  verifyEmail: async (req, res) => {
    try {
      const { token } = req.params;
      
      const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({
          message: 'Invalid or expired verification token'
        });
      }

      // Update user verification status
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      console.error('Verify email error:', error);
      res.status(500).json({ message: 'Error verifying email' });
    }
  },

  // Resend verification email
  resendVerification: async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({
          message: 'User not found'
        });
      }

      if (user.isEmailVerified) {
        return res.status(400).json({
          message: 'Email is already verified'
        });
      }

      const success = await emailVerificationController.sendVerification(user);
      
      if (success) {
        res.json({ message: 'Verification email sent successfully' });
      } else {
        res.status(500).json({ message: 'Error sending verification email' });
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({ message: 'Error resending verification email' });
    }
  }
};

module.exports = emailVerificationController;
