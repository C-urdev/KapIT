'use client';

import Link from './shared/Link';
import { useMemo, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import Footer from '@sharedComponents/branding/Footer';
import SiteTopNav from '@sharedComponents/navigation/SiteTopNav';
import { JOB_POST_PLANS, PLAN_FEATURES } from '../modules/company/features/companyPaymentCatalog';

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

function buildCompanyPlans() {
  return JOB_POST_PLANS.map((plan) => ({
    id: `company-${plan.id}`,
    name: plan.label,
    price: Number(plan.price || 0),
    priceLabel: `PHP ${Number(plan.price || 0).toLocaleString()}`,
    meta: `${plan.durationLabel} job post visibility`,
    cta: 'Choose Plan',
    href: '/auth/register?type=company',
    popular: Boolean(plan.highlighted),
    subtitle: plan.description,
    features: PLAN_FEATURES,
  }));
}

export default function PricingPageClient() {
  const [audience, setAudience] = useState('company');
  const companyBillingPlans = useMemo(() => buildCompanyPlans(), []);
  const plans = audience === 'user' ? USER_BILLING_PLANS : companyBillingPlans;
  const audienceHint =
    audience === 'user'
      ? 'Premium unlocks advanced applicant tools while Free keeps core access.'
      : 'Pay only for the posting duration you need, then scale as hiring demand grows.';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#f8f9f4] via-[#f2f4ee] to-[#ecefe7] dark:from-[#121416] dark:via-[#1a1d20] dark:to-[#22272b] text-[#102a1b] dark:text-white">
      <SiteTopNav />

      <main className="flex-1">
        <section className="relative mx-auto w-full max-w-[1240px] px-4 pb-20 pt-14 sm:px-6 lg:px-8">
          <div className="pointer-events-none absolute inset-0 -z-10 opacity-40 [background-image:linear-gradient(to_right,rgba(58,90,64,0.12)_1px,transparent_1px)] [background-size:72px_100%]" />

          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mt-4 text-5xl font-bold leading-tight sm:text-6xl">Predictable pricing, scalable plans</h1>
            <p className="mt-5 text-lg text-[#344e41] dark:text-[#d0d7dd]">Choose plans built for applicants and hiring teams.</p>

            <div className="mt-10 flex flex-col items-center gap-4">
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

              <p className="inline-flex max-w-[600px] items-center justify-center gap-2 rounded-full border border-[#d0dbc0] dark:border-[#444d57] bg-white/90 dark:bg-[#1f2328] px-4 py-2 text-sm font-medium text-[#344e41] dark:text-[#d0d7dd]">
                <Sparkles className="h-4 w-4 shrink-0 text-[#f59e0b]" />
                <span>{audienceHint}</span>
              </p>
            </div>
          </div>

          <div className={`mt-14 grid gap-5 ${plans.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-4'}`}>
            {plans.map((plan) => (
              <article
                key={plan.id}
                className={`group relative flex h-full min-h-[530px] flex-col overflow-hidden rounded-3xl border p-6 shadow-[0_18px_44px_rgba(16,42,27,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_rgba(16,42,27,0.14)] ${
                  plan.popular
                    ? 'border-[#3a5a40] bg-[linear-gradient(180deg,#ffffff_0%,#f2f7ed_100%)] dark:border-[#6f9b74] dark:bg-[linear-gradient(180deg,#1f2a23_0%,#1a1d20_100%)]'
                    : 'border-[#c7d2b6] bg-white/95 dark:border-[#444d57] dark:bg-[#1f2328]'
                }`}
              >
                {plan.popular ? (
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#3a5a40] via-[#588157] to-[#3a5a40] dark:from-[#6f9b74] dark:via-[#82ad86] dark:to-[#6f9b74]" />
                ) : null}

                <div className="mb-4 flex min-h-[28px] items-center">
                  {plan.popular ? (
                    <span className="inline-flex w-fit rounded-full bg-[#102a1b] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                      Most Popular
                    </span>
                  ) : (
                    <span className="inline-flex text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7f65] dark:text-[#9aa6b2]">
                      {audience === 'user' ? 'Plan' : 'Job Post Plan'}
                    </span>
                  )}
                </div>

                <h2 className="text-[2rem] font-semibold leading-tight">{plan.name}</h2>
                <div className="mt-6 text-5xl font-bold leading-none">{plan.priceLabel}</div>
                <p className="mt-2 text-sm text-[#4b6350] dark:text-[#9ca3af]">{plan.meta}</p>
                {plan.subtitle ? <p className="mt-2 text-sm text-[#4b6350] dark:text-[#9ca3af]">{plan.subtitle}</p> : null}

                <Link
                  href={plan.href}
                  className={`mt-6 inline-flex justify-center rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                    plan.popular
                      ? 'border-[#102a1b] bg-[#102a1b] text-white hover:bg-[#193826]'
                      : 'border-[#b7c4a1] dark:border-[#4b5563] bg-white dark:bg-[#232931] text-[#102a1b] dark:text-white hover:bg-[#edf2e4] dark:hover:bg-[#2a3139]'
                  }`}
                >
                  {plan.cta}
                </Link>

                <div className="mt-6 h-px bg-gradient-to-r from-transparent via-[#d2dcc4] to-transparent dark:via-[#3b4450]" />

                <ul className="mt-6 space-y-3 text-sm">
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

          <div className="mt-8 rounded-2xl border border-[#cfdbc0] dark:border-[#3b4450] bg-white/70 dark:bg-[#1b2027] px-4 py-3 text-center text-sm text-[#415747] dark:text-[#b4bec9]">
            Need a custom setup for high-volume hiring? Use the Enterprise flow through Company onboarding for tailored limits and support.
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
