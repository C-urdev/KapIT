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
} = require('../controllers/authRecoveryController');
const { googleLogin, githubLogin } = require('../controllers/oauthController');
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
const { loginRateLimiter, forgotPasswordRateLimiter, resetPasswordRateLimiter } = require('../middleware/security');
const { validateRequest } = require('../middleware/validateRequest');
const { writeSchemas } = require('../validation/writeSchemas');

// Public routes
router.post('/register', validateRequest(writeSchemas.authRegister), register);
router.post('/login', loginRateLimiter, validateRequest(writeSchemas.authLogin), login);
router.post('/forgot-password', forgotPasswordRateLimiter, validateRequest(writeSchemas.authForgotPassword), forgotPassword);
router.post('/reset-password', resetPasswordRateLimiter, validateRequest(writeSchemas.authResetPassword), resetPassword);
router.post('/forgot-password-otp', forgotPasswordRateLimiter, validateRequest(writeSchemas.authSendOtp), sendOtp);
router.post('/verify-otp', forgotPasswordRateLimiter, validateRequest(writeSchemas.authVerifyOtp), verifyOtpHandler);
router.post('/reset-password-otp', resetPasswordRateLimiter, validateRequest(writeSchemas.authResetPasswordOtp), resetPasswordOtp);

router.post('/send-registration-otp', validateRequest(writeSchemas.authSendOtp), sendRegistrationOtpCode);
router.post('/verify-registration-otp', validateRequest(writeSchemas.authVerifyOtp), verifyRegistrationOtpCode);

router.post('/refresh', validateRequest(writeSchemas.authRefresh), refreshSession);
router.post('/logout', requireCsrfForCookieAuth, validateRequest(writeSchemas.authLogout), logout);

// OAuth routes
router.post('/google', loginRateLimiter, googleLogin);
router.post('/github', loginRateLimiter, githubLogin);

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
