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
    items: ['Help Center', 'Safety', 'Community', 'FAQ'],
  },
  {
    title: 'Contact',
    items: ['Email', 'Facebook', 'support@kapit.dev'],
  },
];

const FOOTER_INFO = {
  'What is KapIT?':
    'KapIT is a digital platform that connects Filipino IT graduates and professionals with verified local and international job opportunities. It uses smart job matching, ATS-optimized resumes, and skill matching to improve hiring efficiency. With features like ghost job prevention and application tracking, KapIT ensures a transparent and reliable job search experience for both applicants and employers.',
  Careers:
    'KapIT offers opportunities for individuals interested in contributing to a growing tech platform focused on improving job accessibility. Roles may include software development, quality assurance, marketing, and customer support. The team values collaboration, innovation, and user-centered solutions. Interested applicants may submit their profiles through KapIT or reach out via official contact channels for internships or future openings.',
  Press:
    'KapIT is a developing platform aimed at addressing the challenges faced by Filipino IT graduates. It focuses on improving job matching accuracy and reducing issues like outdated or inactive listings. For media inquiries, collaborations, or feature requests, interested parties may contact KapIT through its official communication channels.',
  'Create profile':
    'Developers can create a profile by adding their skills, experience, education, and certifications. A complete profile helps KapIT’s system match users with relevant job opportunities based on qualifications and preferences.',
  Portfolios:
    'Users can showcase their projects, code samples, and designs through their profile. A strong portfolio increases visibility and improves chances of being selected by employers.',
  Projects:
    'Developers can apply to job postings and project-based opportunities. They can also display completed or ongoing projects, allowing employers to assess their skills and experience.',
  'Find talent':
    'Employers can search for candidates using smart filtering tools and skill-based matching. KapIT ranks applicants based on how well their profiles match job requirements, helping companies identify suitable candidates efficiently.',
  'Post projects':
    'Companies can create job listings by setting up a company profile, adding job details, and defining required skills. KapIT uses a pay-per-use job posting model, and employers have the option to re-open listings when needed to attract more applicants.',
  Pricing:
    'KapIT offers a Free plan that allows basic access to job postings and applications. Premium features for users include priority job access, advanced filtering, ATS-optimized resumes, skill matching percentage, and application tracking. Employers can pay per job post and access additional tools like candidate ranking and enhanced visibility.',
  'Help Center':
    'The Help Center provides answers to frequently asked questions about account setup, job applications, profiles, and platform features. It guides both applicants and employers in using KapIT effectively.',
  Safety:
    'KapIT promotes a safe and reliable platform through ghost job prevention, which helps detect inactive or outdated job listings. It also ensures that only user-provided information is shared with employers and maintains responsible data handling practices.',
  Community:
    'KapIT supports a growing community of Filipino IT professionals and employers. The platform encourages collaboration by allowing users to share experiences, showcase projects, and engage with opportunities. As the platform grows, KapIT aims to support discussions, networking, and potential events that promote learning, career growth, and connection within the IT industry.',
  FAQ: {
    intro: 'Frequently asked questions about using KapIT:',
    items: [
      {
        question: 'Do I need premium to apply for jobs?',
        answer: 'No. Free users can still apply for jobs.',
      },
      {
        question: 'Can I edit my profile after applying?',
        answer: 'Yes. You can update your profile any time.',
      },
      {
        question: 'Is my personal data safe?',
        answer: 'KapIT only shares information you choose to include in your profile and applications.',
      },
      {
        question: 'How do companies find candidates?',
        answer: 'Employers use search, filters, and matching tools to shortlist profiles.',
      },
    ],
  },
  Email:
    'For general inquiries and concerns: info@kapit.dev. For partnerships and business-related concerns: business@kapit.dev.',
  Facebook:
    'Official Facebook Page: https://www.facebook.com/share/1E8xGVR69x/?mibextid=wwXlfr. This page is used for updates, announcements, and user engagement.',
  'support@kapit.dev':
    'This is the main support email of KapIT. Users can contact this email for assistance with account issues, technical problems, job application concerns, or any platform-related questions. The support team aims to respond promptly and help resolve issues efficiently.',
};

export default function Footer() {
  const [selectedItem, setSelectedItem] = useState(null);
  const selectedInfo = useMemo(() => FOOTER_INFO[selectedItem] ?? '', [selectedItem]);
  const isStructuredInfo = Boolean(selectedInfo && typeof selectedInfo === 'object' && Array.isArray(selectedInfo.items));

  return (
    <footer className="relative bg-white dark:bg-[#121416]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#b8ad94] to-transparent opacity-95 shadow-[0_1px_0_rgba(255,255,255,0.45)] dark:via-[#5b6672] dark:shadow-[0_1px_0_rgba(10,14,18,0.75)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto w-full max-w-[min(100%,1800px)] px-4 sm:px-5 lg:px-6 xl:px-7 2xl:px-9 py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <div className="text-xl font-bold text-[#3a5a40] dark:text-white">KapIT</div>
            <p className="mt-3 text-sm leading-relaxed text-[#344e41] dark:text-[#d0d7dd]">
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
                            : 'text-[#344e41] dark:text-[#d0d7dd] hover:text-[#3a5a40] dark:hover:text-white'
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
              className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#b8ad94] to-transparent opacity-95 shadow-[0_1px_0_rgba(255,255,255,0.45)] dark:via-[#5b6672] dark:shadow-[0_1px_0_rgba(10,14,18,0.75)]"
              aria-hidden="true"
            />
          <p className="text-xs text-[#344e41] dark:text-[#d0d7dd]">© {new Date().getFullYear()} KapIT. All rights reserved.</p>
          <p className="text-xs text-[#344e41] dark:text-[#d0d7dd]">KapIT - Empowering Filipino IT Talent</p>
        </div>

        {selectedItem ? (
          <div className="pointer-events-none absolute inset-x-4 bottom-16 z-20 sm:inset-x-auto sm:right-6 lg:right-8 2xl:right-12">
            <div className="pointer-events-auto ml-auto w-full max-w-xl rounded-2xl border border-[#a3b18a]/70 bg-[#f8f8f4]/98 px-5 py-5 shadow-[0_18px_45px_rgba(16,42,27,0.12)] backdrop-blur dark:border-[#353c44] dark:bg-[#1a1d20]/98 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h4 className="text-lg font-bold text-[#102a1b] dark:text-white">{selectedItem}</h4>
                  {isStructuredInfo ? (
                    <div className="mt-2 space-y-3 text-sm text-[#344e41] dark:text-[#d0d7dd] sm:text-base">
                      {selectedInfo.intro ? <p className="leading-relaxed">{selectedInfo.intro}</p> : null}
                      <ul className="space-y-2.5">
                        {selectedInfo.items.map((entry) => (
                          <li
                            key={entry.question}
                            className="rounded-lg bg-white/5 px-3 py-2 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] dark:bg-white/5"
                          >
                            <p className="font-semibold text-[#1f3a2a] dark:text-white">{entry.question}</p>
                            <p className="mt-1 leading-relaxed">{entry.answer}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm leading-relaxed text-[#344e41] dark:text-[#d0d7dd] sm:text-base">
                      {selectedInfo}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="shrink-0 text-[#344e41] hover:text-[#102a1b] dark:text-[#d0d7dd] dark:hover:text-white"
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
