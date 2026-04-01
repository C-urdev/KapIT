const pool = require('../config/database');
const { ensureBaseUserSchemaReady, ensureMessagingSchemaReady } = require('../config/runtimeSchema');
const {
  compareUserThread,
  buildParityReport,
  getMigrationHealthSummary,
} = require('../services/messagingMigrationMonitor');
const {
  getMessagingRolloutConfig,
  getMessagingRolloutMetrics,
} = require('../services/messagingRolloutService');

const listMigrationHealth = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureMessagingSchemaReady();
    client = await pool.connect();

    const summary = await getMigrationHealthSummary(client);
    return res.json({
      success: true,
      health: {
        ...summary,
        rollout: {
          config: getMessagingRolloutConfig(),
          metrics: getMessagingRolloutMetrics(),
        },
      },
    });
  } catch (error) {
    console.error('Messaging migration health error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch messaging migration health.',
    });
  } finally {
    client?.release();
  }
};

const getThreadComparison = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureMessagingSchemaReady();
    client = await pool.connect();

    const userId = String(req.query.userId || req.user?.id || '').trim();
    const contactId = String(req.params.contact || '').trim();

    if (!userId || !contactId) {
      return res.status(400).json({
        success: false,
        message: 'Both userId and contact are required.',
      });
    }

    const comparison = await compareUserThread(client, userId, contactId);
    return res.json({
      success: true,
      comparison,
    });
  } catch (error) {
    console.error('Messaging thread comparison error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to compare messaging thread.',
    });
  } finally {
    client?.release();
  }
};

const getParityReport = async (req, res) => {
  let client;

  try {
    await ensureBaseUserSchemaReady();
    await ensureMessagingSchemaReady();
    client = await pool.connect();

    const report = await buildParityReport(client);
    return res.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Messaging parity report error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to build messaging parity report.',
    });
  } finally {
    client?.release();
  }
};

module.exports = {
  listMigrationHealth,
  getThreadComparison,
  getParityReport,
};
