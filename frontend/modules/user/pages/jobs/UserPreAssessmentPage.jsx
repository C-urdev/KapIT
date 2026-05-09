import React, { useId, useState } from 'react';
import { ArrowLeft, ClipboardList } from 'lucide-react';

const DESIGN_ANALYSIS_QUESTIONS = [
  {
    title: '1. First Impression',
    prompt: 'When you first look at this screen, what stands out to you the most and how does it affect your overall impression of the app?',
  },
  {
    title: '2. Usability Issues',
    prompt: 'What usability problems do you notice in this design? Identify at least two issues and explain how they could negatively affect user experience.',
  },
  {
    title: '3. Visual Hierarchy',
    prompt: 'Do you think the design clearly guides the user\'s attention? If not, what changes would you make to improve the visual hierarchy?',
  },
  {
    title: '4. Clutter and Cognitive Load',
    prompt: 'This screen contains a lot of elements. How would you simplify or reorganize the content to make it easier for users to scan and understand?',
  },
  {
    title: '5. Call-to-Action (Buttons)',
    prompt: 'Are the main actions (like "Order" or "Search") clear and effective? What would you change to make them more noticeable and intuitive?',
  },
  {
    title: '6. Mobile Usability',
    prompt: 'Considering this is a mobile interface, how well does this design support one-handed use? What would you improve?',
  },
  {
    title: '7. Readability',
    prompt: 'How would you improve the readability of the text and information shown on this screen? Think about font size, spacing, and grouping.',
  },
  {
    title: '8. Consistency',
    prompt: 'Do you notice any inconsistencies in colors, icons, or layout? How might this affect the user\'s trust or experience?',
  },
  {
    title: '9. User Decision-Making',
    prompt: 'If you were a user trying to order food, what would make it difficult to decide or take action on this screen?',
  },
  {
    title: '10. Prioritization',
    prompt: 'If you could only fix one thing in this design, what would it be and why?',
  },
];

