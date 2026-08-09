import { JOB_POST_PLANS, PLAN_FEATURES } from '../../company/features/companyPaymentCatalog';

type BillingPlan = {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  meta: string;
  cta: string;
  href: string;
  popular?: boolean;
  subtitle?: string;
  features: string[];
  durationDays?: number;
};

type CompanyPlanCopy = {
  name: string;
  meta: string;
  subtitle: string;
  features: string[];
};

type PricingPageMeta = {
  title: string;
  description: string;
  keywords: string;
};

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
] satisfies BillingPlan[];

const COMPANY_PLAN_COPY: Record<string, CompanyPlanCopy> = {
  '1-week': {
    name: 'Essential',
    meta: '7-day posting window',
    subtitle: 'For one urgent opening that needs fast visibility.',
    features: [
      'Publish one focused IT role fast',
      'Keep applicants visible for 7 days',
      'Use basic screening before review',
      'Save drafts and reopen later',
    ],
  },
  '1-month': {
    name: 'Growth',
    meta: '30-day posting window',
    subtitle: 'For steady hiring across a full monthly cycle.',
    features: [
      'Stay visible while the role is active',
      'Collect applicants for 30 days',
      'Verified payment before publishing',
      'Save drafts and reopen later',
    ],
  },
  '3-months': {
    name: 'Scale',
    meta: '90-day posting window',
    subtitle: 'For recurring openings or longer recruitment pushes.',
    features: [
      'Extend reach for recurring roles',
      'Keep the same listing live for 90 days',
      'Use applicant screening tools',
      'Save drafts and reopen later',
    ],
  },
  '6-months': {
    name: 'Enterprise',
    meta: '180-day posting window',
    subtitle: 'For long-running searches and future-role visibility.',
    features: [
      'Build visibility for hard-to-fill roles',
      'Keep hiring open for 180 days',
      'Support longer applicant review cycles',
      'Save drafts and reopen later',
    ],
  },
};

export const USER_PRICING_PAGE_META: PricingPageMeta = {
  title: 'KapIT Pricing for IT Professionals',
  description: 'Compare KapIT pricing for free and premium applicant tools built for Filipino IT job seekers.',
  keywords: 'KapIT pricing, developer premium plan, IT job seeker pricing, applicant tools',
};

export const COMPANY_PRICING_PAGE_META: PricingPageMeta = {
  title: 'KapIT Pricing for Employers',
  description: 'Compare KapIT company job post plans for focused Filipino IT hiring from 1 week to 6 months.',
  keywords: 'KapIT employer pricing, job posting plans, hiring plans, IT hiring platform',
};

export const PRICING_PAGE_META = USER_PRICING_PAGE_META;

export function buildCompanyPlans(): BillingPlan[] {
  return JOB_POST_PLANS.map((plan) => {
    const copy = COMPANY_PLAN_COPY[plan.id] || {};

    return {
      id: `company-${plan.id}`,
      name: copy.name || plan.label,
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
