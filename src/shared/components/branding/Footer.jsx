import React from 'react';

const SECTIONS = [
  {
    title: 'About',
    items: ['What is KapIT?', 'Careers', 'Press'],
  },
  {
    title: 'Developers',
    items: ['Create profile', 'Portfolios', 'Projects'],
  },
  {
    title: 'Companies',
    items: ['Find talent', 'Post projects', 'Pricing'],
  },
  {
    title: 'Resources',
    items: ['Help Center', 'Safety', 'Community'],
  },
  {
    title: 'Contact',
    items: ['support@kapit.dev', 'Facebook', 'LinkedIn'],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#0a1628]">
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <div className="text-xl font-bold text-[#3a5a40] dark:text-white">KapIT</div>
            <p className="mt-3 text-sm text-[#344e41] dark:text-[#b8d4e8] leading-relaxed">
              A modern marketplace for connecting Filipino IT graduates and developers with companies and clients.
            </p>
          </div>

          {SECTIONS.map((section) => (
            <div key={section.title} className="space-y-3">
              <div className="text-sm font-semibold text-[#3a5a40] dark:text-white">{section.title}</div>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li
                    key={item}
                    className="text-sm text-[#344e41] dark:text-[#b8d4e8] hover:text-[#3a5a40] dark:hover:text-white transition-colors"
                  >
                    <button type="button" className="text-left">
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-8 border-t border-[#a3b18a]/70 dark:border-[#1e3a5f] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#344e41] dark:text-[#b8d4e8]">© {new Date().getFullYear()} KapIT. All rights reserved.</p>
          <p className="text-xs text-[#344e41] dark:text-[#b8d4e8]">KapIT — Empowering Filipino IT Talent 🇵🇭</p>
        </div>
      </div>
    </footer>
  );
}




