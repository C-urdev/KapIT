import type { RefinementCtx, ZodTypeAny } from 'zod';
const { z } = require('zod');

const uuid = z.string().uuid();
const positiveIntParam = z.coerce.number().int().positive();
const optionalPositiveInt = z.coerce.number().int().positive().optional();
const idempotencyKey = z.string().min(8).max(128).regex(/^[a-zA-Z0-9_.:-]+$/);

const email = z.string().email().max(254);
const password = z
  .string()
  .min(8)
  .max(128)
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/\d/, 'Password must contain a number');

const accountType = z.enum(['developer', 'company']);
const userType = z.enum(['employee', 'company']);
const provider = z.enum(['paypal']);
const anyRecord = z.record(z.string(), z.any());
const optionalNonNegativeIntFromNullable = z
  .preprocess(
    (value: unknown): unknown => {
      if (value == null || value === '') return undefined;
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : undefined;
    },
    z.number().int().nonnegative().optional()
  );
const authProfilePatchBody = anyRecord.superRefine((value: Record<string, unknown>, ctx: RefinementCtx) => {
  if (value && Object.prototype.hasOwnProperty.call(value, 'isPremium')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['isPremium'],
      message: 'isPremium cannot be updated from this endpoint.',
    });
  }
});

const isAllowedImageUrl = (value: unknown): boolean => {
  const candidate = String(value || '').trim();
  if (!candidate) {
    return false;
  }

  if (/^data:image\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=]+$/i.test(candidate)) {
    return true;
  }

  try {
    const parsed = new URL(candidate);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const draftSchema = z
  .object({
    title: z.coerce.string().trim().min(1).max(140),
    description: z.coerce.string().trim().min(1).max(5000),
    salary: z.coerce.string().trim().max(120).optional().default(''),
    location: z.coerce.string().trim().max(200).optional().default(''),
    type: z.coerce.string().trim().max(80).optional().default(''),
    experienceLevel: z.enum(['intern', 'junior', 'mid', 'senior']).or(z.literal('')).optional().default(''),
    workPreference: z.enum(['fully-remote', 'asynchronous-remote', 'hybrid', 'on-site']).or(z.literal('')).optional().default(''),
    applicationDeadline: z.coerce.string().trim().max(40).optional().default(''),
    hiresNeeded: z.coerce.number().int().min(1).max(50).optional().default(1),
    ats: z.coerce.string().trim().max(160).optional().default(''),
    hiringTimeline: z.coerce.string().trim().max(160).optional().default(''),
    mustHaves: z.coerce.string().trim().max(2000).optional().default(''),
    dealbreakers: z.coerce.string().trim().max(2000).optional().default(''),
    skills: z.array(z.coerce.string().trim().min(1).max(60)).max(50).optional().default([]),
    preAssessment: z
      .object({
        enabled: z.boolean().optional().default(false),
        instructions: z.coerce.string().trim().max(2000).optional().default(''),
        questions: z
          .array(
            z.object({
              id: z.coerce.string().trim().max(80).optional().default(''),
              question: z.coerce.string().trim().min(1).max(1000),
              imageUrl: z
                .coerce.string()
                .trim()
                .max(2000000)
                .refine((value: string) => !value || isAllowedImageUrl(value), 'Invalid URL')
                .optional()
                .default(''),
              criteria: z.array(z.coerce.string().trim().min(1).max(200)).max(20).optional().default([]),
            })
          )
          .max(12)
          .optional()
          .default([]),
      })
      .optional()
      .default({
        enabled: false,
        instructions: '',
        questions: [],
      }),
  })
  .passthrough();

const postBody = z
  .object({
    content: z.string().max(5000).optional(),
    imageUrl: z.string().max(2000000).refine(isAllowedImageUrl, 'Invalid URL').optional(),
    visibility: z.enum(['public', 'connections', 'private']).optional(),
    message: z.string().max(500).optional(),
    parentCommentId: optionalPositiveInt.nullable().optional(),
    reactionType: z
      .string()
      .trim()
      .min(1)
      .max(32)
      .refine((value: string) => /^[a-z0-9_-]+$/i.test(value), 'Invalid reaction type')
      .optional(),
  })
  .strict();

const base = { query: z.object({}).passthrough(), headers: z.object({}).passthrough() };

const schema = (body: ZodTypeAny, params: ZodTypeAny = z.object({})) => ({ body, params, ...base });

const writeSchemas = {
  authRegister: schema(
    z
      .object({
        username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
        email,
        password,
        accountType: accountType.optional(),
        account_type: accountType.optional(),
        userType: userType.optional(),
        verificationToken: z.string().min(10).max(2048).optional(),
        termsAccepted: z.boolean().optional(),
      })
      .strict()
  ),
  authLogin: schema(z.object({ email, password: z.string().min(1).max(128), accountTypeHint: accountType.optional() }).strict()),
  authForgotPassword: schema(z.object({ email }).strict()),
  authResetPassword: schema(z.object({ token: z.string().min(32).max(512), new_password: password }).strict()),
  authSendOtp: schema(z.object({ email }).strict()),
  authLocalRegistrationBypass: schema(z.object({ email }).strict()),
  authLocalPasswordResetBypass: schema(z.object({ email }).strict()),
  authVerifyOtp: schema(z.object({ email, code: z.string().length(6).regex(/^\d{6}$/) }).strict()),
  authResetPasswordOtp: schema(z.object({ resetToken: z.string().min(10).max(512), new_password: password }).strict()),
  authOAuthStateCreate: schema(
    z
      .object({
        provider: z.enum(['google', 'github']),
        mode: z.enum(['login', 'signup']).optional(),
        accountTypeHint: accountType.optional(),
      })
      .strict()
  ),
  authGoogleLogin: schema(
    z
      .object({
        credential: z.string().min(6).max(16384),
        state: z.string().min(8).max(512),
      })
      .strict()
  ),
  authGithubLogin: schema(
    z
      .object({
        code: z.string().min(4).max(4096),
        state: z.string().min(8).max(512),
      })
      .strict()
  ),
  authSocialCompleteSignup: schema(
    z
      .object({
        socialSignupToken: z.string().min(10).max(4096).optional(),
        verificationToken: z.string().min(10).max(4096),
        password,
        accountType,
      })
      .strict()
  ),
  authRefresh: schema(z.object({}).strict()),
  authLogout: schema(z.object({}).strict()),
  authSaveJob: schema(z.object({ jobId: z.coerce.number().int().positive() }).strict()),
  authRemoveSavedJob: schema(z.object({}).strict(), z.object({ jobId: positiveIntParam })),
  authApplyJob: schema(z.object({}).strict(), z.object({ id: positiveIntParam })),
  authProfilePatch: schema(authProfilePatchBody),
  authTermsConsent: schema(z.object({ agreed: z.boolean() }).strict()),
  userPremiumCheckoutSession: schema(z.object({ provider }).strict()),
  userPremiumLocalBypass: schema(z.object({ provider }).strict()),
  userPremiumPaypalCapture: schema(z.object({ paymentId: uuid, orderId: z.string().min(1).max(255) }).strict()),
  userPremiumCancel: schema(z.object({}).strict(), z.object({ paymentId: uuid })),
  authPostCreate: schema(postBody),
  authDeletePost: schema(z.object({}).strict(), z.object({ postId: positiveIntParam })),
  authReactPost: schema(postBody.pick({ reactionType: true }), z.object({ postId: positiveIntParam })),
  authCommentPost: schema(postBody.pick({ content: true, imageUrl: true, parentCommentId: true }), z.object({ postId: positiveIntParam })),
  authReactComment: schema(postBody.pick({ reactionType: true, parentCommentId: true }), z.object({ postId: positiveIntParam, commentId: positiveIntParam })),
  authSharePost: schema(postBody.pick({ visibility: true, message: true }).partial(), z.object({ postId: positiveIntParam })),
  authSavePost: schema(z.object({ postId: z.coerce.number().int().positive() }).strict()),
  authRemoveSavedPost: schema(z.object({}).strict(), z.object({ postId: positiveIntParam })),

  companyDraftJob: schema(draftSchema),
  companyCheckoutSession: schema(
    z
      .object({
        provider,
        planId: z.string().min(1).max(50),
        draft: draftSchema,
        jobId: optionalPositiveInt.nullable(),
        idempotencyKey,
      })
      .strict()
  ),
  companyLocalBypass: schema(
    z
      .object({
        provider,
        planId: z.string().min(1).max(50),
        draft: draftSchema,
        jobId: optionalPositiveInt.nullable(),
        idempotencyKey: idempotencyKey.optional(),
      })
      .strict()
  ),
  companyPaypalCapture: schema(z.object({ paymentId: uuid, orderId: z.string().min(1).max(255) }).strict()),
  companyCancel: schema(z.object({}).strict(), z.object({ paymentId: uuid })),
  companyJobsCreate: schema(anyRecord),
  companyJobStatus: schema(z.object({ status: z.string().min(1).max(32) }).strict(), z.object({ jobId: positiveIntParam })),
  companyJobReopen: schema(z.object({}).strict(), z.object({ jobId: positiveIntParam })),
  companyDeleteJob: schema(z.object({}).strict(), z.object({ jobId: positiveIntParam })),
  companyApplicationStatus: schema(z.object({ status: z.string().min(1).max(32) }).strict(), z.object({ applicationId: positiveIntParam })),
  companyProfileUpdate: schema(anyRecord),
  companyOnboardingUpdate: schema(anyRecord),

  developerProfileUpdate: schema(anyRecord),
  developerResumeUpload: schema(z.object({}).passthrough()),
  developerResumeAnalysis: schema(z.object({}).strict()),
  chatbotMessage: schema(
    z
      .object({
        message: z.coerce.string().trim().min(1).max(320),
        lastIntent: z.coerce.string().trim().min(1).max(40).optional(),
      })
      .strict()
  ),
  matchJobs: schema(
    z
      .object({
        skills: z.array(z.string().min(1).max(60)).max(50).optional().default([]),
        experience: z.enum(['intern', 'junior', 'mid', 'senior']).default('junior'),
        desiredRole: z.coerce.string().trim().min(1).max(160).optional(),
        summary: z.coerce.string().trim().max(2500).optional(),
        resumeText: z.coerce.string().trim().max(12000).optional(),
        education: z.coerce.string().trim().max(600).optional(),
        certifications: z.coerce.string().trim().max(600).optional(),
        projects: z.array(z.coerce.string().trim().min(1).max(240)).max(30).optional(),
        preferredCategories: z.array(z.coerce.string().trim().min(1).max(80)).max(20).optional(),
        techStack: z.array(z.coerce.string().trim().min(1).max(80)).max(40).optional(),
      })
      .strict()
  ),

  messageSend: schema(z.object({ text: z.string().min(1).max(4000) }).strict(), z.object({ contact: uuid })),
  notificationsRead: schema(z.object({}).strict()),
};

module.exports = {
  writeSchemas,
};
