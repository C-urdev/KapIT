import { Moon, Sun } from 'lucide-react';
import Link from '../../../../components/shared/Link';
import KapITLogo from '@sharedComponents/branding/KapITLogo';
import { useTheme } from '@sharedContext/ThemeContext';

const EMPLOYER_LINKS = [
  { label: 'Why KapIT', href: '#why-kapit' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Hiring tools', href: '#hiring-tools' },
  { label: 'Pricing', href: '#employer-pricing' },
];

export default function EmployerDesktopNav({ onCreateAccount, onSignIn }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-5 pt-5">
      <div className="mx-auto flex min-h-[68px] max-w-[1400px] items-center gap-7 rounded-full border border-[#d8e4d5] bg-[#f8fbf5]/90 px-5 shadow-[0_16px_45px_rgba(35,68,45,0.11)] backdrop-blur-xl dark:border-white/10 dark:bg-[#15191b]/90 dark:shadow-[0_16px_45px_rgba(0,0,0,0.28)]">
        <Link href="/for-employers" className="flex shrink-0 items-center gap-3" aria-label="KapIT for employers home">
          <KapITLogo className="h-10 w-10 rounded-xl border border-[#d6e1d2] bg-white p-1 dark:border-white/10" />
          <span className="text-[1.08rem] font-bold tracking-[-0.035em] text-[#173225] dark:text-white">KapIT</span>
          <span className="rounded-full bg-[#e5efe2] px-3 py-1 text-xs font-semibold text-[#456247] dark:bg-white/8 dark:text-[#b9d5bc]">For Employers</span>
        </Link>

        <nav className="flex min-w-0 flex-1 items-center justify-center gap-1" aria-label="Employer landing navigation">
          {EMPLOYER_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-sm font-semibold text-[#46604d] transition-[background-color,color] duration-200 hover:bg-[#eaf1e7] hover:text-[#173225] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#588157] dark:text-[#c9d2cd] dark:hover:bg-white/6 dark:hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link href="/" className="rounded-full px-3 py-2 text-sm font-semibold text-[#46604d] hover:text-[#173225] dark:text-[#c9d2cd] dark:hover:text-white">
            For IT Professionals
          </Link>
          <button
            type="button"
            onClick={onSignIn}
            className="min-h-11 rounded-full border border-[#cad8c6] bg-white/70 px-4 text-sm font-semibold text-[#173225] transition-[background-color,transform] duration-200 hover:bg-white active:scale-[0.98] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/8"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#cad8c6] bg-white/70 text-[#173225] transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/8"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>
          <button
            type="button"
            onClick={onCreateAccount}
            className="min-h-11 whitespace-nowrap rounded-full bg-[#31572c] px-5 text-sm font-semibold text-white shadow-[0_12px_25px_rgba(49,87,44,0.23)] transition-[background-color,transform] duration-200 hover:bg-[#274823] active:scale-[0.98] dark:bg-[#8db692] dark:text-[#102115] dark:hover:bg-[#9bc49f]"
          >
            Create company account
          </button>
        </div>
      </div>
    </header>
  );
}
