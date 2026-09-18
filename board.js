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

// P1, P2 and P3 are the keys, kept because they sort and because that is what
// the pasted board and the importer use. They are never shown. Andrew asked for
// something readable and he was right, ie, a code you have to remember is not a
// label, and the board already carried a second scale saying the same thing.
//
// The wording says what his first year there would look like, which is the
// question this board exists to answer. Nothing about scoring changed.
const PRIORITIES = ['P1', 'P2', 'P3'];

const TIERS = {
  P1: { label: 'You\u2019d race', tone: 'good' },
  P2: { label: 'You\u2019d push', tone: 'mid' },
  P3: { label: 'You\u2019d chase', tone: 'warn' }
};

// No benchmarks means no reading. Printing "he'd chase" over an empty record
// would be a verdict drawn from silence, which is the one thing this board
// never does.
const NOT_SCORED = { label: 'Not scored', tone: 'none' };

function tierFor(priority, assessed) {
  if (assessed === false) return NOT_SCORED;
  return TIERS[priority] || null;
}

const PRIORITY_MEANING = {
  P1: 'Your times already overlap this programme. You would be racing in year one.',
  P2: 'Realistic if you keep progressing. You would be pushing to get into the group.',
  P3: 'A reach for now. You would be chasing it, and you need a meaningful drop first.'
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
    mineEstimated: Boolean(mine.estimated),
    mineFrom: mine.from || null,
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
    mineEstimated: Boolean(mine.estimated),
    mineFrom: mine.from || null,
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

// The conference, which is the other half of the question. Making a squad and
// scoring at the championship are different bars, and a swimmer choosing where
// to go needs both.
//
// Only conferences whose 2026 championship results were actually read are in
// here. The others are silent rather than guessed at, which is the same rule
// the rest of this project runs on.
const CONFERENCES = {
  'MAAC': {
    name: 'MAAC', meet: '2026 MAAC Championships',
    source: 'https://swimmeetresults.tech/MAAC-2026/', recorded: '2026-09-18',
    winners: { '500-free-SCY': '4:26.17', '1650-free-SCY': '15:39.33', '400-im-SCY': '3:51.32' }
  },
  // The OUA races SHORT COURSE METRES and there is no men's 800 free, ie, the
  // 800 is a women's event. The 1500 stands in its place.
  'OUA': {
    name: 'OUA', meet: '2026 OUA Championships',
    source: 'https://sidearmstats.com/Toronto/swimming/evtindex.htm', recorded: '2026-09-18',
    winners: { '400-free-SCM': '3:49.88', '1500-free-SCM': '15:26.45', '400-im-SCM': '4:21.47' }
  },
  'RSEQ': {
    name: 'RSEQ', meet: '2026 RSEQ Championships',
    source: 'https://live.swimrankings.net/49295/', recorded: '2026-09-18',
    winners: { '400-free-SCM': '3:51.36', '1500-free-SCM': '15:25.43', '400-im-SCM': '4:21.29' }
  },
  // Canada West races its championship in NOVEMBER, so the 2025-26 conference
  // meet was 28 to 30 November 2025 at Lethbridge. That is the current one.
  'Canada West': {
    name: 'Canada West', meet: '2025 Canada West Championships',
    source: 'https://www.winthewest.ca/swim/evtindex.htm', recorded: '2026-09-18',
    winners: { '400-free-SCM': '3:49.14', '1500-free-SCM': '15:02.62', '400-im-SCM': '4:14.69' }
  },
  // The AUS is deliberately absent. It published NO results for its 2026
  // championship, only day recaps naming winners with no times. Inventing a
  // number there would be exactly the thing this board never does.
  'Patriot League': {
    name: 'Patriot League', meet: '2026 Patriot League Championships',
    source: 'https://sidearmstats.com/navy/cswim/index.htm', recorded: '2026-09-18',
    winners: { '500-free-SCY': '4:16.73', '1650-free-SCY': '14:54.68', '400-im-SCY': '3:47.66' }
  },
  'Atlantic 10': {
    name: 'Atlantic 10', meet: '2026 Atlantic 10 Championships',
    source: 'https://swimmeetresults.tech/Atlantic-10-2026/evtindex.htm', recorded: '2026-09-18',
    winners: { '500-free-SCY': '4:19.28', '1650-free-SCY': '15:09.61', '400-im-SCY': '3:47.60' }
  },
  'Pennsylvania State Athletic': {
    name: 'PSAC', meet: '2026 PSAC Championships',
    source: 'https://calvulcans.com/documents/2026/2/21/swim26psac_full.pdf', recorded: '2026-09-18',
    winners: { '500-free-SCY': '4:23.91', '1650-free-SCY': '15:19.54', '400-im-SCY': '3:53.46' }
  },
  'Liberty League': {
    name: 'Liberty League', meet: '2026 Liberty League Championships',
    source: 'https://athletics.ithaca.edu/sports/2026/1/29/2026-liberty-league-swimming-diving-championships-portal.aspx',
    recorded: '2026-09-18',
    winners: { '500-free-SCY': '4:31.98', '1650-free-SCY': '15:50.52', '400-im-SCY': '4:05.21' }
  }
};

// Where his time sits against the conference championship, when that meet's
// results are on file. Returns null rather than a guess for the rest.
function conferenceContext(swim, school, comparison) {
  const conf = CONFERENCES[(school && school.conference) || ''];
  if (!conf || !comparison) return null;
  const winner = conf.winners[comparison.event];
  if (!winner) return null;

  const winnerHundredths = swim.parseTime(winner);
  if (winnerHundredths === null) return null;
  const gap = comparison.mineHundredths - winnerHundredths;

  // Six of these schools are benchmarked against their own conference winner,
  // so the strip has already printed that time. Saying it again underneath
  // reads like two facts when it is one. The context is still returned, with
  // a flag, because the page is what decides whether to draw it.
  const sameSwim = Boolean(comparison.theirTimes &&
    comparison.theirTimes.length === 1 &&
    comparison.theirTimes[0] === winnerHundredths);

  return {
    conference: conf.name,
    sameSwim: sameSwim,
    meet: conf.meet,
    winner: winner,
    source: conf.source,
    gap: gap,
    gapText: swim.formatGap(gap),
    // Winning it is not the point at fifteen. Knowing the distance to the top
    // of the conference he would be swimming in is.
    //
    // Reworded 18 September 2026. It read "Won in 4:26.17", which has no
    // subject and so says nothing, ie, who won, what they won, and what it has
    // to do with Luke were all left to the reader. A line on a board has to
    // stand on its own.
    // The year comes off the meet name rather than being assumed. Canada West
    // races its championship in November, so its 2025-26 meet is the 2025 one,
    // and hardcoding 2026 produced "at the 2025 Canada West Championships in
    // 2026", which is both wrong and confusing.
    sentence: 'It took ' + winner + ' to win this event at the ' + conf.meet + '. ' +
      (gap <= 0
        ? 'You are already quicker than that.'
        : 'You are ' + swim.formatGap(gap).replace('+', '') + ' off that.')
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
// "4:37.20 is his 400 free long course, 4:10.86, converted."
//
// He has never swum a yard in his life, so every time of his on this board is
// an estimate standing next to real yard swims. Andrew asked for that to be
// said plainly on the public page and it is just as true here, where the whole
// point is a like for like comparison.
function convertedNote(comparison) {
  if (!comparison || !comparison.mineEstimated) return '';
  const from = comparison.mineFrom;
  if (!from || !from.event || !from.time) return 'Converted, not a time you have swum.';
  const parts = String(from.event).split('-');
  const said = parts[0] + ' ' + (parts[1] === 'im' ? 'IM' : parts[1]) + ' ' + parts[2];
  return 'Converted from your ' + said + ', ' + from.time + '. Not a time you have swum.';
}

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
    return 'You would lead their distance group from day one. Good for racing and for confidence, ' +
      'less good for having someone quicker to train behind.';
  }
  if (position === of) {
    return 'You would be developing behind everyone there. That can be the right choice if the ' +
      'coaching is what you want, but it is a year or two before you race.';
  }
  if (aboveMedian) {
    return 'You would be in the front half of their group, ie, contributing rather than making up ' +
      'numbers, with people ahead of you to chase.';
  }
  return 'You would be in the back half of their group. Training with people quicker than you, ' +
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

// ---------------------------------------------------------------------------
// Where would he actually swim
// ---------------------------------------------------------------------------
// Andrew's question, and it is the right one: after hiding a pile of schools,
// which are the ones where he would genuinely race?
//
// This does NOT invent a new verdict. It reads the ladders that are already
// there and ranks by where he would sit on each squad, because that is the
// question, ie, not "is this a good school" but "would he be in the water".
//
// One number per school: his average position on their ladder, as a share of
// the squad. 0 means fastest on every squad, 1 means last on every squad.
// Averaging the share rather than the raw position stops a deep programme
// being punished for having more swimmers in the event.
function fitScore(swim, row) {
  if (!row || !row.comparisons || !row.comparisons.length) return null;

  const placed = [];
  row.comparisons.forEach(function (c) {
    const place = placeIn(swim, c);
    if (place) {
      placed.push({ event: c.event, position: place.position, of: place.of,
        share: (place.position - 1) / (place.of - 1), aboveMedian: place.aboveMedian });
      return;
    }
    // A single benchmark cannot be ranked against, but it still says whether he
    // is ahead of it, which is the only honest reading available.
    placed.push({ event: c.event, position: c.ahead ? 1 : 2, of: 2,
      share: c.ahead ? 0 : 1, aboveMedian: Boolean(c.ahead), lone: true });
  });
  if (!placed.length) return null;

  const share = placed.reduce(function (n, p) { return n + p.share; }, 0) / placed.length;
  const scoring = placed.filter(function (p) { return p.aboveMedian; }).length;
  const leads = placed.filter(function (p) { return p.position === 1; }).length;

  // How much of this rests on a real squad rather than a single time. A lone
  // benchmark is not a ladder, so the sentence must not call it one.
  const ranked = placed.filter(function (p) { return !p.lone; });
  const lone = placed.length - ranked.length;

  let sentence;
  if (!ranked.length) {
    sentence = 'Quicker than the ' + (lone === 1 ? 'one time' : lone + ' times') +
      ' on file, but no squad to rank against yet';
  } else if (leads === placed.length) {
    sentence = 'Fastest on their squad in ' + (ranked.length === 1 ? 'that event' : 'all ' + ranked.length);
  } else if (scoring) {
    sentence = 'Front half in ' + scoring + ' of ' + placed.length;
  } else {
    sentence = 'Back half in all ' + placed.length;
  }

  return {
    share: share, events: placed.length, scoring: scoring, leads: leads, placed: placed,
    ranked: ranked.length, lone: lone,
    band: share <= 0.34 ? 'race' : (share <= 0.67 ? 'compete' : 'develop'),
    sentence: sentence
  };
}

const FIT_BANDS = {
  race: { label: 'He would race', why: 'Front third of their squad, ie, scoring from day one.' },
  compete: { label: 'He would compete for a spot', why: 'Inside the squad and in the fight, ie, training with people to chase.' },
  develop: { label: 'He would develop behind them', why: 'Back third, ie, a year or two before he races.' }
};

// The shortlist. Ranked across EVERYTHING researched, not just what is on the
// board right now, because hiding a school removes it from the scoring too and
// the whole point of asking is to not lose a good one that way.
function bestFits(swim, bests, onBoard, researched, limit) {
  const here = {};
  (onBoard || []).forEach(function (s) { here[s.id] = true; });

  // Anything researched that is not on the board is scored anyway and marked,
  // so a good fit that was hidden comes back into view rather than vanishing.
  const all = (onBoard || []).slice();
  (researched || []).forEach(function (s) { if (!here[s.id]) all.push(s); });

  const rows = scoreBoard(swim, bests, all);
  const out = [];
  rows.forEach(function (row) {
    const fit = fitScore(swim, row);
    if (!fit) return;
    out.push({ school: row.school, fit: fit, row: row, onBoard: Boolean(here[row.school.id]) });
  });

  out.sort(function (a, b) {
    if (a.fit.share !== b.fit.share) return a.fit.share - b.fit.share;
    // A tie on position goes to the school with a real squad behind it. Being
    // quicker than one recorded time is not the same as leading a group of six,
    // and sorting on position alone put the weaker evidence first.
    if (a.fit.ranked !== b.fit.ranked) return b.fit.ranked - a.fit.ranked;
    return b.fit.events - a.fit.events;
  });

  return {
    all: out,
    shortlist: out.slice(0, limit || 12),
    race: out.filter(function (x) { return x.fit.band === 'race'; }).length,
    compete: out.filter(function (x) { return x.fit.band === 'compete'; }).length,
    missing: out.filter(function (x) { return !x.onBoard; }).length
  };
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
  fitScore: fitScore,
  FIT_BANDS: FIT_BANDS,
  bestFits: bestFits,
  convertedNote: convertedNote,
  TIERS: TIERS,
  NOT_SCORED: NOT_SCORED,
  tierFor: tierFor,
  CONFERENCES: CONFERENCES,
  conferenceContext: conferenceContext,
  ordinal: ordinal,
  scoreSchool: scoreSchool,
  scoreBoard: scoreBoard,
  suggestPriority: suggestPriority,
  whatIfFaster: whatIfFaster
};

if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof window !== 'undefined') window.Board = api;

})();
