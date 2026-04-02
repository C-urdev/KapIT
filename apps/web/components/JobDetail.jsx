import Link from 'next/link';

export default function JobDetail({ job }) {
  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      <nav className="mb-6 text-sm text-[#344e41]">
        <Link href="/jobs" className="hover:underline">Jobs</Link>
        <span> / </span>
        <span>{job.title}</span>
      </nav>

      <article className="rounded-3xl border border-[#a3b18a] bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#588157]">{job.company?.name || 'Company'}</p>
        <h1 className="mt-3 text-4xl font-bold text-[#102a1b]">{job.title}</h1>
        <p className="mt-3 text-[#344e41]">{job.location || 'Remote / flexible'}{job.salary ? ` • ${job.salary}` : ''}{job.type ? ` • ${job.type}` : ''}</p>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-[#1f3a2a]">Job description</h2>
          <p className="mt-3 whitespace-pre-wrap text-[#344e41]">{job.description || 'No description provided yet.'}</p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-[#1f3a2a]">Skills</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {(job.skills || []).length ? job.skills.map((skill) => (
              <span key={skill} className="rounded-full border border-[#d7dfc8] px-3 py-1 text-sm text-[#344e41]">{skill}</span>
            )) : <p className="text-[#344e41]">No specific skills listed.</p>}
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-[#f5f5f2] p-6">
          <h2 className="text-2xl font-semibold text-[#1f3a2a]">About the company</h2>
          <p className="mt-3 text-[#344e41]">{job.company?.description || 'Company information will appear here.'}</p>
          {job.company?.id ? (
            <Link href={`/companies/${job.company.id}`} className="mt-4 inline-block text-sm font-semibold text-[#3a5a40] hover:underline">
              View company profile
            </Link>
          ) : null}
        </section>
      </article>
    </main>
  );
}