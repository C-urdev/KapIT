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
const { loginRateLimiter } = require('../middleware/security');
const { validateRequest } = require('../middleware/validateRequest');
const { writeSchemas } = require('../validation/writeSchemas');

// Public routes
router.post('/register', validateRequest(writeSchemas.authRegister), register);
router.post('/login', loginRateLimiter, validateRequest(writeSchemas.authLogin), login);
router.post('/refresh', validateRequest(writeSchemas.authRefresh), refreshSession);
router.post('/logout', requireCsrfForCookieAuth, validateRequest(writeSchemas.authLogout), logout);

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
