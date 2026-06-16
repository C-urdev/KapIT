import React, { useEffect, useState } from 'react';
import { Award, TrendingUp } from 'lucide-react';
import PremiumBadge from '@sharedComponents/ui/PremiumBadge';
import { getFeaturedCompanies } from '@sharedServices/authService';
import { useTheme } from '@sharedContext/ThemeContext';

export default function UserRightSidebar({ userType }) {
  const [featuredCompanies, setFeaturedCompanies] = useState([]);
  const [featuredLoaded, setFeaturedLoaded] = useState(false);
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const sectionCardClass = isDarkMode
    ? 'rounded-2xl border border-white/10 bg-[#202428] shadow-[0_14px_32px_rgba(0,0,0,0.18)]'
    : 'rounded-2xl border border-[#d7e2d4] bg-white shadow-[0_14px_32px_rgba(16,42,27,0.06)]';
  const sectionHeaderClass = isDarkMode ? 'font-semibold text-white' : 'font-semibold text-[#24412d]';
  const sectionBodyClass = isDarkMode ? 'text-[#d0d7dd]' : 'text-[#355240]';
  const recommendationHoverClass = isDarkMode ? 'hover:bg-white/5 hover:border-white/10' : 'hover:bg-[#f4f8f3] hover:border-[#cddac7]';
  const skillChipClass = isDarkMode
    ? 'border border-white/6 bg-white/6 text-white/88'
    : 'border border-[#d7e2d4] bg-[#f5f8f4] text-[#355240]';

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

  const sidebarFeaturedCompanies =
    userType === 'employee' && featuredLoaded
      ? featuredCompanies.slice(0, 3)
      : [];

  return (
    <div className="space-y-4">
      <div className={`${sectionCardClass} p-4`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className={`${sectionHeaderClass} flex items-center gap-2`}>
            <Award className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
            {userType === 'employee' ? 'Featured Companies' : 'Premium Profiles'}
          </h3>
        </div>

        <div className="space-y-3">
          {userType === 'employee' ? (
            !featuredLoaded ? (
              <p className={`px-2 text-sm ${sectionBodyClass}`}>Loading featured companies...</p>
            ) : sidebarFeaturedCompanies.length > 0 ? (
              <>
                {sidebarFeaturedCompanies.map((company) => (
                  <RecommendationItem
                    key={company.id}
                    name={company.name || 'Company'}
                    subtitle={company.subtitle || 'Recently hired on KapIT'}
                    isPremium={company.isPremium !== false}
                    recommendationHoverClass={recommendationHoverClass}
                    sectionBodyClass={sectionBodyClass}
                    sectionHeaderClass={sectionHeaderClass}
                    skillChipClass={skillChipClass}
                  />
                ))}
              </>
            ) : (
              <p className={`px-2 text-sm ${sectionBodyClass}`}>No featured companies yet.</p>
            )
          ) : (
            <>
              <RecommendationItem
                name="Carlos Mendoza"
                subtitle="Senior Full Stack Dev"
                isPremium
                skills={['React', 'Node.js', 'AWS']}
                recommendationHoverClass={recommendationHoverClass}
                sectionBodyClass={sectionBodyClass}
                sectionHeaderClass={sectionHeaderClass}
                skillChipClass={skillChipClass}
              />
              <RecommendationItem
                name="Sarah Tan"
                subtitle="DevOps Engineer"
                isPremium
                skills={['Docker', 'Kubernetes', 'CI/CD']}
                recommendationHoverClass={recommendationHoverClass}
                sectionBodyClass={sectionBodyClass}
                sectionHeaderClass={sectionHeaderClass}
                skillChipClass={skillChipClass}
              />
              <RecommendationItem
                name="Miguel Garcia"
                subtitle="Mobile Developer"
                skills={['React Native', 'Flutter']}
                recommendationHoverClass={recommendationHoverClass}
                sectionBodyClass={sectionBodyClass}
                sectionHeaderClass={sectionHeaderClass}
                skillChipClass={skillChipClass}
              />
            </>
          )}
        </div>
      </div>

      <div className={`${sectionCardClass} p-4`}>
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[#588157] dark:text-[#6f9b74]" />
          <h3 className={sectionHeaderClass}>
            {userType === 'employee' ? 'Top Skills in Demand' : 'Trending Skills'}
          </h3>
        </div>

        <div className="space-y-2">
          <TrendingItem skill="React.js" count="1,234 jobs" sectionHeaderClass={sectionHeaderClass} sectionBodyClass={sectionBodyClass} />
          <TrendingItem skill="Node.js" count="987 jobs" sectionHeaderClass={sectionHeaderClass} sectionBodyClass={sectionBodyClass} />
          <TrendingItem skill="Python" count="856 jobs" sectionHeaderClass={sectionHeaderClass} sectionBodyClass={sectionBodyClass} />
          <TrendingItem skill="AWS" count="743 jobs" sectionHeaderClass={sectionHeaderClass} sectionBodyClass={sectionBodyClass} />
          <TrendingItem skill="Docker" count="621 jobs" sectionHeaderClass={sectionHeaderClass} sectionBodyClass={sectionBodyClass} />
        </div>
      </div>

      <div className={`rounded-2xl border p-4 shadow-[0_8px_24px_rgba(105,145,214,0.12)] ${isDarkMode ? 'border-[#30538a] bg-[#202428]' : 'border-[#c8d7f2] bg-[#f8fbff]'}`}>
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f1ff] text-[#4a77c4] dark:bg-[#183154] dark:text-[#8ebbf7]">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h4 className={`${sectionHeaderClass} mb-1`}>
              {userType === 'employee' ? 'Career Tip' : 'Hiring Tip'}
            </h4>
            <p className={`text-sm ${sectionBodyClass}`}>
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

function RecommendationItem({
  name,
  subtitle,
  isPremium,
  skills,
  recommendationHoverClass,
  sectionBodyClass,
  sectionHeaderClass,
  skillChipClass,
}) {
  return (
    <div className={`group relative flex cursor-pointer items-start gap-3 overflow-hidden rounded-xl border border-transparent p-3 transition-all duration-200 hover:-translate-y-[1px] ${recommendationHoverClass}`}>
      <span
        aria-hidden="true"
        className="absolute left-4 top-0 h-0.5 w-10 translate-y-0 rounded-full bg-[#588157] opacity-0 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:-translate-y-0.5 dark:bg-[#82ad86]"
      />
      <div className="relative">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#588157] to-[#3a5a40] shadow-sm dark:from-[#82ad86] dark:to-[#6f9b74]">
          <span className="text-sm font-semibold text-white">{name.charAt(0)}</span>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className={`${sectionHeaderClass} truncate text-sm`}>{name}</h4>
          {isPremium ? <PremiumBadge compact /> : null}
        </div>
        <p className={`truncate text-xs ${sectionBodyClass}`}>{subtitle}</p>
        {skills ? (
          <div className="mt-1 flex gap-1">
            {skills.slice(0, 2).map((skill, index) => (
              <span key={index} className={`rounded-md px-2 py-0.5 text-xs ${skillChipClass}`}>
                {skill}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TrendingItem({ skill, count, sectionHeaderClass, sectionBodyClass }) {
  return (
    <div className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-[#f5f8f4] dark:hover:bg-white/5">
      <span className={`text-sm font-medium ${sectionHeaderClass}`}>{skill}</span>
      <span className={`text-xs ${sectionBodyClass}`}>{count}</span>
    </div>
  );
}
