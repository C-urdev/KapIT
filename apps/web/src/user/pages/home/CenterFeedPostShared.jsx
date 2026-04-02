import React from 'react';

export const REACTION_OPTIONS = [
  { key: 'like', label: 'Like', emoji: '\u{1F44D}', badge: '\u{1F44D}', accent: 'text-[#1877f2]' },
  { key: 'love', label: 'Love', emoji: '\u2764\uFE0F', badge: '\u2764\uFE0F', accent: 'text-[#ff375f]' },
  { key: 'care', label: 'Care', emoji: '\u{1F917}', badge: '\u{1F917}', accent: 'text-[#f59e0b]' },
  { key: 'haha', label: 'Haha', emoji: '\u{1F602}', badge: '\u{1F602}', accent: 'text-[#f59e0b]' },
  { key: 'wow', label: 'Wow', emoji: '\u{1F62E}', badge: '\u{1F62E}', accent: 'text-[#f59e0b]' },
  { key: 'sad', label: 'Sad', emoji: '\u{1F622}', badge: '\u{1F622}', accent: 'text-[#3b82f6]' },
  { key: 'angry', label: 'Angry', emoji: '\u{1F621}', badge: '\u{1F621}', accent: 'text-[#ef4444]' },
];

export const SHARE_DESTINATIONS = [
  { id: 'more', label: 'More', color: 'bg-[#eef6ee] text-[#3a5a40] dark:bg-[#31343a] dark:text-white', text: '' },
  { id: 'copy', label: 'Copy link', color: 'bg-[#eef6ee] text-[#3a5a40] dark:bg-[#31343a] dark:text-white', text: '' },
];

export function Avatar({ profileImage, fallback, sizeClass = 'h-10 w-10', ringClass = '' }) {
  return <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#588157] text-sm font-semibold text-white ${sizeClass} ${ringClass}`}>{profileImage ? <img src={profileImage} alt="Avatar" className="h-full w-full object-cover" /> : fallback}</div>;
}

export function getActorKey(user) {
  const email = user?.email?.trim().toLowerCase();
  if (email) return email;
  const fallback = user?.username || user?.name;
  return fallback ? String(fallback).trim().toLowerCase() : 'anonymous';
}

export function getReactionSummary(reactions) {
  const counts = reactions.reduce((accumulator, reaction) => {
    const key = String(reaction?.type || '').trim().toLowerCase();
    if (!key) return accumulator;
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
  const sorted = Object.entries(counts).sort(([, left], [, right]) => right - left);
  const badges = sorted.slice(0, 3).map(([key]) => REACTION_OPTIONS.find((reaction) => reaction.key === key)?.badge).filter(Boolean);
  return { total: Object.values(counts).reduce((sum, value) => sum + value, 0), badges };
}

export function formatCount(value) {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`;
  return String(value);
}

export function formatRelativeTime(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}
