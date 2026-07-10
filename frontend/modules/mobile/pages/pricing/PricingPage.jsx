import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Check } from 'lucide-react';
import Link from '../../../../components/shared/Link';
import Footer from '../../../shared/components/branding/Footer';
import PublicMobileNav from '../../components/navigation/PublicMobileNav';
import { buildCompanyPlans, PRICING_PAGE_META, USER_BILLING_PLANS } from '../../../shared/data/publicPricing';
import { SEO_SITE_NAME, toAbsoluteUrl } from '../../../../lib/seo';

export default function MobilePricingPage() {
  const [audience, setAudience] = useState('company');
  const companyPlans = useMemo(() => buildCompanyPlans(), []);
  const plans = audience === 'user' ? USER_BILLING_PLANS : companyPlans;
  const pageUrl = toAbsoluteUrl('/pricing');

  return (
    <div className="min-h-screen bg-[#f4f7f0] text-[#102a1b] dark:bg-[#0f1416] dark:text-white">
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

      <PublicMobileNav />

      <main className="pb-20 pt-28">
        <section className="px-6 pb-2 pt-10 text-center flex flex-col items-center">
          <h1 className="text-[3.5rem] font-semibold leading-none tracking-tighter text-[#102a1b] dark:text-white">
            Pricing
          </h1>
          <h2 className="mt-5 max-w-sm text-[15px] leading-relaxed text-[#4f6858] dark:text-[#a5b4ac]">
            KapIT offers the exact same premium IT job seeking and talent sourcing tools as leading platforms but at <strong className="font-semibold text-[#102a1b] dark:text-[#d4ddd7]">50-60% less cost</strong>. Honest, transparent, and built to scale.
          </h2>
        </section>

        <section className="mt-4 px-6">
          <div className="inline-flex w-full rounded-full border border-[#d1dacf] bg-[#eef3e9] p-1.5 dark:border-white/10 dark:bg-white/5">
            {['company', 'user'].map((option) => {
              const active = audience === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setAudience(option)}
                  className={`flex-1 rounded-full px-4 py-3 text-[15px] font-semibold capitalize transition-all ${
                    active
                      ? 'bg-[#163828] text-white shadow-sm dark:bg-[#95c09b] dark:text-[#102115]'
                      : 'text-[#345542] dark:text-[#c7d0cb]'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-6 space-y-4 px-4">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className={`rounded-[1.8rem] border p-5 ${
                plan.popular
                  ? 'border-[#b7c8b5] bg-[#eff4eb] shadow-[0_18px_42px_rgba(28,55,40,0.1)] dark:border-[#3f5543] dark:bg-[#1a231f]'
                  : 'border-[#d5ded1] bg-[#fbfcf8] dark:border-white/10 dark:bg-[#171d20]'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5d7563] dark:text-[#9fb1a4]">
                    {audience === 'user' ? 'Applicant plan' : 'Company plan'}
                  </p>
                  <h2 className="mt-3 text-[1.8rem] font-semibold tracking-[-0.05em]">{plan.name}</h2>
                </div>
                {plan.popular ? (
                  <span className="rounded-full bg-[#163828] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white dark:bg-[#95c09b] dark:text-[#102115]">
                    Popular
                  </span>
                ) : null}
              </div>

              <p className="mt-5 text-4xl font-semibold tracking-[-0.06em] tabular-nums">{plan.priceLabel}</p>
              <p className="mt-2 text-sm font-medium text-[#4f6858] dark:text-[#b7c3bc]">{plan.meta}</p>
              {plan.subtitle ? <p className="mt-3 max-w-[28ch] text-sm leading-6 text-[#4f6858] dark:text-[#b7c3bc]">{plan.subtitle}</p> : null}

              <ul className="mt-5 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm leading-6 text-[#274534] dark:text-[#d5ddd7]">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-[#4f7d58]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`mt-6 inline-flex min-h-[48px] w-full items-center justify-between rounded-full px-5 text-sm font-semibold ${
                  plan.popular
                    ? 'bg-[#163828] text-white dark:bg-[#95c09b] dark:text-[#102115]'
                    : 'border border-[#cad6c6] text-[#173225] dark:border-white/10 dark:text-white'
                }`}
              >
                <span>{plan.cta}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
}
