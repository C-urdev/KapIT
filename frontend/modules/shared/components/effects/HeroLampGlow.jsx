import React from 'react';
import { motion } from 'framer-motion';

const glowTransition = {
  duration: 0.95,
  ease: 'easeOut',
  delay: 0.12,
};

export default function HeroLampGlow({ className = '' }) {
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-0 z-[4] h-52 sm:h-60 md:h-64 [--hero-lamp-core:rgba(88,129,87,0.16)] [--hero-lamp-mid:rgba(111,155,116,0.07)] [--hero-lamp-soft:rgba(163,177,138,0.08)] dark:[--hero-lamp-core:rgba(130,173,134,0.34)] dark:[--hero-lamp-mid:rgba(111,155,116,0.16)] dark:[--hero-lamp-soft:rgba(111,155,116,0.12)] ${className}`}
      aria-hidden="true"
    >
      <motion.div
        initial={{ opacity: 0.55, scaleX: 0.7 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={glowTransition}
        className="absolute inset-x-0 top-0 h-[2px] origin-center bg-gradient-to-r from-transparent via-[#588157] to-transparent shadow-[0_0_10px_rgba(88,129,87,0.42),0_0_28px_rgba(111,155,116,0.22)] dark:via-[#82ad86] dark:shadow-[0_0_16px_rgba(130,173,134,0.58),0_0_40px_rgba(111,155,116,0.3)]"
      />

      <motion.div
        initial={{ opacity: 0.3 }}
        animate={{ opacity: 1 }}
        transition={{ ...glowTransition, delay: 0.2 }}
        className="absolute left-1/2 top-0 h-full w-[min(130%,40rem)] -translate-x-1/2"
        style={{
          background:
            'radial-gradient(ellipse 72% 100% at 50% 0%, var(--hero-lamp-core) 0%, var(--hero-lamp-mid) 46%, transparent 80%)',
        }}
      />

      <div
        className="absolute inset-x-[-10%] top-0 h-36 sm:h-44"
        style={{
          background:
            'radial-gradient(ellipse 88% 100% at 50% 0%, var(--hero-lamp-soft) 0%, transparent 74%)',
        }}
      />

      <div className="absolute left-1/2 top-0 h-28 w-[min(88%,28rem)] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(111,155,116,0.14)_0%,transparent_72%)] blur-2xl dark:bg-[radial-gradient(ellipse_at_top,rgba(130,173,134,0.24)_0%,transparent_74%)]" />
    </div>
  );
}
