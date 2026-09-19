// visit.js
// Counting who opened the page. Two questions, one record.
//
//   How many people are reading it at all?      -> the traffic totals
//   Which programmes opened their own link?     -> the per-school counts
//
// The second only works for a visit carrying ?c=<school>, ie, a link you sent.
// The first counts everyone.
//
// What is deliberately NOT stored, for either: no IP address, no user agent,
// no cookie, no identifier of any kind. So this can say how many and on which
// day, and it can say which LINK was followed, and it can never say who. That
// is a choice, not a gap. It is a fifteen-year-old's website.
//
// Because the count is made by a script on the page, most crawlers never reach
// it, which filters the bulk of the bot traffic for free. It also means anyone
// blocking scripts is invisible, so read these as a floor, not a total.

import { readJson, writeJson, json } from './lib/store.js';

const KEY = 'visits';
const TRAFFIC = 'traffic';

export default async (request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return json({ ok: true });
  }

  const day = new Date().toISOString().slice(0, 10);
  // "fresh" means this is the first page this browser tab has opened, so it
  // separates a person arriving from the same person pressing reload. There is
  // no cookie behind it, just a flag that dies with the tab, which is why it
  // is a session count and not a people count.
  const fresh = body && body.fresh === true;
  const page = String((body && body.page) || '/').slice(0, 40);

  const traffic = await readJson(TRAFFIC, null) || {
    views: 0, sessions: 0, first: day, last: day, days: {}, pages: {}
  };
  traffic.views += 1;
  if (fresh) traffic.sessions += 1;
  traffic.last = day;
  if (!traffic.first) traffic.first = day;
  if (!traffic.days[day]) traffic.days[day] = { views: 0, sessions: 0 };
  traffic.days[day].views += 1;
  if (fresh) traffic.days[day].sessions += 1;
  traffic.pages[page] = (traffic.pages[page] || 0) + 1;
  await writeJson(TRAFFIC, traffic);

  const school = String((body && body.school) || '').trim().slice(0, 60);
  if (!school || !/^[a-z0-9-]+$/i.test(school)) return json({ ok: true });

  const visits = await readJson(KEY, {});
  if (!visits[school]) visits[school] = { count: 0, sessions: 0, first: day, last: day, days: {} };
  visits[school].count += 1;
  // Kept beside the raw count rather than replacing it, so "3 visits" can stop
  // meaning "somebody pressed reload twice".
  if (fresh) visits[school].sessions = (visits[school].sessions || 0) + 1;
  visits[school].last = day;
  visits[school].days[day] = (visits[school].days[day] || 0) + 1;
  await writeJson(KEY, visits);

  return json({ ok: true });
};

export const config = { path: '/api/visit' };
