import React, { useMemo, useRef, useState } from 'react';
import { ChevronDown, Globe, Image, Lock, MapPin, Smile, Users, X } from 'lucide-react';

const VISIBILITY_OPTIONS = [
  { value: 'Only me', icon: Lock },
  { value: 'Public', icon: Globe },
];

export default function PostComposerModal({ isOpen, user, onClose, onSubmit }) {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [visibility, setVisibility] = useState('Only me');
  const [visibilityMenuOpen, setVisibilityMenuOpen] = useState(false);
  const imageInputRef = useRef(null);
  const textareaRef = useRef(null);
  const visibilityMenuRef = useRef(null);
  const profileImage = user?.profileImage || '';

  const displayName = useMemo(
    () => user?.username || user?.name || 'User',
    [user?.username, user?.name]
  );
  const selectedVisibilityIcon = VISIBILITY_OPTIONS.find((option) => option.value === visibility)?.icon || Lock;

  if (!isOpen) {
    return null;
  }

  const actionChips = [
    {
      key: 'gallery',
      label: 'Gallery',
      icon: Image,
      onClick: () => imageInputRef.current?.click(),
    },
    {
      key: 'people',
      label: 'People',
      icon: Users,
      onClick: () => insertIntoContent('@'),
    },
    {
      key: 'location',
      label: 'Location',
      icon: MapPin,
      onClick: () => insertIntoContent('📍'),
    },
    {
      key: 'feeling',
      label: 'Feeling',
      icon: Smile,
      onClick: () => insertIntoContent('😊'),
    },
  ];

  const handlePost = () => {
    const trimmed = content.trim();
    if (!trimmed && !imageUrl.trim()) {
      return;
    }
    onSubmit({ content: trimmed, visibility, imageUrl: imageUrl.trim() });
    setContent('');
    setImageUrl('');
    setVisibility('Only me');
    onClose();
  };

  const insertIntoContent = (value) => {
    setContent((current) => `${current}${current ? ' ' : ''}${value}`);
    window.setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleImagePick = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center sm:p-4">
      <div className="flex h-full w-full max-w-3xl flex-col overflow-hidden bg-white dark:bg-[#162842] sm:h-[58vh] sm:max-h-[58vh] sm:rounded-2xl sm:border sm:border-[#a3b18a] sm:dark:border-[#1e3a5f] sm:shadow-2xl">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6">
          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center text-[#344e41] transition-colors hover:text-[#3a5a40] dark:text-white dark:hover:text-[#b8d4e8]"
            aria-label="Close create post modal"
          >
            <X className="h-6 w-6" />
          </button>
          <h2 className="text-xl font-bold text-[#3a5a40] dark:text-white sm:text-2xl">New post</h2>
          <span className="inline-flex h-10 w-10" aria-hidden="true" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="w-12 h-12 bg-[#588157] dark:bg-[#3ba9d6] rounded-full flex items-center justify-center text-white font-semibold text-lg overflow-hidden">
              {profileImage ? (
                <img src={profileImage} alt={`${displayName} profile`} className="w-full h-full object-cover" />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <p className="font-semibold text-[#3a5a40] dark:text-white">{displayName}</p>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {actionChips.map(({ key, label, icon: Icon, onClick }) => (
              <button
                key={key}
                type="button"
                onClick={onClick}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#d8dfc9] bg-[#f5f5f2] px-4 py-2.5 text-sm font-medium text-[#344e41] transition-colors hover:bg-[#eef6ee] dark:border-[#2a4a6f] dark:bg-[#102235] dark:text-white dark:hover:bg-[#16304a]"
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          <textarea
            ref={textareaRef}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="What's on your mind?"
            className="w-full min-h-[15rem] flex-1 resize-none bg-transparent text-[#344e41] text-2xl leading-relaxed outline-none placeholder:text-[#5f6f52] dark:text-white dark:placeholder:text-[#7d9ab8]"
          />

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImagePick}
            className="hidden"
          />

          {imageUrl ? (
            <div className="mt-3 overflow-hidden rounded-xl border border-[#a3b18a] bg-[#f8fbf6] dark:border-[#2a4a6f] dark:bg-[#102235]">
              <img src={imageUrl} alt="Selected post attachment" className="max-h-56 w-full object-cover" />
              <div className="flex justify-end p-2">
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl('');
                    if (imageInputRef.current) {
                      imageInputRef.current.value = '';
                    }
                  }}
                  className="text-sm font-medium text-[#3a5a40] hover:text-[#344e41] dark:text-[#b8d4e8] dark:hover:text-white"
                >
                  Remove image
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="relative" ref={visibilityMenuRef}>
              <button
                type="button"
                onClick={() => setVisibilityMenuOpen((current) => !current)}
                className="inline-flex items-center gap-2 rounded-full border border-[#bfd0af] bg-[#f8fbf6] px-4 py-2.5 text-sm font-medium text-[#3a5a40] dark:border-transparent dark:bg-white/10 dark:text-white"
              >
                {React.createElement(selectedVisibilityIcon, { className: 'h-4 w-4' })}
                {visibility}
                <ChevronDown className="h-4 w-4" />
              </button>
              {visibilityMenuOpen ? (
                <div className="absolute bottom-[calc(100%+0.5rem)] left-0 z-20 min-w-40 overflow-hidden rounded-2xl border border-[#bfd0af] bg-white shadow-[0_12px_30px_rgba(58,90,64,0.12)] dark:border-[#314a68] dark:bg-[#34343a]">
                  {VISIBILITY_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setVisibility(option.value);
                        setVisibilityMenuOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-[#f5f5f2] dark:hover:bg-white/10 ${visibility === option.value ? 'bg-[#f8fbf6] text-[#3a5a40] dark:bg-white/10 dark:text-white' : 'text-[#5f6f52] dark:text-white/80'}`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="block text-sm font-semibold">{option.value}</span>
                    </button>
                  )})}
                </div>
              ) : null}
            </div>
            <button
              onClick={handlePost}
              disabled={!content.trim() && !imageUrl.trim()}
              className="min-w-[9rem] rounded-2xl bg-[#3a5a40] px-5 py-3 text-white font-semibold transition-colors hover:bg-[#344e41] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de]"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



