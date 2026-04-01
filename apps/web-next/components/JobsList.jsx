import Link from 'next/link';

export default function JobsList({ jobs }) {
  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <header className="max-w-3xl">
        <h1 className="text-4xl font-bold text-[#102a1b]">Open tech jobs</h1>
        <p className="mt-3 text-lg text-[#344e41]">Server-rendered job listings for search discovery and fast loading.</p>
      </header>

      <div className="mt-10 grid gap-4">
        {jobs.map((job) => (
          <article key={job.id} className="rounded-2xl border border-[#a3b18a] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-[#1f3a2a]">
                  <Link href={`/jobs/${job.slug}`} className="hover:underline">{job.title}</Link>
                </h2>
                <p className="mt-1 text-sm text-[#344e41]">{job.company?.name || 'Company'} • {job.location || 'Remote / flexible'}</p>
              </div>
              <span className="rounded-full bg-[#eef6ee] px-3 py-1 text-xs font-semibold text-[#3a5a40]">{job.type || 'Open role'}</span>
            </div>
            {job.description ? <p className="mt-4 line-clamp-3 text-sm text-[#344e41]">{job.description}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {(job.skills || []).slice(0, 6).map((skill) => (
                <span key={skill} className="rounded-full border border-[#d7dfc8] px-3 py-1 text-xs text-[#344e41]">{skill}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}