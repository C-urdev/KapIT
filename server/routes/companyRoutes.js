const express = require('express');
const { verifyToken } = require('../middleware/auth');
const {
  getCompanyProfile,
  createJob,
  getJobs,
  getApplicants,
  updateApplicantStatus,
  updateJobStatus,
  reopenJob,
  deleteJob,
  getDevelopers,
  getAnalytics,
  updateCompanyProfile,
  updateCompanyOnboardingProfile,
} = require('../controllers/companyController');

const router = express.Router();

const requireCompanyAccount = (req, res, next) => {
  if (req.user?.userType !== 'company') {
    return res.status(403).json({ success: false, message: 'Company account required' });
  }
  return next();
};

router.use(verifyToken, requireCompanyAccount);

router.get('/profile', getCompanyProfile);
router.post('/jobs', createJob);
router.get('/jobs', getJobs);
router.patch('/jobs/:jobId/status', updateJobStatus);
router.post('/jobs/:jobId/reopen', reopenJob);
router.delete('/jobs/:jobId', deleteJob);
router.get('/applicants', getApplicants);
router.patch('/applications/:applicationId/status', updateApplicantStatus);
router.get('/developers', getDevelopers);
router.get('/analytics', getAnalytics);
router.put('/profile', updateCompanyProfile);
router.put('/onboarding/profile', updateCompanyOnboardingProfile);

module.exports = router;
