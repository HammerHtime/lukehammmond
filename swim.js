// swim.js
// The swimming data core. Events, courses, times, and personal bests.
// Pure functions only. No browser, no network. This file is the one place
// that knows how a swim time is read, written, and compared.

// The three racing courses.
// SCY is short course yards, ie, the 25 yard pool the NCAA races in.
// SCM is short course metres, ie, the 25 metre pool.
// LCM is long course metres, ie, the 50 metre Olympic pool.
const COURSES = ['SCY', 'SCM', 'LCM'];

const COURSE_LABEL = {
  SCY: 'Short course yards',
  SCM: 'Short course metres',
  LCM: 'Long course metres'
};

const STROKES = ['free', 'back', 'breast', 'fly', 'im'];

const STROKE_LABEL = {
  free: 'Freestyle',
  back: 'Backstroke',
  breast: 'Breaststroke',
  fly: 'Butterfly',
  im: 'Individual Medley'
};

const STROKE_SHORT = {
  free: 'Free',
  back: 'Back',
  breast: 'Breast',
  fly: 'Fly',
  im: 'IM'
};

// Which distances are actually raced, per course. The distance lists differ.
// Yards has the 500, 1000 and 1650 free. Metres has the 400, 800 and 1500.
// Long course has no 100 IM.
const DISTANCES = {
  SCY: { free: [50, 100, 200, 500, 1000, 1650], back: [50, 100, 200], breast: [50, 100, 200], fly: [50, 100, 200], im: [100, 200, 400] },
  SCM: { free: [50, 100, 200, 400, 800, 1500], back: [50, 100, 200], breast: [50, 100, 200], fly: [50, 100, 200], im: [100, 200, 400] },
  LCM: { free: [50, 100, 200, 400, 800, 1500], back: [50, 100, 200], breast: [50, 100, 200], fly: [50, 100, 200], im: [200, 400] }
};

// A stable id for one event in one course, ie, "200-free-LCM".
function eventId(distance, stroke, course) {
  return distance + '-' + stroke + '-' + course;
}

function eventName(distance, stroke) {
  return distance + ' ' + STROKE_SHORT[stroke];
}

function isRealEvent(distance, stroke, course) {
  const byStroke = DISTANCES[course];
  if (!byStroke) return false;
  const list = byStroke[stroke];
  if (!list) return false;
  return list.indexOf(Number(distance)) !== -1;
}

// Every event, in the order a coach expects to read them, ie, free by
// distance, then back, breast, fly, then the medleys.
function allEvents(course) {
  const out = [];
  STROKES.forEach(function (stroke) {
    const list = (DISTANCES[course] || {})[stroke] || [];
    list.forEach(function (distance) {
      out.push({
        id: eventId(distance, stroke, course),
        distance: distance,
        stroke: stroke,
        course: course,
        name: eventName(distance, stroke),
        label: eventName(distance, stroke) + ' ' + course
      });
    });
  });
  return out;
}

// Times are held as whole hundredths of a second. An integer never drifts,
// and comparing two swims is then just comparing two numbers.
// Accepts "1:58.35", "58.35", "16:38.24", "1:02:03.45".
function parseTime(text) {
  if (typeof text === 'number' && Number.isFinite(text)) {
    return text > 0 ? Math.round(text) : null;
  }
  if (typeof text !== 'string') return null;
  const clean = text.trim();
  if (!clean) return null;
  if (!/^\d{1,2}(:\d{1,2}){0,2}([.,]\d{1,2})?$/.test(clean)) return null;

  const dotted = clean.replace(',', '.');
  const parts = dotted.split(':');
  const secondsPart = parts.pop();
  const seconds = Number(secondsPart);
  if (!Number.isFinite(seconds)) return null;
  if (parts.length && seconds >= 60) return null;

  let total = Math.round(seconds * 100);
  let multiplier = 6000; // one minute in hundredths
  while (parts.length) {
    const unit = Number(parts.pop());
    if (!Number.isFinite(unit)) return null;
    total += unit * multiplier;
    multiplier *= 60;
  }
  return total > 0 ? total : null;
}

// The reverse. Under a minute reads as "25.69". Over reads as "1:58.35".
function formatTime(hundredths) {
  if (!Number.isFinite(hundredths) || hundredths <= 0) return '';
  const cs = Math.round(hundredths);
  const totalSeconds = Math.floor(cs / 100);
  const frac = cs % 100;
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);
  const pad = function (n) { return n < 10 ? '0' + n : String(n); };
  const hs = frac < 10 ? '0' + frac : String(frac);

  if (hours > 0) return hours + ':' + pad(minutes) + ':' + pad(seconds) + '.' + hs;
  if (totalMinutes > 0) return minutes + ':' + pad(seconds) + '.' + hs;
  return seconds + '.' + hs;
}

// A time drop, written the way a swimmer says it, ie, "-1.42".
function formatGap(hundredths) {
  if (!Number.isFinite(hundredths)) return '';
  const sign = hundredths < 0 ? '-' : '+';
  const abs = Math.abs(Math.round(hundredths));
  const seconds = Math.floor(abs / 100);
  const frac = abs % 100;
  const hs = frac < 10 ? '0' + frac : String(frac);
  if (seconds >= 60) return sign + formatTime(abs);
  return sign + seconds + '.' + hs;
}

