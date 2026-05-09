import React, { useState } from 'react';
import { ArrowLeft, HelpCircle, Mail, MessageSquare, Clock3 } from 'lucide-react';

export default function HelpPage({ onBack }) {
  const [question, setQuestion] = useState('');

  return (
    <div className="min-h-screen bg-[#dad7cd] dark:bg-[#121416]">
      <header className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="py-3 sm:py-4">
          <div className="flex items-start justify-between gap-3 sm:items-center">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex w-fit shrink-0 items-center gap-2 px-1 py-1 text-sm font-semibold text-[#344e41] hover:text-[#3a5a40] dark:text-white dark:hover:text-[#d0d7dd] transition-colors"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span className="truncate">Back</span>
            </button>

            <div className="min-w-0 flex-1 text-right">
              <h1 className="text-lg font-semibold text-[#3a5a40] dark:text-white">Help</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-10">
        <div className="mx-auto w-full max-w-[min(100%,1100px)] bg-white dark:bg-[#22272b] border border-[#a3b18a] dark:border-[#353c44] rounded-2xl p-4 sm:p-8 shadow-[0_18px_45px_rgba(16,42,27,0.08)] dark:shadow-[0_18px_45px_rgba(0,0,0,0.28)]">
          <div className="flex items-start gap-3 mb-4 sm:mb-5">
            <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#588157] dark:text-[#6f9b74]" />
            <h2 className="min-w-0 text-lg sm:text-xl font-bold text-[#3a5a40] dark:text-white">Need Help?</h2>
          </div>

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 mb-5 sm:mb-6">
            <InfoCard
              icon={Mail}
              title="Email Support"
              text="Use support@kapit.dev for account, hiring, and onboarding concerns."
            />
            <InfoCard
              icon={Clock3}
              title="Response Time"
              text="Most questions are reviewed within 1 to 2 business days."
            />
            <InfoCard
              icon={MessageSquare}
              title="Best Details"
              text="Include your account type, issue, and what device you are using."
            />
          </div>

          <label className="block text-sm font-medium text-[#3a5a40] dark:text-white mb-2.5">
            Need help question
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your question here..."
            rows={6}
            className="w-full min-h-[170px] sm:min-h-[180px] rounded-xl border border-[#a3b18a] dark:border-[#444d57] bg-[#f5f5f2] dark:bg-[#353c44] text-[#344e41] dark:text-white placeholder-[#3a5a40] dark:placeholder-[#adb5be] px-4 py-3 text-sm sm:text-base outline-none focus:ring-2 focus:ring-[#588157] dark:focus:ring-[#6f9b74] resize-y"
          />

          <div className="mt-4 flex justify-stretch sm:justify-end">
            <button
              type="button"
              className="w-full sm:w-auto px-5 py-3 rounded-xl font-semibold bg-[#588157] hover:bg-[#3a5a40] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86] text-white transition-colors"
            >
              Submit
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function InfoCard({ icon: Icon, title, text }) {
  return (
    <div className="p-3.5 sm:p-4 min-h-[124px] sm:min-h-[156px]">
      <div className="mb-2 flex h-9 w-9 items-center justify-center">
        <Icon className="h-4 w-4 text-[#588157] dark:text-[#6f9b74]" />
      </div>
      <h3 className="text-sm font-semibold text-[#3a5a40] dark:text-white">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-[#5f6f52] dark:text-[#d0d7dd]">{text}</p>
    </div>
  );
}



