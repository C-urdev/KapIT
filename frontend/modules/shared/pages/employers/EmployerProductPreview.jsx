import { BriefcaseBusiness, Search, SlidersHorizontal, Users } from 'lucide-react';
import CompanyDeveloperCard from '@companyComponents/CompanyDeveloperCard';
import CompanyJobCard from '@companyComponents/CompanyJobCard';

const SAMPLE_DEVELOPER = {
  username: 'Mika Reyes',
  desiredJob: 'Frontend Engineer',
  address: 'Cebu City, Philippines',
  ai: { matchPercentage: 87, atsScore: 82 },
};

const SAMPLE_JOB = {
  title: 'Senior Frontend Engineer',
  status: 'open',
  posting_payment_status: 'paid',
  location: 'Remote, Philippines',
  type: 'Full-time',
  applicant_count: 14,
};

export default function EmployerProductPreview({ compact = false, onExplore }) {
  return (
    <div
      className="employer-product-preview relative overflow-hidden rounded-[1.5rem] border border-[var(--workspace-border)] bg-[var(--workspace-canvas)] p-3 text-[var(--workspace-text)] shadow-[0_28px_70px_rgba(24,33,28,0.16)] dark:shadow-black/30 sm:p-4"
      aria-label="Sample KapIT employer workspace preview"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--workspace-border)] pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--workspace-primary-soft)] text-[var(--workspace-primary)]">
              <Search className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-[var(--workspace-text-strong)]">Talent search</p>
              <p className="mt-0.5 text-xs text-[var(--workspace-text-muted)]">Find the right developer for an open role.</p>
            </div>
          </div>
        </div>
        <button type="button" onClick={onExplore} className="company-workspace-secondary-button inline-flex h-9 shrink-0 items-center gap-1.5 px-2.5 text-xs">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
        </button>
      </div>

      <label className="company-workspace-control mt-3 flex h-10 items-center gap-2.5 px-3">
        <Search className="h-4 w-4 shrink-0 text-[var(--workspace-text-muted)]" />
        <span className="sr-only">Search developers</span>
        <input readOnly value="" placeholder="Search by role, skill, or location" className="min-w-0 flex-1 border-0 bg-transparent text-sm text-[var(--workspace-text-strong)] outline-none placeholder:text-[var(--workspace-text-muted)]" />
      </label>

      <div className={`mt-3 grid gap-3 ${compact ? 'grid-cols-1' : 'xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]'}`}>
        <section className="company-workspace-list-surface p-3">
          <div className="mb-3 flex items-center justify-between gap-3 border-b border-[var(--workspace-border)] pb-2.5">
            <div>
              <p className="text-sm font-semibold text-[var(--workspace-text-strong)]">Results</p>
              <p className="mt-0.5 text-xs text-[var(--workspace-text-muted)]">12 developers matched</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--workspace-primary)]">
              <Users className="h-3.5 w-3.5" />
              Best match
            </span>
          </div>
          <CompanyDeveloperCard
            developer={SAMPLE_DEVELOPER}
            selected
            onViewProfile={onExplore}
            onMessage={onExplore}
          />
        </section>

        {!compact ? (
          <section className="company-workspace-detail-surface p-3">
            <div className="mb-3 flex items-center gap-2 border-b border-[var(--workspace-border)] pb-2.5">
              <BriefcaseBusiness className="h-4 w-4 text-[var(--workspace-primary)]" />
              <div>
                <p className="text-sm font-semibold text-[var(--workspace-text-strong)]">Active listing</p>
                <p className="mt-0.5 text-xs text-[var(--workspace-text-muted)]">Compare candidates against this role.</p>
              </div>
            </div>
            <CompanyJobCard job={SAMPLE_JOB} onViewDetails={onExplore} />
          </section>
        ) : null}
      </div>
    </div>
  );
}
