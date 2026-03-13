import React, { useState } from 'react';
import { companyAPI } from '@features/company/companyAPI';
import { COMPANY_PATHS, formatSkills, navigate } from '@features/company/companyUtils';

export default function PostJob() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    salary: '',
    location: '',
    type: 'Full-time',
    skills: '',
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await companyAPI.createJob({
        ...form,
        skills: formatSkills(form.skills),
      });
      navigate(COMPANY_PATHS.jobs);
    } catch (err) {
      setError(err?.message || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-[#3a5a40] dark:text-white">Post a job</h2>
        <p className="text-sm text-[#344e41] dark:text-[#b8d4e8]">Create a listing that reaches Filipino IT graduates and developers.</p>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <form onSubmit={handleSubmit} className="rounded-2xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#162842] shadow-lg shadow-black/5 dark:shadow-black/20 p-8 space-y-6 transition-colors duration-300">
        <Field label="Job title">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="field"
            placeholder="e.g. Frontend Developer (React)"
            required
          />
        </Field>

        <Field label="Description">
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="field min-h-32"
            placeholder="Responsibilities, requirements, and what success looks like…"
            required
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Salary (optional)">
            <input
              value={form.salary}
              onChange={(e) => setForm({ ...form, salary: e.target.value })}
              className="field"
              placeholder="e.g. ₱60k–₱90k"
            />
          </Field>
          <Field label="Location (optional)">
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="field"
              placeholder="e.g. Remote / Metro Manila"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Type (optional)">
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="field"
            >
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Contract</option>
              <option>Internship</option>
            </select>
          </Field>
          <Field label="Skills (comma-separated)">
            <input
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
              className="field"
              placeholder="React, Tailwind, REST APIs"
            />
          </Field>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(COMPANY_PATHS.dashboard)}
            className="px-4 py-2.5 rounded-xl border border-[#a3b18a] dark:border-[#2a4a6f] text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de] text-white font-semibold disabled:opacity-60 transition-colors"
          >
            {loading ? 'Posting…' : 'Post job'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-semibold text-[#3a5a40] dark:text-white">{label}</label>
      {children}
    </div>
  );
}
