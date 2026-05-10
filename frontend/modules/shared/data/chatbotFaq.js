export const CHATBOT_FALLBACK_RESPONSE = "Sorry, I couldn't understand that yet. Please contact support or try another question.";

export const CHATBOT_WELCOME_MESSAGE =
  'Hi! I am KapIT Support. Ask me about account setup, applying to jobs, company features, resume uploads, or password reset.';

export const CHATBOT_QUICK_REPLIES = [
  { id: 'jobs', label: 'How to apply' },
  { id: 'account', label: 'Create account' },
  { id: 'password', label: 'Reset password' },
  { id: 'company', label: 'Company features' },
  { id: 'resume', label: 'Resume upload' },
];

export const CHATBOT_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'account', label: 'Account' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'companies', label: 'Companies' },
  { id: 'resume', label: 'Resume' },
  { id: 'payments', label: 'Payments' },
];

export const FAQ_ENTRIES = [
  {
    id: 'integrations',
    category: 'companies',
    question: 'What integrations does KapIT support?',
    keywords: ['integration', 'integrations', 'tools', 'connect', 'api integration'],
    response:
      'KapIT supports common hiring and workflow integrations depending on your plan and setup.\n\nExamples include:\n- Email notifications\n- Social login providers\n- Payment and billing services\n- Job and applicant workflow tools\n- Resume and file upload flows\n\nIf you share your exact use case, support can suggest the best setup path.',
  },
  {
    id: 'apply-job',
    category: 'jobs',
    question: 'How do I apply for a job?',
    keywords: ['apply', 'application', 'job application', 'apply job', 'how to apply'],
    response:
      'To apply for a job, open the Jobs page, choose a listing, review the requirements, and click Apply. Complete any required pre-assessment and submit your profile details before confirmation.',
  },
  {
    id: 'reset-password',
    category: 'account',
    question: 'How do I reset a forgotten password?',
    keywords: ['reset password', 'forgot password', 'password reset', 'forgot my password'],
    response:
      'To reset your password, go to Forgot Password, enter your email, open the reset link sent to your inbox, and create a new password. If you do not receive an email, check your spam folder and retry.',
  },
  {
    id: 'create-account',
    category: 'account',
    question: 'How do I create a new account?',
    keywords: ['create account', 'register', 'sign up', 'signup', 'new account'],
    response:
      'To create an account, open Register, choose your account type (Developer or Company), fill in your details, and submit. After registration, complete onboarding to unlock your dashboard features.',
  },
  {
    id: 'company-features',
    category: 'companies',
    question: 'What can company or employer accounts do?',
    keywords: ['company', 'employer', 'business account', 'post job', 'hire developer'],
    response:
      'Company accounts can create a hiring profile, post job openings, manage applicants, send messages, and track job performance from the company dashboard.',
  },
  {
    id: 'resume-upload',
    category: 'resume',
    question: 'How can I upload my resume?',
    keywords: ['resume', 'cv', 'upload resume', 'resume upload', 'profile document'],
    response:
      'You can upload your resume from your profile or onboarding flow. Use a clear and updated file, then save changes so employers can view your latest qualifications.',
  },
  {
    id: 'payments',
    category: 'payments',
    question: 'Where can I view plans and payment details?',
    keywords: ['payment', 'billing', 'premium', 'plan', 'subscription'],
    response:
      'For paid features, open the Premium or Payment pages in your dashboard to view available plans, pricing, and your current billing status.',
  },
];
