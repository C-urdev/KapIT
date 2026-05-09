import React, { useEffect, useState } from 'react';
import { ArrowLeft, ImageUp, Plus, X } from 'lucide-react';
import { COMPANY_PATHS, navigate } from '@companyFeatures/companyUtils';
import {
  createPreAssessmentQuestionDraft,
  loadCompanyPostJobFormDraft,
  saveCompanyPostJobFormDraft,
} from '@companyFeatures/postJobDraftStorage';

const PRE_ASSESSMENT_MAX_QUESTIONS = 10;
const PRE_ASSESSMENT_MAX_CRITERIA = 8;

export default function CompanyPostJobPreAssessmentPage() {
  const [ready, setReady] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [questions, setQuestions] = useState([]);
  const [criteriaDraftByQuestionId, setCriteriaDraftByQuestionId] = useState({});

  useEffect(() => {
    const draft = loadCompanyPostJobFormDraft();
    const initialQuestions = Array.isArray(draft.preAssessmentQuestions) ? draft.preAssessmentQuestions : [];

    setInstructions(String(draft.preAssessmentInstructions || ''));
    setQuestions(initialQuestions.length > 0 ? initialQuestions : [createPreAssessmentQuestionDraft()]);
    setReady(true);
  }, []);

  const persist = (nextState = {}) => {
    const draft = loadCompanyPostJobFormDraft();
    saveCompanyPostJobFormDraft({
      ...draft,
      preAssessmentEnabled: true,
      preAssessmentInstructions: typeof nextState.instructions === 'string' ? nextState.instructions : instructions,
      preAssessmentQuestions: Array.isArray(nextState.questions) ? nextState.questions : questions,
    });
  };

  const addQuestion = () => {
    setQuestions((current) => {
      if (current.length >= PRE_ASSESSMENT_MAX_QUESTIONS) {
        return current;
      }
      const next = [...current, createPreAssessmentQuestionDraft()];
      persist({ questions: next });
      return next;
    });
  };

  const updateQuestion = (questionId, updater) => {
    setQuestions((current) => {
      const next = current.map((question) => (
        question.id === questionId
          ? (typeof updater === 'function' ? updater(question) : question)
          : question
      ));
      persist({ questions: next });
      return next;
    });
  };

  const removeQuestion = (questionId) => {
    setQuestions((current) => {
      const next = current.filter((question) => question.id !== questionId);
      persist({ questions: next });
      return next;
    });
    setCriteriaDraftByQuestionId((current) => {
      const next = { ...current };
      delete next[questionId];
      return next;
    });
  };

  const addCriterion = (questionId) => {
    const criterionDraft = String(criteriaDraftByQuestionId[questionId] || '').trim();
    if (!criterionDraft) {
      return;
    }

    updateQuestion(questionId, (question) => {
      if (question.criteria.length >= PRE_ASSESSMENT_MAX_CRITERIA || question.criteria.includes(criterionDraft)) {
        return question;
      }
      return {
        ...question,
        criteria: [...question.criteria, criterionDraft],
      };
    });

    setCriteriaDraftByQuestionId((current) => ({
      ...current,
      [questionId]: '',
    }));
  };

  const removeCriterion = (questionId, criterion) => {
    updateQuestion(questionId, (question) => ({
      ...question,
      criteria: question.criteria.filter((entry) => entry !== criterion),
    }));
  };

  const uploadImage = (questionId, file) => {
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = typeof reader.result === 'string' ? reader.result : '';
      updateQuestion(questionId, (question) => ({ ...question, imageUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleBackToPostJob = () => {
    persist();
    navigate(COMPANY_PATHS.postJob);
  };

  const handleInstructionsChange = (nextValue) => {
    setInstructions(nextValue);
    persist({ instructions: nextValue });
  };

  if (!ready) {
    return <p className="text-sm text-[#4b5563] dark:text-[#d0d7dd]">Loading pre-assessment builder...</p>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleBackToPostJob}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#a3b18a] dark:border-[#444d57] text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#353c44]"
          aria-label="Back to post job"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-extrabold text-[#3a5a40] dark:text-white">Pre-assessment builder</h2>
          <p className="text-sm text-[#4f6654] dark:text-[#b9c1c8]">Create custom questions, add references, and define answer criteria.</p>
        </div>
      </div>

      <section className="rounded-2xl border border-[#a3b18a] dark:border-[#353c44] bg-[#f8fbf6] dark:bg-[#22272b] p-6 space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#3a5a40] dark:text-white">Assessment instructions (optional)</label>
          <textarea
            value={instructions}
            onChange={(event) => handleInstructionsChange(event.target.value)}
            className="field min-h-24"
            placeholder="Example: Focus on practical design decisions and explain your trade-offs."
          />
        </div>

        <div className="space-y-3">
          {questions.map((question, index) => (
            <article key={question.id} className="rounded-xl border border-[#bfd0af] dark:border-[#444d57] bg-[#f5f9f2] dark:bg-[#1b2025] p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-[#2f4d35] dark:text-white">Question {index + 1}</p>
                <button
                  type="button"
                  onClick={() => removeQuestion(question.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#a3b18a] dark:border-[#444d57] px-2.5 py-1.5 text-xs font-semibold text-[#344e41] dark:text-white hover:bg-[#eef3e8] dark:hover:bg-[#353c44]"
                >
                  <X className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-[#3a5a40] dark:text-white">Question</label>
                <textarea
                  value={question.question}
                  onChange={(event) => updateQuestion(question.id, (current) => ({ ...current, question: event.target.value }))}
                  className="field min-h-24"
                  placeholder="Write the question applicants should answer..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-[#3a5a40] dark:text-white">Image or reference (optional)</label>
                <div className="space-y-2">
                  <input
                    value={question.imageUrl}
                    onChange={(event) => updateQuestion(question.id, (current) => ({ ...current, imageUrl: event.target.value }))}
                    className="field"
                    placeholder="Paste image URL or upload below"
                  />
                  <div className="flex items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#a3b18a] dark:border-[#444d57] px-3 py-2 text-xs font-semibold text-[#344e41] dark:text-white hover:bg-[#eef3e8] dark:hover:bg-[#353c44]">
                      <ImageUp className="h-4 w-4" />
                      Upload image
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp"
                        className="hidden"
                        onChange={(event) => uploadImage(question.id, event.target.files?.[0])}
                      />
                    </label>
                    {question.imageUrl ? (
                      <button
                        type="button"
                        onClick={() => updateQuestion(question.id, (current) => ({ ...current, imageUrl: '' }))}
                        className="text-xs font-semibold text-[#5f6f52] hover:text-[#344e41] dark:text-[#d0d7dd] dark:hover:text-white"
                      >
                        Clear image
                      </button>
                    ) : null}
                  </div>
                  {question.imageUrl ? (
                    <img
                      src={question.imageUrl}
                      alt={`Question ${index + 1} reference`}
                      className="max-h-48 rounded-lg border border-[#bfd0af] dark:border-[#444d57] object-contain bg-white dark:bg-[#11161c]"
                    />
                  ) : null}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-[#3a5a40] dark:text-white">Answer criteria</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={criteriaDraftByQuestionId[question.id] || ''}
                      onChange={(event) => setCriteriaDraftByQuestionId((current) => ({ ...current, [question.id]: event.target.value }))}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          addCriterion(question.id);
                        }
                      }}
                      className="field"
                      placeholder="Example: Clear UX rationale"
                    />
                    <button
                      type="button"
                      onClick={() => addCriterion(question.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#3a5a40] px-3 py-2 text-xs font-semibold text-white hover:bg-[#344e41] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </button>
                  </div>
                  {question.criteria.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {question.criteria.map((criterion) => (
                        <span key={`${question.id}-${criterion}`} className="inline-flex items-center gap-2 rounded-full border border-[#a3b18a] dark:border-[#444d57] bg-[#edf5ea] dark:bg-[#1a1d20] px-3 py-1 text-xs text-[#344e41] dark:text-white">
                          {criterion}
                          <button
                            type="button"
                            onClick={() => removeCriterion(question.id, criterion)}
                            className="text-[#5f6f52] dark:text-[#d0d7dd]"
                            aria-label={`Remove criterion ${criterion}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#5f6f52] dark:text-[#a8b1ba]">Add at least one criterion for this question.</p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={addQuestion}
            disabled={questions.length >= PRE_ASSESSMENT_MAX_QUESTIONS}
            className="inline-flex items-center gap-2 rounded-lg border border-[#a3b18a] dark:border-[#444d57] px-3 py-2 text-sm font-semibold text-[#344e41] dark:text-white hover:bg-[#eef3e8] dark:hover:bg-[#353c44] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            Add question
          </button>
          <button
            type="button"
            onClick={handleBackToPostJob}
            className="inline-flex items-center gap-2 rounded-lg bg-[#3a5a40] px-4 py-2 text-sm font-semibold text-white hover:bg-[#344e41] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86]"
          >
            Save and return to post job
          </button>
        </div>
      </section>
    </div>
  );
}
