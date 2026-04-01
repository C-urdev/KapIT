const { ensureUsersProfileSchema } = require('./ensureUsersProfileSchema');
const { ensureCompanySchema } = require('./ensureCompanySchema');
const { ensureOnboardingSchema } = require('./ensureOnboardingSchema');
const { ensureMessagingConversationSchema } = require('./ensureMessagingConversationSchema');
const { useMigrationManagedSchema } = require('./schemaManagementMode');

const schemaState = {
  baseUsers: { ready: false, promise: null },
  hiring: { ready: false, promise: null },
  onboarding: { ready: false, promise: null },
  messaging: { ready: false, promise: null },
};

const runSchemaTask = async (key, task) => {
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

const ensureBaseUserSchemaReady = async () => {
  await runSchemaTask('baseUsers', ensureUsersProfileSchema);
};

const ensureHiringSchemaReady = async () => {
  await ensureBaseUserSchemaReady();
  await runSchemaTask('hiring', ensureCompanySchema);
};

const ensureOnboardingSchemaReady = async () => {
  await ensureBaseUserSchemaReady();
  await ensureHiringSchemaReady();
  await runSchemaTask('onboarding', ensureOnboardingSchema);
};

const ensureMessagingSchemaReady = async () => {
  await ensureBaseUserSchemaReady();
  await runSchemaTask('messaging', ensureMessagingConversationSchema);
};

const warmRuntimeSchemas = async () => {
  const results = await Promise.allSettled([
    ensureBaseUserSchemaReady(),
    ensureHiringSchemaReady(),
    ensureOnboardingSchemaReady(),
    ensureMessagingSchemaReady(),
  ]);

  return results;
};

module.exports = {
  ensureBaseUserSchemaReady,
  ensureHiringSchemaReady,
  ensureOnboardingSchemaReady,
  ensureMessagingSchemaReady,
  warmRuntimeSchemas,
};
