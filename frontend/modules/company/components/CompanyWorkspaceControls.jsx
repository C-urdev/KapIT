import React from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, Check, ChevronDown } from 'lucide-react';

export function CompanyPeriodControl({ value, options, onChange, label = 'Period' }) {
  return (
    <div className="company-workspace-period-control" aria-label={label}>
      <span className="company-workspace-period-label">{label}</span>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          data-active={value === option.value}
          aria-pressed={value === option.value}
          className="company-workspace-period-option"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function CompanyPeriodSelect({ value, options, onChange, label = 'Date range' }) {
  const [open, setOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ left: 0, top: 0 });
  const rootRef = React.useRef(null);
  const triggerRef = React.useRef(null);
  const menuRef = React.useRef(null);
  const selectedOption = options.find((option) => option.value === value) || options[0];

  const openMenu = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const menuWidth = 184;
    const menuHeight = options.length * 40 + 12;
    const viewportRight = window.innerWidth - 12;
    const belowTop = rect.bottom + 6;
    setPosition({
      left: Math.max(12, Math.min(rect.right - menuWidth, viewportRight - menuWidth)),
      top: belowTop + menuHeight > window.innerHeight - 12
        ? Math.max(12, rect.top - menuHeight - 6)
        : belowTop,
    });
    setOpen(true);
  };

  React.useEffect(() => {
    if (!open) return undefined;

    const focusOption = (index) => {
      const items = Array.from(menuRef.current?.querySelectorAll('[role="menuitemradio"]') || []);
      if (!items.length) return;
      items[(index + items.length) % items.length]?.focus();
    };
    const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
    const focusFrame = window.requestAnimationFrame(() => focusOption(selectedIndex));

    const handlePointerDown = (event) => {
      const insideTrigger = rootRef.current?.contains(event.target);
      const insideMenu = menuRef.current?.contains(event.target);
      if (!insideTrigger && !insideMenu) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      const items = Array.from(menuRef.current?.querySelectorAll('[role="menuitemradio"]') || []);
      const currentIndex = Math.max(0, items.indexOf(document.activeElement));
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        focusOption(currentIndex + 1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        focusOption(currentIndex - 1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        focusOption(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        focusOption(items.length - 1);
      }
    };
    const handleViewportChange = () => setOpen(false);

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [open, options, value]);

  const selectOption = (option) => {
    onChange(option.value);
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const portalTarget = typeof document !== 'undefined'
    ? rootRef.current?.closest('.company-dashboard-shell') || document.body
    : null;
  const menu = open && portalTarget
    ? createPortal(
      <div
        ref={menuRef}
        className="company-workspace-period-menu-popover"
        role="menu"
        aria-label={label}
        style={position}
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="menuitemradio"
              aria-checked={selected}
              data-selected={selected || undefined}
              onClick={() => selectOption(option)}
            >
              <span>{option.label}</span>
              {selected ? <Check aria-hidden="true" /> : <span aria-hidden="true" />}
            </button>
          );
        })}
      </div>,
      portalTarget,
    )
    : null;

  return (
    <div ref={rootRef} className="company-workspace-period-select">
      <button
        ref={triggerRef}
        type="button"
        className="company-workspace-period-select-trigger"
        data-open={open}
        aria-label={`${label}: ${selectedOption?.label || ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          if (open) setOpen(false);
          else openMenu();
        }}
        onKeyDown={(event) => {
          if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
            event.preventDefault();
            openMenu();
          }
        }}
      >
        <CalendarDays aria-hidden="true" />
        <span>{selectedOption?.label || label}</span>
        <ChevronDown className="company-workspace-period-select-chevron" aria-hidden="true" />
      </button>
      {menu}
    </div>
  );
}

export function CompanySegmentedControl({ label, value, options, onChange }) {
  return (
    <div className="company-workspace-segmented-control" role="group" aria-label={label}>
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            data-active={value === option.value}
            aria-pressed={value === option.value}
            className="company-workspace-segmented-option"
          >
            {Icon ? <Icon aria-hidden="true" /> : null}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function CompanyStatStrip({ metrics, loading = false }) {
  return (
    <section className="company-workspace-stat-strip" aria-label="Workspace metrics">
      {metrics.map((metric) => (
        <article key={metric.label} className="company-workspace-stat-cell company-stat-enter">
          {metric.icon ? (
            <div className="company-workspace-stat-icon">{metric.icon}</div>
          ) : null}
          <p className="company-workspace-stat-label">{metric.label}</p>
          <p className="company-workspace-stat-value">{loading ? '-' : metric.value}</p>
          {metric.trend && !loading ? (
            <p className="company-workspace-stat-trend" data-direction={metric.trend.direction}>
              <span>{metric.trend.direction === 'up' ? '↑' : metric.trend.direction === 'down' ? '↓' : '→'}</span>
              <span>{metric.trend.label}</span>
            </p>
          ) : null}
          {metric.sublabel ? <p className="company-workspace-stat-copy">{metric.sublabel}</p> : null}
        </article>
      ))}
    </section>
  );
}
