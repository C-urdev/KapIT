import React from 'react';
import FeedPostCard from './FeedPostCard';

export default function CenterFeedPosts({ posts, user, displayName, profileImage, userInitial, menuPostId, setMenuPostId, onToggleSavePost, onReactToPost, onAddComment, onReactToComment, onToggleSharePost, onDeletePost, onHidePost, hiddenPostIds = [], onUndoHidePost, onHideAuthor, savedPostIds = [] }) {
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <FeedPostCard
          key={post.id}
          post={post}
          user={user}
          displayName={displayName}
          profileImage={profileImage}
          userInitial={userInitial}
          isMenuOpen={menuPostId === post.id}
          onOpenMenu={() => setMenuPostId(post.id)}
          onCloseMenu={() => setMenuPostId(null)}
          onToggleSavePost={onToggleSavePost}
          onReactToPost={onReactToPost}
          onAddComment={onAddComment}
          onReactToComment={onReactToComment}
          onToggleSharePost={onToggleSharePost}
          onDeletePost={onDeletePost}
          isHidden={hiddenPostIds.includes(post.id)}
          onHidePost={() => onHidePost(post.id)}
          onUndoHidePost={() => onUndoHidePost?.(post.id)}
          onHideAuthor={() => onHideAuthor(post.ownerKey)}
          isSavedOverride={savedPostIds.includes(Number(post.id))}
        />
      ))}
    </div>
  );
}
