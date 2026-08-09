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
    <div className="space-y-5">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="user-workspace-page-title mt-1">Welcome back, {displayName.split(' ')[0]}</h1>
          <p className="mt-1 text-sm text-[var(--user-text-muted)]">Keep your profile active and your next opportunity moving.</p>
        </div>
      </header>

      <section className="user-desktop-flat-surface p-4" aria-label="Create an update">
        <div className="flex gap-3">
          <Avatar profileImage={profileImage} fallback={userInitial} sizeClass="h-10 w-10 border border-[var(--user-border)]" />
          <button
            type="button"
            onClick={onOpenComposer}
            className="min-h-10 flex-1 rounded-md border border-[var(--user-border)] bg-[var(--user-surface-subtle)] px-4 py-2 text-left text-sm text-[var(--user-text-muted)] transition-colors duration-150 hover:border-[var(--user-border-strong)] hover:bg-[var(--user-surface)]"
          >
            Share an update, project, or insight...
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-[var(--user-border)] pt-3">
          <ComposerButton icon={Plus} text={userType === 'employee' ? 'Add Project' : 'Post Job'} onClick={onOpenComposer} />
          <ComposerButton icon={Plus} text="Share Update" onClick={onOpenComposer} />
        </div>
      </section>

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
        <section className="user-desktop-flat-surface px-6 py-10 text-center">
          <div className="mx-auto max-w-lg">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-[var(--user-primary-soft)] text-[var(--user-primary)]">
              <Search className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-[var(--user-text-strong)]">Build your professional network</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--user-text-muted)]">Discover IT companies, professionals, and projects while you wait for new updates.</p>
            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <button type="button" onClick={onBrowsePeople} className="user-workspace-primary-button px-5 py-2 text-sm font-semibold">Browse {userType === 'employee' ? 'Companies' : 'Developers'}</button>
              <button type="button" onClick={onExploreProjects} className="min-h-10 rounded-md border border-[var(--user-border-strong)] bg-[var(--user-surface)] px-5 py-2 text-sm font-semibold text-[var(--user-text-strong)] transition-colors duration-150 hover:bg-[var(--user-surface-subtle)]">Explore Projects</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function BottomFeedLoader() {
  return (
    <div className="space-y-3">
      {[...Array(2)].map((_, index) => (
        <div
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
  return <button type="button" onClick={onClick} className="flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-[var(--user-text)] transition-colors duration-150 hover:bg-[var(--user-surface-selected)] hover:text-[var(--user-primary)]"><Icon className="h-4 w-4" /><span className="text-sm font-medium">{text}</span></button>;
}
