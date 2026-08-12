import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, FileText, Plus, Trash2 } from 'lucide-react';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_FORMATTER = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' });
const DAY_FORMATTER = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' });

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const fromDateKey = (dateKey) => {
  const [year, month, day] = String(dateKey || '').split('-').map(Number);
  if (!year || !month || !day) {
    return new Date();
  }
  return new Date(year, month - 1, day);
};

const buildMonthDays = (visibleDate) => {
  const year = visibleDate.getFullYear();
  const month = visibleDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const firstVisibleDate = new Date(year, month, 1 - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstVisibleDate);
    date.setDate(firstVisibleDate.getDate() + index);
    return {
      date,
      dateKey: toDateKey(date),
      isCurrentMonth: date.getMonth() === month,
      isToday: toDateKey(date) === toDateKey(new Date()),
    };
  });
};

const createStorageKey = (user) => {
  const userKey = user?.id || user?.userId || user?.email || user?.username || 'local';
  return `kapit_user_calendar_entries:${userKey}`;
};

const normalizeEntries = (items) => (
  Array.isArray(items)
    ? items
        .map((item) => ({
          id: String(item?.id || ''),
          date: String(item?.date || ''),
          title: String(item?.title || '').trim(),
          time: String(item?.time || '').trim(),
          note: String(item?.note || '').trim(),
          createdAt: String(item?.createdAt || ''),
        }))
        .filter((item) => item.id && item.date && item.title)
    : []
);

