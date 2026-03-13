import React from 'react';
import { Link2 } from 'lucide-react';

export default function PortfolioCard({ title, description, value, onChange, placeholder = 'https://' }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 text-slate-100 font-semibold">
            <Link2 className="w-4 h-4 text-blue-400" />
            {title}
          </div>
          {description && <p className="mt-1 text-xs text-slate-400">{description}</p>}
        </div>
      </div>

      <input
        type="url"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="mt-3 w-full rounded-lg bg-slate-900/40 border border-slate-700 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-blue-400/40"
      />
    </div>
  );
}

