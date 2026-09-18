// visit.js
// A coach arrives from a link in an emailed letter, ie, ?c=canisius.
// This counts it. Nothing else.
//
// What is deliberately NOT stored: no IP address, no user agent, no
// identifier of any kind. A count against a school id and a date. That is
// enough to tell Luke which programmes opened the file, and it is the least
// that can be stored while still answering that question.

import { readJson, writeJson, json } from './lib/store.js';

const KEY = 'visits';

export default async (request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return json({ ok: true });
  }

  const school = String(body && body.school ? body.school : '').trim().slice(0, 60);
  if (!school || !/^[a-z0-9-]+$/i.test(school)) return json({ ok: true });

  const day = new Date().toISOString().slice(0, 10);
  const visits = await readJson(KEY, {});
  if (!visits[school]) visits[school] = { count: 0, first: day, last: day, days: {} };
  visits[school].count += 1;
  visits[school].last = day;
  visits[school].days[day] = (visits[school].days[day] || 0) + 1;

  await writeJson(KEY, visits);
  return json({ ok: true });
};

export const config = { path: '/api/visit' };
