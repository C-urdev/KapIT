import React from 'react';
import { ArrowRight } from 'lucide-react';
import Lamp from '@sharedComponents/effects/Lamp';

export default function LandingFinalCtaSection({ onOpenAccountChoice, onJoinDeveloper: _onJoinDeveloper }) {
  return (
    <Lamp
      actions={(
        <div data-landing-reveal style={{ '--landing-part-delay': '240ms' }} className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={onOpenAccountChoice}
            className="w-full sm:w-auto inline-flex min-h-[54px] items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#3a5a40] text-white text-[1.02rem] font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] hover:bg-[#344e41] dark:bg-[#6f9b74] dark:text-[#111] dark:hover:bg-[#82ad86]"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    />
  );
}
