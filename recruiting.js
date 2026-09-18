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
      message: 'A ' + rule.division + ' coach is not bound by the NCAA calendar and can reply now.' +
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
//
// Rewritten 18 September 2026 because the first version read like a form
// letter, which is fatal. Coaches described inboxes in the hundreds to
// thousands, and the thing that gets an email deleted is that it could have
// been sent to two hundred programmes.
//
// What changed, and why each one:
//
// "My name is Luke Hammond" is the deadest opening in email and the signature
// already says who he is. "I am writing because I am interested in" announces
// the obvious. Both gone.
//
// The Junior Trials gap came off every time. A US head coach carries his own
// standards and a Canadian cut is noise to him. Andrew made that call for the
// page and it was just as true here.
//
// The improvement curve went IN, because it is the strongest thing Luke has
// and the first version left it out entirely. Coaches named rate of
// improvement as one of two swimming criteria. A minute and nine seconds off
// a 400 free in three years says more than the 4:10 does.
//
// And it sounds like a fifteen year old now, not a solicitor. He is writing
// to a coach about swimming, not filing something.
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

  const bests = swim.personalBests(results);
  const rankings = (input.rankings && Object.keys(input.rankings).length)
    ? input.rankings
    : seedRankingsFrom(swimmer);

  // His events, strongest first by points, one row per event.
  const ranked = swim.rankedByPoints(results, 5, true);

  const lines = [];
  lines.push(school && school.coach ? 'Dear Coach ' + lastName(school.coach) + ',' : 'Dear Coach,');
  lines.push('');

  const where = swimmer.city + ', ' + swimmer.province;
  const named = (school && school.name) ? school.name : 'your programme';
  lines.push('I\u2019m a distance freestyler from ' + where + ', Canada. I swim for ' +
    swimmer.club + ' and I\u2019m class of ' + swimmer.classOf + '.');
  lines.push('');
  // Why THIS programme. A line the coach can tell was written for him.
  //
  // Anything Andrew writes himself wins. Failing that, this is built from the
  // programme's own conference times, which is real homework rather than
  // flattery, ie, it says what their distance group actually swam and where
  // Luke sits against it. A coach can check every number in it.
  lines.push(school && school.personalNote
    ? school.personalNote
    : programmeLine(swim, school, results, named));
  lines.push('');

  lines.push('Where I am right now:');
  lines.push('');
  ranked.forEach(function (best) {
    const rank = rankings[best.event];
    lines.push('  ' + pad(best.name + ' ' + best.course, 16) + padLeft(best.time, 9) +
      (rank ? '   #' + rank.rank + ' in Canada for my age' : ''));
  });
  lines.push('');

  // The curve. Its own paragraph, because it is the argument.
  const lead = ranked[0];
  if (lead) {
    const curve = swim.progression(results, lead.distance, lead.stroke, lead.course);
    if (curve && curve.seasons.length > 1) {
      lines.push('The ' + spoken(lead) + ' is my main event. In ' +
        curve.seasons[0].season + ' I swam ' + curve.seasons[0].time + ' in it. I\u2019ve taken ' +
        plainGap(swim, curve.totalDrop) + ' off since' +
        (curve.everySeason ? ', and I\u2019ve been faster every season' : '') + '.');

      // A second event improving the same way is what turns one good curve into
      // a swimmer. Only said when it is true.
      const other = ranked.filter(function (r) { return r.stroke !== 'free'; })[0];
      if (other) {
        const otherCurve = swim.progression(results, other.distance, other.stroke, other.course);
        if (otherCurve && otherCurve.everySeason && otherCurve.seasons.length > 1) {
          lines.push('Same in the ' + spoken(other) + ', where I\u2019ve gone from ' +
            otherCurve.seasons[0].time + ' to ' + otherCurve.current.time + '.');
        }
      }
      lines.push('');
    }
  }

  if (swimmer.training) {
    lines.push(swimmer.training);
  }
  if (swimmer.academics && swimmer.academics.gpa) {
    // The school itself, not only the swimming. A coach is recruiting someone
    // who has to get in and stay in, and every coach interviewed said academic
    // strength is what lets them stretch a small pot of money further.
    lines.push('School matters to me too. I\u2019m at ' + swimmer.academics.gpa + ' out of ' +
      swimmer.academics.gpaScale + ', and I\u2019m interested in ' +
      (swimmer.academics.interestsShort || listOut(swimmer.academics.interests).toLowerCase()) +
      '. I\u2019d want a place where I can do that properly and swim, not one or the other' +
      (school && school.academicNote ? ', and ' + school.academicNote : '') + '.');
  }
  lines.push('');

  const link = profileUrl + (school && school.id
    ? (profileUrl.indexOf('?') === -1 ? '?' : '&') + 'c=' + encodeURIComponent(school.id)
    : '');
  lines.push('Everything I\u2019ve swum is here, and it updates after every meet:');
  lines.push(link);
  lines.push('');

  if (swimmer.coach) {
    lines.push('My coach ' + swimmer.coach + ' would be glad to talk to you about me.');
    lines.push('');
  }

  const division = String((school && school.division) || 'D1').toUpperCase();
  const window = contactWindow(CONTACT_RULES[division] ? division : 'D1', swimmer.classOf, today);
  if (window && !window.open) {
    lines.push('I know you can\u2019t reply until ' + friendlyDate(window.replyDate) +
      '. I\u2019d rather you had my times before then than after.');
    lines.push('');
  }

  lines.push(swimmer.name);
  lines.push(swimmer.club + ' \u00b7 ' + where);
  if (swimmer.contact && swimmer.contact.email) lines.push(swimmer.contact.email);
  if (swimmer.swimcloud) lines.push(swimmer.swimcloud);

  const subject = swimmer.name + ' \u00b7 ' + swimmer.classOf + ' distance free \u00b7 ' +
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

