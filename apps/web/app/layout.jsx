import AppProviders from '../components/AppProviders';
import ReleaseSync from '../components/ReleaseSync';
import Script from 'next/script';
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
  const buildVersion = process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_BUILD_VERSION || 'local-dev';

  return (
    <html lang='en'>
      <head>
        <Script
          id="suppress-event-rejections"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                function isEventLike(value) {
                  return Object.prototype.toString.call(value) === '[object Event]';
                }

                window.addEventListener('unhandledrejection', function (event) {
                  if (!isEventLike(event && event.reason)) return;
                  event.preventDefault();
                  event.stopImmediatePropagation();
                });

                window.addEventListener('error', function (event) {
                  if (!isEventLike(event && event.error)) return;
                  event.preventDefault();
                  event.stopImmediatePropagation();
                }, true);
              })();
            `,
          }}
        />
      </head>
      <body className='bg-[#f7f6f1] text-slate-900'>
        <ReleaseSync currentVersion={buildVersion} />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

