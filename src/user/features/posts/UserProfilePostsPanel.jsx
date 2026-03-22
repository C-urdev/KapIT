import React from 'react';

export default function ProfilePostsPanel({ user, posts }) {
  const displayName = user?.username || user?.name || 'User';

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-xl p-5">
        <h2 className="text-2xl font-bold text-[#3a5a40] dark:text-white">My Profile</h2>
        <p className="text-sm text-[#344e41] dark:text-[#b8d4e8] mt-1">
          Posts by {displayName}
        </p>
      </div>

      {posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-[#3a5a40] dark:text-white">{displayName}</h4>
                <span className="text-xs text-[#3a5a40] dark:text-[#7d9ab8]">
                  {new Date(post.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-[#344e41] dark:text-[#b8d4e8] whitespace-pre-wrap">{post.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-xl p-10 text-center">
          <p className="text-[#344e41] dark:text-[#b8d4e8]">No posts yet.</p>
        </div>
      )}
    </div>
  );
}



