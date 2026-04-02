import React, { useState } from 'react';
import { ArrowLeft, HelpCircle, Mail, MessageSquare, Clock3 } from 'lucide-react';

export default function HelpPage({ onBack }) {
  const [question, setQuestion] = useState('');

  return (
    <div className="min-h-screen bg-[#dad7cd] dark:bg-[#0a1628]">
      <header className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="py-3 sm:py-4">
          <div className="flex items-start justify-between gap-3 sm:items-center">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex w-fit shrink-0 items-center gap-2 rounded-xl border border-[#a3b18a] bg-white px-3 py-2 text-sm font-semibold text-[#344e41] shadow-sm hover:bg-[#f8f7f2] dark:border-[#2a4a6f] dark:bg-[#162842] dark:text-white dark:hover:bg-[#1e3a5f] transition-colors"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span className="truncate">Back</span>
            </button>

            <div className="min-w-0 flex-1 text-right">
              <h1 className="text-lg font-semibold text-[#3a5a40] dark:text-white">Help</h1>
              <p className="text-[11px] leading-tight text-[#5f6f52] dark:text-[#9fb3c8] sm:text-xs">
                Support for account and platform questions
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-10">
        <div className="mx-auto w-full max-w-[860px] bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-2xl p-4 sm:p-8 shadow-[0_18px_45px_rgba(16,42,27,0.08)] dark:shadow-[0_18px_45px_rgba(0,0,0,0.28)]">
          <div className="flex items-start gap-3 mb-4 sm:mb-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f5f5f2] dark:bg-[#1e3a5f]">
              <HelpCircle className="w-5 h-5 text-[#588157] dark:text-[#3ba9d6]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-[#3a5a40] dark:text-white">Need Help?</h2>
              <p className="mt-1 text-sm leading-relaxed text-[#344e41] dark:text-[#b8d4e8]">
                Tell us your concern and we will guide you as soon as possible.
              </p>
            </div>
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
            className="w-full min-h-[170px] sm:min-h-[180px] rounded-xl border border-[#a3b18a] dark:border-[#2a4a6f] bg-[#f5f5f2] dark:bg-[#1e3a5f] text-[#344e41] dark:text-white placeholder-[#3a5a40] dark:placeholder-[#7d9ab8] px-4 py-3 text-sm sm:text-base outline-none focus:ring-2 focus:ring-[#588157] dark:focus:ring-[#3ba9d6] resize-y"
          />

          <div className="mt-4 flex justify-stretch sm:justify-end">
            <button
              type="button"
              className="w-full sm:w-auto px-5 py-3 rounded-xl font-semibold bg-[#588157] hover:bg-[#3a5a40] dark:bg-[#3ba9d6] dark:hover:bg-[#2d8bb8] text-white transition-colors"
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
    <div className="rounded-2xl border border-[#d7d2c4] dark:border-[#2a4a6f] bg-[#f8f7f2] dark:bg-[#102235] p-3.5 sm:p-4 min-h-[124px] sm:min-h-[156px]">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-[#16304a]">
        <Icon className="h-4 w-4 text-[#588157] dark:text-[#3ba9d6]" />
      </div>
      <h3 className="text-sm font-semibold text-[#3a5a40] dark:text-white">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-[#5f6f52] dark:text-[#b8d4e8]">{text}</p>
    </div>
  );
}



