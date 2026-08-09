import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import Link from '../../../../components/shared/Link';
import KapITLogo from '@sharedComponents/branding/KapITLogo';
import { useTheme } from '@sharedContext/ThemeContext';

const EMPLOYER_LINKS = [
  { label: 'Why KapIT', href: '/for-employers#why-kapit' },
  { label: 'How it works', href: '/for-employers#how-it-works' },
  { label: 'Hiring tools', href: '/for-employers#hiring-tools' },
  { label: 'Pricing', href: '/for-employers/pricing' },
];

export default function EmployerDesktopNav({ onSignIn }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const brandTitleClass = isDark ? 'text-white' : 'text-[#344e41]';
  const brandLinkClass = isDark
    ? 'flex shrink-0 items-center gap-3.5 rounded-full py-1 pr-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8fb995]'
    : 'flex shrink-0 items-center gap-3.5 rounded-full py-1 pr-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3a5a40]';
  const logoClass = isDark
    ? 'h-11 w-11 rounded-xl border border-white/10 bg-white object-contain p-1 shadow-[0_12px_24px_rgba(0,0,0,0.24)]'
    : 'h-11 w-11 rounded-xl border border-[#d7e2ce] bg-white object-contain p-1 shadow-[0_12px_24px_rgba(58,90,64,0.16)]';
  const employerBadgeClass = isDark
    ? 'rounded-full bg-white/8 px-3 py-1 text-xs font-semibold text-[#b9d5bc]'
    : 'rounded-full bg-[#e5efe2] px-3 py-1 text-xs font-semibold text-[#456247]';
  const navLinkClass = isDark
    ? 'rounded-full border border-transparent px-4 py-2.5 text-[0.98rem] font-medium text-[#d0d7dd] transition-[background-color,border-color,box-shadow,color,transform] duration-300 hover:border-white/10 hover:bg-[#202428]/90 hover:text-white hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_22px_rgba(0,0,0,0.24)] hover:backdrop-blur-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8fb995] active:translate-y-0 active:scale-[0.98]'
    : 'rounded-full border border-transparent px-4 py-2.5 text-[0.98rem] font-medium text-[#344e41] transition-[background-color,border-color,box-shadow,color,transform] duration-300 hover:border-[#dce6d4] hover:bg-white/86 hover:text-[#102a1b] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_22px_rgba(58,90,64,0.13)] hover:backdrop-blur-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3a5a40] active:translate-y-0 active:scale-[0.98]';

  return (
    <header className="fixed inset-x-0 top-0 z-50 pb-2 pt-5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] lg:pt-6">
      <div className={`absolute inset-0 -z-10 transition-all duration-500 ${isScrolled ? 'bg-[#FDFBF7]/60 backdrop-blur-xl dark:bg-[#181a1b]/60' : 'bg-transparent backdrop-blur-none'}`} />

      <div className="landing-desktop-shell relative flex items-center gap-5 lg:gap-8">
        <Link href="/for-employers" className={brandLinkClass} aria-label="KapIT for employers home">
          <KapITLogo className={logoClass} />
          <span className={`text-[1.24rem] font-bold tracking-[-0.035em] ${brandTitleClass}`}>KapIT</span>
          <span className={employerBadgeClass}>For Employers</span>
        </Link>

        <nav className="flex min-w-0 flex-1 items-center justify-center gap-4" aria-label="Employer landing navigation">
          {EMPLOYER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={navLinkClass}
              style={{ fontFamily: 'var(--font-desktop)' }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2.5 lg:gap-3">
          <Link href="/" className={navLinkClass} style={{ fontFamily: 'var(--font-desktop)' }}>
            For IT Professionals
          </Link>
          {onSignIn ? (
            <button
              type="button"
              onClick={onSignIn}
              className="min-h-11 rounded-full border border-[#31572c] bg-[#31572c] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(49,87,44,0.22)] transition-[background-color,transform] duration-200 hover:bg-[#274723] active:scale-[0.98] dark:border-[#8db692] dark:bg-[#8db692] dark:text-[#102115] dark:hover:bg-[#9fc6a4]"
            >
              Sign in
            </button>
          ) : (
            <Link
              href="/for-employers?login=1"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#31572c] bg-[#31572c] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(49,87,44,0.22)] transition-[background-color,transform] duration-200 hover:bg-[#274723] active:scale-[0.98] dark:border-[#8db692] dark:bg-[#8db692] dark:text-[#102115] dark:hover:bg-[#9fc6a4]"
            >
              Sign in
            </Link>
          )}
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#cad8c6] bg-white/70 text-[#173225] transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/8"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>
    </header>
  );
}
