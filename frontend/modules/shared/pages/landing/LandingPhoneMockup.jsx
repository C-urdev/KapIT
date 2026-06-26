import React from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Share2, SquareStack } from 'lucide-react';
import KapITLogo from '@sharedComponents/branding/KapITLogo';

export default function LandingPhoneMockup() {
  return (
    <div className="hero-phone-stage hero-phone-wrap pointer-events-auto relative z-20">
      <div className="hero-phone-glow absolute -inset-14 rounded-[84px]" aria-hidden="true" />
      <div className="hero-phone-shell relative h-[622px] w-[314px] overflow-hidden rounded-[62px] border border-[#0b1216] bg-[#020406] p-[1.6px]">
        <div className="hero-phone-bezel relative h-full w-full overflow-hidden rounded-[60px] border border-[#1a222b] bg-[#04080d] p-[1.4px]">
          <span className="pointer-events-none absolute -right-[1px] top-[156px] z-30 h-16 w-[3px] rounded-l-full bg-[#2d363f]/90" aria-hidden="true" />
          <span className="pointer-events-none absolute -right-[1px] top-[250px] z-30 h-11 w-[3px] rounded-l-full bg-[#2d363f]/90" aria-hidden="true" />
          <span className="pointer-events-none absolute -left-[1px] top-[132px] z-30 h-8 w-[2px] rounded-r-full bg-[#2d363f]/78" aria-hidden="true" />

          <div className="hero-phone-screen relative h-full w-full overflow-hidden rounded-[56px] border border-[#182028] bg-[#f8fcf7]">
            <div className="hero-screen-status absolute inset-x-0 top-0 z-20 px-7 pt-[11px]">
              <div className="flex items-center justify-between text-[12px] font-semibold tracking-[0.02em] text-[#111827]">
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                  <span className="h-[5px] w-[5px] rounded-full bg-[#111827]/85" />
                  <span className="h-[6px] w-[10px] rounded-[2px] border border-[#111827]/85" />
                </div>
              </div>
            </div>
            <div className="hero-dynamic-island absolute left-1/2 top-[12px] z-30 h-[30px] w-[126px] -translate-x-1/2 rounded-full bg-black" />

            <div className="hero-screen-demo is-loaded relative h-full bg-[radial-gradient(130%_74%_at_50%_-12%,rgba(202,225,204,0.46)_0%,rgba(244,250,244,0.96)_40%,rgba(247,252,248,1)_100%)] px-4 pb-[118px] pt-[58px]">
              <div className="hero-ios-loading-shell rounded-[22px] border border-[#dbe8dc] bg-white/88 px-4 py-4 backdrop-blur-[2px]">
                <div className="h-[11px] w-24 rounded-full bg-[#dce9dc]" />
                <div className="mt-2 h-[9px] w-[58%] rounded-full bg-[#e7f2e7]" />
                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  <div className="h-[64px] rounded-2xl border border-[#e4eee4] bg-[#f2f8f2]/84" />
                  <div className="h-[64px] rounded-2xl border border-[#e4eee4] bg-[#f6faf6]/88" />
                </div>
              </div>

              <div className="hero-ios-preview">
                <div className="hero-ios-card hero-ios-load-1 rounded-[22px] border border-[#d7e4d8] bg-white/92 px-4 py-3.5 backdrop-blur-[1px]">
                  <div className="flex items-center gap-2.5">
                    <KapITLogo className="h-6 w-6 rounded-md bg-white object-contain" />
                    <div className="space-y-0.5">
                      <p className="text-[12px] font-semibold leading-none text-[#102a1b]">KapIT</p>
                      <p className="text-[10px] font-medium text-[#5f755f]">AI Job Matching Platform</p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 w-[88%] rounded-full bg-[#dce8db]" />
                  <div className="mt-2 h-2 w-[62%] rounded-full bg-[#e8f1e6]" />
                  <div className="mt-4 grid grid-cols-2 gap-2.5">
                    <div className="h-[70px] rounded-2xl border border-white/40 bg-[linear-gradient(165deg,rgba(189,217,191,0.42),rgba(237,247,236,0.84))]" />
                    <div className="h-[70px] rounded-2xl border border-white/40 bg-[linear-gradient(165deg,rgba(208,228,205,0.38),rgba(244,250,243,0.9))]" />
                  </div>
                </div>

                <div className="hero-ios-load-2 mt-3.5 grid grid-cols-6 gap-2.5">
                  <div className="col-span-4 h-[76px] rounded-2xl border border-[#dce8dc] bg-white/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-sm" />
                  <div className="col-span-2 h-[76px] rounded-2xl border border-[#dce8dc] bg-[#eef6ee]/85 backdrop-blur-sm" />
                </div>
                <div className="hero-ios-load-3 mt-2.5 h-[90px] rounded-2xl border border-[#dbe7db] bg-[linear-gradient(160deg,rgba(252,255,252,0.82),rgba(231,243,231,0.78))] backdrop-blur-sm" />
              </div>

              <div className="hero-safari-toolbar absolute inset-x-3 bottom-[26px] rounded-[26px] border border-[#d6e3d7] bg-white/94 px-3 py-2.5 backdrop-blur-md">
                <div className="hero-safari-address flex items-center justify-between rounded-full border border-[#d8e6d9] bg-[#f3f8f3] px-3 py-1.5 text-[10px] font-semibold text-[#47614e]">
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] text-[#607667]">aA</span>
                  <span className="hero-address-field mx-2 flex min-w-0 flex-1 items-center justify-center gap-1 truncate">
                    <span className="hero-address-domain" aria-label="address input">
                      kapit.online
                    </span>
                  </span>
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-[#607667]">+</span>
                </div>
                <div className="mt-2.5 flex items-center justify-between px-3 text-[#487c56]">
                  <ChevronLeft className="h-[15px] w-[15px]" />
                  <ChevronRight className="h-[15px] w-[15px]" />
                  <Share2 className="h-[15px] w-[15px]" />
                  <BookOpen className="h-[15px] w-[15px]" />
                  <SquareStack className="h-[15px] w-[15px]" />
                </div>
              </div>

              <div className="absolute inset-x-[39%] bottom-2 h-[4px] rounded-full bg-[#050606]/84" />
            </div>
            <div className="hero-phone-reflection pointer-events-none absolute inset-y-0 right-0 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}
