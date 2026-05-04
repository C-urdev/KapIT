import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import CenterFeedPosts from './CenterFeedPosts';
import { Avatar } from './CenterFeedPostShared';
import FeedSkeleton from '../../../../components/shared/skeletons/FeedSkeleton';

export default function CenterFeed(props) {
  const {
    loading,
    user,
    userType,
    onOpenComposer,
    posts = [],
    onToggleSavePost,
    onReactToPost,
    onAddComment,
    onReactToComment,
    onToggleSharePost,
    onDeletePost,
    onBrowsePeople,
    onExploreProjects,
    savedPostIds = [],
    hasMorePosts = false,
    loadingMorePosts = false,
    onLoadMorePosts,
  } = props;
  const displayName = user?.fullName || user?.name || user?.username || 'User';
  const userInitial = displayName.charAt(0).toUpperCase();
  const profileImage = user?.profileImage || '';
  const [menuPostId, setMenuPostId] = useState(null);
  const [hiddenPostIds, setHiddenPostIds] = useState([]);
  const [hiddenAuthorKeys, setHiddenAuthorKeys] = useState([]);
  const visiblePosts = useMemo(() => posts.filter((post) => !hiddenAuthorKeys.includes(post.ownerKey)), [hiddenAuthorKeys, posts]);
  const loadMoreRef = useRef(null);

  const handleHidePost = (postId) => {
    setHiddenPostIds((current) => (current.includes(postId) ? current : [...current, postId]));
    setMenuPostId(null);
  };

  const handleUndoHidePost = (postId) => {
    setHiddenPostIds((current) => current.filter((id) => id !== postId));
  };

  const handleHideAuthor = (authorKey) => {
    if (!authorKey) return;
    setHiddenAuthorKeys((current) => (current.includes(authorKey) ? current : [...current, authorKey]));
    setMenuPostId(null);
  };

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasMorePosts || loading || loadingMorePosts || typeof onLoadMorePosts !== 'function') {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          onLoadMorePosts();
        });
      },
      {
        root: null,
        rootMargin: '400px 0px 400px 0px',
        threshold: 0.01,
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMorePosts, loading, loadingMorePosts, onLoadMorePosts]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#a3b18a] bg-[#f8fbf6] p-4 dark:border-[#353c44] dark:bg-[#22272b]">
        <div className="flex gap-3">
          <Avatar profileImage={profileImage} fallback={userInitial} sizeClass="h-10 w-10" />
          <button onClick={onOpenComposer} className="flex-1 rounded-full border border-[#a3b18a] bg-[#f5f5f2] px-4 py-3 text-left text-[#344e41] transition-colors hover:bg-[#dad7cd] dark:border-[#444d57] dark:bg-[#353c44] dark:text-[#d0d7dd] dark:hover:bg-[#1a1d20]">Share an update or project...</button>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-[#a3b18a] pt-3 dark:border-[#444d57]">
          <ComposerButton icon={Plus} text={userType === 'employee' ? 'Add Project' : 'Post Job'} onClick={onOpenComposer} />
          <ComposerButton icon={Plus} text="Share Update" onClick={onOpenComposer} />
        </div>
      </div>

      {loading ? (
        <FeedSkeleton />
      ) : visiblePosts.length > 0 ? (
        <>
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
            hiddenPostIds={hiddenPostIds}
            onUndoHidePost={handleUndoHidePost}
            onHideAuthor={handleHideAuthor}
            savedPostIds={savedPostIds}
          />
          <div ref={loadMoreRef} className="h-1 w-full" aria-hidden="true" />
          {loadingMorePosts ? <BottomFeedLoader /> : null}
          {!hasMorePosts && posts.length > 0 ? (
            <p className="pb-2 text-center text-sm text-[#5f6f52] dark:text-[#a8b1ba]">No more posts</p>
          ) : null}
        </>
      ) : (
        <div className="rounded-xl border border-[#a3b18a] bg-[#f8fbf6] p-12 text-center dark:border-[#353c44] dark:bg-[#22272b]">
          <div className="mx-auto max-w-sm">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#f5f5f2] dark:bg-[#353c44]"><Search className="h-10 w-10 text-[#a3b18a] dark:text-[#6f9b74]" /></div>
            <h3 className="mb-2 text-xl font-semibold text-[#3a5a40] dark:text-white">Try searching to get started</h3>
            <p className="mb-6 text-[#344e41] dark:text-[#d0d7dd]">Discover IT professionals, companies, and projects in the Philippines</p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <button type="button" onClick={onBrowsePeople} className="rounded-lg bg-[#3a5a40] px-4 py-2 font-semibold text-white transition-colors hover:bg-[#344e41] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86]">Browse {userType === 'employee' ? 'Companies' : 'Developers'}</button>
              <button type="button" onClick={onExploreProjects} className="rounded-lg border border-[#a3b18a] px-4 py-2 font-semibold text-[#344e41] transition-colors hover:bg-[#f5f5f2] dark:border-[#444d57] dark:text-white dark:hover:bg-[#353c44]">Explore Projects</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BottomFeedLoader() {
  return (
    <div className="space-y-3">
      {[...Array(2)].map((_, index) => (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          className="rounded-xl border border-[#a3b18a]/30 bg-[#f8fbf6]/70 p-4 dark:border-[#353c44]/30 dark:bg-[#22272b]/70"
        >
          <div className="mb-3 h-3 w-1/3 rounded bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
          <div className="h-3 w-full rounded bg-[#e5e7eb] dark:bg-[#2a2f35] animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function ComposerButton({ icon: Icon, text, onClick }) {
  return <button onClick={onClick} className="flex items-center gap-2 rounded-lg px-4 py-2 text-[#344e41] transition-colors hover:bg-[#f5f5f2] dark:text-[#d0d7dd] dark:hover:bg-[#353c44]"><Icon className="h-4 w-4" /><span className="text-sm font-medium">{text}</span></button>;
}
