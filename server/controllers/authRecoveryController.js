const {
  issuePasswordResetToken,
  resetPasswordWithToken,
  issueOtp,
  verifyOtp: verifyOtpService,
  resetPasswordWithOtp,
  issueRegistrationOtp,
  verifyRegistrationOtp,
  issueLocalRegistrationBypassToken,
  issueLocalPasswordResetBypassToken,
} = require('../services/authService');
const { assertLocalAuthBypassAllowed } = require('../config/localBypass');

const assertLocalBypassAllowed = (req) => {
  assertLocalAuthBypassAllowed(req);
};

// @desc    Send password reset link (generic response)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  const email = String(req.body?.email || '').trim();
  const userAgent = req.get('user-agent') || '';

  const { message } = await issuePasswordResetToken({
    email,
    ipAddress: req.ip,
    userAgent,
  });

  return res.status(200).json({
    success: true,
    message,
  });
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  const token = String(req.body?.token || '').trim();
  const newPassword = String(req.body?.new_password || '');
  const userAgent = req.get('user-agent') || '';

  const outcome = await resetPasswordWithToken({
    token,
    newPassword,
    ipAddress: req.ip,
    userAgent,
  });

  return res.status(outcome.statusCode).json({
    success: outcome.success,
    message: outcome.message,
  });
};

// @desc    Send 6-digit OTP to email for password reset
// @route   POST /api/auth/forgot-password-otp
// @access  Public
const sendOtp = async (req, res) => {
  const email = String(req.body?.email || '').trim();
  const { message } = await issueOtp({ email, ipAddress: req.ip });
  return res.status(200).json({ success: true, message });
};

// @desc    Verify OTP code, returns a short-lived resetToken on success
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtpHandler = async (req, res) => {
  const email = String(req.body?.email || '').trim();
  const code = String(req.body?.code || '').trim();
  const outcome = await verifyOtpService({ email, code });
  return res.status(outcome.statusCode).json({
    success: outcome.success,
    message: outcome.message,
    resetToken: outcome.resetToken,
  });
};

// @desc    Reset password using OTP-issued resetToken
// @route   POST /api/auth/reset-password-otp
// @access  Public
const resetPasswordOtp = async (req, res) => {
  const resetToken = String(req.body?.resetToken || '').trim();
  const newPassword = String(req.body?.new_password || '');
  const outcome = await resetPasswordWithOtp({ resetToken, newPassword, ipAddress: req.ip });
  return res.status(outcome.statusCode).json({
    success: outcome.success,
    message: outcome.message,
  });
};

const sendRegistrationOtpCode = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  const result = await issueRegistrationOtp({ email, ipAddress: req.ip });
  if (result.statusCode === 200) {
    return res.status(200).json({ success: true, message: result.message });
  }
  return res.status(result.statusCode).json({ success: false, message: result.message });
};

const verifyRegistrationOtpCode = async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ success: false, message: 'Email and valid code are required.' });
  }

  const result = await verifyRegistrationOtp({ email, code });
  if (result.success) {
    return res.status(200).json({ success: true, verificationToken: result.verificationToken });
  }
  return res.status(result.statusCode).json({ success: false, message: result.message });
};

const localRegistrationBypass = async (req, res) => {
  try {
    assertLocalBypassAllowed(req);
    const email = String(req.body?.email || '').trim();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const result = await issueLocalRegistrationBypassToken({ email });
    if (result.success) {
      return res.status(200).json({ success: true, verificationToken: result.verificationToken });
    }

    return res.status(result.statusCode).json({ success: false, message: result.message });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error?.message || 'Localhost registration bypass is unavailable.',
    });
  }
};

const localPasswordResetBypass = async (req, res) => {
  try {
    assertLocalBypassAllowed(req);
    const email = String(req.body?.email || '').trim();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const result = await issueLocalPasswordResetBypassToken({ email });
    if (result.success) {
      return res.status(200).json({ success: true, resetToken: result.resetToken });
    }

    return res.status(result.statusCode).json({ success: false, message: result.message });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error?.message || 'Localhost password reset bypass is unavailable.',
    });
  }
};

module.exports = {
  forgotPassword,
  resetPassword,
  sendOtp,
  verifyOtpHandler,
  resetPasswordOtp,
  sendRegistrationOtpCode,
  verifyRegistrationOtpCode,
  localRegistrationBypass,
  localPasswordResetBypass,
};
