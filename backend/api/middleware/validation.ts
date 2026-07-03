import type { Request, Response, NextFunction } from 'express';
const { body, validationResult } = require('express-validator');

// Validation rules for registration
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body().custom((_: any, { req }: any) => {
    const userType = String(req.body?.userType || '').trim();
    const accountType = String(req.body?.accountType || req.body?.account_type || '').trim();
    if (!userType && !accountType) {
      throw new Error('Account type is required');
    }
    return true;
  }),

  body('userType')
    .optional()
    .isIn(['employee', 'company'])
    .withMessage('User type must be either employee or company'),

  body('accountType')
    .optional()
    .isIn(['developer', 'company'])
    .withMessage('Account type must be either developer or company'),

  body('account_type')
    .optional()
    .isIn(['developer', 'company'])
    .withMessage('Account type must be either developer or company'),
];

// Validation rules for login
const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const profileUpdateValidation = [
  body('isPremium').optional().isBoolean().withMessage('Premium flag must be true or false'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),

  body('name').optional().trim().isLength({ max: 120 }).withMessage('Name is too long'),
  body('address').optional().trim().isLength({ max: 500 }).withMessage('Address is too long'),
  body('education').optional().trim().isLength({ max: 120 }).withMessage('Education is too long'),
  body('vocationalCourse').optional().trim().isLength({ max: 160 }).withMessage('Vocational course is too long'),
  body('desiredJob').optional().trim().isLength({ max: 120 }).withMessage('Desired job is too long'),
  body('birthday').optional().isISO8601().withMessage('Birthday must be a valid date'),
  body('age').optional().isInt({ min: 0, max: 120 }).withMessage('Age must be a valid number'),
  body('sex').optional().trim().isLength({ max: 12 }).withMessage('Sex is too long'),

  body('companyName').optional().trim().isLength({ max: 160 }).withMessage('Company name is too long'),
  body('industry').optional().trim().isLength({ max: 160 }).withMessage('Industry is too long'),
  body('companySize').optional().trim().isLength({ max: 40 }).withMessage('Company size is too long'),
  body('website').optional().trim().isLength({ max: 2000 }).withMessage('Website is too long'),
  body('hiringFor').optional().trim().isLength({ max: 2000 }).withMessage('Hiring for is too long'),

  body('bio').optional().trim().isLength({ max: 2000 }).withMessage('Bio is too long'),
  body('socials').optional().trim().isLength({ max: 2000 }).withMessage('Socials is too long'),
  body('profileImage')
    .optional()
    .isString()
    .isLength({ max: 2000000 })
    .withMessage('Profile image is too large'),
  body('phone').optional().trim().isLength({ max: 40 }).withMessage('Phone is too long'),
];

// Middleware to check validation results
const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

module.exports = {
  registerValidation,
  loginValidation,
  profileUpdateValidation,
  validate,
};
