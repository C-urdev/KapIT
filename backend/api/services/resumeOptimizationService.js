const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const mammoth = require('mammoth');
const pdfParseModule = require('pdf-parse');
const { Document, Packer, Paragraph, TextRun, AlignmentType } = require('docx');
const ILovePDFApi = require('@ilovepdf/ilovepdf-nodejs');
const { z } = require('zod');
const { logger } = require('../config/logger');

const GEMINI_MODEL = String(process.env.GEMINI_MODEL || 'gemini-2.0-flash').trim();
const GEMINI_MODEL_FALLBACKS = String(
  process.env.GEMINI_MODEL_FALLBACKS || 'gemini-2.0-flash,gemini-2.0-flash-lite,gemini-1.5-pro,gemini-1.5-flash'
).trim();
const GEMINI_API_KEY = String(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
const GEMINI_TIMEOUT_MS = Math.max(5000, Number(process.env.GEMINI_TIMEOUT_MS || 40000));
const ILOVEPDF_PUBLIC_KEY = String(process.env.ILOVEPDF_PUBLIC_KEY || '').trim();
const ILOVEPDF_SECRET_KEY = String(process.env.ILOVEPDF_SECRET_KEY || '').trim();
const DEBUG_RESUME_AI = String(process.env.DEBUG_RESUME_AI || '').toLowerCase() === 'true';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

const ExperienceItemSchema = z.object({
  job_title: z.string().optional().default(''),
  company: z.string().optional().default(''),
  location: z.string().optional().default(''),
  start_date: z.string().optional().default(''),
  end_date: z.string().optional().default(''),
  bullets: z.array(z.string()).optional().default([]),
});

const ProjectItemSchema = z.object({
  name: z.string().optional().default(''),
  role: z.string().optional().default(''),
  bullets: z.array(z.string()).optional().default([]),
});

const EducationItemSchema = z.object({
  degree: z.string().optional().default(''),
  school: z.string().optional().default(''),
  year: z.string().optional().default(''),
});

const ResumeAtsSchema = z.object({
  full_name: z.string().optional().default(''),
  headline: z.string().optional().default(''),
  location: z.string().optional().default(''),
  email: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  linkedin: z.string().optional().default(''),
  portfolio: z.string().optional().default(''),
  professional_summary: z.string().optional().default(''),
  skills: z.array(z.string()).optional().default([]),
  experience: z.array(ExperienceItemSchema).optional().default([]),
  projects: z.array(ProjectItemSchema).optional().default([]),
  education: z.array(EducationItemSchema).optional().default([]),
  certifications: z.array(z.string()).optional().default([]),
  ats_score: z.number().min(0).max(100).optional().default(60),
  ats_issues: z.array(z.string()).optional().default([]),
  rewrite_notes: z.array(z.string()).optional().default([]),
});

const parseResumeText = async ({ absolutePath, fileName }) => {
  const ext = String(path.extname(String(fileName || absolutePath || '')).toLowerCase());
  const buffer = await fs.readFile(absolutePath);

  if (ext === '.pdf') {
    try {
      const parsed = await pdfParseModule(buffer);
      return String(parsed?.text || '').trim();
    } catch (error) {
      logger.warn({ error: error?.message || String(error) }, 'PDF text extraction failed');
      return '';
    }
  }
  if (ext === '.docx') {
    const parsed = await mammoth.extractRawText({ buffer });
    return String(parsed?.value || '').trim();
  }
  if (ext === '.doc') {
    throw Object.assign(new Error('DOC parsing is not supported yet. Please upload PDF or DOCX for ATS optimization.'), { statusCode: 400 });
  }
  throw Object.assign(new Error('Unsupported file type for resume optimization.'), { statusCode: 400 });
};

const buildResumeOptimizationPrompt = ({ resumeText, preferredRole }) => {
  const role = String(preferredRole || '').trim() || 'Not specified';
  return [
    'You are an ATS resume optimization assistant.',
    'Rewrite the uploaded resume into recruiter-friendly, ATS-safe content.',
    'Preserve factual accuracy and chronology. Do not invent jobs, dates, skills, projects, or certifications.',
    'Use concise, action-oriented bullet points.',
    'No tables, no columns, no graphics, no icons, no emojis.',
    'Return ONLY valid JSON using this exact structure. No markdown and no extra text.',
    '{',
    '"full_name":"",',
    '"headline":"",',
    '"location":"",',
    '"email":"",',
    '"phone":"",',
    '"linkedin":"",',
    '"portfolio":"",',
    '"professional_summary":"",',
    '"skills":[],',
    '"experience":[{"job_title":"","company":"","location":"","start_date":"","end_date":"","bullets":[]}],',
    '"projects":[{"name":"","role":"","bullets":[]}],',
    '"education":[{"degree":"","school":"","year":""}],',
    '"certifications":[],',
    '"ats_score":0,',
    '"ats_issues":[],',
    '"rewrite_notes":[]',
    '}',
    `Preferred role: ${role}`,
    'Resume text:',
    String(resumeText || ''),
  ].join('\n');
};

const normalizeWhitespace = (value) => String(value || '').replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
const normalizeLink = (value) => {
  const text = normalizeWhitespace(value);
  if (!text) return '';
  if (/^(mailto:|https?:\/\/)/i.test(text)) return text;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return `mailto:${text}`;
  if (/^(www\.)/i.test(text)) return `https://${text}`;
  if (/^(linkedin\.com|github\.com)/i.test(text)) return `https://${text}`;
  return text;
};
const dedupeList = (values, maxItems = 20) => {
  const out = [];
  const seen = new Set();
  for (const raw of Array.isArray(values) ? values : []) {
    const text = normalizeWhitespace(raw);
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
    if (out.length >= maxItems) break;
  }
  return out;
};

const normalizeBulletText = (text) => {
  const cleaned = normalizeWhitespace(String(text || '').replace(/^[\-\u2022*\s]+/, ''));
  const maxChars = 180;
  return cleaned.length > maxChars ? `${cleaned.slice(0, maxChars - 1).trim()}...` : cleaned;
};

const parseJsonFromGeminiText = (rawText) => {
  const text = String(rawText || '').trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) {
      try {
        return JSON.parse(fenced[1]);
      } catch {}
    }
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first >= 0 && last > first) {
      try {
        return JSON.parse(text.slice(first, last + 1));
      } catch {}
    }
  }
  return null;
};

