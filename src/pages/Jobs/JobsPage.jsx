// JobsPage 

import React from 'react';
import { Filter, MapPin, Building, Bookmark } from 'lucide-react';

export default function JobsPage({ userType }) {
  return (
    <div className="w-full max-w-[1200px] mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#3a5a40] dark:text-white mb-2">
          {userType === 'employee' ? 'Browse Jobs' : 'Posted Jobs'}
        </h1>
        <p className="text-[#344e41] dark:text-[#b8d4e8]">
          {userType === 'employee' ? 'Find your next opportunity in tech' : 'Manage your job postings'}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-xl p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#f5f5f2] dark:bg-[#1e3a5f] text-[#588157] dark:text-[#3ba9d6] rounded-lg border border-[#a3b18a] dark:border-[#2a4a6f]">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters</span>
          </button>
          <select className="px-4 py-2 bg-white dark:bg-[#1e3a5f] border border-[#a3b18a] dark:border-[#2a4a6f] rounded-lg text-sm text-[#344e41] dark:text-white">
            <option>All Locations</option>
            <option>Metro Manila</option>
            <option>Cebu</option>
            <option>Davao</option>
            <option>Remote</option>
          </select>
          <select className="px-4 py-2 bg-white dark:bg-[#1e3a5f] border border-[#a3b18a] dark:border-[#2a4a6f] rounded-lg text-sm text-[#344e41] dark:text-white">
            <option>All Experience</option>
            <option>Entry Level</option>
            <option>Mid Level</option>
            <option>Senior</option>
          </select>
        </div>
      </div>

      {/* Job Listings */}
      <div className="space-y-4">
        <JobCard
          company="TechStart PH"
          title="Senior Full Stack Developer"
          location="BGC, Taguig"
          type="Full-time"
          salary="₱80,000 - ₱120,000/month"
          posted="2 days ago"
          skills={["React", "Node.js", "AWS", "MongoDB"]}
        />
        <JobCard
          company="Globe Telecom"
          title="DevOps Engineer"
          location="Makati - Hybrid"
          type="Full-time"
          salary="₱90,000 - ₱140,000/month"
          posted="3 days ago"
          skills={["Docker", "Kubernetes", "CI/CD", "AWS"]}
        />
        <JobCard
          company="Accenture Philippines"
          title="Frontend Developer"
          location="Quezon City"
          type="Full-time"
          salary="₱60,000 - ₱100,000/month"
          posted="5 days ago"
          skills={["React", "TypeScript", "Tailwind", "Next.js"]}
        />
      </div>
    </div>
  );
}

function JobCard({ company, title, location, type, salary, posted, skills }) {
  return (
    <div className="bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-xl p-4 sm:p-6 hover:border-[#588157] dark:hover:border-[#3ba9d6] transition-colors cursor-pointer">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#588157] to-[#3a5a40] dark:from-[#2d8bb8] dark:to-[#3ba9d6] rounded-lg flex items-center justify-center flex-shrink-0">
            <Building className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-[#3a5a40] dark:text-white mb-1">{title}</h3>
            <p className="text-sm text-[#344e41] dark:text-[#b8d4e8] mb-2">{company}</p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-[#344e41] dark:text-[#b8d4e8]">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {location}
              </span>
              <span className="px-2 py-1 bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300 rounded">
                {type}
              </span>
              <span className="font-semibold text-[#588157] dark:text-[#3ba9d6]">{salary}</span>
            </div>
          </div>
        </div>
        <span className="text-xs text-[#3a5a40] dark:text-[#7d9ab8]">{posted}</span>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {skills.map((skill, i) => (
          <span key={i} className="px-3 py-1 bg-[#f5f5f2] dark:bg-[#1e3a5f] text-[#344e41] dark:text-white text-xs font-medium rounded-full">
            {skill}
          </span>
        ))}
      </div>
      
      <div className="flex gap-3">
        <button className="flex-1 bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de] text-white font-semibold py-2 rounded-lg transition-colors">
          Apply Now
        </button>
        <button className="px-4 py-2 border border-[#a3b18a] dark:border-[#2a4a6f] text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] rounded-lg transition-colors">
          <Bookmark className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
