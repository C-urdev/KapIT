import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Bookmark, EyeOff, MessageCircle, MoreHorizontal, Share2, ThumbsUp, Trash2, UserX, X } from 'lucide-react';
import { isPostSavedForUser } from '@userFeatures/activity/userActivityStorage';
import { ActionButton, ReactionPicker } from './CenterFeedActionButton';
import CenterFeedCommentsView from './CenterFeedCommentsView';
import CenterFeedShareSheet from './CenterFeedShareSheet';
import { Avatar, getActorKey, getReactionSummary, formatCount, REACTION_OPTIONS } from './CenterFeedPostShared';

function PostActionSheet({ sections, onClose }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-end bg-[#344e41]/28 backdrop-blur-[6px] dark:bg-black/45" onClick={onClose}>
      <div className="max-h-[85vh] w-full overflow-y-auto rounded-t-[1.8rem] border-t border-[#bfd0af] bg-[#dad7cd] px-4 pb-6 pt-3 text-[#344e41] shadow-[0_-18px_42px_rgba(58,90,64,0.18)] dark:border-[#2a4a6f] dark:bg-[#1c2431] dark:text-white dark:shadow-[0_-18px_42px_rgba(0,0,0,0.35)]" style={{ paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom) + 1rem))' }} onClick={(event) => event.stopPropagation()}>
        <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-[#9caf88] dark:bg-white/28" />
        <div className="space-y-4">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="overflow-hidden rounded-[1.45rem] border border-[#bfd0af] bg-white/88 shadow-[0_10px_24px_rgba(58,90,64,0.08)] backdrop-blur-sm dark:border-[#314a68] dark:bg-[#243244]/92 dark:shadow-none">
              {section.map((item, itemIndex) => {
                const Icon = item.icon;
                return (
                  <button key={item.label} type="button" onClick={item.onClick} className={`flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-[#f1f5eb] dark:hover:bg-[#2b3c52] ${itemIndex > 0 ? 'border-t border-[#d9dfcf] dark:border-[#36506f]' : ''}`}>
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#bfd0af] bg-[#eef6ee] text-[#3a5a40] dark:border-[#3f5977] dark:bg-[#16314d] dark:text-[#8dccff]"><Icon className="h-5 w-5" /></span>
                    <span className="min-w-0"><span className="block text-[1.05rem] font-semibold text-[#3a5a40] dark:text-white">{item.label}</span>{item.description ? <span className="mt-1 block text-sm leading-6 text-[#5f6f52] dark:text-[#b8d4e8]">{item.description}</span> : null}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const getResolvedPostOwnerName = (post, fallbackDisplayName = '') => {
  const ownerName = String(post?.ownerName || '').trim();
  if (ownerName && ownerName.toLowerCase() !== 'user') {
    return ownerName;
  }

  const ownerKey = String(post?.ownerKey || '').trim();
  if (ownerKey && ownerKey !== 'anonymous') {
    const keyFallback = ownerKey.includes('@') ? ownerKey.split('@')[0] : ownerKey;
    if (keyFallback) {
      return keyFallback;
    }
  }

  return fallbackDisplayName || 'User';
};

export default function FeedPostCard({ post, user, displayName, profileImage, userInitial, isMenuOpen, onOpenMenu, onCloseMenu, onToggleSavePost, onReactToPost, onAddComment, onReactToComment, onToggleSharePost, onDeletePost, onHidePost, onHideAuthor, enableMenu = true }) {
  const actorKey = getActorKey(user);
  const authorDisplayName = getResolvedPostOwnerName(post, displayName);
  const authorInitial = String(authorDisplayName || 'U').charAt(0).toUpperCase();
  const isOwner = post?.ownerKey === actorKey;
  const authorProfileImage = post?.ownerProfileImage || (isOwner ? profileImage : '');
  const isSaved = isPostSavedForUser(user, post.id);
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const [commentsViewOpen, setCommentsViewOpen] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentImage, setCommentImage] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [shareVisibility, setShareVisibility] = useState('Only me');
  const holdTimerRef = useRef(null);
  const cardRef = useRef(null);

  const reactions = Array.isArray(post?.reactions) ? post.reactions : [];
  const comments = Array.isArray(post?.comments) ? post.comments : [];
  const shares = Array.isArray(post?.shares) ? post.shares : [];
  const sharedPost = post?.sharedPost || null;
  const userReaction = reactions.find((entry) => entry.userKey === actorKey)?.type || '';
  const selectedReaction = REACTION_OPTIONS.find((entry) => entry.key === userReaction) || REACTION_OPTIONS[0];
  const reactionSummary = getReactionSummary(reactions);
  const reactionCount = reactionSummary.total;
  const commentCount = comments.length;
  const shareCount = shares.length;
  const hasShared = shares.some((entry) => entry.userKey === actorKey);
  const formattedDate = new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  useEffect(() => {
    if (!reactionPickerOpen) return undefined;
    const handlePointerDown = (event) => { if (!cardRef.current?.contains(event.target)) setReactionPickerOpen(false); };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [reactionPickerOpen]);

  const clearHoldTimer = () => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const startReactionHold = () => {
    clearHoldTimer();
    holdTimerRef.current = window.setTimeout(() => {
      setReactionPickerOpen(true);
      holdTimerRef.current = null;
    }, 420);
  };

  const handleLikeClick = () => {
    if (reactionPickerOpen) return;
    onReactToPost?.(post.id, userReaction === 'like' ? '' : 'like');
  };

  const handleReactionSelect = (reactionKey) => {
    onReactToPost?.(post.id, reactionKey);
    setReactionPickerOpen(false);
  };

  const handleCommentSubmit = () => {
    const trimmed = commentDraft.trim();
    if (!trimmed && !commentImage) return;
    onAddComment?.(post.id, { content: trimmed, imageUrl: commentImage });
    setCommentDraft('');
    setCommentImage('');
  };

  const handleShareAction = () => {
    onToggleSharePost?.(post.id, { message: shareMessage, visibility: shareVisibility });
    setShareSheetOpen(false);
    setShareMessage('');
    setShareVisibility('Only me');
  };

  const handleReportPost = () => {
    window.alert('Post reported. Thanks for your feedback.');
    onCloseMenu?.();
  };

  const handleBlockAuthor = () => {
    onHideAuthor?.();
    window.alert(`${authorDisplayName} has been blocked in this feed view.`);
    onCloseMenu?.();
  };

  const menuSections = isOwner
    ? [
        [
          { label: isSaved ? 'Saved post' : 'Save post', icon: Bookmark, onClick: () => { onToggleSavePost?.(post); onCloseMenu?.(); } },
          { label: 'Hide post', description: 'See fewer posts like this.', icon: EyeOff, onClick: onHidePost },
          { label: 'Report post', description: "We won't let others know who reported this.", icon: AlertTriangle, onClick: handleReportPost },
          { label: `Block ${authorDisplayName}`, description: "You won't be able to see or contact each other.", icon: UserX, onClick: handleBlockAuthor },
        ],
        [
          { label: `Hide all from ${authorDisplayName}`, description: 'Stop seeing posts from this person.', icon: X, onClick: () => { onHideAuthor?.(); onCloseMenu?.(); } },
        ],
        [
          { label: 'Delete post', description: 'Permanently remove this post from your profile and feed.', icon: Trash2, onClick: () => { onDeletePost?.(post.id); onCloseMenu?.(); } },
        ],
      ]
    : [
        [
          { label: isSaved ? 'Saved post' : 'Save post', icon: Bookmark, onClick: () => { onToggleSavePost?.(post); onCloseMenu?.(); } },
          { label: 'Hide post', description: 'See fewer posts like this.', icon: EyeOff, onClick: onHidePost },
          { label: 'Report post', description: "We won't let others know who reported this.", icon: AlertTriangle, onClick: handleReportPost },
          { label: `Block ${authorDisplayName}`, description: "You won't be able to see or contact each other.", icon: UserX, onClick: handleBlockAuthor },
        ],
        [
          { label: `Hide all from ${authorDisplayName}`, description: 'Stop seeing posts from this person.', icon: X, onClick: () => { onHideAuthor?.(); onCloseMenu?.(); } },
        ],
      ];

  return (
    <>
      <article ref={cardRef} className="overflow-hidden rounded-[1.4rem] border border-[#a3b18a] bg-white shadow-[0_16px_36px_rgba(58,90,64,0.08)] dark:border-[#1e3a5f] dark:bg-[#162842] dark:shadow-[0_16px_36px_rgba(0,0,0,0.2)]">
        <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar profileImage={authorProfileImage} fallback={authorInitial} sizeClass="h-11 w-11" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-semibold text-[#3a5a40] dark:text-white">{authorDisplayName}</p>
                <button type="button" className="text-sm font-semibold text-[#2d6cdf] dark:text-[#7dc4ff]">Follow</button>
              </div>
              <p className="text-xs text-[#5f6f52] dark:text-[#9db8d3]">{formattedDate} | {post.visibility || 'Public'}</p>
            </div>
          </div>
          {enableMenu ? <button type="button" onClick={onOpenMenu} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#5f6f52] transition-colors hover:bg-[#f5f5f2] dark:text-[#b8d4e8] dark:hover:bg-[#1e3a5f]" aria-label="More post actions"><MoreHorizontal className="h-5 w-5" /></button> : null}
        </div>
        <div className="px-4 pb-3">
          {post.content ? <p className="whitespace-pre-wrap text-[0.97rem] leading-7 text-[#344e41] dark:text-[#d5e6f5]">{post.content}</p> : null}
          {sharedPost ? (
            <div className={`${post.content ? 'mt-3' : ''} rounded-[1.1rem] border border-[#d9dfcf] bg-[#f8fbf6] p-3 dark:border-[#2a4a6f] dark:bg-[#102235]`}>
              <p className="text-sm font-semibold text-[#3a5a40] dark:text-white">{getResolvedPostOwnerName(sharedPost)}</p>
              {sharedPost.content ? <p className="mt-2 whitespace-pre-wrap text-[0.95rem] leading-6 text-[#344e41] dark:text-[#d5e6f5]">{sharedPost.content}</p> : null}
              {sharedPost.imageUrl ? <img src={sharedPost.imageUrl} alt="Shared post" className="mt-3 h-auto max-h-[24rem] w-full rounded-[0.95rem] object-cover" /> : null}
            </div>
          ) : null}
        </div>
        {post.imageUrl ? <div className="overflow-hidden border-y border-[#d9dfcf] bg-[#f5f5f2] dark:border-[#2a4a6f] dark:bg-[#102235]"><img src={post.imageUrl} alt="Post" className="h-auto max-h-[34rem] w-full object-cover" /></div> : null}
        <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-[#5f6f52] dark:text-[#b8d4e8]">
          <div className="flex min-w-0 items-center gap-2">
            {reactionSummary.badges.length > 0 ? <div className="flex items-center -space-x-1">{reactionSummary.badges.map((badge) => <span key={badge} className="flex h-6 w-6 items-center justify-center rounded-full border border-white bg-white text-[13px] shadow-sm dark:border-[#162842] dark:bg-[#243244]">{badge}</span>)}</div> : null}
            {reactionCount > 0 ? <span>{formatCount(reactionCount)}</span> : null}
          </div>
          <div className="flex items-center gap-4"><button type="button" className="transition-colors hover:text-[#3a5a40] dark:hover:text-white" onClick={() => setCommentsViewOpen(true)}>{formatCount(commentCount)} comments</button><button type="button" className="transition-colors hover:text-[#3a5a40] dark:hover:text-white" onClick={() => setShareSheetOpen(true)}>{formatCount(shareCount)} shares</button></div>
        </div>
        <div className="relative grid grid-cols-4 border-t border-[#d9dfcf] px-2 py-1 dark:border-[#2a4a6f]">
          {reactionPickerOpen ? <ReactionPicker selectedReaction={userReaction} onSelect={handleReactionSelect} /> : null}
          <ActionButton icon={ThumbsUp} label={selectedReaction.label} active={Boolean(userReaction)} accentClass={selectedReaction.accent} emoji={userReaction ? selectedReaction.emoji : ''} onClick={handleLikeClick} onPointerDown={startReactionHold} onPointerUp={clearHoldTimer} onPointerLeave={clearHoldTimer} onContextMenu={(event) => event.preventDefault()} />
          <ActionButton icon={MessageCircle} label="Comment" active={commentsViewOpen} onClick={() => setCommentsViewOpen(true)} />
          <ActionButton icon={Share2} label={hasShared ? 'Shared' : 'Share'} active={hasShared} onClick={() => setShareSheetOpen(true)} />
          <ActionButton icon={Bookmark} label="Save" active={isSaved} onClick={() => onToggleSavePost?.(post)} />
        </div>
      </article>
      {commentsViewOpen ? <CenterFeedCommentsView viewerKey={actorKey} profileImage={profileImage} userInitial={userInitial} comments={comments} commentCount={commentCount} commentDraft={commentDraft} commentImage={commentImage} setCommentDraft={setCommentDraft} setCommentImage={setCommentImage} onClose={() => setCommentsViewOpen(false)} onSubmit={handleCommentSubmit} onReply={onAddComment ? (commentId, replyInput) => onAddComment(post.id, { ...replyInput, parentCommentId: commentId }) : undefined} onReactToComment={onReactToComment ? (commentId, reactionType, parentCommentId = null) => onReactToComment(post.id, commentId, reactionType, parentCommentId) : undefined} /> : null}
      {shareSheetOpen ? <CenterFeedShareSheet displayName={displayName} profileImage={profileImage} shareMessage={shareMessage} setShareMessage={setShareMessage} shareVisibility={shareVisibility} setShareVisibility={setShareVisibility} hasShared={hasShared} onClose={() => setShareSheetOpen(false)} onShare={handleShareAction} /> : null}
      {enableMenu && isMenuOpen ? <PostActionSheet sections={menuSections} onClose={onCloseMenu} /> : null}
    </>
  );
}
