// coach.js
// The school-specific view, ie, what a coach sees when they follow the link in
// their own email.
//
// Two jobs, split by who is asking.
//
//   With the admin key:  returns a signed link for one school, for Andrew to
//                        paste into that coach's email.
//   With a valid token:  returns ONLY that school's comparison, so the page
//                        can open with "Luke and Fairfield" instead of a
//                        generic profile.
//
// The reason this is a server function rather than page code: schools.js holds
// ninety coach email addresses, every conference benchmark and Luke's recorded
// priority for all sixty-four programmes, and it is deliberately not deployed.
// A coach must never be able to read the board. So the comparison is computed
// here, where the file lives, and the response carries one school's numbers and
// nothing else. No email, no priority, no other school, not even the count.
//
// The token is an HMAC of the school id under ADMIN_KEY. It is not a password
// and it is not privacy: anyone who is sent the link can open it, and a coach
// may well forward it. It stops the URLs being guessed one school at a time,
// which is the only thing it is for.

import { createHmac, timingSafeEqual } from 'node:crypto';
import { readJson, isAdmin, json, denied, needsSetup } from './lib/store.js';
import schoolsLib from '../../schools.js';
import S from '../../public/swim.js';
import C from '../../public/convert.js';
import B from '../../public/board.js';
import swimmerLib from '../../public/swimmer.js';

function tokenFor(id) {
  return createHmac('sha256', process.env.ADMIN_KEY)
    .update('coach:' + id).digest('hex').slice(0, 24);
}

function tokenOk(id, supplied) {
  const expected = tokenFor(id);
  const given = String(supplied || '');
  if (given.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  } catch (err) {
    return false;
  }
}

// Only the fields a coach should see. Built as an allowlist rather than by
// deleting from the school record, because a field added to schools.js later
// would otherwise be published by accident, which is the exact shape of the
// bug that put the whole file on the internet in the first place.
function eventLabel(id) {
  const parts = String(id).split('-');
  const stroke = S.STROKE_SHORT[parts[1]] || parts[1] || '';
  return parts[0] + ' ' + stroke + ' ' + (parts[2] || '');
}

// One sentence per event, in the words a coach reads rather than the engine's
// labels. Written here so the public page never needs board.js, which would
// mean shipping the scoring to anyone who opens the profile.
function lineFor(c) {
  const gap = String(c.gapText || '').replace('-', '').replace('+', '');
  if (c.ahead) return 'Quicker than that group by ' + gap + '.';
  if (c.inside) return 'Inside that range, ' + gap + ' off the back of it.';
  return gap + ' off that group.';
}

function publicComparison(row) {
  return {
    school: {
      name: row.school.name,
      division: row.school.division,
      conference: row.school.conference || ''
    },
    fit: row.computedFit,
    events: (row.comparisons || []).map(function (c) {
      return {
        event: c.event || '',
        name: eventLabel(c.event),
        mine: c.mine || '',
        // Said out loud, always. He has never raced a yard, so every American
        // number on this page is converted and the page says so rather than
        // letting a coach read it as a swum time.
        mineEstimated: Boolean(c.mineEstimated),
        mineFrom: c.mineFrom
          ? { time: c.mineFrom.time, event: eventLabel(c.mineFrom.event), meet: c.mineFrom.meet }
          : null,
        theirs: c.theirs || '',
        basis: c.basisLabel || '',
        context: c.context || '',
        sourceUrl: c.sourceUrl || '',
        ahead: Boolean(c.ahead),
        inside: Boolean(c.inside),
        line: lineFor(c)
      };
    })
  };
}

export default async (request) => {
  if (!process.env.ADMIN_KEY) return needsSetup();
  if (request.method !== 'GET') return json({ error: 'Method not allowed.' }, 405);

  const url = new URL(request.url);
  const id = String(url.searchParams.get('c') || '').trim();
  if (!id) return json({ error: 'No school named.' }, 400);

  const stored = await readJson('schools', null);
  const schools = Array.isArray(stored) ? stored : schoolsLib.seedSchools();
  const school = schools.filter(function (sc) { return sc.id === id; })[0];

  // The same answer for a school that is not on the board and a school whose
  // token is wrong, so the endpoint cannot be used to find out which ids exist.
  const admin = isAdmin(request);
  if (!admin && !tokenOk(id, url.searchParams.get('t'))) return denied();
  if (!school) return admin ? json({ error: 'No such school.' }, 404) : denied();

  // Andrew asking for the link to paste into an email.
  if (admin && url.searchParams.get('link') === '1') {
    return json({
      id: id,
      name: school.name,
      token: tokenFor(id),
      path: '/?c=' + encodeURIComponent(id) + '&t=' + tokenFor(id)
    });
  }

  const rawResults = await readJson('results', null);
  const raw = Array.isArray(rawResults) && rawResults.length ? rawResults : swimmerLib.SEED_RESULTS;
  const results = raw.map(function (r) { return S.normaliseResult(r); })
    .filter(function (n) { return n.ok; }).map(function (n) { return n.result; });

  const row = B.scoreSchool(S, C.boardBests(S, results), school);
  return json({ comparison: publicComparison(row) });
};

export const config = { path: '/api/coach' };
