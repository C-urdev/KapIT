import React, { useMemo, useState } from 'react';
import { Image, MapPin, Smile, Users, Video, X } from 'lucide-react';

export default function PostComposerModal({ isOpen, user, onClose, onSubmit }) {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('Only me');
  const profileImage = user?.profileImage || '';

  const displayName = useMemo(
    () => user?.username || user?.name || 'User',
    [user?.username, user?.name]
  );

  if (!isOpen) {
    return null;
  }

  const handlePost = () => {
    const trimmed = content.trim();
    if (!trimmed) {
      return;
    }
    onSubmit({ content: trimmed, visibility });
    setContent('');
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
              <select
                value={visibility}
                onChange={(event) => setVisibility(event.target.value)}
                className="mt-1 text-sm border border-[#a3b18a] dark:border-[#2a4a6f] bg-[#f5f5f2] dark:bg-[#1e3a5f] text-[#344e41] dark:text-white rounded-md px-2 py-1"
              >
                <option>Only me</option>
                <option>Friends</option>
                <option>Public</option>
              </select>
            </div>
          </div>

          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={`What's on your mind, ${displayName}?`}
            className="w-full min-h-44 resize-none bg-transparent text-[#344e41] dark:text-white placeholder-[#3a5a40] dark:placeholder-[#7d9ab8] text-xl leading-relaxed outline-none"
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
