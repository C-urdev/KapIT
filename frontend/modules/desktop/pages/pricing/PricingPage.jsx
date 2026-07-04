import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Check } from 'lucide-react';
import Link from '../../../../components/shared/Link';
import Footer from '../../../shared/components/branding/Footer';
import PublicDesktopNav from '../../components/navigation/PublicDesktopNav';
import { buildCompanyPlans, PRICING_PAGE_META, USER_BILLING_PLANS } from '../../../shared/data/publicPricing';
import { SEO_SITE_NAME, toAbsoluteUrl } from '../../../../lib/seo';

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
        <section className="mx-auto max-w-[1320px] px-6">
          <div className="flex flex-col items-center">
            <h1 className="text-[2.6rem] font-semibold tracking-[-0.05em] text-[#173225] dark:text-white">Pricing</h1>
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
