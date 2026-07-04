import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Moon, Sparkles, Sun } from 'lucide-react';
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

export default function PublicDesktopNav({
  onLogoClick,
  logoHref = '/',
  onSignIn,
  onGetStarted,
  signInHref = '/auth/login',
  getStartedHref = '/auth/register',
}) {
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [openDropdown, setOpenDropdown] = useState(null);
  const closeTimerRef = useRef(null);
  const navRef = useRef(null);
  const isDarkTheme = theme === 'dark';

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setOpenDropdown(null);
      closeTimerRef.current = null;
    }, 120);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleOutsidePointerDown = (event) => {
      if (!openDropdown) return;
      if (navRef.current?.contains(event.target)) return;
      setOpenDropdown(null);
    };

    window.addEventListener('pointerdown', handleOutsidePointerDown);
    return () => window.removeEventListener('pointerdown', handleOutsidePointerDown);
  }, [openDropdown]);

  useEffect(() => () => clearCloseTimer(), []);

  const brandTitleClass = isDarkTheme ? 'text-white' : 'text-[#173225]';
  const frameClass = isDarkTheme
    ? 'border-white/10 bg-[#151a1d]/84 shadow-[0_22px_70px_rgba(0,0,0,0.34)]'
    : 'border-[#d8e2d4] bg-[#f8fbf5]/88 shadow-[0_20px_56px_rgba(35,63,45,0.14)]';
  const inactiveLinkClass = isDarkTheme ? 'text-[#cfd7d2] hover:text-white' : 'text-[#335342] hover:text-[#102a1b]';
  const activeLinkClass = isDarkTheme
    ? 'border-white/10 bg-white/10 text-white'
    : 'border-[#d6e1d2] bg-white text-[#102a1b]';
  const dropdownClass = isDarkTheme
    ? 'border-white/10 bg-[#161b1f]/96 shadow-[0_24px_70px_rgba(0,0,0,0.42)]'
    : 'border-[#dbe6d7] bg-[#fcfdf9]/96 shadow-[0_24px_58px_rgba(42,76,54,0.16)]';
  const dropdownItemClass = isDarkTheme ? 'hover:bg-white/6' : 'hover:bg-[#eef5eb]';
  const dropdownIconClass = isDarkTheme
    ? 'border-white/10 bg-white/6 text-[#eef3ef]'
    : 'border-[#d6e1d2] bg-white text-[#1c4832]';
  const outlineClass = isDarkTheme ? 'border-white/10 text-[#d8dfda]' : 'border-[#cad7c4] text-[#264634]';
  const primaryButtonClass = isDarkTheme
    ? 'inline-flex min-h-[46px] items-center justify-center rounded-full bg-[#95c09b] px-5 text-sm font-semibold text-[#102115] transition-transform duration-300 hover:-translate-y-0.5'
    : 'inline-flex min-h-[46px] items-center justify-center rounded-full bg-[#163828] px-5 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5';
  const secondaryButtonClass = isDarkTheme
    ? 'inline-flex min-h-[46px] items-center justify-center rounded-full border border-white/10 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/8'
    : 'inline-flex min-h-[46px] items-center justify-center rounded-full border border-[#cad7c4] px-5 text-sm font-semibold text-[#163828] transition-colors hover:bg-white';
  const themeButtonClass = isDarkTheme
    ? 'inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white transition-colors hover:bg-white/10'
    : 'inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#d8e2d4] bg-white text-[#173225] transition-colors hover:bg-[#eef5eb]';

  const logoNode = onLogoClick ? (
    <button type="button" onClick={onLogoClick} className="group inline-flex items-center gap-3" aria-label="Back to top">
      <KapITLogo className="h-11 w-11 rounded-2xl border border-[#d6e1d2] bg-white p-1 shadow-[0_10px_24px_rgba(23,50,37,0.12)] dark:border-white/10 dark:bg-white" />
      <span className={`text-[1.15rem] font-semibold tracking-[-0.03em] ${brandTitleClass}`}>KapIT</span>
    </button>
  ) : (
    <Link href={logoHref} className="group inline-flex items-center gap-3" aria-label="Go to home">
      <KapITLogo className="h-11 w-11 rounded-2xl border border-[#d6e1d2] bg-white p-1 shadow-[0_10px_24px_rgba(23,50,37,0.12)] dark:border-white/10 dark:bg-white" />
      <span className={`text-[1.15rem] font-semibold tracking-[-0.03em] ${brandTitleClass}`}>KapIT</span>
    </Link>
  );

  return (
    <header className="fixed inset-x-0 top-0 z-50 hidden lg:block">
      <div className="mx-auto max-w-[1280px] px-6 pt-5">
        <div className={`rounded-[2rem] border px-5 py-4 backdrop-blur-xl ${frameClass}`}>
          <div className="flex items-center gap-6" ref={navRef}>
            <div className="shrink-0">{logoNode}</div>

            <nav
              className="relative flex flex-1 items-center justify-center"
              onMouseEnter={clearCloseTimer}
              onMouseLeave={scheduleClose}
            >
              <div className="flex items-center gap-3">
                {PUBLIC_NAV_LINKS.map((link) => {
                  const isActive = link.href ? pathname === link.href : openDropdown === link.label;
                  return (
                    <div key={link.label} className="relative" onMouseEnter={() => link.hasDropdown && setOpenDropdown(link.label)}>
                      <button
                        type="button"
                        onClick={() => {
                          if (link.hasDropdown) {
                            setOpenDropdown((current) => (current === link.label ? null : link.label));
                            return;
                          }
                          if (link.href) {
                            window.location.href = link.href;
                            return;
                          }
                          openPublicFooterItem(link.footerItem);
                        }}
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors ${
                          isActive ? activeLinkClass : `border-transparent ${inactiveLinkClass}`
                        }`}
                      >
                        <span>{link.label}</span>
                        {link.hasDropdown ? <ChevronDown className={`h-4 w-4 transition-transform ${openDropdown === link.label ? 'rotate-180' : ''}`} /> : null}
                      </button>
                    </div>
                  );
                })}
              </div>

              {openDropdown && PUBLIC_NAV_DROPDOWNS[openDropdown] ? (
                <div
                  className={`absolute left-1/2 top-full mt-4 w-[780px] max-w-[90vw] -translate-x-1/2 rounded-[1.75rem] border p-4 ${dropdownClass}`}
                  onMouseEnter={clearCloseTimer}
                  onMouseLeave={scheduleClose}
                >
                  <div className={`grid gap-4 ${openDropdown === 'Solutions' ? 'grid-cols-2' : 'grid-cols-[1.2fr_0.8fr]'}`}>
                    {PUBLIC_NAV_DROPDOWNS[openDropdown].map((group) => (
                      <section
                        key={group.heading}
                        className={`rounded-[1.35rem] p-4 ${isDarkTheme ? 'bg-white/[0.03]' : 'bg-[#f3f7f0]'}`}
                      >
                        <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${isDarkTheme ? 'text-[#97a39c]' : 'text-[#5b725f]'}`}>
                          {group.heading}
                        </p>
                        <div className="mt-4 space-y-2">
                          {group.items.map((item) => {
                            const ItemIcon = item.icon;
                            return (
                              <button
                                key={item.title}
                                type="button"
                                onClick={() => {
                                  openPublicFooterItem(item.footerItem);
                                  setOpenDropdown(null);
                                }}
                                className={`flex w-full items-start gap-3 rounded-[1.15rem] px-3 py-3 text-left transition-colors ${dropdownItemClass}`}
                              >
                                <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${dropdownIconClass}`}>
                                  <ItemIcon className="h-4 w-4" />
                                </span>
                                <span>
                                  <span className={`block text-sm font-semibold ${isDarkTheme ? 'text-white' : 'text-[#173225]'}`}>{item.title}</span>
                                  <span className={`mt-1 block text-sm leading-6 ${isDarkTheme ? 'text-[#c2cbc6]' : 'text-[#53705d]'}`}>{item.description}</span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    ))}

                    {openDropdown === 'Resources' ? (
                      <section className={`rounded-[1.35rem] border p-4 ${outlineClass}`}>
                        <div className="inline-flex items-center gap-2 rounded-full border border-current/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]">
                          <Sparkles className="h-3.5 w-3.5" />
                          Latest
                        </div>
                        <h3 className={`mt-4 text-xl font-semibold tracking-[-0.03em] ${isDarkTheme ? 'text-white' : 'text-[#173225]'}`}>
                          Faster support for applicants and hiring teams
                        </h3>
                        <p className={`mt-3 text-sm leading-6 ${isDarkTheme ? 'text-[#c2cbc6]' : 'text-[#53705d]'}`}>
                          Use the Help Center and pricing guides from one place while you compare plans or start onboarding.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            openPublicFooterItem('Help Center');
                            setOpenDropdown(null);
                          }}
                          className="mt-6 inline-flex rounded-full bg-[#173225] px-4 py-2 text-sm font-semibold text-white dark:bg-[#95c09b] dark:text-[#102115]"
                        >
                          Open help center
                        </button>
                      </section>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </nav>

            <div className="ml-auto flex items-center gap-3">
              {renderAction('Sign in', signInHref, onSignIn, secondaryButtonClass)}
              {renderAction('Get started', getStartedHref, onGetStarted, primaryButtonClass)}
              <button type="button" onClick={toggleTheme} className={themeButtonClass} aria-label="Toggle theme">
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
