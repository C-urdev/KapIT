import React from 'react';
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CircleHelp,
  FileCheck2,
  HeartHandshake,
  MapPin,
  Settings,
  Sparkles,
} from 'lucide-react';

const APPLICATION_COLUMNS = [
  {
    id: 'applied',
    label: 'Applied (2)',
    items: [
      {
        company: 'Zendesk',
        role: 'Customer Success Lead',
        location: 'Remote',
        activity: 'Last activity just now',
        note: 'Swipe Right',
        appliedAt: 'Applied just now',
        badge: 'AI Applying',
        badgeClassName:
          'bg-[#2f7d69]/12 text-[#1f6a57] ring-[#2f7d69]/15 dark:bg-[#1d3f35] dark:text-[#9fe1cb] dark:ring-[#9fe1cb]/10',
      },
      {
        company: 'Faire',
        role: 'Staff Backend Engineer',
        location: 'Remote',
        activity: 'Last activity 2 months ago',
        note: 'Email Received',
        appliedAt: 'Applied 2 months ago',
        badge: 'Awaiting Response',
        badgeClassName:
          'bg-[#def7ea] text-[#1a8b5b] ring-[#b8eccf] dark:bg-[#1d3b30] dark:text-[#9fe1cb] dark:ring-[#9fe1cb]/10',
      },
    ],
  },
  {
    id: 'interview',
    label: 'Interview (1)',
    items: [
      {
        company: 'Notion',
        role: 'Product Designer',
        location: 'San Francisco, CA',
        activity: 'Last activity 5 days ago',
        note: 'Interview Scheduled',
        appliedAt: 'Applied 2 weeks ago',
        badge: 'Interview',
        badgeClassName:
          'bg-[#f4e7ff] text-[#8f39d8] ring-[#ebd6ff] dark:bg-[#352047] dark:text-[#d4a8ff] dark:ring-[#d4a8ff]/10',
      },
    ],
  },
  {
    id: 'result',
    label: 'Result (1)',
    items: [
      {
        company: 'HubSpot',
        role: 'Product Manager',
        location: 'Remote',
        activity: 'Last activity 2 days ago',
        note: 'Email Received',
        appliedAt: 'Applied 3 weeks ago',
        badge: 'Offer',
        badgeClassName:
          'bg-[#e7ecff] text-[#4b64ff] ring-[#d7deff] dark:bg-[#1e284f] dark:text-[#adc0ff] dark:ring-[#adc0ff]/10',
      },
    ],
  },
];

const COMPANY_MONOGRAMS = {
  Zendesk: 'Z',
  Faire: 'F',
  Notion: 'N',
  HubSpot: 'H',
};

const COMPANY_TILE_CLASSNAMES = {
  Zendesk: 'bg-[#16120f] text-white',
  Faire: 'bg-[#090909] text-white',
  Notion: 'bg-white text-[#141414] ring-1 ring-[#141414]/20',
  HubSpot: 'bg-[#ff6b47] text-white',
};

function CompanyBadge({ company }) {
  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-semibold shadow-sm ${
        COMPANY_TILE_CLASSNAMES[company] || 'bg-[#264b3f] text-white'
      }`}
    >
      {COMPANY_MONOGRAMS[company] || company.slice(0, 1)}
    </div>
  );
}

function ApplicationCard({ item }) {
  return (
    <article className="rounded-[1.15rem] border border-[#dbe7df] bg-white/92 p-3.5 shadow-[0_18px_30px_rgba(22,53,43,0.06)] dark:border-white/10 dark:bg-[#17201c]/88">
      <div className="flex items-start gap-3">
        <CompanyBadge company={item.company} />
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-[0.86rem] font-semibold leading-tight text-[#17261d] dark:text-white">
            {item.role}
          </h4>
          <p className="mt-1 truncate text-[0.72rem] text-[#526258] dark:text-[#b9c4bd]">
            {item.company}
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-2.5 text-[0.67rem] text-[#49584f] dark:text-[#b2beb6]">
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#6c7e74]" />
          <span>{item.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#6c7e74]" />
          <span>{item.activity}</span>
        </div>
        <div className="pl-[1.35rem] text-[#8b9790] dark:text-[#91a099]">{item.note}</div>
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex min-w-0 items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#6c7e74]" />
            <span className="truncate">{item.appliedAt}</span>
          </div>
          <span
            className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[0.64rem] font-semibold ring-1 ${item.badgeClassName}`}
          >
            {item.badge}
          </span>
        </div>
      </div>
    </article>
  );
}

