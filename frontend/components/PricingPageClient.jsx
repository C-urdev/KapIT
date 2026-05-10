'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Moon, Sparkles, Sun, ChevronDown, Building2, UserRound, BriefcaseBusiness, FileText, LifeBuoy, UsersRound, ShieldCheck, CircleHelp } from 'lucide-react';
import Footer from '@sharedComponents/branding/Footer';
import KapITLogo from '@sharedComponents/branding/KapITLogo';
import { useTheme } from '@sharedContext/ThemeContext';
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

const TOP_NAV_LINKS = [
  { label: 'Solutions', hasDropdown: true, footerItem: 'Find talent' },
  { label: 'Resources', hasDropdown: true, footerItem: 'Help Center' },
  { label: 'Pricing', hasDropdown: false, href: '/pricing', footerItem: 'Pricing' },
];

const TOP_NAV_DROPDOWNS = {
  Solutions: [
    {
      heading: 'DEVELOPERS',
      items: [
        {
          title: 'Create profile',
          description: 'Build your profile to get matched with opportunities.',
          footerItem: 'Create profile',
          icon: UserRound,
        },
        {
          title: 'Portfolios',
          description: 'Showcase your projects, skills, and achievements.',
          footerItem: 'Portfolios',
          icon: FileText,
        },
        {
          title: 'Projects',
          description: 'Join projects and collaborate with hiring companies.',
          footerItem: 'Projects',
          icon: BriefcaseBusiness,
        },
      ],
    },
    {
      heading: 'COMPANIES',
      items: [
        {
          title: 'Find talent',
          description: 'Search and connect with the right IT candidates.',
          footerItem: 'Find talent',
          icon: Building2,
        },
        {
          title: 'Post projects',
          description: 'Publish job posts and receive qualified applicants.',
          footerItem: 'Post projects',
          icon: BriefcaseBusiness,
        },
      ],
    },
  ],
  Resources: [
    {
      heading: 'QUICK LINKS',
      items: [
        { title: 'Help Center', description: 'Find answers and platform guides', footerItem: 'Help Center', icon: LifeBuoy },
        { title: 'Community', description: 'Product updates and collaboration', footerItem: 'Community', icon: UsersRound },
        { title: 'Safety', description: 'Security, trust, and best practices', footerItem: 'Safety', icon: ShieldCheck },
        { title: 'FAQ', description: 'Latest answers to common questions', footerItem: 'FAQ', icon: CircleHelp },
      ],
    },
  ],
};

