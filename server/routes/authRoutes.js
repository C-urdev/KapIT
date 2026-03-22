const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser, searchUsers, getPublicProfile, updateMyProfile, getJobsFeed, applyToJob } = require('../controllers/authController');
const { registerValidation, loginValidation, profileUpdateValidation, validate } = require('../middleware/validation');
const { verifyToken } = require('../middleware/auth');

// Public routes
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);

// Protected routes
router.get('/me', verifyToken, getCurrentUser);
router.get('/jobs', verifyToken, getJobsFeed);
router.post('/jobs/:id/apply', verifyToken, applyToJob);
router.get('/search', verifyToken, searchUsers);
router.get('/profile/:id', verifyToken, getPublicProfile);
router.patch('/profile', verifyToken, profileUpdateValidation, validate, updateMyProfile);

module.exports = router;
