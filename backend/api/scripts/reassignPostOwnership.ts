const pool = require('../config/database');
const { ensureBaseUserSchemaReady } = require('../config/runtimeSchema');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const parsed = {
    fromEmail: '',
    toEmail: '',
    apply: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const token = String(args[index] || '').trim();

    if (token === '--apply') {
      parsed.apply = true;
      continue;
    }

    if (token === '--from') {
      parsed.fromEmail = String(args[index + 1] || '').trim().toLowerCase();
      index += 1;
      continue;
    }

    if (token === '--to') {
      parsed.toEmail = String(args[index + 1] || '').trim().toLowerCase();
      index += 1;
      continue;
    }
  }

  return parsed;
};

const getUserByEmail = async (client, email) => {
  const result = await client.query(
    `SELECT id, email, username, name
     FROM users
     WHERE LOWER(email) = LOWER($1)
     LIMIT 1`,
    [email]
  );

  return result.rows[0] || null;
};

const getPostSummaryByOwner = async (client, ownerUserId) => {
  const result = await client.query(
    `SELECT
        COUNT(*)::int AS total_count,
        COALESCE(SUM(CASE WHEN visibility = 'Public' THEN 1 ELSE 0 END), 0)::int AS public_count
     FROM user_posts
     WHERE owner_user_id = $1`,
    [ownerUserId]
  );

  return result.rows[0] || { total_count: 0, public_count: 0 };
};

const main = async () => {
  const { fromEmail, toEmail, apply } = parseArgs();

  if (!fromEmail || !toEmail) {
    throw new Error(
      'Usage: node --require tsx/cjs api/scripts/reassignPostOwnership.ts --from <fromEmail> --to <toEmail> [--apply]'
    );
  }

  if (fromEmail === toEmail) {
    throw new Error('Source and target emails must be different.');
  }

  let client;

  try {
    await ensureBaseUserSchemaReady();
    client = await pool.connect();

    const fromUser = await getUserByEmail(client, fromEmail);
    const toUser = await getUserByEmail(client, toEmail);

    if (!fromUser) {
      throw new Error(`Source user not found: ${fromEmail}`);
    }
    if (!toUser) {
      throw new Error(`Target user not found: ${toEmail}`);
    }

    const beforeFrom = await getPostSummaryByOwner(client, fromUser.id);
    const beforeTo = await getPostSummaryByOwner(client, toUser.id);

    if (!apply) {
      console.log(
        JSON.stringify(
          {
            mode: 'dry-run',
            action: 'reassign_post_ownership',
            from: {
              id: fromUser.id,
              email: fromUser.email,
              username: fromUser.username || '',
              name: fromUser.name || '',
              posts: {
                total: Number(beforeFrom.total_count || 0),
                public: Number(beforeFrom.public_count || 0),
              },
            },
            to: {
              id: toUser.id,
              email: toUser.email,
              username: toUser.username || '',
              name: toUser.name || '',
              posts: {
                total: Number(beforeTo.total_count || 0),
                public: Number(beforeTo.public_count || 0),
              },
            },
            wouldMoveCount: Number(beforeFrom.total_count || 0),
          },
          null,
          2
        )
      );
      return;
    }

    await client.query('BEGIN');

    const updateResult = await client.query(
      `UPDATE user_posts
       SET owner_user_id = $2,
           updated_at = NOW()
       WHERE owner_user_id = $1
       RETURNING id`,
      [fromUser.id, toUser.id]
    );

    await client.query('COMMIT');

    const afterFrom = await getPostSummaryByOwner(client, fromUser.id);
    const afterTo = await getPostSummaryByOwner(client, toUser.id);

    console.log(
      JSON.stringify(
        {
          mode: 'apply',
          movedCount: Number(updateResult.rowCount || 0),
          from: {
            email: fromUser.email,
            beforeTotal: Number(beforeFrom.total_count || 0),
            afterTotal: Number(afterFrom.total_count || 0),
          },
          to: {
            email: toUser.email,
            beforeTotal: Number(beforeTo.total_count || 0),
            afterTotal: Number(afterTo.total_count || 0),
          },
        },
        null,
        2
      )
    );
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // no-op rollback fallback
      }
    }
    throw error;
  } finally {
    client?.release();
  }
};

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
