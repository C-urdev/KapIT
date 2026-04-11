const express = require('express');
const { verifyToken, requireCsrfForCookieAuth } = require('../middleware/auth');
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
  rankApplicantsForJob,
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
router.post('/jobs/draft', requireCsrfForCookieAuth, createDraftJob);
router.get('/payments/plans', listJobPostingPlans);
router.get('/payments/providers', listPaymentProviders);
router.post('/payments/checkout-session', requireCsrfForCookieAuth, createCheckoutSession);
router.post('/payments/localhost-bypass', requireCsrfForCookieAuth, completeLocalBypassCheckout);
router.post('/payments/stripe/verify', requireCsrfForCookieAuth, verifyStripeCheckout);
router.post('/payments/paypal/capture', requireCsrfForCookieAuth, capturePayPalCheckout);
router.post('/payments/:paymentId/cancel', requireCsrfForCookieAuth, cancelCheckoutSession);
router.post('/jobs', requireCsrfForCookieAuth, createJob);
router.get('/jobs', getJobs);
router.patch('/jobs/:jobId/status', requireCsrfForCookieAuth, updateJobStatus);
router.post('/jobs/:jobId/reopen', requireCsrfForCookieAuth, reopenJob);
router.delete('/jobs/:jobId', requireCsrfForCookieAuth, deleteJob);
router.get('/jobs/:jobId/ai/rank-applicants', rankApplicantsForJob);
router.get('/applicants', getApplicants);
router.patch('/applications/:applicationId/status', requireCsrfForCookieAuth, updateApplicantStatus);
router.get('/developers', getDevelopers);
router.get('/analytics', getAnalytics);
router.put('/profile', requireCsrfForCookieAuth, updateCompanyProfile);
router.put('/onboarding/profile', requireCsrfForCookieAuth, updateCompanyOnboardingProfile);

module.exports = router;
