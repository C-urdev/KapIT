const { ensureUsersProfileSchema } = require('./ensureUsersProfileSchema');
const { ensureCompanySchema } = require('./ensureCompanySchema');
const { ensureOnboardingSchema } = require('./ensureOnboardingSchema');
const { ensureMessagingConversationSchema } = require('./ensureMessagingConversationSchema');
const { ensureResumeSchema } = require('./ensureResumeSchema');
const { useMigrationManagedSchema } = require('./schemaManagementMode');

interface SchemaStateEntry {
  ready: boolean;
  promise: Promise<void> | null;
}

const schemaState: Record<string, SchemaStateEntry> = {
  baseUsers: { ready: false, promise: null },
  hiring: { ready: false, promise: null },
  onboarding: { ready: false, promise: null },
  messaging: { ready: false, promise: null },
  resumes: { ready: false, promise: null },
};

const runSchemaTask = async (key: string, task: () => Promise<void>): Promise<void> => {
  const state = schemaState[key];

  if (useMigrationManagedSchema) {
    state.ready = true;
    state.promise = null;
    return;
  }

  if (state.ready) {
    return;
  }

  if (!state.promise) {
    state.promise = (async () => {
      await task();
      state.ready = true;
    })().catch((error) => {
      state.promise = null;
      throw error;
    });
  }

  await state.promise;
};

const ensureBaseUserSchemaReady = async (): Promise<void> => {
  await runSchemaTask('baseUsers', ensureUsersProfileSchema);
};

const ensureHiringSchemaReady = async (): Promise<void> => {
  await ensureBaseUserSchemaReady();
  await runSchemaTask('hiring', ensureCompanySchema);
};

const ensureOnboardingSchemaReady = async (): Promise<void> => {
  await ensureBaseUserSchemaReady();
  await ensureHiringSchemaReady();
  await runSchemaTask('onboarding', ensureOnboardingSchema);
};

const ensureMessagingSchemaReady = async (): Promise<void> => {
  await ensureBaseUserSchemaReady();
  await runSchemaTask('messaging', ensureMessagingConversationSchema);
};

const ensureResumeSchemaReady = async (): Promise<void> => {
  await ensureBaseUserSchemaReady();
  await ensureHiringSchemaReady();
  await runSchemaTask('resumes', ensureResumeSchema);
};

const warmRuntimeSchemas = async (): Promise<PromiseSettledResult<void>[]> => {
  const results = await Promise.allSettled([
    ensureBaseUserSchemaReady(),
    ensureHiringSchemaReady(),
    ensureOnboardingSchemaReady(),
    ensureMessagingSchemaReady(),
    ensureResumeSchemaReady(),
  ]);

  return results;
};

module.exports = {
  ensureBaseUserSchemaReady,
  ensureHiringSchemaReady,
  ensureOnboardingSchemaReady,
  ensureMessagingSchemaReady,
  ensureResumeSchemaReady,
  warmRuntimeSchemas,
};
