// results.js
// The swim results. GET is public, because the whole point is that a coach
// can read them. Anything that changes them needs the key.

import { readJson, writeJson, isAdmin, json, denied, needsSetup } from './lib/store.js';
import S from '../../public/swim.js';

// 129 swims on record came to 18 KB on 30 September. These limits are about
// fifteen years of racing at his current rate, and exist so one bad paste
// cannot fill the store.
const MAX_ROWS = 2000;
const MAX_BODY = 1024 * 1024;

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
    const text = await request.text();
    if (text.length > MAX_BODY) return json({ error: 'That is far larger than his results.' }, 413);
    body = JSON.parse(text);
  } catch (err) {
    return json({ error: 'Body was not readable JSON.' }, 400);
  }

  if (request.method === 'PUT') {
    if (!body || !Array.isArray(body.results)) return json({ error: 'results must be a list.' }, 400);
    if (body.results.length > MAX_ROWS) return json({ error: 'More than ' + MAX_ROWS + ' swims.' }, 413);
    // Every swim passes the same check the admin form runs before it sends,
    // and what is stored is the checked version, not whatever arrived.
    const clean = [];
    for (let i = 0; i < body.results.length; i += 1) {
      const checked = S.normaliseResult(body.results[i]);
      if (!checked.ok) {
        return json({ error: 'Swim ' + (i + 1) + ' was not stored: ' + checked.errors.join(' ') }, 400);
      }
      clean.push(checked.result);
    }
    await writeJson(KEY, clean);
    return json({ ok: true, count: clean.length });
  }

  return json({ error: 'Method not allowed.' }, 405);
};

export const config = { path: '/api/results' };
