const express = require('express');
const { verifyToken } = require('../middleware/auth');
const {
  getCompanyProfile,
  createJob,
  createDraftJob,
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
const {
  listJobPostingPlans,
  listPaymentProviders,
  createCheckoutSession,
  verifyStripeCheckout,
  capturePayPalCheckout,
  cancelCheckoutSession,
  completeLocalBypassCheckout,
} = require('../controllers/companyPaymentController');

const router = express.Router();

const requireCompanyAccount = (req, res, next) => {
  if (req.user?.userType !== 'company' && req.user?.accountType !== 'company') {
    return res.status(403).json({ success: false, message: 'Company account required' });
  }
  return next();
};

router.use(verifyToken, requireCompanyAccount);

router.get('/profile', getCompanyProfile);
router.post('/jobs/draft', createDraftJob);
router.get('/payments/plans', listJobPostingPlans);
router.get('/payments/providers', listPaymentProviders);
router.post('/payments/checkout-session', createCheckoutSession);
router.post('/payments/localhost-bypass', completeLocalBypassCheckout);
router.post('/payments/stripe/verify', verifyStripeCheckout);
router.post('/payments/paypal/capture', capturePayPalCheckout);
router.post('/payments/:paymentId/cancel', cancelCheckoutSession);
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
