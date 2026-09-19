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
// NCAA Division II. Resolved 19 September 2026 by reading the NCAA's own
// 2026-27 Division II Coaches Off-Campus Recruiting Guide. Under the freshman
// and sophomore heading it says, in full: "Athletically related recruiting
// materials may be sent at anytime." The 15 June gate in that guide covers
// only in-person off-campus contact and official visits. Division II dropped
// the communication restriction on 1 August 2024.
//
// This was the app's most expensive wrong answer. Nine programmes on the board
// are Division II and the app was telling Andrew none of them could write back
// until June 2027. They can write back today.
//
// NCAA Division III. Resolved the same day from the Division III Manual
// itself, Bylaw 13.02.10.1: "There are no restrictions on the timing for
// electronic communication (e.g., telephone call, electronic mail, Instant
// Messenger, text messages or facsimiles) to prospective student-athletes."
// Bylaw 13.4.1.1 says the same of recruiting materials, and 13.02.10.2 permits
// a telephone call at any time.
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
    rule: 'A coach may write, call and text at any time. Meeting in person off campus, and any expense-paid visit, waits until 15 June after sophomore year.',
    monthDay: null,
    yearsBeforeGraduation: null,
    open: true,
    // The half that is still on a calendar. Kept separate from `open` so the
    // app can say "write now, visit later" rather than flattening the two.
    inPersonMonthDay: '06-15',
    inPersonYearsBeforeGraduation: 2,
    confirmed: true,
    source: 'NCAA 2026-27 Division II Coaches Off-Campus Recruiting Guide, freshman and sophomore heading: "Athletically related recruiting materials may be sent at anytime." The 15 June heading in the same guide lists only in-person off-campus contacts and official visits.',
    recorded: '2026-09-19'
  },
  D3: {
    division: 'NCAA Division III',
    rule: 'A coach may write, call, text or message at any time. There is no date.',
    monthDay: null,
    yearsBeforeGraduation: null,
    open: true,
    confirmed: true,
    source: 'NCAA Division III Manual, Bylaw 13.02.10.1: "There are no restrictions on the timing for electronic communication (e.g., telephone call, electronic mail, Instant Messenger, text messages or facsimiles) to prospective student-athletes." Bylaw 13.4.1.1 says the same of recruiting materials, and 13.02.10.2 permits a telephone call at any time.',
    recorded: '2026-09-19'
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
    confirmed: true,
    source: 'U SPORTS Policy 40.10.7 Recruiting Regulations 2026-2027, section 40.10.7.4.2: representatives and prospective student-athletes "may contact each other at any time" until the prospect becomes a confirmed recruit elsewhere. No age gate, no grade gate, no calendar date.',
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

// The date a coach in this division may first meet Luke off campus or pay for
// a visit. Only Division II has one of these while still being open to write.
function inPersonDateFor(division, classOf) {
  const rule = CONTACT_RULES[division];
  if (!rule || !rule.inPersonMonthDay) return null;
  if (!Number.isFinite(Number(classOf))) return null;
  return (Number(classOf) - rule.inPersonYearsBeforeGraduation) + '-' + rule.inPersonMonthDay;
}

function openMessage(rule, division, classOf) {
  const visit = inPersonDateFor(division, classOf);
  if (visit) {
    return 'A ' + rule.division + ' coach can reply now. Meeting in person off campus, ' +
      'and any expense-paid visit, waits until ' + friendlyDate(visit) + '.';
  }
  return 'A ' + rule.division + ' coach is not bound by the NCAA calendar and can reply now.';
}

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
      // Division II is open for writing and closed for visiting, so the date
      // still matters there even though a coach may reply today.
      inPersonDate: inPersonDateFor(division, classOf),
      message: openMessage(rule, division, classOf) +
        (rule.confirmed ? '' : ' Not yet confirmed from that body\u2019s own rules.')
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

// The interest email for one school.
//
// Rewritten 18 September 2026 to Andrew's own draft. He wrote the letter he
// wants sent, so the wording here is his, not a machine's idea of warm. What
// this file adds is that every fact in it is read from the live data rather
// than typed once and left to rot, ie, the times, the rankings, the events,
// the seasons, the GPA and the club all come from the profile. Enter a new
// swim in the back end and every draft changes with it.
//
// Two of his earlier rules are deliberately overruled by that draft, and both
// were his call to make. It opens with "My name is Luke Hammond" and it closes
// by thanking the coach for reading. He is fifteen and writing to an adult he
// has never met. Polite beats clever.
function draftEmail(input) {
  const swim = input.swim;
  const swimmer = input.swimmer;
  const school = input.school;
  const results = input.results || [];
  const today = input.today;
  const profileUrl = input.profileUrl || '';

  const warnings = [];
  if (!school || !school.email) warnings.push('No coach email on file for this school.');
  if (!profileUrl) warnings.push('No profile link set, so the coach has nowhere to go.');
  // The single most useful warning in the app. A coach who cannot tell why you
  // wrote to HIM deletes it, and no template can supply that.
  if (!school || !school.personalNote) {
    warnings.push('Nothing specific to this programme. Add a line in the back end saying why ' +
      'this school, ie, something you actually know about it. A coach who cannot tell why you ' +
      'wrote to him and not to two hundred others will not reply.');
  }

  const rankings = (input.rankings && Object.keys(input.rankings).length)
    ? input.rankings
    : seedRankingsFrom(swimmer);

  // His events, strongest first by points, one row per event.
  const ranked = swim.rankedByPoints(results, 5, true);
  const named = (school && school.name) ? school.name : 'your programme';
  const lines = [];

  lines.push(school && school.coach ? 'Hi Coach ' + lastName(school.coach) + ',' : 'Hi Coach,');
  lines.push('');

  lines.push('My name is ' + swimmer.name + '. I’m a Class of ' + swimmer.classOf +
    ' swimmer from ' + swimmer.city + ', ' + swimmer.province + ', Canada, and I currently ' +
    'train with the ' + swimmer.club + '.');
  lines.push('');

  lines.push('I’m reaching out because I’ve been learning more about ' + named +
    ' and your swim program. I’m very interested in finding a university where I can ' +
    'continue developing as a swimmer while also being part of a strong academic and team ' +
    'environment, and ' + named + ' is a school I wanted to introduce myself to early in ' +
    'the process.');
  lines.push('');

  // Why THIS programme, in one sentence the coach can tell was written for him.
  // Anything Andrew writes himself wins. Failing that it is built from the
  // programme's own conference times, which is homework rather than flattery.
  // Silent when there is neither, because a sentence that could have gone to
  // two hundred programmes is worse than no sentence.
  const why = (school && school.personalNote)
    ? school.personalNote
    : programmeLine(swim, school, results, named, true);
  if (why) {
    lines.push(why);
    lines.push('');
  }

  lines.push('My primary events are ' + eventsSentence(ranked) +
    '. Some of my current best times are:');
  lines.push('');
  ranked.forEach(function (best) {
    const rank = rankings[best.event];
    lines.push(best.name + ' ' + best.course + ': ' + best.time +
      (rank ? ', #' + rank.rank + ' in Canada for my age' : ''));
  });
  lines.push('');

  // The curve. Its own paragraph, because it is the argument. A minute and ten
  // seconds off a 400 free in three years says more than the 4:10 does.
  const curveLine = progressParagraph(swim, results, ranked);
  if (curveLine) {
    lines.push(curveLine);
    lines.push('');
  }

  if (swimmer.training) {
    lines.push(swimmer.training + ' I enjoy the distance events and the training that comes ' +
      'with them, and I’m looking for a university program where I can continue to ' +
      'develop and contribute to the team.');
    lines.push('');
  }

  if (swimmer.academics && swimmer.academics.gpa) {
    // The school itself, not only the swimming. Every coach interviewed said
    // academic strength is what lets them stretch a small pot of money further.
    lines.push('Academics are also very important to me. I currently have a ' +
      swimmer.academics.gpa + ' GPA on a ' + swimmer.academics.gpaScale +
      ' scale and I’m particularly interested in studying ' +
      (swimmer.academics.interestsShort || listOut(swimmer.academics.interests).toLowerCase()) +
      '. Finding the right combination of academics, athletics and university experience ' +
      'will be a big part of my decision' +
      (school && school.academicNote ? ', and ' + school.academicNote : '') + '.');
    lines.push('');
  }

  // The link carries the school's own code, so a click can be told apart later.
  const link = profileUrl + (school && school.id
    ? (profileUrl.indexOf('?') === -1 ? '?' : '&') + 'c=' + encodeURIComponent(school.id)
    : '');
  lines.push('I’ve put together a swimmer profile that includes my current times and ' +
    'will continue to update automatically as I compete:');
  lines.push('');
  lines.push(link);
  lines.push('');

  if (swimmer.swimcloud) {
    lines.push('My SwimCloud profile is also available here:');
    lines.push('');
    lines.push(swimmer.swimcloud);
    lines.push('');
  }

  if (swimmer.coach) {
    lines.push('My coach, ' + swimmer.coach + ', would also be happy to speak with you about ' +
      'my swimming, training and development.');
    lines.push('');
  }

  lines.push('I know I’m still early in the recruiting process, but I wanted to introduce ' +
    'myself and let you know that I’m genuinely interested in learning more about ' +
    named + ' and your program.');
  lines.push('');
  lines.push('Thank you for taking the time to read my email. I hope I’ll have the ' +
    'opportunity to connect with you as I continue through the recruiting process.');
  lines.push('');

  lines.push(swimmer.name);
  lines.push('Class of ' + swimmer.classOf);
  lines.push(swimmer.club);
  lines.push(swimmer.city + ', ' + swimmer.province + ', Canada');
  if (swimmer.contact && swimmer.contact.email) lines.push(swimmer.contact.email);

  const division = String((school && school.division) || 'D1').toUpperCase();
  const window = contactWindow(CONTACT_RULES[division] ? division : 'D1', swimmer.classOf, today);

  const subject = swimmer.name + ' · ' + swimmer.classOf + ' distance free · ' +
    (ranked[0] ? ranked[0].name + ' ' + ranked[0].time : 'Canada');

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

// "the 400, 800 and 1500 freestyle, along with the 200 free and 400 IM".
//
// Built rather than typed, because his event profile will move. The split is
// the distance freestyles first, since that is his identity, then everything
// else. Said the way a swimmer says it out loud.
function eventsSentence(ranked) {
  const distanceFree = ranked
    .filter(function (r) { return r.stroke === 'free' && r.distance >= 400; })
    .sort(function (a, b) { return a.distance - b.distance; });
  const rest = ranked.filter(function (r) { return distanceFree.indexOf(r) === -1; });

  const head = distanceFree.length
    ? 'the ' + listOut(distanceFree.map(function (r) { return String(r.distance); })) + ' freestyle'
    : '';
  const tail = rest.length
    ? 'the ' + listOut(rest.map(function (r) { return spoken(r); }))
    : '';

  if (head && tail) return head + ', along with ' + tail;
  return head || tail;
}

// The improvement paragraph, from the two events with a real curve behind them.
// Only claims "every season" when that is literally true of the data.
function progressParagraph(swim, results, ranked) {
  const lead = ranked[0];
  if (!lead) return '';
  const curve = swim.progression(results, lead.distance, lead.stroke, lead.course);
  if (!curve || curve.seasons.length < 2) return '';

  let text = 'One of the things I’m most proud of is the progress I’ve made over the ' +
    'past few seasons. In ' + curve.seasons[0].season + ', my ' + spoken(lead) + ' was ' +
    curve.seasons[0].time + '. I’ve since brought that down to ' + curve.current.time +
    (curve.everySeason ? ' and have continued to improve each season' : '') + '.';

  // A second event improving the same way is what turns one good curve into a
  // swimmer. Only said when it is true.
  const other = ranked.filter(function (r) { return r.stroke !== 'free'; })[0];
  if (other) {
    const otherCurve = swim.progression(results, other.distance, other.stroke, other.course);
    if (otherCurve && otherCurve.everySeason && otherCurve.seasons.length > 1) {
      text += ' My ' + spoken(other) + ' has followed a similar path, improving from ' +
        otherCurve.seasons[0].time + ' to ' + otherCurve.current.time + '.';
    }
  }
  return text;
}

// The "why your programme" sentence, built from what their swimmers actually
// did. Their times come from conference results, so this is checkable, and a
// coach reading his own group's times back knows the sender looked.
//
// Returns a plain line when there is nothing researched, rather than inventing
// enthusiasm. A sentence that could have been sent to anyone is the thing that
// gets an email deleted.
function programmeLine(swim, school, results, named, silent) {
  const generic = silent
    ? ''
    : 'I\u2019ve been reading about ' + named + ' and I\u2019d like to swim there.';
  const benchmarks = (school && school.benchmarks) || [];
  if (!benchmarks.length) return generic;

  const bests = swim.personalBests(results);
  const yards = {};
  Object.keys(bests).forEach(function (id) {
    const converted = input_convert(swim, bests[id]);
    if (converted) yards[converted.event] = converted;
  });

  // The distance event where we know both their times and his.
  const usable = benchmarks.filter(function (b) {
    return yards[b.event] && (b.time || (b.times && b.times.length));
  })[0];
  if (!usable) return generic;

  const theirs = usable.times && usable.times.length
    ? usable.times[0] + ' to ' + usable.times[usable.times.length - 1]
    : usable.time;
  const event = usable.event.replace('-SCY', '').replace('-free', ' free').replace('-im', ' IM');

  // Where he actually sits decides how the sentence ends. Saying "a group I
  // could train with" when he is five seconds off the slowest of them is the
  // kind of overclaim a coach checks in ten seconds and remembers.
  const mine = yards[usable.event].hundredths;
  const slowest = swim.parseTime(usable.times && usable.times.length
    ? usable.times[usable.times.length - 1] : usable.time);
  const inside = Number.isFinite(slowest) && mine <= slowest;

  return 'I\u2019ve looked at what your ' + event.trim() + ' group has been doing, ' +
    theirs + ' at conference, and my converted ' + event.trim() + ' is ' +
    yards[usable.event].time + '. ' +
    (inside
      ? 'That looks like a group I could train in rather than sit behind, which is what I\u2019m after.'
      : 'I know that puts me behind them, and closing it is exactly what I\u2019m working on this season.');
}

// The conversion lives in convert.js, which recruiting.js does not import, so
// it is passed in by the caller when available. Kept deliberately explicit
// rather than reaching for a global.
let input_convert = function () { return null; };
function useConverter(fn) { if (typeof fn === 'function') input_convert = fn; }

// An event said aloud. Lowercasing the whole name turns the 400 IM into the
// "400 im", which is the sort of thing that makes a reader stop.
function spoken(result) {
  return result.distance + ' ' + (result.stroke === 'im' ? 'IM' : result.stroke);
}

function seedRankingsFrom(swimmer) {
  const out = {};
  (swimmer.primary || []).forEach(function (p) {
    if (!p.rank) return;
    out[p.distance + '-' + p.stroke + '-' + p.course] = { rank: p.rank };
  });
  return out;
}

function pad(text, width) {
  let s = String(text);
  while (s.length < width) s += ' ';
  return s;
}

function padLeft(text, width) {
  let s = String(text);
  while (s.length < width) s = ' ' + s;
  return s;
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
  inPersonDateFor: inPersonDateFor,
  contactWindow: contactWindow,
  friendlyDate: friendlyDate,
  draftEmail: draftEmail,
  spoken: spoken,
  eventsSentence: eventsSentence,
  programmeLine: programmeLine,
  useConverter: useConverter,
  lastName: lastName,
  listOut: listOut
};

if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof window !== 'undefined') window.Recruiting = api;

})();
