const FALLBACK_REPLY = 'I can help with accounts, jobs, resumes, pricing, and support. What would you like to do?';

const EMPLOYER_FALLBACK_REPLY = 'I can help with company accounts, IT job posts, candidate search, applicant review, pricing, and support. What would you like to do?';

const INTENT_DEFINITIONS = [
  {
    intent: 'greeting',
    keywords: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'],
    reply: 'Hi. How can I help you today?',
  },
  {
    intent: 'upload-resume',
    keywords: ['upload resume', 'resume upload', 'upload cv', 'add resume', 'resume'],
    reply: 'You can upload your resume from onboarding or profile settings, then save changes.',
    actions: [{ type: 'navigate', label: 'Open profile settings', href: '/dashboard/user' }],
  },
  {
    intent: 'apply-job',
    keywords: ['apply for a job', 'apply for job', 'how do i apply for a job', 'how to apply', 'job application', 'apply job'],
    reply: 'Open Jobs, choose a role, review requirements, and click Apply.',
    actions: [{ type: 'navigate', label: 'Browse jobs', href: '/jobs' }],
  },
  {
    intent: 'create-account',
    keywords: ['create account', 'create an account', 'how do i create an account', 'sign up', 'signup', 'register', 'new account'],
    reply: 'To create an account, open Register, choose Developer or Company, and submit your details.',
    actions: [{ type: 'navigate', label: 'Create account', href: '/auth/register' }],
  },
  {
    intent: 'reset-password',
    keywords: ['forgot password', 'reset password', 'reset my password', 'how do i reset my password', 'password reset'],
    reply: 'Use Forgot Password, enter your email, then follow the reset link.',
    actions: [{ type: 'navigate', label: 'Reset password', href: '/forgot-password' }],
  },
  {
    intent: 'company-features',
    keywords: ['company features', 'company account', 'company accounts', 'what can company accounts do', 'employer account', 'post jobs', 'hire developers'],
    reply: 'Company accounts can create a hiring profile, post jobs, review applicants, and message candidates.',
    actions: [{ type: 'navigate', label: 'Company dashboard', href: '/company/dashboard' }],
  },
  {
    intent: 'pricing',
    keywords: ['pricing', 'premium', 'subscription', 'billing', 'payment'],
    reply: 'You can compare plans and billing details on the pricing page.',
    actions: [{ type: 'navigate', label: 'View pricing', href: '/pricing' }],
  },
  {
    intent: 'support',
    keywords: ['support', 'help', 'contact support', 'human support'],
    reply: 'For account-specific help, contact support through the platform support channel.',
    actions: [{ type: 'navigate', label: 'Open help', href: '/company/help' }],
  },
  {
    intent: 'what-is-kapit',
    keywords: ['what is kapit', 'what does kapit do', 'is kapit a job board', 'tell me about kapit'],
    reply: 'KapIT connects Philippine IT professionals with relevant opportunities and gives employers focused hiring tools.',
  },
  {
    intent: 'how-matching-works',
    keywords: ['how does matching work', 'how does ai matching work', 'match score', 'matching score', 'recommendations'],
    reply: 'KapIT uses profile, skills, preferences, and role details to highlight relevant matches. Signals support your decision; they do not replace it.',
  },
  {
    intent: 'profile-visibility',
    keywords: ['who can see my profile', 'profile visibility', 'employer see my profile', 'make profile private', 'profile privacy'],
    reply: 'Profile visibility depends on your account and profile settings. Review those settings or contact support for account-specific help.',
  },
  {
    intent: 'application-status',
    keywords: ['application status', 'where is my application', 'check application', 'track application', 'did employer see application'],
    reply: 'Open My Applications to review application activity and the latest status available for each role.',
  },
  {
    intent: 'pre-assessment',
    keywords: ['pre assessment', 'pre-assessment', 'assessment before applying', 'test before applying', 'application questions'],
    reply: 'Some roles may include a pre-assessment. Review the listing requirements and complete any required questions before submitting.',
  },
  {
    intent: 'remote-work',
    keywords: ['remote jobs', 'work from home', 'fully remote', 'hybrid jobs', 'location options'],
    reply: 'Use job location and work-preference details to find roles that match how you want to work.',
  },
  {
    intent: 'who-is-kapit-for',
    keywords: ['who is kapit for', 'who can use kapit', 'is kapit for developers', 'is kapit for employers'],
    reply: 'KapIT is built for Philippine IT professionals and the companies hiring technical talent.',
  },
  {
    intent: 'mobile-access',
    keywords: ['mobile app', 'use kapit on phone', 'mobile access', 'phone application'],
    reply: 'You can open KapIT in a mobile browser to review the available job, profile, and application flows.',
  },
];

