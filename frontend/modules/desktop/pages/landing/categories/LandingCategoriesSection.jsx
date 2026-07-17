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
  { label: 'Applying on generic job boards?', icon: MailWarning },
  { label: 'Lost track of applications?', icon: SquareStack },
  { label: 'Portfolio links getting ignored?', icon: CopyX },
  { label: 'Rewriting resumes for every role?', icon: PenSquare },
  { label: 'Tracking updates in spreadsheets?', icon: ClipboardList },
  { label: 'Unsure which jobs really fit?', icon: BriefcaseBusiness },
  { label: 'Switching between too many tools?', icon: Flame },
];

const BENEFITS = [
  {
    title: 'IT-Focused Platform',
    description: 'Built for Filipino tech professionals looking for focused technical opportunities.',
    icon: Shield,
  },
  {
    title: 'Portfolio-Ready Profiles',
    description: 'Show your skills, experience, and past work in one profile employers can review quickly.',
    icon: RefreshCw,
  },
  {
    title: 'ATS-Optimized Resumes',
    description: 'Keep resume versions that are easier to review, score, and share when applying.',
    icon: LayoutDashboard,
  },
  {
    title: 'Skill Match Percentages',
    description: 'See clearer match signals so you can focus on roles that actually fit your background.',
    icon: WandSparkles,
  },
  {
    title: 'Application Tracking',
    description: 'Follow jobs, statuses, emails, and documents from one dashboard instead of scattered notes.',
    icon: Files,
  },
  {
    title: 'Focused Job Discovery',
    description: 'Explore technical roles with clearer requirements and stronger signals about fit.',
    icon: TrendingUp,
  },
  {
    title: 'Unified Workflow',
    description: 'Move from profile setup to job search, applications, and follow-ups in one flow.',
    icon: Sparkles,
  },
  {
    title: 'Web and Mobile Access',
    description: 'Use KapIT across devices and pick up where you left off whenever you need to.',
    icon: Globe,
  },
];

export default function LandingCategoriesSection() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#fffdfa_0%,#fcfaf5_56%,#f8f3ea_100%)] dark:bg-[#181a1b] scroll-mt-24">
      <div className="landing-desktop-shell relative py-[4.5rem] sm:py-20 lg:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h3 className="text-3xl font-semibold tracking-tight text-[#11120f] dark:text-white sm:text-4xl lg:text-[2.5rem]">
            Finding the right tech role is harder{' '}
            <span className="font-medium text-[#6b6e69] dark:text-[#94a3b8]">
              when everything is spread across different tools.
            </span>
          </h3>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#4d504b] dark:text-[#cbd5e1] sm:text-lg">
            KapIT brings portfolio-ready profiles, ATS-optimized resumes, skill match percentages, and application
            tracking into one focused experience for Filipino IT professionals.
          </p>
        </div>

        <div className="mx-auto mt-12 flex max-w-[70rem] flex-wrap items-center justify-center gap-3.5 lg:mt-14">
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

        <div className="mx-auto mt-16 h-px max-w-6xl bg-[#efebe2] dark:bg-white/10" />

        <div className="mt-16 grid gap-y-12 gap-x-8 sm:grid-cols-2 xl:grid-cols-4">
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
