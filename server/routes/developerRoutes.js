const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { getMyDeveloperProfile, upsertMyDeveloperProfile } = require('../controllers/developerController');

const router = express.Router();

const requireDeveloperAccount = (req, res, next) => {
  if (req.user?.userType !== 'employee' && req.user?.accountType !== 'developer') {
    return res.status(403).json({ success: false, message: 'Developer account required' });
  }
  return next();
};

router.use(verifyToken, requireDeveloperAccount);

router.get('/profile', getMyDeveloperProfile);
router.put('/profile', upsertMyDeveloperProfile);

module.exports = router;

