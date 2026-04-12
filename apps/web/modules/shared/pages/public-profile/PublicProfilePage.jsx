import React, { useEffect, useState } from 'react';
import { ArrowLeft, Building2, Globe, Mail, MapPin, MessageCircle, User } from 'lucide-react';
import {
  addCommentToPost,
  listProfilePosts,
  reactToCommentOnPost,
  reactToPost,
  toggleSharePost,
} from '@sharedServices/postService';
import PremiumBadge from '@sharedComponents/ui/PremiumBadge';
import FeedPostCard from '@userPages/home/FeedPostCard';

export default function PublicProfilePage({ profile, onBack, onMessage, onMore, viewer, onToggleSavePost, onReactToPost, onAddComment, onReactToComment, onToggleSharePost, savedPostIds = [] }) {
  const displayName = profile?.companyName || profile?.fullName || profile?.username || profile?.name || 'User';
  const initial = displayName.charAt(0).toUpperCase();
  const [posts, setPosts] = useState([]);
  const isCompany = profile?.type === 'company';
  const relatedCompanies = Array.isArray(profile?.relatedCompanies) ? profile.relatedCompanies : [];

  useEffect(() => {
    let mounted = true;

    const loadPosts = async () => {
      if (!profile?.id) {
        setPosts([]);
        return;
      }

      try {
        const items = await listProfilePosts(profile.id);
        if (mounted) {
          setPosts(items);
        }
      } catch {
        if (mounted) {
          setPosts([]);
        }
      }
    };

    void loadPosts();
    return () => {
      mounted = false;
    };
  }, [profile, viewer]);

  const reloadProfilePosts = async () => {
    if (!profile?.id) {
      setPosts([]);
      return;
    }

    const items = await listProfilePosts(profile.id);
    setPosts(items);
  };

  const handleReactToProfilePost = async (postId, reactionType) => {
    if (!viewer) {
      onReactToPost?.(postId, reactionType);
      return;
    }
    await reactToPost(postId, reactionType);
    await reloadProfilePosts();
  };

  const handleAddCommentToProfilePost = async (postId, commentInput) => {
    if (!viewer) {
      onAddComment?.(postId, commentInput);
      return;
    }
    await addCommentToPost(postId, commentInput);
    await reloadProfilePosts();
  };

  const handleShareProfilePost = async (postId, shareInput) => {
    if (!viewer) {
      onToggleSharePost?.(postId, shareInput);
      return;
    }
    await toggleSharePost(postId, shareInput);
    await reloadProfilePosts();
  };

  const handleReactToProfileComment = async (postId, commentId, reactionType, parentCommentId = null) => {
    if (!viewer) {
      onReactToComment?.(postId, commentId, reactionType, parentCommentId);
      return;
    }
    await reactToCommentOnPost(postId, commentId, reactionType, parentCommentId);
    await reloadProfilePosts();
  };

  return (
    <div className="mx-auto w-full max-w-[min(100%,1240px)] space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#a3b18a] dark:border-[#2a4a6f] text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          {onMore ? (
            <button
              type="button"
              onClick={() => onMore(profile)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#3a5a40] text-white hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:text-[#0a1628] dark:hover:bg-[#5bc0de] transition-colors"
            >
              More
            </button>
          ) : null}
        </div>
      </div>

      <section className="bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-xl overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-[#588157] to-[#3a5a40] dark:from-[#2d8bb8] dark:to-[#3ba9d6]" />
        <div className="px-5 sm:px-8 py-5 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full min-w-0 flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="w-20 h-20 rounded-full border-4 border-white dark:border-[#162842] bg-[#588157] dark:bg-[#3ba9d6] text-white overflow-hidden flex items-center justify-center text-2xl font-bold shrink-0">
              {profile?.profileImage ? (
                <img src={profile.profileImage} alt={`${displayName} profile`} className="w-full h-full object-cover" />
              ) : (
                initial
              )}
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#1f3a2a] dark:text-white break-words">{displayName}</h1>
                {profile?.isPremium ? <PremiumBadge /> : null}
              </div>
              <p className="text-sm text-[#2f4e39] dark:text-[#b8d4e8]">{isCompany ? 'Company account' : (profile?.desiredJob || 'IT Professional')}</p>
              {(profile?.shortDescription || profile?.bio) && <p className="text-sm text-[#344e41] dark:text-[#b8d4e8]">{profile?.shortDescription || profile?.bio}</p>}
            </div>
          </div>
          {profile?.id && onMessage && (
            <button
              type="button"
              onClick={() => onMessage(profile)}
              className="hidden sm:inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#a3b18a] bg-[#f8fbf6] text-[#3a5a40] hover:bg-[#eef6ee] dark:border-[#2a4a6f] dark:bg-[#102235] dark:text-[#7fd0ee] dark:hover:bg-[#1e3a5f] transition-colors"
              aria-label={`Message ${displayName}`}
              title={`Message ${displayName}`}
            >
              <MessageCircle className="h-5 w-5" />
            </button>
          )}
        </div>
        {(profile?.id && onMessage) && (
          <div className="px-6 sm:px-8 pb-5 sm:hidden">
            <button
              type="button"
              onClick={() => onMessage(profile)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#3a5a40] px-4 py-2.5 text-white dark:bg-[#3ba9d6] dark:text-[#0a1628]"
            >
              <MessageCircle className="h-4 w-4" />
              Message
            </button>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
        <aside className="space-y-4">
          <section className="bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-xl p-4">
            <h2 className="text-lg font-semibold text-[#3a5a40] dark:text-white mb-3">Info</h2>
            <InfoRow icon={User} text={displayName} />
            {profile?.email && <InfoRow icon={Mail} text={profile.email} />}
            {profile?.address && <InfoRow icon={MapPin} text={profile.address} />}
            {profile?.website && <InfoRow icon={Globe} text={profile.website} />}
            <InfoRow icon={Building2} text={isCompany ? 'Company' : 'User'} />
          </section>

          {isCompany && (
            <section className="bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-xl p-4">
              <h2 className="text-lg font-semibold text-[#3a5a40] dark:text-white mb-3">Related Companies</h2>
              {relatedCompanies.length === 0 ? (
                <p className="text-sm text-[#344e41] dark:text-[#b8d4e8]">No related companies listed yet.</p>
              ) : (
                <div className="space-y-2">
                  {relatedCompanies.map((company, index) => (
                    <div key={company?.id || `${company?.name || 'company'}-${index}`} className="p-3 rounded-lg bg-[#f5f5f2] dark:bg-[#1e3a5f]">
                      <p className="font-medium text-[#3a5a40] dark:text-white">{company?.name || 'Unnamed company'}</p>
                      {company?.shortDescription && <p className="text-sm text-[#344e41] dark:text-[#b8d4e8] mt-1">{company.shortDescription}</p>}
                      {company?.website && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-[#344e41] dark:text-[#b8d4e8]">
                          <Globe className="w-3.5 h-3.5 text-[#588157] dark:text-[#3ba9d6]" />
                          <span className="truncate">{company.website}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </aside>

        <main className="space-y-4">
          <section className="bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-xl p-4">
            <h2 className="text-lg font-semibold text-[#3a5a40] dark:text-white mb-3">Posts</h2>
            {posts.length === 0 ? (
              <p className="text-sm text-[#344e41] dark:text-[#b8d4e8]">No posts yet.</p>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <FeedPostCard
                    key={post.id}
                    post={post}
                    user={viewer || profile}
                    displayName={displayName}
                    profileImage={profile?.profileImage || ''}
                    userInitial={initial}
                    isMenuOpen={false}
                    onOpenMenu={() => {}}
                    onCloseMenu={() => {}}
                    onToggleSavePost={onToggleSavePost}
                    onReactToPost={handleReactToProfilePost}
                    onAddComment={handleAddCommentToProfilePost}
                    onReactToComment={handleReactToProfileComment}
                    onToggleSharePost={handleShareProfilePost}
                    onHidePost={() => {}}
                    enableMenu={false}
                    isSavedOverride={savedPostIds.includes(Number(post.id))}
                  />
                ))}
              </div>
            )}
          </section>

        </main>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-2 text-sm text-[#344e41] dark:text-[#b8d4e8] mb-2">
      <Icon className="w-4 h-4 text-[#588157] dark:text-[#3ba9d6]" />
      <span>{text}</span>
    </div>
  );
}

