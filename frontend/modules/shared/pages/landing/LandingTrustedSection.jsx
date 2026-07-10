import React from 'react';
import ThinSectionLine from '@sharedComponents/ui/ThinSectionLine';
import { TRUSTED_LOGOS } from './landingData';

export default function LandingTrustedSection() {
  return (
    <section className="relative bg-gradient-to-b from-[#edf3ef] via-[#ecefe9] to-[#e5e0d4] dark:bg-gradient-to-b dark:from-[#1a1d20] dark:via-[#1d2226] dark:to-[#20262b] backdrop-blur">
      <ThinSectionLine className="top-0" />
      <div className="landing-desktop-shell py-5 sm:py-6">
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-4">
          <p className="text-sm font-semibold tracking-[0.01em] text-[#2f4e39] dark:text-[#d0d7dd]">
            Trusted by companies hiring Filipino tech talent
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {TRUSTED_LOGOS.map((name) => (
              <div
                key={name}
                className="text-sm font-semibold tracking-wide text-[#5f6f67] dark:text-slate-400 opacity-80 grayscale"
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </div>
      <ThinSectionLine className="bottom-0" />
    </section>
  );
}