const EMPLOYER_INTENT_DEFINITIONS = [
  {
    intent: 'greeting',
    keywords: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'],
    reply: 'Hi. How can I help with your hiring questions?',
  },
  {
    intent: 'create-company-account',
    keywords: ['create company account', 'company account', 'employer account', 'company signup', 'sign up as a company', 'register company'],
    reply: 'Open Register, choose Company, submit your details, then finish your company profile to access employer tools.',
    actions: [{ type: 'navigate', label: 'Create company account', href: '/auth/register?type=company' }],
  },
  {
    intent: 'post-job',
    keywords: ['post a job', 'post job', 'post an it role', 'create job', 'publish role', 'job listing'],
    reply: 'Create a company account, open your employer workspace, and choose the option to create a job post. Add the role details and publish when ready.',
    actions: [{ type: 'navigate', label: 'Create company account', href: '/auth/register?type=company' }],
  },
  {
    intent: 'search-candidates',
    keywords: ['find developers', 'search candidates', 'search developers', 'find candidates', 'candidate search', 'talent search', 'hire developers'],
    reply: 'Use Talent Search to look through focused Filipino IT profiles. Filter by role, skills, experience, and location.',
    actions: [{ type: 'navigate', label: 'Open employer account', href: '/auth/register?type=company' }],
  },
  {
    intent: 'review-applicants',
    keywords: ['review applicants', 'manage applicants', 'applicant review', 'rank applicants', 'compare applicants', 'applicant pipeline'],
    reply: 'Open a job listing to review applicants, compare role-fit details, update decisions, and keep the hiring pipeline organized.',
    actions: [{ type: 'navigate', label: 'Open employer account', href: '/auth/register?type=company' }],
  },
  {
    intent: 'company-features',
    keywords: ['hiring tools', 'employer features', 'company tools', 'what can employers do', 'what can company accounts do'],
    reply: 'Employer tools include focused talent search, IT job posts, applicant review, role-fit signals, and candidate messaging.',
    actions: [{ type: 'navigate', label: 'See how it works', href: '/for-employers#how-it-works' }],
  },
  {
    intent: 'pricing',
    keywords: ['pricing', 'hiring plans', 'employer pricing', 'job post pricing', 'billing', 'payment', 'plans'],
    reply: 'Open Employer Pricing to compare current posting options and see what each plan includes.',
    actions: [{ type: 'navigate', label: 'View employer pricing', href: '/for-employers/pricing' }],
  },
  {
    intent: 'support',
    keywords: ['contact support', 'human support', 'customer support', 'support team', 'employer support'],
    reply: 'For company-account help, contact support through KapIT and include your company or job-post details.',
  },
  {
    intent: 'edit-job',
    keywords: ['edit job', 'edit a role', 'change job post', 'update job listing', 'close job', 'reopen job', 'archive job'],
    reply: 'Open your job listing from the employer workspace to review its available management actions, including updates and status changes.',
  },
  {
    intent: 'search-before-posting',
    keywords: ['search before posting', 'search without posting', 'find candidates before posting', 'look for developers first'],
    reply: 'Yes. Company accounts can search developer profiles before publishing a job listing.',
  },
  {
    intent: 'role-types',
    keywords: ['remote roles', 'remote job', 'full time role', 'part time role', 'what roles can i post', 'non technical role'],
    reply: 'KapIT focuses on Philippine IT hiring. Use your listing details to describe work preference, role type, and requirements.',
  },
  {
    intent: 'pre-assessment',
    keywords: ['pre assessment', 'pre-assessment', 'screening questions', 'assessment questions', 'test applicants'],
    reply: 'You can attach role-specific pre-assessment questions so applicants see the requirements before entering review.',
  },
  {
    intent: 'match-score',
    keywords: ['match score', 'matching score', 'role fit', 'fit score', 'how are candidates ranked', 'ranking applicants'],
    reply: 'Match and ranking signals help your team compare role fit. They support review; your team controls every hiring decision.',
  },
  {
    intent: 'ai-decision',
    keywords: ['does ai choose', 'ai make hiring decision', 'automated hiring decision', 'does kapit decide', 'who makes final decision'],
    reply: 'No. Match signals support review. Your hiring team controls every shortlist, message, and final decision.',
  },
  {
    intent: 'candidate-privacy',
    keywords: ['candidate privacy', 'see candidate contact', 'candidate data', 'private profiles', 'data privacy'],
    reply: 'Use candidate information only for the hiring process and follow KapIT privacy terms. For account-specific privacy questions, contact support.',
  },
  {
    intent: 'multiple-recruiters',
    keywords: ['multiple recruiters', 'team access', 'invite teammate', 'more than one recruiter', 'company team'],
    reply: 'Company access and team permissions depend on the current workspace setup. Contact support if you need help with additional recruiters.',
  },
  {
    intent: 'what-is-kapit',
    keywords: ['what is kapit', 'what does kapit do', 'is kapit a job board', 'tell me about kapit'],
    reply: 'KapIT is a focused platform for connecting Philippine IT employers with job-ready technical talent and organized hiring tools.',
  },
  {
    intent: 'who-is-kapit-for',
    keywords: ['who is kapit for', 'who can use kapit', 'is kapit for companies', 'is kapit for recruiters'],
    reply: 'KapIT is for recruiters, founders, hiring managers, and authorized company representatives hiring for IT roles.',
  },
  {
    intent: 'kapit-direct-hiring',
    keywords: ['does kapit hire', 'does kapit hire developers', 'is kapit an agency', 'does kapit employ candidates'],
    reply: 'KapIT provides the hiring platform. Your company reviews candidates and makes its own hiring decisions.',
  },
  {
    intent: 'company-location',
    keywords: ['only philippines companies', 'foreign company', 'overseas company', 'outside philippines', 'international company'],
    reply: 'KapIT focuses on Philippine IT talent. Company eligibility and hiring setup can depend on your use case; contact support if unsure.',
  },
  {
    intent: 'after-signup',
    keywords: ['what happens after signup', 'after creating company account', 'next after registration', 'company onboarding'],
    reply: 'After signup, complete your company profile, then use the employer workspace to search talent or create a role.',
  },
  {
    intent: 'mobile-access',
    keywords: ['mobile app', 'use kapit on phone', 'mobile access', 'phone hiring', 'tablet access'],
    reply: 'The employer landing page works on desktop and mobile. Open KapIT in your browser to access the available workspace.',
  },
];

