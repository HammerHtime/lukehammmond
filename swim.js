// swim.js
// The swimming data core. Events, courses, times, and personal bests.
// Pure functions only. No browser, no network. This file is the one place
// that knows how a swim time is read, written, and compared.

// The three racing courses.
// SCY is short course yards, ie, the 25 yard pool the NCAA races in.
// SCM is short course metres, ie, the 25 metre pool.
// LCM is long course metres, ie, the 50 metre Olympic pool.
// Wrapped in a function on purpose. The browser runs every script tag in ONE
// shared scope, so two files that both declare `const api` at the top level
// throw "Identifier 'api' has already been declared" and every script after
// the first one dies silently. Node gives each file its own scope, so the
// whole test suite passed while the live site was broken. browser.test.js now
// loads these the way a browser does, which is the only way to see it.
(function () {

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
      // World Aquatics points. The only number on a swim that means the same
      // thing in every event and both courses, so it is the only honest way to
      // ask which of his events is actually his best.
      points: Number.isFinite(Number(input.points)) && Number(input.points) > 0
        ? Math.round(Number(input.points)) : null,
      // The season the swim belongs to, as the source groups them. Kept as
      // given rather than derived from the date, because a swim in November
      // belongs to the season that ends the following summer.
      season: Number.isFinite(Number(input.season)) ? Number(input.season) : null,
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

// The improvement curve, one event, season by season.
//
// This is the single highest value thing a recruiting page can show, and the
// one thing it does better than a results database. Coaches named rate of
// improvement as one of two swimming criteria, and a database shows a best
// time while hiding the slope that produced it.
function progression(results, distance, stroke, course) {
  const id = eventId(distance, stroke, course);
  const bySeason = {};

  (results || []).forEach(function (r) {
    if (r.event !== id || !r.season) return;
    const held = bySeason[r.season];
    if (!held || r.hundredths < held.hundredths) bySeason[r.season] = r;
  });

  const seasons = Object.keys(bySeason).map(Number).sort(function (a, b) { return a - b; });
  if (!seasons.length) return null;

  const points = seasons.map(function (year, i) {
    const swim = bySeason[year];
    const previous = i > 0 ? bySeason[seasons[i - 1]] : null;
    return {
      season: year,
      time: swim.time,
      hundredths: swim.hundredths,
      points: swim.points,
      meet: swim.meet,
      date: swim.date,
      // Negative is a drop, ie, faster. Null for the first season, because
      // there is nothing to improve on yet and a zero would imply there was.
      droppedBy: previous ? swim.hundredths - previous.hundredths : null,
      pointsGained: previous && swim.points && previous.points ? swim.points - previous.points : null
    };
  });

  const first = points[0];
  const last = points[points.length - 1];

  return {
    event: id,
    name: eventName(distance, stroke) + ' ' + course,
    seasons: points,
    // The headline, ie, what has come off across the whole record.
    totalDrop: points.length > 1 ? last.hundredths - first.hundredths : null,
    pointsGained: points.length > 1 && first.points && last.points ? last.points - first.points : null,
    current: last,
    // Improving every single season is a different statement from improving
    // overall, and it is the stronger one.
    everySeason: points.slice(1).every(function (p) { return p.droppedBy !== null && p.droppedBy < 0; })
  };
}

// His events ranked by points rather than by how they feel. Points are the
// same scale in every event and both courses, so this settles the question of
// what to lead with instead of arguing about it.
function rankedByPoints(results, limit) {
  const best = {};
  (results || []).forEach(function (r) {
    if (!r.points) return;
    const held = best[r.event];
    if (!held || r.points > held.points) best[r.event] = r;
  });
  return Object.keys(best).map(function (id) { return best[id]; })
    .sort(function (a, b) { return b.points - a.points; })
    .slice(0, limit || 10);
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
  progression: progression,
  rankedByPoints: rankedByPoints,
  recentResults: recentResults
};

if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof window !== 'undefined') window.Swim = api;

})();
