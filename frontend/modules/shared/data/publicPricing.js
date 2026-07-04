import { JOB_POST_PLANS, PLAN_FEATURES } from '../../company/features/companyPaymentCatalog';

export const USER_BILLING_PLANS = [
  {
    id: 'user-free',
    name: 'Free',
    price: 0,
    priceLabel: 'PHP 0',
    meta: 'per month',
    cta: 'Get started',
    href: '/auth/register?type=developer',
    features: [
      'Access to IT job listings',
      'Basic search and filtering tools',
      'Create and manage your profile',
      'Upload your resume',
      'Email job alerts',
    ],
  },
  {
    id: 'user-premium',
    name: 'Premium',
    price: 449,
    priceLabel: 'PHP 449',
    meta: 'per month',
    cta: 'Upgrade to premium',
    href: '/premium/payment',
    popular: true,
    features: [
      'Priority access to new job postings',
      'Advanced job matching and filters',
      'ATS-optimized resume formatting',
      'Skill match percentage',
      'Application tracking updates',
      'Ghost job prevention signals',
    ],
  },
];

const COMPANY_PLAN_COPY = {
  '1-week': {
    meta: '7-day job post window',
    subtitle: 'Urgent role coverage',
    features: [
      'Fast launch for one open role',
      'Verified payment before publishing',
      'Basic applicant screening',
      'Save drafts and reopen later',
    ],
  },
  '1-month': {
    meta: '30-day job post window',
    subtitle: 'Steady monthly hiring',
    features: [
      'Consistent visibility for active roles',
      'Verified payment before publishing',
      'Basic applicant screening',
      'Save drafts and reopen later',
    ],
  },
  '3-months': {
    meta: '90-day job post window',
    subtitle: 'Quarterly recruitment planning',
    features: [
      'Longer reach for recurring openings',
      'Verified payment before publishing',
      'Basic applicant screening',
      'Save drafts and reopen later',
    ],
  },
  '6-months': {
    meta: '180-day job post window',
    subtitle: 'Enterprise planning for long hiring cycles',
    features: [
      'Built for long hiring cycles',
      'Verified payment before publishing',
      'Basic applicant screening',
      'Save drafts and reopen later',
    ],
  },
};

export const PRICING_PAGE_META = {
  title: 'KapIT Pricing for Job Seekers and Hiring Teams',
  description: 'Compare KapIT pricing for premium applicant tools and company job post plans from 1 week to 6 months.',
  keywords: 'KapIT pricing, job posting plans, hiring plans, developer premium plan, IT hiring platform',
};

export function buildCompanyPlans() {
  return JOB_POST_PLANS.map((plan) => {
    const copy = COMPANY_PLAN_COPY[plan.id] || {};

    return {
      id: `company-${plan.id}`,
      name: plan.label,
      price: Number(plan.price || 0),
      priceLabel: `PHP ${Number(plan.price || 0).toLocaleString()}`,
      meta: copy.meta || `${plan.durationLabel} job post visibility`,
      cta: 'Choose plan',
      href: '/auth/register?type=company',
      popular: Boolean(plan.highlighted),
      subtitle: copy.subtitle || plan.description,
      features: copy.features || PLAN_FEATURES,
      durationDays: plan.durationDays,
    };
  });
}
