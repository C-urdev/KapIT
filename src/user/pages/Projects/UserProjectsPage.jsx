// ProjectsPage 

import React from 'react';
import { Plus } from 'lucide-react';

export default function ProjectsPage({ userType }) {
  return (
    <div className="w-full max-w-[1300px] mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#3a5a40] dark:text-white mb-2">
            {userType === 'employee' ? 'My Projects' : 'Explore Projects'}
          </h1>
          <p className="text-[#344e41] dark:text-[#b8d4e8]">
            {userType === 'employee' ? 'Showcase your work' : 'Discover developer portfolios'}
          </p>
        </div>
        {userType === 'employee' && (
          <button className="flex items-center gap-2 px-4 py-2 bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de] text-white font-semibold rounded-lg transition-colors">
            <Plus className="w-5 h-5" />
            New Project
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-xl p-12 text-center">
        <h2 className="text-2xl font-semibold text-[#3a5a40] dark:text-white mb-2">
          {userType === 'employee' ? 'No Projects Yet' : 'No Projects Available'}
        </h2>
        <p className="text-[#344e41] dark:text-[#b8d4e8]">
          {userType === 'employee'
            ? 'Your project showcase will appear here once you add your first project.'
            : 'Projects shared by developers will appear here soon.'}
        </p>
      </div>
    </div>
  );
}



