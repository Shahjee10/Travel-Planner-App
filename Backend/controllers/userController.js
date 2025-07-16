const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

// Helper: Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// @desc    Send OTP to user for sign-up
// @route   POST /api/users/register/send-otp
// @access  Public
exports.sendOtpForSignup = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if verified user exists
    const verifiedUser = await User.findOne({ email, isVerified: true });
    if (verifiedUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Check if unverified user exists (resend OTP)
    let user = await User.findOne({ email, isVerified: false });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(password, 10);

    if (user) {
      // Update OTP and expiry for existing unverified user
      user.otp = otp;
      user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins
      user.password = hashedPassword; // update password in case they changed
      user.name = name; // update name in case changed
      await user.save();
    } else {
      // Create new unverified user
      user = new User({
        name,
        email,
        password: hashedPassword,
        otp,
        otpExpires: Date.now() + 10 * 60 * 1000,
        isVerified: false,
      });
      await user.save();
    }

    await sendEmail(email, 'Verify your email - Travel Planner', `Your OTP is: ${otp}`);

    res.status(200).json({ message: 'OTP sent to email for verification' });
  } catch (err) {
    console.error('sendOtpForSignup error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


// Resend OTP for signup
exports.resendOtpForSignup = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    // Find unverified user
    const user = await User.findOne({ email, isVerified: false });

    if (!user) {
      return res.status(400).json({ message: 'User not found or already verified' });
    }

    // Generate new OTP and update expiry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes from now
    await user.save();

    // Send email with new OTP
    await sendEmail(email, 'Resend OTP - Travel Planner', `Your new OTP is: ${otp}`);

    res.status(200).json({ message: 'New OTP sent to your email' });
  } catch (err) {
    console.error('resendOtpForSignup error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};



// @desc    Verify OTP and complete registration
// @route   POST /api/users/register/verify-otp
// @access  Public
exports.verifyOtpAndRegister = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({
      email,
      otp,
      otpExpires: { $gt: Date.now() },
      isVerified: false, // only unverified users can verify
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    user.isVerified = true;
    await user.save();

    res.status(201).json({
      message: 'Registration successful',
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('verifyOtpAndRegister error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


// @desc    Login user
// @route   POST /api/users/login
// @access  Public
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(401).json({ message: 'Please verify your email before logging in' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Return token and user data
    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


// @desc    Send OTP for password reset
// @route   POST /api/users/reset/send-otp
// @access  Public
exports.sendOtpForReset = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendEmail(email, 'Reset Password - Travel Planner', `Your OTP is: ${otp}`);

    res.status(200).json({ message: 'OTP sent to email' });
  } catch (err) {
    console.error('Reset OTP error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Verify OTP and reset password
// @route   POST /api/users/reset/verify-otp
// @access  Public
exports.resetPasswordWithOtp = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const user = await User.findOne({
      email,
      otp,
      otpExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
