// schools.js
// The school list. Private end to end. A coach contact list is not something
// to publish, and nothing on the public page needs it.
//
// The seed list lives in the repo. The live list lives in storage. This
// function is the only way either reaches a browser, which is why
// /schools.js is blocked in netlify.toml, ie, the admin screen does not load
// the file directly and neither can anyone else.

import { readJson, writeJson, isAdmin, json, denied, needsSetup } from './lib/store.js';
import lib from '../../schools.js';

const KEY = 'schools';

export default async (request) => {
  if (!process.env.ADMIN_KEY) return needsSetup();
  if (!isAdmin(request)) return denied();

  if (request.method === 'GET') {
    const stored = await readJson(KEY, null);
    // Nothing saved yet means the board has never been edited, so hand back the
    // researched seed rather than an empty screen.
    //
    // The test is "has anything ever been saved", NOT "is the saved list
    // empty". Those are different questions and conflating them meant removing
    // the last school silently restored all forty-three, ie, the one delete
    // that cannot be undone was the one that did not work.
    const everSaved = Array.isArray(stored);
    return json({ schools: everSaved ? stored : lib.seedSchools(), seeded: !everSaved });
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
