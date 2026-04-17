import React from 'react';
import { X, HelpCircle } from 'lucide-react';

const FAQ_DATA = [
  {
    category: "Getting Started",
    items: [
      {
        question: "Do I need to create an account before I can apply for jobs?",
        answer: "Yes. You need to create a KapIT account to apply for jobs, upload your resume, and access full platform features. Creating an account also allows you to track your applications and receive job alerts."
      },
      {
        question: "Can I use KapIT even if I'm a fresh graduate with no experience?",
        answer: "Yes. KapIT is designed for both entry-level and experienced IT professionals. You can still apply for jobs, build your profile, and improve your chances through skill matching and resume optimization tools if you upgrade to Premium."
      }
    ]
  },
  {
    category: "Job Applications",
    items: [
      {
        question: "How do I know if I am qualified for a job?",
        answer: "KapIT may show a skill match percentage for certain job postings if you are on Premium. This helps you understand how closely your profile matches the job requirements before applying."
      },
      {
        question: "Why am I not getting responses from employers after applying?",
        answer: "Responses depend entirely on employers. Some companies receive many applications, while others may have longer review processes. KapIT does not control employer response times."
      },
      {
        question: "Can I apply for multiple jobs at the same time?",
        answer: "Yes. You can apply to as many job postings as you want, as long as your qualifications match the requirements set by the employer."
      }
    ]
  },
  {
    category: "Profile and Resume",
    items: [
      {
        question: "Do I need a resume to use KapIT?",
        answer: "Yes. A resume is required to apply for jobs. You can upload an existing resume or create one through your KapIT profile. Once uploaded, your resume may be formatted into an ATS-optimized version to improve readability and compatibility with employer systems."
      },
      {
        question: "Can I edit my profile after submitting applications?",
        answer: "Yes. You can update your profile and resume anytime. However, changes will not affect applications you have already submitted unless you reapply."
      },
      {
        question: "What does ATS-optimized resume mean?",
        answer: "ATS-optimized resumes are formatted to be easily read by Applicant Tracking Systems used by employers. This improves your chances of being properly ranked and noticed."
      }
    ]
  },
  {
    category: "Premium Features",
    items: [
      {
        question: "Is Premium worth it if I'm still looking for my first job?",
        answer: "Premium can help you stand out through better resume formatting, job matching, and visibility to employers. However, Free users can still apply for all jobs on the platform."
      },
      {
        question: "What is the skill match percentage I see in Premium?",
        answer: "It is an estimated score showing how well your profile matches a job posting based on your skills, experience, and qualifications."
      },
      {
        question: "What is ghost job detection?",
        answer: "Ghost job detection helps identify job postings that may be inactive or outdated so you avoid applying to positions that are no longer actively hiring."
      }
    ]
  },
  {
    category: "For Employers",
    items: [
      {
        question: "Why am I not getting enough applicants?",
        answer: "This may depend on job requirements, salary range, or visibility of your posting. Premium employers get higher visibility and better candidate matching tools."
      },
      {
        question: "How does candidate matching work?",
        answer: "KapIT analyzes applicant profiles based on skills and experience to rank candidates according to how well they match your job posting."
      },
      {
        question: "Can I edit a job post after publishing it?",
        answer: "Yes. You can update job details anytime, but changes may affect visibility or how applicants are matched."
      }
    ]
  },
  {
    category: "Account and Usage",
    items: [
      {
        question: "Can I delete my account if I no longer want to use KapIT?",
        answer: "Yes. You can request account deletion through your settings or by contacting support."
      },
      {
        question: "Is KapIT free to use forever?",
        answer: "Yes. The Free Plan will always be available. Premium features are optional upgrades."
      },
      {
        question: "Is my personal information shared with employers?",
        answer: "Only the information you include in your profile and applications is shared with employers. KapIT does not sell personal data."
      }
    ]
  }
];

export default function UserFaqModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 min-[420px]:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex w-full max-w-3xl flex-col bg-[#f8fbf6] dark:bg-[#0a1628] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#e5e7eb] dark:border-[#1e3a5f] p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#f0f4ec] dark:bg-[#1e3a5f]">
              <HelpCircle className="w-5 h-5 text-[#3a5a40] dark:text-[#3ba9d6]" />
            </div>
            <div>
              <h3 className="text-[19px] font-bold text-[#1c2b1f] dark:text-white">Frequently Asked Questions</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10">
            <X className="w-5 h-5 text-[#344e41] dark:text-white/80" />
          </button>
        </div>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8 custom-scrollbar">
          
          <div className="bg-[#f8fbf6] dark:bg-[#162842] border border-[#dce5d4] dark:border-[#1e3a5f] rounded-2xl p-5 sm:p-6 shadow-sm">
             <p className="text-[#344e41] dark:text-[#b8d4e8] leading-relaxed text-[15px]">
              KapIT is designed to make job searching and hiring more efficient, but it's normal to have questions along the way. This section provides answers to common concerns about using the platform, from setting up your profile and applying for jobs to understanding how matching and other tools work. Whether you are a job seeker or an employer, these FAQs are here to guide you in using KapIT more effectively.
             </p>
          </div>

          <div className="space-y-8">
            {FAQ_DATA.map((section, idx) => (
              <section key={idx} className="space-y-4">
                <h4 className="text-[17px] font-bold text-[#1c2b1f] border-b border-[#dce5d4] pb-2 dark:text-white dark:border-[#1e3a5f]">{section.category}</h4>
                <div className="space-y-5">
                  {section.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="space-y-1.5">
                      <h5 className="font-semibold text-[#3a5a40] dark:text-[#3ba9d6] text-[15px]">{item.question}</h5>
                      <p className="text-[#4b5563] dark:text-[#b8d4e8] leading-relaxed text-[14.5px]">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="bg-[#f0f4ec] dark:bg-[#1e3a5f] rounded-2xl p-5 sm:p-6 mt-8">
             <h4 className="text-[17px] font-bold text-[#1c2b1f] dark:text-white mb-2">Still need help?</h4>
             <p className="text-[#4b5563] dark:text-[#b8d4e8] leading-relaxed text-[14.5px]">
              If your question is not listed here, you may contact KapIT support through the official email or help center on the platform.
             </p>
          </div>

        </main>

      </div>
    </div>
  );
}
