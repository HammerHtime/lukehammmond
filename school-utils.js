// school-utils.js
// The pure half of the school list, ie, the functions with no data in them.
//
// Why this is its own file. The browser needs the importer, the merge rules
// and the logo helper. It must NOT be handed the school data, because that
// data carries seventeen coach email addresses and the whole of Luke's target
// board. One file for both meant serving the board to anyone who guessed the
// filename, which is exactly what happened on the first deploy.
//
// So: this file is public and holds no data. schools.js holds the data, is
// blocked from the web in netlify.toml, and is read only by the server
// function sitting behind the admin key.


// Wrapped in a function on purpose. The browser runs every script tag in ONE
// shared scope, so two files that both declare `const api` at the top level
// throw "Identifier 'api' has already been declared" and every script after
// the first one dies silently. Node gives each file its own scope, so the
// whole test suite passed while the live site was broken. browser.test.js now
// loads these the way a browser does, which is the only way to see it.
(function () {

const AID = {
  D1: 'Possible. Athletic aid is permitted, which is not the same as being offered any.',
  D2: 'Partial. Division II runs a partial scholarship model.',
  D3: 'None. No athletic scholarships, but merit and need-based aid can still make it affordable.',
  NAIA: 'Possible. NAIA programmes may offer athletic aid.',
  USPORTS: 'Athletic Financial Awards, capped and with academic conditions attached. ' +
    'Read alongside Canadian domestic tuition, which is a fraction of US sticker price, ' +
    'ie, a smaller award can leave a far smaller bill.',
  CCAA: 'Varies by province and institution.'
};

// A programme is either NCAA, NAIA, or Canadian. The distinction is not
// cosmetic: the NCAA contact calendar does not apply to a U SPORTS coach at
// all, so a Canadian programme can be in conversation with Luke today while
// an American one cannot reply until June 2027.
const LEVELS = ['D1', 'D2', 'D3', 'NAIA', 'USPORTS', 'CCAA'];

function isCanadian(school) {
  const division = String((school && school.division) || '').toUpperCase();
  return division === 'USPORTS' || division === 'CCAA' ||
    String((school && school.country) || '').toUpperCase() === 'CANADA';
}

// Distances are from Toronto, because a programme Luke can drive to for a
// visit is worth more than an identical one he cannot.

// Nothing above has a confirmed contact yet. Every record gets the same empty
// contact fields, so the shape is identical whether it was seeded or imported,
// and nothing can be sent until someone fills them in from the school's site.
const CONTACT_FIELDS = {
  coach: '', coachTitle: '', email: '', staffUrl: '', verified: false, verifiedOn: '',
  assistant: '', assistantEmail: '', contactNote: '',
  // The working columns. This is what turns the board into a record of what
  // was actually done, rather than a snapshot of one afternoon's research.
  logo: '',
  status: 'Not contacted', lastContact: '', coachReply: '', questionnaire: '',
  nextAction: '', sourceUrl: '', notes: '', benchmarksCheckedOn: ''
};

function aidFor(division) {
  return AID[division] || '';
}

// The school's mark, beside its name on the board.
//
// Derived from the athletics domain already recorded in staffUrl rather than
// stored separately, so a school can never end up wearing another school's
// badge. An explicit logo field overrides it. If neither resolves, the board
// falls back to initials, ie, a missing image never leaves a broken icon.
function logoFor(school) {
  if (!school) return '';
  if (school.logo) return school.logo;
  const host = hostOf(school.staffUrl);
  if (!host) return '';
  return 'https://www.google.com/s2/favicons?sz=64&domain=' + encodeURIComponent(host);
}

function hostOf(url) {
  const m = /^https?:\/\/([^/?#]+)/i.exec(String(url || ''));
  return m ? m[1].toLowerCase() : '';
}

// Two letters when there is no mark to show.
function initialsFor(school) {
  const words = String((school && school.name) || '').split(/\s+/)
    .filter(function (w) { return /^[A-Za-z]/.test(w) && !/^(of|the|at)$/i.test(w); });
  return words.slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join('');
}

function isSendable(school) {
  if (!school) return false;
  if (!school.verified) return false;
  return isEmail(school.email);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || '').trim());
}

function normaliseSchool(raw) {
  const input = raw || {};
  const name = String(input.name || '').trim();
  const division = String(input.division || '').trim().toUpperCase();
  const errors = [];

  if (!name) errors.push('School name is missing.');
  if (LEVELS.indexOf(division) === -1) {
    errors.push('Division must be one of ' + LEVELS.join(', ') + '.');
  }
  const email = String(input.email || '').trim();
  if (email && !isEmail(email)) errors.push('That is not a readable email address: ' + email);

  if (errors.length) return { ok: false, errors: errors };

  const verified = Boolean(input.verified) && isEmail(email);

  return {
    ok: true,
    school: {
      id: String(input.id || '').trim() || slug(name),
      name: name,
      division: division,
      conference: String(input.conference || '').trim(),
      state: String(input.state || '').trim(),
      country: String(input.country || (division === 'USPORTS' || division === 'CCAA' ? 'Canada' : 'USA')).trim(),
      // A U SPORTS record carries its conference as OUA, RSEQ, Canada West or
      // AUS, which is the same shape as a US conference and sorts the same way.
      coach: String(input.coach || '').trim(),
      coachTitle: String(input.coachTitle || '').trim(),
      email: email,
      staffUrl: String(input.staffUrl || '').trim(),
      verified: verified,
      verifiedOn: verified ? (String(input.verifiedOn || '').trim() || today()) : '',
      priority: String(input.priority || '').trim().toUpperCase() || '',
      confidence: String(input.confidence || '').trim() || '',
      benchmarks: Array.isArray(input.benchmarks) ? input.benchmarks : [],
      workingTarget: input.workingTarget && typeof input.workingTarget === 'object' ? input.workingTarget : {},
      benchmarksCheckedOn: String(input.benchmarksCheckedOn || '').trim(),
      athleticAid: String(input.athleticAid || '').trim() || aidFor(division),
      logo: String(input.logo || '').trim(),
      status: String(input.status || '').trim() || 'Not contacted',
      lastContact: String(input.lastContact || '').trim(),
      coachReply: String(input.coachReply || '').trim(),
      questionnaire: String(input.questionnaire || '').trim(),
      nextAction: String(input.nextAction || '').trim(),
      sourceUrl: String(input.sourceUrl || '').trim(),
      note: String(input.note || '').trim(),
      notes: String(input.notes || '').trim()
    }
  };
}

function slug(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// The importer. Accepts what a person can actually get out of a staff
// directory, ie, a pasted block of tab or comma separated rows.
// Columns: name, division, coach, email, conference, state, staffUrl
// A header row is detected and skipped. Bad rows are reported, not dropped
// silently, because a silently dropped school is a school Luke never emails.
function parsePaste(text) {
  const rows = String(text || '').split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
  const schools = [];
  const rejected = [];

  rows.forEach(function (line, index) {
    const cells = line.indexOf('\t') !== -1 ? line.split('\t') : splitCsv(line);
    const trimmed = cells.map(function (c) { return String(c || '').trim().replace(/^"|"$/g, ''); });

    if (index === 0 && /^(school|name|university|college)$/i.test(trimmed[0] || '')) return;
    if (trimmed.length < 2) { rejected.push({ line: line, reason: 'Fewer than two columns.' }); return; }

    const candidate = {
      name: trimmed[0],
      division: trimmed[1],
      coach: trimmed[2] || '',
      email: trimmed[3] || '',
      conference: trimmed[4] || '',
      state: trimmed[5] || '',
      staffUrl: trimmed[6] || '',
      verified: Boolean(trimmed[3])
    };

    const result = normaliseSchool(candidate);
    if (result.ok) schools.push(result.school);
    else rejected.push({ line: line, reason: result.errors.join(' ') });
  });

  return { schools: schools, rejected: rejected };
}

function splitCsv(line) {
  const out = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { out.push(current); current = ''; continue; }
    current += ch;
  }
  out.push(current);
  return out;
}

// How two records are recognised as the same school. The id alone is not
// enough. A row pasted out of a staff directory gets its id from the school's
// full name, ie, "some-state-university", while the board may already hold it
// as "somestate". Matching on id alone would quietly create a second copy of
// the same school, and Luke would end up emailing one and tracking the other.
function matchKey(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/\b(the|university|college|institute|of|at|st\.?|saint)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, '');
}

// Merge an imported list into the stored one. Existing schools keep their id,
// and a verified contact is never overwritten by a blank one.
function mergeSchools(existing, incoming) {
  const byId = {};
  const idByName = {};
  (existing || []).forEach(function (s) {
    byId[s.id] = s;
    const key = matchKey(s.name);
    if (key && !idByName[key]) idByName[key] = s.id;
  });

  let added = 0;
  let updated = 0;

  (incoming || []).forEach(function (s) {
    const existingId = byId[s.id] ? s.id : idByName[matchKey(s.name)];
    const held = existingId ? byId[existingId] : null;
    if (!held) {
      byId[s.id] = s;
      const key = matchKey(s.name);
      if (key && !idByName[key]) idByName[key] = s.id;
      added += 1;
      return;
    }
    const merged = Object.assign({}, held);
    Object.keys(s).forEach(function (key) {
      // A blank, a false, or an empty list never overwrites something real.
      // An import is usually partial, ie, a name and an address. It must not
      // wipe the benchmarks that took the research to gather.
      if (s[key] === '' || s[key] === false) return;
      if (Array.isArray(s[key]) && s[key].length === 0) return;
      if (key === 'id') return;
      merged[key] = s[key];
    });
    byId[existingId] = merged;
    updated += 1;
  });

  return {
    schools: Object.keys(byId).map(function (id) { return byId[id]; })
      .sort(function (a, b) {
        if (a.division !== b.division) return a.division.localeCompare(b.division);
        return a.name.localeCompare(b.name);
      }),
    added: added,
    updated: updated
  };
}

const api = {
  AID: AID,
  LEVELS: LEVELS,
  isCanadian: isCanadian,
  CONTACT_FIELDS: CONTACT_FIELDS,
  aidFor: aidFor,
  logoFor: logoFor,
  hostOf: hostOf,
  initialsFor: initialsFor,
  isSendable: isSendable,
  isEmail: isEmail,
  normaliseSchool: normaliseSchool,
  parsePaste: parsePaste,
  mergeSchools: mergeSchools,
  slug: slug,
  matchKey: matchKey
};

if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof window !== 'undefined') window.Schools = api;

})();
