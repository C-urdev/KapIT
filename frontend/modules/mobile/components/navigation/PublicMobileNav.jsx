import { useState } from 'react';
import { ChevronRight, ChevronDown, Menu, Moon, Sun, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import Link from '../../../../components/shared/Link';
import KapITLogo from '@sharedComponents/branding/KapITLogo';
import { useTheme } from '@sharedContext/ThemeContext';
import { PUBLIC_NAV_DROPDOWNS, PUBLIC_NAV_LINKS, openPublicFooterItem } from '../../../shared/components/navigation/publicNavData';

function renderAction(label, href, onClick, className) {
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {label}
      </button>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

export default function PublicMobileNav({
  onLogoClick,
  logoHref = '/',
  onSignIn,
  onGetStarted,
  signInHref = '/auth/login',
  getStartedHref = '/auth/register',
}) {
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (label) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };
  const isDarkTheme = theme === 'dark';
  const shellClass = isDarkTheme
    ? 'border-white/10 bg-[#111519]/88 shadow-[0_18px_50px_rgba(0,0,0,0.36)]'
    : 'border-[#d7e1d4] bg-[#f8fbf5]/92 shadow-[0_18px_48px_rgba(34,62,45,0.12)]';
  const panelClass = isDarkTheme
    ? 'border-white/10 bg-[#111519] text-white'
    : 'border-[#d7e1d4] bg-[#fcfdf9] text-[#102a1b]';
  const mutedClass = isDarkTheme ? 'text-[#c6cfca]' : 'text-[#4e6956]';
  const outlineButtonClass = isDarkTheme
    ? 'inline-flex min-h-[46px] items-center justify-center rounded-full border border-white/10 px-5 text-sm font-semibold text-white'
    : 'inline-flex min-h-[46px] items-center justify-center rounded-full border border-[#cad7c4] px-5 text-sm font-semibold text-[#173225]';
  const primaryButtonClass = isDarkTheme
    ? 'inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#95c09b] px-5 text-sm font-semibold text-[#102115]'
    : 'inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#173225] px-5 text-sm font-semibold text-white';

  const logoNode = onLogoClick ? (
    <button type="button" onClick={onLogoClick} className="inline-flex items-center gap-3" aria-label="Back to top">
      <KapITLogo className="h-10 w-10 rounded-2xl border border-[#d6e1d2] bg-white p-1 dark:border-white/10 dark:bg-white" />
      <span className={`text-base font-semibold tracking-[-0.03em] ${isDarkTheme ? 'text-white' : 'text-[#173225]'}`}>KapIT</span>
    </button>
  ) : (
    <Link href={logoHref} className="inline-flex items-center gap-3" aria-label="Go to home">
      <KapITLogo className="h-10 w-10 rounded-2xl border border-[#d6e1d2] bg-white p-1 dark:border-white/10 dark:bg-white" />
      <span className={`text-base font-semibold tracking-[-0.03em] ${isDarkTheme ? 'text-white' : 'text-[#173225]'}`}>KapIT</span>
    </Link>
  );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 min-[1100px]:hidden">
        <div className="px-4 pt-4">
          <div className={`flex items-center justify-between rounded-[1.75rem] border px-4 py-3 backdrop-blur-xl ${shellClass}`}>
            {logoNode}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full border ${isDarkTheme ? 'border-white/10 bg-white/6 text-white' : 'border-[#d7e1d4] bg-white text-[#173225]'}`}
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
              </button>
              <button
                type="button"
                onClick={() => setMenuOpen((current) => !current)}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full border ${isDarkTheme ? 'border-white/10 bg-white/6 text-white' : 'border-[#d7e1d4] bg-white text-[#173225]'}`}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 min-[1100px]:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[#09110d]/45 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu overlay"
          />
          <div className={`absolute inset-x-0 top-[5.5rem] bottom-0 overflow-y-auto rounded-t-[2rem] border px-6 pb-8 pt-8 ${panelClass}`}>
            <div className="flex flex-col space-y-6">
              {PUBLIC_NAV_LINKS.map((link) => {
                const isExpanded = expandedGroups[link.label];
                return (
                  <div key={link.label} className="flex flex-col border-b border-current/5 pb-6 last:border-0 last:pb-0">
                    {link.href ? (
                      <Link
                        href={link.href}
                        className={`flex items-center justify-between text-xl font-medium tracking-tight ${pathname === link.href ? 'text-[#7a9e7f] dark:text-[#95c09b]' : ''}`}
                        onClick={() => setMenuOpen(false)}
                      >
                        <span>{link.label}</span>
                      </Link>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            if (link.hasDropdown) {
                              toggleGroup(link.label);
                            } else {
                              openPublicFooterItem(link.footerItem);
                              setMenuOpen(false);
                            }
                          }}
                          className="flex w-full items-center justify-between text-left text-xl font-medium tracking-tight transition-colors hover:text-current/80"
                        >
                          <span>{link.label}</span>
                          {link.hasDropdown && (
                            <span className="text-current/40 transition-transform duration-200">
                              {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                            </span>
                          )}
                        </button>

                        {link.hasDropdown && PUBLIC_NAV_DROPDOWNS[link.label] && (
                          <div
                            className={`grid transition-all duration-300 ease-in-out ${
                              isExpanded ? 'grid-rows-[1fr] pt-6 opacity-100' : 'grid-rows-[0fr] opacity-0'
                            }`}
                          >
                            <div className="overflow-hidden">
                              <div className="space-y-8">
                                {PUBLIC_NAV_DROPDOWNS[link.label].map((group) => (
                                  <div key={group.heading}>
                                    <p className={`mb-3 text-xs font-semibold uppercase tracking-widest ${mutedClass}`}>
                                      {group.heading}
                                    </p>
                                    <div className="space-y-2">
                                      {group.items.map((item) => {
                                        const ItemIcon = item.icon;
                                        return (
                                          <button
                                            key={item.title}
                                            type="button"
                                            onClick={() => {
                                              openPublicFooterItem(item.footerItem);
                                              setMenuOpen(false);
                                            }}
                                            className={`group flex w-full items-center gap-4 rounded-2xl p-3 text-left transition-all ${
                                              isDarkTheme ? 'hover:bg-white/5' : 'hover:bg-black/5'
                                            }`}
                                          >
                                            <span
                                              className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                                                isDarkTheme
                                                  ? 'border-white/10 bg-white/5 group-hover:bg-white/10 group-hover:text-white'
                                                  : 'border-black/5 bg-black/5 group-hover:bg-black/10 group-hover:text-black'
                                              }`}
                                            >
                                              <ItemIcon className="h-5 w-5" />
                                            </span>
                                            <div>
                                              <span className="block text-[15px] font-semibold tracking-tight">{item.title}</span>
                                              <span className={`mt-0.5 block text-[13px] leading-snug ${mutedClass}`}>
                                                {item.description}
                                              </span>
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-10 grid gap-3">
              {renderAction('Sign in', signInHref, onSignIn ? () => {
                setMenuOpen(false);
                onSignIn();
              } : null, outlineButtonClass)}
              {renderAction('Get started', getStartedHref, onGetStarted ? () => {
                setMenuOpen(false);
                onGetStarted();
              } : null, primaryButtonClass)}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
