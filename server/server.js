const { createApp, ensureSchemaReady } = require('./app');

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST;
const QUIET_STARTUP = process.env.QUIET_STARTUP === 'true';
const app = createApp();
const warmSchemasInBackground = async () => {
  try {
    await ensureSchemaReady();
    if (!QUIET_STARTUP) {
      console.log('Runtime schema warmup complete');
    }
  } catch (error) {
    console.warn('Continuing without schema bootstrap (profile saving may fail).');
    console.warn(error?.message || error);
  }
};

const onListen = () => {
  if (QUIET_STARTUP) {
    return;
  }

  if (HOST) {
    console.log(`Server running on http://${HOST}:${PORT}`);
    return;
  }

  console.log(`Server running on port ${PORT}`);
};

if (HOST) {
  app.listen(PORT, HOST, onListen);
} else {
  app.listen(PORT, onListen);
}

void warmSchemasInBackground();
