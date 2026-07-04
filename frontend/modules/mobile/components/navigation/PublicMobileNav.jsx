import { useState } from 'react';
import { ChevronRight, Menu, Moon, Sparkles, Sun, X } from 'lucide-react';
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
          <div className={`absolute inset-x-0 top-[5.5rem] bottom-0 overflow-y-auto rounded-t-[2rem] border px-4 pb-8 pt-5 ${panelClass}`}>
            <div className="rounded-[1.5rem] border border-current/10 p-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-current/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]">
                <Sparkles className="h-3.5 w-3.5" />
                Public pages
              </div>
              <p className={`mt-3 text-sm leading-6 ${mutedClass}`}>
                Switch between pricing, support, and onboarding without leaving the public site flow.
              </p>
            </div>

            <div className="mt-6 space-y-6">
              {PUBLIC_NAV_LINKS.map((link) => (
                <section key={link.label} className="rounded-[1.5rem] border border-current/10 p-4">
                  {link.href ? (
                    <Link
                      href={link.href}
                      className={`flex items-center justify-between text-base font-semibold ${pathname === link.href ? 'text-[#7a9e7f] dark:text-[#95c09b]' : ''}`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <span>{link.label}</span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          if (!link.hasDropdown) {
                            openPublicFooterItem(link.footerItem);
                            setMenuOpen(false);
                          }
                        }}
                        className="flex w-full items-center justify-between text-left text-base font-semibold"
                      >
                        <span>{link.label}</span>
                        {link.hasDropdown ? <ChevronRight className="h-4 w-4" /> : null}
                      </button>

                      {link.hasDropdown && PUBLIC_NAV_DROPDOWNS[link.label] ? (
                        <div className="mt-4 space-y-4">
                          {PUBLIC_NAV_DROPDOWNS[link.label].map((group) => (
                            <div key={group.heading}>
                              <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${mutedClass}`}>{group.heading}</p>
                              <div className="mt-2 space-y-2">
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
                                      className={`flex w-full items-start gap-3 rounded-[1.1rem] px-3 py-3 text-left ${isDarkTheme ? 'bg-white/[0.03]' : 'bg-[#f3f7f0]'}`}
                                    >
                                      <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${isDarkTheme ? 'border-white/10 bg-white/6' : 'border-[#d6e1d2] bg-white'}`}>
                                        <ItemIcon className="h-4 w-4" />
                                      </span>
                                      <span>
                                        <span className="block text-sm font-semibold">{item.title}</span>
                                        <span className={`mt-1 block text-sm leading-6 ${mutedClass}`}>{item.description}</span>
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </>
                  )}
                </section>
              ))}
            </div>

            <div className="mt-8 grid gap-3">
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
