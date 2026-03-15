const { createApp, ensureSchemaReady } = require('./app');

const PORT = process.env.PORT || 5000;
const app = createApp();

(async () => {
  try {
    await ensureSchemaReady();
    console.log('Database schema ready');
  } catch (error) {
    console.warn('Continuing without schema bootstrap (profile saving may fail).');
    console.warn(error?.message || error);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();
