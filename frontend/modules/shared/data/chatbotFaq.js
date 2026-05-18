export const CHATBOT_WELCOME_MESSAGE =
  'Hi, I am the KapIT Support Assistant. I can help with accounts, jobs, resumes, pricing, onboarding, and support.';

export const CHATBOT_DEFAULT_SUGGESTIONS = [
  { id: 'apply-job', label: 'How do I apply for a job?', prompt: 'How do I apply for a job?' },
  { id: 'create-account', label: 'How do I create an account?', prompt: 'How do I create an account?' },
  { id: 'reset-password', label: 'How do I reset my password?', prompt: 'How do I reset my password?' },
  { id: 'upload-resume', label: 'How do I upload my resume?', prompt: 'How do I upload my resume?' },
  { id: 'company-features', label: 'Company features', prompt: 'What can company accounts do?' },
  { id: 'pricing', label: 'Pricing and subscriptions', prompt: 'Tell me about pricing and subscriptions.' },
  { id: 'contact-support', label: 'Contact support', prompt: 'How can I contact support?' },
];

export const CHATBOT_FALLBACK_RESPONSES = [
  "I am not fully sure what you mean yet, but I would still love to help.",
  'Could you rephrase that a little? I can help with jobs, accounts, resumes, pricing, and support.',
  'I can help with accounts, applications, resumes, company features, pricing, and onboarding. What would you like to do?',
];

export const CHATBOT_NONSENSE_RESPONSES = [
  "I am not sure I understood that yet. Try asking about accounts, resumes, applications, pricing, or support.",
  'That looks a bit unclear on my side. You can ask about jobs, onboarding, account access, or company tools.',
];

export const CHATBOT_ERROR_RESPONSES = [
  'Something went wrong on our side. Please try again in a moment.',
  'We are having trouble processing that right now. Please try again shortly.',
];

