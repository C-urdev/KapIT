import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock3, HelpCircle, Mail, MessageSquare, Send } from 'lucide-react';

const SUPPORT_EMAIL = 'support@kapit.dev';

export default function HelpPage({ onBack }) {
  const [question, setQuestion] = useState('');
  const normalizedQuestion = question.trim();

  const handleSubmit = () => {
    if (!normalizedQuestion || typeof window === 'undefined') return;

    const subject = encodeURIComponent('KapIT support request');
    const body = encodeURIComponent(normalizedQuestion);
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="help-workspace-page mx-auto w-full max-w-[min(100%,1120px)] py-3 xl:mx-0 xl:py-0">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="help-workspace-back-button inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.98]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="help-workspace-title mt-5">Help</h1>
        </div>
        <div className="help-workspace-status flex items-center gap-2 rounded-md px-3 py-2 text-sm">
          <Clock3 className="h-4 w-4" />
          Usually reviewed in 1 to 2 business days
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <InfoCard icon={Mail} title="Email support" text={SUPPORT_EMAIL} />
            <InfoCard icon={MessageSquare} title="Best context" text="Account type, issue, and device" />
            <InfoCard icon={HelpCircle} title="Hiring help" text="Jobs, applicants, billing, profiles" />
          </div>

          <div className="help-workspace-composer rounded-lg p-5 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <label htmlFor="user-help-question" className="help-workspace-section-title text-base font-semibold">
                  Send a support request
                </label>
                <p className="help-workspace-copy mt-1 text-sm leading-6">
                  Write the issue once and we will open it in your email app.
                </p>
              </div>
              <span className="help-workspace-count text-xs tabular-nums">{normalizedQuestion.length} chars</span>
            </div>
            <textarea
              id="user-help-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Describe what happened, what page you were on, and what you expected..."
              rows={9}
              className="help-workspace-textarea mt-4 w-full resize-none rounded-md px-4 py-3 text-sm leading-6 outline-none transition-[background-color,border-color,box-shadow] duration-150"
            />
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="help-workspace-copy text-xs leading-5">
                Do not include passwords or private payment details.
              </p>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!normalizedQuestion}
                className="help-workspace-submit inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-[background-color,border-color,color,opacity,transform] duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                Submit
              </button>
            </div>
          </div>
        </div>

        <aside className="help-workspace-rail rounded-lg p-5">
          <h2 className="help-workspace-section-title text-sm font-semibold">Before you send</h2>
          <div className="mt-4 space-y-3">
            <ChecklistItem text="Company account name" />
            <ChecklistItem text="Page or workflow affected" />
            <ChecklistItem text="Screenshot or error text" />
            <ChecklistItem text="Browser and device used" />
          </div>
        </aside>
      </section>
    </div>
  );
}

function InfoCard({ icon: Icon, title, text }) {
  return (
    <div className="help-workspace-info-card min-h-[116px] rounded-lg p-4 transition-[background-color,border-color,transform] duration-150">
      <span className="help-workspace-icon flex h-9 w-9 items-center justify-center rounded-md">
        <Icon className="h-4 w-4" />
      </span>
      <h3 className="help-workspace-section-title mt-3 text-sm font-semibold">{title}</h3>
      <p className="help-workspace-copy mt-1 text-xs leading-5">{text}</p>
    </div>
  );
}

function ChecklistItem({ text }) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{text}</span>
    </div>
  );
}
