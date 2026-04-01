const pool = require('../config/database');
const { ensureBaseUserSchemaReady, ensureMessagingSchemaReady } = require('../config/runtimeSchema');
const { buildParityReport } = require('../services/messagingMigrationMonitor');

const FAIL_ON_MISMATCH = process.argv.includes('--fail-on-mismatch');

const main = async () => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureMessagingSchemaReady();
    client = await pool.connect();

    const report = await buildParityReport(client);
    console.log(JSON.stringify(report, null, 2));

    const hasMismatch =
      report.mismatchedThreads.length > 0 ||
      report.missingConversationThreads.length > 0 ||
      report.duplicateConversationThreads.length > 0 ||
      report.anomalies.duplicateConversationKeys.length > 0 ||
      report.anomalies.emptyConversationThreads.length > 0 ||
      report.anomalies.inconsistentParticipants.length > 0 ||
      Number(report.anomalies.dualWriteGapCount || 0) > 0;

    if (FAIL_ON_MISMATCH && hasMismatch) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(error.stack || error.message || String(error));
    process.exitCode = 1;
  } finally {
    client?.release();
  }
};

main();
