import React from 'react';
import { ArrowRight, Code2, Users } from 'lucide-react';

const STEPS = [
  {
    id: 'profile',
    step: 'Step 1',
    title: 'Create your profile',
    description:
      "Sign up, add your skills and experience, and tell employers what kind of IT role you're looking for.",
    icon: Users,
  },
  {
    id: 'showcase',
    step: 'Step 2',
    title: 'Showcase your work',
    description:
      'Bring your portfolio, projects, resume, and technical strengths into one profile employers can review.',
    icon: Code2,
  },
  {
    id: 'connect',
    step: 'Step 3',
    title: 'Find and track roles',
    description:
      'Focus on relevant openings, follow each application, and keep interview conversations moving in one place.',
    icon: ArrowRight,
  },
];

export default function LandingHowItWorksSection() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#fffefd_0%,#fcfaf6_34%,#f6eee2_100%)] dark:bg-none dark:bg-[#181a1b]">
      <div className="landing-desktop-shell relative py-[6rem] sm:py-24 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h3 className="text-[2.5rem] font-semibold tracking-[-0.05em] text-[#102a1b] dark:text-white sm:text-[3rem]">
            How KapIT works
          </h3>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-[#4e5f54] dark:text-[#cbd5e1]">
            A simpler flow for finding opportunities, presenting your work, and moving from interest to real conversations.
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3 lg:gap-7">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isMiddle = index === 1;

            return (
              <article
                key={step.id}
                className={`group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-[#e6dfd2] bg-white/92 p-7 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:border-[#d8cfbf] hover:shadow-[0_18px_40px_rgba(38,30,18,0.06)] dark:border-white/10 dark:bg-[#202224] ${
                  isMiddle ? 'lg:translate-y-10' : ''
                }`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(190,171,144,0.12),rgba(190,171,144,0))] opacity-70 dark:bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.04),rgba(255,255,255,0))]" />

                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.78rem] font-semibold uppercase tracking-[0.22em] text-[#588157] dark:text-[#d6ddd6]">
                      {step.step}
                    </p>
                    <h4 className="mt-5 max-w-[15rem] text-[1.9rem] font-semibold tracking-[-0.04em] text-[#102a1b] dark:text-white">
                      {step.title}
                    </h4>
                  </div>

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.2rem] border border-[#ece4d7] bg-[#fbfaf6] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105 dark:border-white/10 dark:bg-[#26292c]">
                    <Icon className="h-6 w-6 text-[#5f8a64] dark:text-[#d2ddd6]" strokeWidth={1.85} />
                  </div>
                </div>

                <p className="relative mt-8 max-w-[19rem] text-[1.02rem] leading-8 text-[#4e5f54] dark:text-[#cbd5e1]">
                  {step.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
