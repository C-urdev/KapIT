import React from 'react';
import { motion } from 'framer-motion';

export default function PillNavButton({
  active = false,
  onClick,
  icon: Icon,
  label,
  badgeCount = 0,
  endAdornment = null,
  variant = 'inline',
  className = '',
  labelClassName = '',
  activeLabelClassName = '',
  inactiveLabelClassName = '',
  iconClassName = '',
  activeClassName = '',
  inactiveClassName = '',
  layoutId = 'pill-nav-lamp',
  showLabel = true,
  indicatorMode = 'glow',
  type = 'button',
  ariaLabel,
  title,
  style,
}) {
  const isStacked = variant === 'stacked';
  const hasVisibleLabel = showLabel && Boolean(label);
  const showHoverLine = indicatorMode === 'line';
  const showGlow = indicatorMode !== 'line';

  const baseClasses = isStacked
    ? 'relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-[1.15rem] px-2.5 py-2 transition-all duration-200 ease-out overflow-visible'
    : hasVisibleLabel
      ? 'relative flex min-w-0 items-center gap-2.5 rounded-full px-5 py-3 transition-all duration-200 ease-out overflow-visible'
      : 'relative flex min-w-0 items-center justify-center rounded-full px-3.5 py-3 transition-all duration-200 ease-out overflow-visible';

  const activeClasses = activeClassName || (isStacked
    ? 'bg-white/55 text-[#3a5a40] shadow-[0_10px_24px_rgba(58,90,64,0.08)] dark:bg-white/10 dark:text-white'
    : 'text-white/80 dark:text-white/80');

  const inactiveClasses = inactiveClassName || (isStacked
    ? 'text-[#344e41] dark:text-white/72 hover:bg-white/60 hover:text-[#3a5a40] dark:hover:bg-white/6 dark:hover:text-white'
    : 'text-white/80 dark:text-white/80 hover:text-white dark:hover:text-white');

  const labelClasses = `${labelClassName} ${
    active ? (activeLabelClassName || 'font-semibold') : (inactiveLabelClassName || 'font-normal')
  }`.trim();

  return (
    <button
      type={type}
      onClick={onClick}
      aria-label={ariaLabel || (typeof label === 'string' ? label : undefined)}
      title={title}
      className={`${baseClasses} group ${active ? activeClasses : inactiveClasses} ${className}`.trim()}
      style={style}
    >
      {showGlow && active && (isStacked || !hasVisibleLabel) ? (
        <motion.div
          layoutId={layoutId}
          aria-hidden="true"
          className="absolute inset-0 -z-10 rounded-full bg-[#588157]/6 backdrop-blur-sm dark:bg-[#6f9b74]/12"
          initial={false}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
        />
      ) : null}

      {Icon ? (
        <span className={`relative shrink-0 ${badgeCount > 0 ? 'pr-2' : ''}`}>
          {showHoverLine ? (
            <span
              aria-hidden="true"
              className="absolute left-1/2 -top-2 h-1 w-8 -translate-x-1/2 rounded-t-full bg-current opacity-0 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:-translate-y-0.5"
            />
          ) : null}
          <Icon className={`transition-[transform,opacity] duration-200 ease-out ${isStacked ? 'h-5 w-5' : 'h-6 w-6'} ${(active && isStacked) || (active && !hasVisibleLabel) ? 'scale-[1.03]' : 'scale-100'} ${iconClassName}`} />
          {badgeCount > 0 ? (
            <span className={`absolute -top-2 min-w-[1.15rem] rounded-full bg-[#d14343] px-1 text-[10px] font-semibold leading-none text-white ${isStacked ? '-right-2' : hasVisibleLabel ? '-right-3' : '-right-2'} flex h-[1.15rem] items-center justify-center`}>
              {badgeCount > 99 ? '99+' : badgeCount}
            </span>
          ) : null}
        </span>
      ) : null}

      {hasVisibleLabel ? (
        <span className={`min-w-0 truncate text-center text-xs leading-none ${labelClasses}`}>
          {label}
        </span>
      ) : null}

      {endAdornment ? <span className="shrink-0">{endAdornment}</span> : null}
    </button>
  );
}