function ApplicationsColumn({ column }) {
  return (
    <div className="flex min-w-[17rem] flex-1 flex-col border-l border-[#e5ede8] px-3.5 first:border-l-0 dark:border-white/10">
      <div className="border-b border-[#d9e4dd] pb-2 text-center text-[0.7rem] font-medium tracking-[0.01em] text-[#4a5b50] dark:border-white/10 dark:text-[#b8c5bd]">
        {column.label}
      </div>
      <div className="space-y-3.5 pt-3.5">
        {column.items.map((item) => (
          <ApplicationCard
            key={`${column.id}-${item.company}-${item.role}`}
            item={item}
          />
        ))}
      </div>
    </div>
  );
}

export default function LandingApplicationsShowcase() {
  return (
    <div className="relative mx-auto hidden w-full max-w-[72rem] px-3 min-[1100px]:block">
      <div className="pointer-events-none absolute inset-x-10 top-5 h-[78%] rounded-[2rem] bg-[radial-gradient(circle_at_top,rgba(198,238,227,0.95),rgba(62,126,110,0.82)_58%,rgba(27,76,64,0.9))] blur-[2px]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-[-3.5rem] h-32 bg-[linear-gradient(180deg,rgba(253,251,247,0)_0%,rgba(253,251,247,0.84)_56%,#FDFBF7_100%)] dark:bg-[linear-gradient(180deg,rgba(24,26,27,0)_0%,rgba(24,26,27,0.72)_56%,#181a1b_100%)]" />

      <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[rgba(252,255,253,0.58)] p-4 shadow-[0_45px_100px_rgba(32,85,71,0.22)] backdrop-blur-[10px] dark:border-white/10 dark:bg-[rgba(28,35,31,0.72)]">
        <div className="overflow-hidden rounded-[1.6rem] border border-[#d4e1d9] bg-[#fbfdfc] shadow-[0_28px_60px_rgba(24,63,52,0.08)] dark:border-white/10 dark:bg-[#101714]">
          <div className="grid min-h-[30rem] grid-cols-[10rem_minmax(0,1fr)]">
            <aside className="flex flex-col border-r border-[#dfe8e2] bg-white/92 px-4 py-4 dark:border-white/10 dark:bg-[#0d1411]">
              <div className="flex items-center gap-3 border-b border-[#e8efea] pb-4 dark:border-white/10">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1f5d49] text-white shadow-sm">
                  <BriefcaseBusiness className="h-4.5 w-4.5" />
                </div>
                <div className="text-[0.9rem] font-semibold tracking-tight text-[#1c2c24] dark:text-white">KapIT</div>
              </div>

              <nav className="mt-4 space-y-2 text-[0.76rem] text-[#496055] dark:text-[#b6c2ba]">
                <div className="flex items-center gap-2.5 rounded-xl px-3 py-2">
                  <BriefcaseBusiness className="h-3.5 w-3.5" />
                  <span>Jobs</span>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl bg-[#d8f0ea] px-3 py-2 font-medium text-[#1c6650] dark:bg-[#18332a] dark:text-[#a6dfcb]">
                  <FileCheck2 className="h-3.5 w-3.5" />
                  <span>Applications</span>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl px-3 py-2">
                  <HeartHandshake className="h-3.5 w-3.5" />
                  <span>Profile</span>
                </div>
              </nav>

              <div className="mt-auto space-y-2 border-t border-[#e8efea] pt-4 text-[0.72rem] text-[#7d8c84] dark:border-white/10 dark:text-[#8fa199]">
                <div className="flex items-center gap-2.5 px-3">
                  <Settings className="h-3.5 w-3.5" />
                  <span>Settings</span>
                </div>
                <div className="flex items-center gap-2.5 px-3">
                  <CircleHelp className="h-3.5 w-3.5" />
                  <span>Help</span>
                </div>
              </div>
            </aside>

            <div className="flex flex-col bg-[#fbfdfc] dark:bg-[#101714]">
              <div className="flex items-center gap-3 border-b border-[#e3ebe5] px-4 py-4 dark:border-white/10">
                <button
                  type="button"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#d8e2dc] text-[#7a8b81] dark:border-white/10 dark:text-[#8fa199]"
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
                <h3 className="text-[1.15rem] font-semibold tracking-tight text-[#17261d] dark:text-white">
                  My Applications
                </h3>
              </div>

              <div className="flex-1 overflow-hidden p-3.5">
                <div className="flex h-full min-w-[52rem] rounded-[1.1rem] border border-[#dfe8e2] bg-white/78 py-3 dark:border-white/10 dark:bg-[#131c18]">
                  {APPLICATION_COLUMNS.map((column) => (
                    <ApplicationsColumn key={column.id} column={column} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(251,253,252,0)_0%,rgba(251,253,252,0.88)_72%,#fbfdfc_100%)] dark:bg-[linear-gradient(180deg,rgba(16,23,20,0)_0%,rgba(16,23,20,0.88)_72%,#101714_100%)]" />
      </div>
    </div>
  );
}
