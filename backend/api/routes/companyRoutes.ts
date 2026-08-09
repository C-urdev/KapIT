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
  capturePayPalCheckout,
  cancelCheckoutSession,
  completeLocalBypassCheckout,
} = require('../controllers/companyPaymentController');
const { validateRequest } = require('../middleware/validateRequest');
const { hydrateIdempotencyKeyFromHeader } = require('../middleware/idempotencyKey');
const { writeSchemas } = require('../validation/writeSchemas');
const { isLocalPaymentBypassEnabled } = require('../config/localBypass');

const router = express.Router();

const requireCompanyAccount = (req, res, next) => {
  if (req.user?.userType !== 'company' && req.user?.accountType !== 'company') {
    return res.status(403).json({ success: false, message: 'Company account required' });
  }
  return next();
};

router.use(verifyToken, requireCompanyAccount);

router.get('/profile', getCompanyProfile);
router.post('/jobs/draft', requireCsrfForCookieAuth, validateRequest(writeSchemas.companyDraftJob), createDraftJob);
router.get('/payments/plans', listJobPostingPlans);
router.get('/payments/providers', listPaymentProviders);
router.post(
  '/payments/checkout-session',
  requireCsrfForCookieAuth,
  hydrateIdempotencyKeyFromHeader,
  validateRequest(writeSchemas.companyCheckoutSession),
  createCheckoutSession
);
if (isLocalPaymentBypassEnabled()) {
  router.post('/payments/localhost-bypass', requireCsrfForCookieAuth, validateRequest(writeSchemas.companyLocalBypass), completeLocalBypassCheckout);
}
router.post('/payments/paypal/capture', requireCsrfForCookieAuth, validateRequest(writeSchemas.companyPaypalCapture), capturePayPalCheckout);
router.post('/payments/:paymentId/cancel', requireCsrfForCookieAuth, validateRequest(writeSchemas.companyCancel), cancelCheckoutSession);
router.post('/jobs', requireCsrfForCookieAuth, validateRequest(writeSchemas.companyJobsCreate), createJob);
router.get('/jobs', getJobs);
router.patch('/jobs/:jobId/status', requireCsrfForCookieAuth, validateRequest(writeSchemas.companyJobStatus), updateJobStatus);
router.post('/jobs/:jobId/reopen', requireCsrfForCookieAuth, validateRequest(writeSchemas.companyJobReopen), reopenJob);
router.delete('/jobs/:jobId', requireCsrfForCookieAuth, validateRequest(writeSchemas.companyDeleteJob), deleteJob);
router.get('/jobs/:jobId/ai/rank-applicants', rankApplicantsForJob);
router.get('/applicants', getApplicants);
router.patch('/applications/:applicationId/status', requireCsrfForCookieAuth, validateRequest(writeSchemas.companyApplicationStatus), updateApplicantStatus);
router.get('/developers', getDevelopers);
router.get('/analytics', getAnalytics);
router.put('/profile', requireCsrfForCookieAuth, validateRequest(writeSchemas.companyProfileUpdate), updateCompanyProfile);
router.put('/onboarding/profile', requireCsrfForCookieAuth, validateRequest(writeSchemas.companyOnboardingUpdate), updateCompanyOnboardingProfile);

module.exports = router;