export const CHATBOT_INTENTS = [
  {
    id: 'greeting',
    group: 'greeting',
    keywords: [
      'hi',
      'hii',
      'hiii',
      'hello',
      'helo',
      'hey',
      'heyy',
      'yo',
      'sup',
      'whats up',
      "what's up",
      'good morning',
      'good afternoon',
      'good evening',
      'gm',
    ],
    responses: ['Hi! How can I help you today?', 'Hello. What can I assist you with today?', 'Good to see you. How may I help?'],
  },
  {
    id: 'help',
    group: 'help',
    keywords: ['help', 'support', 'can you help me', 'i need help', 'guide me', 'what can you do', 'how does this work'],
    responses: [
      'I can help you with account setup, login issues, job applications, resume uploads, onboarding, and pricing questions.',
      'Happy to help. You can ask about creating an account, applying to jobs, uploading a resume, employer tools, or billing.',
    ],
  },
  {
    id: 'create-account',
    group: 'auth',
    keywords: ['create account', 'create an account', 'how do i create an account', 'sign up', 'signup', 'register', 'new account'],
    responses: [
      'To create an account, open Register, choose Developer or Company, fill in your details, and submit.',
      'You can sign up from the Register page. After that, complete onboarding so your dashboard is ready to use.',
    ],
  },
  {
    id: 'login',
    group: 'auth',
    keywords: ['login', 'log in', 'sign in', 'cannot login', "can't login", 'unable to login'],
    responses: [
      'Go to the Login page and sign in with your registered email and password.',
      'If login fails, double-check your email and password first, then try password reset if needed.',
    ],
  },
  {
    id: 'reset-password',
    group: 'auth',
    keywords: ['forgot password', 'reset password', 'reset my password', 'how do i reset my password', 'password reset', 'forgot my password'],
    responses: [
      'Open Forgot Password, enter your email, then use the reset link sent to your inbox.',
      'Use the Forgot Password page, then check your email for a reset link. If it does not arrive, check spam and retry.',
    ],
  },
  {
    id: 'verification',
    group: 'auth',
    keywords: ['verification issue', 'verify account', 'verification code', 'did not receive code'],
    responses: [
      'If verification code delivery is delayed, wait a minute, check spam, and request a fresh code.',
      'For verification issues, confirm the email address is correct and request a new verification code.',
    ],
  },
  {
    id: 'apply-job',
    group: 'platform',
    keywords: ['how to apply', 'how do i apply for a job', 'apply for a job', 'apply for job', 'job application', 'submit application'],
    responses: [
      'Open Jobs, pick a role, review requirements, and click Apply. Complete any required pre-assessment before submission.',
      'To apply, go to Jobs, choose a listing, then submit your application and profile details.',
    ],
  },
  {
    id: 'upload-resume',
    group: 'platform',
    keywords: ['upload resume', 'resume upload', 'upload cv', 'add resume', 'resume'],
    responses: [
      'You can upload your resume from onboarding or your profile settings. Save after upload so employers can view the latest version.',
      'Go to your profile or onboarding step for resume upload, choose the file, then save changes.',
    ],
  },
  {
    id: 'company-features',
    group: 'platform',
    keywords: ['company features', 'company account', 'company accounts', 'what can company accounts do', 'employer account', 'post jobs', 'hire developers', 'company tools'],
    responses: [
      'Company accounts can build a hiring profile, post jobs, review applicants, and message candidates from one dashboard.',
      'Employer accounts include job posting, applicant management, messaging, and hiring workflow tools.',
    ],
  },
  {
    id: 'ai-matching',
    group: 'platform',
    keywords: ['ai matching', 'match jobs', 'matching score', 'recommend jobs'],
    responses: [
      'KapIT uses matching signals to recommend relevant opportunities and improve fit between roles and applicants.',
      'The platform highlights role fit through AI-assisted matching, so candidates and employers can move faster.',
    ],
  },
  {
    id: 'pricing',
    group: 'platform',
    keywords: ['pricing', 'subscription plans', 'billing', 'plans', 'premium', 'payment'],
    responses: [
      'You can review plans and subscriptions on the Pricing page, including billing details and available features.',
      'Open Pricing to compare subscription options and see which features are included per plan.',
    ],
  },
  {
    id: 'dashboard',
    group: 'platform',
    keywords: ['dashboard', 'where is dashboard', 'my dashboard', 'company dashboard'],
    responses: [
      'After login, open your user or company dashboard from the top navigation menu.',
      'Your dashboard becomes available once onboarding is complete and your account is active.',
    ],
  },
  {
    id: 'onboarding',
    group: 'platform',
    keywords: ['onboarding', 'get started', 'setup profile', 'complete profile'],
    responses: [
      'Onboarding helps set your profile, skills, and preferences so KapIT can personalize matches and workflows.',
      'To get started, finish the onboarding steps after signup so your dashboard and recommendations are ready.',
    ],
  },
  {
    id: 'contact-support',
    group: 'support',
    keywords: ['contact support', 'talk to support', 'human support', 'customer support'],
    responses: [
      'If you need direct help, please use the support contact options in the app and share your issue details.',
      'For account-specific issues, contact support through the platform so the team can review your case securely.',
    ],
  },
  {
    id: 'smalltalk-how-are-you',
    group: 'smalltalk',
    keywords: ['how are you', 'how are you doing'],
    responses: ['I am doing well, thanks for asking. How can I support you today?'],
  },
  {
    id: 'smalltalk-name',
    group: 'smalltalk',
    keywords: ['what is your name', "what's your name", 'who are you'],
    responses: ['I am the KapIT Support Assistant. I am here to help with platform questions.'],
  },
  {
    id: 'smalltalk-ai',
    group: 'smalltalk',
    keywords: ['are you ai', 'are you a bot', 'who made you'],
    responses: ['I am an AI support assistant built for KapIT to guide users quickly and clearly.'],
  },
  {
    id: 'smalltalk-thanks',
    group: 'smalltalk',
    keywords: ['thank you', 'thanks', 'cool', 'nice'],
    responses: ['You are welcome. If you want, I can also help with applications, resumes, or account questions.'],
  },
  {
    id: 'goodbye',
    group: 'goodbye',
    keywords: ['bye', 'goodbye', 'cya', 'see you', 'thanks bye'],
    responses: ['Have a great day!', 'Thanks for visiting KapIT.', 'Feel free to chat again anytime.'],
  },
];
