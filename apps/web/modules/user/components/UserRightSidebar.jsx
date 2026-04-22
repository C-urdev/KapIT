import React, { useEffect, useState } from 'react';
import { Award, TrendingUp } from 'lucide-react';
import PremiumBadge from '@sharedComponents/ui/PremiumBadge';
import { getFeaturedCompanies } from '@sharedServices/authService';

/** Pinned sample row so Featured Companies is never empty in demos; not tied to `jobs.hired_at`. */
const DEMO_FOUNDIT_FEATURED = {
  id: '__demo_foundit_featured__',
  name: 'Foundit',
  subtitle: 'AI and engineering company',
  isPremium: true,
};

export default function UserRightSidebar({ userType }) {
  const [featuredCompanies, setFeaturedCompanies] = useState([]);
  const [featuredLoaded, setFeaturedLoaded] = useState(false);

  useEffect(() => {
    if (userType !== 'employee') {
      return undefined;
    }

    let cancelled = false;

    (async () => {
      const rows = await getFeaturedCompanies();
      if (!cancelled) {
        setFeaturedCompanies(rows);
        setFeaturedLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userType]);

  const liveFeaturedCompanies =
    userType === 'employee'
      ? featuredCompanies.filter((c) => String(c.name || '').trim().toLowerCase() !== 'foundit')
      : [];

  const sidebarFeaturedCompanies =
    userType === 'employee' && featuredLoaded ? [DEMO_FOUNDIT_FEATURED, ...liveFeaturedCompanies] : [];

  return (
    <div className="space-y-4">
      <div className="bg-[#f8fbf6] dark:bg-[#22272b] border border-[#a3b18a] dark:border-[#353c44] rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#3a5a40] dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
            {userType === 'employee' ? 'Featured Companies' : 'Premium Profiles'}
          </h3>
        </div>

        <div className="space-y-3">
          {userType === 'employee' ? (
            !featuredLoaded ? (
              <p className="text-sm text-[#344e41] dark:text-[#d0d7dd] px-2">Loading featured companies…</p>
            ) : (
              <>
                {sidebarFeaturedCompanies.map((company) => (
                  <RecommendationItem
                    key={company.id}
                    name={company.name || 'Company'}
                    subtitle={company.subtitle || 'Recently hired on KapIT'}
                    isPremium={company.isPremium !== false}
                  />
                ))}
                {liveFeaturedCompanies.length === 0 ? (
                  <p className="text-xs text-[#344e41]/85 dark:text-[#d0d7dd]/85 px-2 pt-1">
                    This list features companies hiring on KapIT, such as AI and engineering teams.
                  </p>
                ) : null}
              </>
            )
          ) : (
            <>
              <RecommendationItem name="Carlos Mendoza" subtitle="Senior Full Stack Dev" isPremium skills={['React', 'Node.js', 'AWS']} />
              <RecommendationItem name="Sarah Tan" subtitle="DevOps Engineer" isPremium skills={['Docker', 'Kubernetes', 'CI/CD']} />
              <RecommendationItem name="Miguel Garcia" subtitle="Mobile Developer" skills={['React Native', 'Flutter']} />
            </>
          )}
        </div>
      </div>

      <div className="bg-[#f8fbf6] dark:bg-[#22272b] border border-[#a3b18a] dark:border-[#353c44] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[#588157] dark:text-[#6f9b74]" />
          <h3 className="font-semibold text-[#3a5a40] dark:text-white">
            {userType === 'employee' ? 'Top Skills in Demand' : 'Trending Skills'}
          </h3>
        </div>

        <div className="space-y-2">
          <TrendingItem skill="React.js" count="1,234 jobs" />
          <TrendingItem skill="Node.js" count="987 jobs" />
          <TrendingItem skill="Python" count="856 jobs" />
          <TrendingItem skill="AWS" count="743 jobs" />
          <TrendingItem skill="Docker" count="621 jobs" />
        </div>
      </div>

      <div className="rounded-2xl border border-[#c8d7f2] bg-[#f8fbff] p-4 shadow-[0_8px_24px_rgba(105,145,214,0.12)] dark:border-[#30538a] dark:bg-[#202428]">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f1ff] text-[#4a77c4] dark:bg-[#183154] dark:text-[#8ebbf7]">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-[#3a5a40] dark:text-white mb-1">
              {userType === 'employee' ? 'Career Tip' : 'Hiring Tip'}
            </h4>
            <p className="text-sm text-[#344e41] dark:text-[#d0d7dd]">
              {userType === 'employee'
                ? 'Showcase live projects in your portfolio. Recruiters spend 6x more time on profiles with working demos.'
                : 'Candidates with GitHub profiles get 3x more responses. Look for active contributors to find passionate developers.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecommendationItem({ name, subtitle, isPremium, skills }) {
  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-[#f5f5f2] dark:hover:bg-[#353c44] transition-colors cursor-pointer">
      <div className="relative">
        <div className="w-10 h-10 bg-gradient-to-br from-[#588157] to-[#3a5a40] dark:from-[#82ad86] dark:to-[#6f9b74] rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white font-semibold text-sm">{name.charAt(0)}</span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-medium text-[#3a5a40] dark:text-white text-sm truncate">{name}</h4>
          {isPremium ? <PremiumBadge compact /> : null}
        </div>
        <p className="text-xs text-[#344e41] dark:text-[#d0d7dd] truncate">{subtitle}</p>
        {skills ? (
          <div className="flex gap-1 mt-1">
            {skills.slice(0, 2).map((skill, index) => (
              <span key={index} className="px-2 py-0.5 bg-[#f5f5f2] dark:bg-[#353c44] text-[#344e41] dark:text-white text-xs rounded">
                {skill}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TrendingItem({ skill, count }) {
  return (
    <div className="flex items-center justify-between py-2 hover:bg-[#f5f5f2] dark:hover:bg-[#353c44] rounded-lg px-2 transition-colors cursor-pointer">
      <span className="text-sm font-medium text-[#3a5a40] dark:text-white">{skill}</span>
      <span className="text-xs text-[#344e41] dark:text-[#adb5be]">{count}</span>
    </div>
  );
}
