const express = require('express');
const { verifyToken } = require('../middleware/auth');
const {
  createJob,
  getJobs,
  getApplicants,
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

router.post('/jobs', createJob);
router.get('/jobs', getJobs);
router.get('/applicants', getApplicants);
router.get('/developers', getDevelopers);
router.get('/analytics', getAnalytics);
router.put('/profile', updateCompanyProfile);
router.put('/onboarding/profile', updateCompanyOnboardingProfile);

module.exports = router;
