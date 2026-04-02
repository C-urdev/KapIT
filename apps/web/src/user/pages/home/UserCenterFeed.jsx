import React, { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import CenterFeedPosts from './CenterFeedPosts';
import { Avatar } from './CenterFeedPostShared';

export default function CenterFeed(props) {
  const { user, userType, onOpenComposer, posts = [], onToggleSavePost, onReactToPost, onAddComment, onReactToComment, onToggleSharePost, onDeletePost, onBrowsePeople, onExploreProjects } = props;
  const displayName = user?.username || user?.name || 'User';
  const userInitial = displayName.charAt(0).toUpperCase();
  const profileImage = user?.profileImage || '';
  const [menuPostId, setMenuPostId] = useState(null);
  const [hiddenPostIds, setHiddenPostIds] = useState([]);
  const [hiddenAuthorKeys, setHiddenAuthorKeys] = useState([]);
  const visiblePosts = useMemo(() => posts.filter((post) => !hiddenPostIds.includes(post.id) && !hiddenAuthorKeys.includes(post.ownerKey)), [hiddenAuthorKeys, hiddenPostIds, posts]);

  const handleHidePost = (postId) => {
    setHiddenPostIds((current) => (current.includes(postId) ? current : [...current, postId]));
    setMenuPostId(null);
  };

  const handleHideAuthor = (authorKey) => {
    if (!authorKey) return;
    setHiddenAuthorKeys((current) => (current.includes(authorKey) ? current : [...current, authorKey]));
    setMenuPostId(null);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#a3b18a] bg-white p-4 dark:border-[#1e3a5f] dark:bg-[#162842]">
        <div className="flex gap-3">
          <Avatar profileImage={profileImage} fallback={userInitial} sizeClass="h-10 w-10" />
          <button onClick={onOpenComposer} className="flex-1 rounded-full border border-[#a3b18a] bg-[#f5f5f2] px-4 py-3 text-left text-[#344e41] transition-colors hover:bg-[#dad7cd] dark:border-[#2a4a6f] dark:bg-[#1e3a5f] dark:text-[#b8d4e8] dark:hover:bg-[#0f2139]">Share an update or project...</button>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-[#a3b18a] pt-3 dark:border-[#2a4a6f]">
          <ComposerButton icon={Plus} text={userType === 'employee' ? 'Add Project' : 'Post Job'} onClick={onOpenComposer} />
          <ComposerButton icon={Plus} text="Share Update" onClick={onOpenComposer} />
        </div>
      </div>

      {visiblePosts.length > 0 ? (
        <CenterFeedPosts
          posts={visiblePosts}
          user={user}
          displayName={displayName}
          profileImage={profileImage}
          userInitial={userInitial}
          menuPostId={menuPostId}
          setMenuPostId={setMenuPostId}
          onToggleSavePost={onToggleSavePost}
          onReactToPost={onReactToPost}
          onAddComment={onAddComment}
          onReactToComment={onReactToComment}
          onToggleSharePost={onToggleSharePost}
          onDeletePost={onDeletePost}
          onHidePost={handleHidePost}
          onHideAuthor={handleHideAuthor}
        />
      ) : (
        <div className="rounded-xl border border-[#a3b18a] bg-white p-12 text-center dark:border-[#1e3a5f] dark:bg-[#162842]">
          <div className="mx-auto max-w-sm">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#f5f5f2] dark:bg-[#1e3a5f]"><Search className="h-10 w-10 text-[#a3b18a] dark:text-[#3ba9d6]" /></div>
            <h3 className="mb-2 text-xl font-semibold text-[#3a5a40] dark:text-white">Try searching to get started</h3>
            <p className="mb-6 text-[#344e41] dark:text-[#b8d4e8]">Discover IT professionals, companies, and projects in the Philippines</p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <button type="button" onClick={onBrowsePeople} className="rounded-lg bg-[#3a5a40] px-4 py-2 font-semibold text-white transition-colors hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de]">Browse {userType === 'employee' ? 'Companies' : 'Developers'}</button>
              <button type="button" onClick={onExploreProjects} className="rounded-lg border border-[#a3b18a] px-4 py-2 font-semibold text-[#344e41] transition-colors hover:bg-[#f5f5f2] dark:border-[#2a4a6f] dark:text-white dark:hover:bg-[#1e3a5f]">Explore Projects</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ComposerButton({ icon: Icon, text, onClick }) {
  return <button onClick={onClick} className="flex items-center gap-2 rounded-lg px-4 py-2 text-[#344e41] transition-colors hover:bg-[#f5f5f2] dark:text-[#b8d4e8] dark:hover:bg-[#1e3a5f]"><Icon className="h-4 w-4" /><span className="text-sm font-medium">{text}</span></button>;
}
