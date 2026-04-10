import React from 'react';
import { Link2 } from 'lucide-react';

export default function PortfolioCard({ title, description, value, onChange, placeholder = 'https://' }) {
  return (
    <div className="rounded-xl border border-[#a3b18a] bg-[#f5f5f2] p-4 dark:border-slate-700 dark:bg-slate-900/40">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 font-semibold text-[#2f3e2f] dark:text-slate-100">
            <Link2 className="h-4 w-4 text-[#588157] dark:text-blue-400" />
            {title}
          </div>
          {description && <p className="mt-1 text-xs text-[#5f6f52] dark:text-slate-400">{description}</p>}
        </div>
      </div>

      <input
        type="url"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="mt-3 w-full rounded-lg border border-[#a3b18a] bg-white px-3 py-2 text-[#344e41] placeholder:text-[#5f6f52] outline-none focus:ring-2 focus:ring-[#588157] dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-400/40"
      />
    </div>
  );
}



