import React, { useMemo, useState } from 'react';
import { Edit3, GraduationCap, Link2, MapPin, Mail, Pencil, Phone, User } from 'lucide-react';
import PremiumBadge from '@sharedComponents/ui/PremiumBadge';
import { Avatar } from '@userPages/home/CenterFeedPostShared';
import FeedPostCard from '@userPages/home/FeedPostCard';

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

const downscaleImageDataUrl = (dataUrl, { maxSize = 320, quality = 0.85 } = {}) =>
  new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const width = image.naturalWidth || image.width || 0;
      const height = image.naturalHeight || image.height || 0;

      if (!width || !height) {
        resolve(dataUrl);
        return;
      }

      const scale = Math.min(1, maxSize / Math.max(width, height));
      const targetWidth = Math.max(1, Math.round(width * scale));
      const targetHeight = Math.max(1, Math.round(height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

      try {
        const next = canvas.toDataURL('image/jpeg', quality);
        resolve(typeof next === 'string' && next.length ? next : dataUrl);
      } catch {
        resolve(dataUrl);
      }
    };

    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });

export default function UserMyProfilePage({
  user,
  posts = [],
  onUpdateUser,
  onOpenComposer,
  onToggleSavePost,
  onReactToPost,
  onAddComment,
  onReactToComment,
  onToggleSharePost,
  onDeletePost,
  savedPostIds = [],
}) {
  const displayName = user?.fullName || user?.name || user?.username || 'User';
  const initial = displayName.charAt(0).toUpperCase();
  const profileImage = user?.profileImage || '';
  const projectCount = Array.isArray(user?.projects)
    ? user.projects.length
    : Number.isFinite(Number(user?.projectCount))
      ? Number(user.projectCount)
      : 0;
  const [editing, setEditing] = useState(false);
  const [menuPostId, setMenuPostId] = useState(null);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || user?.name || user?.username || '',
    bio: user?.bio || '',
    socials: user?.socials || '',
    profileImage: user?.profileImage || '',
  });

  const profileSubtitle = useMemo(() => {
    if (user?.type === 'company') {
      return 'Company Profile';
    }
    return user?.desiredJob || user?.education || 'IT Professional';
  }, [user?.type, user?.desiredJob, user?.education]);

  const ownPosts = useMemo(() => {
    const viewerId = String(user?.id || '').trim();
    if (!viewerId) {
      return [];
    }

    return (Array.isArray(posts) ? posts : []).filter((post) => String(post?.ownerUserId || '').trim() === viewerId);
  }, [posts, user?.id]);

  const handleSave = async () => {
    try {
      await onUpdateUser?.({
        fullName: formData.fullName,
        name: formData.fullName,
        username: String(formData.fullName || '').trim(),
        socials: formData.socials,
        bio: formData.bio,
        profileImage: formData.profileImage,
      });
      setEditing(false);
    } catch (error) {
      console.error(error);
      window.alert(error?.message || 'Failed to save profile changes.');
    }
  };

  const handleProfileImageSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    (async () => {
      try {
        const raw = await readFileAsDataUrl(file);
        const nextImage = await downscaleImageDataUrl(raw, { maxSize: 320, quality: 0.85 });

        setFormData((prev) => ({
          ...prev,
          profileImage: nextImage || prev.profileImage,
        }));

        if (nextImage) {
          await onUpdateUser?.({ profileImage: nextImage });
        }
      } catch (error) {
        console.error(error);
        window.alert('Failed to update profile picture. Please try a smaller image.');
      }
    })();
  };

  return (
    <div className="mx-auto w-full max-w-[min(100%,1180px)] space-y-5">
      <div className="bg-[#f8fbf6] dark:bg-[#22272b] border border-[#a3b18a] dark:border-[#353c44] rounded-xl overflow-hidden">
        <div className="h-16 sm:h-20 bg-gradient-to-r from-[#588157] to-[#3a5a40] dark:from-[#82ad86] dark:to-[#6f9b74]" />
        <div className="px-6 sm:px-8 py-6 min-h-[170px]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32">
                <div className="w-full h-full rounded-full border-4 border-white dark:border-[#22272b] bg-[#588157] dark:bg-[#6f9b74] text-white flex items-center justify-center text-4xl font-bold overflow-hidden">
                {profileImage ? (
                  <img src={profileImage} alt={`${displayName} profile`} className="w-full h-full object-cover" />
                ) : (
                  initial
                )}
                </div>
                <label className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-[#3a5a40] dark:bg-[#1a1d20] border border-white/70 dark:border-[#6f9b74]/40 text-white flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                  <Pencil className="w-4 h-4" />
                  <input type="file" accept="image/*" onChange={handleProfileImageSelect} className="hidden" />
                </label>
              </div>
              <div className="space-y-0.5 max-w-[460px]">
                <div className="mb-2 sm:mb-2.5 flex flex-wrap items-center gap-2">
                  <h1 className="text-[1.7rem] min-[420px]:text-[2rem] sm:text-[2.2rem] font-bold text-[#1f3a2a] dark:text-white leading-[1.05] -mt-1 sm:-mt-1.5">{displayName}</h1>
                  {user?.isPremium ? <PremiumBadge /> : null}
                </div>
                <p className="text-[1rem] sm:text-[1.05rem] leading-[1.15] font-medium text-[#2f4e39] dark:text-[#d0d7dd]">{profileSubtitle}</p>
                <p className="text-[0.92rem] sm:text-[0.95rem] leading-[1.15] text-[#2f4e39] dark:text-[#d0d7dd]">
                  {projectCount} project{projectCount === 1 ? '' : 's'}
                </p>
                {user?.bio && <p className="text-[0.92rem] sm:text-[0.95rem] leading-[1.2] text-[#344e41] dark:text-[#d0d7dd]">{user.bio}</p>}
                {user?.socials && (
                  <div className="flex items-center gap-2 text-[0.9rem] sm:text-[0.95rem] leading-[1.15] text-[#2f4e39] dark:text-[#d0d7dd]">
                    <Link2 className="w-4 h-4" />
                    <span className="truncate">{user.socials}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex w-full items-stretch sm:items-center gap-2 sm:w-auto">
                <button
                  onClick={() => setEditing(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#3a5a40] px-4 py-2 text-sm min-[420px]:text-base text-white font-semibold transition-colors hover:bg-[#344e41] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86] sm:w-auto"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#f8fbf6] dark:bg-[#22272b] border border-[#a3b18a] dark:border-[#353c44] rounded-xl p-5 sm:p-6">
        <button
          onClick={onOpenComposer}
          className="w-full text-left px-5 py-4 bg-[#f5f5f2] dark:bg-[#353c44] border border-[#a3b18a] dark:border-[#444d57] rounded-full text-[#344e41] dark:text-[#d0d7dd] hover:bg-[#dad7cd] dark:hover:bg-[#1a1d20] transition-colors"
        >
          What's on your mind, {displayName}?
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5">
        <div className="bg-[#f8fbf6] dark:bg-[#22272b] border border-[#a3b18a] dark:border-[#353c44] rounded-xl p-5 space-y-3 min-h-[280px]">
          <h3 className="text-lg font-semibold text-[#3a5a40] dark:text-white">Personal details</h3>
          <InfoRow icon={User} text={displayName} />
          {user?.address && <InfoRow icon={MapPin} text={user.address} />}
          {user?.education && <InfoRow icon={GraduationCap} text={user.education} />}
          {user?.email && <InfoRow icon={Mail} text={user.email} />}
          {user?.phone && <InfoRow icon={Phone} text={user.phone} />}
        </div>

        <div className="space-y-4">
          <div className="bg-[#f8fbf6] dark:bg-[#22272b] border border-[#a3b18a] dark:border-[#353c44] rounded-xl p-5">
            <h3 className="text-xl font-semibold text-[#3a5a40] dark:text-white">Posts</h3>
          </div>

          {ownPosts.length > 0 ? (
            ownPosts.map((post) => (
              <FeedPostCard
                key={post.id}
                post={post}
                user={user}
                displayName={displayName}
                profileImage={profileImage}
                userInitial={initial}
                isMenuOpen={menuPostId === post.id}
                onOpenMenu={() => setMenuPostId(post.id)}
                onCloseMenu={() => setMenuPostId(null)}
                onToggleSavePost={onToggleSavePost}
                onReactToPost={onReactToPost}
                onAddComment={onAddComment}
                onReactToComment={onReactToComment}
                onToggleSharePost={onToggleSharePost}
                onDeletePost={onDeletePost}
                onHidePost={() => setMenuPostId(null)}
                onHideAuthor={() => setMenuPostId(null)}
                isSavedOverride={savedPostIds.includes(Number(post.id))}
              />
            ))
          ) : (
            <div className="bg-[#f8fbf6] dark:bg-[#22272b] border border-[#a3b18a] dark:border-[#353c44] rounded-xl p-16 text-center min-h-[280px] flex items-center justify-center">
              <p className="text-[#344e41] dark:text-[#d0d7dd]">No posts yet.</p>
            </div>
          )}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#f8fbf6] dark:bg-[#22272b] border border-[#a3b18a] dark:border-[#353c44] rounded-xl p-5">
            <h3 className="text-xl font-bold text-[#3a5a40] dark:text-white mb-4">Edit Profile</h3>
            <div className="grid grid-cols-1 gap-3">
              <input value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} placeholder="Full name" className="input-base" />
              <input value={formData.socials} onChange={(e) => setFormData({ ...formData, socials: e.target.value })} placeholder="Socials" className="input-base" />
              <textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} placeholder="Bio" className="input-base min-h-24" />
            </div>
            <div className="mt-4 flex flex-col-reverse min-[420px]:flex-row justify-end gap-2">
              <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg border border-[#a3b18a] dark:border-[#444d57] text-[#344e41] dark:text-white">
                Cancel
              </button>
              <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-[#3a5a40] dark:bg-[#6f9b74] text-white font-semibold">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-2 text-sm text-[#344e41] dark:text-[#d0d7dd]">
      <Icon className="w-4 h-4 text-[#588157] dark:text-[#6f9b74]" />
      <span className="min-w-0 break-words">{text}</span>
    </div>
  );
}
