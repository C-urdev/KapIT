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
  allowCustomValue = false,
}) {
  const normalizedOptions = useMemo(() => normalizeOptions(options), [options]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const triggerSearchRef = useRef(null);
  const hasSelection = Boolean(String(value || '').trim());

  const selectedOption = normalizedOptions.find((option) => option.value === value) || (value ? { value: String(value), label: String(value) } : null);
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
    <div ref={rootRef} className="relative font-sans">
      {searchInTrigger ? (
        <div className={`${className} flex w-full items-center gap-3 disabled:cursor-not-allowed disabled:opacity-60 ${hasSelection ? 'bg-[#eef6ee] border-[#7aa27d] dark:bg-[#1f2b23] dark:border-[#5f8a68]' : ''}`}>
          <Search className="h-4 w-4 shrink-0 text-[#6b7280] dark:text-[#adb5be]" />
          <input
            ref={triggerSearchRef}
            type="text"
            value={open ? query : (selectedOption?.label || '')}
            onFocus={() => !disabled && setOpen(true)}
            onKeyDown={(event) => {
              if (!allowCustomValue || disabled) return;
              if (event.key !== 'Enter') return;
              const nextValue = query.trim();
              if (!nextValue) return;
              event.preventDefault();
              onChange?.(nextValue);
              setOpen(false);
              setQuery('');
            }}
            onChange={(event) => {
              if (disabled) return;
              setOpen(true);
              setQuery(event.target.value);
            }}
            placeholder={placeholder}
            disabled={disabled}
            className={`min-w-0 flex-1 bg-transparent text-left outline-none placeholder:text-[#6b7280] dark:placeholder:text-[#adb5be] ${hasSelection ? 'text-[#1f3a2a] dark:text-[#e7f4ea]' : 'text-[#344e41] dark:text-white'}`}
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => setOpen((prev) => !prev)}
            className="shrink-0 text-[#6b7280] dark:text-[#adb5be]"
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
          className={`${className} flex w-full items-center justify-between gap-3 text-left disabled:cursor-not-allowed disabled:opacity-60 ${hasSelection ? 'bg-[#eef6ee] border-[#7aa27d] dark:bg-[#1f2b23] dark:border-[#5f8a68]' : ''}`}
        >
          <span className={selectedOption ? 'text-[#1f3a2a] dark:text-[#e7f4ea]' : 'text-[#6b7280] dark:text-[#adb5be]'}>
            {selectedOption?.label || placeholder}
          </span>
          <span className="inline-flex items-center gap-2 text-[#6b7280] dark:text-[#adb5be]">
            <Search className="h-4 w-4" />
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </span>
        </button>
      )}

      {open && !disabled && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-[#a3b18a] bg-white shadow-xl shadow-black/10 dark:border-[#444d57] dark:bg-[#22272b] dark:shadow-black/30">
          {!searchInTrigger && (
            <div className="border-b border-[#d6d3c9] p-3 dark:border-[#444d57]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280] dark:text-[#adb5be]" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-lg border border-[#d1d5db] bg-[#f8faf7] py-2 pl-9 pr-3 text-sm text-[#344e41] outline-none transition-colors focus:border-[#588157] dark:border-[#444d57] dark:bg-[#1a1d20] dark:text-white dark:focus:border-[#6f9b74]"
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
                        ? 'bg-[#eef6ee] text-[#3a5a40] dark:bg-[#353c44] dark:text-white'
                        : 'text-[#344e41] hover:bg-[#f5f5f2] dark:text-[#eceff2] dark:hover:bg-[#202428]'
                    }`}
                  >
                    <span>{option.label}</span>
                    {active ? <Check className="h-4 w-4" /> : null}
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-3 text-sm text-[#6b7280] dark:text-[#adb5be]">{emptyMessage}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}




