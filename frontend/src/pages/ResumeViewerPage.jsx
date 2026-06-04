import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { resumeService } from '@sharedServices/resumeService';

const Section = ({ title, children }) => (
  <section className="rounded-2xl border border-[#d9e2d0] bg-white p-4 shadow-sm">
    <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#2f4f2f]">{title}</h2>
    {children}
  </section>
);

export default function ResumeViewerPage() {
  const { resumeId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resume, setResume] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');
    resumeService.getResume(resumeId)
      .then((payload) => {
        if (!mounted) return;
        setResume(payload?.resume || null);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(String(err?.message || 'Failed to load resume.'));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [resumeId]);

  const atsData = useMemo(() => resume?.ats_data_json || {}, [resume]);
  const summary = String(atsData.professional_summary || atsData.summary || '');
  const experience = Array.isArray(atsData.experience) ? atsData.experience : [];
  const isAts = resume?.resume_type === 'ats_optimized';

  if (loading) {
    return <div className="mx-auto max-w-5xl p-6"><div className="h-8 w-56 animate-pulse rounded bg-[#e6eee0]" /><div className="mt-4 h-[60vh] animate-pulse rounded-2xl bg-[#eef4ea]" /></div>;
  }
  if (error) {
    return <div className="mx-auto max-w-4xl p-6 text-red-700">{error}</div>;
  }
  if (!resume) {
    return <div className="mx-auto max-w-4xl p-6">Resume not found.</div>;
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1f3521]">{resume.original_filename || 'Resume'}</h1>
          <p className="text-sm text-[#5b6b57]">{isAts ? `ATS Score: ${Number(resume.ats_score || 0)}%` : 'Original Resume'}</p>
        </div>
        <div className="flex gap-2">
          {resume.signed_docx_url ? <a className="rounded-lg border px-3 py-2 text-sm" href={resume.signed_docx_url} target="_blank" rel="noreferrer">Download DOCX</a> : null}
          {resume.signed_pdf_url ? <a className="rounded-lg border px-3 py-2 text-sm" href={resume.signed_pdf_url} target="_blank" rel="noreferrer">Download PDF</a> : null}
        </div>
      </div>

      {isAts ? (
        <div className="grid gap-3">
          <Section title="Summary"><p className="text-sm">{summary}</p></Section>
          <Section title="Skills"><p className="text-sm">{Array.isArray(atsData.skills) ? atsData.skills.join(' | ') : ''}</p></Section>
          <Section title="Experience">
            <div className="space-y-3 text-sm">
              {experience.map((item, idx) => (
                <div key={idx} className="rounded-lg border border-[#e6eee0] p-3">
                  <p className="font-semibold">{String(item?.job_title || item?.title || '')} {item?.company ? `- ${item.company}` : ''}</p>
                  <p className="text-xs text-[#607163]">
                    {String(item?.start_date || item?.startDate || '')} {(item?.end_date || item?.endDate) ? `to ${item?.end_date || item?.endDate}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        </div>
      ) : (
        <Section title="Resume Preview">
          {resume.signed_pdf_url ? (
            <iframe title="resume-pdf" src={resume.signed_pdf_url} className="h-[72vh] w-full rounded-lg border border-[#d9e2d0]" />
          ) : (
            <p className="text-sm text-[#5b6b57]">No inline PDF preview is available for this document.</p>
          )}
        </Section>
      )}
    </div>
  );
}
