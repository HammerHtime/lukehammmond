// schools.js
// The school list. Private end to end. A coach contact list is not something
// to publish, and nothing on the public page needs it.

import { readJson, writeJson, isAdmin, json, denied, needsSetup } from './lib/store.js';

const KEY = 'schools';

export default async (request) => {
  if (!process.env.ADMIN_KEY) return needsSetup();
  if (!isAdmin(request)) return denied();

  if (request.method === 'GET') {
    const schools = await readJson(KEY, null);
    return json({ schools: schools, seeded: schools === null });
  }

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return json({ error: 'Body was not readable JSON.' }, 400);
  }

  if (request.method === 'PUT') {
    if (!Array.isArray(body.schools)) return json({ error: 'schools must be a list.' }, 400);
    await writeJson(KEY, body.schools);
    return json({ ok: true, count: body.schools.length });
  }

  return json({ error: 'Method not allowed.' }, 405);
};

export const config = { path: '/api/schools' };
