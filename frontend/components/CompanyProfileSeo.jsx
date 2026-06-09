import Link from './shared/Link';

export default function CompanyProfileSeo({ profile }) {
  return (
    <main className="mx-auto max-w-5xl px-6 py-14">
      <nav className="mb-6 text-sm text-[#344e41]">
        <Link href="/" className="hover:underline">Home</Link>
        <span> / </span>
        <span>{profile.companyName}</span>
      </nav>

      <header className="rounded-3xl border border-[#a3b18a] bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#588157]">Company profile</p>
        <h1 className="mt-3 text-4xl font-bold text-[#102a1b]">{profile.companyName}</h1>
        {profile.shortDescription ? <p className="mt-4 text-lg text-[#344e41]">{profile.shortDescription}</p> : null}
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#344e41]">
          {profile.address ? <span>{profile.address}</span> : null}
          {profile.website ? <a href={profile.website} className="hover:underline" target="_blank" rel="noreferrer">{profile.website}</a> : null}
        </div>
      </header>

      <section className="mt-8 rounded-3xl border border-[#a3b18a] bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-[#1f3a2a]">About</h2>
        <p className="mt-3 whitespace-pre-wrap text-[#344e41]">{profile.bio || 'Company overview coming soon.'}</p>
      </section>

      <section className="mt-8 rounded-3xl border border-[#a3b18a] bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-[#1f3a2a]">Open roles</h2>
        <div className="mt-4 grid gap-3">
          {(profile.jobListings || []).length ? profile.jobListings.map((job) => (
            <Link key={job.id} href={`/jobs/${job.slug}`} className="rounded-2xl border border-[#d7dfc8] px-4 py-4 hover:bg-[#f8fbf6]">
              <p className="font-semibold text-[#102a1b]">{job.title}</p>
              <p className="mt-1 text-sm text-[#344e41]">{job.location || 'Remote / flexible'}{job.type ? ` • ${job.type}` : ''}</p>
            </Link>
          )) : <p className="text-[#344e41]">No public roles listed right now.</p>}
        </div>
      </section>
    </main>
  );
}