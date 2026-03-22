import React, { useMemo } from 'react';
import { ArrowLeft, Briefcase, Building2, Globe, Mail, MapPin, MessageCircle, User } from 'lucide-react';
import { getPostsForUser } from '@userFeatures/posts/userPostStorage';

export default function PublicProfilePage({ profile, onBack, onMessage }) {
  const displayName = profile?.username || profile?.name || 'User';
  const initial = displayName.charAt(0).toUpperCase();
  const posts = useMemo(() => getPostsForUser(profile), [profile]);
  const isCompany = profile?.type === 'company';
  const relatedCompanies = Array.isArray(profile?.relatedCompanies) ? profile.relatedCompanies : [];
  const jobListings = isCompany && Array.isArray(profile?.jobListings) ? profile.jobListings : [];

  return (
    <div className="w-full max-w-[1300px] mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#a3b18a] dark:border-[#2a4a6f] text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <section className="bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-xl overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-[#588157] to-[#3a5a40] dark:from-[#2d8bb8] dark:to-[#3ba9d6]" />
        <div className="px-6 sm:px-8 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-20 h-20 rounded-full border-4 border-white dark:border-[#162842] bg-[#588157] dark:bg-[#3ba9d6] text-white overflow-hidden flex items-center justify-center text-2xl font-bold shrink-0">
              {profile?.profileImage ? (
                <img src={profile.profileImage} alt={`${displayName} profile`} className="w-full h-full object-cover" />
              ) : (
                initial
              )}
            </div>
            <div className="space-y-1 min-w-0">
              <h1 className="text-3xl font-bold text-[#1f3a2a] dark:text-white truncate">{displayName}</h1>
              <p className="text-sm text-[#2f4e39] dark:text-[#b8d4e8]">{isCompany ? 'Company account' : (profile?.desiredJob || 'IT Professional')}</p>
              {(profile?.shortDescription || profile?.bio) && <p className="text-sm text-[#344e41] dark:text-[#b8d4e8]">{profile?.shortDescription || profile?.bio}</p>}
            </div>
          </div>
          {profile?.id && onMessage && (
            <button
              type="button"
              onClick={() => onMessage(profile)}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#a3b18a] bg-[#f8fbf6] text-[#3a5a40] hover:bg-[#eef6ee] dark:border-[#2a4a6f] dark:bg-[#102235] dark:text-[#7fd0ee] dark:hover:bg-[#1e3a5f] transition-colors"
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
                  <article key={post.id} className="border border-[#a3b18a] dark:border-[#2a4a6f] rounded-lg p-3">
                    <p className="text-sm text-[#344e41] dark:text-[#b8d4e8] whitespace-pre-wrap">{post.content}</p>
                    <p className="text-xs mt-2 text-[#3a5a40] dark:text-[#7d9ab8]">{new Date(post.createdAt).toLocaleString()}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-xl p-4">
            <h2 className="text-lg font-semibold text-[#3a5a40] dark:text-white mb-3">Job Listings</h2>
            {!isCompany ? (
              <p className="text-sm text-[#344e41] dark:text-[#b8d4e8]">This user has no job listings.</p>
            ) : jobListings.length === 0 ? (
              <p className="text-sm text-[#344e41] dark:text-[#b8d4e8]">No paid job listings are currently posted.</p>
            ) : (
              <div className="space-y-2">
                {jobListings.map((job) => (
                  <div key={job.id} className="p-3 rounded-lg border border-[#a3b18a] dark:border-[#2a4a6f]">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[#588157] dark:text-[#3ba9d6]" />
                      <p className="font-medium text-[#3a5a40] dark:text-white">{job.title}</p>
                    </div>
                    <p className="text-sm text-[#344e41] dark:text-[#b8d4e8] mt-1">{job.location} ? {job.type}</p>
                  </div>
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



