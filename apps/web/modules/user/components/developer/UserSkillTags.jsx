import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import SearchableSelect from '@sharedComponents/forms/SearchableSelect';
import { IT_SKILL_OPTIONS, OTHER_IT_SKILL_OPTION } from '@shared/features/itSkillOptions';

const normalizeTag = (value) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 40);

export default function SkillTags({ value, onChange, placeholder = 'Type a skill and press Enter' }) {
  const tags = useMemo(() => (Array.isArray(value) ? value.filter(Boolean) : []), [value]);
  const [input, setInput] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');

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

  const addSkill = (rawSkill) => {
    const next = normalizeTag(rawSkill);
    if (!next) return;
    const exists = tags.some((tag) => String(tag).toLowerCase() === next.toLowerCase());
    if (exists) return;
    onChange?.([...tags, next]);
  };

  const selectableSkills = useMemo(
    () => IT_SKILL_OPTIONS.filter((skill) => skill === OTHER_IT_SKILL_OPTION || !tags.includes(skill)),
    [tags]
  );

  return (
    <div className="p-0">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, idx) => (
          <span
            key={`${tag}-${idx}`}
            className="inline-flex items-center gap-2 rounded-full border border-[#a3b18a] bg-[#f8fbf6] px-3 py-1 text-sm text-[#344e41] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
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

      <div className="mt-3">
        {selectedSkill === OTHER_IT_SKILL_OPTION ? (
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                commit(input);
                setInput('');
              }
              if (e.key === 'Escape') {
                setInput('');
                setSelectedSkill('');
              }
              if (e.key === 'Backspace' && !input && tags.length) {
                removeAt(tags.length - 1);
              }
            }}
            onBlur={() => {
              commit(input);
              setInput('');
              setSelectedSkill('');
            }}
            placeholder={placeholder}
            className="field"
            autoFocus
          />
        ) : (
          <SearchableSelect
            value={selectedSkill}
            onChange={(skill) => {
              setSelectedSkill(skill);
              if (skill === OTHER_IT_SKILL_OPTION) return;
              addSkill(skill);
              setSelectedSkill('');
            }}
            options={selectableSkills}
            placeholder="Select an IT skill"
            searchPlaceholder="Search IT skills"
          />
        )}
      </div>
    </div>
  );
}



