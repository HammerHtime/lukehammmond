// schools.js
// The programmes Luke might swim for, and how to reach them.
//
// Two rules, and they are the reason this file is boring on purpose.
//
// 1. A school only appears here if it sponsors MEN'S swimming. Programmes are
//    cut and added every year. A school that dropped the sport is a wasted
//    email and a bad look.
// 2. A coach email is either verified against the school's own staff directory
//    on a recorded date, or it is empty. There is no third state. An invented
//    address bounces, or worse, reaches a stranger.
//
//    The seventeen addresses below were read off each school's own athletics
//    site on 18 September 2026, and every one carries the page it came from in
//    staffUrl. None was built from a naming pattern. Three are odd enough to be
//    worth NOT "correcting": Manhattan's begins with j while the coach is
//    displayed as Brian, American's ends in a single t, and RPI publishes only
//    a shared programme mailbox rather than any personal address.
//
//    Coaching staff turn over constantly. Five of these seventeen changed head
//    coach in the last eighteen months, and search engines still return the old
//    name for four of them. So re-check verifiedOn before a send rather than
//    trusting it forever.
//
// Anything with verified:false has NOT had its contact confirmed. The back end
// will not send to it. Fill it with the importer, from the school's own site.

const AID = {
  D1: 'Possible. Athletic aid is permitted, which is not the same as being offered any.',
  D2: 'Partial. Division II runs a partial scholarship model.',
  D3: 'None. No athletic scholarships, but merit and need-based aid can still make it affordable.'
};

