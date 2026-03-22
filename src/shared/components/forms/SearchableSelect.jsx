import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

const normalizeOptions = (options) =>
  (Array.isArray(options) ? options : []).map((option) =>
    typeof option === 'string'
      ? { value: option, label: option }
      : {
          value: String(option?.value ?? ''),
          label: String(option?.label ?? option?.value ?? ''),
        }
  );

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
  disabled = false,
  emptyMessage = 'No matching options found.',
  className = 'field',
  searchInTrigger = true,
}) {
  const normalizedOptions = useMemo(() => normalizeOptions(options), [options]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const triggerSearchRef = useRef(null);

  const selectedOption = normalizedOptions.find((option) => option.value === value) || null;
  const filteredOptions = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return normalizedOptions;
    return normalizedOptions.filter(
      (option) =>
        option.label.toLowerCase().includes(keyword) ||
        option.value.toLowerCase().includes(keyword)
    );
  }, [normalizedOptions, query]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }

    const handleClickOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open) {
      window.setTimeout(() => {
        if (searchInTrigger) {
          triggerSearchRef.current?.focus();
          return;
        }
        searchRef.current?.focus();
      }, 0);
    }
  }, [open, searchInTrigger]);

  return (
    <div ref={rootRef} className="relative">
      {searchInTrigger ? (
        <div className={`${className} flex w-full items-center gap-3 disabled:cursor-not-allowed disabled:opacity-60`}>
          <Search className="h-4 w-4 shrink-0 text-[#6b7280] dark:text-[#7d9ab8]" />
          <input
            ref={triggerSearchRef}
            type="text"
            value={open ? query : ''}
            onFocus={() => !disabled && setOpen(true)}
            onChange={(event) => {
              if (disabled) return;
              setOpen(true);
              setQuery(event.target.value);
            }}
            placeholder={selectedOption?.label || placeholder}
            disabled={disabled}
            className="min-w-0 flex-1 bg-transparent text-left text-[#344e41] outline-none placeholder:text-[#6b7280] dark:text-white dark:placeholder:text-[#7d9ab8]"
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => setOpen((prev) => !prev)}
            className="shrink-0 text-[#6b7280] dark:text-[#7d9ab8]"
            aria-label={open ? 'Close options' : 'Open options'}
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((prev) => !prev)}
          className={`${className} flex w-full items-center justify-between gap-3 text-left disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <span className={selectedOption ? '' : 'text-[#6b7280] dark:text-[#7d9ab8]'}>
            {selectedOption?.label || placeholder}
          </span>
          <span className="inline-flex items-center gap-2 text-[#6b7280] dark:text-[#7d9ab8]">
            <Search className="h-4 w-4" />
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </span>
        </button>
      )}

      {open && !disabled && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-[#a3b18a] bg-white shadow-xl shadow-black/10 dark:border-[#2a4a6f] dark:bg-[#162842] dark:shadow-black/30">
          {!searchInTrigger && (
            <div className="border-b border-[#d6d3c9] p-3 dark:border-[#2a4a6f]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280] dark:text-[#7d9ab8]" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-lg border border-[#d1d5db] bg-[#f8faf7] py-2 pl-9 pr-3 text-sm text-[#344e41] outline-none transition-colors focus:border-[#588157] dark:border-[#2a4a6f] dark:bg-[#0f2139] dark:text-white dark:focus:border-[#3ba9d6]"
                />
              </div>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto py-2">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const active = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange?.(option.value);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors ${
                      active
                        ? 'bg-[#eef6ee] text-[#3a5a40] dark:bg-[#1e3a5f] dark:text-white'
                        : 'text-[#344e41] hover:bg-[#f5f5f2] dark:text-[#dcecff] dark:hover:bg-[#102235]'
                    }`}
                  >
                    <span>{option.label}</span>
                    {active ? <Check className="h-4 w-4" /> : null}
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-3 text-sm text-[#6b7280] dark:text-[#7d9ab8]">{emptyMessage}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}




