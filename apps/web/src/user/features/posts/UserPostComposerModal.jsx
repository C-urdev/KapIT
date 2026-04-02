import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, ChevronDown, Image, MapPin, Smile, Users, Video, X } from 'lucide-react';

const VISIBILITY_OPTIONS = [
  { value: 'Only me', helper: 'Only you can see this post.' },
  { value: 'Public', helper: 'Anyone can see this post.' },
];

export default function PostComposerModal({ isOpen, user, onClose, onSubmit }) {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [visibility, setVisibility] = useState('Only me');
  const [visibilityMenuOpen, setVisibilityMenuOpen] = useState(false);
  const visibilityMenuRef = useRef(null);
  const profileImage = user?.profileImage || '';

  const displayName = useMemo(
    () => user?.username || user?.name || 'User',
    [user?.username, user?.name]
  );

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!visibilityMenuRef.current?.contains(event.target)) {
        setVisibilityMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  if (!isOpen) {
    return null;
  }

  const handlePost = () => {
    const trimmed = content.trim();
    if (!trimmed) {
      return;
    }
    onSubmit({ content: trimmed, visibility, imageUrl: imageUrl.trim() });
    setContent('');
    setImageUrl('');
    setVisibility('Only me');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#a3b18a] dark:border-[#2a4a6f] flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#3a5a40] dark:text-white">Create post</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] text-[#344e41] dark:text-white"
            aria-label="Close create post modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#588157] dark:bg-[#3ba9d6] rounded-full flex items-center justify-center text-white font-semibold text-lg overflow-hidden">
              {profileImage ? (
                <img src={profileImage} alt={`${displayName} profile`} className="w-full h-full object-cover" />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <p className="font-semibold text-[#3a5a40] dark:text-white">{displayName}</p>
              <div className="relative mt-1" ref={visibilityMenuRef}>
                <button type="button" onClick={() => setVisibilityMenuOpen((current) => !current)} className="inline-flex items-center gap-2 rounded-2xl border border-[#bfd0af] bg-[#f8fbf6] px-3 py-2 text-sm font-medium text-[#3a5a40] dark:border-transparent dark:bg-white/10 dark:text-white">
                  <Bookmark className="h-4 w-4" />
                  {visibility}
                  <ChevronDown className="h-4 w-4" />
                </button>
                {visibilityMenuOpen ? (
                  <div className="absolute left-0 top-[calc(100%+0.5rem)] z-20 min-w-56 overflow-hidden rounded-2xl border border-[#bfd0af] bg-white shadow-[0_12px_30px_rgba(58,90,64,0.12)] dark:border-[#314a68] dark:bg-[#34343a]">
                    {VISIBILITY_OPTIONS.map((option) => (
                      <button key={option.value} type="button" onClick={() => { setVisibility(option.value); setVisibilityMenuOpen(false); }} className={`block w-full px-4 py-3 text-left transition-colors hover:bg-[#f5f5f2] dark:hover:bg-white/10 ${visibility === option.value ? 'bg-[#f8fbf6] text-[#3a5a40] dark:bg-white/10 dark:text-white' : 'text-[#5f6f52] dark:text-white/80'}`}>
                        <span className="block text-sm font-semibold">{option.value}</span>
                        <span className="mt-1 block text-xs">{option.helper}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={`What's on your mind, ${displayName}?`}
            className="w-full min-h-44 resize-none bg-transparent text-[#344e41] dark:text-white placeholder-[#3a5a40] dark:placeholder-[#7d9ab8] text-xl leading-relaxed outline-none"
          />

          <input
            type="url"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="Optional photo URL"
            className="mt-3 w-full rounded-xl border border-[#a3b18a] bg-[#f8fbf6] px-4 py-3 text-sm text-[#344e41] outline-none transition-colors placeholder:text-[#6b7280] focus:border-[#588157] dark:border-[#2a4a6f] dark:bg-[#102235] dark:text-white dark:placeholder:text-[#7d9ab8] dark:focus:border-[#3ba9d6]"
          />

          <div className="mt-4 border border-[#a3b18a] dark:border-[#2a4a6f] rounded-xl p-3">
            <p className="text-sm font-semibold text-[#3a5a40] dark:text-white mb-2">Add to your post</p>
            <div className="flex items-center gap-3 text-[#588157] dark:text-[#3ba9d6]">
              <Video className="w-5 h-5" />
              <Image className="w-5 h-5" />
              <Users className="w-5 h-5" />
              <Smile className="w-5 h-5" />
              <MapPin className="w-5 h-5" />
            </div>
          </div>

          <button
            onClick={handlePost}
            disabled={!content.trim()}
            className="mt-4 w-full bg-[#3a5a40] hover:bg-[#344e41] disabled:opacity-50 disabled:cursor-not-allowed dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de] text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}



