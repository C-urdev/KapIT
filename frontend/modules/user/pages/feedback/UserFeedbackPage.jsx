import React, { useState } from 'react';
import { ArrowLeft, Bug, Lightbulb, MessageSquare, Send, SmilePlus } from 'lucide-react';

const FEEDBACK_TYPES = [
  {
    id: 'experience',
    label: 'Experience',
    icon: SmilePlus,
    description: 'Tell us what feels confusing, slow, or delightful.',
  },
  {
    id: 'idea',
    label: 'Idea',
    icon: Lightbulb,
    description: 'Suggest a feature that would make KapIT more useful.',
  },
  {
    id: 'bug',
    label: 'Bug',
    icon: Bug,
    description: 'Report something that broke or behaved unexpectedly.',
  },
];

export default function UserFeedbackPage({ user, onBack }) {
  const [feedbackType, setFeedbackType] = useState('experience');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const displayName = user?.fullName || user?.name || user?.username || 'there';
  const selectedType = FEEDBACK_TYPES.find((type) => type.id === feedbackType) || FEEDBACK_TYPES[0];

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!message.trim()) {
      return;
    }

    setSubmitted(true);
    setMessage('');
  };

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
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--user-text-strong)] sm:text-3xl">Share feedback</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--user-text-muted)]">
                Hi {displayName}, tell us what would make the dashboard easier, clearer, or more helpful for your career workflow.
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--user-primary-soft)] text-[var(--user-primary)]">
              <MessageSquare className="h-5 w-5" />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6 sm:px-8">
          <div>
            <label className="text-sm font-semibold text-[var(--user-text-strong)]">What kind of feedback is this?</label>
            <div className="mt-3 grid gap-3 xl:grid-cols-3">
              {FEEDBACK_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = feedbackType === type.id;

                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFeedbackType(type.id)}
                    className={`min-h-[112px] rounded-2xl border p-4 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 active:scale-[0.99] ${
                      isSelected
                        ? 'border-[var(--user-primary)] bg-[var(--user-surface-selected)] shadow-[0_14px_34px_rgba(58,90,64,0.08)]'
                        : 'border-[var(--user-border)] bg-[var(--user-surface-subtle)] hover:border-[var(--user-primary)]/35 hover:bg-[var(--user-surface)]'
                    }`}
                    aria-pressed={isSelected}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--user-primary-soft)] text-[var(--user-primary)]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="mt-3 block text-sm font-semibold text-[var(--user-text-strong)]">{type.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-[var(--user-text-muted)]">{type.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="user-feedback-message" className="text-sm font-semibold text-[var(--user-text-strong)]">
              Your note
            </label>
            <p className="mt-1 text-xs text-[var(--user-text-muted)]">{selectedType.description}</p>
            <textarea
              id="user-feedback-message"
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                setSubmitted(false);
              }}
              rows={7}
              placeholder="Write your feedback here..."
              className="mt-3 w-full resize-none rounded-2xl border border-[var(--user-border)] bg-[var(--user-surface-subtle)] px-4 py-3 text-sm leading-6 text-[var(--user-text-strong)] outline-none transition-[background-color,border-color,box-shadow] duration-150 placeholder:text-[var(--user-text-muted)] focus:border-[var(--user-primary)] focus:bg-[var(--user-surface)] focus:ring-2 focus:ring-[var(--user-primary-soft)]"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-[var(--user-text-muted)]">
              Your note helps us tune the dashboard around the way you actually use it.
            </p>
            <button
              type="submit"
              disabled={!message.trim()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--user-primary)] px-5 text-sm font-semibold text-white transition-[background-color,box-shadow,opacity,transform] duration-150 hover:bg-[var(--user-primary-hover)] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
            >
              <Send className="h-4 w-4" />
              Send feedback
            </button>
          </div>

          {submitted ? (
            <div className="rounded-2xl border border-[var(--user-primary)]/25 bg-[var(--user-surface-selected)] px-4 py-3 text-sm font-medium text-[var(--user-primary)]">
              Thanks for the feedback. We'll review it soon.
            </div>
          ) : null}
        </form>
      </section>
    </div>
  );
}
