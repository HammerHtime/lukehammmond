// results.js
// The swim results. GET is public, because the whole point is that a coach
// can read them. Anything that changes them needs the key.

import { readJson, writeJson, isAdmin, json, denied, needsSetup } from './lib/store.js';

const KEY = 'results';

export default async (request) => {
  if (request.method === 'GET') {
    const results = await readJson(KEY, null);
    // null means nothing has ever been written, which is different from an
    // empty list. The page falls back to the seed file when it sees null.
    return json({ results: results, seeded: results === null });
  }

  if (!process.env.ADMIN_KEY) return needsSetup();
  if (!isAdmin(request)) return denied();

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return json({ error: 'Body was not readable JSON.' }, 400);
  }

  if (request.method === 'PUT') {
    if (!Array.isArray(body.results)) return json({ error: 'results must be a list.' }, 400);
    await writeJson(KEY, body.results);
    return json({ ok: true, count: body.results.length });
  }

  return json({ error: 'Method not allowed.' }, 405);
};

export const config = { path: '/api/results' };
