import React, { useState } from 'react';
import { ArrowRight, Users, Code2, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import Footer from '../../../shared/components/branding/Footer';
import { CATEGORIES } from '../../../shared/pages/landing/landingData';
import PublicMobileNav from '../../components/navigation/PublicMobileNav';

const TAILORED_DESCRIPTIONS = {
  'Programming & Tech': 'Build robust, scalable software solutions. From frontend interfaces to backend systems, discover roles across the full development stack.',
  'Cybersecurity': 'Protect critical infrastructure and sensitive data. Find roles focused on threat detection, ethical hacking, and network defense.',
  'UI/UX Design': 'Craft intuitive, user-centric digital experiences. Connect with roles that blend visual aesthetics with seamless user journeys.',
  'Mobile Development': 'Create high-performance applications for iOS and Android. Explore opportunities in Swift, Kotlin, React Native, and Flutter.',
  'AI & Data': 'Turn raw data into actionable intelligence. Discover roles in machine learning, data engineering, and predictive analytics.',
  'Cloud & DevOps': 'Design and maintain resilient cloud architectures. Find roles in CI/CD pipeline automation, serverless, and cloud infrastructure.',
};

const HOW_IT_WORKS_STEPS = [
  {
    step: 'Step 1',
    title: 'Create your profile.',
    description: "Sign up, complete your developer profile, and tell employers what kind of IT role you're looking for.",
    Icon: Users,
    className: 'bg-white dark:bg-[#141414] text-[#4A3F35] dark:text-[#D4D4D8]',
  },
  {
    step: 'Step 2',
    title: 'Showcase work.',
    description: 'Bring your portfolio, projects, resume, and technical strengths into one profile employers can review.',
    Icon: Code2,
    className: 'bg-[#F6F8F4] dark:bg-[#1A1A1A] text-[#5C4D42] dark:text-[#A1A1AA]',
  },
  {
    step: 'Step 3',
    title: 'Find & track roles.',
    description: 'Focus on relevant openings, follow every application, and keep interview conversations moving in one place.',
    Icon: Sparkles,
    className: 'bg-white dark:bg-[#202020] text-[#4A3F35] dark:text-[#D4D4D8]',
  },
];

const WHY_US_ROWS = [
  { feature: 'IT-Focused', kapit: '100% IT only', others: 'All industries' },
  { feature: 'Filipino Talent', kapit: 'PH-first', others: 'Global / generic' },
  { feature: 'Portfolio Display', kapit: '+ Built-in', others: '- Link only' },
  { feature: 'Skill Matching', kapit: '+ Auto-matched', others: '- Manual search' },
  { feature: 'Setup Time', kapit: '< 5 minutes', others: '30+ minutes' },
  { feature: 'Hiring Fees', kapit: 'Transparent', others: 'Hidden / tiered' },
];

export default function MobileLandingPage({ onLogoClick, onOpenAccountChoice, onJoinDeveloperClick, onSignIn }) {
  const [activeCategory, setActiveCategory] = useState(0);

  const handleNextCategory = () => {
    setActiveCategory((prev) => (prev === CATEGORIES.length - 1 ? 0 : prev + 1));
  };

  const handlePrevCategory = () => {
    setActiveCategory((prev) => (prev === 0 ? CATEGORIES.length - 1 : prev - 1));
  };

  const activeCat = CATEGORIES[activeCategory];
  const ActiveCategoryIcon = activeCat.icon;
  const activeCategoryDescription =
    TAILORED_DESCRIPTIONS[activeCat.title]
    || 'Discover highly skilled roles tailored to this specific IT domain.';

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col overflow-x-hidden bg-[#FDFBF7] font-sans text-[#2D2A26] antialiased dark:bg-[#0A0A0A] dark:text-[#FAFAFA]">
      <div className="pointer-events-none absolute inset-x-[-12%] top-0 h-[36vh] rounded-full bg-gradient-radial from-[#EAB308]/12 to-transparent blur-3xl dark:from-[#22C55E]/12" />

      <div className="relative z-10 flex min-h-screen w-full flex-col">
        <PublicMobileNav
          onLogoClick={onLogoClick}
          onGetStarted={onOpenAccountChoice}
          onJoinDeveloper={onJoinDeveloperClick}
          onSignIn={onSignIn}
        />

        <main className="flex-1 w-full px-5 pb-10 pt-28">
          <section className="relative flex w-full flex-col items-start pb-16 pt-4">
            <div className="relative w-full rounded-[2rem] border border-transparent bg-[#1F332A] p-6 pb-10 pt-8 text-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] dark:border-[#22C55E]/10 dark:bg-[#111111] dark:shadow-none">
              <h1 className="max-w-[9ch] font-sans text-[3.25rem] font-bold leading-[0.95] tracking-[-0.04em] text-white">
                Focused.
                <br />
                Fluid.
                <br />
                Forward.
              </h1>

              <p className="mt-8 max-w-[26ch] text-[15px] font-medium leading-[1.6] text-white/90">
                KapIT&apos;s dedicated mobile experience connects you to real opportunities faster than ever.
              </p>

              <div className="mt-12 flex w-full flex-col gap-3">
                <button
                  type="button"
                  onClick={onOpenAccountChoice}
                  className="group flex w-full items-center justify-between rounded-full bg-white p-4 px-6 text-[15px] font-semibold text-[#1F332A] transition-all duration-300 active:scale-[0.97]"
                >
                  <span>Unlock opportunities</span>
                  <ArrowRight className="h-5 w-5 text-[#1F332A] transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </section>

          <section className="relative mt-10 w-full">
            <div className="mb-10 pl-2">
              <h2 className="text-[2.25rem] font-bold leading-[1.1] tracking-[-0.03em] text-[#3A2E25] dark:text-white">
                How KapIT works
              </h2>
            </div>

            <div className="w-full space-y-4">
              {HOW_IT_WORKS_STEPS.map(({ step, title, description, Icon, className }) => (
                <div
                  key={step}
                  className={`w-full rounded-[2.5rem] border border-transparent p-8 shadow-[0_24px_48px_-16px_rgba(0,0,0,0.08)] dark:border-white/5 ${className}`}
                >
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#2D4A3E] dark:text-[#EAB308]">{step}</p>
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <h3 className="font-sans text-[1.75rem] font-bold leading-[1.05] tracking-[-0.03em] text-[#3A2E25] dark:text-white">
                      {title}
                    </h3>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EAF0E6] dark:bg-[#22C55E]/20">
                      <Icon className="h-5 w-5 text-[#2D4A3E] dark:text-[#22C55E]" />
                    </div>
                  </div>
                  <p className="text-[15px] leading-[1.5]">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="relative mb-8 mt-20 w-full">
            <div className="mb-6 pl-2">
              <h2 className="text-[2.25rem] font-bold leading-[1.1] tracking-[-0.03em] text-[#3A2E25] dark:text-white">
                Explore roles
              </h2>
            </div>

            <div className="relative flex min-h-[340px] w-full flex-col overflow-hidden rounded-[2rem] border border-[#3A2E25]/5 bg-white p-6 pb-10 pt-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-[#1A1A1A] dark:shadow-2xl">
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handlePrevCategory}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#3A2E25]/10 bg-[#F6F8F4] text-[#2D4A3E] dark:border-white/10 dark:bg-[#121212] dark:text-white"
                  aria-label="Previous role category"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextCategory}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#3A2E25]/10 bg-[#F6F8F4] text-[#2D4A3E] dark:border-white/10 dark:bg-[#121212] dark:text-white"
                  aria-label="Next role category"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="relative mt-6 flex flex-1 flex-col justify-center">
                <div key={activeCategory} className="flex w-full flex-col items-start transition-opacity duration-200">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-transparent bg-[#EAF0E6] dark:border-[#22C55E]/20 dark:bg-[#22C55E]/10">
                    <ActiveCategoryIcon className="h-6 w-6 text-[#2D4A3E] dark:text-[#22C55E]" />
                  </div>
                  <h3 className="mb-4 font-sans text-[2rem] font-bold leading-[1.1] tracking-[-0.03em] text-[#3A2E25] dark:text-white">
                    {activeCat.title}
                  </h3>
                  <p className="text-[15px] font-medium leading-[1.7] text-[#5C4D42] dark:text-[#D4D4D8]">
                    {activeCategoryDescription}
                  </p>
                </div>
              </div>

              <div className="mt-10 flex items-center justify-center gap-2">
                {CATEGORIES.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveCategory(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === activeCategory
                        ? 'w-6 bg-[#2D4A3E] dark:bg-[#22C55E]'
                        : 'w-1.5 bg-[#3A2E25]/20 dark:bg-white/20'
                    }`}
                    aria-label={`Go to category ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="mb-16 mt-16 w-full">
            <div className="mb-8 text-center">
              <h2 className="font-sans text-[2.5rem] font-bold leading-[1] tracking-[-0.04em] text-[#3A2E25] dark:text-white">
                Why Us?
              </h2>
              <p className="mt-3 text-[14px] font-medium text-[#5C4D42] dark:text-[#A1A1AA]">
                Side-by-side. No fluff.
              </p>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-[#3A2E25]/10 bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-[#111111] dark:shadow-none">
              <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-[#3A2E25]/10 bg-[#F6F8F4] px-5 py-4 dark:border-white/10 dark:bg-[#0A0A0A]">
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#5C4D42] dark:text-[#A1A1AA]">Feature</span>
                <span className="text-center text-[11px] font-bold uppercase tracking-[0.15em] text-[#2D4A3E] dark:text-[#22C55E]">KapIT</span>
                <span className="text-center text-[11px] font-bold uppercase tracking-[0.15em] text-[#5C4D42] dark:text-[#A1A1AA]">Others</span>
              </div>

              {WHY_US_ROWS.map((row, index) => (
                <div
                  key={row.feature}
                  className={`grid grid-cols-[1fr_1fr_1fr] items-center px-5 py-4 ${
                    index % 2 === 0
                      ? 'bg-white dark:bg-[#111111]'
                      : 'bg-[#FDFBF7] dark:bg-[#0D0D0D]'
                  } ${index < WHY_US_ROWS.length - 1 ? 'border-b border-[#3A2E25]/5 dark:border-white/5' : ''}`}
                >
                  <span className="text-[13px] font-semibold text-[#3A2E25] dark:text-white">{row.feature}</span>
                  <span className="text-center text-[13px] font-medium text-[#2D4A3E] dark:text-[#22C55E]">{row.kapit}</span>
                  <span className="text-center text-[13px] font-medium text-[#5C4D42]/60 dark:text-[#A1A1AA]/60">{row.others}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-4 w-full">
            <div className="rounded-[2rem] border border-transparent bg-[#2D4A3E] px-6 py-12 text-center shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] dark:border-[#22C55E]/10 dark:bg-[#111111] dark:shadow-none">
              <p className="mb-4 text-[13px] font-bold uppercase tracking-[0.15em] text-[#EAB308] dark:text-[#22C55E]">
                Don&apos;t miss the right match
              </p>
              <h2 className="mx-auto max-w-[22ch] font-sans text-[1.75rem] font-bold leading-[1.15] tracking-[-0.03em] text-white dark:text-[#FAFAFA]">
                Top IT roles in the Philippines fill fast. Get notified before they close.
              </h2>
              <div className="mx-auto mt-8 flex max-w-md flex-col items-stretch gap-3 sm:flex-row">
                <input
                  type="email"
                  placeholder="Your email address"
                  aria-label="Email address for job alerts"
                  className="flex-1 rounded-full border border-white/10 bg-[#1E332A] px-5 py-3.5 text-[14px] text-white outline-none transition-colors duration-300 placeholder:text-white/40 focus:border-[#EAB308]/50 dark:border-white/10 dark:bg-[#1A1A1A] dark:text-[#FAFAFA] dark:placeholder-[#A1A1AA]/60 dark:focus:border-[#22C55E]/50"
                />
                <button
                  type="button"
                  className="whitespace-nowrap rounded-full bg-[#EAB308] px-6 py-3.5 text-[14px] font-semibold text-[#3A2E25] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] dark:bg-[#22C55E] dark:text-[#0A0A0A]"
                >
                  Get early access
                </button>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
