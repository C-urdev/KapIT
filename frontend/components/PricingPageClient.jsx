'use client';

import Link from './shared/Link';
import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Check, Sparkles } from 'lucide-react';
import Footer from '@sharedComponents/branding/Footer';
import SiteTopNav from '@sharedComponents/navigation/SiteTopNav';
import { JOB_POST_PLANS, PLAN_FEATURES } from '../modules/company/features/companyPaymentCatalog';
import { SEO_SITE_NAME, toAbsoluteUrl } from '../lib/seo';

const USER_BILLING_PLANS = [
  {
    id: 'user-free',
    name: 'Free',
    price: 0,
    priceLabel: 'PHP 0',
    meta: 'per month',
    cta: 'Get Started',
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
    cta: 'Upgrade to Premium',
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

function buildCompanyPlans() {
  return JOB_POST_PLANS.map((plan) => {
    const copy = COMPANY_PLAN_COPY[plan.id] || {};

    return {
      id: `company-${plan.id}`,
      name: plan.label,
      price: Number(plan.price || 0),
      priceLabel: `PHP ${Number(plan.price || 0).toLocaleString()}`,
      meta: copy.meta || `${plan.durationLabel} job post visibility`,
      cta: 'Choose Plan',
      href: '/auth/register?type=company',
      popular: Boolean(plan.highlighted),
      subtitle: copy.subtitle || plan.description,
      features: copy.features || PLAN_FEATURES,
    };
  });
}

export default function PricingPageClient() {
  const [audience, setAudience] = useState('company');
  const companyBillingPlans = useMemo(() => buildCompanyPlans(), []);
  const plans = audience === 'user' ? USER_BILLING_PLANS : companyBillingPlans;
  const audienceHint = audience === 'user'
    ? 'Premium unlocks advanced applicant tools while Free keeps core access.'
    : '';
  const pageTitle = 'KapIT Pricing for Job Seekers and Hiring Teams';
  const pageDescription = 'Compare KapIT pricing for premium applicant tools and company job post plans from 1 week to 6 months.';
  const pageUrl = toAbsoluteUrl('/pricing');

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#f8f9f4] via-[#f2f4ee] to-[#ecefe7] dark:from-[#121416] dark:via-[#1a1d20] dark:to-[#22272b] text-[#102a1b] dark:text-white">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta
          name="keywords"
          content="KapIT pricing, job posting plans, hiring plans, developer premium plan, IT hiring platform"
        />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SEO_SITE_NAME} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={pageUrl} />
      </Helmet>

      <SiteTopNav />

      <main className="flex-1">
        <section className="relative mx-auto w-full max-w-[1240px] px-4 pb-24 pt-28 sm:px-6 sm:pt-32 lg:px-8 lg:pt-36">
          <div className="pointer-events-none absolute inset-0 -z-10 opacity-40 [background-image:linear-gradient(to_right,rgba(58,90,64,0.12)_1px,transparent_1px)] [background-size:72px_100%]" />

          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mx-auto max-w-[12ch] text-5xl font-bold leading-[0.98] tracking-[-0.04em] sm:text-6xl">
              Predictable pricing, scalable plans
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#344e41] dark:text-[#d0d7dd]">
              Choose plans built for applicants and hiring teams.
            </p>

            <div className="mt-10 flex flex-col items-center gap-5">
              <div className="inline-flex rounded-xl border border-[#b7c4a1] dark:border-[#444d57] bg-white dark:bg-[#1f2328] p-1">
                {['user', 'company'].map((option) => {
                  const active = audience === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setAudience(option)}
                      className={`min-w-[130px] rounded-lg px-5 py-2.5 text-sm font-semibold capitalize transition-colors ${
                        active
                          ? 'bg-[#3a5a40] text-white dark:bg-[#6f9b74] dark:text-[#121416]'
                          : 'text-[#3a5a40] dark:text-[#d0d7dd] hover:bg-[#edf2e4] dark:hover:bg-[#2a3139]'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              {audienceHint ? (
                <p className="inline-flex max-w-[600px] items-center justify-center gap-2 rounded-full border border-[#d0dbc0] dark:border-[#444d57] bg-white/90 dark:bg-[#1f2328] px-4 py-2 text-sm font-medium text-[#344e41] dark:text-[#d0d7dd]">
                  <Sparkles className="h-4 w-4 shrink-0 text-[#f59e0b]" />
                  <span>{audienceHint}</span>
                </p>
              ) : null}
            </div>
          </div>

          <div className={`mt-16 grid gap-6 ${plans.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-4'}`}>
            {plans.map((plan) => (
              <article
                key={plan.id}
                className={`group relative flex h-full min-h-[560px] flex-col overflow-hidden rounded-[10px] border p-7 shadow-[0_18px_36px_rgba(16,42,27,0.045)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_42px_rgba(16,42,27,0.08)] sm:p-8 ${
                  plan.popular
                    ? 'border-[#c8d3bf] bg-[#f4f7ef] dark:border-[#53615a] dark:bg-[#1d2125]'
                    : 'border-[#d8ded0] bg-[#fbfcf8] dark:border-[#444d57] dark:bg-[#1f2328]'
                }`}
              >
                {plan.popular ? (
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-[#6b856f] dark:bg-[#7f9a82]" />
                ) : null}

                <div className="mb-5 flex min-h-[28px] items-center">
                  {plan.popular ? (
                    <span className="inline-flex w-fit rounded-[999px] bg-[#102a1b] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white dark:bg-[#dce5dd] dark:text-[#132018]">
                      Most Popular
                    </span>
                  ) : (
                    <span className="inline-flex text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7f65] dark:text-[#9aa6b2]">
                      {audience === 'user' ? 'Plan' : 'Job Post Plan'}
                    </span>
                  )}
                </div>

                <div className="min-h-[188px]">
                  <h2 className="text-[2rem] font-semibold leading-tight">{plan.name}</h2>
                  <div className="mt-6 text-5xl font-bold leading-none tabular-nums">{plan.priceLabel}</div>
                  <p className="mt-3 text-sm font-medium text-[#4b6350] dark:text-[#9ca3af]">{plan.meta}</p>
                  {plan.subtitle ? (
                    <p className="mt-3 max-w-[24ch] text-sm leading-6 text-[#4b6350] dark:text-[#9ca3af]">
                      {plan.subtitle}
                    </p>
                  ) : null}
                </div>

                <Link
                  href={plan.href}
                  className={`mt-8 inline-flex min-h-[44px] justify-center rounded-full border px-5 py-2 text-sm font-semibold tracking-[0.01em] transition-all duration-300 ${
                    plan.popular
                      ? 'border-[#102a1b] bg-[#102a1b] text-white shadow-[0_10px_22px_rgba(16,42,27,0.14)] hover:bg-[#193826] hover:border-[#193826]'
                      : 'border-[#c6d0bc] dark:border-[#4b5563] bg-[#fffef9] dark:bg-[#232931] text-[#102a1b] dark:text-white hover:border-[#a7b59a] hover:bg-[#f7f8f2] dark:hover:bg-[#2a3139]'
                  }`}
                >
                  {plan.cta}
                </Link>

                <div className="mt-7 h-px bg-gradient-to-r from-transparent via-[#dde3d3] to-transparent dark:via-[#3b4450]" />

                <ul className="mt-7 space-y-3 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-[#1f3a2a] dark:text-[#e5e7eb]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#588157]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-[#cfdbc0] dark:border-[#3b4450] bg-white/70 dark:bg-[#1b2027] px-4 py-3 text-center text-sm text-[#415747] dark:text-[#b4bec9]">
            Need a custom setup for high-volume hiring? Use the Enterprise flow through Company onboarding for tailored limits and support.
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
