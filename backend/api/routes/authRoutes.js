const express = require('express');
const router = express.Router();
const {
  register,
  login,
  refreshSession,
  logout,
  getCurrentUser,
  searchUsers,
  getPublicProfile,
  updateMyProfile,
  getJobsFeed,
  getFeaturedCompaniesByRecentHires,
  getSavedJobs,
  saveJob,
  removeSavedJob,
  getMyApplications,
  applyToJob,
} = require('../controllers/authController');
const { acceptTermsConsent } = require('../controllers/authTermsController');
const {
  forgotPassword,
  resetPassword,
  sendOtp,
  verifyOtpHandler,
  resetPasswordOtp,
  sendRegistrationOtpCode,
  verifyRegistrationOtpCode,
  localRegistrationBypass,
  localPasswordResetBypass,
} = require('../controllers/authRecoveryController');
const {
  createOAuthStateSession,
  getSocialSignupSession,
  googleLogin,
  githubLogin,
  completeSocialSignup,
} = require('../controllers/oauthController');
const {
  listUserPremiumPaymentProviders,
  createUserPremiumCheckoutSession,
  captureUserPremiumPayPalCheckout,
  cancelUserPremiumCheckoutSession,
  completeLocalBypassUserPremiumCheckout,
} = require('../controllers/userPaymentController');
const {
  listFeedPosts,
  listMyPosts,
  listProfilePosts,
  createPost,
  deletePost,
  reactToPost,
  addCommentToPost,
  reactToCommentOnPost,
  toggleSharePost,
  listSavedPosts,
  savePost,
  removeSavedPost,
} = require('../controllers/postsController');
const { verifyToken, requireCsrfForCookieAuth } = require('../middleware/auth');
const {
  loginRateLimiter,
  authAttemptRateLimiter,
  forgotPasswordRateLimiter,
  resetPasswordRateLimiter,
} = require('../middleware/security');
const { validateRequest } = require('../middleware/validateRequest');
const { writeSchemas } = require('../validation/writeSchemas');
const { isLocalAuthBypassEnabled, isLocalPaymentBypassEnabled } = require('../config/localBypass');

// Public routes
router.post('/register', authAttemptRateLimiter, validateRequest(writeSchemas.authRegister), register);
router.post('/login', loginRateLimiter, validateRequest(writeSchemas.authLogin), login);
router.post('/forgot-password', forgotPasswordRateLimiter, validateRequest(writeSchemas.authForgotPassword), forgotPassword);
router.post('/reset-password', resetPasswordRateLimiter, validateRequest(writeSchemas.authResetPassword), resetPassword);
router.post('/forgot-password-otp', forgotPasswordRateLimiter, validateRequest(writeSchemas.authSendOtp), sendOtp);
router.post('/verify-otp', forgotPasswordRateLimiter, validateRequest(writeSchemas.authVerifyOtp), verifyOtpHandler);
router.post('/reset-password-otp', resetPasswordRateLimiter, validateRequest(writeSchemas.authResetPasswordOtp), resetPasswordOtp);

router.post('/send-registration-otp', authAttemptRateLimiter, validateRequest(writeSchemas.authSendOtp), sendRegistrationOtpCode);
router.post('/verify-registration-otp', authAttemptRateLimiter, validateRequest(writeSchemas.authVerifyOtp), verifyRegistrationOtpCode);
if (isLocalAuthBypassEnabled()) {
  router.post(
    '/verify-otp/localhost-bypass',
    authAttemptRateLimiter,
    validateRequest(writeSchemas.authLocalPasswordResetBypass),
    localPasswordResetBypass
  );
  router.post(
    '/registration/localhost-bypass',
    authAttemptRateLimiter,
    validateRequest(writeSchemas.authLocalRegistrationBypass),
    localRegistrationBypass
  );
}

router.post('/refresh', authAttemptRateLimiter, validateRequest(writeSchemas.authRefresh), refreshSession);
router.post('/logout', authAttemptRateLimiter, requireCsrfForCookieAuth, validateRequest(writeSchemas.authLogout), logout);

