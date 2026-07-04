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
    <section className="relative min-h-[100dvh] w-full overflow-hidden bg-[#FDFBF7] dark:bg-[#181a1b] flex flex-col items-center pt-24 lg:pt-28 min-[1100px]:flex-row min-[1100px]:pt-0">
      
      {/* Editorial Split: Left Side Typography */}
      <div className="relative z-20 flex w-full flex-col justify-center px-6 py-14 sm:px-12 lg:px-16 lg:py-12 min-[1100px]:w-[55%] min-[1100px]:pl-10 min-[1100px]:pr-10 min-[1100px]:py-0 xl:w-1/2 xl:pr-20 2xl:pl-14 2xl:pr-28">
        <div className="max-w-2xl">
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes heroSlideUp {
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes heroFadeIn {
              to { opacity: 1; }
            }
          `}} />
          
          <h1 className="mb-6 w-full max-w-none translate-y-8 text-[2.55rem] font-extrabold leading-[1.03] tracking-[-0.03em] text-[#102a1b] opacity-0 mix-blend-multiply pointer-events-none animate-[heroSlideUp_1s_cubic-bezier(0.32,0.72,0,1)_forwards] sm:text-[4rem] md:text-[4.7rem] lg:text-[5rem] min-[1100px]:w-[114%] min-[1100px]:text-[5.15rem] 2xl:text-[5.8rem] dark:text-white dark:mix-blend-normal" style={{ fontFamily: 'var(--font-desktop)' }}>
            <span className="block min-[1100px]:hidden">Connect<br /><span className="text-[#588157] dark:text-[#a3b18a]">Filipino</span> IT</span>
            <span className="hidden min-[1100px]:block min-[1100px]:whitespace-nowrap">Connect <span className="text-[#588157] dark:text-[#a3b18a]">Filipino</span> IT</span>
            <span className="block min-[1100px]:whitespace-nowrap">Talent with <span className="text-[#588157] dark:text-[#a3b18a]">Opportunity</span></span>
          </h1>
          
          <p className="text-base sm:text-[1.08rem] lg:text-[1.12rem] text-[#2f4e39] dark:text-[#a1a1aa] leading-relaxed max-w-[19.5rem] sm:max-w-md min-[1100px]:max-w-[29rem] xl:max-w-none mb-10 font-medium translate-y-8 opacity-0 animate-[heroSlideUp_1s_cubic-bezier(0.32,0.72,0,1)_0.15s_forwards]">
            KapIT is a focused hiring marketplace where companies find vetted developers and IT professionals discover real, skill-matched opportunities.
          </p>

          <div className="relative z-40 flex flex-wrap items-center gap-4 translate-y-8 opacity-0 animate-[heroSlideUp_1s_cubic-bezier(0.32,0.72,0,1)_0.3s_forwards] min-[1100px]:flex-nowrap min-[1100px]:gap-3 xl:gap-4">
            <button
              type="button"
              onClick={onGetStarted}
              className="group inline-flex items-center justify-between gap-4 rounded-full border border-[#d7e4d6] bg-[#f6faf4] py-2 pl-7 pr-2 text-[1.02rem] font-semibold text-[#102a1b] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] hover:border-[#b9cfb6] hover:bg-[#edf6ea] hover:shadow-[0_8px_24px_rgba(58,90,64,0.10)] min-[1100px]:shrink-0 min-[1100px]:pl-6 dark:border-[#36453b] dark:bg-[#172019] dark:text-[#edf6ea] dark:hover:bg-[#203025] xl:pl-7"
            >
              <span>Find Developers</span>
              <div className="w-10 h-10 rounded-full bg-[#e3eddf] flex items-center justify-center transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105 dark:bg-[#2f4e39]">
                <ArrowRight className="w-[18px] h-[18px] text-[#2f4e39] dark:text-[#edf6ea]" />
              </div>
            </button>
            <button
              type="button"
              onClick={onJoinDeveloper}
              className="group inline-flex items-center justify-between gap-4 rounded-full bg-[#3a5a40] py-2 pl-7 pr-2 text-[1.02rem] font-semibold text-[#f8fbf6] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] hover:bg-[#344e41] hover:shadow-[0_10px_26px_rgba(58,90,64,0.22)] min-[1100px]:shrink-0 min-[1100px]:pl-6 dark:bg-[#6f9b74] dark:text-[#08110b] dark:hover:bg-[#82ad86] xl:pl-7"
            >
              <span>Join as Developer</span>
              <div className="w-10 h-10 rounded-full bg-[#2f4e39] flex items-center justify-center transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105 dark:bg-[#588157]">
                <ArrowRight className="w-[18px] h-[18px] text-[#f8fbf6] dark:text-[#08110b]" />
              </div>
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
