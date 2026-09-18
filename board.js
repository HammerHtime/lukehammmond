// board.js
// The recruiting board. This is the engine.
//
// What it does, in one line: it takes the times Luke actually swam, converts
// them to yards, compares them against what swimmers at each programme are
// actually doing, and reports the gap.
//
// What it deliberately does NOT do: decide. Priority is a human judgement and
// stays a human judgement. The engine recomputes the gap after every meet and
// says when a school has crossed a threshold. Andrew moves the school.
//
// Three ideas run through this file and they are worth stating plainly.
//
// 1. Priority is about relevance, not quality. P1 does not mean a better
//    school than P2. It means his times overlap that programme right now.
//
// 2. Confidence is about the evidence, not the odds. High confidence means we
//    have real times from real swimmers at that programme. It does not mean he
//    is likely to be recruited. Keeping those two apart is the whole reason
//    the column exists.
//
// 3. A benchmark is only as good as what it was drawn from. Beating a
//    conference champion is a different statement from sitting inside roster
//    depth. Every benchmark carries its basis, and the engine never compares
//    a roster time and a champion's time as though they were the same thing.

// Wrapped in a function on purpose. The browser runs every script tag in ONE
// shared scope, so two files that both declare `const api` at the top level
// throw "Identifier 'api' has already been declared" and every script after
// the first one dies silently. Node gives each file its own scope, so the
// whole test suite passed while the live site was broken. browser.test.js now
// loads these the way a browser does, which is the only way to see it.
(function () {

const PRIORITIES = ['P1', 'P2', 'P3'];

const PRIORITY_MEANING = {
  P1: 'His times already overlap this programme. Firmly on the radar.',
  P2: 'Realistic if he keeps progressing. This is where most of the campaign will sit.',
  P3: 'A reach. Worth watching, but he needs a meaningful drop first.'
};

// What a benchmark was drawn from. This decides how to read the gap.
const BASIS = {
  roster: { label: 'roster depth', note: 'Times swimmers on that roster were actually producing.', weight: 'direct' },
  qualifier: { label: 'conference qualifier', note: 'A swimmer who made the conference meet.', weight: 'direct' },
  champion: { label: 'conference champion', note: 'The winner. Being behind the winner is normal, not disqualifying.', weight: 'top end' }
};

const FIT = {
  CURRENT: 'Current fit',
  CURRENT_TARGET: 'Current fit / target',
  TARGET: 'Target',
  TARGET_REACH: 'Target / reach',
  REACH: 'Reach',
  UNKNOWN: 'Not assessed'
};

const CONFIDENCE = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low'
};

// Bands, as a share of the benchmark rather than flat seconds, because eight
// seconds off a 500 and eight seconds off a mile are not the same distance.
// A mile is roughly three and a half times a 500, so a flat threshold would
// call every mile comparison a reach.
const BANDS = [
  { max: 0.000, fit: FIT.CURRENT },
  { max: 0.010, fit: FIT.CURRENT_TARGET },
  { max: 0.030, fit: FIT.TARGET },
  { max: 0.045, fit: FIT.TARGET_REACH },
  { max: Infinity, fit: FIT.REACH }
];

function bandFor(share) {
  for (let i = 0; i < BANDS.length; i++) {
    if (share <= BANDS[i].max) return BANDS[i].fit;
  }
  return FIT.REACH;
}

const FIT_ORDER = [FIT.CURRENT, FIT.CURRENT_TARGET, FIT.TARGET, FIT.TARGET_REACH, FIT.REACH, FIT.UNKNOWN];

function worstFit(fits) {
  let worst = null;
  fits.forEach(function (f) {
    if (f === FIT.UNKNOWN) return;
    if (worst === null || FIT_ORDER.indexOf(f) > FIT_ORDER.indexOf(worst)) worst = f;
  });
  return worst || FIT.UNKNOWN;
}

function bestFit(fits) {
  let best = null;
  fits.forEach(function (f) {
    if (f === FIT.UNKNOWN) return;
    if (best === null || FIT_ORDER.indexOf(f) < FIT_ORDER.indexOf(best)) best = f;
  });
  return best || FIT.UNKNOWN;
}

// Compare his yard time against one benchmark.
function compareOne(swim, mine, benchmark) {
  if (!mine || !benchmark) return null;
  const theirs = swim.parseTime(benchmark.time);
  if (theirs === null) return null;

  const gap = mine.hundredths - theirs;
  const share = gap / theirs;
  const basis = BASIS[benchmark.basis] || BASIS.roster;

  return {
    event: benchmark.event,
    mine: mine.time,
    mineHundredths: mine.hundredths,
    theirs: benchmark.time,
    theirsHundredths: theirs,
    basis: benchmark.basis,
    basisLabel: basis.label,
    basisNote: basis.note,
    context: benchmark.context || '',
    sourceUrl: benchmark.sourceUrl || '',
    gap: gap,
    gapText: swim.formatGap(gap),
    ahead: gap <= 0,
    theirTimes: [theirs],
    fit: bandFor(share)
  };
}

// A group of times from one programme in one event, ie, the five 500s at
// St. Bonaventure. Sitting anywhere inside the group is a current fit, because
// that is literally the range the programme is swimming.
function compareGroup(swim, mine, group) {
  if (!mine || !group || !group.times || !group.times.length) return null;
  const times = group.times.map(function (t) { return swim.parseTime(t); }).filter(function (t) { return t !== null; });
  if (!times.length) return null;
  times.sort(function (a, b) { return a - b; });

  const fastest = times[0];
  const slowest = times[times.length - 1];
  const inside = mine.hundredths <= slowest;
  const share = (mine.hundredths - slowest) / slowest;

  return {
    event: group.event,
    mine: mine.time,
    mineHundredths: mine.hundredths,
    theirs: swim.formatTime(fastest) + ' to ' + swim.formatTime(slowest),
    theirsHundredths: slowest,
    basis: 'roster',
    basisLabel: 'roster depth, ' + times.length + ' swimmers',
    basisNote: BASIS.roster.note,
    context: group.context || '',
    sourceUrl: group.sourceUrl || '',
    gap: mine.hundredths - slowest,
    gapText: swim.formatGap(mine.hundredths - slowest),
    ahead: mine.hundredths <= fastest,
    inside: inside,
    theirTimes: times,
    fit: inside ? FIT.CURRENT : bandFor(share)
  };
}

// Where every time sits on one shared scale, so a comparison can be drawn.
//
// This computes NO verdict. It decides nothing, it changes no band and it
// feeds nothing back into scoring. It exists because reading "his 4:37.20
// against 4:28.10 to 4:42.27, +9.10" makes you do the subtraction yourself,
// and the only question that matters, ie, is he inside their range or off the
// back of it, is a question about a picture.
//
// Fast is left, because that is how a results sheet reads.
function scalePositions(comparison) {
  if (!comparison || !comparison.theirTimes || !comparison.theirTimes.length) return null;

  const theirs = comparison.theirTimes.slice().sort(function (a, b) { return a - b; });
  const mine = comparison.mineHundredths;
  const all = theirs.concat([mine]);
  const low = Math.min.apply(null, all);
  const high = Math.max.apply(null, all);

  // A little air at each end so a mark never sits on the very edge, and a
  // guard for the case where every time is identical.
  const span = high - low;
  const pad = span > 0 ? span * 0.08 : Math.max(50, high * 0.01);
  const from = low - pad;
  const to = high + pad;
  const width = to - from || 1;

  function at(value) {
    return Math.max(0, Math.min(100, ((value - from) / width) * 100));
  }

  return {
    mine: { hundredths: mine, pos: at(mine) },
    theirs: theirs.map(function (t) { return { hundredths: t, pos: at(t) }; }),
    // The band is their range. With a single benchmark there is no band, and
    // drawing one would invent a spread that was never measured.
    band: theirs.length > 1
      ? { from: at(theirs[0]), to: at(theirs[theirs.length - 1]) }
      : null,
    fastest: theirs[0],
    slowest: theirs[theirs.length - 1],
    // Said in words, once, so the picture and the caption cannot disagree.
    verdict: comparison.ahead
      ? 'ahead of all ' + theirs.length
      : (comparison.inside ? 'inside their range' : comparison.gapText + ' back')
  };
}

// Where he would actually slot into that squad.
//
// This replaces an abstract scale with the question a person actually asks:
// if he walked into that programme tomorrow, who on it is faster than him?
// "Fourth fastest of five" needs no explaining. A bar does.
//
// Returns null when there is only one benchmark, because you cannot rank
// somebody against a single swimmer and pretending otherwise would invent a
// squad that was never measured.
function placeIn(swim, comparison) {
  if (!comparison || !comparison.theirTimes || comparison.theirTimes.length < 2) return null;

  const theirs = comparison.theirTimes.slice().sort(function (a, b) { return a - b; });
  const mine = comparison.mineHundredths;

  const fasterThanHim = theirs.filter(function (t) { return t < mine; }).length;
  const position = fasterThanHim + 1;
  const of = theirs.length + 1;          // the squad with him added to it

  // The middle swimmer, not the mean. With four or five times a single slow
  // swim drags an average somewhere no real swimmer sits.
  const middle = theirs.length % 2
    ? theirs[(theirs.length - 1) / 2]
    : Math.round((theirs[theirs.length / 2 - 1] + theirs[theirs.length / 2]) / 2);

  // The squad in order with him in it, which is the thing to draw.
  const ladder = theirs.map(function (t) {
    return { hundredths: t, time: swim.formatTime(t), mine: false };
  });
  ladder.splice(fasterThanHim, 0, { hundredths: mine, time: comparison.mine, mine: true });

  return {
    position: position,
    of: of,
    fasterThan: theirs.length - fasterThanHim,
    behind: fasterThanHim,
    median: swim.formatTime(middle),
    medianHundredths: middle,
    // Beating the middle swimmer is the line between contributing and making
    // up numbers, and it is a fairer read than beating their best.
    aboveMedian: mine <= middle,
    ladder: ladder,
    // Said once, in words, so the picture and the caption cannot disagree.
    sentence: position === 1
      ? 'Fastest on their squad'
      : position === of
        ? 'Slowest of the ' + of
        : ordinal(position) + ' fastest of ' + of,
    // What it means for LUKE, which is the question this board exists to
    // answer. He is choosing where to go, not auditioning. Leading a group and
    // developing behind one are both fine answers, they are just different
    // years of his life, and he should pick knowing which he is buying.
    meaning: meaningOf(position, of, mine <= middle)
  };
}

function meaningOf(position, of, aboveMedian) {
  if (position === 1) {
    return 'He would lead their distance group from day one. Good for racing and for confidence, ' +
      'less good for having someone quicker to train behind.';
  }
  if (position === of) {
    return 'He would be developing behind everyone there. That can be the right choice if the ' +
      'coaching is what he wants, but it is a year or two before he races.';
  }
  if (aboveMedian) {
    return 'He would be in the front half of their group, ie, contributing rather than making up ' +
      'numbers, with people ahead of him to chase.';
  }
  return 'He would be in the back half of their group. Training with people quicker than him, ' +
    'which develops a swimmer, but not scoring straight away.';
}

const ORDINALS = ['', 'fastest', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh',
  'eighth', 'ninth', 'tenth'];

function ordinal(n) {
  return ORDINALS[n] || (n + 'th');
}

// Score one school against his current yard bests.
function scoreSchool(swim, yardBests, school) {
  const comparisons = [];

  (school.benchmarks || []).forEach(function (b) {
    const mine = yardBests[b.event];
    const result = b.times ? compareGroup(swim, mine, b) : compareOne(swim, mine, b);
    if (result) comparisons.push(result);
  });

  const fits = comparisons.map(function (c) { return c.fit; });

  // Where the evidence disagrees across events, report both ends rather than
  // averaging them away. "Target on the 500, reach on the mile" is the useful
  // sentence. A single blended label hides exactly what he needs to work on.
  const best = bestFit(fits);
  const worst = worstFit(fits);
  const computedFit = comparisons.length === 0 ? FIT.UNKNOWN : spanLabel(best, worst);

  const suggested = suggestPriority(best, worst, comparisons.length);

  return {
    school: school,
    comparisons: comparisons,
    computedFit: computedFit,
    bestFit: best,
    worstFit: worst,
    suggestedPriority: suggested,
    recordedPriority: school.priority || null,
    // When the engine and the recorded call disagree, say so. That is the
    // prompt to look again, which is the point of recomputing after a meet.
    disagrees: Boolean(school.priority && suggested && school.priority !== suggested),
    confidence: school.confidence || (comparisons.length ? CONFIDENCE.MEDIUM : CONFIDENCE.LOW),
    evidenceCount: comparisons.length
  };
}

// "Target" and "Target / reach" together should read "Target / reach", not
// "Target / target / reach". The span is named by its two ends, once each.
function spanLabel(best, worst) {
  if (best === worst) return best;
  const tail = String(worst).split('/').pop().trim().toLowerCase();
  const head = String(best).split('/')[0].trim();
  if (head.toLowerCase() === tail) return worst;
  return head + ' / ' + tail;
}

function suggestPriority(best, worst, count) {
  if (!count) return null;
  if (best === FIT.CURRENT || best === FIT.CURRENT_TARGET) {
    return worst === FIT.REACH ? 'P2' : 'P1';
  }
  if (best === FIT.TARGET || best === FIT.TARGET_REACH) return 'P2';
  return 'P3';
}

// The whole board, scored and sorted the way it should be read.
function scoreBoard(swim, yardBests, schools) {
  const rows = (schools || []).map(function (s) { return scoreSchool(swim, yardBests, s); });
  rows.sort(function (a, b) {
    const pa = PRIORITIES.indexOf(a.recordedPriority || a.suggestedPriority || 'P3');
    const pb = PRIORITIES.indexOf(b.recordedPriority || b.suggestedPriority || 'P3');
    if (pa !== pb) return pa - pb;
    return FIT_ORDER.indexOf(a.bestFit) - FIT_ORDER.indexOf(b.bestFit);
  });
  return rows;
}

// What a given time drop would unlock. This is the question that actually
// motivates a fifteen year old, ie, not "you are eight seconds off" but
// "four seconds moves three schools".
function whatIfFaster(swim, yardBests, schools, eventId, newTime) {
  const hundredths = swim.parseTime(newTime);
  if (hundredths === null) return null;

  const before = scoreBoard(swim, yardBests, schools);
  const after = scoreBoard(swim, Object.assign({}, yardBests, {
    [eventId]: Object.assign({}, yardBests[eventId] || {}, {
      event: eventId, time: swim.formatTime(hundredths), hundredths: hundredths
    })
  }), schools);

  const byId = {};
  before.forEach(function (r) { byId[r.school.id] = r; });

  const moved = after.filter(function (r) {
    const was = byId[r.school.id];
    return was && was.suggestedPriority !== r.suggestedPriority;
  }).map(function (r) {
    return {
      school: r.school.name,
      from: byId[r.school.id].suggestedPriority,
      to: r.suggestedPriority
    };
  });

  return { event: eventId, time: swim.formatTime(hundredths), moved: moved, board: after };
}

const api = {
  PRIORITIES: PRIORITIES,
  PRIORITY_MEANING: PRIORITY_MEANING,
  BASIS: BASIS,
  FIT: FIT,
  CONFIDENCE: CONFIDENCE,
  BANDS: BANDS,
  bandFor: bandFor,
  bestFit: bestFit,
  spanLabel: spanLabel,
  worstFit: worstFit,
  compareOne: compareOne,
  compareGroup: compareGroup,
  scalePositions: scalePositions,
  placeIn: placeIn,
  ordinal: ordinal,
  scoreSchool: scoreSchool,
  scoreBoard: scoreBoard,
  suggestPriority: suggestPriority,
  whatIfFaster: whatIfFaster
};

if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof window !== 'undefined') window.Board = api;

})();
