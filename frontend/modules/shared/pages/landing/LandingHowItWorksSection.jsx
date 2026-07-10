import React from 'react';
import { ArrowRight, Code2, Users } from 'lucide-react';
import KapITCleanReviews from './KapITCleanReviews';
import LandingPhoneMockup from './LandingPhoneMockup';

export default function LandingHowItWorksSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#fbfaf6] via-[#fbfaf6] via-[97%] to-[#f8f4ec] dark:bg-none dark:bg-[#181a1b]">
      <div className="landing-desktop-shell relative pt-6 pb-12 sm:pt-10 sm:pb-16 lg:pt-8 lg:pb-16">
        <div className="mb-7 max-w-2xl lg:mb-8">
          <h3 className="text-3xl lg:text-4xl font-bold text-[#102a1b] dark:text-white">
            How KapIT works
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-10 min-[1100px]:grid-cols-12 min-[1100px]:items-start min-[1100px]:gap-0 xl:gap-8">
          <div className="relative z-10 flex flex-col gap-8 min-[1100px]:col-span-4 xl:col-span-5">
            <div className="max-w-lg flex flex-col gap-4 min-[1100px]:max-w-[26.5rem] min-[1180px]:max-w-[29.5rem] xl:max-w-lg">
              <div className="group rounded-3xl relative overflow-hidden border border-[#a3b18a]/20 dark:border-white/5 bg-white/50 dark:bg-[#1a1d20]/50 p-5 sm:p-6 md:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:border-[#588157]/30 dark:hover:border-white/15 cursor-default">
                <div className="absolute inset-0 bg-gradient-to-br from-[#588157]/[0.04] to-transparent dark:from-white/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#588157] dark:text-[#f0c766]">Step 1</p>
                    <h4 className="mt-2 text-lg sm:text-xl font-bold tracking-tight text-[#102a1b] dark:text-white">Create your profile</h4>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#4a6354] dark:text-[#d0d7dd] max-w-md">
                      Sign up and complete your developer profile or set up your company account. Let us know what you&apos;re looking for.
                    </p>
                  </div>
                  <span className="inline-flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-[#fbfaf6] to-[#f0ede6] dark:from-[#2a3036] dark:to-[#22272b] shadow-sm border border-white/50 dark:border-white/5 group-hover:scale-110 transition-transform duration-500 ease-out">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-[#588157] dark:text-[#e9c86b]" />
                  </span>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-3xl border border-[#a3b18a]/20 bg-white/50 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md transition-all duration-500 ease-out hover:-translate-y-1 hover:border-[#588157]/30 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] cursor-default sm:p-6 md:p-7 min-[1100px]:left-12 dark:border-white/5 dark:bg-[#1a1d20]/50 dark:hover:border-white/15">
                <div className="absolute inset-0 bg-gradient-to-br from-[#588157]/[0.04] to-transparent dark:from-white/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#588157] dark:text-[#f0c766]">Step 2</p>
                    <h4 className="mt-2 text-lg sm:text-xl font-bold tracking-tight text-[#102a1b] dark:text-white">Showcase work</h4>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#4a6354] dark:text-[#d0d7dd] max-w-md">
                      Developers can showcase their portfolios and past work, while companies can post IT projects with clear requirements.
                    </p>
                  </div>
                  <span className="inline-flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-[#fbfaf6] to-[#f0ede6] dark:from-[#2a3036] dark:to-[#22272b] shadow-sm border border-white/50 dark:border-white/5 group-hover:scale-110 transition-transform duration-500 ease-out">
                    <Code2 className="h-5 w-5 sm:h-6 sm:w-6 text-[#588157] dark:text-[#e9c86b]" />
                  </span>
                </div>
              </div>

              <div className="group rounded-3xl relative overflow-hidden border border-[#a3b18a]/20 dark:border-white/5 bg-white/50 dark:bg-[#1a1d20]/50 p-5 sm:p-6 md:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:border-[#588157]/30 dark:hover:border-white/15 cursor-default">
                <div className="absolute inset-0 bg-gradient-to-br from-[#588157]/[0.04] to-transparent dark:from-white/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#588157] dark:text-[#f0c766]">Step 3</p>
                    <h4 className="mt-2 text-lg sm:text-xl font-bold tracking-tight text-[#102a1b] dark:text-white">Connect & collaborate</h4>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#4a6354] dark:text-[#d0d7dd] max-w-md">
                      Reach out to matches, interview smoothly on our platform, and start collaborating seamlessly to build great things.
                    </p>
                  </div>
                  <span className="inline-flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-[#fbfaf6] to-[#f0ede6] dark:from-[#2a3036] dark:to-[#22272b] shadow-sm border border-white/50 dark:border-white/5 group-hover:scale-110 transition-transform duration-500 ease-out">
                    <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 text-[#588157] dark:text-[#e9c86b]" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 hidden overflow-visible min-[1100px]:col-span-8 min-[1100px]:flex min-[1100px]:min-h-[500px] min-[1100px]:items-center min-[1100px]:justify-center xl:col-span-7 xl:min-h-[560px]">
            <div className="pointer-events-auto relative z-10 mx-auto min-[1100px]:w-full min-[1100px]:max-w-[700px] min-[1100px]:origin-center min-[1100px]:scale-[0.64] min-[1200px]:max-w-[780px] min-[1200px]:scale-[0.7] min-[1320px]:max-w-[860px] min-[1320px]:scale-[0.77] xl:max-w-[920px] xl:scale-[0.82] 2xl:max-w-[1040px] 2xl:scale-[0.92]">
              <KapITCleanReviews>
                <LandingPhoneMockup />
              </KapITCleanReviews>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .hero-phone-shell {
          transform: rotate(3.15deg) perspective(1200px) rotateY(-6deg);
          transform-origin: 56% 88%;
          box-shadow: 0 42px 95px rgba(12, 24, 17, 0.26), 0 8px 18px rgba(15, 20, 25, 0.28);
          transition: transform 280ms ease-out, box-shadow 280ms ease-out;
        }
        .hero-phone-shell:hover {
          transform: translateY(-8px) rotate(3.95deg) perspective(1200px) rotateY(-7deg);
          box-shadow: 0 48px 115px rgba(12, 24, 17, 0.31), 0 9px 20px rgba(15, 20, 25, 0.32);
        }
        .hero-phone-bezel {
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 -24px 38px rgba(5, 10, 14, 0.42);
        }
        .dark .hero-phone-shell {
          box-shadow: 0 0 0 1px rgba(189, 201, 214, 0.2), 0 48px 106px rgba(10, 18, 28, 0.52);
        }
        .dark .hero-phone-bezel {
          box-shadow: inset 0 0 0 1px rgba(226, 232, 240, 0.12), inset 0 -24px 38px rgba(5, 10, 14, 0.52);
        }
        .hero-phone-glow {
          background: radial-gradient(56% 52% at 50% 52%, rgba(111, 155, 116, 0.21) 0%, rgba(111, 155, 116, 0) 82%);
          filter: blur(16px);
          transition: opacity 300ms ease-out;
          opacity: 0.78;
          pointer-events: none;
        }
        .hero-dynamic-island {
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 6px 13px rgba(0, 0, 0, 0.38);
        }
        .hero-screen-status {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.88) 0%, rgba(255, 255, 255, 0) 100%);
        }
        .hero-ios-card {
          box-shadow: 0 14px 34px rgba(23, 40, 28, 0.11), inset 0 1px 0 rgba(255, 255, 255, 0.74);
        }
        .hero-safari-toolbar {
          box-shadow: 0 -2px 0 rgba(255, 255, 255, 0.72), 0 10px 24px rgba(17, 37, 24, 0.14);
        }
        .hero-safari-address {
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
        }
        .hero-address-field {
          color: #5a725f;
        }
        .hero-address-domain {
          display: inline-block;
          min-height: 11px;
          min-width: 1px;
          white-space: nowrap;
          letter-spacing: 0.002em;
          transition: color 220ms ease;
        }
        .hero-address-domain.has-value {
          color: #405a45;
        }
        .hero-address-caret {
          width: 1px;
          height: 10px;
          background: rgba(76, 102, 83, 0.84);
          border-radius: 999px;
          opacity: 0;
          transition: opacity 160ms ease;
        }
        .hero-address-caret.is-visible {
          opacity: 0.9;
          animation: hero-address-caret-soft 880ms ease-in-out infinite;
        }
        .hero-ios-loading-shell {
          position: absolute;
          inset: 58px 16px 118px 16px;
          z-index: 2;
          opacity: 0.92;
          transform: translateY(0) scale(1);
          filter: blur(0);
          transition: opacity 380ms ease, transform 460ms cubic-bezier(0.22, 1, 0.36, 1), filter 460ms ease;
          box-shadow: 0 16px 36px rgba(31, 56, 36, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.75);
        }
        .hero-ios-preview {
          position: relative;
          z-index: 3;
        }
        .hero-screen-demo.is-loaded .hero-ios-loading-shell {
          opacity: 0;
          transform: translateY(-6px) scale(0.992);
          filter: blur(1.2px);
        }
        .hero-ios-load-1,
        .hero-ios-load-2,
        .hero-ios-load-3 {
          opacity: 0;
          transform: translateY(8px) scale(0.988);
          filter: blur(1.25px);
          transition: opacity 520ms cubic-bezier(0.22, 1, 0.36, 1), transform 600ms cubic-bezier(0.22, 1, 0.36, 1), filter 500ms ease;
          visibility: hidden;
        }
        .hero-screen-demo.is-loaded .hero-ios-load-1,
        .hero-screen-demo.is-loaded .hero-ios-load-2,
        .hero-screen-demo.is-loaded .hero-ios-load-3 {
          opacity: 1;
          transform: translateY(0) scale(1);
          filter: blur(0);
          visibility: visible;
        }
        .hero-screen-demo.is-loaded .hero-ios-load-1 {
          transition-delay: 80ms;
        }
        .hero-screen-demo.is-loaded .hero-ios-load-2 {
          transition-delay: 170ms;
        }
        .hero-screen-demo.is-loaded .hero-ios-load-3 {
          transition-delay: 250ms;
        }
        .hero-screen-demo:not(.is-loaded) .hero-ios-load-1,
        .hero-screen-demo:not(.is-loaded) .hero-ios-load-2,
        .hero-screen-demo:not(.is-loaded) .hero-ios-load-3 {
          pointer-events: none;
        }
        .hero-screen-demo.is-loaded .hero-ios-load-1 {
          box-shadow: 0 16px 36px rgba(23, 40, 28, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.76);
        }
        .hero-screen-demo.is-loaded .hero-ios-load-2 .col-span-4,
        .hero-screen-demo.is-loaded .hero-ios-load-2 .col-span-2,
        .hero-screen-demo.is-loaded .hero-ios-load-3 {
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
        }
        .hero-phone-reflection {
          background: linear-gradient(108deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.23) 48%, rgba(255, 255, 255, 0) 100%);
          opacity: 0.34;
        }
        @keyframes hero-address-caret-soft {
          0%, 36% {
            opacity: 0.92;
          }
          37%, 62% {
            opacity: 0.25;
          }
          63%, 100% {
            opacity: 0.92;
          }
        }

      `}</style>
    </section>
  );
}
