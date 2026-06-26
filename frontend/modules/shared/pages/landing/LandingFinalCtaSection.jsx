import React from 'react';
import { ArrowRight } from 'lucide-react';
import Lamp from '@sharedComponents/effects/Lamp';

export default function LandingFinalCtaSection({ onOpenAccountChoice, onJoinDeveloper }) {
  return (
    <Lamp
      actions={(
        <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={onOpenAccountChoice}
            className="w-full sm:w-auto inline-flex min-h-[54px] items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-[#22272b] border border-[#a3b18a] dark:border-[#444d57] text-[#102a1b] dark:text-white font-semibold hover:bg-white/90 dark:hover:bg-[#353c44] transition-colors"
          >
            Find Developers <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onJoinDeveloper}
            className="w-full sm:w-auto inline-flex min-h-[54px] items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86] text-white font-semibold transition-colors"
          >
            Join as Developer <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    />
  );
}
