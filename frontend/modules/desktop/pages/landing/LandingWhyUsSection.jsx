import React from 'react';
import { Check, X } from 'lucide-react';

const COMPARISON_ROWS = [
  { feature: 'IT-Focused', kapit: '100% IT only', others: 'All industries' },
  { feature: 'Filipino Talent', kapit: 'PH-first', others: 'Global / generic' },
  { feature: 'Portfolio Display', kapit: 'Built-in', others: 'Link only' },
  { feature: 'Skill Matching', kapit: 'Auto-matched', others: 'Manual search' },
  { feature: 'Setup Time', kapit: '< 5 minutes', others: '30+ minutes' },
  { feature: 'Hiring Fees', kapit: 'Transparent', others: 'Hidden / tiered' },
];

export default function LandingWhyUsSection() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#fffefd_0%,#fcfbf8_48%,#f8f2e9_100%)] dark:bg-none dark:bg-[#101714]">
      <div className="landing-desktop-shell relative py-[6rem] sm:py-24 lg:py-32">
        <div className="mx-auto mb-12 max-w-2xl text-center lg:mb-14">
          <h3 className="text-3xl lg:text-4xl font-bold text-[#102a1b] dark:text-white">
            Why Us?
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[#4a6354] dark:text-[#d0d7dd]">
            Side-by-side. No fluff.
          </p>
        </div>

        <div className="grid grid-cols-1 min-[900px]:grid-cols-2 gap-4 lg:gap-6">
          <div className="group rounded-3xl relative overflow-hidden border border-[#588157]/25 dark:border-[#22C55E]/15 bg-white/60 dark:bg-[#1a1d20]/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md">
            <div className="absolute inset-0 bg-gradient-to-br from-[#588157]/[0.03] to-transparent dark:from-[#22C55E]/[0.03]" />

            <div className="relative px-6 lg:px-8 py-5 border-b border-[#588157]/15 dark:border-[#22C55E]/10 bg-gradient-to-b from-[#fbfaf6] to-[#f0ede6] dark:from-[#1e2124] dark:to-[#1a1d20]">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#588157]/10 dark:bg-[#22C55E]/10">
                  <Check className="h-4 w-4 text-[#588157] dark:text-[#22C55E]" />
                </span>
                <span className="text-lg font-bold tracking-tight text-[#102a1b] dark:text-white">KapIT</span>
              </div>
            </div>

            <div className="relative">
              {COMPARISON_ROWS.map((row, i) => (
                <div
                  key={row.feature}
                  className={`px-6 lg:px-8 py-4 lg:py-5 flex items-center justify-between transition-colors duration-200 hover:bg-[#588157]/[0.04] dark:hover:bg-[#22C55E]/[0.03] ${
                    i < COMPARISON_ROWS.length - 1 ? 'border-b border-[#a3b18a]/10 dark:border-white/5' : ''
                  }`}
                >
                  <span className="text-sm font-semibold text-[#102a1b] dark:text-white">{row.feature}</span>
                  <span className="text-sm font-bold text-[#588157] dark:text-[#22C55E] flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 shrink-0" />
                    {row.kapit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl relative overflow-hidden border border-[#a3b18a]/15 dark:border-white/5 bg-white/30 dark:bg-[#1a1d20]/30 shadow-[0_8px_30px_rgb(0,0,0,0.02)] backdrop-blur-md">
            <div className="relative px-6 lg:px-8 py-5 border-b border-[#a3b18a]/15 dark:border-white/5 bg-[#f6f4ef]/50 dark:bg-[#1a1d20]/50">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#4a6354]/5 dark:bg-white/5">
                  <X className="h-4 w-4 text-[#4a6354]/40 dark:text-[#a1a1aa]/40" />
                </span>
                <span className="text-lg font-bold tracking-tight text-[#4a6354]/60 dark:text-[#a1a1aa]/60">Others</span>
              </div>
            </div>

            <div className="relative">
              {COMPARISON_ROWS.map((row, i) => (
                <div
                  key={row.feature}
                  className={`px-6 lg:px-8 py-4 lg:py-5 flex items-center justify-between ${
                    i < COMPARISON_ROWS.length - 1 ? 'border-b border-[#a3b18a]/8 dark:border-white/[0.03]' : ''
                  }`}
                >
                  <span className="text-sm font-semibold text-[#4a6354]/50 dark:text-[#a1a1aa]/50">{row.feature}</span>
                  <span className="text-sm font-medium text-[#4a6354]/35 dark:text-[#a1a1aa]/35 flex items-center gap-1.5">
                    <X className="h-3.5 w-3.5 shrink-0" />
                    {row.others}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
