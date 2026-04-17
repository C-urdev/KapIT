const express = require('express');
const { verifyToken, requireCsrfForCookieAuth } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');
const { writeSchemas } = require('../validation/writeSchemas');
const { matchJobs } = require('../controllers/matchController');

const router = express.Router();

router.post('/match-jobs', requireCsrfForCookieAuth, verifyToken, validateRequest(writeSchemas.matchJobs), matchJobs);

module.exports = router;