export default function UserCalendarPage({ user }) {
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const [visibleDate, setVisibleDate] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const [entries, setEntries] = useState([]);
  const [hydratedStorageKey, setHydratedStorageKey] = useState('');
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const storageKey = useMemo(() => createStorageKey(user), [user]);
  const monthDays = useMemo(() => buildMonthDays(visibleDate), [visibleDate]);
  const selectedDate = useMemo(() => fromDateKey(selectedDateKey), [selectedDateKey]);
  const entriesByDate = useMemo(() => {
    return entries.reduce((groups, entry) => {
      groups[entry.date] = groups[entry.date] || [];
      groups[entry.date].push(entry);
      return groups;
    }, {});
  }, [entries]);
  const selectedEntries = entriesByDate[selectedDateKey] || [];
  const upcomingEntries = useMemo(() => {
    return entries
      .filter((entry) => entry.date >= todayKey)
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
      .slice(0, 4);
  }, [entries, todayKey]);

  useEffect(() => {
    setHydratedStorageKey('');
    try {
      const saved = window.localStorage.getItem(storageKey);
      setEntries(normalizeEntries(saved ? JSON.parse(saved) : []));
    } catch {
      setEntries([]);
    } finally {
      setHydratedStorageKey(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    if (hydratedStorageKey !== storageKey) {
      return;
    }
    window.localStorage.setItem(storageKey, JSON.stringify(entries));
  }, [entries, hydratedStorageKey, storageKey]);

  const changeMonth = (offset) => {
    setVisibleDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      return;
    }

    const nextEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      date: selectedDateKey,
      title: normalizedTitle,
      time: time.trim(),
      note: note.trim(),
      createdAt: new Date().toISOString(),
    };

    setEntries((current) => [...current, nextEntry]);
    setTitle('');
    setTime('');
    setNote('');
  };

  const deleteEntry = (entryId) => {
    setEntries((current) => current.filter((entry) => entry.id !== entryId));
  };

  return (
    <div className="mx-auto w-full max-w-[min(100%,1500px)] flex h-full min-h-0 flex-col gap-4">
      <header className="shrink-0 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="user-workspace-page-title">Calendar</h1>
        </div>
        <div className="user-workspace-surface-subtle inline-flex h-10 w-fit items-center gap-2 px-3 text-sm font-medium text-[var(--user-text)]">
          <CalendarDays className="h-4 w-4 text-[var(--user-primary)]" />
          <span>{DAY_FORMATTER.format(new Date())}</span>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="user-workspace-surface flex min-h-0 min-w-0 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--user-border)] px-4 py-3 sm:px-5">
            <h2 className="user-workspace-section-title">{MONTH_FORMATTER.format(visibleDate)}</h2>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => changeMonth(-1)} className="flex h-10 w-10 items-center justify-center rounded-md text-[var(--user-text-muted)] transition-colors duration-150 hover:bg-[var(--user-surface-selected)] hover:text-[var(--user-text-strong)]" aria-label="Previous month">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => setVisibleDate(new Date())} className="h-10 rounded-md px-3 text-sm font-semibold text-[var(--user-primary)] transition-colors duration-150 hover:bg-[var(--user-surface-selected)]">
                Today
              </button>
              <button type="button" onClick={() => changeMonth(1)} className="flex h-10 w-10 items-center justify-center rounded-md text-[var(--user-text-muted)] transition-colors duration-150 hover:bg-[var(--user-surface-selected)] hover:text-[var(--user-text-strong)]" aria-label="Next month">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-[var(--user-border)] bg-[var(--user-surface-subtle)]">
            {WEEKDAYS.map((day) => (
              <div key={day} className="px-2 py-2.5 text-center text-xs font-semibold uppercase tracking-[0.08em] text-[var(--user-text-muted)]">
                {day}
              </div>
            ))}
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6">
            {monthDays.map((day, index) => {
              const dayEntries = entriesByDate[day.dateKey] || [];
              const isSelected = selectedDateKey === day.dateKey;
              return (
                <button
                  key={day.dateKey}
                  type="button"
                  onClick={() => setSelectedDateKey(day.dateKey)}
                  className={`min-h-0 overflow-hidden border-b border-[var(--user-border)] p-2 text-left transition-[background-color,color] duration-150 hover:bg-[var(--user-surface-subtle)] ${
                    isSelected ? 'bg-[var(--user-surface-selected)]' : ''
                  } ${(index + 1) % 7 === 0 ? '' : 'border-r'} ${day.isCurrentMonth ? 'text-[var(--user-text-strong)]' : 'text-[var(--user-text-muted)] opacity-70'}`}
                  aria-pressed={isSelected}
                >
                  <span className={`flex h-7 w-7 items-center justify-center rounded-md text-sm font-semibold tabular-nums ${
                    day.isToday ? 'bg-[var(--user-primary)] text-white' : ''
                  }`}>
                    {day.date.getDate()}
                  </span>
                  <span className="mt-2 block space-y-1">
                    {dayEntries.slice(0, 2).map((entry) => (
                      <span key={entry.id} className="block truncate rounded-md bg-[var(--user-primary-soft)] px-2 py-1 text-xs font-medium text-[var(--user-primary)]">
                        {entry.time ? `${entry.time} ` : ''}{entry.title}
                      </span>
                    ))}
                    {dayEntries.length > 2 ? (
                      <span className="block text-xs font-medium text-[var(--user-text-muted)]">+{dayEntries.length - 2} more</span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="space-y-4 xl:min-h-0 xl:space-y-3 xl:overflow-hidden">
          <section className="user-workspace-surface p-5 xl:p-4">
            <div>
              <p className="text-sm font-medium text-[var(--user-primary)]">Selected day</p>
              <h2 className="user-workspace-section-title mt-1">{DAY_FORMATTER.format(selectedDate)}</h2>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-2.5">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--user-text-muted)]">Title</span>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Interview, follow-up, note..."
                  className="mt-1 h-10 w-full rounded-md border border-[var(--user-border)] bg-[var(--user-surface-subtle)] px-3 text-sm text-[var(--user-text-strong)] outline-none transition-[border-color,background-color,box-shadow] duration-150 placeholder:text-[var(--user-text-muted)] focus:border-[var(--user-primary)] focus:bg-[var(--user-surface)] focus:ring-2 focus:ring-[var(--user-primary-soft)]"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--user-text-muted)]">Time</span>
                <input
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-[var(--user-border)] bg-[var(--user-surface-subtle)] px-3 text-sm text-[var(--user-text-strong)] outline-none transition-[border-color,background-color,box-shadow] duration-150 focus:border-[var(--user-primary)] focus:bg-[var(--user-surface)] focus:ring-2 focus:ring-[var(--user-primary-soft)]"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--user-text-muted)]">Notes</span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Add details, links, or reminders."
                  rows={4}
                  className="mt-1 h-24 w-full resize-none rounded-md border border-[var(--user-border)] bg-[var(--user-surface-subtle)] px-3 py-2 text-sm leading-6 text-[var(--user-text-strong)] outline-none transition-[border-color,background-color,box-shadow] duration-150 placeholder:text-[var(--user-text-muted)] focus:border-[var(--user-primary)] focus:bg-[var(--user-surface)] focus:ring-2 focus:ring-[var(--user-primary-soft)]"
                />
              </label>
              <button type="submit" className="user-workspace-primary-button inline-flex w-full items-center justify-center gap-2 px-4 text-sm font-semibold">
                <Plus className="h-4 w-4" />
                Add to calendar
              </button>
            </form>
          </section>

          <section className="user-workspace-surface p-5 xl:p-4">
            <h2 className="user-workspace-section-title">Day notes</h2>
            <div className="mt-4 space-y-3">
              {selectedEntries.length > 0 ? selectedEntries.map((entry) => (
                <article key={entry.id} className="rounded-md border border-[var(--user-border)] bg-[var(--user-surface-subtle)] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-[var(--user-text-strong)]">{entry.title}</h3>
                      {entry.time ? (
                        <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[var(--user-text-muted)]">
                          <Clock className="h-3.5 w-3.5" />
                          {entry.time}
                        </p>
                      ) : null}
                    </div>
                    <button type="button" onClick={() => deleteEntry(entry.id)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[var(--user-text-muted)] transition-colors duration-150 hover:bg-[var(--user-surface-selected)] hover:text-[var(--user-danger)]" aria-label={`Delete ${entry.title}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {entry.note ? <p className="mt-3 text-sm leading-6 text-[var(--user-text)] [text-wrap:pretty]">{entry.note}</p> : null}
                </article>
              )) : (
                <div className="flex items-center justify-center gap-3 rounded-md border border-dashed border-[var(--user-border)] bg-[var(--user-surface-subtle)] px-4 py-3 xl:h-14">
                  <FileText className="h-5 w-5 shrink-0 text-[var(--user-text-muted)]" />
                  <p className="text-sm font-medium text-[var(--user-text-strong)]">No notes for this day</p>
                </div>
              )}
            </div>
          </section>

          <section className="user-workspace-surface p-5 xl:p-4">
            <h2 className="user-workspace-section-title">Upcoming</h2>
            <div className="mt-4 space-y-2">
              {upcomingEntries.length > 0 ? upcomingEntries.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => {
                    const entryDate = fromDateKey(entry.date);
                    setVisibleDate(new Date(entryDate.getFullYear(), entryDate.getMonth(), 1));
                    setSelectedDateKey(entry.date);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-md border border-[var(--user-border)] bg-[var(--user-surface-subtle)] px-3 py-2.5 text-left transition-colors duration-150 hover:border-[var(--user-border-strong)] hover:bg-[var(--user-surface-selected)]"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[var(--user-text-strong)]">{entry.title}</span>
                    <span className="block text-xs text-[var(--user-text-muted)]">{entry.date}{entry.time ? ` at ${entry.time}` : ''}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[var(--user-text-muted)]" />
                </button>
              )) : (
                <p className="rounded-md border border-dashed border-[var(--user-border)] px-4 py-5 text-sm text-[var(--user-text-muted)] xl:py-4">
                  Upcoming notes will appear here.
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
