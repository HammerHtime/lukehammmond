// profile.js
// The editable parts of the profile, ie, the bits that change without a new
// swim. Goals, academics, video links, contact. GET is public.

import { readJson, writeJson, isAdmin, json, denied, needsSetup } from './lib/store.js';

const KEY = 'profile';

export default async (request) => {
  if (request.method === 'GET') {
    const profile = await readJson(KEY, null);
    return json({ profile: profile, seeded: profile === null });
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
    if (!body.profile || typeof body.profile !== 'object') {
      return json({ error: 'profile must be an object.' }, 400);
    }
    await writeJson(KEY, body.profile);
    return json({ ok: true });
  }

  return json({ error: 'Method not allowed.' }, 405);
};

export const config = { path: '/api/profile' };
