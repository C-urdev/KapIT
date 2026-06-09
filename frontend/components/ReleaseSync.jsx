'use client';

import { useEffect } from 'react';

const CHECK_INTERVAL_MS = 60 * 1000;
const RELOAD_GUARD_KEY = 'kapit-reload-version';
const VERSION_ENDPOINT = String(import.meta.env.VITE_VERSION_ENDPOINT || '/api/version').trim();

const normalizeVersionUrl = () => {
  const base = VERSION_ENDPOINT || '/api/version';
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}ts=${Date.now()}`;
};

export default function ReleaseSync({ currentVersion }) {
  useEffect(() => {
    if (import.meta.env.MODE !== 'production') return undefined;
    if (!currentVersion) return undefined;

    let intervalId;
    let cancelled = false;

    const checkVersion = async () => {
      try {
        const response = await fetch(normalizeVersionUrl(), {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });

        if (!response.ok) return;
        const contentType = String(response.headers.get('content-type') || '').toLowerCase();
        if (!contentType.includes('application/json')) return;

        const data = await response.json();
        const latestVersion = String(data?.version || '').trim();
        const activeVersion = String(currentVersion || '').trim();

        if (!latestVersion || latestVersion === activeVersion) return;

        const alreadyReloadedFor = sessionStorage.getItem(RELOAD_GUARD_KEY);
        if (alreadyReloadedFor === latestVersion) return;

        sessionStorage.setItem(RELOAD_GUARD_KEY, latestVersion);
        window.location.reload();
      } catch {
        // Ignore transient connectivity issues.
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !cancelled) {
        checkVersion();
      }
    };

    checkVersion();
    intervalId = window.setInterval(checkVersion, CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentVersion]);

  return null;
}