// OAuth routes
router.post('/oauth/state', authAttemptRateLimiter, validateRequest(writeSchemas.authOAuthStateCreate), createOAuthStateSession);
router.post('/google', authAttemptRateLimiter, validateRequest(writeSchemas.authGoogleLogin), googleLogin);
router.post('/github', authAttemptRateLimiter, validateRequest(writeSchemas.authGithubLogin), githubLogin);
router.get('/social-signup/session', authAttemptRateLimiter, getSocialSignupSession);
router.post(
  '/social/complete-signup',
  authAttemptRateLimiter,
  validateRequest(writeSchemas.authSocialCompleteSignup),
  completeSocialSignup
);

// Protected routes
router.get('/me', verifyToken, getCurrentUser);
router.get('/jobs', verifyToken, getJobsFeed);
router.get('/featured-companies', verifyToken, getFeaturedCompaniesByRecentHires);
router.get('/saved-jobs', verifyToken, getSavedJobs);
router.post('/saved-jobs', requireCsrfForCookieAuth, verifyToken, validateRequest(writeSchemas.authSaveJob), saveJob);
router.delete('/saved-jobs/:jobId', requireCsrfForCookieAuth, verifyToken, validateRequest(writeSchemas.authRemoveSavedJob), removeSavedJob);
router.get('/applications', verifyToken, getMyApplications);
router.post('/jobs/:id/apply', requireCsrfForCookieAuth, verifyToken, validateRequest(writeSchemas.authApplyJob), applyToJob);
router.get('/search', verifyToken, searchUsers);
router.get('/profile/:id', verifyToken, getPublicProfile);
router.patch('/profile', requireCsrfForCookieAuth, verifyToken, validateRequest(writeSchemas.authProfilePatch), updateMyProfile);
router.patch('/terms-consent', requireCsrfForCookieAuth, verifyToken, validateRequest(writeSchemas.authTermsConsent), acceptTermsConsent);
router.get('/premium/payments/providers', verifyToken, listUserPremiumPaymentProviders);
router.post('/premium/payments/checkout-session', requireCsrfForCookieAuth, verifyToken, validateRequest(writeSchemas.userPremiumCheckoutSession), createUserPremiumCheckoutSession);
if (isLocalPaymentBypassEnabled()) {
  router.post('/premium/payments/localhost-bypass', requireCsrfForCookieAuth, verifyToken, validateRequest(writeSchemas.userPremiumLocalBypass), completeLocalBypassUserPremiumCheckout);
}
router.post('/premium/payments/paypal/capture', requireCsrfForCookieAuth, verifyToken, validateRequest(writeSchemas.userPremiumPaypalCapture), captureUserPremiumPayPalCheckout);
router.post('/premium/payments/:paymentId/cancel', requireCsrfForCookieAuth, verifyToken, validateRequest(writeSchemas.userPremiumCancel), cancelUserPremiumCheckoutSession);
router.get('/posts/feed', verifyToken, listFeedPosts);
router.get('/posts/me', verifyToken, listMyPosts);
router.get('/posts/profile/:userId', verifyToken, listProfilePosts);
router.post('/posts', requireCsrfForCookieAuth, verifyToken, validateRequest(writeSchemas.authPostCreate), createPost);
router.delete('/posts/:postId', requireCsrfForCookieAuth, verifyToken, validateRequest(writeSchemas.authDeletePost), deletePost);
router.post('/posts/:postId/reactions', requireCsrfForCookieAuth, verifyToken, validateRequest(writeSchemas.authReactPost), reactToPost);
router.post('/posts/:postId/comments', requireCsrfForCookieAuth, verifyToken, validateRequest(writeSchemas.authCommentPost), addCommentToPost);
router.post('/posts/:postId/comments/:commentId/reactions', requireCsrfForCookieAuth, verifyToken, validateRequest(writeSchemas.authReactComment), reactToCommentOnPost);
router.post('/posts/:postId/share', requireCsrfForCookieAuth, verifyToken, validateRequest(writeSchemas.authSharePost), toggleSharePost);
router.get('/saved-posts', verifyToken, listSavedPosts);
router.post('/saved-posts', requireCsrfForCookieAuth, verifyToken, validateRequest(writeSchemas.authSavePost), savePost);
router.delete('/saved-posts/:postId', requireCsrfForCookieAuth, verifyToken, validateRequest(writeSchemas.authRemoveSavedPost), removeSavedPost);

module.exports = router;
