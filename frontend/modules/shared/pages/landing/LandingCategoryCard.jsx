import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function LandingCategoryCard({ category, icon, title, onClick, className = '' }) {
  const Icon = icon ?? category?.icon;
  const resolvedTitle = title ?? category?.title;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-h-[164px] shrink-0 flex-col text-left rounded-[1.4rem] bg-white/60 dark:bg-[#1a1d20]/60 border border-[#a3b18a]/30 dark:border-white/5 p-6 lg:min-h-[220px] lg:rounded-[1.8rem] lg:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 hover:border-[#588157]/40 dark:hover:border-white/15 transition-all duration-500 ease-out overflow-hidden relative ${className}`}
    >
      {/* Soft gradient glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#588157]/[0.03] to-transparent dark:from-white/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-b from-[#fbfaf6] to-[#f0ede6] dark:from-[#2a3036] dark:to-[#22272b] lg:h-14 lg:w-14 shadow-sm border border-white/50 dark:border-white/5 group-hover:scale-110 transition-transform duration-500 ease-out">
        {Icon ? <Icon className="h-5 w-5 text-[#588157] dark:text-[#88a88d] lg:h-6 lg:w-6" /> : null}
      </div>
      
      <div className="relative mt-6 flex flex-1 flex-col">
        <div className="text-lg font-bold tracking-tight text-[#102a1b] dark:text-white lg:text-[1.35rem]">{resolvedTitle}</div>
        
        <div className="mt-auto pt-4 flex items-center justify-between w-full">
          <span className="text-sm font-medium text-[#4a6354] dark:text-[#a0aab2] lg:text-[0.95rem] transition-colors duration-300 group-hover:text-[#102a1b] dark:group-hover:text-white">
            Browse specialists
          </span>
          <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-[#588157]/10 dark:bg-white/10 text-[#588157] dark:text-white opacity-0 -translate-x-3 transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100 group-hover:translate-x-0">
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </button>
  );
}
