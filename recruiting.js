// recruiting.js
// Two jobs. When a coach is allowed to write back, and what the email says.
//
// The first job matters more than it looks. A sophomore who emails thirty
// programmes and hears nothing will conclude he is not wanted. The real reason
// is that the coach is not permitted to reply yet. The app says so, on the
// screen, before he sends. That is the whole point of putting the rule in code
// rather than in a help page.

// NCAA Division I. Coaches may not conduct recruiting communication, including
// replying to an athlete's email, until 15 June following the athlete's
// sophomore year. The athlete may write at any time.
// Source: NCAA Division I recruiting calendar, swimming and diving.
// Recorded 18 September 2026.
//
// NCAA Division II. Published guidance disagrees. Some sources give the same
// 15 June after sophomore year date, others say D2 coaches may call and write
// at any time with only in-person contact restricted. Until the NCAA Division
// II recruiting guide is read directly, the app uses the later, safer date and
// marks it unconfirmed, ie, it never promises a reply that may not come.
// Wrapped in a function on purpose. The browser runs every script tag in ONE
// shared scope, so two files that both declare `const api` at the top level
// throw "Identifier 'api' has already been declared" and every script after
// the first one dies silently. Node gives each file its own scope, so the
// whole test suite passed while the live site was broken. browser.test.js now
// loads these the way a browser does, which is the only way to see it.
(function () {

const CONTACT_RULES = {
  D1: {
    division: 'NCAA Division I',
    rule: 'A coach may not reply until 15 June after sophomore year.',
    monthDay: '06-15',
    yearsBeforeGraduation: 2,
    confirmed: true,
    source: 'NCAA Division I recruiting calendar, swimming and diving',
    recorded: '2026-09-18'
  },
  D2: {
    division: 'NCAA Division II',
    rule: 'A coach may not reply until 15 June after sophomore year.',
    monthDay: '06-15',
    yearsBeforeGraduation: 2,
    confirmed: false,
    source: 'Published guidance disagrees. Using the later date until the NCAA Division II recruiting guide is read directly.',
    recorded: '2026-09-18'
  },
  D3: {
    division: 'NCAA Division III',
    rule: 'A coach may not reply until 15 June after sophomore year.',
    monthDay: '06-15',
    yearsBeforeGraduation: 2,
    confirmed: false,
    source: 'Division III rules are widely described as far looser than Division I, with little or no restriction on when a coach may make contact. Not yet read from the NCAA Division III manual, so the app uses the later, safer date and promises nothing it has not confirmed.',
    recorded: '2026-09-18'
  },
  NAIA: {
    division: 'NAIA',
    rule: 'A coach may not reply until 15 June after sophomore year.',
    monthDay: '06-15',
    yearsBeforeGraduation: 2,
    confirmed: false,
    source: 'The NAIA is a separate body with its own rules and is generally described as having far fewer restrictions. Not yet confirmed from NAIA material, so the safer date stands.',
    recorded: '2026-09-18'
  },
  // Canadian programmes are not governed by the NCAA at all, so its calendar
  // simply does not apply. That is a structural fact rather than a rule to be
  // looked up. What has NOT been confirmed is whether U SPORTS imposes any
  // contact rule of its own, so the wording promises nothing beyond what is
  // actually known.
  USPORTS: {
    division: 'U SPORTS',
    rule: 'The NCAA contact calendar does not apply to a Canadian programme.',
    monthDay: null,
    yearsBeforeGraduation: null,
    open: true,
    confirmed: false,
    source: 'U SPORTS is not an NCAA member, so the NCAA calendar does not bind it. Whether U SPORTS sets a contact rule of its own has not yet been confirmed from its own material.',
    recorded: '2026-09-18'
  },
  CCAA: {
    division: 'CCAA',
    rule: 'The NCAA contact calendar does not apply to a Canadian programme.',
    monthDay: null,
    yearsBeforeGraduation: null,
    open: true,
    confirmed: false,
    source: 'The CCAA is not an NCAA member. Its own rules have not been confirmed.',
    recorded: '2026-09-18'
  }
};

// The date a coach in this division may first write back.
function replyDateFor(division, classOf) {
  const rule = CONTACT_RULES[division];
  if (!rule || rule.open) return null;
  if (!Number.isFinite(Number(classOf))) return null;
  return (Number(classOf) - rule.yearsBeforeGraduation) + '-' + rule.monthDay;
}

// Where the athlete stands today against that date.
// today is passed in rather than read from the clock, so this is testable and
// so a page rendered at a coach's desk agrees with a page rendered here.
function contactWindow(division, classOf, today) {
  const rule = CONTACT_RULES[division];
  if (!rule) return null;

  // A programme with no calendar over it is open now. Saying so matters: it is
  // the difference between waiting nine months and writing this week.
  if (rule.open) {
    return {
      division: rule.division,
      replyDate: null,
      open: true,
      daysAway: 0,
      confirmed: rule.confirmed,
      rule: rule.rule,
      source: rule.source,
      message: 'A ' + rule.division + ' coach is not bound by the NCAA calendar and can reply now.'
    };
  }

  const date = replyDateFor(division, classOf);
  if (!date) return null;

  const open = String(today) >= date;
  const daysAway = open ? 0 : Math.round(
    (Date.parse(date + 'T12:00:00Z') - Date.parse(String(today) + 'T12:00:00Z')) / 86400000
  );

  return {
    division: rule.division,
    replyDate: date,
    open: open,
    daysAway: daysAway,
    confirmed: rule.confirmed,
    rule: rule.rule,
    source: rule.source,
    // What to actually tell the swimmer, in his words not the NCAA's.
    message: open
      ? 'Coaches at ' + rule.division + ' programmes may reply from now on.'
      : 'A ' + rule.division + ' coach cannot reply until ' + friendlyDate(date) +
        '. He can still read this, and many keep a file. Silence before that date is the rule, not an answer.'
  };
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function friendlyDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return String(iso || '');
  return Number(m[3]) + ' ' + MONTHS[Number(m[2]) - 1] + ' ' + m[1];
}

// A short, plain line of evidence, ie, "400 Free LCM 4:10.86, 2 seconds off
// the Canadian Junior Trials cut". This is what a coach skims for.
function timeLine(swim, best, gap) {
  let line = best.name + ' ' + best.course + '  ' + best.time;
  if (gap) {
    line += gap.made
      ? '  (under the ' + 'Junior Trials cut)'
      : '  (' + swim.formatGap(gap.behindBy).replace('+', '') + ' off the Junior Trials cut)';
  }
  return line;
}

// The interest email for one school.
// Everything is assembled from data already on the page, so the email and the
// profile can never drift apart. Returns { subject, body, to, warnings }.
function draftEmail(input) {
  const swim = input.swim;
  const standards = input.standards;
  const swimmer = input.swimmer;
  const school = input.school;
  const results = input.results || [];
  const today = input.today;
  const profileUrl = input.profileUrl || '';

  const warnings = [];
  if (!school || !school.email) warnings.push('No coach email on file for this school.');
  if (!profileUrl) warnings.push('No profile link set, so the coach has nowhere to go.');

  const bests = swim.personalBests(results);
  const headlineTimes = (swimmer.primary || []).map(function (p) {
    const id = swim.eventId(p.distance, p.stroke, p.course);
    const best = bests[id];
    if (!best) return null;
    const gap = standards.gapToCut(swim.parseTime, best.hundredths, 'can-jr-trials', id);
    return { line: timeLine(swim, best, gap), rank: p.rank, rankBasis: p.rankBasis, name: best.name };
  }).filter(Boolean);

  // Use the school's own division. Reading every programme as Division I told
  // a Canadian coach he could not reply for another nine months, which is not
  // true of him and is the opposite of useful.
  const division = String((school && school.division) || 'D1').toUpperCase();
  const window = contactWindow(CONTACT_RULES[division] ? division : 'D1', swimmer.classOf, today);

  const link = profileUrl + (school && school.id
    ? (profileUrl.indexOf('?') === -1 ? '?' : '&') + 'c=' + encodeURIComponent(school.id)
    : '');

  const fastest = headlineTimes[0];
  const subject = swimmer.name + ' | Class of ' + swimmer.classOf + ' distance freestyle | ' +
    (fastest ? fastest.name + ' ' + (bests[swim.eventId(swimmer.primary[0].distance, swimmer.primary[0].stroke, swimmer.primary[0].course)] || {}).time : 'Canada');

  const greeting = school && school.coach ? 'Dear Coach ' + lastName(school.coach) + ',' : 'Dear Coach,';

  const lines = [];
  lines.push(greeting);
  lines.push('');
  lines.push('My name is ' + swimmer.name + '. I am a distance freestyler with ' + swimmer.club +
    ' in ' + swimmer.city + ', ' + swimmer.province + ', and I graduate in ' + swimmer.classOf + '.' +
    ' I am writing because I am interested in swimming for ' + (school && school.name ? school.name : 'your programme') + '.');
  lines.push('');
  lines.push('Long course bests:');
  headlineTimes.forEach(function (t) {
    lines.push('  ' + t.line + (t.rank ? '  [ranked #' + t.rank + ' in Canada for age]' : ''));
  });
  lines.push('');
  if (swimmer.academics && swimmer.academics.gpa) {
    lines.push('Academically I carry a ' + swimmer.academics.gpa + ' of ' + swimmer.academics.gpaScale +
      ' GPA, and I am interested in studying ' + listOut(swimmer.academics.interests) + '.');
  }
  (swimmer.recognition || []).forEach(function (r) {
    lines.push(r.label + ': ' + r.detail + '.');
  });
  lines.push('');
  lines.push('My full profile, with every time and the meet it was swum at, is here:');
  lines.push(link);
  lines.push('');
  lines.push('It updates as I race, so it is always current. My club coach is ' + swimmer.coach +
    ' and he is happy to speak with you.');
  lines.push('');
  if (window && !window.open) {
    lines.push('I understand you may not be able to reply until ' + friendlyDate(window.replyDate) +
      '. I wanted you to have my times before then.');
    lines.push('');
  }
  lines.push('Thank you for your time.');
  lines.push('');
  lines.push(swimmer.name);
  lines.push(swimmer.club + ', ' + swimmer.city + ', ' + swimmer.province + ', ' + swimmer.country);
  if (swimmer.swimcloud) lines.push(swimmer.swimcloud);

  return {
    to: (school && school.email) || '',
    schoolId: (school && school.id) || '',
    schoolName: (school && school.name) || '',
    subject: subject,
    body: lines.join('\n'),
    link: link,
    window: window,
    warnings: warnings
  };
}

function lastName(full) {
  const parts = String(full || '').trim().split(/\s+/);
  return parts.length ? parts[parts.length - 1] : '';
}

function listOut(items) {
  const list = (items || []).filter(Boolean);
  if (list.length === 0) return '';
  if (list.length === 1) return list[0];
  return list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1];
}

const api = {
  CONTACT_RULES: CONTACT_RULES,
  replyDateFor: replyDateFor,
  contactWindow: contactWindow,
  friendlyDate: friendlyDate,
  draftEmail: draftEmail,
  lastName: lastName,
  listOut: listOut
};

if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof window !== 'undefined') window.Recruiting = api;

})();