const FILLER_TOKENS = new Set(['a', 'an', 'the', 'how', 'do', 'i', 'my', 'can', 'to', 'for', 'what']);

const normalizeInput = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

const isFollowUpQuestion = (value) => {
  const normalized = normalizeInput(value);
  return ['where', 'where?', 'huh', 'huh?', '?', '??'].includes(normalized);
};

const includesKeyword = (message, keyword) => {
  const normalizedKeyword = normalizeInput(keyword);
  if (!normalizedKeyword) return false;

  if (message.includes(normalizedKeyword)) {
    return true;
  }

  const messageTokens = message.split(' ').filter(Boolean);
  const keywordTokens = normalizedKeyword.split(' ').filter(Boolean);
  if (!messageTokens.length || !keywordTokens.length) {
    return false;
  }

  const filteredMessageTokens = messageTokens.filter((token) => !FILLER_TOKENS.has(token));
  const filteredKeywordTokens = keywordTokens.filter((token) => !FILLER_TOKENS.has(token));
  const comparisonMessageTokens = filteredMessageTokens.length > 0 ? filteredMessageTokens : messageTokens;
  const comparisonKeywordTokens = filteredKeywordTokens.length > 0 ? filteredKeywordTokens : keywordTokens;

  return comparisonKeywordTokens.every((token) => comparisonMessageTokens.includes(token));
};

const pickFallbackIntentByLastIntent = (lastIntent) => {
  const normalized = normalizeInput(lastIntent);
  if (!normalized) return null;
  return INTENT_DEFINITIONS.find((item) => item.intent === normalized) || null;
};

const resolveLocalChatbotFallback = ({ message, lastIntent, audience = 'general' }) => {
  const definitions = audience === 'employer' ? EMPLOYER_INTENT_DEFINITIONS : INTENT_DEFINITIONS;
  const fallbackReply = audience === 'employer' ? EMPLOYER_FALLBACK_REPLY : FALLBACK_REPLY;
  const normalizedMessage = normalizeInput(message);
  const followUpIntent = definitions.find((item) => item.intent === normalizeInput(lastIntent)) || null;

  if (followUpIntent && isFollowUpQuestion(normalizedMessage)) {
    return {
      reply: followUpIntent.reply,
      intent: followUpIntent.intent,
      confidence: 0.9,
      actions: Array.isArray(followUpIntent.actions) ? followUpIntent.actions : [],
    };
  }

  for (const definition of definitions) {
    const matched = definition.keywords.some((keyword) => includesKeyword(normalizedMessage, keyword));
    if (!matched) continue;

    return {
      reply: definition.reply,
      intent: definition.intent,
      confidence: 0.85,
      actions: Array.isArray(definition.actions) ? definition.actions : [],
    };
  }

  return {
    reply: fallbackReply,
    intent: 'fallback',
    confidence: 0,
    actions: [],
  };
};

module.exports = {
  FALLBACK_REPLY,
  resolveLocalChatbotFallback,
};
