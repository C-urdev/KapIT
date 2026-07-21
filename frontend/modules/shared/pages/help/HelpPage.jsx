import React, { useState } from 'react';
import { ArrowLeft, Clock3, HelpCircle, Mail, MessageSquare, Send } from 'lucide-react';

export default function HelpPage({ onBack }) {
  const [question, setQuestion] = useState('');

  return (
    <div className="mx-auto w-full max-w-[min(100%,1040px)] py-3 xl:py-6">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--user-border)] bg-[var(--user-surface)] px-3.5 text-sm font-semibold text-[var(--user-text)] transition-[background-color,border-color,color,transform] duration-150 hover:border-[var(--user-primary)]/40 hover:bg-[var(--user-surface-selected)] hover:text-[var(--user-primary)] active:scale-[0.98]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <section className="user-desktop-flat-surface overflow-hidden rounded-[24px] border border-[var(--user-border)] bg-[var(--user-surface)]">
        <div className="px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--user-text-strong)] sm:text-3xl">Help</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--user-text-muted)]">
                Find answers and contact the KapIT support team.
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--user-primary-soft)] text-[var(--user-primary)]">
              <HelpCircle className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="space-y-6 px-6 pb-6 sm:px-8">
          <div className="grid gap-3 md:grid-cols-3">
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

          <div>
            <label htmlFor="user-help-question" className="text-sm font-semibold text-[var(--user-text-strong)]">
              Need help question
            </label>
            <textarea
              id="user-help-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Type your question here..."
              rows={7}
              className="mt-3 w-full resize-none rounded-2xl border border-[var(--user-border)] bg-[var(--user-surface-subtle)] px-4 py-3 text-sm leading-6 text-[var(--user-text-strong)] outline-none transition-[background-color,border-color,box-shadow] duration-150 placeholder:text-[var(--user-text-muted)] focus:border-[var(--user-primary)] focus:bg-[var(--user-surface)] focus:ring-2 focus:ring-[var(--user-primary-soft)]"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={!question.trim()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--user-primary)] px-5 text-sm font-semibold text-white transition-[background-color,box-shadow,opacity,transform] duration-150 hover:bg-[var(--user-primary-hover)] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
            >
              <Send className="h-4 w-4" />
              Submit
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoCard({ icon: Icon, title, text }) {
  return (
    <div className="min-h-[112px] rounded-2xl border border-[var(--user-border)] bg-[var(--user-surface-subtle)] p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--user-primary-soft)] text-[var(--user-primary)]">
        <Icon className="h-4 w-4" />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-[var(--user-text-strong)]">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-[var(--user-text-muted)]">{text}</p>
    </div>
  );
}
