'use client';

import { useMemo, useState } from 'react';
import { requestJobMatches } from '@sharedServices/matchService';

const EXPERIENCE_OPTIONS = [
  { value: 'intern', label: 'Intern' },
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
];

const normalizeSkillsInput = (raw) =>
  String(raw || '')
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean);

export default function JobMatchClient({ user }) {
  const [skillsText, setSkillsText] = useState('');
  const [experience, setExperience] = useState('junior');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const parsedSkills = useMemo(() => normalizeSkillsInput(skillsText), [skillsText]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!parsedSkills.length) {
      setError('Please enter at least one skill.');
      return;
    }

    setLoading(true);
    try {
      const nextMatches = await requestJobMatches({
        skills: parsedSkills,
        experience,
      });
      setMatches(nextMatches);
    } catch (submitError) {
      setMatches([]);
      setError(submitError?.message || 'Unable to fetch job matches right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[min(100%,980px)] space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-[#3a5a40] dark:text-white">Job Matchmaking</h1>
        <p className="text-sm text-[#5f6f52] dark:text-[#8fb2cf]">
          Find relevant roles by matching your skills against open jobs.
        </p>
        <p className="text-xs text-[#6b7c6a] dark:text-[#9eb8cf]">
          Signed in as {user?.username || user?.email || 'developer'}
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-[#a3b18a] bg-[#f8fbf6] p-5 shadow-sm dark:border-[#1e3a5f] dark:bg-[#162842]"
      >
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-[#344e41] dark:text-[#dcecff]">Skills</span>
            <textarea
              value={skillsText}
              onChange={(event) => setSkillsText(event.target.value)}
              placeholder="react, javascript, node"
              className="min-h-[96px] w-full rounded-xl border border-[#b8c8a5] bg-white px-3 py-2 text-sm text-[#344e41] outline-none ring-[#588157] focus:ring-2 dark:border-[#2a4a6f] dark:bg-[#0f2139] dark:text-white dark:ring-[#3ba9d6]"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-[#344e41] dark:text-[#dcecff]">Experience</span>
            <select
              value={experience}
              onChange={(event) => setExperience(event.target.value)}
              className="w-full rounded-xl border border-[#b8c8a5] bg-white px-3 py-2 text-sm text-[#344e41] outline-none ring-[#588157] focus:ring-2 dark:border-[#2a4a6f] dark:bg-[#0f2139] dark:text-white dark:ring-[#3ba9d6]"
            >
              {EXPERIENCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center rounded-xl bg-[#3a5a40] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2f4a35] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de]"
          >
            {loading ? 'Matching...' : 'Match Jobs'}
          </button>
        </div>
      </form>

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-[0.14em] text-[#5f6f52] dark:text-[#8fb2cf]">
          {matches.length} result{matches.length === 1 ? '' : 's'}
        </h2>

        {matches.length === 0 ? (
          <div className="rounded-xl border border-[#ccd8bf] bg-white p-4 text-sm text-[#4b5563] dark:border-[#2a4a6f] dark:bg-[#0f2139] dark:text-[#b8d4e8]">
            No matches yet. Enter your skills and run a search.
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((job, index) => (
              <article
                key={`${job?.id || 'job'}-${index}`}
                className="rounded-xl border border-[#ccd8bf] bg-white p-4 dark:border-[#2a4a6f] dark:bg-[#0f2139]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-[#1f3a2a] dark:text-white">{job?.title || 'Untitled job'}</h3>
                  <span className="rounded-full bg-[#eef6ee] px-3 py-1 text-xs font-semibold text-[#3a5a40] dark:bg-[#11334f] dark:text-[#7fd0ee]">
                    Match {Number(job?.match || 0)}%
                  </span>
                </div>

                <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="font-semibold text-[#344e41] dark:text-[#dcecff]">Matched Skills</p>
                    <p className="text-[#5f6f52] dark:text-[#9eb8cf]">
                      {(job?.matched_skills || []).length ? (job.matched_skills || []).join(', ') : 'None'}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-[#344e41] dark:text-[#dcecff]">Missing Skills</p>
                    <p className="text-[#5f6f52] dark:text-[#9eb8cf]">
                      {(job?.missing_skills || []).length ? (job.missing_skills || []).join(', ') : 'None'}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
