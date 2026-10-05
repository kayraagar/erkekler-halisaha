import { BlobPreconditionFailedError, get, put } from '@vercel/blob';

const STATE_PATH = 'erkekler/shared-state.json';
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

async function readRecord() {
  // Shared application state must never be read through Blob's CDN cache.
  // A cached ETag/version makes the next legitimate write look like a conflict.
  const result = await get(STATE_PATH, { access: 'private', useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  const text = await new Response(result.stream).text();
  const record = JSON.parse(text);
  if (!validState(record.state) || !Number.isFinite(record.version)) return null;
  return { ...record, etag: result.blob.etag };
}

export default async function handler(req, res) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return send(res, 503, { error: 'storage_not_configured' });
  }

  if (req.method === 'GET') {
    try {
      const record = await readRecord();
      return send(res, 200, record
        ? { state: record.state, version: record.version }
        : { state: null, version: 0 });
    } catch (error) {
      console.error('Shared state read failed', error);
      return send(res, 500, { error: 'state_read_failed' });
    }
  }

  if (req.method === 'PUT') {
    const rawSize = Number(req.headers['content-length'] || 0);
    if (rawSize > MAX_BODY_BYTES) return send(res, 413, { error: 'state_too_large' });
    const { state, baseVersion } = req.body || {};
    if (!validState(state) || !Number.isFinite(baseVersion)) {
      return send(res, 400, { error: 'invalid_state' });
    }

    try {
      const current = await readRecord();
      const currentVersion = current?.version || 0;
      if (baseVersion !== currentVersion) {
        return send(res, 409, { state: current?.state || null, version: currentVersion });
      }

      const version = Math.max(Date.now(), currentVersion + 1);
      const body = JSON.stringify({ state, version });
      if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
        return send(res, 413, { error: 'state_too_large' });
      }

      const options = {
        access: 'private',
        allowOverwrite: true,
        addRandomSuffix: false,
        contentType: 'application/json',
        cacheControlMaxAge: 60,
      };
      if (current?.etag) options.ifMatch = current.etag;
      await put(STATE_PATH, body, options);
      return send(res, 200, { version });
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError) {
        const latest = await readRecord();
        return send(res, 409, { state: latest?.state || null, version: latest?.version || 0 });
      }
      console.error('Shared state write failed', error);
      return send(res, 500, { error: 'state_write_failed' });
    }
  }

  res.setHeader('Allow', 'GET, PUT');
  return send(res, 405, { error: 'method_not_allowed' });
}
