import React, { useEffect, useState } from 'react';
import { ArrowRight, Clock3, Star, Users } from 'lucide-react';
import { useTheme } from '@sharedContext/ThemeContext';
import LandingApplicationsShowcase from './LandingApplicationsShowcase';

const DARK_HERO_BACKGROUNDS = [
  {
    src: '/hero_visual_dark.png',
    className:
      'absolute left-[9.5rem] top-[10rem] w-[clamp(20rem,29vw,29rem)]',
    imageClassName: 'opacity-[0.88]',
  },
  {
    src: '/hero_visual_dark_2.png',
    className:
      'absolute right-[9rem] top-[21.75rem] w-[clamp(20rem,29vw,29rem)]',
    imageClassName: 'opacity-[0.82]',
  },
  {
    src: '/hero_visual_dark_3.png',
    className:
      'absolute left-[6.5rem] top-[40.5rem] w-[clamp(20rem,29vw,29rem)]',
    imageClassName: 'opacity-[0.78]',
  },
];

export default function LandingHeroSection({ onGetStarted }) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden bg-[#FDFBF7] pt-24 dark:bg-[#181a1b] lg:pt-28 min-[1100px]:pt-0">
      
      {/* Restored Background Image */}
      {mounted && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {theme === 'dark' ? (
            <>
              {DARK_HERO_BACKGROUNDS.map(({ src, className, imageClassName }) => (
                <div
                  key={src}
                  className={`${className} hidden aspect-[16/9] overflow-hidden rounded-[1.25rem] bg-[#0d1110] shadow-[0_28px_80px_rgba(0,0,0,0.35)] ring-1 ring-white/10 min-[1100px]:block`}
                >
                  <img
                    src={src}
                    alt=""
                    aria-hidden="true"
                    className={`h-full w-full scale-[1.02] object-cover object-center transition-opacity duration-1000 ${imageClassName}`}
                  />
                  <div className="absolute inset-0 bg-[#181a1b]/5" />
                </div>
              ))}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(24,26,27,0.72)_0%,rgba(24,26,27,0.46)_38%,rgba(24,26,27,0.08)_64%,rgba(24,26,27,0.16)_100%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(24,26,27,0)_0%,rgba(24,26,27,0.08)_24%,rgba(24,26,27,0.82)_48%,rgba(24,26,27,0.72)_70%,rgba(24,26,27,0.32)_100%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(24,26,27,0.18)_0%,rgba(24,26,27,0.12)_42%,rgba(24,26,27,0.28)_76%,#181a1b_100%)]" />
            </>
          ) : (
            <img
              src="/hero_visual_light_taste_stretched.png"
              alt="Hero Background"
              className="h-full w-full object-cover object-center opacity-60 transition-opacity duration-1000"
            />
          )}
        </div>
      )}
      {/* Editorial Split: Left Side Typography */}
      <div className="landing-desktop-shell relative z-20 flex w-full flex-1 flex-col justify-center py-[4.5rem] sm:py-[5.5rem] min-[1100px]:min-h-[100dvh] min-[1100px]:items-center min-[1100px]:justify-start min-[1100px]:pt-[11.5rem] min-[1100px]:pb-[4.5rem]">
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes heroSlideUp {
            to { opacity: 1; transform: translateY(0); }
          }
        `}} />

        <div className="relative flex w-full max-w-[34rem] flex-col gap-10 min-[1100px]:max-w-[52rem] min-[1100px]:items-center min-[1100px]:gap-12">
          
          {/* Halo Effect for Text Readability */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[120%] w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[#FDFBF7] opacity-95 blur-[60px] dark:bg-[#181a1b] dark:opacity-90 min-[1100px]:h-[160%] min-[1100px]:w-[120%]" />
          <div className="translate-y-8 space-y-6 opacity-0 animate-[heroSlideUp_1s_cubic-bezier(0.32,0.72,0,1)_forwards] min-[1100px]:space-y-7 min-[1100px]:text-center">
            <h1
              className="w-full font-bold leading-[1.05] tracking-[-0.04em] text-[#102a1b] dark:text-white [font-size:clamp(2.5rem,5.4vw,3.85rem)] min-[1100px]:[font-size:clamp(3.1rem,4.8vw,4.75rem)]"
              style={{ fontFamily: 'var(--font-desktop)' }}
            >
              <span className="min-[1100px]:hidden">
                Connect{' '}
                <span className="text-[#588157] dark:text-[#a3b18a]">Filipino IT</span>
                <br />
                Talent with{' '}
                <span className="text-[#588157] dark:text-[#a3b18a]">Opportunity</span>
              </span>
              <span className="hidden min-[1100px]:block">
                <span className="whitespace-nowrap">
                  Connect{' '}
                  <span className="text-[#588157] dark:text-[#a3b18a]">Filipino IT</span>
                </span>
                <br />
                <span className="whitespace-nowrap">
                  Talent with{' '}
                  <span className="text-[#588157] dark:text-[#a3b18a]">Opportunity</span>
                </span>
              </span>
            </h1>

            <div>
              <p className="max-w-[30rem] text-[1.0625rem] font-normal leading-[1.75] text-[#324336] text-pretty min-[1100px]:mx-auto min-[1100px]:max-w-[34rem] min-[1100px]:text-[1.125rem] min-[1100px]:leading-[1.8] xl:max-w-[38rem] dark:text-[#c8d0c7]">
              The Philippine IT job board for portfolio-ready profiles, ATS-optimized resumes, skill match percentages, and organized applications to roles that fit.
              </p>
            </div>
          </div>

          <div className="relative z-40 flex translate-y-8 items-center opacity-0 animate-[heroSlideUp_1s_cubic-bezier(0.32,0.72,0,1)_0.3s_forwards] min-[1100px]:justify-center min-[1100px]:pt-1">
            <button
              type="button"
              onClick={onGetStarted}
              className="group relative inline-flex items-center justify-center gap-3 rounded-full bg-[#344e41] px-8 py-3.5 text-[1.08rem] font-bold tracking-tight text-white shadow-[0_12px_32px_rgba(52,78,65,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:bg-[#2a3f34] hover:shadow-[0_16px_40px_rgba(52,78,65,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] active:translate-y-0 active:scale-[0.98] dark:bg-[#e2eedf] dark:text-[#102a1b] dark:shadow-[0_12px_32px_rgba(226,238,223,0.15)] dark:hover:bg-white dark:hover:shadow-[0_16px_40px_rgba(226,238,223,0.25)]"
            >
              <span>Try KapIT</span>
              <ArrowRight className="w-4.5 h-4.5 transition-transform duration-300 ease-out group-hover:translate-x-1" />

              {/* Subtle inner glow for premium feel */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100 dark:via-black/5 dark:to-black/10" />
            </button>
          </div>

          <div className="translate-y-8 opacity-0 animate-[heroSlideUp_1s_cubic-bezier(0.32,0.72,0,1)_0.38s_forwards] min-[1100px]:mt-2">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 px-4 pt-6 text-[0.98rem] text-[#31453a] min-[1100px]:gap-x-8 dark:text-[#c8d0c7]">
            <div className="inline-flex items-center gap-2.5">
              <Users className="h-4.5 w-4.5 text-[#2f5d50]" />
              <span>Used by 750,000+ job seekers</span>
            </div>
            <div className="inline-flex items-center gap-2.5">
              <Clock3 className="h-4.5 w-4.5 text-[#2f5d50]" />
              <span>Saves 20+ hours every week</span>
            </div>
            <div className="inline-flex items-center gap-2.5">
              <Star className="h-4.5 w-4.5 text-[#2f5d50]" />
              <span>Rated 4.8/5 by KapIT users</span>
            </div>
          </div>
        </div>
        </div>

        <div className="w-full translate-y-8 opacity-0 animate-[heroSlideUp_1.05s_cubic-bezier(0.32,0.72,0,1)_0.45s_forwards] min-[1100px]:pt-5">
          <LandingApplicationsShowcase />
        </div>
      </div>

    </section>
  );
}
