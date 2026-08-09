import React from 'react';
import { motion } from 'framer-motion';

const beamTransition = {
  delay: 0.25,
  duration: 0.85,
  ease: 'easeInOut',
};

function ConicBeam({ side }) {
  const isLeft = side === 'left';

  return (
    <motion.div
      initial={{ opacity: 0.5, width: '15rem' }}
      whileInView={{ opacity: 1, width: '30rem' }}
      transition={beamTransition}
      viewport={{ once: true, amount: 0.25 }}
      className={`absolute inset-auto top-0 h-56 overflow-visible ${
        isLeft ? 'right-1/2' : 'left-1/2'
      }`}
      style={{
        backgroundImage: isLeft
          ? 'conic-gradient(from 70deg at 50% 0%, var(--lamp-beam) 0deg, transparent 55deg, transparent 360deg)'
          : 'conic-gradient(from 290deg at 50% 0%, transparent 0deg, transparent 305deg, var(--lamp-beam) 360deg)',
      }}
      aria-hidden="true"
    >
      <div className="absolute bottom-0 left-0 z-20 h-40 w-full bg-[var(--lamp-mask)] [mask-image:linear-gradient(to_top,white,transparent)]" />
      <div
        className={`absolute bottom-0 z-20 h-full w-40 bg-[var(--lamp-side-mask)] ${
          isLeft
            ? 'left-0 [mask-image:linear-gradient(to_right,white,transparent)]'
            : 'right-0 [mask-image:linear-gradient(to_left,white,transparent)]'
        }`}
      />
    </motion.div>
  );
}

function BlurBeam({ side }) {
  const isLeft = side === 'left';

  return (
    <motion.div
      initial={{ opacity: 0.4, width: '15rem' }}
      whileInView={{ opacity: 1, width: '30rem' }}
      transition={beamTransition}
      viewport={{ once: true, amount: 0.25 }}
      className={`absolute top-0 h-56 blur-2xl ${
        isLeft
          ? 'right-1/2 bg-gradient-to-r from-[var(--lamp-glow)]/45 to-transparent dark:from-[var(--lamp-glow)]/55'
          : 'left-1/2 bg-gradient-to-l from-[var(--lamp-glow)]/45 to-transparent dark:from-[var(--lamp-glow)]/55'
      }`}
      aria-hidden="true"
    />
  );
}

export function LampContainer({ children, className = '' }) {
  return (
    <div
      className={`relative z-0 flex min-h-[28rem] w-full flex-col items-center justify-center overflow-hidden bg-[#fbfdf9] [--lamp-beam:#588157] [--lamp-glow:#6f9b74] [--lamp-mask:#fbfdf9] [--lamp-side-mask:#f0ebe0] dark:bg-[#15191b] dark:[--lamp-beam:#6f9b74] dark:[--lamp-glow:#82ad86] dark:[--lamp-mask:#15191b] dark:[--lamp-side-mask:#1d2226] sm:min-h-[32rem] ${className}`}
    >
      <div className="relative isolate z-0 flex min-h-[15rem] w-full flex-1 scale-y-125 items-center justify-center sm:min-h-[17rem]">
        <ConicBeam side="left" />
        <ConicBeam side="right" />
        <BlurBeam side="left" />
        <BlurBeam side="right" />

        <div
          className="absolute top-1/2 z-40 h-48 w-full bg-transparent opacity-10 backdrop-blur-md"
          aria-hidden="true"
        />

        <div
          className="absolute inset-auto z-40 h-36 w-[28rem] -translate-y-1/2 rounded-full bg-[var(--lamp-glow)]/40 blur-3xl dark:bg-[var(--lamp-glow)]/50"
          aria-hidden="true"
        />

        <motion.div
          initial={{ width: '10rem', opacity: 0.45 }}
          whileInView={{ width: '22rem', opacity: 1 }}
          transition={beamTransition}
          viewport={{ once: true, amount: 0.25 }}
          className="absolute inset-auto z-50 h-40 w-72 -translate-y-[7rem] rounded-full bg-[var(--lamp-glow)]/45 blur-2xl dark:bg-[var(--lamp-glow)]/55"
          aria-hidden="true"
        />

        <div
          className="absolute inset-auto z-20 h-44 w-full -translate-y-[12.5rem] bg-[var(--lamp-mask)]"
          aria-hidden="true"
        />
      </div>

      <div className="landing-desktop-shell relative z-50 -mt-24 flex w-full flex-col items-center pb-16 text-center sm:-mt-28 sm:pb-20">
        {children}
      </div>
    </div>
  );
}

export default function Lamp({ actions = null }) {
  return (
    <LampContainer>
      <h2 data-landing-reveal className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
        <span className="bg-gradient-to-br from-[#102a1b] via-[#3a5a40] to-[#588157] bg-clip-text text-transparent dark:from-slate-200 dark:via-[#d0e8d2] dark:to-[#6f9b74]">
          Start building with Filipino IT Talent
        </span>
      </h2>
      <p data-landing-reveal style={{ '--landing-part-delay': '120ms' }} className="mt-4 max-w-md text-base leading-relaxed text-[#344e41] sm:text-lg dark:text-slate-400">
        Connect, collaborate, and build projects with top developers in the Philippines.
      </p>
      {actions}
    </LampContainer>
  );
}
