import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Bookmark, EyeOff, MessageCircle, MoreHorizontal, Share2, ThumbsUp, Trash2, UserX, X } from 'lucide-react';
import { useToast } from '@sharedComponents/ui/ToastProvider';
import { ActionButton, ReactionPicker } from './CenterFeedActionButton';
import CenterFeedCommentsView from './CenterFeedCommentsView';
import CenterFeedShareSheet from './CenterFeedShareSheet';
import { Avatar, getActorKey, getReactionSummary, formatCount, REACTION_OPTIONS } from './CenterFeedPostShared';

function PostActionSheet({ sections, onClose }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-end bg-[#344e41]/28 backdrop-blur-[6px] dark:bg-black/45" onClick={onClose}>
      <div className="max-h-[85vh] w-full overflow-y-auto rounded-t-[1.8rem] border-t border-[#bfd0af] bg-[#dad7cd] px-4 pb-6 pt-3 text-[#344e41] shadow-[0_-18px_42px_rgba(58,90,64,0.18)] dark:border-[#444d57] dark:bg-[#1c2431] dark:text-white dark:shadow-[0_-18px_42px_rgba(0,0,0,0.35)]" style={{ paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom) + 1rem))' }} onClick={(event) => event.stopPropagation()}>
        <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-[#9caf88] dark:bg-white/28" />
        <div className="pt-1">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className={sectionIndex > 0 ? 'border-t border-[#ccd7bf] pt-2 dark:border-[#4b5560]' : ''}>
              {section.map((item, itemIndex) => {
                const Icon = item.icon;
                return (
                  <button key={item.label} type="button" onClick={item.onClick} className={`flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-transparent dark:hover:bg-transparent ${itemIndex > 0 ? 'border-t border-[#d9dfcf] dark:border-[#4b5560]' : ''}`}>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#bfd0af] bg-[#eef6ee] text-[#3a5a40] dark:border-[#4b5560] dark:bg-[#31363d] dark:text-[#f0c766]"><Icon className="h-5 w-5" /></span>
                    <span className="min-w-0">
                      <span className="block text-[1.05rem] font-semibold text-[#3a5a40] dark:text-white">{item.label}</span>
                      {item.label === 'Delete post' && item.description ? <span className="mt-1 block text-sm leading-6 text-[#5f6f52] dark:text-[#d0d7dd]">{item.description}</span> : null}
                    </span>
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

function ReactionDetailsModal({ reactions, onClose }) {
  const reactionMap = new Map(REACTION_OPTIONS.map((entry) => [entry.key, entry]));
  const sortedReactions = [...reactions].sort((a, b) => {
    const aTime = new Date(a?.updatedAt || 0).getTime();
    const bTime = new Date(b?.updatedAt || 0).getTime();
    return bTime - aTime;
  });

  const getDisplayName = (reaction) => {
    const explicit = String(reaction?.userName || reaction?.author || reaction?.name || '').trim();
    if (explicit) {
      return explicit;
    }

    const key = String(reaction?.userKey || '').trim();
    if (!key) {
      return 'User';
    }

    return key.includes('@') ? key.split('@')[0] : key;
  };

  const getAccountLabel = (reaction) => {
    const accountType = String(reaction?.accountType || reaction?.typeOfAccount || '').trim().toLowerCase();
    const userType = String(reaction?.userType || '').trim().toLowerCase();
    if (accountType === 'company' || userType === 'company') {
      return 'Company';
    }
    return 'User';
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#a3b18a] bg-[#f8fbf6] shadow-[0_20px_45px_rgba(0,0,0,0.25)] dark:border-[#444d57] dark:bg-[#22272b]" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#d9dfcf] px-4 py-3 dark:border-[#444d57]">
          <h3 className="text-base font-semibold text-[#3a5a40] dark:text-white">Reactions</h3>
          <button type="button" onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#5f6f52] hover:bg-[#f5f5f2] dark:text-[#d0d7dd] dark:hover:bg-[#353c44]" aria-label="Close reactions list">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[55vh] overflow-y-auto px-2 py-2">
          {sortedReactions.length === 0 ? (
            <p className="px-3 py-4 text-sm text-[#5f6f52] dark:text-[#d0d7dd]">No reactions yet.</p>
          ) : (
            sortedReactions.map((reaction, index) => {
              const reactionKey = String(reaction?.type || '').trim().toLowerCase();
              const matchedReaction = reactionMap.get(reactionKey) || reactionMap.get('like');
              const displayName = getDisplayName(reaction);
              const fallback = displayName.charAt(0).toUpperCase() || 'U';
              const profileImage = String(reaction?.profileImage || reaction?.authorProfileImage || '').trim();
              const accountLabel = getAccountLabel(reaction);

              return (
                <div key={`${reaction?.userKey || 'user'}-${reactionKey}-${index}`} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 hover:bg-[#f5f5f2] dark:hover:bg-[#2f343b]">
                  <div className="min-w-0 flex items-center gap-3">
                    <Avatar profileImage={profileImage} fallback={fallback} sizeClass="h-9 w-9" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#3a5a40] dark:text-white">{displayName}</p>
                      <p className="truncate text-xs text-[#5f6f52] dark:text-[#d0d7dd]">{accountLabel}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 text-xl ${matchedReaction?.accent || ''}`} title={matchedReaction?.label || 'Reaction'}>{matchedReaction?.emoji || '\u{1F44D}'}</span>
                </div>
              );
            })
          )}
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

export default function FeedPostCard({ post, user, displayName, profileImage, userInitial, isMenuOpen, onOpenMenu, onCloseMenu, onToggleSavePost, onReactToPost, onAddComment, onReactToComment, onToggleSharePost, onDeletePost, isHidden = false, onHidePost, onUndoHidePost, onHideAuthor, enableMenu = true, isSavedOverride = false }) {
  const toast = useToast();
  const actorKey = getActorKey(user);
  const authorDisplayName = getResolvedPostOwnerName(post, displayName);
  const authorInitial = String(authorDisplayName || 'U').charAt(0).toUpperCase();
  const isOwner = post?.ownerKey === actorKey;
  const authorProfileImage = post?.ownerProfileImage || (isOwner ? profileImage : '');
  const isSaved = Boolean(isSavedOverride);
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const [commentsViewOpen, setCommentsViewOpen] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [reactionDetailsOpen, setReactionDetailsOpen] = useState(false);
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
  const hiddenFeedbackOptions = ['Doesn\'t match my interests', 'Scam', 'Sexual', 'Disturbing', 'I don\'t like the creator', 'Other'];

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
    toast.success('Post reported. Thanks for your feedback.');
    onCloseMenu?.();
  };

  const handleBlockAuthor = () => {
    onHideAuthor?.();
    toast.info(`${authorDisplayName} has been blocked in this feed view.`);
    onCloseMenu?.();
  };

  const handleHidePost = () => {
    onHidePost?.();
    onCloseMenu?.();
  };

  const menuSections = isOwner
    ? [
        [
          { label: isSaved ? 'Saved post' : 'Save post', icon: Bookmark, onClick: () => { onToggleSavePost?.(post); onCloseMenu?.(); } },
          { label: 'Hide post', description: 'See fewer posts like this.', icon: EyeOff, onClick: handleHidePost },
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
          { label: 'Hide post', description: 'See fewer posts like this.', icon: EyeOff, onClick: handleHidePost },
          { label: 'Report post', description: "We won't let others know who reported this.", icon: AlertTriangle, onClick: handleReportPost },
          { label: `Block ${authorDisplayName}`, description: "You won't be able to see or contact each other.", icon: UserX, onClick: handleBlockAuthor },
        ],
        [
          { label: `Hide all from ${authorDisplayName}`, description: 'Stop seeing posts from this person.', icon: X, onClick: () => { onHideAuthor?.(); onCloseMenu?.(); } },
        ],
      ];

  if (isHidden) {
    return (
      <article className="overflow-hidden rounded-[1.4rem] border border-[#bfd0af] bg-[#f8fbf6] text-[#344e41] shadow-[0_16px_36px_rgba(58,90,64,0.1)] dark:border-[#2f3438] dark:bg-[#23272b] dark:text-white dark:shadow-[0_16px_36px_rgba(0,0,0,0.24)]">
        <div className="flex items-start justify-between gap-4 px-6 pb-5 pt-6">
          <div>
            <div className="flex items-center gap-2 text-[#6b7dbb] dark:text-[#9fb4ff]">
              <EyeOff className="h-5 w-5" />
              <span className="text-sm font-medium text-[#5f6f52] dark:text-[#b9c0c7]">Hidden</span>
            </div>
            <p className="mt-3 max-w-[28rem] text-[1.05rem] font-medium leading-8 text-[#203a28] dark:text-white">Hiding posts helps us personalize your feed.</p>
          </div>
          <button
            type="button"
            onClick={onUndoHidePost}
            className="rounded-2xl bg-[#eef6ee] px-5 py-3 text-sm font-semibold text-[#3a5a40] transition-colors hover:bg-[#e2eedf] dark:bg-[#3a3f45] dark:text-white dark:hover:bg-[#4a5057]"
          >
            Undo
          </button>
        </div>

        <div className="space-y-1 px-6 pb-6">
          <button
            type="button"
            onClick={onHideAuthor}
            className="flex w-full items-center gap-4 rounded-2xl px-0 py-3 text-left transition-colors hover:bg-transparent dark:hover:bg-white/[0.04]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f7e7a8] text-sm font-semibold text-[#203a28]">
              {authorProfileImage ? <img src={authorProfileImage} alt={authorDisplayName} className="h-full w-full object-cover" /> : authorInitial}
            </div>
            <span className="text-[1.05rem] text-[#203a28] dark:text-white">Snooze {authorDisplayName} for 30 days</span>
          </button>

          <button
            type="button"
            onClick={handleReportPost}
            className="flex w-full items-center gap-4 rounded-2xl px-0 py-3 text-left transition-colors hover:bg-transparent dark:hover:bg-white/[0.04]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef6ee] text-[#203a28] dark:bg-white dark:text-[#23272b]">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <span className="text-[1.05rem] text-[#203a28] dark:text-white">Report post</span>
          </button>

          <div className="border-t border-[#bfd0af] pt-5 dark:border-white/12">
            <p className="text-[1.05rem] font-medium text-[#203a28] dark:text-white">Why aren&apos;t you interested?</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {hiddenFeedbackOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className="rounded-full border border-[#bfd0af] bg-[#eef6ee] px-4 py-2.5 text-sm font-medium text-[#344e41] transition-colors hover:bg-[#e2eedf] dark:border-transparent dark:bg-[#3a3f45] dark:text-white dark:hover:bg-[#4a5057]"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <>
      <article ref={cardRef} className="overflow-hidden rounded-[1.4rem] border border-[#a3b18a] bg-[#f8fbf6] shadow-[0_16px_36px_rgba(58,90,64,0.08)] dark:border-[#353c44] dark:bg-[#22272b] dark:shadow-[0_16px_36px_rgba(0,0,0,0.2)]">
        <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar profileImage={authorProfileImage} fallback={authorInitial} sizeClass="h-11 w-11" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-semibold text-[#3a5a40] dark:text-white">{authorDisplayName}</p>
                <button type="button" className="text-sm font-semibold text-[#2d6cdf] dark:text-[#e2b94d]">Follow</button>
              </div>
              <p className="text-xs text-[#5f6f52] dark:text-[#9db8d3]">{formattedDate} | {post.visibility || 'Public'}</p>
            </div>
          </div>
          {enableMenu ? <button type="button" onClick={onOpenMenu} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#5f6f52] transition-colors hover:bg-[#f5f5f2] dark:text-[#d0d7dd] dark:hover:bg-[#353c44]" aria-label="More post actions"><MoreHorizontal className="h-5 w-5" /></button> : null}
        </div>
        <div className="px-4 pb-3">
          {post.content ? <p className="whitespace-pre-wrap text-[0.97rem] leading-7 text-[#344e41] dark:text-[#e2e6e9]">{post.content}</p> : null}
          {sharedPost ? (
            <div className={`${post.content ? 'mt-3' : ''} rounded-[1.1rem] border border-[#d9dfcf] bg-[#f8fbf6] p-3 dark:border-[#444d57] dark:bg-[#202428]`}>
              <p className="text-sm font-semibold text-[#3a5a40] dark:text-white">{getResolvedPostOwnerName(sharedPost)}</p>
              {sharedPost.content ? <p className="mt-2 whitespace-pre-wrap text-[0.95rem] leading-6 text-[#344e41] dark:text-[#e2e6e9]">{sharedPost.content}</p> : null}
              {sharedPost.imageUrl ? <img src={sharedPost.imageUrl} alt="Shared post" className="mt-3 h-auto max-h-[24rem] w-full rounded-[0.95rem] object-cover" /> : null}
            </div>
          ) : null}
        </div>
        {post.imageUrl ? <div className="overflow-hidden border-y border-[#d9dfcf] bg-[#f5f5f2] dark:border-[#444d57] dark:bg-[#202428]"><img src={post.imageUrl} alt="Post" className="h-auto max-h-[34rem] w-full object-cover" /></div> : null}
        <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-[#5f6f52] dark:text-[#d0d7dd]">
          <button type="button" onClick={() => setReactionDetailsOpen(true)} className="flex min-w-0 items-center gap-2 rounded-md px-1 py-0.5 text-left transition-colors hover:text-[#3a5a40] dark:hover:text-white" disabled={reactionCount === 0} aria-label="Show reactions">
            {reactionSummary.badges.length > 0 ? <div className="flex items-center -space-x-1">{reactionSummary.badges.map((badge) => <span key={badge} className="flex h-6 w-6 items-center justify-center rounded-full border border-white bg-[#f8fbf6] text-[13px] shadow-sm dark:border-[#22272b] dark:bg-[#2f343b]">{badge}</span>)}</div> : null}
            {reactionCount > 0 ? <span>{formatCount(reactionCount)}</span> : null}
          </button>
          <div className="flex items-center gap-4"><button type="button" className="transition-colors hover:text-[#3a5a40] dark:hover:text-white" onClick={() => setCommentsViewOpen(true)}>{formatCount(commentCount)} comments</button><button type="button" className="transition-colors hover:text-[#3a5a40] dark:hover:text-white" onClick={() => setShareSheetOpen(true)}>{formatCount(shareCount)} shares</button></div>
        </div>
        <div className="relative grid grid-cols-4 border-t border-[#d9dfcf] px-2 py-1 dark:border-[#444d57]">
          {reactionPickerOpen ? <ReactionPicker selectedReaction={userReaction} onSelect={handleReactionSelect} /> : null}
          <ActionButton icon={ThumbsUp} label={selectedReaction.label} active={Boolean(userReaction)} accentClass={selectedReaction.accent} emoji={userReaction ? selectedReaction.emoji : ''} onClick={handleLikeClick} onPointerDown={startReactionHold} onPointerUp={clearHoldTimer} onPointerLeave={clearHoldTimer} onContextMenu={(event) => event.preventDefault()} />
          <ActionButton icon={MessageCircle} label="Comment" active={commentsViewOpen} onClick={() => setCommentsViewOpen(true)} />
          <ActionButton icon={Share2} label={hasShared ? 'Shared' : 'Share'} active={hasShared} onClick={() => setShareSheetOpen(true)} />
          <ActionButton icon={Bookmark} label="Save" active={isSaved} onClick={() => onToggleSavePost?.(post)} />
        </div>
      </article>
      {commentsViewOpen ? <CenterFeedCommentsView viewerKey={actorKey} profileImage={profileImage} userInitial={userInitial} comments={comments} commentCount={commentCount} commentDraft={commentDraft} commentImage={commentImage} setCommentDraft={setCommentDraft} setCommentImage={setCommentImage} onClose={() => setCommentsViewOpen(false)} onSubmit={handleCommentSubmit} onReply={onAddComment ? (commentId, replyInput) => onAddComment(post.id, { ...replyInput, parentCommentId: commentId }) : undefined} onReactToComment={onReactToComment ? (commentId, reactionType, parentCommentId = null) => onReactToComment(post.id, commentId, reactionType, parentCommentId) : undefined} /> : null}
      {shareSheetOpen ? <CenterFeedShareSheet displayName={displayName} profileImage={profileImage} shareMessage={shareMessage} setShareMessage={setShareMessage} shareVisibility={shareVisibility} setShareVisibility={setShareVisibility} hasShared={hasShared} onClose={() => setShareSheetOpen(false)} onShare={handleShareAction} /> : null}
      {reactionDetailsOpen ? <ReactionDetailsModal reactions={reactions} onClose={() => setReactionDetailsOpen(false)} /> : null}
      {enableMenu && isMenuOpen ? <PostActionSheet sections={menuSections} onClose={onCloseMenu} /> : null}
    </>
  );
}
