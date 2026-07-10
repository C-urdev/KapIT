import React from 'react';

function GuideSparkGlyph({ className, variant = 'light' }) {
  const isOnGreen = variant === 'on-green';
  const bubbleStroke = isOnGreen ? 'rgba(253,251,247,0.92)' : variant === 'dark' ? '#b8d4bb' : '#3a5a40';
  const linePrimary = isOnGreen ? '#fdfbf7' : variant === 'dark' ? '#d8ead9' : '#588157';
  const lineSecondary = isOnGreen ? 'rgba(253,251,247,0.62)' : variant === 'dark' ? 'rgba(216,234,217,0.55)' : 'rgba(88,129,87,0.55)';
  const spark = isOnGreen ? '#edf6ea' : variant === 'dark' ? '#9fd3a6' : '#6f9b74';

  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M6.25 7.75h11.5a2.35 2.35 0 0 1 2.35 2.35v5.55a2.35 2.35 0 0 1-2.35 2.35H11.1l-3.35 2.65v-2.65H6.25a2.35 2.35 0 0 1-2.35-2.35v-5.55a2.35 2.35 0 0 1 2.35-2.35z"
        stroke={bubbleStroke}
        strokeWidth="1.45"
        strokeLinejoin="round"
      />
      <path d="M8.6 12.05h6.8" stroke={linePrimary} strokeWidth="1.65" strokeLinecap="round" />
      <path d="M8.6 15.05h4.35" stroke={lineSecondary} strokeWidth="1.65" strokeLinecap="round" />
      <path
        d="M17.15 8.15l.55.95.95.55-.95.55-.55.95-.55-.95-.95-.55.95-.55.55-.95z"
        fill={spark}
      />
    </svg>
  );
}

export default function ChatbotBrandMark({ size = 'md', showStatus = true, isDark = false, emphasis = false, shell = 'default' }) {
  const isLarge = size === 'lg';
  const isCompact = size === 'xs';
  const isShellless = shell === 'none';
  const shellClass = isLarge
    ? 'h-10 w-10 rounded-full'
    : isCompact
      ? 'h-5 w-5 rounded-full'
      : 'h-10 w-10 rounded-full';
  const glyphClass = isLarge
    ? 'h-6 w-6'
    : isCompact
      ? 'h-3 w-3'
      : 'h-[1.35rem] w-[1.35rem]';
  const useGreenShell = emphasis;

  const shellStyles = isCompact
    ? isDark
      ? 'border-white/10 bg-[#2a2f35]'
      : 'border-[#dce6d4] bg-[#f6faf4]'
    : useGreenShell
    ? isDark
      ? 'border-[#8fbd92]/25 bg-[#3d5a42] shadow-[0_14px_34px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.12)]'
      : 'border-[#2f4a36]/10 bg-[#3a5a40] shadow-[0_14px_34px_rgba(58,90,64,0.22),inset_0_1px_0_rgba(255,255,255,0.14)]'
    : isDark
      ? 'border-white/10 bg-[#202428]/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_24px_rgba(0,0,0,0.28)]'
      : 'border-[#d7e2ce] bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_10px_24px_rgba(58,90,64,0.12)]';

  const glyphVariant = useGreenShell ? 'on-green' : isDark ? 'dark' : 'light';
  const statusBorder = useGreenShell
    ? isDark
      ? 'border-[#3d5a42]'
      : 'border-[#3a5a40]'
    : isDark
      ? 'border-[#202428]'
      : 'border-white';

  if (isShellless) {
    return <GuideSparkGlyph className={glyphClass} variant={glyphVariant} />;
  }

  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center border ${shellClass} ${shellStyles}`}>
      <GuideSparkGlyph className={glyphClass} variant={glyphVariant} />
      {showStatus && !isCompact ? (
        <span
          className={`absolute bottom-0 right-0 h-2.5 w-2.5 translate-x-0.5 translate-y-0.5 rounded-full border-2 bg-[#8fd095] ${statusBorder}`}
          aria-hidden="true"
        />
      ) : null}
    </span>
  );
}
