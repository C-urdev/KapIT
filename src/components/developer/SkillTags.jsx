import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';

const normalizeTag = (value) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 40);

export default function SkillTags({ value, onChange, placeholder = 'Type a skill and press Enter' }) {
  const tags = useMemo(() => (Array.isArray(value) ? value.filter(Boolean) : []), [value]);
  const [input, setInput] = useState('');

  const commit = (raw) => {
    const next = normalizeTag(raw);
    if (!next) return;
    const exists = tags.some((t) => String(t).toLowerCase() === next.toLowerCase());
    if (exists) return;
    onChange?.([...tags, next]);
  };

  const removeAt = (index) => {
    const next = tags.filter((_, i) => i !== index);
    onChange?.(next);
  };

  return (
    <div className="rounded-xl border border-[#a3b18a] bg-[#f5f5f2] p-3 dark:border-slate-700 dark:bg-slate-900/40">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, idx) => (
          <span
            key={`${tag}-${idx}`}
            className="inline-flex items-center gap-2 rounded-full border border-[#a3b18a] bg-white px-3 py-1 text-sm text-[#344e41] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeAt(idx)}
              className="text-[#5f6f52] hover:text-[#344e41] dark:text-slate-400 dark:hover:text-slate-200"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-4 w-4" />
            </button>
          </span>
        ))}
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commit(input);
            setInput('');
          }
          if (e.key === 'Backspace' && !input && tags.length) {
            removeAt(tags.length - 1);
          }
        }}
        onBlur={() => {
          commit(input);
          setInput('');
        }}
        placeholder={placeholder}
        className="mt-3 w-full rounded-lg border border-[#a3b18a] bg-white px-3 py-2 text-[#344e41] placeholder:text-[#5f6f52] outline-none focus:ring-2 focus:ring-[#588157] dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-400/40"
      />
    </div>
  );
}
