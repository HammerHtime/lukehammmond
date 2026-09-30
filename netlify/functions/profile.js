// profile.js
// The editable parts of the profile, ie, the bits that change without a new
// swim. Goals, academics, video links, contact. GET is public.

import { readJson, writeJson, isAdmin, json, denied, needsSetup } from './lib/store.js';
import swimmerLib from '../../public/swimmer.js';

// Ten rankings and a coach come to about 2 KB. This is thirty times that.
const MAX_BODY = 64 * 1024;

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
    const text = await request.text();
    if (text.length > MAX_BODY) return json({ error: 'That is far larger than a profile.' }, 413);
    body = JSON.parse(text);
  } catch (err) {
    return json({ error: 'Body was not readable JSON.' }, 400);
  }

  if (request.method === 'PUT') {
    // Shaped before it is stored, so what GET returns is only ever the
    // rankings and the club coach.
    const shaped = swimmerLib.shapeProfile(body && body.profile);
    if (!shaped.ok) return json({ error: shaped.errors.join(' ') }, 400);
    await writeJson(KEY, shaped.profile);
    return json({ ok: true });
  }

  return json({ error: 'Method not allowed.' }, 405);
};

export const config = { path: '/api/profile' };