function HeaderNav() {
  const { theme, toggleTheme } = useTheme();
  const [openHeaderDropdown, setOpenHeaderDropdown] = useState(null);
  const headerDropdownCloseTimerRef = useRef(null);
  const navMenuRef = useRef(null);

  const handleTopNavClick = (footerItem) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('kapit:footer-info-open', { detail: { item: footerItem } }));
  };

  const handleHeaderDropdownOpen = (label) => {
    if (headerDropdownCloseTimerRef.current) {
      window.clearTimeout(headerDropdownCloseTimerRef.current);
      headerDropdownCloseTimerRef.current = null;
    }
    setOpenHeaderDropdown(label);
  };

  const handleHeaderDropdownClose = () => {
    if (headerDropdownCloseTimerRef.current) {
      window.clearTimeout(headerDropdownCloseTimerRef.current);
    }
    headerDropdownCloseTimerRef.current = window.setTimeout(() => {
      setOpenHeaderDropdown(null);
      headerDropdownCloseTimerRef.current = null;
    }, 120);
  };

  const handleHeaderTopLinkClick = (link) => {
    if (link.hasDropdown) {
      setOpenHeaderDropdown((current) => (current === link.label ? null : link.label));
      return;
    }
    if (link.href) {
      window.location.href = link.href;
      return;
    }
    handleTopNavClick(link.footerItem);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleOutsidePointerDown = (event) => {
      if (!openHeaderDropdown) return;
      if (navMenuRef.current?.contains(event.target)) return;
      setOpenHeaderDropdown(null);
    };

    window.addEventListener('pointerdown', handleOutsidePointerDown);
    return () => window.removeEventListener('pointerdown', handleOutsidePointerDown);
  }, [openHeaderDropdown]);

  useEffect(() => {
    return () => {
      if (headerDropdownCloseTimerRef.current) {
        window.clearTimeout(headerDropdownCloseTimerRef.current);
      }
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 overflow-visible border-b border-black/5 bg-white/85 dark:border-[#2f353c] dark:bg-[#121416]/90 backdrop-blur-xl">
      <div className="relative w-full max-w-[min(100%,1800px)] mx-auto px-3 sm:px-5 lg:px-6 xl:px-7 2xl:px-9 py-4 flex flex-wrap lg:flex-nowrap items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-3" aria-label="Go to home">
          <KapITLogo className="w-10 h-10 rounded-lg object-contain bg-white" />
          <h1 className="text-xl sm:text-2xl font-bold text-[#3a5a40] dark:text-white">KapIT</h1>
        </Link>

        <nav
          ref={navMenuRef}
          className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-8 xl:gap-10 overflow-visible"
          onMouseLeave={handleHeaderDropdownClose}
          onMouseEnter={() => {
            if (headerDropdownCloseTimerRef.current) {
              window.clearTimeout(headerDropdownCloseTimerRef.current);
              headerDropdownCloseTimerRef.current = null;
            }
          }}
        >
          {TOP_NAV_LINKS.map((link) => (
            <div key={link.label} className="relative" onMouseEnter={() => link.hasDropdown && handleHeaderDropdownOpen(link.label)}>
              <button
                type="button"
                onClick={() => handleHeaderTopLinkClick(link)}
                className="inline-flex items-center gap-1 text-[1rem] font-semibold text-[#3a5a40] dark:text-white transition-colors"
                style={{ fontFamily: 'var(--font-desktop)' }}
                aria-expanded={link.hasDropdown ? openHeaderDropdown === link.label : undefined}
              >
                <span>{link.label}</span>
                {link.hasDropdown ? (
                  <ChevronDown
                    className={`h-4 w-4 opacity-75 transition-transform ${openHeaderDropdown === link.label ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            </div>
          ))}

          {openHeaderDropdown && TOP_NAV_DROPDOWNS[openHeaderDropdown] ? (
            <div
              className="pointer-events-auto absolute left-1/2 top-full z-50 mt-6 -translate-x-1/2 overflow-hidden rounded-2xl border border-[#d7d7d7] bg-white shadow-[0_14px_32px_rgba(0,0,0,0.12)] dark:border-[#444d57] dark:bg-[#1a1d20]"
              style={{ width: '860px', maxWidth: '92vw' }}
              onMouseEnter={() => {
                if (headerDropdownCloseTimerRef.current) {
                  window.clearTimeout(headerDropdownCloseTimerRef.current);
                  headerDropdownCloseTimerRef.current = null;
                }
              }}
              onMouseLeave={handleHeaderDropdownClose}
            >
              <div
                className="grid"
                style={{
                  gridTemplateColumns: openHeaderDropdown === 'Solutions' ? '1fr 1fr' : '1.08fr 0.92fr',
                }}
              >
                <div className="p-5">
                  <p className="text-xs font-medium tracking-[0.22em] text-[#6b7280] dark:text-[#94a3b8]">
                    {TOP_NAV_DROPDOWNS[openHeaderDropdown][0].heading}
                  </p>
                  <div className="mt-4 space-y-1.5">
                    {TOP_NAV_DROPDOWNS[openHeaderDropdown][0].items.map((item) => {
                      const ItemIcon = item.icon;

                      return (
                        <button
                          key={item.title}
                          type="button"
                          onClick={() => {
                            handleTopNavClick(item.footerItem);
                            handleHeaderDropdownClose();
                          }}
                          className="group flex w-full items-start gap-3 rounded-xl px-1.5 py-2.5 text-left hover:bg-white/80 dark:hover:bg-[#22272b]"
                        >
                          <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d0d4d9] bg-[#f3f4f6] text-[#6b7280] dark:border-[#4b5563] dark:bg-[#232931] dark:text-[#cbd5e1]">
                            <ItemIcon className="h-5 w-5" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[1.02rem] font-medium text-[#1f2937] dark:text-white">{item.title}</span>
                            <span className="mt-0.5 block text-[0.98rem] text-[#4b5563] dark:text-[#cbd5e1]">
                              {item.description}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="relative p-5">
                  {openHeaderDropdown === 'Solutions' ? (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-0 top-4 bottom-4 w-px bg-[#d9d9d9] dark:bg-[#3b4450]"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-0 top-0 bottom-0 w-px bg-[#dfdfdf] dark:bg-[#3b4450]"
                    />
                  )}
                  {openHeaderDropdown === 'Solutions' ? (
                    <>
                      <p className="text-xs font-medium tracking-[0.22em] text-[#6b7280] dark:text-[#94a3b8]">
                        {TOP_NAV_DROPDOWNS.Solutions[1].heading}
                      </p>
                      <div className="mt-4 space-y-1.5">
                        {TOP_NAV_DROPDOWNS.Solutions[1].items.map((item) => {
                          const ItemIcon = item.icon;
                          return (
                            <button
                              key={item.title}
                              type="button"
                              onClick={() => {
                                handleTopNavClick(item.footerItem);
                                handleHeaderDropdownClose();
                              }}
                              className="group flex w-full items-start gap-3 rounded-xl px-1.5 py-2.5 text-left hover:bg-white/80 dark:hover:bg-[#22272b]"
                            >
                              <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d0d4d9] bg-[#f3f4f6] text-[#6b7280] dark:border-[#4b5563] dark:bg-[#232931] dark:text-[#cbd5e1]">
                                <ItemIcon className="h-5 w-5" />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-[1.02rem] font-medium text-[#1f2937] dark:text-white">{item.title}</span>
                                <span className="mt-0.5 block text-[0.98rem] text-[#4b5563] dark:text-[#cbd5e1]">
                                  {item.description}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-medium tracking-[0.22em] text-[#6b7280] dark:text-[#94a3b8]">
                        RECENT UPDATE
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          handleTopNavClick('Help Center');
                          handleHeaderDropdownClose();
                        }}
                        className="mt-4 block w-full rounded-xl border border-[#d0d4d9] bg-white p-2 text-left hover:bg-[#fafafa] dark:border-[#4b5563] dark:bg-[#232931] dark:hover:bg-[#28303a]"
                      >
                        <div className="h-36 rounded-lg bg-gradient-to-r from-[#f59e0b] via-[#f97316] to-[#ec4899] p-2">
                          <div className="h-full rounded-md bg-white/90" />
                        </div>
                        <p className="mt-3 text-lg font-medium text-[#111827] dark:text-white">Introducing Help Desk</p>
                        <p className="mt-1 line-clamp-2 text-sm text-[#4b5563] dark:text-[#cbd5e1]">
                          Manage customer support workflows in one place with clearer handoffs and faster responses.
                        </p>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </nav>

        <div className="ml-auto lg:ml-0 flex items-center gap-2">
          <Link
            href="/auth/login"
            className="inline-flex px-3 sm:px-4 py-2 rounded-lg border border-[#a3b18a] dark:border-[#444d57] bg-white dark:bg-[#22272b] text-[#344e41] dark:text-white text-sm sm:text-base font-semibold hover:bg-[#f5f5f2] dark:hover:bg-[#353c44] transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base text-white font-semibold bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86] transition-colors"
          >
            Get Started
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-[#f5f5f2] dark:hover:bg-[#353c44] transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-5 h-5 text-[#344e41]" /> : <Sun className="w-5 h-5 text-white" />}
          </button>
        </div>
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[#b8ad94] to-transparent opacity-95 shadow-[0_1px_0_rgba(255,255,255,0.45)] dark:via-[#5b6672] dark:shadow-[0_1px_0_rgba(10,14,18,0.75)]"
        aria-hidden="true"
      />
    </header>
  );
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
      <HeaderNav />

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