// Distances are from Toronto, because a programme Luke can drive to for a
// visit is worth more than an identical one he cannot.
const SCHOOLS = [
  // ---------- P1. His times already overlap these programmes. ----------
  {
    id: 'gannon',
    coach: "Milan Medo", coachTitle: "Head Swimming Coach",
    email: "medo001@gannon.edu",
    staffUrl: "https://gannonsports.com/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "Assistant: Bill Bradley, bradley069@gannon.edu. An older page naming Jacqueline Michalski as head coach is out of date.", name: 'Gannon University', division: 'D2', conference: 'Pennsylvania State Athletic',
    state: 'PA', country: 'USA', priority: 'P1', confidence: 'High',
    note: 'His 500 and mile equivalents are already slightly faster than the conference results found.',
    benchmarks: [
      { event: '500-free-SCY', time: '4:38.68', basis: 'qualifier', context: '2026 conference result' },
      { event: '1650-free-SCY', time: '16:29.04', basis: 'qualifier', context: '2026 conference result' }
    ]
  },
  {
    id: 'canisius',
    coach: "Scott Vanderzell", coachTitle: "Head Coach",
    email: "vanderzs@canisius.edu",
    staffUrl: "https://gogriffs.com/sports/swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "Assistant: Samantha Palma, palmas@canisius.edu. Combined men's and women's staff.", name: 'Canisius University', division: 'D1', conference: 'MAAC',
    state: 'NY', country: 'USA', priority: 'P1', confidence: 'High',
    note: 'Buffalo, ie, an easy drive from Toronto. His mile equivalent is well inside their MAAC result.',
    benchmarks: [
      { event: '1650-free-SCY', time: '17:06.24', basis: 'qualifier', context: 'MAAC 1650' }
    ]
  },
  {
    id: 'stbonaventure',
    coach: "Alec Kandt", coachTitle: "Head Men's and Women's Swimming and Diving Coach",
    email: "akandt@sbu.edu",
    staffUrl: "https://gobonnies.com/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "Assistant: Colby Clark, coclark@sbu.edu. Kandt is new. Older items naming Mike Smiechowski are out of date.", name: 'St. Bonaventure University', division: 'D1', conference: 'Atlantic 10',
    state: 'NY', country: 'USA', priority: 'P1', confidence: 'High',
    note: 'The most interesting comparison on the board. His 500 sits inside the times their swimmers were actually producing.',
    benchmarks: [
      { event: '500-free-SCY', times: ['4:28.10', '4:30.05', '4:35.22', '4:36.65', '4:42.27'],
        basis: 'roster', context: '2026 MAAC and A-10 calibre 500 performances' }
    ]
  },
  {
    id: 'saintpeters',
    coach: "McAllistar Milne", coachTitle: "Head Coach",
    email: "mmilne@saintpeters.edu",
    staffUrl: "https://saintpeterspeacocks.com/staff-directory/mcallistar-milne/2295",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "First year as head coach, 2026-27. The sport coaches page is stale and does not list him. No assistant emails published.", name: "Saint Peter's University", division: 'D1', conference: 'MAAC',
    state: 'NJ', country: 'USA', priority: 'P1', confidence: 'Medium',
    note: 'Distance times look relevant to roster depth, but the current roster has not been gone through swimmer by swimmer.',
    benchmarks: []
  },
  {
    id: 'manhattan',
    coach: "Brian Hansbury", coachTitle: "Head Coach, Swimming & Diving",
    email: "jhansbury01@manhattan.edu",
    staffUrl: "https://gojaspers.com/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "The address really does begin with j while the coach is displayed as Brian. Read twice on the page. Do not correct it to bhansbury.", name: 'Manhattan University', division: 'D1', conference: 'MAAC',
    state: 'NY', country: 'USA', priority: 'P1', confidence: 'Medium',
    note: 'Potential roster fit already. Wants better individual swimmer data before the call is firm.',
    benchmarks: []
  },
  {
    id: 'clarkson',
    coach: "Marc Danin", coachTitle: "Head Coach - Swimming & Diving",
    email: "mdanin@clarkson.edu",
    staffUrl: "https://clarksonathletics.com/sports/swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "Assistant: Finn Halstead, halstefw@clarkson.edu.", name: 'Clarkson University', division: 'D3', conference: 'Liberty League',
    state: 'NY', country: 'USA', priority: 'P1', confidence: 'Medium',
    note: 'Geographically sensible and a potentially good swimming fit, particularly if the academics match.',
    benchmarks: []
  },

  // ---------- P2. Realistic if he keeps progressing. ----------
  {
    id: 'niagara',
    coach: "Matt Bosse", coachTitle: "Head Coach",
    email: "mbosse@niagara.edu",
    staffUrl: "https://purpleeagles.com/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "One-coach staff, no assistant listed. Second season, hired 2025.", name: 'Niagara University', division: 'D1', conference: 'MAAC',
    state: 'NY', country: 'USA', priority: 'P2', confidence: 'High',
    workingTarget: { '500-free-SCY': '4:32.00' },
    note: 'Very close to Toronto, so worth watching closely even while he is still improving. A 500 toward 4:32 makes the profile much more compelling here.',
    benchmarks: [
      { event: '500-free-SCY', time: '4:29.38', basis: 'qualifier', context: 'top 500 qualifier in the evidence found' }
    ]
  },
  {
    id: 'american',
    coach: "Garland Bartlett", coachTitle: "Head Coach",
    email: "gbartlet@american.edu",
    staffUrl: "https://aueagles.com/sports/swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Emmett Adams", assistantEmail: "emmett@american.edu",
    contactNote: "The address is gbartlet with a single t at the end, exactly as displayed. Matt McKenney left in April 2026, do not contact him here.", name: 'American University', division: 'D1', conference: 'Patriot League',
    state: 'DC', country: 'USA', priority: 'P2', confidence: 'High',
    note: 'An actual distance swimmer to compare against, and the 500 is only about four and a half seconds away.',
    benchmarks: [
      { event: '500-free-SCY', time: '4:32.57', basis: 'roster', context: 'a distance swimmer on the roster' },
      { event: '1650-free-SCY', time: '16:02.48', basis: 'roster', context: 'the same swimmer' },
      { event: '400-im-SCY', time: '3:59.25', basis: 'roster', context: 'the same swimmer' }
    ]
  },
  {
    id: 'rit',
    coach: "Phil Baretela", coachTitle: "Head Coach",
    email: "pjbatl@rit.edu",
    staffUrl: "https://ritathletics.com/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Daniel Dubois", assistantEmail: "dsdatl@rit.edu",
    contactNote: "RIT uses an initials-plus-atl convention. Only addresses actually seen are recorded.", name: 'Rochester Institute of Technology', division: 'D3', conference: 'Liberty League',
    state: 'NY', country: 'USA', priority: 'P2', confidence: 'High',
    workingTarget: { '1650-free-SCY': '16:00.00' },
    note: 'The benchmark is the conference winner, so being behind it is normal. A Grade 11 drop toward 16:00 changes the picture considerably.',
    benchmarks: [
      { event: '1650-free-SCY', time: '15:50.52', basis: 'champion', context: 'Liberty League 1650 winner' }
    ]
  },
  {
    id: 'ithaca',
    coach: "Mike Blakely-Armitage", coachTitle: "Head Swimming and Diving Coach",
    email: "marmitage@ithaca.edu",
    staffUrl: "https://athletics.ithaca.edu/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "Kevin Markwardt is the FORMER head coach and search engines still return him. Ithaca runs a recruit questionnaire form. Assistant Kyle Brown publishes no address but is likely the day to day recruiting contact, so ask for him by name.", name: 'Ithaca College', division: 'D3', conference: 'Liberty League',
    state: 'NY', country: 'USA', priority: 'P2', confidence: 'High',
    note: 'Meaningful gaps, but not ridiculous gaps for a Grade 10 swimmer. Both benchmarks are conference champions.',
    benchmarks: [
      { event: '500-free-SCY', time: '4:31.98', basis: 'champion', context: 'conference 500 champion' },
      { event: '400-im-SCY', time: '4:05.21', basis: 'champion', context: 'conference 400 IM champion' }
    ]
  },
  {
    id: 'rpi',
    coach: "Shannon O'Brien", coachTitle: "Head Coach",
    email: "swimdive@rpi.edu",
    staffUrl: "https://rpiathletics.com/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "SHARED programme mailbox, not a personal address. RPI publishes no individual coach emails at all. Address the email to Coach O'Brien by name.", name: 'Rensselaer Polytechnic Institute', division: 'D3', conference: 'Liberty League',
    state: 'NY', country: 'USA', priority: 'P2', confidence: 'Low',
    note: 'Could become very interesting depending on what he eventually wants academically. No swimmer times gathered yet.',
    benchmarks: []
  },
  {
    id: 'marist',
    coach: "Billy Gordon", coachTitle: "Head Coach",
    email: "Billy.Gordon@marist.edu",
    staffUrl: "https://goredfoxes.com/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "Newly hired August 2026. Anthony Randall is the former head coach. The school now brands itself Marist University.", name: 'Marist College', division: 'D1', conference: 'MAAC',
    state: 'NY', country: 'USA', priority: 'P2', confidence: 'High',
    workingTarget: { '500-free-SCY': '4:32.00', '1650-free-SCY': '16:00.00' },
    note: 'Deliberately on the P2 and P3 boundary. The 500 gap is not enormous. The mile gap is much larger.',
    benchmarks: [
      { event: '500-free-SCY', time: '4:30.45', basis: 'qualifier', context: 'evidence found' },
      { event: '1650-free-SCY', time: '15:39.33', basis: 'qualifier', context: 'evidence found' }
    ]
  },

  // ---------- P3. Reach. Where the next level is. ----------
  {
    id: 'bucknell',
    coach: "Josh Huger", coachTitle: "Head Coach",
    email: "jh077@bucknell.edu",
    staffUrl: "https://bucknellbison.com/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Collin Hummel", assistantEmail: "cmh036@bucknell.edu",
    contactNote: "Hired July 2026 from Cal Berkeley, replacing Dan Schinnerer. Any list showing Schinnerer is stale.", name: 'Bucknell University', division: 'D1', conference: 'Patriot League',
    state: 'PA', country: 'USA', priority: 'P3', confidence: 'High',
    workingTarget: { '500-free-SCY': '4:28.00', '1650-free-SCY': '15:50.00' },
    note: 'Aggressive targets, but now we know what the target looks like rather than saying Bucknell is hard.',
    benchmarks: [
      { event: '500-free-SCY', time: '4:27.00', basis: 'roster', context: 'stronger distance swimmers, approximate' },
      { event: '1650-free-SCY', time: '15:46.00', basis: 'roster', context: 'stronger distance swimmers, slower end of 15:35 to 15:46' }
    ]
  },
  {
    id: 'fairfield',
    coach: "Jake Lichter", coachTitle: "Head Men's and Women's Swimming & Diving Coach",
    email: "jlichter@fairfield.edu",
    staffUrl: "https://fairfieldstags.com/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Emma Brown", assistantEmail: "ebrown3@fairfield.edu",
    contactNote: "Emma Brown is Associate Head Coach and the best second contact.", name: 'Fairfield University', division: 'D1', conference: 'MAAC',
    state: 'CT', country: 'USA', priority: 'P3', confidence: 'Low', benchmarks: [],
    note: 'Same thinking as Bucknell. Swimmer times still to be gathered.'
  },
  {
    id: 'iona',
    coach: "Nick Cavataro", coachTitle: "Head Coach",
    email: "ncavataro@iona.edu",
    staffUrl: "https://ionagaels.com/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Mauro Pacsi", assistantEmail: "mpacsi@iona.edu",
    contactNote: "icgaels.com now redirects to ionagaels.com. Mauro Pacsi is Associate Head Coach and the best second contact.", name: 'Iona University', division: 'D1', conference: 'MAAC',
    state: 'NY', country: 'USA', priority: 'P3', confidence: 'Low', benchmarks: [],
    note: 'Same thinking as Bucknell. Swimmer times still to be gathered.'
  },
  {
    id: 'loyolamd',
    coach: "Brian Loeffler", coachTitle: "Head Coach",
    email: "bloeffler@loyola.edu",
    staffUrl: "https://loyolagreyhounds.com/sports/swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Jay Venit", assistantEmail: "jvenit@loyola.edu",
    contactNote: "Jay Venit is the only person across all seventeen schools who actually carries the title Recruiting Coordinator. Write to him as well as to Loeffler.", name: 'Loyola University Maryland', division: 'D1', conference: 'Patriot League',
    state: 'MD', country: 'USA', priority: 'P3', confidence: 'Low', benchmarks: [],
    note: 'Same thinking as Bucknell. Swimmer times still to be gathered.'
  },
  {
    id: 'hamilton',
    coach: "John Geissinger", coachTitle: "Head Coach",
    email: "jgeissin@hamilton.edu",
    staffUrl: "https://athletics.hamilton.edu/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Ted Mebust", assistantEmail: "tmebust@hamilton.edu",
    contactNote: "", name: 'Hamilton College', division: 'D3', conference: 'NESCAC',
    state: 'NY', country: 'USA', priority: 'P3', confidence: 'Low', benchmarks: [],
    note: 'Same thinking as Bucknell. Swimmer times still to be gathered.'
  }
];

