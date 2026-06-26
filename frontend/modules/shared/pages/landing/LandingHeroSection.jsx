import React from 'react';
import { ArrowRight } from 'lucide-react';
import HeroLampGlow from '@sharedComponents/effects/HeroLampGlow';
import { useTheme } from '@sharedContext/ThemeContext';
import { createLandingBgStars } from './landingData';

const LANDING_BG_STARS = createLandingBgStars();

export default function LandingHeroSection({ onGetStarted, onJoinDeveloper }) {
  const { theme } = useTheme();

  return (
    <section className="relative overflow-hidden min-h-[100dvh] flex flex-col">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: theme === 'dark' ? 'url(/hero%20dark.png)' : 'url(/hero%20light.png)',
        }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden="true">
        <div
          className="landing-bg-glow absolute inset-0"
          style={{
            background:
              theme === 'dark'
                ? 'radial-gradient(58% 44% at 50% 14%, rgba(226, 232, 240, 0.22) 0%, rgba(148, 163, 184, 0.13) 44%, rgba(18, 20, 22, 0) 86%), radial-gradient(58% 38% at 50% 72%, rgba(163, 230, 53, 0.07) 0%, rgba(18,20,22,0) 78%)'
                : 'radial-gradient(58% 44% at 50% 14%, rgba(16, 185, 129, 0.03) 0%, rgba(163, 230, 53, 0.018) 44%, rgba(247, 246, 241, 0) 86%), radial-gradient(58% 38% at 50% 72%, rgba(245, 222, 179, 0.12) 0%, rgba(247,246,241,0) 80%)',
          }}
        />
        <div
          className="landing-bg-horizon absolute inset-x-[-10%] bottom-[8%] h-36 sm:h-44"
          style={{
            background:
              theme === 'dark'
                ? 'radial-gradient(58% 90% at 50% 100%, rgba(203, 213, 225, 0.2) 0%, rgba(148, 163, 184, 0.12) 36%, rgba(18,20,22,0) 76%)'
                : 'radial-gradient(58% 90% at 50% 100%, rgba(132, 204, 22, 0.045) 0%, rgba(16, 185, 129, 0.03) 34%, rgba(247,246,241,0) 78%)',
          }}
        />
        <div
          className="landing-bg-wave absolute inset-x-[7%] bottom-[10%] h-20 rounded-[50%] border"
          style={{
            borderColor: theme === 'dark' ? 'rgba(203,213,225,0.24)' : 'rgba(132, 204, 22, 0.3)',
          }}
        />
        <div
          className="landing-bg-wave landing-bg-wave-delay absolute inset-x-[15%] bottom-[11.5%] h-16 rounded-[50%] border"
          style={{
            borderColor: theme === 'dark' ? 'rgba(226,232,240,0.18)' : 'rgba(101, 163, 13, 0.26)',
          }}
        />
        {LANDING_BG_STARS.map((star) => (
          <span
            key={`${star.top}-${star.left}`}
            className={`absolute ${star.size} rounded-full bg-[#facc15]/70 shadow-[0_0_7px_rgba(217,119,6,0.35)] dark:bg-white/65 dark:shadow-none`}
            style={{ top: star.top, left: star.left }}
          />
        ))}
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 hidden h-[42vh] dark:block"
        style={{
          background:
            'linear-gradient(180deg, rgba(18,20,22,0.96) 0%, rgba(18,20,22,0.74) 36%, rgba(18,20,22,0.38) 64%, rgba(18,20,22,0) 100%), radial-gradient(58% 54% at 50% 0%, rgba(203,213,225,0.14) 0%, rgba(18,20,22,0) 72%)',
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/12 via-white/16 to-[#f4f7f3] dark:from-[#121416]/58 dark:via-[#121416]/34 dark:to-[#1a1d20]" aria-hidden="true" />
      <HeroLampGlow />

      <div className="relative z-[5] flex-1 flex items-center">
        <div className="w-full max-w-[min(100%,1700px)] mx-auto px-6 sm:px-8 lg:px-10 xl:px-12 2xl:px-14 py-10 sm:py-12 lg:py-14">
          <div className="max-w-5xl lg:max-w-3xl mx-auto lg:mx-0 text-center lg:text-left w-full xl:-translate-y-6 2xl:-translate-y-8">
            <h2 className="mt-2 text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.2rem] font-extrabold tracking-tight leading-[0.95] text-[#102a1b] dark:text-white max-w-[72rem] mx-auto lg:mx-0">
              <span className="block md:whitespace-nowrap">Connect Filipino IT</span>
              <span className="block md:whitespace-nowrap">Talent with Opportunity</span>
            </h2>
            <p className="mt-5 sm:mt-6 text-[1rem] sm:text-[1.08rem] lg:text-[1.12rem] leading-relaxed font-medium text-[#2f4e39] dark:text-[#d0d7dd] max-w-3xl mx-auto lg:mx-0">
              KapIT is a focused hiring marketplace where companies find vetted developers and IT professionals discover real, skill-matched opportunities.
            </p>

            <div className="mt-10 sm:mt-12 flex flex-row flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4">
              <button
                type="button"
                onClick={onGetStarted}
                className="w-auto inline-flex items-center justify-center gap-1.5 sm:gap-2 px-5 py-3 sm:px-7 sm:py-4 rounded-full bg-white/85 dark:bg-[#22272b]/70 border border-[#a3b18a] dark:border-[#444d57] text-[#102a1b] dark:text-white text-[0.95rem] sm:text-lg font-semibold hover:bg-white dark:hover:bg-[#353c44] transition-colors backdrop-blur"
              >
                Find Developers <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <button
                type="button"
                onClick={onJoinDeveloper}
                className="w-auto inline-flex items-center justify-center gap-1.5 sm:gap-2 px-5 py-3 sm:px-7 sm:py-4 rounded-full bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86] text-white text-[0.95rem] sm:text-lg font-semibold transition-colors"
              >
                Join as Developer <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
