const express = require('express');
const {
  listPublicJobs,
  getPublicJobBySlug,
  getPublicCompanyProfile,
} = require('../controllers/publicController');

const router = express.Router();

router.get('/jobs', listPublicJobs);
router.get('/jobs/:slug', getPublicJobBySlug);
router.get('/companies/:companyId', getPublicCompanyProfile);

module.exports = router;
