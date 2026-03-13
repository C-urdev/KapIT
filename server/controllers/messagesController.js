const pool = require('../config/database');

const ensureMessagesTable = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id BIGSERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      contact_name VARCHAR(120) NOT NULL,
      sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('me', 'them')),
      body TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_messages_user_contact_time
    ON messages(user_id, contact_name, created_at)
  `);
};

const listMessages = async (req, res) => {
  let client;

  try {
    client = await pool.connect();
    await ensureMessagesTable(client);

    const { contact } = req.params;
    const result = await client.query(
      `SELECT id, sender_type, body, created_at
       FROM messages
       WHERE user_id = $1 AND contact_name = $2
       ORDER BY created_at ASC, id ASC`,
      [req.user.id, contact]
    );

    const messages = result.rows.map((row) => ({
      id: row.id,
      sender: row.sender_type,
      text: row.body,
      createdAt: row.created_at,
    }));

    res.json({ success: true, messages });
  } catch (error) {
    console.error('List messages error:', error);
    res.status(500).json({ success: false, message: 'Server error while loading messages' });
  } finally {
    if (client) {
      client.release();
    }
  }
};

const sendMessage = async (req, res) => {
  let client;

  try {
    client = await pool.connect();
    await ensureMessagesTable(client);

    const { contact } = req.params;
    const text = req.body?.text?.trim();

    if (!text) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    const result = await client.query(
      `INSERT INTO messages (user_id, contact_name, sender_type, body)
       VALUES ($1, $2, 'me', $3)
       RETURNING id, sender_type, body, created_at`,
      [req.user.id, contact, text]
    );

    const row = result.rows[0];
    res.status(201).json({
      success: true,
      message: {
        id: row.id,
        sender: row.sender_type,
        text: row.body,
        createdAt: row.created_at,
      },
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Server error while sending message' });
  } finally {
    if (client) {
      client.release();
    }
  }
};

module.exports = {
  listMessages,
  sendMessage,
};
