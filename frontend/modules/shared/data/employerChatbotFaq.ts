export const EMPLOYER_CHATBOT_WELCOME_MESSAGE =
  'Hi, I am the KapIT Employer Assistant. I can help with company accounts, job posts, candidate search, applicant review, pricing, and support.';

export const EMPLOYER_CHATBOT_DEFAULT_SUGGESTIONS = [
  { id: 'create-company-account', label: 'How do I create a company account?', prompt: 'How do I create a company account?' },
  { id: 'post-job', label: 'How do I post an IT role?', prompt: 'How do I post an IT role?' },
  { id: 'search-candidates', label: 'How do I find developers?', prompt: 'How do I find developers for a role?' },
  { id: 'review-applicants', label: 'How do I review applicants?', prompt: 'How do I review applicants?' },
  { id: 'pricing', label: 'What hiring plans are available?', prompt: 'What hiring plans are available?' },
];

export const EMPLOYER_CHATBOT_FALLBACK_RESPONSES = [
  'I can help with company accounts, IT job posts, candidate search, applicant review, pricing, and support. What would you like to do?',
  'Could you rephrase that a little? Try asking about hiring tools, job posts, candidates, applicants, or pricing.',
];

export const EMPLOYER_CHATBOT_NONSENSE_RESPONSES = [
  'I am not sure I understood that yet. You can ask about creating a company account, posting a role, or reviewing applicants.',
  'That looks unclear on my side. Try asking about candidate search, hiring tools, pricing, or support.',
];

