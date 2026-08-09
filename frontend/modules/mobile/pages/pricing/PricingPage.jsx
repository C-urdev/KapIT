import { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Check } from 'lucide-react';
import Link from '../../../../components/shared/Link';
import Footer from '../../../shared/components/branding/Footer';
import PublicMobileNav from '../../components/navigation/PublicMobileNav';
import EmployerMobileNav from '../../components/navigation/EmployerMobileNav';
import { buildCompanyPlans, COMPANY_PRICING_PAGE_META, USER_BILLING_PLANS, USER_PRICING_PAGE_META } from '../../../shared/data/publicPricing';
import { SEO_SITE_NAME, toAbsoluteUrl } from '../../../../lib/seo';

export default function MobilePricingPage({ audience = 'user', onCreateAccount, onSignIn }) {
  const isCompanyAudience = audience === 'company';
  const companyPlans = useMemo(() => buildCompanyPlans(), []);
  const plans = isCompanyAudience ? companyPlans : USER_BILLING_PLANS;
  const pageMeta = isCompanyAudience ? COMPANY_PRICING_PAGE_META : USER_PRICING_PAGE_META;
  const pageUrl = toAbsoluteUrl(isCompanyAudience ? '/for-employers/pricing' : '/pricing');

  return (
    <div className="min-h-screen bg-[#f4f7f0] text-[#102a1b] dark:bg-[#0f1416] dark:text-white">
      <Helmet>
        <title>{pageMeta.title}</title>
        <meta name="description" content={pageMeta.description} />
        <meta name="keywords" content={pageMeta.keywords} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SEO_SITE_NAME} />
        <meta property="og:title" content={pageMeta.title} />
        <meta property="og:description" content={pageMeta.description} />
        <meta property="og:url" content={pageUrl} />
      </Helmet>

      {isCompanyAudience ? <EmployerMobileNav onCreateAccount={onCreateAccount} onSignIn={onSignIn} /> : <PublicMobileNav />}

      <main className="pb-20 pt-28">
        <section className="px-6 pb-2 pt-10 text-center flex flex-col items-center">
          <h1 className="text-[3.5rem] font-semibold leading-none tracking-tighter text-[#102a1b] dark:text-white">
            {isCompanyAudience ? 'Employer pricing' : 'Pricing'}
          </h1>
          <h2 className="mt-5 max-w-sm text-[15px] leading-relaxed text-[#4f6858] dark:text-[#a5b4ac]">
            {isCompanyAudience
              ? 'Choose a posting window for the role, hiring cycle, or campaign your team needs right now.'
              : 'Compare Free and Premium tools for searching, applying, and keeping your IT job hunt organized.'}
          </h2>
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
                  <h2 className="text-[1.8rem] font-semibold tracking-[-0.05em]">{plan.name}</h2>
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
