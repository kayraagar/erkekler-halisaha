import { neon } from '@neondatabase/serverless';

const MAX_BODY_BYTES = 4 * 1024 * 1024;

function send(res, status, body) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.status(status).json(body);
}
function validState(state) {
  return state && typeof state === 'object' && Array.isArray(state.players) &&
    Array.isArray(state.matches) && typeof state.activeMatchId === 'string';
}

async function ensureTable(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS erkekler_shared_state (
      id SMALLINT PRIMARY KEY CHECK (id = 1),
      state JSONB NOT NULL,
      version BIGINT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

async function readRecord(sql) {
  const rows = await sql`
    SELECT state, version
    FROM erkekler_shared_state
    WHERE id = 1
  `;
  if (!rows.length) return null;
  const record = rows[0];
  const version = Number(record.version);
  if (!validState(record.state) || !Number.isFinite(version)) return null;
  return { state: record.state, version };
}

export default async function handler(req, res) {
  if (!process.env.DATABASE_URL) {
    return send(res, 503, { error: 'database_not_configured' });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    await ensureTable(sql);

    if (req.method === 'GET') {
      const record = await readRecord(sql);
      return send(res, 200, record || { state: null, version: 0 });
    }

    if (req.method === 'PUT') {
      const rawSize = Number(req.headers['content-length'] || 0);
      if (rawSize > MAX_BODY_BYTES) return send(res, 413, { error: 'state_too_large' });

      const { state, baseVersion } = req.body || {};
      if (!validState(state) || !Number.isFinite(baseVersion)) {
        return send(res, 400, { error: 'invalid_state' });
      }
      if (Buffer.byteLength(JSON.stringify(state)) > MAX_BODY_BYTES) {
        return send(res, 413, { error: 'state_too_large' });
      }

      const version = Math.max(Date.now(), baseVersion + 1);
      let rows;
      if (baseVersion === 0) {
        rows = await sql`
          INSERT INTO erkekler_shared_state (id, state, version, updated_at)
          VALUES (1, ${JSON.stringify(state)}::jsonb, ${version}, NOW())
          ON CONFLICT (id) DO NOTHING
          RETURNING version
        `;
      } else {
        rows = await sql`
          UPDATE erkekler_shared_state
          SET state = ${JSON.stringify(state)}::jsonb,
              version = ${version},
              updated_at = NOW()
          WHERE id = 1 AND version = ${baseVersion}
          RETURNING version
        `;
      }

      if (!rows.length) {
        const current = await readRecord(sql);
        return send(res, 409, current || { state: null, version: 0 });
      }
      return send(res, 200, { version: Number(rows[0].version) });
    }

    res.setHeader('Allow', 'GET, PUT');
    return send(res, 405, { error: 'method_not_allowed' });
  } catch (error) {
    console.error('Shared state database failed', error);
    return send(res, 500, { error: 'database_failed' });
  }
}
