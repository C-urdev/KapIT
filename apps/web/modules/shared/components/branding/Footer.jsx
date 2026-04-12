import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';

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
    items: ['Email', 'Facebook', 'support@kapit.dev'],
  },
];

const FOOTER_INFO = {
  'What is KapIT?':
    'KapIT is a marketplace that helps companies discover Filipino IT graduates and developers while giving talent a place to showcase portfolios, skills, and project-ready work.',
  Careers:
    'KapIT is focused on helping Filipino tech talent connect with companies, internships, freelance work, and early-career opportunities through one platform.',
  Press:
    'KapIT highlights stories, launches, and platform updates centered on Filipino IT talent, hiring, and portfolio-driven discovery.',
  'Create profile':
    'Developers can create a profile to present their skills, background, and strengths to companies looking for verified IT talent.',
  Portfolios:
    'KapIT lets developers showcase portfolio pieces, capstone work, and technical projects so companies can review proof of work before reaching out.',
  Projects:
    'Developers can use KapIT to share projects and practical work that make their experience easier for companies and collaborators to evaluate.',
  'Find talent':
    'Companies can browse KapIT to discover Filipino developers and IT professionals based on skills, portfolios, and role fit.',
  'Post projects':
    'Hiring teams can post IT projects or role requirements to attract developers whose work and profiles match their needs.',
  Pricing:
    'KapIT supports company hiring workflows and premium options, including pricing-related features for businesses using the platform at scale.',
  'Help Center':
    'The Help Center is for guidance on using KapIT, from setting up profiles to finding talent and understanding the platform experience.',
  Safety:
    'KapIT promotes safer hiring and collaboration by encouraging clear profiles, visible portfolios, and trustworthy platform interactions.',
  Community:
    'KapIT supports a growing community of Filipino IT graduates, developers, and companies building connections through real work and opportunities.',
  Email:
    'You can reach KapIT through email for general platform questions, hiring concerns, onboarding help, and account-related concerns.',
  Facebook:
    'KapIT uses Facebook to share updates, announcements, and community-facing information for users who follow the platform there.',
  'support@kapit.dev':
    'Use support@kapit.dev for account help, platform questions, and assistance with developer or company workflows on KapIT.',
};

export default function Footer() {
  const [selectedItem, setSelectedItem] = useState(null);
  const selectedDescription = useMemo(() => FOOTER_INFO[selectedItem] ?? '', [selectedItem]);

  return (
    <footer className="relative bg-white dark:bg-[#0a1628]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#b8ad94] to-transparent opacity-95 shadow-[0_1px_0_rgba(255,255,255,0.45)] dark:via-[#6d95c5] dark:shadow-[0_1px_0_rgba(12,24,40,0.7)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto w-full max-w-[min(100%,1800px)] px-4 sm:px-5 lg:px-6 xl:px-7 2xl:px-9 py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <div className="text-xl font-bold text-[#3a5a40] dark:text-white">KapIT</div>
            <p className="mt-3 text-sm leading-relaxed text-[#344e41] dark:text-[#b8d4e8]">
              A modern marketplace for connecting Filipino IT graduates and developers with companies and clients.
            </p>
          </div>

          {SECTIONS.map((section) => (
            <div key={section.title} className="space-y-3">
              <div className="text-sm font-semibold text-[#3a5a40] dark:text-white">{section.title}</div>
              <ul className="space-y-2">
                {section.items.map((item) => {
                  const isActive = selectedItem === item;

                  return (
                    <li key={item}>
                      <button
                        type="button"
                        onClick={() => setSelectedItem((currentItem) => (currentItem === item ? null : item))}
                        className={`text-left text-sm transition-colors ${
                          isActive
                            ? 'font-semibold text-[#3a5a40] dark:text-white'
                            : 'text-[#344e41] dark:text-[#b8d4e8] hover:text-[#3a5a40] dark:hover:text-white'
                        }`}
                        aria-pressed={isActive}
                      >
                        {item}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="relative mt-10 pt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#b8ad94] to-transparent opacity-95 shadow-[0_1px_0_rgba(255,255,255,0.45)] dark:via-[#6d95c5] dark:shadow-[0_1px_0_rgba(12,24,40,0.7)]"
              aria-hidden="true"
            />
          <p className="text-xs text-[#344e41] dark:text-[#b8d4e8]">© {new Date().getFullYear()} KapIT. All rights reserved.</p>
          <p className="text-xs text-[#344e41] dark:text-[#b8d4e8]">KapIT - Empowering Filipino IT Talent</p>
        </div>

        {selectedItem ? (
          <div className="pointer-events-none absolute inset-x-4 bottom-16 z-20 sm:inset-x-auto sm:right-6 lg:right-8 2xl:right-12">
            <div className="pointer-events-auto ml-auto w-full max-w-xl rounded-2xl border border-[#a3b18a]/70 bg-[#f8f8f4]/98 px-5 py-5 shadow-[0_18px_45px_rgba(16,42,27,0.12)] backdrop-blur dark:border-[#1e3a5f] dark:bg-[#0f2139]/98 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h4 className="text-lg font-bold text-[#102a1b] dark:text-white">{selectedItem}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-[#344e41] dark:text-[#b8d4e8] sm:text-base">
                    {selectedDescription}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="shrink-0 text-[#344e41] hover:text-[#102a1b] dark:text-[#b8d4e8] dark:hover:text-white"
                  aria-label="Close footer info"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </footer>
  );
}
