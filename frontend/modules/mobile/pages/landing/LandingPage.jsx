import React, { useState } from 'react';
import { ArrowRight, Check, Users, Code2, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from '../../../../components/shared/Link';
import Footer from '../../../shared/components/branding/Footer';
import { CATEGORIES, TRUSTED_LOGOS } from '../../../shared/pages/landing/landingData';
import PublicMobileNav from '../../components/navigation/PublicMobileNav';

const TAILORED_DESCRIPTIONS = {
  'Programming & Tech': "Build robust, scalable software solutions. From frontend interfaces to backend systems, discover roles across the full development stack.",
  'Cybersecurity': "Protect critical infrastructure and sensitive data. Find roles focused on threat detection, ethical hacking, and network defense.",
  'UI/UX Design': "Craft intuitive, user-centric digital experiences. Connect with roles that blend visual aesthetics with seamless user journeys.",
  'Mobile Development': "Create high-performance applications for iOS and Android. Explore opportunities in Swift, Kotlin, React Native, and Flutter.",
  'AI & Data': "Turn raw data into actionable intelligence. Discover roles in machine learning, data engineering, and predictive analytics.",
  'Cloud & DevOps': "Design and maintain resilient cloud architectures. Find roles in CI/CD pipeline automation, serverless, and cloud infrastructure.",
};

export default function MobileLandingPage({ onLogoClick, onOpenAccountChoice, onJoinDeveloperClick, onSignIn }) {
  const [activeCategory, setActiveCategory] = useState(0);
  
  const handleNextCategory = () => {
    setActiveCategory((prev) => (prev === CATEGORIES.length - 1 ? 0 : prev + 1));
  };
  
  const handlePrevCategory = () => {
    setActiveCategory((prev) => (prev === 0 ? CATEGORIES.length - 1 : prev - 1));
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset, velocity) => {
    return Math.abs(offset) * velocity;
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-[#FDFBF7] text-[#2D2A26] dark:bg-[#0A0A0A] dark:text-[#FAFAFA] font-sans antialiased overflow-x-hidden relative">
      
      {/* Background Soft Ambient Orb */}
      <div className="pointer-events-none fixed top-[-10%] left-[-20%] w-[140%] h-[60vh] bg-gradient-radial from-[#EAB308]/15 to-transparent dark:from-[#22C55E]/15 dark:to-transparent blur-[120px] rounded-full z-0" />

      <div className="relative z-10 w-full flex flex-col min-h-screen">
        <PublicMobileNav onLogoClick={onLogoClick} onGetStarted={onOpenAccountChoice} onJoinDeveloper={onJoinDeveloperClick} onSignIn={onSignIn} />

        <main className="flex-1 w-full pb-10 pt-28 px-5">
          
          {/* HERO SECTION - Card Layout */}
          <section className="w-full flex flex-col items-start pt-4 pb-16 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="w-full bg-[#1F332A] dark:bg-[#111111] rounded-[2rem] p-6 pt-8 pb-10 text-white relative shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] dark:shadow-none border border-transparent dark:border-[#22C55E]/10"
            >
              <h1 className="font-sans font-bold text-[3.25rem] leading-[0.95] tracking-[-0.04em] text-white max-w-[9ch]">
                Focused.
                <br />
                Fluid.
                <br />
                Forward.
              </h1>
              
              <p className="mt-8 text-[15px] leading-[1.6] text-white/90 font-medium max-w-[26ch]">
                KapIT's dedicated mobile experience connects you to real opportunities faster than ever.
              </p>

              <div className="mt-12 flex flex-col gap-3 w-full">
                <button
                  type="button"
                  onClick={onOpenAccountChoice}
                  className="group flex w-full items-center justify-between rounded-full bg-white p-4 px-6 text-[15px] font-semibold text-[#1F332A] active:scale-[0.97] transition-all duration-300"
                >
                  <span>Unlock opportunities</span>
                  <ArrowRight className="h-5 w-5 text-[#1F332A] group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          </section>

          {/* HOW IT WORKS SECTION - Z-Axis Cascade */}
          <section className="w-full relative mt-10">
            <div className="mb-10 pl-2">
              <h2 className="text-[2.25rem] font-bold text-[#3A2E25] dark:text-white leading-[1.1] tracking-[-0.03em]">
                How KapIT works
              </h2>
            </div>

            <div className="w-full flex flex-col items-center">
              
              {/* Card 1: Create Profile */}
              <div className="sticky top-[100px] w-full pt-4">
                <motion.div 
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full bg-white dark:bg-[#141414] rounded-[2.5rem] p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.4)] border border-transparent dark:border-white/5"
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#2D4A3E] dark:text-[#EAB308] mb-3">Step 1</p>
                  <div className="flex justify-between items-start gap-4 mb-6">
                    <h3 className="font-sans font-bold text-[1.75rem] leading-[1.05] tracking-[-0.03em] text-[#3A2E25] dark:text-white">
                      Create your profile.
                    </h3>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EAF0E6] dark:bg-[#22C55E]/20">
                      <Users className="h-5 w-5 text-[#2D4A3E] dark:text-[#22C55E]" />
                    </div>
                  </div>
                  <p className="text-[15px] leading-[1.5] text-[#4A3F35] dark:text-[#D4D4D8]">
                    Sign up and complete your developer profile or set up your company account. Let us know exactly what you're looking for.
                  </p>
                </motion.div>
              </div>

              {/* Card 2: Showcase Work */}
              <div className="sticky top-[120px] w-full pt-4">
                <motion.div 
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full bg-[#F6F8F4] dark:bg-[#1A1A1A] rounded-[2.5rem] p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.6)] border border-transparent dark:border-white/5"
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#2D4A3E] dark:text-[#EAB308] mb-3">Step 2</p>
                  <div className="flex justify-between items-start gap-4 mb-6">
                    <h3 className="font-sans font-bold text-[1.75rem] leading-[1.05] tracking-[-0.03em] text-[#3A2E25] dark:text-white">
                      Showcase work.
                    </h3>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EAF0E6] dark:bg-[#22C55E]/20">
                      <Code2 className="h-5 w-5 text-[#2D4A3E] dark:text-[#22C55E]" />
                    </div>
                  </div>
                  <p className="text-[15px] leading-[1.5] text-[#5C4D42] dark:text-[#A1A1AA]">
                    Developers can showcase their portfolios and past work, while companies can post IT projects with clear requirements.
                  </p>
                </motion.div>
              </div>

              {/* Card 3: Connect & Collaborate */}
              <div className="sticky top-[140px] w-full pt-4">
                <motion.div 
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full bg-white dark:bg-[#202020] rounded-[2.5rem] p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.8)] border border-transparent dark:border-white/5"
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#2D4A3E] dark:text-[#EAB308] mb-3">Step 3</p>
                  <div className="flex justify-between items-start gap-4 mb-6">
                    <h3 className="font-sans font-bold text-[1.75rem] leading-[1.05] tracking-[-0.03em] text-[#3A2E25] dark:text-white">
                      Connect & build.
                    </h3>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EAF0E6] dark:bg-[#22C55E]/20">
                      <Sparkles className="h-5 w-5 text-[#2D4A3E] dark:text-[#22C55E]" />
                    </div>
                  </div>
                  <p className="text-[15px] leading-[1.5] text-[#4A3F35] dark:text-[#D4D4D8]">
                    Reach out to matches, interview smoothly on our platform, and start collaborating seamlessly to build great things.
                  </p>
                </motion.div>
              </div>

            </div>
          </section>

          {/* EXPLORE CATEGORIES CAROUSEL */}
          <section className="w-full relative mt-20 mb-8">
            <div className="mb-6 pl-2">
              <h2 className="text-[2.25rem] font-bold text-[#3A2E25] dark:text-white leading-[1.1] tracking-[-0.03em]">
                Explore roles
              </h2>
            </div>
            
            <div className="w-full bg-white dark:bg-[#1A1A1A] rounded-[2rem] p-6 pt-8 pb-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] dark:shadow-2xl border border-[#3A2E25]/5 dark:border-white/10 relative overflow-hidden flex flex-col min-h-[340px]">
              <div className="flex-1 relative flex flex-col justify-center mt-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeCategory}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(e, { offset, velocity }) => {
                      const swipe = swipePower(offset.x, velocity.x);
                      if (swipe < -swipeConfidenceThreshold) {
                        handleNextCategory();
                      } else if (swipe > swipeConfidenceThreshold) {
                        handlePrevCategory();
                      }
                    }}
                    className="flex flex-col items-start cursor-grab active:cursor-grabbing w-full"
                  >
                    {(() => {
                      const activeCat = CATEGORIES[activeCategory];
                      const Icon = activeCat.icon;
                      const description = TAILORED_DESCRIPTIONS[activeCat.title] || "Discover highly skilled roles tailored to this specific IT domain.";
                      return (
                        <>
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF0E6] dark:bg-[#22C55E]/10 mb-6 border border-transparent dark:border-[#22C55E]/20">
                            <Icon className="h-6 w-6 text-[#2D4A3E] dark:text-[#22C55E]" />
                          </div>
                          <h3 className="font-sans font-bold text-[2rem] leading-[1.1] tracking-[-0.03em] text-[#3A2E25] dark:text-white mb-4">
                            {activeCat.title}
                          </h3>
                          <p className="text-[15px] leading-[1.7] text-[#5C4D42] dark:text-[#D4D4D8] font-medium">
                            {description}
                          </p>
                        </>
                      );
                    })()}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Pagination Dots */}
              <div className="flex justify-center items-center gap-2 mt-10">
                {CATEGORIES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveCategory(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === activeCategory 
                        ? 'w-6 bg-[#2D4A3E] dark:bg-[#22C55E]' 
                        : 'w-1.5 bg-[#3A2E25]/20 dark:bg-white/20'
                    }`}
                    aria-label={`Go to category ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* WHY US? COMPARISON TABLE */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full mt-16 mb-16"
          >
            <div className="text-center mb-8">
              <h2 className="font-sans font-bold text-[2.5rem] leading-[1] tracking-[-0.04em] text-[#3A2E25] dark:text-white">
                Why Us?
              </h2>
              <p className="mt-3 text-[14px] text-[#5C4D42] dark:text-[#A1A1AA] font-medium">
                Side-by-side. No fluff.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[#3A2E25]/10 dark:border-white/10 overflow-hidden bg-white dark:bg-[#111111] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] dark:shadow-none">
              {/* Table Header */}
              <div className="grid grid-cols-[1fr_1fr_1fr] px-5 py-4 border-b border-[#3A2E25]/10 dark:border-white/10 bg-[#F6F8F4] dark:bg-[#0A0A0A]">
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#5C4D42] dark:text-[#A1A1AA]">Feature</span>
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#2D4A3E] dark:text-[#22C55E] text-center">KapIT</span>
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#5C4D42] dark:text-[#A1A1AA] text-center">Others</span>
              </div>

              {/* Rows */}
              {[
                { feature: 'IT-Focused', kapit: '100% IT only', others: 'All industries', kapitPositive: true },
                { feature: 'Filipino Talent', kapit: 'PH-first', others: 'Global / generic', kapitPositive: true },
                { feature: 'Portfolio Display', kapit: '+ Built-in', others: '− Link only', kapitPositive: true },
                { feature: 'Skill Matching', kapit: '+ Auto-matched', others: '− Manual search', kapitPositive: true },
                { feature: 'Setup Time', kapit: '< 5 minutes', others: '30+ minutes', kapitPositive: true },
                { feature: 'Hiring Fees', kapit: 'Transparent', others: 'Hidden / tiered', kapitPositive: true },
              ].map((row, i) => (
                <div
                  key={row.feature}
                  className={`grid grid-cols-[1fr_1fr_1fr] px-5 py-4 items-center ${
                    i % 2 === 0
                      ? 'bg-white dark:bg-[#111111]'
                      : 'bg-[#FDFBF7] dark:bg-[#0D0D0D]'
                  } ${i < 5 ? 'border-b border-[#3A2E25]/5 dark:border-white/5' : ''}`}
                >
                  <span className="text-[13px] font-semibold text-[#3A2E25] dark:text-white">{row.feature}</span>
                  <span className="text-[13px] font-medium text-center text-[#2D4A3E] dark:text-[#22C55E]">{row.kapit}</span>
                  <span className="text-[13px] font-medium text-center text-[#5C4D42]/60 dark:text-[#A1A1AA]/60">{row.others}</span>
                </div>
              ))}
            </div>
          </motion.section>

          {/* NEWSLETTER CTA SECTION */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full mt-4"
          >
            <div className="rounded-[2rem] bg-[#2D4A3E] dark:bg-[#111111] px-6 py-12 text-center shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] dark:shadow-none border border-transparent dark:border-[#22C55E]/10">
              <p className="text-[13px] font-bold uppercase tracking-[0.15em] text-[#EAB308] dark:text-[#22C55E] mb-4">
                Don't miss the right match
              </p>
              <h2 className="font-sans font-bold text-[1.75rem] leading-[1.15] tracking-[-0.03em] text-white dark:text-[#FAFAFA] max-w-[22ch] mx-auto">
                Top IT roles in the Philippines fill fast. Get notified before they close.
              </h2>
              <div className="mt-8 flex flex-col sm:flex-row items-stretch gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Your email address"
                  aria-label="Email address for job alerts"
                  className="flex-1 rounded-full bg-[#1E332A] dark:bg-[#1A1A1A] border border-white/10 dark:border-white/10 px-5 py-3.5 text-[14px] text-white dark:text-[#FAFAFA] placeholder-white/40 dark:placeholder-[#A1A1AA]/60 outline-none focus:border-[#EAB308]/50 dark:focus:border-[#22C55E]/50 transition-colors duration-300"
                />
                <button
                  type="button"
                  className="rounded-full bg-[#EAB308] dark:bg-[#22C55E] px-6 py-3.5 text-[14px] font-semibold text-[#3A2E25] dark:text-[#0A0A0A] active:scale-[0.97] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] whitespace-nowrap"
                >
                  Get early access
                </button>
              </div>
            </div>
          </motion.section>

        </main>

        <Footer />
      </div>
    </div>
  );
}
