const express = require('express');
const {
  listPublicJobs,
  getPublicJobBySlug,
  getPublicCompanyProfile,
} = require('../controllers/publicController');
const { sendChatbotMessage } = require('../controllers/chatbotController');
const { validateRequest } = require('../middleware/validateRequest');
const { writeSchemas } = require('../validation/writeSchemas');

const router = express.Router();

router.get('/jobs', listPublicJobs);
router.get('/jobs/:slug', getPublicJobBySlug);
router.get('/companies/:companyId', getPublicCompanyProfile);
router.post('/chatbot/message', validateRequest(writeSchemas.chatbotMessage), sendChatbotMessage);

module.exports = router;
