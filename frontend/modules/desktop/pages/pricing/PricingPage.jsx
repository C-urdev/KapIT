import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Check, Layers3, ShieldCheck, Sparkles, TimerReset, Zap } from 'lucide-react';
import Link from '../../../../components/shared/Link';
import Footer from '../../../shared/components/branding/Footer';
import PublicDesktopNav from '../../components/navigation/PublicDesktopNav';
import { buildCompanyPlans, PRICING_PAGE_META, USER_BILLING_PLANS } from '../../../shared/data/publicPricing';
import { SEO_SITE_NAME, toAbsoluteUrl } from '../../../../lib/seo';

const DESKTOP_NOTES = [
  { label: 'For applicants', value: 'Free + Premium', icon: Sparkles },
  { label: 'For teams', value: '1 week to 6 months', icon: TimerReset },
  { label: 'Activation', value: 'Live after checkout', icon: Zap },
];

export default function DesktopPricingPage() {
  const [audience, setAudience] = useState('company');
  const companyPlans = useMemo(() => buildCompanyPlans(), []);
  const plans = audience === 'user' ? USER_BILLING_PLANS : companyPlans;
  const pageUrl = toAbsoluteUrl('/pricing');

  return (
    <div className="min-h-screen bg-[#edf2ec] text-[#102a1b] dark:bg-[#101416] dark:text-white">
      <Helmet>
        <title>{PRICING_PAGE_META.title}</title>
        <meta name="description" content={PRICING_PAGE_META.description} />
        <meta name="keywords" content={PRICING_PAGE_META.keywords} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SEO_SITE_NAME} />
        <meta property="og:title" content={PRICING_PAGE_META.title} />
        <meta property="og:description" content={PRICING_PAGE_META.description} />
        <meta property="og:url" content={pageUrl} />
      </Helmet>

      <PublicDesktopNav />

      <main className="pb-24 pt-36">
        <section className="mx-auto grid max-w-[1320px] grid-cols-[1.05fr_0.95fr] gap-8 px-6">
          <div className="relative overflow-hidden rounded-[2.6rem] bg-[#163828] px-10 pb-10 pt-12 text-white shadow-[0_26px_80px_rgba(16,42,27,0.28)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,213,175,0.28),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_30%)]" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#dbe8dd]">
                <Layers3 className="h-3.5 w-3.5" />
                Pricing architecture
              </div>
              <h1 className="mt-8 max-w-[10ch] text-[4.6rem] font-semibold leading-[0.92] tracking-[-0.06em]">
                Different plans for applicants and hiring teams.
              </h1>
              <p className="mt-6 max-w-[34rem] text-lg leading-8 text-[#d1ddd4]">
                Keep the public pricing surface split by device, but keep your plan logic in one place. That gives you faster redesign cycles without drifting plan content.
              </p>

              <div className="mt-10 grid grid-cols-3 gap-4">
                {DESKTOP_NOTES.map((note) => {
                  const Icon = note.icon;
                  return (
                    <div key={note.label} className="rounded-[1.5rem] border border-white/10 bg-white/7 p-4">
                      <Icon className="h-4 w-4 text-[#a9d1ae]" />
                      <p className="mt-4 text-xs uppercase tracking-[0.2em] text-[#a8b8ab]">{note.label}</p>
                      <p className="mt-2 text-lg font-semibold tracking-[-0.03em]">{note.value}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-[2.4rem] border border-[#d3ddd0] bg-[#fafcf8] p-8 shadow-[0_20px_48px_rgba(24,54,36,0.08)] dark:border-white/10 dark:bg-[#171d20]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#56725f] dark:text-[#96a59a]">Audience</p>
              <div className="mt-5 inline-flex rounded-full border border-[#d0d9cd] bg-[#eef3e9] p-1 dark:border-white/10 dark:bg-white/5">
                {['company', 'user'].map((option) => {
                  const active = audience === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setAudience(option)}
                      className={`rounded-full px-5 py-2.5 text-sm font-semibold capitalize transition-colors ${
                        active
                          ? 'bg-[#163828] text-white dark:bg-[#95c09b] dark:text-[#102115]'
                          : 'text-[#345542] dark:text-[#c6cfca]'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 grid gap-4">
                {plans.slice(0, 2).map((plan) => (
                  <div
                    key={plan.id}
                    className={`rounded-[1.7rem] border p-5 ${
                      plan.popular
                        ? 'border-[#b7c7b5] bg-[#eef4ea] dark:border-[#3c5443] dark:bg-[#1d2521]'
                        : 'border-[#d7e0d4] bg-white dark:border-white/8 dark:bg-[#151b1e]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#587160] dark:text-[#9fb0a4]">{plan.meta}</p>
                        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">{plan.name}</h2>
                      </div>
                      <p className="text-3xl font-semibold tracking-[-0.05em]">{plan.priceLabel}</p>
                    </div>
                    {plan.subtitle ? <p className="mt-4 max-w-[28ch] text-sm leading-6 text-[#4f6858] dark:text-[#b8c3bd]">{plan.subtitle}</p> : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2.4rem] border border-[#d3ddd0] bg-[#fafcf8] p-8 shadow-[0_20px_48px_rgba(24,54,36,0.08)] dark:border-white/10 dark:bg-[#171d20]">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#56725f] dark:text-[#96a59a]">
                <ShieldCheck className="h-4 w-4" />
                Included across plans
              </div>
              <div className="mt-6 grid gap-3">
                {plans[0]?.features.slice(0, 4).map((feature) => (
                  <div key={feature} className="flex items-start gap-3 rounded-[1.25rem] bg-[#eef3e9] px-4 py-3 dark:bg-white/5">
                    <Check className="mt-0.5 h-4 w-4 text-[#4f7d58]" />
                    <span className="text-sm leading-6 text-[#244231] dark:text-[#d6ddd8]">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-[1320px] px-6">
          <div className={`grid gap-6 ${plans.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-4'}`}>
            {plans.map((plan) => (
              <article
                key={plan.id}
                className={`flex min-h-[560px] flex-col rounded-[2rem] border p-7 ${
                  plan.popular
                    ? 'border-[#afc3b2] bg-[#f0f5ed] shadow-[0_24px_64px_rgba(32,66,46,0.12)] dark:border-[#3f5543] dark:bg-[#1a231f]'
                    : 'border-[#d7e0d4] bg-[#fbfcf8] dark:border-white/8 dark:bg-[#171d20]'
                }`}
              >
                <div className="min-h-[180px]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#627a69] dark:text-[#9eb0a2]">
                      {audience === 'user' ? 'Applicant plan' : 'Company plan'}
                    </span>
                    {plan.popular ? (
                      <span className="rounded-full bg-[#163828] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white dark:bg-[#95c09b] dark:text-[#102115]">
                        Recommended
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-5 text-[2rem] font-semibold tracking-[-0.04em]">{plan.name}</h3>
                  <p className="mt-5 text-5xl font-semibold tracking-[-0.06em] tabular-nums">{plan.priceLabel}</p>
                  <p className="mt-3 text-sm font-medium text-[#4f6858] dark:text-[#b7c2bb]">{plan.meta}</p>
                  {plan.subtitle ? <p className="mt-4 max-w-[24ch] text-sm leading-6 text-[#4f6858] dark:text-[#b7c2bb]">{plan.subtitle}</p> : null}
                </div>

                <ul className="mt-7 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm leading-6 text-[#234031] dark:text-[#d5ddd7]">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-[#4f7d58]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`mt-auto inline-flex min-h-[48px] items-center justify-between rounded-full px-5 text-sm font-semibold ${
                    plan.popular
                      ? 'bg-[#163828] text-white dark:bg-[#95c09b] dark:text-[#102115]'
                      : 'border border-[#c8d4c5] text-[#173225] dark:border-white/10 dark:text-white'
                  }`}
                >
                  <span>{plan.cta}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
