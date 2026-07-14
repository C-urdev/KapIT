import React from 'react';
import {
  BellOff,
  BriefcaseBusiness,
  ClipboardList,
  Clock3,
  CopyX,
  FileSearch,
  Files,
  Flame,
  Globe,
  LayoutDashboard,
  MailWarning,
  PenSquare,
  RefreshCw,
  ScanSearch,
  Shield,
  Sparkles,
  SquareStack,
  TrendingUp,
  UserRoundSearch,
  WandSparkles,
} from 'lucide-react';

const PROBLEM_CHIPS = [
  { label: 'Hours applying, no replies?', icon: MailWarning },
  { label: 'Lost track of applications?', icon: SquareStack },
  { label: 'Copy-pasting cover letters?', icon: CopyX },
  { label: 'Rewriting resumes nonstop?', icon: PenSquare },
  { label: 'Manual spreadsheet tracking?', icon: ClipboardList },
  { label: 'Endless scrolling for jobs?', icon: BriefcaseBusiness },
  { label: 'Feeling burnt out?', icon: Flame },
];

const BENEFITS = [
  {
    title: 'Secure by Design',
    description: 'Your data and applications stay encrypted and protected.',
    icon: Shield,
  },
  {
    title: 'Real-Time Sync',
    description: 'Statuses update automatically, no spreadsheets needed.',
    icon: RefreshCw,
  },
  {
    title: 'Unified Dashboard',
    description: 'View every job, status, email, and document in one place.',
    icon: LayoutDashboard,
  },
  {
    title: 'AI Cover Letters',
    description: 'Personalized, role-specific cover letters generated in seconds.',
    icon: WandSparkles,
  },
  {
    title: 'Auto Resume Updates',
    description: 'Your resume stays current with new skills and experience added to your profile.',
    icon: Files,
  },
  {
    title: 'AI Insights',
    description: "See what's working and where you get the best results.",
    icon: TrendingUp,
  },
  {
    title: 'Seamless Experience',
    description: 'A fully integrated experience - search, apply, and track in one flow.',
    icon: Sparkles,
  },
  {
    title: 'Works Everywhere',
    description: 'Use KapIT across web and mobile - your progress stays perfectly synced.',
    icon: Globe,
  },
];

export default function LandingCategoriesSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#fbfaf6] via-[#fcfbf8] to-white dark:bg-[#181a1b] scroll-mt-24">
      <div className="landing-desktop-shell relative py-12 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h3 className="text-3xl font-semibold tracking-tight text-[#11120f] dark:text-white sm:text-4xl lg:text-[2.5rem]">
            Tired of endless job searching?{' '}
            <span className="font-medium text-[#6b6e69] dark:text-[#94a3b8]">
              Here&apos;s what&apos;s really holding you back.
            </span>
          </h3>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#4d504b] dark:text-[#cbd5e1] sm:text-lg">
            If you&apos;re still spending hours filling out forms, rewriting resumes, and tracking applications by
            hand, you&apos;re not alone.
          </p>
        </div>

        <div className="mx-auto mt-10 flex max-w-[70rem] flex-wrap items-center justify-center gap-3.5 lg:mt-12">
          {PROBLEM_CHIPS.map((chip) => {
            const Icon = chip.icon;
            return (
              <div
                key={chip.label}
                className="inline-flex min-h-[3.1rem] items-center gap-3 rounded-[1.05rem] border border-[#ece8de] bg-white px-4.5 py-2.5 text-[1rem] font-medium text-[#4f514c] shadow-[0_6px_22px_rgba(28,23,16,0.03)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#d8d2c7] hover:shadow-[0_12px_28px_rgba(28,23,16,0.06)] dark:border-white/10 dark:bg-[#202224] dark:text-[#dde3ea]"
              >
                <Icon className="h-[1.15rem] w-[1.15rem] shrink-0 text-[#8d92a0] dark:text-[#b7c0cd]" strokeWidth={1.8} />
                <span className="whitespace-nowrap">{chip.label}</span>
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-14 h-px max-w-6xl bg-[#efebe2] dark:bg-white/10" />

        <div className="mt-14 grid gap-y-10 gap-x-8 sm:grid-cols-2 xl:grid-cols-4">
          {BENEFITS.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <article key={benefit.title} className="mx-auto flex max-w-[16.5rem] flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e8e3d8] bg-white shadow-[0_6px_18px_rgba(28,23,16,0.04)] dark:border-white/10 dark:bg-[#202224]">
                  <Icon className="h-5 w-5 text-[#2f7a68] dark:text-[#9ad0c2]" strokeWidth={1.9} />
                </div>
                <h4 className="mt-5 text-[1.55rem] font-semibold tracking-[-0.04em] text-[#11120f] dark:text-white">
                  {benefit.title}
                </h4>
                <p className="mt-3 text-[1rem] leading-8 text-[#4d504b] dark:text-[#cbd5e1]">
                  {benefit.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
