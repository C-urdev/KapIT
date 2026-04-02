import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Heart, ImageIcon, Smile, X } from 'lucide-react';
import { ReactionPicker } from './CenterFeedActionButton';
import { Avatar, formatCount, formatRelativeTime, getReactionSummary, REACTION_OPTIONS } from './CenterFeedPostShared';

const SHEET_TRANSITION_MS = 260;
const COMMENTS_SHEET_HEIGHT = '72dvh';
const SWIPE_CLOSE_THRESHOLD = 120;

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest' },
  { key: 'top', label: 'Top' },
];

const EMOJI_OPTIONS = ['😀', '😂', '😍', '🔥', '👏', '🙏', '👍', '🎉'];

function CommentThread({
  comment,
  parentCommentId = null,
  onReplyStart,
  onReactToComment,
  viewerKey,
}) {
  const [repliesOpen, setRepliesOpen] = useState(true);
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const rowRef = useRef(null);
  const reactions = Array.isArray(comment?.reactions) ? comment.reactions : [];
  const replies = Array.isArray(comment?.replies) ? comment.replies : [];
  const reactionSummary = getReactionSummary(reactions);
  const userReaction = reactions.find((entry) => entry.userKey === viewerKey)?.type || '';
  const selectedReaction = REACTION_OPTIONS.find((entry) => entry.key === userReaction) || REACTION_OPTIONS[0];

  useEffect(() => {
    if (!reactionPickerOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!rowRef.current?.contains(event.target)) {
        setReactionPickerOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [reactionPickerOpen]);

  const handleToggleReaction = () => {
    onReactToComment?.(
      comment.id,
      userReaction === 'like' ? '' : 'like',
      parentCommentId
    );
  };

  return (
    <div className={`${parentCommentId ? 'mt-3' : 'py-3'} flex items-start gap-3`} ref={rowRef}>
      <Avatar
        profileImage={comment.authorProfileImage}
        fallback={comment.author?.charAt(0)?.toUpperCase() || 'U'}
        sizeClass={parentCommentId ? 'h-10 w-10' : 'h-12 w-12'}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-[#3a5a40] dark:text-white">{comment.author}</p>
              <span className="text-sm text-[#5f6f52] dark:text-white/45">{formatRelativeTime(comment.createdAt)}</span>
            </div>
            {comment.content ? (
              <p className="mt-1 whitespace-pre-wrap text-[1.02rem] leading-8 text-[#344e41] dark:text-white/92">{comment.content}</p>
            ) : null}
            {comment.imageUrl ? (
              <img
                src={comment.imageUrl}
                alt="Comment attachment"
                className="mt-3 max-h-56 w-full rounded-2xl border border-[#bfd0af] object-cover dark:border-white/8"
              />
            ) : null}
            <div className="relative mt-2 flex items-center gap-4 text-sm text-[#5f6f52] dark:text-white/65">
              <button
                type="button"
                className={`inline-flex items-center gap-1 font-semibold transition-colors hover:text-[#3a5a40] dark:hover:text-white ${userReaction ? selectedReaction.accent : ''}`}
                onClick={handleToggleReaction}
                onContextMenu={(event) => {
                  event.preventDefault();
                  setReactionPickerOpen((current) => !current);
                }}
              >
                {userReaction ? <span className="text-base leading-none">{selectedReaction.emoji}</span> : <Heart className="h-4 w-4" />}
                <span>{userReaction ? selectedReaction.label : 'React'}</span>
                {reactionSummary.total > 0 ? <span>{formatCount(reactionSummary.total)}</span> : null}
              </button>
              <button
                type="button"
                className="font-semibold transition-colors hover:text-[#3a5a40] dark:hover:text-white"
                onClick={() => onReplyStart?.(comment, parentCommentId || comment.id)}
              >
                Reply
              </button>
              {reactionPickerOpen ? (
                <div className="absolute left-0 top-[calc(100%+0.5rem)] z-20">
                  <ReactionPicker
                    selectedReaction={userReaction}
                    onSelect={(reactionKey) => {
                      onReactToComment?.(comment.id, reactionKey, parentCommentId);
                      setReactionPickerOpen(false);
                    }}
                  />
                </div>
              ) : null}
            </div>
            {replies.length > 0 ? (
              <button
                type="button"
                onClick={() => setRepliesOpen((current) => !current)}
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#5f6f52] transition-colors hover:text-[#3a5a40] dark:text-white/70 dark:hover:text-white"
              >
                <span className="h-px w-8 bg-[#a3b18a] dark:bg-white/18" />
                {repliesOpen ? 'Hide replies' : `View ${formatCount(replies.length)} repl${replies.length === 1 ? 'y' : 'ies'}`}
              </button>
            ) : null}
            {repliesOpen && replies.length > 0 ? (
              <div className="mt-1">
                {replies.map((reply) => (
                  <CommentThread
                    key={reply.id}
                    comment={reply}
                    parentCommentId={comment.id}
                    onReplyStart={onReplyStart}
                    onReactToComment={onReactToComment}
                    viewerKey={viewerKey}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CenterFeedCommentsView({
  comments,
  viewerKey,
  commentCount,
  commentDraft,
  commentImage,
  profileImage,
  userInitial,
  setCommentDraft,
  setCommentImage,
  onClose,
  onSubmit,
  onReply,
  onReactToComment,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [sortKey, setSortKey] = useState('newest');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [emojiMenuOpen, setEmojiMenuOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const dragStateRef = useRef({ active: false, startY: 0 });
  const fileInputRef = useRef(null);
  const sortMenuRef = useRef(null);
  const hiddenSheetOffset = 1200;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setIsVisible(false);
      window.setTimeout(() => onClose?.(), SHEET_TRANSITION_MS);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!sortMenuRef.current?.contains(event.target)) {
        setSortMenuOpen(false);
      }
      if (!event.target.closest?.('[data-emoji-menu]')) {
        setEmojiMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    window.setTimeout(() => onClose?.(), SHEET_TRANSITION_MS);
  };

  const handleDragStart = (event) => {
    dragStateRef.current = {
      active: true,
      startY: event.clientY,
    };
    setDragOffset(0);
  };

  const handleDragMove = (event) => {
    if (!dragStateRef.current.active) return;
    const nextOffset = Math.max(0, event.clientY - dragStateRef.current.startY);
    setDragOffset(nextOffset);
  };

  const handleDragEnd = () => {
    if (!dragStateRef.current.active) return;
    const shouldClose = dragOffset >= SWIPE_CLOSE_THRESHOLD;
    dragStateRef.current = { active: false, startY: 0 };

    if (shouldClose) {
      setDragOffset(0);
      handleClose();
      return;
    }

    setDragOffset(0);
  };

  const sortedComments = useMemo(() => {
    const items = [...(Array.isArray(comments) ? comments : [])];
    if (sortKey === 'top') {
      return items.sort((a, b) => {
        const aReactions = Array.isArray(a.reactions) ? a.reactions.length : 0;
        const bReactions = Array.isArray(b.reactions) ? b.reactions.length : 0;
        if (bReactions !== aReactions) return bReactions - aReactions;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [comments, sortKey]);

  const activeSortLabel = SORT_OPTIONS.find((option) => option.key === sortKey)?.label || 'Newest';

  const handlePickImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCommentImage?.(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const appendToDraft = (value) => {
    setCommentDraft((current) => `${current || ''}${value}`);
  };

  const handleSubmit = () => {
    const trimmed = String(commentDraft || '').trim();
    if (!trimmed && !commentImage) {
      return;
    }

    if (replyingTo?.id) {
      onReply?.(replyingTo.parentId, { content: trimmed, imageUrl: commentImage });
      setReplyingTo(null);
      setCommentDraft('');
      setCommentImage('');
      return;
    }

    onSubmit?.();
  };

  return (
    <div className={`fixed inset-0 z-[96] flex flex-col transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <button type="button" aria-label="Close comments" className="absolute inset-0 bg-[#dad7cd]/12 backdrop-blur-[3px] dark:bg-black/28" onClick={handleClose} />
      <div
        className="absolute inset-x-0 bottom-0 z-20 flex h-[72vh] flex-col rounded-t-[2rem] border-t border-[#bfd0af] bg-[#ece8de] transition-transform duration-300 ease-out dark:border-white/8 dark:bg-[#24262b] dark:shadow-[0_-14px_38px_rgba(0,0,0,0.35)]"
        style={{
          height: COMMENTS_SHEET_HEIGHT,
          transform: `translateY(${(isVisible ? 0 : hiddenSheetOffset) + dragOffset}px)`,
          boxShadow: '0 -14px 38px rgba(58,90,64,0.18)',
        }}
      >
        <div
          className="cursor-grab touch-none px-4 pb-3 pt-3 active:cursor-grabbing"
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
          onPointerLeave={handleDragEnd}
        >
          <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-[#9caf88] dark:bg-white/28" />
          <div className="text-center text-[1.05rem] font-semibold text-[#3a5a40] dark:text-white">{formatCount(commentCount)} comments</div>
          <div className="mt-3 flex items-center justify-between">
            <div className="relative" ref={sortMenuRef}>
              <button type="button" onClick={() => setSortMenuOpen((current) => !current)} className="inline-flex items-center gap-2 text-[1.02rem] font-semibold text-[#3a5a40] dark:text-white/92">{activeSortLabel}<ChevronDown className="h-4 w-4" /></button>
              {sortMenuOpen ? (
                <div className="absolute left-0 top-[calc(100%+0.5rem)] z-30 min-w-40 overflow-hidden rounded-2xl border border-[#bfd0af] bg-white shadow-[0_12px_30px_rgba(58,90,64,0.12)] dark:border-white/8 dark:bg-[#34343a]">
                  {SORT_OPTIONS.map((option) => (
                    <button key={option.key} type="button" onClick={() => { setSortKey(option.key); setSortMenuOpen(false); }} className={`block w-full px-4 py-3 text-left text-sm transition-colors hover:bg-[#f5f5f2] dark:hover:bg-white/10 ${sortKey === option.key ? 'font-semibold text-[#3a5a40] dark:text-white' : 'text-[#5f6f52] dark:text-white/75'}`}>
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-1">
            {sortedComments.length > 0 ? sortedComments.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                onReplyStart={(targetComment, parentId) => {
                  setReplyingTo({
                    id: targetComment.id,
                    parentId,
                    author: targetComment.author,
                  });
                  if (!String(commentDraft || '').trim()) {
                    setCommentDraft(`@${targetComment.author} `);
                  }
                }}
                onReactToComment={onReactToComment}
                viewerKey={viewerKey}
              />
            )) : (
              <div className="px-1 py-6 text-center">
                <p className="text-base font-medium text-[#3a5a40] dark:text-white/82">No comments yet</p>
                <p className="mt-2 text-sm text-[#5f6f52] dark:text-white/52">Start the conversation with the first reply.</p>
              </div>
            )}
          </div>
        </div>
        <div className="border-t border-[#bfd0af] bg-[#ece8de] px-4 pb-4 pt-3 dark:border-white/8 dark:bg-[#24262b]" style={{ paddingBottom: 'max(1rem, calc(env(safe-area-inset-bottom) + 0.75rem))' }}>
          {replyingTo ? (
            <div className="mb-3 flex items-center justify-between rounded-2xl border border-[#bfd0af] bg-white px-4 py-2 text-sm dark:border-white/8 dark:bg-[#34343a]">
              <span className="text-[#344e41] dark:text-white/82">Replying to <strong>{replyingTo.author}</strong></span>
              <button type="button" onClick={() => setReplyingTo(null)} className="text-[#5f6f52] transition-colors hover:text-[#3a5a40] dark:text-white/70 dark:hover:text-white" aria-label="Cancel reply">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}
          {commentImage ? (
            <div className="mb-3 flex items-start gap-3 rounded-2xl border border-[#bfd0af] bg-white p-3 dark:border-white/8 dark:bg-[#34343a]">
              <img src={commentImage} alt="Selected comment attachment" className="h-16 w-16 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#3a5a40] dark:text-white">Image ready to send</p>
                <button type="button" onClick={() => setCommentImage?.('')} className="mt-1 text-sm text-[#5f6f52] underline-offset-2 hover:underline dark:text-white/65">Remove</button>
              </div>
            </div>
          ) : null}
          <div className="flex items-center gap-3">
            <Avatar profileImage={profileImage} fallback={userInitial} sizeClass="h-11 w-11" />
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-[#bfd0af] bg-white px-4 py-2.5 dark:border-transparent dark:bg-[#34343a]">
              <input
                type="text"
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder={replyingTo ? `Reply to ${replyingTo.author}...` : 'Add comment...'}
                className="min-w-0 flex-1 bg-transparent text-base text-[#344e41] outline-none placeholder:text-[#5f6f52] dark:text-white dark:placeholder:text-white/45"
              />
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePickImage} />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[#5f6f52] hover:text-[#3a5a40] dark:text-white/70 dark:hover:text-white" aria-label="Add image"><ImageIcon className="h-6 w-6" /></button>
              <div className="relative" data-emoji-menu="true">
                <button type="button" onClick={() => setEmojiMenuOpen((current) => !current)} className="text-[#5f6f52] hover:text-[#3a5a40] dark:text-white/70 dark:hover:text-white" aria-label="Add emoji"><Smile className="h-6 w-6" /></button>
                {emojiMenuOpen ? (
                  <div className="absolute bottom-[calc(100%+0.75rem)] right-0 z-30 flex gap-1 rounded-2xl border border-[#bfd0af] bg-white p-2 shadow-[0_10px_24px_rgba(58,90,64,0.12)] dark:border-white/8 dark:bg-[#34343a]">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button key={emoji} type="button" onClick={() => { appendToDraft(emoji); setEmojiMenuOpen(false); }} className="rounded-xl px-2 py-1 text-xl transition-colors hover:bg-[#f5f5f2] dark:hover:bg-white/10">
                        {emoji}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <button type="button" onClick={() => appendToDraft(commentDraft && !commentDraft.endsWith(' ') ? ' @' : '@')} className="text-[#5f6f52] hover:text-[#3a5a40] dark:text-white/70 dark:hover:text-white" aria-label="Mention user"><span className="text-[1.8rem] leading-none">@</span></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
