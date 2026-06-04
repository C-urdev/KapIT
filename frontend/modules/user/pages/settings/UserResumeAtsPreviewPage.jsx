import React, { useEffect, useRef } from 'react';
import { ArrowLeft, Download, Loader2, Wand2 } from 'lucide-react';

const isPdf = (contentType, fileName = '') => (
  String(contentType || '').toLowerCase().includes('pdf') || String(fileName || '').toLowerCase().endsWith('.pdf')
);

const toList = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

const clean = (value) => String(value || '').trim();

function SectionTitle({ children }) {
  return <h3 className="mt-4 border-b border-[#d7e1d0] pb-1 text-xs font-bold uppercase tracking-[0.12em] text-[#44614b] dark:border-[#30373f] dark:text-[#c5d1db]">{children}</h3>;
}

export default function UserResumeAtsPreviewPage({
  onBack,
  resumeUrl,
  fileName,
  contentType,
  extractedTextPreview,
  user,
  optimized,
  optimizedDocxUrl,
  optimizedPdfUrl,
  optimizing = false,
  optimizeError = '',
  onOptimize,
  onUseOptimizedResume,
  applyingOptimizedResume = false,
  applyOptimizedError = '',
}) {
  const originalScrollRef = useRef(null);
  const atsScrollRef = useRef(null);
  const canPreviewInline = isPdf(contentType, fileName);
  const originalText = String(extractedTextPreview || '').replace(/\r/g, '');
  const displayName = String(fileName || 'Uploaded resume').trim();
  const ats = optimized || {};
  const experience = toList(ats.experience);
  const projects = toList(ats.projects);
  const education = toList(ats.education);
  const certifications = toList(ats.certifications);
  const skills = toList(ats.skills);
  const hasOptimizedArtifact = Boolean(optimizedPdfUrl || optimizedDocxUrl);

  useEffect(() => {
    if (originalScrollRef.current) originalScrollRef.current.scrollTop = 0;
    if (atsScrollRef.current) atsScrollRef.current.scrollTop = 0;
  }, [resumeUrl, extractedTextPreview, optimized]);

  return (
    <div className="mx-auto flex h-[calc(100dvh-72px)] min-h-0 w-full max-w-[min(100%,1500px)] flex-col overflow-hidden px-4 py-3 sm:px-5 sm:py-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#9caf97] bg-[#d9ddcf] text-[#344e41] transition-colors hover:border-[#8ea488] hover:bg-[#dde2d4] dark:border-[#5e8b67] dark:bg-transparent dark:text-white dark:hover:bg-[#353c44]"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[28px] font-bold text-[#1c2b1f] dark:text-white">ATS Resume Preview</h1>
        <button
          type="button"
          onClick={onOptimize}
          disabled={optimizing}
          className="inline-flex items-center gap-2 rounded-lg bg-[#3a5a40] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-[#6f9b74]"
        >
          {optimizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {optimizing ? 'Optimizing...' : 'Optimize to ATS Resume'}
        </button>
      </div>
      <p className="mt-1 text-sm text-[#5f6f52] dark:text-[#d0d7dd]">Uploaded file: {displayName}</p>
      {optimizeError ? <p className="mt-2 text-xs text-red-600 dark:text-red-400">{optimizeError}</p> : null}
      {applyOptimizedError ? <p className="mt-2 text-xs text-red-600 dark:text-red-400">{applyOptimizedError}</p> : null}

      <div className="mt-4 grid min-h-0 flex-1 grid-cols-1 gap-5 xl:grid-cols-2">
        <section className="flex h-full min-h-0 flex-col rounded-2xl border border-[#dce5d4] bg-[#f8fbf6] p-4 dark:border-[#353c44] dark:bg-[#121416]">
          <h2 className="mb-3 text-base font-bold text-[#1c2b1f] dark:text-white">Original Resume</h2>
          <div className="min-h-0 flex flex-1 flex-col text-sm text-[#344e41] dark:text-[#d0d7dd]">
            <p className="mb-2 font-semibold">Extracted Resume Content</p>
            <pre ref={originalScrollRef} className={`${canPreviewInline ? 'h-[40%]' : 'h-full'} min-h-0 flex-1 overflow-y-scroll whitespace-pre-wrap break-words rounded-xl border border-[#dce5d4] bg-white/70 p-4 text-[14.67px] leading-[1.15] text-[#1f2937] dark:border-[#353c44] dark:bg-[#1a1f24] dark:text-[#e5e7eb] [font-family:Calibri,Arial,Helvetica,sans-serif] [tab-size:4] [scrollbar-gutter:stable] [scrollbar-width:auto] [scrollbar-color:#7f8ea3_#0f1620] [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar-track]:bg-[#0f1620] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#7f8ea3] dark:[scrollbar-color:#8ea0b7_#0f1620] dark:[&::-webkit-scrollbar-track]:bg-[#0f1620] dark:[&::-webkit-scrollbar-thumb]:bg-[#8ea0b7]`}>
              {originalText || 'Extracted text is not available for this file yet.'}
            </pre>
            {canPreviewInline && resumeUrl ? (
              <>
                <p className="mb-2 mt-3 font-semibold">Original File Preview</p>
                <iframe title="Original Resume" src={resumeUrl} className="h-[calc(60%-16px)] min-h-[220px] w-full rounded-xl border border-[#dce5d4] dark:border-[#353c44]" />
              </>
            ) : null}
          </div>
        </section>

        <section className="flex h-full min-h-0 flex-col rounded-2xl border border-[#dce5d4] bg-[#f8fbf6] p-4 dark:border-[#353c44] dark:bg-[#121416]">
          <div className="mb-1 flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-[#1c2b1f] dark:text-white">ATS Optimized Resume</h2>
            <div className="flex flex-wrap gap-2">
              {optimizedDocxUrl ? (
                <a href={optimizedDocxUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-[#a3b18a] px-3 py-2 text-xs font-semibold text-[#3a5a40] hover:bg-[#eef6ee] dark:border-[#444d57] dark:text-white dark:hover:bg-[#2a2f35]">
                  <Download className="h-3.5 w-3.5" />
                  Download ATS DOCX
                </a>
              ) : null}
              {optimizedPdfUrl ? (
                <a href={optimizedPdfUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-[#a3b18a] px-3 py-2 text-xs font-semibold text-[#3a5a40] hover:bg-[#eef6ee] dark:border-[#444d57] dark:text-white dark:hover:bg-[#2a2f35]">
                  <Download className="h-3.5 w-3.5" />
                  Download ATS PDF
                </a>
              ) : null}
              {hasOptimizedArtifact ? (
                <button
                  type="button"
                  onClick={onUseOptimizedResume}
                  disabled={applyingOptimizedResume}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#3a5a40] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60 dark:bg-[#6f9b74]"
                >
                  {applyingOptimizedResume ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  {applyingOptimizedResume ? 'Saving...' : 'Done - Use ATS Resume'}
                </button>
              ) : null}
            </div>
          </div>
          <p className="mb-3 text-xs text-[#5f6f52] dark:text-[#b9c3cc]">
            {optimized ? 'Professional ATS format from your uploaded resume.' : 'Run optimization to generate your recruiter-ready ATS resume.'}
          </p>
          <div ref={atsScrollRef} className="min-h-0 flex-1 overflow-y-scroll rounded-xl border border-[#dce5d4] bg-white p-4 pr-2 dark:border-[#353c44] dark:bg-[#1a1f24] [scrollbar-gutter:stable] [scrollbar-width:auto] [scrollbar-color:#7f8ea3_#0f1620] [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar-track]:bg-[#0f1620] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#7f8ea3] dark:[scrollbar-color:#8ea0b7_#0f1620] dark:[&::-webkit-scrollbar-track]:bg-[#0f1620] dark:[&::-webkit-scrollbar-thumb]:bg-[#8ea0b7]">
            <h3 className="text-xl font-bold text-[#18261d] dark:text-white">{clean(ats.full_name) || clean(user?.fullName || user?.name) || 'Your Name'}</h3>
            <p className="mt-1 text-sm text-[#44614b] dark:text-[#c5d1db]">{clean(ats.headline) || 'Professional Headline'}</p>
            <p className="mt-1 text-xs text-[#5d7364] dark:text-[#9fb0be]">
              {[clean(ats.email), clean(ats.phone), clean(ats.linkedin), clean(ats.portfolio), clean(ats.location)].filter(Boolean).join(' | ') || 'Email | Phone | LinkedIn | Portfolio'}
            </p>

            <SectionTitle>Professional Summary</SectionTitle>
            <p className="mt-2 text-sm leading-6 text-[#273730] dark:text-[#dbe4ea]">{clean(ats.professional_summary || ats.summary) || 'No summary generated yet.'}</p>

            <SectionTitle>Skills</SectionTitle>
            <p className="mt-2 text-sm leading-6 text-[#273730] dark:text-[#dbe4ea]">{skills.length ? skills.join(' | ') : 'No skills generated yet.'}</p>

            <SectionTitle>Experience</SectionTitle>
            {experience.length ? experience.map((item, idx) => (
              <div key={`exp-${idx}`} className="mt-3">
                <p className="text-sm text-[#273730] dark:text-[#dbe4ea]">{[clean(item.job_title), clean(item.company)].filter(Boolean).join(' - ') || 'Role - Company'}</p>
                <p className="text-xs text-[#5d7364] dark:text-[#9fb0be]">{[clean(item.location), [clean(item.start_date), clean(item.end_date)].filter(Boolean).join(' - ')].filter(Boolean).join(' | ')}</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[#273730] dark:text-[#dbe4ea]">
                  {toList(item.bullets).map((bullet, bulletIndex) => <li key={`exp-b-${idx}-${bulletIndex}`}>{bullet}</li>)}
                </ul>
              </div>
            )) : <p className="mt-2 text-sm text-[#5d7364] dark:text-[#9fb0be]">No experience generated yet.</p>}

            <SectionTitle>Projects</SectionTitle>
            {projects.length ? projects.map((item, idx) => (
              <div key={`prj-${idx}`} className="mt-3">
                <p className="text-sm text-[#273730] dark:text-[#dbe4ea]">{[clean(item.name), clean(item.role)].filter(Boolean).join(' - ') || 'Project - Role'}</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[#273730] dark:text-[#dbe4ea]">
                  {toList(item.bullets).map((bullet, bulletIndex) => <li key={`prj-b-${idx}-${bulletIndex}`}>{bullet}</li>)}
                </ul>
              </div>
            )) : <p className="mt-2 text-sm text-[#5d7364] dark:text-[#9fb0be]">No projects generated yet.</p>}

            <SectionTitle>Education</SectionTitle>
            {education.length ? education.map((item, idx) => (
              <p key={`edu-${idx}`} className="mt-2 text-sm text-[#273730] dark:text-[#dbe4ea]">
                {[clean(item.degree), clean(item.school)].filter(Boolean).join(' - ')}{clean(item.year) ? ` (${clean(item.year)})` : ''}
              </p>
            )) : <p className="mt-2 text-sm text-[#5d7364] dark:text-[#9fb0be]">No education generated yet.</p>}

            <SectionTitle>Certifications</SectionTitle>
            {certifications.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#273730] dark:text-[#dbe4ea]">
                {certifications.map((item, idx) => <li key={`cert-${idx}`}>{item}</li>)}
              </ul>
            ) : <p className="mt-2 text-sm text-[#5d7364] dark:text-[#9fb0be]">No certifications generated yet.</p>}

          </div>
        </section>
      </div>
    </div>
  );
}
