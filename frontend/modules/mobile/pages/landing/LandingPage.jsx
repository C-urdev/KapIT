import React from 'react';
import { ArrowRight, Check, Sparkles, WandSparkles } from 'lucide-react';
import Link from '../../../../components/shared/Link';
import Footer from '../../../shared/components/branding/Footer';
import { CATEGORIES } from '../../../shared/pages/landing/landingData';
import PublicMobileNav from '../../components/navigation/PublicMobileNav';

const MOBILE_FLOW = [
  'Create a clearer applicant profile',
  'Compare focused plans and onboarding paths',
  'Move from discovery to action without a crowded UI',
];

export default function MobileLandingPage({ onLogoClick, onOpenAccountChoice, onJoinDeveloperClick, onSignIn }) {
  return (
    <div className="min-h-screen bg-[#f4f7f0] text-[#102a1b] dark:bg-[#0f1416] dark:text-white">
      <PublicMobileNav onLogoClick={onLogoClick} onGetStarted={onOpenAccountChoice} onJoinDeveloper={onJoinDeveloperClick} onSignIn={onSignIn} />

      <main className="overflow-hidden pb-20 pt-28">
        <section className="px-4">
          <div className="overflow-hidden rounded-[2.2rem] bg-[#163828] px-5 pb-6 pt-7 text-white shadow-[0_24px_60px_rgba(16,42,27,0.22)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d7e5db]">
              <Sparkles className="h-3.5 w-3.5" />
              Mobile landing
            </div>
            <h1 className="mt-6 max-w-[8ch] text-[3.15rem] font-semibold leading-[0.92] tracking-[-0.07em]">
              A mobile-first front door for KapIT.
            </h1>
            <p className="mt-4 max-w-[28ch] text-sm leading-7 text-[#d4e0d7]">
              This mobile page now has its own visual system, section flow, and navigation shell, separate from desktop.
            </p>

            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={onOpenAccountChoice}
                className="inline-flex min-h-[50px] items-center justify-between rounded-full bg-white px-5 text-sm font-semibold text-[#163828]"
              >
                <span>Get started</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onJoinDeveloperClick}
                className="inline-flex min-h-[50px] items-center justify-center rounded-full border border-white/14 px-5 text-sm font-semibold text-white"
              >
                Join as developer
              </button>
            </div>
          </div>
        </section>

        <section className="mt-5 px-4">
          <div className="rounded-[1.9rem] border border-[#d4ded1] bg-[#fbfcf8] p-4 shadow-[0_16px_40px_rgba(27,53,38,0.08)] dark:border-white/10 dark:bg-[#171d20]">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#eef3e9] p-3 text-[#163828] dark:bg-white/8 dark:text-white">
                <WandSparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5c7261] dark:text-[#98a89d]">Why this split helps</p>
                <h2 className="mt-2 text-[1.7rem] font-semibold tracking-[-0.05em]">Mobile is no longer inheriting the desktop story.</h2>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {MOBILE_FLOW.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-[1.15rem] bg-[#eef3e9] px-4 py-3 dark:bg-white/5">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-[#4f7d58]" />
                  <span className="text-sm leading-6 text-[#244231] dark:text-[#d5ddd7]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-5 px-4">
          <div className="grid gap-3">
            {CATEGORIES.map((category, index) => {
              const Icon = category.icon;
              return (
                <article
                  key={category.title}
                  className={`rounded-[1.8rem] border p-5 ${
                    index % 2 === 0
                      ? 'border-[#d5ded1] bg-[#fbfcf8] dark:border-white/10 dark:bg-[#171d20]'
                      : 'border-[#c8d6c7] bg-[#e8efe2] dark:border-white/10 dark:bg-[#1b2225]'
                  }`}
                >
                  <Icon className="h-5 w-5 text-[#4f7d58]" />
                  <h3 className="mt-4 text-[1.45rem] font-semibold tracking-[-0.04em]">{category.title}</h3>
                  <p className="mt-3 max-w-[24ch] text-sm leading-6 text-[#4f6858] dark:text-[#bcc7c0]">
                    Separate mobile sections make it easier to tune hierarchy, spacing, and calls to action for quick thumb-driven browsing.
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-5 px-4">
          <div className="rounded-[2rem] bg-[#dfe9da] px-5 py-6 dark:bg-[#161d1f]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5b7260] dark:text-[#97a89d]">Next move</p>
            <h2 className="mt-3 max-w-[12ch] text-[2rem] font-semibold leading-[0.96] tracking-[-0.05em]">
              Split pricing and nav the same way so redesign stays local.
            </h2>
            <div className="mt-5 grid gap-3">
              <Link href="/pricing" className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#163828] px-5 text-sm font-semibold text-white dark:bg-[#95c09b] dark:text-[#102115]">
                View pricing
              </Link>
              <button
                type="button"
                onClick={onSignIn}
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-[#bbcab7] px-5 text-sm font-semibold text-[#163828] dark:border-white/10 dark:text-white"
              >
                Sign in
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
