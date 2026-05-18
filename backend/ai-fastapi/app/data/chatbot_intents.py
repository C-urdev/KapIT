from dataclasses import dataclass


@dataclass(frozen=True)
class IntentDefinition:
    intent_id: str
    group: str
    keywords: tuple[str, ...]
    responses: tuple[str, ...]


TYPO_REPLACEMENTS = {
    'ehy': 'hey',
    'helo': 'hello',
    'hiii': 'hi',
    'hii': 'hi',
    'heyy': 'hey',
    'suport': 'support',
    'suppot': 'support',
    'hlp': 'help',
    'gud': 'good',
    'gudmorning': 'good morning',
    'gudafternoon': 'good afternoon',
    'gudevening': 'good evening',
    'whatsup': 'whats up',
}

PHRASE_REPLACEMENTS = {
    'gud morning': 'good morning',
    'gud afternoon': 'good afternoon',
    'gud evening': 'good evening',
}

FALLBACK_RESPONSES = (
    "I'm not fully sure what you mean yet, but I'd still love to help.",
    'Could you rephrase that slightly? I can help with jobs, accounts, resumes, pricing, and support.',
    "I'm not sure I understood that yet. Try asking about accounts, resumes, applications, pricing, or support.",
)

NONSENSE_RESPONSES = (
    "I'm not sure I understood that yet. Try asking about accounts, resumes, applications, pricing, or support.",
    'That looks unclear on my side, but I can help with account access, job applications, resumes, and pricing.',
)

FOLLOW_UP_NAVIGATION_PHRASES = (
    'where is that',
    'where is it',
    'where can i find',
    'where do i find',
    'where to find',
    'which page',
    'send link',
)

NAVIGATION_ACTIONS_BY_INTENT: dict[str, tuple[dict[str, str], ...]] = {
    'help': (
        {'type': 'navigate', 'label': 'Browse Jobs', 'href': '/jobs'},
        {'type': 'navigate', 'label': 'Create Account', 'href': '/auth/register'},
        {'type': 'navigate', 'label': 'View Pricing', 'href': '/pricing'},
    ),
    'account': (
        {'type': 'navigate', 'label': 'Open Register', 'href': '/auth/register'},
    ),
    'auth': (
        {'type': 'navigate', 'label': 'Open Login', 'href': '/auth/login'},
        {'type': 'navigate', 'label': 'Forgot Password', 'href': '/forgot-password'},
    ),
    'job': (
        {'type': 'navigate', 'label': 'Open Jobs', 'href': '/jobs'},
    ),
    'resume': (
        {'type': 'navigate', 'label': 'Resume Setup', 'href': '/onboarding/developer-profile'},
    ),
    'company': (
        {'type': 'navigate', 'label': 'Company Dashboard', 'href': '/company/dashboard'},
    ),
    'pricing': (
        {'type': 'navigate', 'label': 'Open Pricing', 'href': '/pricing'},
    ),
    'support': (
        {'type': 'navigate', 'label': 'Support Center', 'href': '/company/help'},
    ),
}

INTENT_DEFINITIONS: tuple[IntentDefinition, ...] = (
    IntentDefinition(
        intent_id='greeting',
        group='greeting',
        keywords=(
            'hi',
            'hello',
            'hey',
            'yo',
            'sup',
            'whats up',
            'morning',
            'afternoon',
            'evening',
            'good morning',
            'good afternoon',
            'good evening',
            'gm',
        ),
        responses=(
            'Hi! How can I help you today?',
            'Hello. What can I assist you with today?',
            'Good to see you. How may I help?',
        ),
    ),
    IntentDefinition(
        intent_id='help',
        group='help',
        keywords=('help', 'support', 'guide me', 'can you help me', 'i need help', 'what can you do', 'how does this work'),
        responses=(
            'I can help with account setup, login, applications, resume uploads, onboarding, and pricing.',
            'Happy to help. Ask me about jobs, accounts, resumes, subscriptions, or support workflows.',
        ),
    ),
    IntentDefinition(
        intent_id='account',
        group='account',
        keywords=('create account', 'create an account', 'how do i create an account', 'sign up', 'signup', 'register', 'new account'),
        responses=(
            'To create an account, open Register, choose Developer or Company, then submit your details.',
            'Use the Register page, complete signup, then finish onboarding to unlock your dashboard.',
        ),
    ),
    IntentDefinition(
        intent_id='auth',
        group='auth',
        keywords=(
            'login',
            'log in',
            'sign in',
            'forgot password',
            'reset password',
            'reset my password',
            'how do i reset my password',
            'verification issue',
            'verification code',
        ),
        responses=(
            'For login or verification issues, confirm your credentials, then use password reset if needed.',
            'Use Login for access, or Forgot Password to reset credentials if you cannot sign in.',
        ),
    ),
    IntentDefinition(
        intent_id='job',
        group='job',
        keywords=('how to apply', 'how do i apply for a job', 'apply for a job', 'apply job', 'job application', 'submit application', 'applications'),
        responses=(
            'Open Jobs, select a role, review requirements, and submit your application.',
            'To apply, go to Jobs, choose a listing, and complete any required pre-assessment before submitting.',
        ),
    ),
    IntentDefinition(
        intent_id='resume',
        group='resume',
        keywords=('resume', 'upload resume', 'resume upload', 'cv', 'upload cv'),
        responses=(
            'You can upload your resume from onboarding or your profile settings, then save changes.',
            'Open your profile or onboarding resume step, upload the file, and confirm save.',
        ),
    ),
    IntentDefinition(
        intent_id='company',
        group='company',
        keywords=(
            'company features',
            'company account',
            'company accounts',
            'what can company accounts do',
            'employer account',
            'post jobs',
            'hire developers',
            'company dashboard',
        ),
        responses=(
            'Company accounts can manage job posts, applicants, and candidate messaging from one dashboard.',
            'Employer features include hiring profile setup, job posting, applicant review, and messaging tools.',
        ),
    ),
    IntentDefinition(
        intent_id='pricing',
        group='pricing',
        keywords=('pricing', 'subscription', 'plans', 'billing', 'premium', 'payment'),
        responses=(
            'You can check Pricing for plan options, billing details, and feature differences.',
            'Open the Pricing page to compare subscriptions and included capabilities.',
        ),
    ),
    IntentDefinition(
        intent_id='support',
        group='support',
        keywords=('contact support', 'human support', 'customer support', 'support team'),
        responses=(
            'For account-specific issues, contact support through the app so the team can review your case securely.',
            'If you need direct assistance, use the support channel in KapIT and include your issue details.',
        ),
    ),
    IntentDefinition(
        intent_id='thanks',
        group='thanks',
        keywords=('thank you', 'thanks', 'cool', 'nice'),
        responses=(
            "You're welcome. If you want, I can also help with applications, resumes, and account questions.",
        ),
    ),
    IntentDefinition(
        intent_id='goodbye',
        group='goodbye',
        keywords=('bye', 'goodbye', 'cya', 'see you', 'thanks bye'),
        responses=(
            'Have a great day!',
            'Thanks for visiting KapIT.',
            'Feel free to chat again anytime.',
        ),
    ),
)
