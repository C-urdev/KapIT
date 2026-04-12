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
const { registerValidation, loginValidation, profileUpdateValidation, validate } = require('../middleware/validation');
const { verifyToken, requireCsrfForCookieAuth } = require('../middleware/auth');
const { loginRateLimiter } = require('../middleware/security');

// Public routes
router.post('/register', registerValidation, validate, register);
router.post('/login', loginRateLimiter, loginValidation, validate, login);
router.post('/refresh', refreshSession);
router.post('/logout', requireCsrfForCookieAuth, logout);

// Protected routes
router.get('/me', verifyToken, getCurrentUser);
router.get('/jobs', verifyToken, getJobsFeed);
router.get('/featured-companies', verifyToken, getFeaturedCompaniesByRecentHires);
router.get('/saved-jobs', verifyToken, getSavedJobs);
router.post('/saved-jobs', requireCsrfForCookieAuth, verifyToken, saveJob);
router.delete('/saved-jobs/:jobId', requireCsrfForCookieAuth, verifyToken, removeSavedJob);
router.get('/applications', verifyToken, getMyApplications);
router.post('/jobs/:id/apply', requireCsrfForCookieAuth, verifyToken, applyToJob);
router.get('/search', verifyToken, searchUsers);
router.get('/profile/:id', verifyToken, getPublicProfile);
router.patch('/profile', requireCsrfForCookieAuth, verifyToken, profileUpdateValidation, validate, updateMyProfile);
router.get('/posts/feed', verifyToken, listFeedPosts);
router.get('/posts/me', verifyToken, listMyPosts);
router.get('/posts/profile/:userId', verifyToken, listProfilePosts);
router.post('/posts', requireCsrfForCookieAuth, verifyToken, createPost);
router.delete('/posts/:postId', requireCsrfForCookieAuth, verifyToken, deletePost);
router.post('/posts/:postId/reactions', requireCsrfForCookieAuth, verifyToken, reactToPost);
router.post('/posts/:postId/comments', requireCsrfForCookieAuth, verifyToken, addCommentToPost);
router.post('/posts/:postId/comments/:commentId/reactions', requireCsrfForCookieAuth, verifyToken, reactToCommentOnPost);
router.post('/posts/:postId/share', requireCsrfForCookieAuth, verifyToken, toggleSharePost);
router.get('/saved-posts', verifyToken, listSavedPosts);
router.post('/saved-posts', requireCsrfForCookieAuth, verifyToken, savePost);
router.delete('/saved-posts/:postId', requireCsrfForCookieAuth, verifyToken, removeSavedPost);

module.exports = router;
