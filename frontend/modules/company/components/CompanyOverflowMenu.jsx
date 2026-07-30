import React from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';

export default function CompanyOverflowMenu({ label, items }) {
  const [open, setOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ left: 0, top: 0 });
  const rootRef = React.useRef(null);
  const triggerRef = React.useRef(null);
  const menuRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      const insideTrigger = rootRef.current?.contains(event.target);
      const insideMenu = menuRef.current?.contains(event.target);
      if (!insideTrigger && !insideMenu) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const handleViewportChange = () => setOpen(false);

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [open]);

  const toggleMenu = () => {
    if (open) {
      setOpen(false);
      return;
    }

    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({
      left: Math.max(12, rect.right - 176),
      top: rect.bottom + 6,
    });
    setOpen(true);
  };

  const portalTarget = typeof document !== 'undefined'
    ? rootRef.current?.closest('.company-dashboard-shell') || document.body
    : null;
  const menu = open && portalTarget
    ? createPortal(
      <div
        ref={menuRef}
        className="company-overflow-menu-popover"
        role="menu"
        style={position}
      >
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              data-danger={item.danger || undefined}
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
            >
              {Icon ? <Icon aria-hidden="true" /> : null}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>,
      portalTarget,
    )
    : null;

  return (
    <div ref={rootRef} className="company-overflow-menu">
      <button
        ref={triggerRef}
        type="button"
        className="company-overflow-menu-trigger"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggleMenu}
      >
        <MoreHorizontal aria-hidden="true" />
      </button>
      {menu}
    </div>
  );
}
