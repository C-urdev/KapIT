import React, { useState } from 'react';
import { ArrowLeft, HelpCircle } from 'lucide-react';

export default function HelpPage({ onBack }) {
  const [question, setQuestion] = useState('');

  return (
    <div className="min-h-screen bg-[#dad7cd] dark:bg-[#0a1628]">
      <header className="sticky top-0 z-40 bg-white dark:bg-[#0a1628] border-b border-[#a3b18a] dark:border-[#1e3a5f] shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <h1 className="text-lg font-semibold text-[#3a5a40] dark:text-white">Help</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#f5f5f2] dark:bg-[#1e3a5f] flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-[#588157] dark:text-[#3ba9d6]" />
            </div>
            <h2 className="text-xl font-bold text-[#3a5a40] dark:text-white">Need Help?</h2>
          </div>

          <p className="text-sm text-[#344e41] dark:text-[#b8d4e8] mb-4">
            Tell us your question and we will get back to you.
          </p>

          <label className="block text-sm font-medium text-[#3a5a40] dark:text-white mb-2">
            Need help question
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your question here..."
            rows={6}
            className="w-full rounded-lg border border-[#a3b18a] dark:border-[#2a4a6f] bg-[#f5f5f2] dark:bg-[#1e3a5f] text-[#344e41] dark:text-white placeholder-[#3a5a40] dark:placeholder-[#7d9ab8] px-4 py-3 outline-none focus:ring-2 focus:ring-[#588157] dark:focus:ring-[#3ba9d6]"
          />

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="px-5 py-2.5 rounded-lg font-semibold bg-[#588157] hover:bg-[#3a5a40] dark:bg-[#3ba9d6] dark:hover:bg-[#2d8bb8] text-white transition-colors"
            >
              Submit
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}