const buildGeminiModelCandidates = () => {
  const ordered = [GEMINI_MODEL, ...GEMINI_MODEL_FALLBACKS.split(',').map((item) => item.trim())].filter(Boolean);
  const seen = new Set();
  return ordered.filter((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const isGeminiQuotaError = ({ status, message }) => {
  if (Number(status) !== 429) return false;
  const text = String(message || '').toLowerCase();
  return text.includes('quota exceeded') || text.includes('rate limit') || text.includes('billing');
};

const normalizeExperienceItem = (item) => {
  const raw = item && typeof item === 'object' ? item : {};
  const adapted = {
    job_title: raw.job_title || raw.title || raw.position || '',
    company: raw.company || raw.organization || '',
    location: raw.location || '',
    start_date: raw.start_date || raw.startDate || raw.from || '',
    end_date: raw.end_date || raw.endDate || raw.to || '',
    bullets: raw.bullets || raw.highlights || raw.points || [],
  };
  const parsed = ExperienceItemSchema.safeParse(adapted);
  if (!parsed.success) return null;
  const value = parsed.data;
  const bullets = dedupeList((value.bullets || []).flatMap((b) => String(b || '').split(/\n+/)))
    .map(normalizeBulletText)
    .filter(Boolean)
    .slice(0, 6);
  const normalized = {
    job_title: normalizeWhitespace(value.job_title),
    company: normalizeWhitespace(value.company),
    location: normalizeWhitespace(value.location),
    start_date: normalizeWhitespace(value.start_date),
    end_date: normalizeWhitespace(value.end_date),
    bullets,
  };
  return (normalized.job_title || normalized.company || normalized.bullets.length) ? normalized : null;
};

const normalizeProjectItem = (item) => {
  const raw = item && typeof item === 'object' ? item : {};
  const adapted = {
    name: raw.name || raw.project || raw.project_name || raw.title || '',
    role: raw.role || raw.position || raw.contribution || '',
    bullets: raw.bullets || raw.highlights || raw.points || [],
  };
  const parsed = ProjectItemSchema.safeParse(adapted);
  if (!parsed.success) return null;
  const value = parsed.data;
  const bullets = dedupeList((value.bullets || []).flatMap((b) => String(b || '').split(/\n+/)))
    .map(normalizeBulletText)
    .filter(Boolean)
    .slice(0, 5);
  const normalized = {
    name: normalizeWhitespace(value.name),
    role: normalizeWhitespace(value.role),
    bullets,
  };
  return (normalized.name || normalized.role || normalized.bullets.length) ? normalized : null;
};

const normalizeEducationItem = (item) => {
  const raw = item && typeof item === 'object' ? item : {};
  const adapted = {
    degree: raw.degree || raw.program || raw.qualification || '',
    school: raw.school || raw.university || raw.institution || '',
    year: raw.year || raw.graduation_year || raw.graduationYear || '',
  };
  const parsed = EducationItemSchema.safeParse(adapted);
  if (!parsed.success) return null;
  const value = parsed.data;
  const normalized = {
    degree: normalizeWhitespace(value.degree),
    school: normalizeWhitespace(value.school),
    year: normalizeWhitespace(value.year),
  };
  return (normalized.degree || normalized.school || normalized.year) ? normalized : null;
};

const inferExperienceFromProjects = (projects) =>
  projects.slice(0, 3).map((project) => ({
    job_title: project.role || 'Project Experience',
    company: project.name || '',
    location: '',
    start_date: '',
    end_date: '',
    bullets: project.bullets || [],
  }));

const normalizeResumeData = (raw, diagnostics = {}) => {
  const input = raw && typeof raw === 'object' ? raw : {};
  const schemaAttempt = ResumeAtsSchema.safeParse({
    ...input,
    professional_summary: input.professional_summary || input.summary || '',
    full_name: input.full_name || input.fullName || '',
  });
  if (!schemaAttempt.success) {
    diagnostics.validation_errors = (schemaAttempt.error?.issues || []).map((issue) => `${issue.path.join('.')}: ${issue.message}`);
  } else {
    diagnostics.validation_errors = [];
  }

  const experience = dedupeList((Array.isArray(input.experience) ? input.experience : []).map((item) => JSON.stringify(item || {})), 50)
    .map((value) => {
      try { return JSON.parse(value); } catch { return null; }
    })
    .map(normalizeExperienceItem)
    .filter(Boolean);

  const projects = dedupeList((Array.isArray(input.projects) ? input.projects : []).map((item) => JSON.stringify(item || {})), 50)
    .map((value) => {
      try { return JSON.parse(value); } catch { return null; }
    })
    .map(normalizeProjectItem)
    .filter(Boolean);

  const education = (Array.isArray(input.education) ? input.education : [])
    .map(normalizeEducationItem)
    .filter(Boolean);

  const normalized = {
    full_name: normalizeWhitespace(input.full_name || input.fullName),
    headline: normalizeWhitespace(input.headline || input.role || input.desired_role),
    location: normalizeWhitespace(input.location),
    email: normalizeWhitespace(input.email),
    phone: normalizeWhitespace(input.phone),
    linkedin: normalizeLink(input.linkedin),
    portfolio: normalizeLink(input.portfolio),
    professional_summary: normalizeWhitespace(input.professional_summary || input.summary),
    skills: dedupeList((input.skills || []).flatMap((s) => String(s || '').split(/[|,\n]/g)), 30),
    experience: experience.length ? experience : (projects.length ? inferExperienceFromProjects(projects) : []),
    projects,
    education,
    certifications: dedupeList(input.certifications || [], 20),
    ats_score: Math.max(0, Math.min(100, Number(input.ats_score) || 0)),
    ats_issues: dedupeList(input.ats_issues || [], 20),
    rewrite_notes: dedupeList(input.rewrite_notes || [], 20),
  };

  return {
    ...normalized,
    summary: normalized.professional_summary,
    atsScore: normalized.ats_score,
    improvements: normalized.rewrite_notes,
    diagnostics: {
      mode: diagnostics.mode || 'model',
      fallback_reason: diagnostics.fallback_reason || '',
      validation_errors: diagnostics.validation_errors || [],
    },
  };
};

const sectionSplitRegex = /^\s*(professional summary|summary|skills|experience|projects|education|certifications?|contact|profile)\s*:?\s*$/i;
const parseSectionsFromText = (resumeText) => {
  const lines = String(resumeText || '').replace(/\r/g, '').split('\n');
  const sections = {};
  let current = 'header';
  sections[current] = [];
  lines.forEach((line) => {
    const cleaned = normalizeWhitespace(line);
    if (sectionSplitRegex.test(cleaned)) {
      current = cleaned.toLowerCase().replace(/:$/, '');
      if (!sections[current]) sections[current] = [];
      return;
    }
    sections[current].push(line);
  });
  return sections;
};

const parseFallbackStructuredResume = ({ resumeText, preferredRole, fallbackReason }) => {
  const sections = parseSectionsFromText(resumeText);
  const headerText = (sections.header || []).join('\n');
  const emailMatch = headerText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = headerText.match(/(\+?\d[\d\s\-()]{7,}\d)/);
  const linkedinMatch = headerText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s]+/i);
  const portfolioMatch = headerText.match(/(?:https?:\/\/)?(?:www\.)?(?:github\.com|gitlab\.com|bitbucket\.org|[a-z0-9-]+\.[a-z]{2,}\/[^\s]*)/i);
  const skillsRaw = (sections.skills || []).join('\n').split(/[,\n|]/g).map(normalizeWhitespace).filter(Boolean);
  const projectsLines = (sections.projects || []).map(normalizeWhitespace).filter(Boolean);
  const educationLines = (sections.education || []).map(normalizeWhitespace).filter(Boolean);
  const certLines = ((sections.certifications || []).concat(sections.certification || [])).map(normalizeWhitespace).filter(Boolean);
  const experienceLines = (sections.experience || []).map(normalizeWhitespace).filter(Boolean);

  const summary = normalizeWhitespace(((sections['professional summary'] || sections.summary || []).join(' ')).trim())
    || normalizeWhitespace(String(resumeText || '').slice(0, 800));

  const projects = [];
  let currentProject = null;
  projectsLines.forEach((line) => {
    if (/^[\-\u2022*]/.test(line)) {
      if (currentProject) currentProject.bullets.push(normalizeBulletText(line));
      return;
    }
    if (currentProject) projects.push(currentProject);
    currentProject = { name: line, role: '', bullets: [] };
  });
  if (currentProject) projects.push(currentProject);

  const experience = [];
  let currentExp = null;
  experienceLines.forEach((line) => {
    if (/^[\-\u2022*]/.test(line)) {
      if (currentExp) currentExp.bullets.push(normalizeBulletText(line));
      return;
    }
    if (currentExp) experience.push(currentExp);
    currentExp = { job_title: line, company: '', location: '', start_date: '', end_date: '', bullets: [] };
  });
  if (currentExp) experience.push(currentExp);

  const fallback = {
    full_name: normalizeWhitespace((sections.header || [])[0] || ''),
    headline: normalizeWhitespace(preferredRole || ''),
    location: '',
    email: emailMatch ? emailMatch[0] : '',
    phone: phoneMatch ? normalizeWhitespace(phoneMatch[0]) : '',
    linkedin: linkedinMatch ? linkedinMatch[0] : '',
    portfolio: portfolioMatch ? portfolioMatch[0] : '',
    professional_summary: summary,
    skills: dedupeList(skillsRaw, 30),
    experience,
    projects,
    education: educationLines.slice(0, 6).map((line) => ({ degree: line, school: '', year: '' })),
    certifications: dedupeList(certLines, 20),
    ats_score: 60,
    ats_issues: ['Automated rewrite unavailable.'],
    rewrite_notes: ['Fallback output generated from extracted resume text.'],
  };

  return normalizeResumeData(fallback, {
    mode: 'fallback',
    fallback_reason: fallbackReason || 'model_unavailable',
    validation_errors: [],
  });
};

const callGeminiForResume = async ({ resumeText, preferredRole }) => {
  if (!GEMINI_API_KEY) {
    return parseFallbackStructuredResume({ resumeText, preferredRole, fallbackReason: 'missing_api_key' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
  try {
    const prompt = buildResumeOptimizationPrompt({ resumeText, preferredRole });
    const models = buildGeminiModelCandidates();
    let lastError = null;
    let rawText = '';
    for (const model of models) {
      const response = await fetch(`${GEMINI_API_BASE}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = data?.error?.message || 'Gemini optimization failed.';
        lastError = new Error(message);
        if (isGeminiQuotaError({ status: response.status, message })) {
          logger.info({ status: response.status, model }, 'resume.gemini.quota-fallback');
          return parseFallbackStructuredResume({ resumeText, preferredRole, fallbackReason: 'quota_exceeded' });
        }
        const shouldTryNextModel = response.status === 404 && /not found|not supported/i.test(message);
        logger.warn({ status: response.status, model, error: message, nextModelFallback: shouldTryNextModel }, 'resume.gemini.failed');
        if (shouldTryNextModel) {
          continue;
        }
        throw lastError;
      }
      rawText = String(data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
      if (rawText) {
        break;
      }
    }
    if (!rawText) {
      throw (lastError || new Error('Gemini output was empty.'));
    }
    if (DEBUG_RESUME_AI) {
      logger.info({ rawGeminiOutput: rawText.slice(0, 6000) }, 'resume.gemini.raw-output');
    }
    const parsed = parseJsonFromGeminiText(rawText);
    if (!parsed) {
      logger.warn({ rawGeminiOutput: rawText.slice(0, 400) }, 'resume.gemini.parse-failed');
      return parseFallbackStructuredResume({ resumeText, preferredRole, fallbackReason: 'json_parse_failed' });
    }
    if (DEBUG_RESUME_AI) {
      logger.info({ parsedGeminiJson: parsed }, 'resume.gemini.parsed-json');
    }
    const normalized = normalizeResumeData(parsed, { mode: 'model' });
    if (normalized?.diagnostics?.validation_errors?.length) {
      logger.warn({ validationErrors: normalized.diagnostics.validation_errors.slice(0, 20) }, 'resume.gemini.schema-validation-warnings');
    }
    return normalized;
  } catch (error) {
    logger.warn({ error: error?.message || String(error) }, 'resume.gemini.fallback');
    return parseFallbackStructuredResume({ resumeText, preferredRole, fallbackReason: 'model_error' });
  } finally {
    clearTimeout(timeout);
  }
};

const createSectionHeading = (label) => new Paragraph({
  spacing: { before: 220, after: 80 },
  border: { bottom: { color: 'D9D9D9', space: 1, style: 'single', size: 6 } },
  children: [new TextRun({ text: String(label || '').toUpperCase(), bold: true, size: 24, font: 'Calibri', color: '1F2937' })],
});

const createResumeHeader = ({ full_name, headline, email, phone, linkedin, portfolio, location }) => {
  const nameText = normalizeWhitespace(full_name) || 'Candidate Name';
  const contactItems = [email, phone, linkedin, portfolio, location].map(normalizeWhitespace).filter(Boolean);
  return [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 60 },
      children: [new TextRun({ text: nameText, bold: true, size: 44, font: 'Calibri', color: '111827' })],
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 60 },
      children: [new TextRun({ text: normalizeWhitespace(headline), size: 24, font: 'Calibri', color: '334155' })],
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 200 },
      children: [new TextRun({ text: contactItems.join(' | '), size: 20, color: '475569', font: 'Calibri' })],
    }),
  ];
};

const createBulletList = (bullets = []) => bullets.map((bullet) => new Paragraph({
  bullet: { level: 0 },
  spacing: { after: 40, line: 276 },
  children: [new TextRun({ text: normalizeBulletText(bullet), size: 21, font: 'Calibri', color: '1F2937' })],
}));

const createSummaryBlock = (summary) => [
  createSectionHeading('Professional Summary'),
  new Paragraph({
    spacing: { after: 80, line: 300 },
    children: [new TextRun({ text: normalizeWhitespace(summary), size: 21, font: 'Calibri', color: '1F2937' })],
  }),
];

const createSkillsSection = (skills = []) => [
  createSectionHeading('Skills'),
  new Paragraph({
    spacing: { after: 60, line: 280 },
    children: [new TextRun({ text: dedupeList(skills, 40).join(' | '), size: 21, font: 'Calibri', color: '1F2937' })],
  }),
];

const createExperienceBlock = (experience = []) => {
  const children = [createSectionHeading('Experience')];
  experience.forEach((entry) => {
    const roleCompany = [entry.job_title, entry.company].filter(Boolean).join(' - ');
    const meta = [entry.location, [entry.start_date, entry.end_date].filter(Boolean).join(' - ')].filter(Boolean).join(' | ');
    children.push(new Paragraph({
      spacing: { before: 80, after: 20 },
      children: [new TextRun({ text: roleCompany, size: 22, font: 'Calibri', color: '111827' })],
    }));
    if (meta) {
      children.push(new Paragraph({
        spacing: { after: 40 },
        children: [new TextRun({ text: meta, size: 20, font: 'Calibri', color: '475569' })],
      }));
    }
    children.push(...createBulletList(entry.bullets || []));
  });
  return children;
};

const createProjectsBlock = (projects = []) => {
  const children = [createSectionHeading('Projects')];
  projects.forEach((entry) => {
    const label = [entry.name, entry.role].filter(Boolean).join(' - ');
    children.push(new Paragraph({
      spacing: { before: 80, after: 30 },
      children: [new TextRun({ text: label, size: 22, font: 'Calibri', color: '111827' })],
    }));
    children.push(...createBulletList(entry.bullets || []));
  });
  return children;
};

const createEducationBlock = (education = []) => {
  const children = [createSectionHeading('Education')];
  education.forEach((item) => {
    const main = [item.degree, item.school].filter(Boolean).join(' - ');
    const suffix = item.year ? ` (${item.year})` : '';
    children.push(new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: `${main}${suffix}`.trim(), size: 21, font: 'Calibri', color: '1F2937' })],
    }));
  });
  return children;
};

const createCertificationBlock = (certifications = []) => [
  createSectionHeading('Certifications'),
  ...createBulletList(certifications || []),
];

const buildDocxBuffer = async ({ fullName, role, structured }) => {
  const normalized = normalizeResumeData({ ...structured, full_name: structured?.full_name || fullName, headline: structured?.headline || role });
  const children = [
    ...createResumeHeader(normalized),
    ...createSummaryBlock(normalized.professional_summary),
    ...createSkillsSection(normalized.skills),
    ...createExperienceBlock(normalized.experience),
    ...createProjectsBlock(normalized.projects),
    ...createEducationBlock(normalized.education),
    ...createCertificationBlock(normalized.certifications),
  ];

  const doc = new Document({
    styles: {
      default: { document: { run: { font: 'Calibri', size: 21, color: '1F2937' } } },
    },
    sections: [{
      properties: { page: { margin: { top: 900, right: 850, bottom: 900, left: 850 } } },
      children,
    }],
  });
  return Packer.toBuffer(doc);
};

const buildGeneratedFileName = (prefix, extension) => `${Date.now()}-${crypto.randomUUID()}-${prefix}${extension}`;
const hasILovePdfCredentials = () => Boolean(ILOVEPDF_PUBLIC_KEY && ILOVEPDF_SECRET_KEY);

const convertDocxToPdfViaILovePdf = async ({ docxAbsolutePath }) => {
  if (!hasILovePdfCredentials()) {
    const error = new Error('ILovePDF credentials are not configured.');
    error.code = 'ILOVEPDF_NOT_CONFIGURED';
    throw error;
  }
  const api = new ILovePDFApi(ILOVEPDF_PUBLIC_KEY, ILOVEPDF_SECRET_KEY);
  const task = api.newTask('officepdf');
  await task.start();
  const file = new ILovePDFApi.ILovePDFFile(docxAbsolutePath);
  await task.addFile(file);
  await task.process();
  const result = await task.download();
  if (!result || !Buffer.isBuffer(result) || result.length === 0) {
    const error = new Error('ILovePDF returned an empty PDF file.');
    error.code = 'ILOVEPDF_EMPTY_OUTPUT';
    throw error;
  }
  return result;
};

module.exports = {
  parseResumeText,
  buildResumeOptimizationPrompt,
  normalizeResumeData,
  callGeminiForResume,
  buildDocxBuffer,
  buildGeneratedFileName,
  hasILovePdfCredentials,
  convertDocxToPdfViaILovePdf,
};
