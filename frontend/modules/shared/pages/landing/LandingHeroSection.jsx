import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useTheme } from '@sharedContext/ThemeContext';

export default function LandingHeroSection({ onGetStarted, onJoinDeveloper }) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden bg-[#FDFBF7] pt-24 dark:bg-[#181a1b] lg:pt-28 min-[1100px]:pt-0">
      
      {/* Editorial Split: Left Side Typography */}
      <div className="landing-desktop-shell relative z-20 flex w-full flex-1 flex-col justify-center py-16 sm:py-20 min-[1100px]:min-h-[100dvh] min-[1100px]:py-24">
        <div className="flex w-full max-w-[34rem] flex-col gap-8 min-[1100px]:max-w-[52%] min-[1100px]:gap-10 xl:max-w-[54%]">
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes heroSlideUp {
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes heroFadeIn {
              to { opacity: 1; }
            }
          `}} />

          <div className="translate-y-8 space-y-6 opacity-0 animate-[heroSlideUp_1s_cubic-bezier(0.32,0.72,0,1)_forwards] min-[1100px]:space-y-7">
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

            <p className="max-w-[30rem] text-[1.0625rem] font-normal leading-[1.75] text-[#5d6f5d] text-pretty min-[1100px]:max-w-[34rem] min-[1100px]:text-[1.125rem] min-[1100px]:leading-[1.8] xl:max-w-[38rem] dark:text-[#a1a1aa]">
              The Philippine IT job board with portfolio-ready profiles, ATS-optimized resumes, and skill match percentages, helping companies hire qualified Filipino developers and talent land roles that actually fit.
            </p>
          </div>

          <div className="relative z-40 flex translate-y-8 items-center opacity-0 animate-[heroSlideUp_1s_cubic-bezier(0.32,0.72,0,1)_0.3s_forwards] min-[1100px]:pt-1">
            <button
              type="button"
              onClick={onGetStarted}
              className="group relative inline-flex items-center justify-center gap-3 rounded-full bg-[#344e41] px-8 py-3.5 text-[1.08rem] font-bold tracking-tight text-white shadow-[0_12px_32px_rgba(52,78,65,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:bg-[#2a3f34] hover:shadow-[0_16px_40px_rgba(52,78,65,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] active:translate-y-0 active:scale-[0.98] dark:bg-[#e2eedf] dark:text-[#102a1b] dark:shadow-[0_12px_32px_rgba(226,238,223,0.15)] dark:hover:bg-white dark:hover:shadow-[0_16px_40px_rgba(226,238,223,0.25)]"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4.5 h-4.5 transition-transform duration-300 ease-out group-hover:translate-x-1" />
              
              {/* Subtle inner glow for premium feel */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100 dark:via-black/5 dark:to-black/10" />
            </button>
          </div>
        </div>
      </div>

      {/* Editorial Split: Right Side Visual */}
      {mounted && theme === 'light' ? (
        <div className="z-10 h-[45vh] w-full opacity-0 animate-[heroFadeIn_1.5s_ease-out_forwards] lg:h-[52vh] min-[1100px]:absolute min-[1100px]:inset-y-0 min-[1100px]:right-0 min-[1100px]:h-full min-[1100px]:w-[45%] xl:w-[48%]">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-40 bg-gradient-to-r from-[#FDFBF7] via-[rgba(253,251,247,0.8)] to-transparent min-[1100px]:block" />
          <img
            src="/hero_visual_light_taste.png"
            alt="Workspace"
            className="h-full w-full object-cover object-left"
          />
        </div>
      ) : mounted && theme === 'dark' ? (
        <div className="relative z-10 flex min-h-[60vh] w-full items-center justify-center p-4 py-14 opacity-0 animate-[heroFadeIn_1s_ease-out_forwards] lg:min-h-[68vh] lg:p-6 lg:py-10 min-[1100px]:min-h-[100dvh] min-[1100px]:w-[45%] min-[1100px]:py-6 min-[1100px]:p-10 xl:w-1/2">
          {/* Subtle background ambient gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#181a1b] via-transparent to-[#181a1b] lg:bg-gradient-to-l opacity-75 pointer-events-none" />
          
          <div className="relative z-10 mx-auto flex w-full max-w-[420px] flex-col gap-6 sm:gap-8 lg:max-w-[500px] xl:max-w-[580px]">
            {/* IMG 1: Top Left */}
            <div 
              className="w-[85%] sm:w-[80%] self-start aspect-[16/9] rounded-[1rem] sm:rounded-[1.25rem] bg-[#111] ring-1 ring-white/10 p-1.5 sm:p-2 shadow-xl animate-[heroSlideUp_1.2s_cubic-bezier(0.32,0.72,0,1)_forwards]"
              style={{ opacity: 0 }}
            >
              <div className="relative w-full h-full rounded-[calc(1rem-0.375rem)] sm:rounded-[calc(1.25rem-0.5rem)] overflow-hidden bg-[#111]">
                <img
                  src="/hero_visual_dark.png"
                  alt="Top Left Primary"
                  className="w-full h-full object-cover object-center"
                />
              </div>
            </div>

            {/* IMG 2: Middle Right */}
            <div 
              className="w-[85%] sm:w-[80%] self-end aspect-[16/9] rounded-[1rem] sm:rounded-[1.25rem] bg-[#111] ring-1 ring-white/10 p-1.5 sm:p-2 shadow-xl animate-[heroSlideUp_1.4s_cubic-bezier(0.32,0.72,0,1)_forwards]"
              style={{ opacity: 0 }}
            >
              <div className="relative w-full h-full rounded-[calc(1rem-0.375rem)] sm:rounded-[calc(1.25rem-0.5rem)] overflow-hidden bg-[#111]">
                <div className="absolute inset-0 bg-black/20 z-10 pointer-events-none transition-opacity duration-500 hover:opacity-0" />
                <img
                  src="/hero_visual_dark_2.png"
                  alt="Middle Right Workspace"
                  className="w-full h-full object-cover object-center"
                />
              </div>
            </div>

            {/* IMG 3: Bottom Left */}
            <div 
              className="w-[85%] sm:w-[80%] self-start aspect-[16/9] rounded-[1rem] sm:rounded-[1.25rem] bg-[#111] ring-1 ring-white/10 p-1.5 sm:p-2 shadow-xl animate-[heroSlideUp_1.6s_cubic-bezier(0.32,0.72,0,1)_forwards]"
              style={{ opacity: 0 }}
            >
              <div className="relative w-full h-full rounded-[calc(1rem-0.375rem)] sm:rounded-[calc(1.25rem-0.5rem)] overflow-hidden bg-[#111]">
                <div className="absolute inset-0 bg-black/20 z-10 pointer-events-none transition-opacity duration-500 hover:opacity-0" />
                <img
                  src="/hero_visual_dark_3.png"
                  alt="Bottom Left Workspace"
                  className="w-full h-full object-cover object-center"
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
      
    </section>
  );
}
