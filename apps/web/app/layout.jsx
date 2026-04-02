import AppProviders from '../components/AppProviders';
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
                  console.error('Suppressed early unhandled Event rejection:', event.reason);
                });

                window.addEventListener('error', function (event) {
                  if (!isEventLike(event && event.error)) return;
                  event.preventDefault();
                  event.stopImmediatePropagation();
                  console.error('Suppressed early Event error:', event.error);
                }, true);
              })();
            `,
          }}
        />
      </head>
      <body className='bg-[#f7f6f1] text-slate-900'>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

