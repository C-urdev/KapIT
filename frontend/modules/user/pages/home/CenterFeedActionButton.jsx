import React from 'react';
import { REACTION_OPTIONS } from './CenterFeedPostShared';

export function ActionButton({ icon: Icon, label, onClick, active = false, accentClass = '', emoji = '', onPointerDown, onPointerUp, onPointerLeave, onContextMenu }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onContextMenu={onContextMenu}
      className={`flex items-center justify-center gap-2 rounded-xl px-2 py-3 text-sm font-medium transition-colors ${active ? `bg-[#edf4ff] ${accentClass || 'text-[#2d6cdf]'} dark:bg-[#2a2f35] dark:text-[#e2b94d]` : 'text-[#344e41] hover:bg-[#f5f5f2] dark:text-[#e2e6e9] dark:hover:bg-[#353c44]'}`}
    >
      {emoji ? <span className="text-base leading-none">{emoji}</span> : <Icon className={`h-4 w-4 ${active ? 'fill-current' : ''}`} />}
      <span>{label}</span>
    </button>
  );
}

export function ReactionPicker({ selectedReaction, onSelect }) {
  return (
    <div className="absolute -top-[4.25rem] left-3 z-10 rounded-full border border-[#bfd0af] bg-[#f8fbf6]/96 px-2 py-2 shadow-[0_10px_30px_rgba(58,90,64,0.16)] backdrop-blur-sm dark:border-[#444d57] dark:bg-[#2f343b]/96">
      <div className="flex items-center gap-1">
        {REACTION_OPTIONS.map((reaction) => (
          <button key={reaction.key} type="button" onClick={() => onSelect(reaction.key)} className={`flex h-11 w-11 items-center justify-center rounded-full text-[1.6rem] transition-transform hover:-translate-y-1 ${selectedReaction === reaction.key ? 'bg-[#eef6ee] dark:bg-[#31363d]' : ''}`} aria-label={reaction.label} title={reaction.label}>
            {reaction.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