// One result, cleaned and checked. Returns { ok, result } or { ok:false, errors }.
// Everything that reaches storage goes through here, so the admin screen and
// the pasted importer cannot disagree about what a valid swim looks like.
function normaliseResult(raw) {
  const errors = [];
  const input = raw || {};

  const distance = Number(input.distance);
  const stroke = String(input.stroke || '').toLowerCase();
  const course = String(input.course || '').toUpperCase();

  if (COURSES.indexOf(course) === -1) errors.push('Course must be SCY, SCM or LCM.');
  if (STROKES.indexOf(stroke) === -1) errors.push('Stroke is not one of free, back, breast, fly, im.');
  if (!Number.isFinite(distance) || distance <= 0) errors.push('Distance is missing.');
  if (errors.length === 0 && !isRealEvent(distance, stroke, course)) {
    errors.push(eventName(distance, stroke) + ' is not swum in ' + course + '.');
  }

  const hundredths = parseTime(input.time);
  if (hundredths === null) errors.push('Time is not readable. Use 1:58.35 or 25.69.');

  const date = String(input.date || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.push('Date is missing. Use YYYY-MM-DD.');
  } else if (Number.isNaN(Date.parse(date + 'T12:00:00Z'))) {
    errors.push('Date is not a real date.');
  }

  if (errors.length) return { ok: false, errors: errors };

  return {
    ok: true,
    result: {
      id: eventId(distance, stroke, course) + '-' + date + '-' + hundredths,
      distance: distance,
      stroke: stroke,
      course: course,
      event: eventId(distance, stroke, course),
      name: eventName(distance, stroke),
      time: formatTime(hundredths),
      hundredths: hundredths,
      date: date,
      meet: String(input.meet || '').trim(),
      location: String(input.location || '').trim(),
      // SwimCloud marks some swims with a letter, ie, R for a relay lead-off.
      // We carry the letter through rather than interpret it.
      flag: String(input.flag || '').trim().toUpperCase().slice(0, 2),
      note: String(input.note || '').trim()
    }
  };
}

// The fastest swim in each event, newest first on a tie.
function personalBests(results) {
  const best = {};
  (results || []).forEach(function (r) {
    if (!r || !Number.isFinite(r.hundredths)) return;
    const key = r.event;
    const held = best[key];
    if (!held || r.hundredths < held.hundredths) best[key] = r;
  });
  return best;
}

// Personal bests for one course, in event order, ready to put on the page.
// Every entry carries how much has come off this season, so a coach reading
// the page sees the trajectory, not just the number.
function bestsByCourse(results, course, options) {
  const opts = options || {};
  const since = opts.since || null;
  const bests = personalBests(results);
  const all = results || [];

  return allEvents(course).map(function (ev) {
    const best = bests[ev.id];
    if (!best) return { event: ev, swum: false };

    // The fastest swim in this event from before the cutoff, so "improved by"
    // means improved this season, not improved ever.
    let prior = null;
    if (since) {
      all.forEach(function (r) {
        if (r.event !== ev.id) return;
        if (r.date >= since) return;
        if (!prior || r.hundredths < prior.hundredths) prior = r;
      });
    }

    const swims = all.filter(function (r) { return r.event === ev.id; }).length;

    return {
      event: ev,
      swum: true,
      best: best,
      swims: swims,
      improvedBy: prior ? prior.hundredths - best.hundredths : null,
      priorBest: prior
    };
  });
}

// Which events this swimmer actually races, ranked by how often and how
// recently. It answers "what is he" without anyone having to declare it.
function primaryEvents(results, limit) {
  const counts = {};
  (results || []).forEach(function (r) {
    const key = r.distance + '-' + r.stroke;
    if (!counts[key]) counts[key] = { distance: r.distance, stroke: r.stroke, swims: 0, latest: '' };
    counts[key].swims += 1;
    if (r.date > counts[key].latest) counts[key].latest = r.date;
  });
  return Object.keys(counts)
    .map(function (k) { return counts[k]; })
    .sort(function (a, b) {
      if (b.swims !== a.swims) return b.swims - a.swims;
      return b.latest.localeCompare(a.latest);
    })
    .slice(0, limit || 4)
    .map(function (e) {
      return { distance: e.distance, stroke: e.stroke, name: eventName(e.distance, e.stroke), swims: e.swims };
    });
}

// Results newest first, for the "recent swims" list.
function recentResults(results, limit) {
  return (results || [])
    .slice()
    .sort(function (a, b) {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit || 10);
}

const api = {
  COURSES: COURSES,
  COURSE_LABEL: COURSE_LABEL,
  STROKES: STROKES,
  STROKE_LABEL: STROKE_LABEL,
  STROKE_SHORT: STROKE_SHORT,
  DISTANCES: DISTANCES,
  eventId: eventId,
  eventName: eventName,
  isRealEvent: isRealEvent,
  allEvents: allEvents,
  parseTime: parseTime,
  formatTime: formatTime,
  formatGap: formatGap,
  normaliseResult: normaliseResult,
  personalBests: personalBests,
  bestsByCourse: bestsByCourse,
  primaryEvents: primaryEvents,
  recentResults: recentResults
};

if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof window !== 'undefined') window.Swim = api;
