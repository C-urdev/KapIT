// CenterFeed 

import React from 'react';
import { Bookmark, Plus, Search } from 'lucide-react';
import { isPostSavedForUser, toggleSavedPostForUser } from '@userFeatures/activity/userActivityStorage';

export default function CenterFeed({ user, userType, onOpenComposer, posts = [], onToggleSavePost, onBrowsePeople, onExploreProjects }) {
  const displayName = user?.username || user?.name || 'User';
  const userInitial = displayName.charAt(0).toUpperCase();
  const profileImage = user?.profileImage || '';

  return (
    <div className="space-y-4">
      {/* Post Composer */}
      <div className="bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-xl p-4">
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-[#588157] dark:bg-[#3ba9d6] rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
            {profileImage ? (
              <img src={profileImage} alt={`${displayName} profile`} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-semibold">{userInitial}</span>
            )}
          </div>
          <button
            onClick={onOpenComposer}
            className="flex-1 text-left px-4 py-3 bg-[#f5f5f2] dark:bg-[#1e3a5f] hover:bg-[#dad7cd] dark:hover:bg-[#0f2139] border border-[#a3b18a] dark:border-[#2a4a6f] rounded-full text-[#344e41] dark:text-[#b8d4e8] transition-colors"
          >
            Share an update or project...
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#a3b18a] dark:border-[#2a4a6f]">
          <ComposerButton icon={Plus} text={userType === 'employee' ? 'Add Project' : 'Post Job'} onClick={onOpenComposer} />
          <ComposerButton icon={Plus} text="Share Update" onClick={onOpenComposer} />
        </div>
      </div>
      {posts.length > 0 && (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-[#3a5a40] dark:text-white">{displayName}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#3a5a40] dark:text-[#7d9ab8]">{new Date(post.createdAt).toLocaleString()}</span>
                  <button
                    type="button"
                    onClick={() => onToggleSavePost?.(post)}
                    className={`rounded-lg border p-2 transition-colors ${
                      isPostSavedForUser(user, post.id)
                        ? 'border-[#588157] bg-[#eef6ee] text-[#3a5a40] dark:border-[#3ba9d6] dark:bg-[#14304d] dark:text-[#dcecff]'
                        : 'border-[#a3b18a] text-[#344e41] hover:bg-[#f5f5f2] dark:border-[#2a4a6f] dark:text-white dark:hover:bg-[#1e3a5f]'
                    }`}
                    aria-label={isPostSavedForUser(user, post.id) ? 'Remove saved post' : 'Save post'}
                  >
                    <Bookmark className={`h-4 w-4 ${isPostSavedForUser(user, post.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>
              <p className="text-[#344e41] dark:text-[#b8d4e8] whitespace-pre-wrap">{post.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {posts.length === 0 && (
        <div className="bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-xl p-12 text-center">
        <div className="max-w-sm mx-auto">
          <div className="w-20 h-20 mx-auto bg-[#f5f5f2] dark:bg-[#1e3a5f] rounded-full flex items-center justify-center mb-4">
            <Search className="w-10 h-10 text-[#a3b18a] dark:text-[#3ba9d6]" />
          </div>
          <h3 className="text-xl font-semibold text-[#3a5a40] dark:text-white mb-2">
            Try searching to get started
          </h3>
          <p className="text-[#344e41] dark:text-[#b8d4e8] mb-6">
            Discover IT professionals, companies, and projects in the Philippines
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={onBrowsePeople}
              className="px-4 py-2 bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de] text-white font-semibold rounded-lg transition-colors"
            >
              Browse {userType === 'employee' ? 'Companies' : 'Developers'}
            </button>
            <button
              type="button"
              onClick={onExploreProjects}
              className="px-4 py-2 border border-[#a3b18a] dark:border-[#2a4a6f] text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] font-semibold rounded-lg transition-colors"
            >
              Explore Projects
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

function ComposerButton({ icon: Icon, text, onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 px-4 py-2 text-[#344e41] dark:text-[#b8d4e8] hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] rounded-lg transition-colors">
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{text}</span>
    </button>
  );
}



