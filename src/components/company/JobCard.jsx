import React from 'react';
import { MapPin, Briefcase, Tags, Users } from 'lucide-react';

export default function JobCard({ job, onManage }) {
  const skills = Array.isArray(job?.skills) ? job.skills : [];

  return (
    <div className="rounded-xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#162842] shadow-lg shadow-black/5 dark:shadow-black/20 p-5 transition-colors duration-300">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-[#3a5a40] dark:text-white truncate">{job?.title || 'Untitled job'}</h3>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#344e41] dark:text-[#b8d4e8]">
            {job?.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-4 h-4 text-[#588157] dark:text-[#3ba9d6]" />
                {job.location}
              </span>
            )}
            {job?.type && (
              <span className="inline-flex items-center gap-1">
                <Briefcase className="w-4 h-4 text-[#588157] dark:text-[#3ba9d6]" />
                {job.type}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Users className="w-4 h-4 text-[#588157] dark:text-[#3ba9d6]" />
              {Number(job?.applicant_count || job?.applicantCount || 0)} applicants
            </span>
          </div>
        </div>

        {onManage && (
          <button
            type="button"
            onClick={() => onManage(job)}
            className="px-3 py-2 rounded-lg border border-[#a3b18a] dark:border-[#2a4a6f] text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
          >
            Manage
          </button>
        )}
      </div>

      {skills.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 text-xs text-[#4b5563] dark:text-[#b8d4e8] mb-2">
            <Tags className="w-4 h-4 text-[#588157] dark:text-[#3ba9d6]" />
            Skills
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.slice(0, 10).map((skill) => (
              <span
                key={skill}
                className="px-2.5 py-1 rounded-full border border-[#a3b18a] dark:border-[#2a4a6f] bg-[#f5f5f2] dark:bg-[#0f2139] text-xs text-[#344e41] dark:text-white transition-colors duration-300"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {job?.description && (
        <p className="mt-4 text-sm text-[#344e41] dark:text-[#b8d4e8] leading-relaxed line-clamp-3">{job.description}</p>
      )}
    </div>
  );
}