export default function UserPreAssessmentPage({ job, onBack }) {
  const jobTitle = String(job?.title || '').trim();
  const designUploadId = useId();
  const [selectedDesignName, setSelectedDesignName] = useState('');

  return (
    <div className="mx-auto w-full max-w-[min(100%,1180px)] space-y-5 pb-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#a3b18a] text-[#344e41] transition-colors hover:bg-[#f1f5eb] dark:border-[#444d57] dark:text-white dark:hover:bg-[#353c44]"
          aria-label="Back to job detail"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-0">
        <section className="rounded-t-[20px] rounded-b-none border border-b-0 border-[#a3b18a] bg-[#f8fbf6] p-5 shadow-sm dark:border-[#353c44] dark:bg-[#22272b] sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="inline-flex items-center gap-2 rounded-full bg-[#eef6ee] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#3a5a40] dark:bg-[#2a2f35] dark:text-[#e2e6e9]">
                <ClipboardList className="h-3.5 w-3.5" />
                Pre-Assessment
              </p>
              <h1 className="text-2xl font-extrabold text-[#1f3a2b] dark:text-white sm:text-3xl">UI/UX Design Assessment</h1>
              {jobTitle ? <p className="text-sm text-[#3a5a40] dark:text-[#d0d7dd]">For role: {jobTitle}</p> : null}
            </div>
            <p className="rounded-full border border-[#bfd0af] bg-[#eef6ee] px-3 py-1.5 text-xs font-semibold text-[#3a5a40] dark:border-[#444d57] dark:bg-[#2a2f35] dark:text-[#eceff2]">
              Estimated time: 20-30 minutes
            </p>
          </div>

          <p className="mt-5 text-sm leading-7 text-[#344e41] dark:text-[#d0d7dd]">
            Instructions: Please answer all questions thoughtfully. Focus on your reasoning and design decisions.
            We are more interested in how you think as a designer than just your final output.
          </p>

          <div className="mt-5 flex justify-center">
            <div className="w-full max-w-[280px] overflow-hidden rounded-2xl border border-[#bfd0af] bg-white dark:border-[#49545f] dark:bg-[#161a1f]">
              <img
                src="/bad-mobile-design-picture.png"
                alt="Bad mobile design reference for pre-assessment"
                className="h-auto w-full object-contain"
                loading="lazy"
              />
            </div>
          </div>

        </section>

        <section className="space-y-4 rounded-b-[20px] rounded-t-none border border-t-0 border-[#a3b18a] bg-[#f8fbf6] p-5 shadow-sm dark:border-[#353c44] dark:bg-[#22272b] sm:p-7">
          <h2 className="text-2xl font-extrabold text-[#1f3a2b] dark:text-white">PART I. DESIGN ANALYSIS</h2>
          {DESIGN_ANALYSIS_QUESTIONS.map((item) => (
            <article
              key={item.title}
              className="pb-4 last:pb-0"
            >
              <h3 className="text-xl font-bold text-[#223c2e] dark:text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-[#344e41] dark:text-[#d0d7dd]">{item.prompt}</p>
              <textarea
                className="mt-3 min-h-[116px] w-full rounded-xl border border-[#bfd0af] bg-white px-3 py-2.5 text-sm text-[#243c2e] outline-none transition focus:border-[#588157] focus:ring-2 focus:ring-[#588157]/25 dark:border-[#49545f] dark:bg-[#161a1f] dark:text-[#eceff2] dark:focus:border-[#6f9b74] dark:focus:ring-[#6f9b74]/25"
                placeholder="Write your answer here..."
              />
            </article>
          ))}
        </section>
      </div>

      <section className="space-y-4 rounded-[20px] border border-[#a3b18a] bg-[#f8fbf6] p-5 shadow-sm dark:border-[#353c44] dark:bg-[#22272b] sm:p-7">
        <h2 className="text-2xl font-extrabold text-[#1f3a2b] dark:text-white">PART II. REDESIGN TASK</h2>
        <div className="space-y-4 text-sm leading-7 text-[#344e41] dark:text-[#d0d7dd]">
          <p>
            <span className="font-bold text-[#223c2e] dark:text-white">Task:</span>{' '}
            Using the design shown above, create an improved version of this mobile interface.
          </p>
          <p>
            <span className="font-bold text-[#223c2e] dark:text-white">Your redesign should:</span>{' '}
            Improve clarity and readability, reduce visual clutter, enhance visual hierarchy, make actions more intuitive,
            and follow mobile UX best practices.
          </p>
          <p>
            <span className="font-bold text-[#223c2e] dark:text-white">Submission requirements:</span>{' '}
            Figma link or exported image (PNG/JPG). Optional: short explanation of your design decisions (2-3 sentences).
          </p>
        </div>

        <div className="space-y-3 pt-1">
          <div>
            <input
              id={designUploadId}
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.pdf"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setSelectedDesignName(file?.name || '');
              }}
            />
            <div className="flex justify-end">
              <label
                htmlFor={designUploadId}
                className="inline-flex cursor-pointer items-center rounded-xl border border-[#bfd0af] bg-white px-4 py-2.5 text-sm font-semibold text-[#243c2e] transition hover:bg-[#f4f8ef] dark:border-[#49545f] dark:bg-[#161a1f] dark:text-[#eceff2] dark:hover:bg-[#1f252d]"
              >
                Upload Design
              </label>
            </div>
            {selectedDesignName ? <p className="mt-2 text-xs text-[#3a5a40] dark:text-[#d0d7dd]">Selected file: {selectedDesignName}</p> : null}
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#5f6f52] dark:text-[#a8b1ba]">
              Short Description
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-[#bfd0af] bg-white px-3 py-2.5 text-sm text-[#243c2e] outline-none transition focus:border-[#588157] focus:ring-2 focus:ring-[#588157]/25 dark:border-[#49545f] dark:bg-[#161a1f] dark:text-[#eceff2] dark:focus:border-[#6f9b74] dark:focus:ring-[#6f9b74]/25"
              placeholder="Example: I simplified the hero and made CTA buttons clearer."
            />
          </div>
        </div>
      </section>

      <section className="rounded-[20px] border border-[#a3b18a] bg-[#f8fbf6] p-5 shadow-sm dark:border-[#353c44] dark:bg-[#22272b] sm:p-7">
        <h2 className="text-2xl font-extrabold text-[#1f3a2b] dark:text-white">EVALUATION CRITERIA</h2>
        <ul className="mt-3 list-disc space-y-1 pl-6 text-sm leading-7 text-[#344e41] marker:text-[#3a5a40] dark:text-[#d0d7dd] dark:marker:text-[#82ad86]">
          <li>Clarity of design thinking</li>
          <li>Ability to identify usability issues</li>
          <li>Quality of redesign solution</li>
          <li>Visual hierarchy and layout improvements</li>
          <li>Overall user experience enhancement</li>
        </ul>
      </section>
    </div>
  );
}
