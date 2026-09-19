// dashboard.js
// What the back end should say the moment it opens.
//
// The admin screen dropped straight into tools, ie, a form for a swim, a form
// for a school, a table of sixty-four rows. Everything was there and nothing
// was surfaced. The counting was left to Andrew: which schools can be written
// to, which contact is old enough to bounce, which coach has been on the page
// twice this week, which one was emailed a fortnight ago and never answered.
//
// This file does that counting. It decides nothing. board.js still owns the
// scoring, recruiting.js still owns the contact rules, and this only reads
// them and puts what is true today at the top of the screen.

(function () {
  'use strict';

  // ---- the pipeline ----
  // In order. A school moves down this list and never jumps, so "what changed"
  // is answerable and "what is stuck" is visible.
  var STAGES = [
    { key: 'researching', label: 'Researching', note: 'On the board, nothing sent yet.' },
    { key: 'ready', label: 'Ready to contact', note: 'Contact verified, benchmarks in, waiting on the send.' },
    { key: 'contacted', label: 'Contacted', note: 'An email has gone.' },
    { key: 'viewed', label: 'Opened the profile', note: 'The link was followed.' },
    { key: 'replied', label: 'Replied', note: 'A coach wrote back.' },
    { key: 'call', label: 'Call booked', note: 'A conversation is arranged.' },
    { key: 'visit', label: 'Visit or camp', note: 'He has been on their deck.' },
    { key: 'closed', label: 'Closed', note: 'Not going further, either side.' }
  ];

  var STAGE_INDEX = {};
  STAGES.forEach(function (s, i) { STAGE_INDEX[s.key] = i; });

  // The field has always been free text, defaulting to "Not contacted". Old
  // values are mapped rather than thrown away, so nothing Andrew typed before
  // today disappears when the pipeline arrives.
  function stageOf(school) {
    var raw = String((school && school.status) || '').trim().toLowerCase();
    if (!raw || raw === 'not contacted') return 'researching';
    if (STAGE_INDEX[raw] !== undefined) return raw;
    var guess = STAGES.filter(function (s) { return s.label.toLowerCase() === raw; })[0];
    if (guess) return guess.key;
    if (raw.indexOf('repl') !== -1) return 'replied';
    if (raw.indexOf('sent') !== -1 || raw.indexOf('contact') !== -1) return 'contacted';
    if (raw.indexOf('visit') !== -1 || raw.indexOf('camp') !== -1) return 'visit';
    if (raw.indexOf('call') !== -1) return 'call';
    // 'no' as a prefix was too greedy, ie, "nonsense" came back as closed.
    // Only words that actually mean closed count.
    if (raw.indexOf('clos') !== -1 || raw === 'no' || raw.indexOf('not interested') !== -1 ||
      raw.indexOf('declin') !== -1 || raw.indexOf('pass') !== -1) return 'closed';
    // Anything unrecognised means the status was never really set, so the
    // school sits at the start of the pipeline rather than somewhere invented.
    return 'researching';
  }

  function stageLabel(key) {
    var s = STAGES[STAGE_INDEX[key]];
    return s ? s.label : key;
  }

  // ---- how old is what we know ----
  // A contact goes stale faster than a benchmark. Coaching staff move in the
  // spring, and a bounced address in 2027 is a wasted slot, so ninety days.
  // Roster times move once a season, so a benchmark older than a full season
  // is describing swimmers who have graduated.
  var CONTACT_STALE_DAYS = 90;
  var BENCHMARK_STALE_DAYS = 300;

  function daysBetween(from, to) {
    if (!from || !to) return null;
    var a = Date.parse(String(from) + 'T12:00:00Z');
    var b = Date.parse(String(to) + 'T12:00:00Z');
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    return Math.round((b - a) / 86400000);
  }

  function ageReport(school, today) {
    var contact = daysBetween(school.verifiedOn, today);
    var bench = daysBetween(school.benchmarksCheckedOn, today);
    return {
      contactDays: contact,
      benchmarkDays: bench,
      contactStale: school.email ? (contact === null || contact > CONTACT_STALE_DAYS) : false,
      benchmarkStale: (school.benchmarks || []).length
        ? (bench === null || bench > BENCHMARK_STALE_DAYS) : false
    };
  }

  // What to call a group of these when the list is too long to name them all.
  // Deliberately generic: an overflow line that said "36 more can be emailed
  // today, NCAA Division II coaches may reply now" was borrowing one school's
  // division and implying it of thirty-six.
  var KIND_SUMMARY = {
    viewed: 'have opened the profile recently',
    'follow-up': 'were emailed with no reply recorded',
    'can-send': 'can be emailed today and have not been',
    disagrees: 'are read differently by the engine',
    'no-contact': 'have no coach email on file',
    'stale-contact': 'have a contact that needs re-checking',
    'no-benchmarks': 'have no swimmer times gathered',
    'stale-benchmarks': 'have benchmarks that need re-checking',
    'next-action': 'have a next action written down'
  };

  function summaryFor(kind) { return KIND_SUMMARY[kind] || 'need a look'; }

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  // ---- what needs attention ----
  // Lower `rank` sorts first. The ordering is deliberate: a coach who has been
  // on the page is the rarest and most perishable signal on the board, and a
  // school that could be emailed today but has not been is the cheapest win.
  function attentionFor(row, ctx) {
    var school = row.school;
    var out = [];
    var today = ctx.today;
    var window = ctx.windowFor(school.division);
    var stage = stageOf(school);
    var age = ageReport(school, today);
    var visit = (ctx.visits || {})[school.id];

    function add(rank, kind, text) { out.push({ rank: rank, kind: kind, school: school, text: text }); }

    if (visit && visit.last) {
      var since = daysBetween(visit.last, today);
      if (since !== null && since <= 14) {
        add(1, 'viewed', 'Opened the profile ' +
          (since === 0 ? 'today' : since === 1 ? 'yesterday' : since + ' days ago') +
          (visit.count > 1 ? ', ' + plural(visit.count, 'visit', 'visits') + ' in total' : '') + '.');
      }
    }

    if (stage === 'contacted') {
      var waited = daysBetween(school.lastContact, today);
      if (waited !== null && waited >= 10) {
        add(2, 'follow-up', 'Emailed ' + plural(waited, 'day', 'days') + ' ago, no reply recorded.');
      }
    }

    // The cheapest win on the board: a programme that is allowed to answer and
    // has not been asked. Nine Division II schools sat here for a year because
    // the app had the rule wrong.
    if (window && window.open && stage === 'researching' && school.email) {
      add(3, 'can-send', 'Can be emailed today. ' + window.division + ' coaches may reply now.');
    }

    if (row.disagrees) {
      add(4, 'disagrees', 'The engine reads this ' +
        (ctx.tierLabel(row.suggestedPriority) || row.suggestedPriority) +
        ', recorded as ' + (ctx.tierLabel(row.recordedPriority) || row.recordedPriority) + '.');
    }

    if (!school.email) {
      add(5, 'no-contact', 'No coach email on file.');
    } else if (age.contactStale) {
      add(5, 'stale-contact', age.contactDays === null
        ? 'Contact has never been verified.'
        : 'Contact last verified ' + plural(age.contactDays, 'day', 'days') + ' ago.');
    }

    if (!(school.benchmarks || []).length) {
      add(6, 'no-benchmarks', 'No swimmer times gathered, so it cannot be scored.');
    } else if (age.benchmarkStale) {
      add(6, 'stale-benchmarks', age.benchmarkDays === null
        ? 'Benchmarks carry no checked date.'
        : 'Benchmarks are ' + plural(age.benchmarkDays, 'day', 'days') + ' old.');
    }

    if (school.nextAction) add(7, 'next-action', 'Next action: ' + school.nextAction);

    return out;
  }

  // ---- the whole picture ----
  function summarise(rows, ctx) {
    var counts = {
      schools: rows.length,
      openNow: 0, waiting: 0,
      byStage: {}, byDivision: {}, byFit: {},
      staleContacts: 0, staleBenchmarks: 0, noContact: 0, noBenchmarks: 0,
      disagreeing: 0, viewedRecently: 0
    };
    STAGES.forEach(function (s) { counts.byStage[s.key] = 0; });

    var attention = [];

    rows.forEach(function (row) {
      var school = row.school;
      var window = ctx.windowFor(school.division);
      var stage = stageOf(school);
      var age = ageReport(school, ctx.today);
      var visit = (ctx.visits || {})[school.id];

      if (window && window.open) counts.openNow += 1; else counts.waiting += 1;
      counts.byStage[stage] = (counts.byStage[stage] || 0) + 1;
      counts.byDivision[school.division] = (counts.byDivision[school.division] || 0) + 1;
      if (row.computedFit) counts.byFit[row.computedFit] = (counts.byFit[row.computedFit] || 0) + 1;
      if (!school.email) counts.noContact += 1; else if (age.contactStale) counts.staleContacts += 1;
      if (!(school.benchmarks || []).length) counts.noBenchmarks += 1;
      else if (age.benchmarkStale) counts.staleBenchmarks += 1;
      if (row.disagrees) counts.disagreeing += 1;
      if (visit && visit.last && daysBetween(visit.last, ctx.today) <= 14) counts.viewedRecently += 1;

      attention = attention.concat(attentionFor(row, ctx));
    });

    attention.sort(function (a, b) {
      return a.rank - b.rank || (a.school.name < b.school.name ? -1 : 1);
    });

    return { counts: counts, attention: attention };
  }

  var api = {
    STAGES: STAGES,
    CONTACT_STALE_DAYS: CONTACT_STALE_DAYS,
    BENCHMARK_STALE_DAYS: BENCHMARK_STALE_DAYS,
    KIND_SUMMARY: KIND_SUMMARY,
    summaryFor: summaryFor,
    stageOf: stageOf,
    stageLabel: stageLabel,
    daysBetween: daysBetween,
    ageReport: ageReport,
    attentionFor: attentionFor,
    summarise: summarise
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.Dashboard = api;
})();
