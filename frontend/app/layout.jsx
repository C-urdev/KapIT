import AppProviders from '../components/AppProviders';
import ReleaseSync from '../components/ReleaseSync';
import {
  getSiteUrl,
  SEO_DEFAULT_DESCRIPTION,
  SEO_DEFAULT_IMAGE_PATH,
  SEO_DEFAULT_KEYWORDS,
  SEO_DEFAULT_TITLE,
  SEO_SITE_NAME,
} from '../lib/seo';
import { cookies } from 'next/headers';
import './globals.css';

const siteUrl = getSiteUrl();

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: SEO_DEFAULT_TITLE,
    template: `${SEO_SITE_NAME} | %s`,
  },
  description: SEO_DEFAULT_DESCRIPTION,
  keywords: SEO_DEFAULT_KEYWORDS,
  applicationName: SEO_SITE_NAME,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: SEO_SITE_NAME,
    title: SEO_DEFAULT_TITLE,
    description: SEO_DEFAULT_DESCRIPTION,
    images: [SEO_DEFAULT_IMAGE_PATH],
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO_DEFAULT_TITLE,
    description: SEO_DEFAULT_DESCRIPTION,
    images: [SEO_DEFAULT_IMAGE_PATH],
  },
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
