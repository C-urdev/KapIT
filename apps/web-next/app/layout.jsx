import AppProviders from '../components/AppProviders';
import './globals.css';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://127.0.0.1:3000'),
  title: {
    default: 'KapIT',
    template: '%s | KapIT'
  },
  description: 'SEO-focused job marketplace for developers and companies.',
  icons: {
    icon: '/kapit-logo.png',
    shortcut: '/kapit-logo.png',
    apple: '/kapit-logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body className='bg-[#f7f6f1] text-slate-900'>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

