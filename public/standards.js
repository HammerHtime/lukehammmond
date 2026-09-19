// standards.js
// Time standards, and how far a swim is from one.
//
// Treat this file the way a certificate is treated. Every number is quoted
// from a named source at a recorded date. Do not guess a value, and do not
// state a basis the source does not state. If a standard cannot be sourced,
// it does not go in here, and the page says nothing rather than something
// convenient.

// Wrapped in a function on purpose. The browser runs every script tag in ONE
// shared scope, so two files that both declare `const api` at the top level
// throw "Identifier 'api' has already been declared" and every script after
// the first one dies silently. Node gives each file its own scope, so the
// whole test suite passed while the live site was broken. browser.test.js now
// loads these the way a browser does, which is the only way to see it.
(function () {

const STANDARDS = [
  {
    id: 'can-jr-trials',
    name: 'Canadian Junior Trials',
    short: 'Jr. Trials',
    course: 'LCM',
    // Carried over from the existing profile page at lukehammond.netlify.app,
    // transcribed 18 September 2026. NOT yet checked against the official
    // Swimming Canada standards document. Confirm before quoting to a coach.
    source: 'Carried over from the existing profile page',
    recorded: '2026-09-18',
    confirmed: false,
    cuts: {
      '200-free-LCM': '1:56.47',
      '400-free-LCM': '4:08.73',
      '800-free-LCM': '8:39.36',
      '1500-free-LCM': '16:31.79'
    }
  }
  ,
  {
    id: 'usports-2026',
    name: 'U SPORTS Championship qualifying',
    short: 'U SPORTS',
    course: 'SCM',
    // Read off the official Splash results header for each event at the 2026
    // U SPORTS Championships, Markham, 12-14 March 2026, and cross-checked
    // against the scoring cut-off in the results themselves, ie, in the men's
    // 400 free a 3:55.39 scored and a 3:55.47 did not.
    source: '2026 U SPORTS Championships official results, results.swimming.ca/2026_USPORTS',
    recorded: '2026-09-18',
    confirmed: true,
    cuts: {
      '200-free-SCM': '1:49.74',
      '400-free-SCM': '3:55.45',
      '1500-free-SCM': '15:58.09',
      '400-im-SCM': '4:25.59'
    }
  }
];

// There is NO men's 800 freestyle at U SPORTS. It is a women's championship
// event; the only men's 800 at the 2026 nationals was a time trial. So of
// Luke's distance events, the 400 and the 1500 are the ones that score in
// Canada, and the 800 does not exist to a U SPORTS coach.
//
// This matters more than it looks. The 800 is one of his four ranked events
// and it is the one that travels worst, ie, the NCAA races a 1000 yard free
// and Canada races no men's 800 at all.

// NCAA Division I and Division II qualifying standards are published in short
// course yards and change every season. None are recorded here yet, because
// none have been sourced. See docs/STATUS.md.

// Converting a metres time to a yards time is the other open gap. The NCAA
// races short course yards and Luke races metres, so a US coach reads his
// sheet in the wrong units. Conversion factors were looked for on 18 September
// 2026 and no published factor table could be verified, so no conversion is
// shown. An estimate presented as a time would be worse than saying nothing.

function standardsFor(course) {
  return STANDARDS.filter(function (s) { return s.course === course; });
}

function cutFor(standardId, eventId) {
  const standard = STANDARDS.filter(function (s) { return s.id === standardId; })[0];
  if (!standard) return null;
  const cut = standard.cuts[eventId];
  return cut || null;
}

// How far a swim sits from a standard.
// Returns null when there is no cut on file, which is not the same as
// being far away. A missing standard is silence, not a verdict.
function gapToCut(parseTime, hundredths, standardId, eventId) {
  const cut = cutFor(standardId, eventId);
  if (!cut) return null;
  const cutHundredths = parseTime(cut);
  if (cutHundredths === null || !Number.isFinite(hundredths)) return null;
  return {
    cut: cut,
    cutHundredths: cutHundredths,
    // Negative means already under the cut.
    behindBy: hundredths - cutHundredths,
    made: hundredths <= cutHundredths
  };
}

// Every event on the page that has a cut on file, with where he stands.
function progressAgainst(swim, results, standardId) {
  const standard = STANDARDS.filter(function (s) { return s.id === standardId; })[0];
  if (!standard) return [];
  const bests = swim.personalBests(results);

  return Object.keys(standard.cuts).map(function (eventId) {
    const best = bests[eventId];
    const gap = best ? gapToCut(swim.parseTime, best.hundredths, standardId, eventId) : null;
    return {
      eventId: eventId,
      name: best ? best.name : eventId,
      best: best || null,
      standard: standard,
      gap: gap
    };
  });
}

const api = {
  STANDARDS: STANDARDS,
  standardsFor: standardsFor,
  cutFor: cutFor,
  gapToCut: gapToCut,
  progressAgainst: progressAgainst
};

if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof window !== 'undefined') window.Standards = api;

})();
