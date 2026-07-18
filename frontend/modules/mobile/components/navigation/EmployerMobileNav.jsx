import { Menu, Moon, Sun, X } from 'lucide-react';
import { useState } from 'react';
import Link from '../../../../components/shared/Link';
import KapITLogo from '@sharedComponents/branding/KapITLogo';
import { useTheme } from '@sharedContext/ThemeContext';

const MOBILE_LINKS = [
  { label: 'Why KapIT', href: '/for-employers#why-kapit' },
  { label: 'How it works', href: '/for-employers#how-it-works' },
  { label: 'Hiring tools', href: '/for-employers#hiring-tools' },
  { label: 'Pricing', href: '/for-employers/pricing' },
];

export default function EmployerMobileNav({ onCreateAccount, onSignIn }) {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const isDark = theme === 'dark';

  const closeThen = (action) => {
    setMenuOpen(false);
    action?.();
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 min-[1100px]:hidden">
        <div className="flex min-h-[64px] items-center justify-between rounded-[1.5rem] border border-[#d7e2d3] bg-[#f8fbf5]/92 px-4 shadow-[0_15px_40px_rgba(35,68,45,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#131719]/92">
          <Link href="/for-employers" className="flex items-center gap-2.5" aria-label="KapIT for employers home">
            <KapITLogo className="h-10 w-10 rounded-xl border border-[#d6e1d2] bg-white p-1 dark:border-white/10" />
            <span className="text-sm font-bold tracking-[-0.03em] text-[#173225] dark:text-white">KapIT for Employers</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#cad8c6] bg-white text-[#173225] dark:border-white/10 dark:bg-white/5 dark:text-white"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#cad8c6] bg-white text-[#173225] dark:border-white/10 dark:bg-white/5 dark:text-white"
              aria-label={menuOpen ? 'Close employer menu' : 'Open employer menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 min-[1100px]:hidden">
          <button type="button" onClick={() => setMenuOpen(false)} className="absolute inset-0 bg-[#08110c]/45 backdrop-blur-sm" aria-label="Close employer menu overlay" />
          <div className="absolute inset-x-0 bottom-0 top-[5.5rem] overflow-y-auto rounded-t-[2rem] border border-[#d7e2d3] bg-[#fbfdf9] px-6 pb-8 pt-8 dark:border-white/10 dark:bg-[#131719]">
            <nav className="grid gap-1" aria-label="Employer mobile navigation">
              {MOBILE_LINKS.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center rounded-xl px-3 text-lg font-semibold text-[#173225] hover:bg-[#edf3ea] dark:text-white dark:hover:bg-white/5">
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-8 border-t border-[#dce5d9] pt-6 dark:border-white/10">
              <Link href="/" onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center rounded-xl px-3 text-base font-semibold text-[#46604d] dark:text-[#c9d2cd]">
                For IT Professionals
              </Link>
              <div className="mt-5 grid gap-3">
                {onSignIn ? (
                  <button type="button" onClick={() => closeThen(onSignIn)} className="min-h-12 rounded-full border border-[#cad8c6] bg-white px-5 font-semibold text-[#173225] dark:border-white/10 dark:bg-white/5 dark:text-white">
                    Sign in
                  </button>
                ) : (
                  <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#cad8c6] bg-white px-5 font-semibold text-[#173225] dark:border-white/10 dark:bg-white/5 dark:text-white">
                    Sign in
                  </Link>
                )}
                {onCreateAccount ? (
                  <button type="button" onClick={() => closeThen(onCreateAccount)} className="min-h-12 rounded-full bg-[#31572c] px-5 font-semibold text-white dark:bg-[#8db692] dark:text-[#102115]">
                    Create company account
                  </button>
                ) : (
                  <Link href="/auth/register?type=company" onClick={() => setMenuOpen(false)} className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#31572c] px-5 font-semibold text-white dark:bg-[#8db692] dark:text-[#102115]">
                    Create company account
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
