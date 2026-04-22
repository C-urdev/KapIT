import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { searchAccounts } from '@sharedServices/authService';
import UserSearchScopeChips from '@userComponents/search/UserSearchScopeChips';

export default function UserSearchResultsPage({
  initialQuery = '',
  initialScope = 'all',
  onBack,
  onOpenPublicProfile,
}) {
  const searchRequestRef = useRef(0);
  const [query, setQuery] = useState(String(initialQuery || ''));
  const [scope, setScope] = useState(String(initialScope || 'all'));
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setQuery(String(initialQuery || ''));
  }, [initialQuery]);

  useEffect(() => {
    setScope(String(initialScope || 'all'));
  }, [initialScope]);

  const applyScopeFilter = (items, nextScope) => {
    const normalizedScope = String(nextScope || 'all').trim().toLowerCase();
    if (normalizedScope === 'companies') {
      return items.filter((item) => String(item?.type || '').trim().toLowerCase() === 'company');
    }
    if (normalizedScope === 'people') {
      return items.filter((item) => String(item?.type || '').trim().toLowerCase() !== 'company');
    }
    return items;
  };

  const runSearch = async (nextQuery, nextScope) => {
    const normalizedQuery = String(nextQuery || '').trim();
    if (!normalizedQuery) {
      setResults([]);
      setError('');
      setLoading(false);
      return;
    }

    const requestId = searchRequestRef.current + 1;
    searchRequestRef.current = requestId;
    try {
      setLoading(true);
      setError('');
      const items = await searchAccounts(normalizedQuery, nextScope);
      if (searchRequestRef.current === requestId) {
        setResults(applyScopeFilter(items, nextScope));
      }
    } catch (fetchError) {
      if (searchRequestRef.current === requestId) {
        setResults([]);
        setError(fetchError?.message || 'Search failed');
      }
    } finally {
      if (searchRequestRef.current === requestId) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void runSearch(query, scope);
    }, 220);
    return () => clearTimeout(timer);
  }, [query, scope]);

  return (
    <div className="mx-auto w-full max-w-[min(100%,980px)]">
      <section className="rounded-2xl border border-[#a3b18a] bg-[#f8fbf6] p-3 shadow-sm dark:border-[#444d57] dark:bg-[#22272b] sm:p-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#344e41] transition-colors hover:bg-[#f1f3ec] dark:text-white dark:hover:bg-[#353c44]"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5f6f52] dark:text-white/50" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void runSearch(query, scope);
                }
              }}
              placeholder="Search people or companies"
              className="w-full rounded-full border border-[#b8c4a4] bg-[#f1f3ec] py-3 pl-11 pr-4 text-base text-[#344e41] outline-none transition-colors placeholder:text-[#6b7280] focus:ring-2 focus:ring-[#588157] dark:border-[#444d57] dark:bg-[#202428] dark:text-white dark:placeholder:text-white/40 dark:focus:ring-[#6f9b74]"
            />
          </div>
        </div>

        <UserSearchScopeChips
          value={scope}
          onChange={setScope}
          className="mt-3 pb-1"
        />
      </section>

      <section className="mt-4 space-y-2">
        {loading ? (
          <p className="px-1 py-3 text-sm text-[#344e41] dark:text-white/80">Searching...</p>
        ) : null}

        {!loading && error ? (
          <p className="px-1 py-3 text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}

        {!loading && !error && !query.trim() ? (
          <p className="px-1 py-3 text-sm text-[#5f6f52] dark:text-white/65">Type a name, username, or company to search.</p>
        ) : null}

        {!loading && !error && query.trim() && results.length === 0 ? (
          <p className="px-1 py-3 text-sm text-[#5f6f52] dark:text-white/65">No users or companies found.</p>
        ) : null}

        {!loading && !error && results.length > 0 ? (
          <div className="space-y-1">
            {results.map((result) => (
              <button
                key={result.id}
                type="button"
                onPointerDown={(event) => {
                  event.preventDefault();
                  onOpenPublicProfile?.(result);
                }}
                onClick={() => onOpenPublicProfile?.(result)}
                className="flex w-full items-center gap-3 rounded-2xl border border-transparent bg-[#f8fbf6] px-3 py-3 text-left transition-colors hover:border-[#c7ceba] hover:bg-[#f1f3ec] dark:bg-[#22272b] dark:hover:border-[#444d57] dark:hover:bg-[#353c44]"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#588157] font-bold text-white dark:bg-[#6f9b74]">
                  {result.profileImage ? (
                    <img
                      src={result.profileImage}
                      alt={`${result.username || result.email || 'Account'} profile`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (result.username || result.email || 'A').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-semibold text-[#3a5a40] dark:text-white">
                    {result.companyName || result.fullName || result.username || result.email}
                  </p>
                  <p className="truncate text-sm text-[#5f6f52] dark:text-white/70">
                    {result.type === 'company' ? 'Company' : 'User'}{result.email ? ` • ${result.email}` : ''}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
