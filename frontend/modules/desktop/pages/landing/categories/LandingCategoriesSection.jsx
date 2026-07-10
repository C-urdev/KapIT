import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import ThinSectionLine from '@sharedComponents/ui/ThinSectionLine';
import { CATEGORIES } from '../../../../shared/pages/landing/landingData';

const TAILORED_DESCRIPTIONS = {
  'Programming & Tech': "Build robust, scalable software solutions. From frontend interfaces to backend systems, discover roles across the full development stack.",
  'Cybersecurity': "Protect critical infrastructure and sensitive data. Find roles focused on threat detection, ethical hacking, and network defense.",
  'UI/UX Design': "Craft intuitive, user-centric digital experiences. Connect with roles that blend visual aesthetics with seamless user journeys.",
  'Mobile Development': "Create high-performance applications for iOS and Android. Explore opportunities in Swift, Kotlin, React Native, and Flutter.",
  'AI & Data': "Turn raw data into actionable intelligence. Discover roles in machine learning, data engineering, and predictive analytics.",
  'Cloud & DevOps': "Design and maintain resilient cloud architectures. Find roles in CI/CD pipeline automation, serverless, and cloud infrastructure.",
};

export default function LandingCategoriesSection({ onOpenAccountChoice }) {
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <section className="relative bg-gradient-to-b from-[#e2ddcf] via-[#ebe6da] to-[#f7f6f1] dark:bg-gradient-to-b dark:from-[#1a1d20] dark:via-[#202428] dark:to-[#23282e] scroll-mt-24">
      <div className="landing-desktop-shell pt-6 pb-12 sm:pt-10 sm:pb-16 lg:pt-8 lg:pb-16">
        <div className="mb-7 max-w-2xl lg:mb-8">
          <h3 className="text-3xl lg:text-4xl font-bold text-[#102a1b] dark:text-white">
            Explore categories
          </h3>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Left Side: Category List */}
          <div className="w-full lg:w-5/12 flex flex-col gap-1">
            {CATEGORIES.map((cat, idx) => {
              const isActive = idx === activeCategory;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.title}
                  onClick={() => setActiveCategory(idx)}
                  className={`group flex items-center justify-between w-full text-left py-3.5 px-5 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? 'bg-white dark:bg-[#141414] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-transparent dark:border-white/5' 
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-300 ${
                      isActive 
                        ? 'bg-[#F6F8F4] dark:bg-[#22C55E]/10' 
                        : 'bg-transparent group-hover:bg-[#F6F8F4] dark:group-hover:bg-[#22C55E]/5'
                    }`}>
                      <Icon className={`h-5 w-5 transition-colors duration-300 ${
                        isActive ? 'text-[#102a1b] dark:text-[#22C55E]' : 'text-[#5C4D42] dark:text-[#A1A1AA]'
                      }`} />
                    </div>
                    <span className={`text-base font-bold tracking-[-0.02em] transition-colors duration-300 ${
                      isActive ? 'text-[#102a1b] dark:text-white' : 'text-[#5C4D42] dark:text-[#A1A1AA]'
                    }`}>
                      {cat.title}
                    </span>
                  </div>
                  {isActive && (
                    <motion.div layoutId="activeIndicator" className="h-2 w-2 rounded-full bg-[#102a1b] dark:bg-[#22C55E]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Side: Content Area */}
          <div className="w-full lg:w-7/12 flex items-center">
            <div className="w-full bg-white dark:bg-[#141414] rounded-3xl p-8 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-[#a3b18a]/20 dark:border-white/5 relative overflow-hidden min-h-[340px] flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategory}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  className="relative z-10"
                >
                  {(() => {
                    const activeCat = CATEGORIES[activeCategory];
                    const Icon = activeCat.icon;
                    return (
                      <>
                        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F6F8F4] dark:bg-[#22C55E]/10 mb-5">
                          <Icon className="h-7 w-7 text-[#102a1b] dark:text-[#22C55E]" />
                        </div>
                        <h3 className="text-2xl lg:text-3xl font-bold text-[#102a1b] dark:text-white leading-[1.1] tracking-[-0.02em] mb-3">
                          {activeCat.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-[#4a6354] dark:text-[#d0d7dd] max-w-lg mb-8">
                          {TAILORED_DESCRIPTIONS[activeCat.title]}
                        </p>
                        
                        <button 
                          onClick={onOpenAccountChoice}
                          className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#102a1b] text-white dark:bg-[#22c55e] dark:text-[#121416] font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                          <span>Find {activeCat.title} Experts</span>
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </>
                    )
                  })()}
                </motion.div>
              </AnimatePresence>
              
              {/* Background abstract element for extra minimalist flair */}
              <div className="absolute right-[-10%] top-[-10%] h-[300px] w-[300px] rounded-full bg-[#102a1b]/5 dark:bg-[#22C55E]/5 blur-3xl pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
      <ThinSectionLine className="bottom-0" />
    </section>
  );
}
