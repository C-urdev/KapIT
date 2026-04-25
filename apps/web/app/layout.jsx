import AppProviders from '../components/AppProviders';
import ReleaseSync from '../components/ReleaseSync';
import { cookies } from 'next/headers';
import './globals.css';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://kapit.online'),
  title: {
    default: 'KapIT',
    template: 'KapIT | %s',
  },
  description: 'SEO-focused job marketplace for developers and companies.',
  icons: {
    icon: '/kapit-logo.png',
    shortcut: '/kapit-logo.png',
    apple: '/kapit-logo.png',
  },
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const savedTheme = cookieStore.get('theme')?.value;
  const initialTheme = savedTheme === 'dark' ? 'dark' : 'light';
  const buildVersion =
    process.env.NEXT_PUBLIC_BUILD_VERSION
    || process.env.COMMIT_REF
    || process.env.DEPLOY_ID
    || 'local-dev';

  return (
    <html lang='en' className={initialTheme === 'dark' ? 'dark' : undefined}>
      <body className='bg-[#f7f6f1] text-slate-900 dark:bg-[#121416] dark:text-white'>
        <ReleaseSync currentVersion={buildVersion} />
        <AppProviders initialTheme={initialTheme}>{children}</AppProviders>
      </body>
    </html>
  );
}
