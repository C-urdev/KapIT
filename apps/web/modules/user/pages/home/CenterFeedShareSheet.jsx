import React, { useEffect, useRef, useState } from 'react';
import { Bookmark, ChevronDown, ImageIcon, Link2, MoreHorizontal, Smile } from 'lucide-react';
import { Avatar, SHARE_DESTINATIONS } from './CenterFeedPostShared';

function Chip({ label, leadingIcon: LeadingIcon }) {
  return <span className="inline-flex items-center gap-2 rounded-2xl border border-[#bfd0af] bg-[#f8fbf6] px-3 py-2 font-medium text-[#3a5a40] dark:border-transparent dark:bg-white/10 dark:text-white">{LeadingIcon ? <LeadingIcon className="h-4 w-4" /> : null}{label}</span>;
}

const VISIBILITY_OPTIONS = [
  { value: 'Only me', helper: 'Only you can see this shared post.' },
  { value: 'Public', helper: 'Anyone can see this shared post.' },
];

export default function CenterFeedShareSheet({ displayName, profileImage, shareMessage, setShareMessage, shareVisibility, setShareVisibility, hasShared, onClose, onShare }) {
  const [visibilityMenuOpen, setVisibilityMenuOpen] = useState(false);
  const visibilityMenuRef = useRef(null);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!visibilityMenuRef.current?.contains(event.target)) {
        setVisibilityMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  return (
    <div className="fixed inset-0 z-[95] flex items-end bg-[#344e41]/18 backdrop-blur-[2px] dark:bg-black/35 dark:backdrop-blur-[2px]" onClick={onClose}>
      <div className="max-h-[88vh] w-full overflow-y-auto rounded-t-[2rem] border-t border-[#bfd0af] bg-[linear-gradient(180deg,#ebe7dc_0%,#dad7cd_100%)] px-4 pb-6 pt-3 text-[#344e41] shadow-2xl dark:border-[#444d57] dark:bg-[#23262b] dark:text-white" style={{ paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom) + 1rem))' }} onClick={(event) => event.stopPropagation()}>
        <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-[#9caf88] dark:bg-white/30" />
        <div className="mx-auto w-full max-w-4xl rounded-[1.75rem] border border-[#bfd0af] bg-[#f8fbf6] p-5 shadow-[0_14px_34px_rgba(58,90,64,0.1)] dark:border-[#4b5560] dark:bg-[#34343a] dark:shadow-none">
          <div className="flex items-start gap-3">
            <Avatar profileImage={profileImage} fallback={displayName.charAt(0).toUpperCase()} sizeClass="h-14 w-14" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[1.35rem] font-semibold text-[#3a5a40] dark:text-white">{displayName}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                <Chip label="Feed" />
                <div className="relative" ref={visibilityMenuRef}>
                  <button type="button" onClick={() => setVisibilityMenuOpen((current) => !current)} className="inline-flex items-center gap-2 rounded-2xl border border-[#bfd0af] bg-[#f8fbf6] px-3 py-2 font-medium text-[#3a5a40] dark:border-transparent dark:bg-white/10 dark:text-white">
                    <Bookmark className="h-4 w-4" />
                    {shareVisibility}
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {visibilityMenuOpen ? (
                    <div className="absolute left-0 top-[calc(100%+0.5rem)] z-20 min-w-56 overflow-hidden rounded-2xl border border-[#bfd0af] bg-[#f8fbf6] shadow-[0_12px_30px_rgba(58,90,64,0.12)] dark:border-[#4b5560] dark:bg-[#34343a]">
                      {VISIBILITY_OPTIONS.map((option) => (
                        <button key={option.value} type="button" onClick={() => { setShareVisibility(option.value); setVisibilityMenuOpen(false); }} className={`block w-full px-4 py-3 text-left transition-colors hover:bg-[#f5f5f2] dark:hover:bg-white/10 ${shareVisibility === option.value ? 'bg-[#f8fbf6] text-[#3a5a40] dark:bg-white/10 dark:text-white' : 'text-[#5f6f52] dark:text-white/80'}`}>
                          <span className="block text-sm font-semibold">{option.value}</span>
                          <span className="mt-1 block text-xs">{option.helper}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
          <textarea value={shareMessage} onChange={(event) => setShareMessage(event.target.value)} placeholder="Say something about this..." className="mt-4 min-h-28 w-full resize-none rounded-[1.35rem] border border-[#d9dfcf] bg-[#f8fbf6] px-4 py-3 text-[1.02rem] text-[#344e41] outline-none transition-colors placeholder:text-[#6f7d60] focus:border-[#a3b18a] focus:bg-[#fcfdf8] dark:border-[#41566f] dark:bg-transparent dark:text-white dark:placeholder:text-white/55 dark:focus:border-[#5f87b0] dark:focus:bg-[#3b3d44]" />
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#e1e8d7] pt-4 dark:border-white/8">
            <div className="flex items-center gap-3 text-[#5f6f52] dark:text-white/75"><button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#f3f7ef] transition-colors hover:bg-[#e7f0e1] dark:bg-transparent dark:hover:bg-white/8"><Smile className="h-5 w-5" /></button><button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#f3f7ef] transition-colors hover:bg-[#e7f0e1] dark:bg-transparent dark:hover:bg-white/8"><ImageIcon className="h-5 w-5" /></button></div>
            <button type="button" onClick={onShare} className="rounded-2xl bg-[#3a5a40] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[#344e41] dark:bg-[#1877f2] dark:hover:bg-[#1663cc]">{hasShared ? 'Shared' : 'Share now'}</button>
          </div>
        </div>
        <section className="mx-auto mt-6 w-full max-w-4xl rounded-[1.75rem] border border-[#bfd0af] bg-[#f8fbf6] px-5 py-5 shadow-[0_14px_34px_rgba(58,90,64,0.08)] dark:border-[#4b5560] dark:bg-[#2b2f35] dark:shadow-none">
          <h3 className="text-[1.35rem] font-semibold text-[#3a5a40] dark:text-white">Share to</h3>
          <div className="mt-4 flex gap-5 overflow-x-auto pb-1">
            {SHARE_DESTINATIONS.map((destination) => (
              <button key={destination.id} type="button" onClick={onShare} className="w-[5.3rem] shrink-0 text-center">
                <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#d9dfcf] text-lg font-semibold shadow-[0_6px_14px_rgba(58,90,64,0.06)] dark:border-transparent dark:shadow-none ${destination.color}`}>
                  {destination.id === 'copy' ? <Link2 className="h-7 w-7" /> : null}
                  {destination.id === 'more' ? <MoreHorizontal className="h-6 w-6" /> : null}
                  {destination.text || null}
                </span>
                <p className="mt-3 text-sm leading-5 text-[#344e41] dark:text-white/92">{destination.label}</p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
