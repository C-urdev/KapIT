// RightSidebar 

import React from 'react';
import { Award, TrendingUp } from 'lucide-react';

export default function RightSidebar({ userType }) {
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#3a5a40] dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
            {userType === 'employee' ? 'Featured Companies' : 'Premium Profiles'}
          </h3>
        </div>
        
        <div className="space-y-3">
          {userType === 'employee' ? (
            <>
              <RecommendationItem
                name="Globe Telecom"
                subtitle="Telecommunications"
                isPremium={true}
              />
              <RecommendationItem
                name="Accenture Philippines"
                subtitle="IT Consulting"
                isPremium={true}
              />
              <RecommendationItem
                name="Thinking Machines"
                subtitle="Data Science & AI"
              />
            </>
          ) : (
            <>
              <RecommendationItem
                name="Carlos Mendoza"
                subtitle="Senior Full Stack Dev"
                isPremium={true}
                skills={["React", "Node.js", "AWS"]}
              />
              <RecommendationItem
                name="Sarah Tan"
                subtitle="DevOps Engineer"
                isPremium={true}
                skills={["Docker", "Kubernetes", "CI/CD"]}
              />
              <RecommendationItem
                name="Miguel Garcia"
                subtitle="Mobile Developer"
                skills={["React Native", "Flutter"]}
              />
            </>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[#588157] dark:text-[#3ba9d6]" />
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

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-900/30 rounded-xl p-4">
        <h4 className="font-semibold text-[#3a5a40] dark:text-white mb-2">
          {userType === 'employee' ? '💡 Career Tip' : '💡 Hiring Tip'}
        </h4>
        <p className="text-sm text-[#344e41] dark:text-[#b8d4e8]">
          {userType === 'employee' 
            ? 'Showcase live projects in your portfolio. Recruiters spend 6x more time on profiles with working demos.'
            : 'Candidates with GitHub profiles get 3x more responses. Look for active contributors to find passionate developers.'}
        </p>
      </div>
    </div>
  );
}

function RecommendationItem({ name, subtitle, isPremium, skills }) {
  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors cursor-pointer">
      <div className="relative">
        <div className="w-10 h-10 bg-gradient-to-br from-[#588157] to-[#3a5a40] dark:from-[#2d8bb8] dark:to-[#3ba9d6] rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white font-semibold text-sm">{name.charAt(0)}</span>
        </div>
        {isPremium && (
          <div className="absolute -bottom-1 -right-1 bg-yellow-500 dark:bg-yellow-400 rounded-full p-0.5">
            <Award className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-[#3a5a40] dark:text-white text-sm truncate">{name}</h4>
        <p className="text-xs text-[#344e41] dark:text-[#b8d4e8] truncate">{subtitle}</p>
        {skills && (
          <div className="flex gap-1 mt-1">
            {skills.slice(0, 2).map((skill, i) => (
              <span key={i} className="px-2 py-0.5 bg-[#f5f5f2] dark:bg-[#1e3a5f] text-[#344e41] dark:text-white text-xs rounded">
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TrendingItem({ skill, count }) {
  return (
    <div className="flex items-center justify-between py-2 hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] rounded-lg px-2 transition-colors cursor-pointer">
      <span className="text-sm font-medium text-[#3a5a40] dark:text-white">{skill}</span>
      <span className="text-xs text-[#344e41] dark:text-[#7d9ab8]">{count}</span>
    </div>
  );
}