// Nothing above has a confirmed contact yet. Every record gets the same empty
// contact fields, so the shape is identical whether it was seeded or imported,
// and nothing can be sent until someone fills them in from the school's site.
const CONTACT_FIELDS = {
  coach: '', coachTitle: '', email: '', staffUrl: '', verified: false, verifiedOn: '',
  assistant: '', assistantEmail: '', contactNote: '',
  // The working columns. This is what turns the board into a record of what
  // was actually done, rather than a snapshot of one afternoon's research.
  status: 'Not contacted', lastContact: '', coachReply: '', questionnaire: '',
  nextAction: '', sourceUrl: '', notes: '', benchmarksCheckedOn: ''
};

function aidFor(division) {
  return AID[division] || '';
}

function seedSchools() {
  return SCHOOLS.map(function (s) {
    return Object.assign({}, CONTACT_FIELDS, s, {
      benchmarks: s.benchmarks || [],
      workingTarget: s.workingTarget || {},
      athleticAid: aidFor(s.division)
    });
  });
}

// A school is sendable only when someone confirmed the address against the
// school's own staff directory. This is the gate the send function checks.
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
  if (division !== 'D1' && division !== 'D2' && division !== 'D3' && division !== 'NAIA') {
    errors.push('Division must be D1, D2, D3 or NAIA.');
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
      country: String(input.country || 'USA').trim(),
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
// full name, ie, "canisius-university", while the board already holds
// "canisius". Matching on id alone would quietly create a second Canisius,
// and Luke would end up emailing one of them and tracking the other.
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
  SCHOOLS: SCHOOLS,
  AID: AID,
  aidFor: aidFor,
  seedSchools: seedSchools,
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
