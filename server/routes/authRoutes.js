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
  getSavedJobs,
  saveJob,
  removeSavedJob,
  getMyApplications,
  applyToJob,
} = require('../controllers/authController');
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
router.get('/saved-jobs', verifyToken, getSavedJobs);
router.post('/saved-jobs', requireCsrfForCookieAuth, verifyToken, saveJob);
router.delete('/saved-jobs/:jobId', requireCsrfForCookieAuth, verifyToken, removeSavedJob);
router.get('/applications', verifyToken, getMyApplications);
router.post('/jobs/:id/apply', requireCsrfForCookieAuth, verifyToken, applyToJob);
router.get('/search', verifyToken, searchUsers);
router.get('/profile/:id', verifyToken, getPublicProfile);
router.patch('/profile', requireCsrfForCookieAuth, verifyToken, profileUpdateValidation, validate, updateMyProfile);

module.exports = router;
