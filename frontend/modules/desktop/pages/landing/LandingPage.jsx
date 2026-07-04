import React from 'react';
import { ArrowRight, CheckCircle2, Radar, Sparkles, Users2 } from 'lucide-react';
import Link from '../../../../components/shared/Link';
import Footer from '../../../shared/components/branding/Footer';
import { CATEGORIES } from '../../../shared/pages/landing/landingData';
import PublicDesktopNav from '../../components/navigation/PublicDesktopNav';

const DESKTOP_SIGNALS = [
  { label: 'Focused hiring', value: 'PH tech roles only' },
  { label: 'Signal over volume', value: 'Skills, proof, fit' },
  { label: 'Shorter handoff', value: 'From discovery to shortlist' },
];

const DESKTOP_STEPS = [
  {
    title: 'Profile depth over profile noise',
    copy: 'Applicants surface stack, role intent, and proof of work in a format companies can scan quickly.',
  },
  {
    title: 'Shortlist faster',
    copy: 'Teams get a clearer way to compare fit without digging through generic job-board clutter.',
  },
  {
    title: 'Move with less friction',
    copy: 'From plan selection to onboarding, the public site is split cleanly for redesign while the core actions stay intact.',
  },
];

export default function DesktopLandingPage({ onLogoClick, onOpenAccountChoice, onJoinDeveloperClick, onSignIn }) {
  return (
    <div className="min-h-screen bg-[#eef2ea] text-[#102a1b] dark:bg-[#101416] dark:text-white">
      <PublicDesktopNav onLogoClick={onLogoClick} onGetStarted={onOpenAccountChoice} onJoinDeveloper={onJoinDeveloperClick} onSignIn={onSignIn} />

      <main className="overflow-hidden pb-24 pt-36">
        <section className="mx-auto grid max-w-[1320px] grid-cols-[1.05fr_0.95fr] gap-8 px-6">
          <div className="relative overflow-hidden rounded-[2.8rem] bg-[#173225] px-10 pb-12 pt-12 text-white shadow-[0_30px_90px_rgba(16,42,27,0.28)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(165,213,173,0.28),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_26%)]" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#d6e3d9]">
                <Sparkles className="h-3.5 w-3.5" />
                Desktop landing
              </div>
              <h1 className="mt-8 max-w-[9ch] text-[5rem] font-semibold leading-[0.9] tracking-[-0.07em]">
                Hire and get hired without the marketplace noise.
              </h1>
              <p className="mt-6 max-w-[35rem] text-lg leading-8 text-[#d0ddd3]">
                KapIT keeps the public experience focused on Philippine tech hiring, with clearer signals for applicants and cleaner discovery paths for teams.
              </p>

              <div className="mt-10 flex items-center gap-4">
                <button
                  type="button"
                  onClick={onOpenAccountChoice}
                  className="inline-flex min-h-[52px] items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#173225] transition-transform duration-300 hover:-translate-y-0.5"
                >
                  <span>Start on KapIT</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={onJoinDeveloperClick}
                  className="inline-flex min-h-[52px] items-center rounded-full border border-white/14 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/8"
                >
                  Join as developer
                </button>
              </div>

              <div className="mt-12 grid grid-cols-3 gap-4">
                {DESKTOP_SIGNALS.map((signal) => (
                  <div key={signal.label} className="rounded-[1.4rem] border border-white/10 bg-white/8 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9fb4a6]">{signal.label}</p>
                    <p className="mt-3 text-lg font-semibold tracking-[-0.03em]">{signal.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-[2.4rem] border border-[#d7e0d4] bg-[#fbfcf8] p-7 shadow-[0_22px_54px_rgba(24,54,36,0.08)] dark:border-white/10 dark:bg-[#171d20]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5b7360] dark:text-[#97a79c]">What companies see</p>
                  <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.05em]">A calmer shortlist view</h2>
                </div>
                <div className="rounded-2xl bg-[#eef3e9] p-3 text-[#173225] dark:bg-white/8 dark:text-white">
                  <Radar className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-7 space-y-4">
                {['Role fit markers', 'Portfolio and project proof', 'Cleaner candidate filtering'].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-[1.2rem] bg-[#eef3e9] px-4 py-3 dark:bg-white/6">
                    <CheckCircle2 className="h-4 w-4 text-[#4f7d58]" />
                    <span className="text-sm font-medium text-[#244231] dark:text-[#d7dfd9]">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2.4rem] border border-[#d7e0d4] bg-[#fbfcf8] p-7 shadow-[0_22px_54px_rgba(24,54,36,0.08)] dark:border-white/10 dark:bg-[#171d20]">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#173225] p-3 text-white dark:bg-[#95c09b] dark:text-[#102115]">
                  <Users2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5b7360] dark:text-[#97a79c]">Categories</p>
                  <h2 className="mt-2 text-[1.9rem] font-semibold tracking-[-0.05em]">Built around actual IT tracks</h2>
                </div>
              </div>
              <div className="mt-7 grid grid-cols-2 gap-3">
                {CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  return (
                    <div key={category.title} className="rounded-[1.25rem] border border-[#dce5d8] bg-white px-4 py-4 dark:border-white/8 dark:bg-white/4">
                      <Icon className="h-5 w-5 text-[#4f7d58]" />
                      <p className="mt-4 text-sm font-semibold text-[#173225] dark:text-white">{category.title}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-[1320px] px-6">
          <div className="grid grid-cols-[0.72fr_1.28fr] gap-6">
            <div className="rounded-[2.4rem] border border-[#d7e0d4] bg-[#fbfcf8] p-8 dark:border-white/10 dark:bg-[#171d20]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5b7360] dark:text-[#97a79c]">Why split the code</p>
              <h2 className="mt-4 text-[2.2rem] font-semibold tracking-[-0.05em]">Desktop can now move without waiting for mobile.</h2>
              <p className="mt-4 max-w-[28ch] text-sm leading-7 text-[#4d6756] dark:text-[#bac4be]">
                This desktop landing page is no longer tied to the mobile section stack. You can redesign layout, sequencing, and surface treatments here without dragging mobile along.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {DESKTOP_STEPS.map((step, index) => (
                <article key={step.title} className="rounded-[2rem] border border-[#d7e0d4] bg-[#fbfcf8] p-7 dark:border-white/10 dark:bg-[#171d20]">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5b7360] dark:text-[#97a79c]">Step {index + 1}</p>
                  <h3 className="mt-4 text-[1.6rem] font-semibold tracking-[-0.04em]">{step.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[#4d6756] dark:text-[#bac4be]">{step.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-[1320px] px-6">
          <div className="rounded-[2.8rem] bg-[#dfe9da] px-10 py-10 dark:bg-[#161d1f]">
            <div className="grid items-end gap-6 lg:grid-cols-[1fr_auto]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5a6f60] dark:text-[#96a79d]">Ready to move</p>
                <h2 className="mt-4 max-w-[13ch] text-[3rem] font-semibold leading-[0.96] tracking-[-0.06em]">
                  Launch with one code path for desktop and another for mobile.
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onOpenAccountChoice}
                  className="inline-flex min-h-[52px] items-center rounded-full bg-[#173225] px-6 text-sm font-semibold text-white dark:bg-[#95c09b] dark:text-[#102115]"
                >
                  Create account
                </button>
                <Link href="/pricing" className="inline-flex min-h-[52px] items-center rounded-full border border-[#b9c8b6] px-6 text-sm font-semibold text-[#173225] dark:border-white/10 dark:text-white">
                  View pricing
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