export const EMPLOYER_CHATBOT_INTENTS = [
  {
    id: 'greeting',
    group: 'greeting',
    keywords: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'],
    responses: ['Hi! How can I help with your hiring questions?', 'Hello. What can I help you with today?'],
  },
  {
    id: 'help',
    group: 'help',
    keywords: ['help', 'support', 'what can you do', 'how does this work', 'hiring help'],
    responses: [
      'I can help with company setup, IT job posts, candidate search, applicant review, pricing, and support.',
      'Ask me about employer tools, hiring steps, company accounts, or billing.',
    ],
  },
  {
    id: 'create-company-account',
    group: 'employer',
    keywords: ['create company account', 'company account', 'employer account', 'company signup', 'sign up as a company', 'register company'],
    responses: [
      'Open Register, choose Company, submit your details, then finish your company profile to access employer tools.',
      'Choose Company on the Register page. After signup, complete onboarding so your employer workspace is ready.',
    ],
  },
  {
    id: 'post-job',
    group: 'employer',
    keywords: ['post a job', 'post job', 'post an it role', 'create job', 'publish role', 'job listing'],
    responses: [
      'Create a company account, open your employer workspace, and choose the option to create a job post. Add the role details and publish when ready.',
      'Start from your company dashboard, create an IT role, add requirements and hiring details, then publish the listing.',
    ],
  },
  {
    id: 'search-candidates',
    group: 'employer',
    keywords: ['find developers', 'search candidates', 'search developers', 'find candidates', 'candidate search', 'talent search', 'hire developers'],
    responses: [
      'Use Talent Search to look through focused Filipino IT profiles. Filter by role, skills, experience, and location.',
      'Open Talent Search, describe the role or skill you need, then compare developer profiles and role-fit signals.',
    ],
  },
  {
    id: 'review-applicants',
    group: 'employer',
    keywords: ['review applicants', 'manage applicants', 'applicant review', 'rank applicants', 'compare applicants', 'applicant pipeline'],
    responses: [
      'Open a job listing to review applicants, compare role-fit details, update decisions, and keep the hiring pipeline organized.',
      'Your employer workspace keeps applicants, role context, messages, and hiring decisions together for review.',
    ],
  },
  {
    id: 'company-features',
    group: 'employer',
    keywords: ['hiring tools', 'employer features', 'company tools', 'what can employers do', 'what can company accounts do'],
    responses: [
      'Employer tools include focused talent search, IT job posts, applicant review, role-fit signals, and candidate messaging.',
      'Company accounts can create a hiring profile, publish roles, review applicants, and manage candidate conversations.',
    ],
  },
  {
    id: 'pricing',
    group: 'employer',
    keywords: ['pricing', 'hiring plans', 'employer pricing', 'job post pricing', 'billing', 'payment', 'plans'],
    responses: [
      'Open Employer Pricing to compare current posting options and see what each plan includes.',
      'You can review employer plan options, posting details, and billing information on the Pricing page.',
    ],
  },
  {
    id: 'support',
    group: 'support',
    keywords: ['contact support', 'human support', 'customer support', 'support team', 'employer support'],
    responses: [
      'For company-account help, contact support through KapIT and include your company or job-post details.',
      'Use the support channel in KapIT for account-specific employer help so the team can review your case securely.',
    ],
  },
  {
    id: 'edit-job',
    group: 'employer',
    keywords: ['edit job', 'edit a role', 'change job post', 'update job listing', 'close job', 'reopen job', 'archive job'],
    responses: ['Open your job listing from the employer workspace to review its available management actions, including updates and status changes.'],
  },
  {
    id: 'search-before-posting',
    group: 'employer',
    keywords: ['search before posting', 'search without posting', 'find candidates before posting', 'look for developers first'],
    responses: ['Yes. Company accounts can search developer profiles before publishing a job listing.'],
  },
  {
    id: 'role-types',
    group: 'employer',
    keywords: ['remote roles', 'remote job', 'full time role', 'part time role', 'what roles can i post', 'non technical role'],
    responses: ['KapIT focuses on Philippine IT hiring. Use your listing details to describe work preference, role type, and requirements.'],
  },
  {
    id: 'pre-assessment',
    group: 'employer',
    keywords: ['pre assessment', 'pre-assessment', 'screening questions', 'assessment questions', 'test applicants'],
    responses: ['You can attach role-specific pre-assessment questions so applicants see the requirements before entering review.'],
  },
  {
    id: 'match-score',
    group: 'employer',
    keywords: ['match score', 'matching score', 'role fit', 'fit score', 'how are candidates ranked', 'ranking applicants'],
    responses: ['Match and ranking signals help your team compare role fit. They support review; your team controls every hiring decision.'],
  },
  {
    id: 'ai-decision',
    group: 'trust',
    keywords: ['does ai choose', 'ai make hiring decision', 'automated hiring decision', 'does kapit decide', 'who makes final decision'],
    responses: ['No. Match signals support review. Your hiring team controls every shortlist, message, and final decision.'],
  },
  {
    id: 'candidate-privacy',
    group: 'trust',
    keywords: ['candidate privacy', 'see candidate contact', 'candidate data', 'private profiles', 'data privacy'],
    responses: ['Use candidate information only for the hiring process and follow KapIT privacy terms. For account-specific privacy questions, contact support.'],
  },
  {
    id: 'multiple-recruiters',
    group: 'employer',
    keywords: ['multiple recruiters', 'team access', 'invite teammate', 'more than one recruiter', 'company team'],
    responses: ['Company access and team permissions depend on the current workspace setup. Contact support if you need help with additional recruiters.'],
  },
  {
    id: 'what-is-kapit',
    group: 'about',
    keywords: ['what is kapit', 'what does kapit do', 'is kapit a job board', 'tell me about kapit'],
    responses: ['KapIT is a focused platform for connecting Philippine IT employers with job-ready technical talent and organized hiring tools.'],
  },
  {
    id: 'who-is-kapit-for',
    group: 'about',
    keywords: ['who is kapit for', 'who can use kapit', 'is kapit for companies', 'is kapit for recruiters'],
    responses: ['KapIT is for recruiters, founders, hiring managers, and authorized company representatives hiring for IT roles.'],
  },
  {
    id: 'kapit-direct-hiring',
    group: 'about',
    keywords: ['does kapit hire', 'does kapit hire developers', 'is kapit an agency', 'does kapit employ candidates'],
    responses: ['KapIT provides the hiring platform. Your company reviews candidates and makes its own hiring decisions.'],
  },
  {
    id: 'company-location',
    group: 'about',
    keywords: ['only philippines companies', 'foreign company', 'overseas company', 'outside philippines', 'international company'],
    responses: ['KapIT focuses on Philippine IT talent. Company eligibility and hiring setup can depend on your use case; contact support if unsure.'],
  },
  {
    id: 'after-signup',
    group: 'onboarding',
    keywords: ['what happens after signup', 'after creating company account', 'next after registration', 'company onboarding'],
    responses: ['After signup, complete your company profile, then use the employer workspace to search talent or create a role.'],
  },
  {
    id: 'mobile-access',
    group: 'platform',
    keywords: ['mobile app', 'use kapit on phone', 'mobile access', 'phone hiring', 'tablet access'],
    responses: ['The employer landing page works on desktop and mobile. Open KapIT in your browser to access the available workspace.'],
  },
  {
    id: 'random-question',
    group: 'about',
    keywords: ['what can you help with', 'ask you anything', 'random question', 'can i ask a question'],
    responses: ['Ask me about company setup, job posts, candidates, applicants, matching signals, pricing, privacy, or support.'],
  },
  {
    id: 'smalltalk-name',
    group: 'smalltalk',
    keywords: ['what is your name', "what's your name", 'who are you'],
    responses: ['I am the KapIT Employer Assistant. I help answer company and hiring questions.'],
  },
  {
    id: 'smalltalk-ai',
    group: 'smalltalk',
    keywords: ['are you ai', 'are you a bot', 'who made you'],
    responses: ['I am an AI support assistant built for KapIT employer questions.'],
  },
  {
    id: 'thanks',
    group: 'smalltalk',
    keywords: ['thank you', 'thanks', 'cool', 'nice'],
    responses: ['You are welcome. Ask me if you need help with your next hiring step.'],
  },
];
