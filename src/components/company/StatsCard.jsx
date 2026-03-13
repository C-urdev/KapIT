import React from 'react';

export default function StatsCard({ label, value, helper, icon: Icon }) {
  return (
    <div className="rounded-xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#162842] shadow-lg shadow-black/5 dark:shadow-black/20 p-5 transition-colors duration-300">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#4b5563] dark:text-[#b8d4e8]">{label}</p>
          <p className="mt-2 text-2xl font-extrabold text-[#3a5a40] dark:text-white">{value}</p>
          {helper && <p className="mt-1 text-xs text-[#4b5563] dark:text-[#b8d4e8]">{helper}</p>}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-xl border border-[#a3b18a] dark:border-[#2a4a6f] bg-[#f5f5f2] dark:bg-[#1e3a5f] flex items-center justify-center transition-colors duration-300">
            <Icon className="w-5 h-5 text-[#588157] dark:text-[#3ba9d6]" />
          </div>
        )}
      </div>
    </div>
  );
}