// The "why your programme" sentence, built from what their swimmers actually
// did. Their times come from conference results, so this is checkable, and a
// coach reading his own group's times back knows the sender looked.
//
// Returns a plain line when there is nothing researched, rather than inventing
// enthusiasm. A sentence that could have been sent to anyone is the thing that
// gets an email deleted.
function programmeLine(swim, school, results, named) {
  const benchmarks = (school && school.benchmarks) || [];
  if (!benchmarks.length) {
    return 'I\u2019ve been reading about ' + named + ' and I\u2019d like to swim there.';
  }

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
  if (!usable) {
    return 'I\u2019ve been reading about ' + named + ' and I\u2019d like to swim there.';
  }

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

// A gap said the way a person says it, ie, "a minute and nine seconds", not
// "-1:09.67". Nobody reads a signed duration aloud, and nobody writes "1
// minute" in a sentence either.
const SPELLED = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
  'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen', 'twenty'];

// Small numbers are spelled out in a sentence. "a minute and 10 seconds" reads
// like a machine wrote it, which is the whole problem this rewrite is fixing.
function spell(n) {
  return n <= 20 ? SPELLED[n] : String(n);
}

function plainGap(swim, hundredths) {
  const total = Math.abs(Math.round(hundredths / 100));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (!minutes) return spell(seconds) + ' seconds';
  const m = (minutes === 1 ? 'a minute' : spell(minutes) + ' minutes');
  if (!seconds) return m;
  return m + ' and ' + spell(seconds) + (seconds === 1 ? ' second' : ' seconds');
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
  contactWindow: contactWindow,
  friendlyDate: friendlyDate,
  draftEmail: draftEmail,
  plainGap: plainGap,
  spoken: spoken,
  programmeLine: programmeLine,
  useConverter: useConverter,
  lastName: lastName,
  listOut: listOut
};

if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof window !== 'undefined') window.Recruiting = api;

})();
