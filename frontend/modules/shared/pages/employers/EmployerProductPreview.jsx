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
      className="relative overflow-hidden rounded-[2rem] border border-[#cbd9c7] bg-[#edf4ea] p-4 shadow-[0_32px_80px_rgba(32,69,46,0.16)] dark:border-white/10 dark:bg-[#1a211d]"
      aria-label="Sample KapIT employer workspace preview"
    >
      <div className="mb-4 flex items-center justify-between gap-4 px-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#627760] dark:text-[#aab8ae]">Product preview</p>
          <p className="mt-1 text-sm font-semibold text-[#173225] dark:text-white">Candidate search and listing management</p>
        </div>
        <span className="rounded-full border border-[#bfd0ba] bg-white/70 px-3 py-1 text-xs font-semibold text-[#31572c] dark:border-white/10 dark:bg-white/5 dark:text-[#b9d5bc]">
          Sample data
        </span>
      </div>

      <div className="space-y-3">
        <CompanyDeveloperCard developer={SAMPLE_DEVELOPER} onViewProfile={onExplore} onMessage={onExplore} />
        {!compact ? <CompanyJobCard job={SAMPLE_JOB} /> : null}
      </div>
    </div>
  );
}
