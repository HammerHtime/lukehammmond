// project.js
// Where his times could be by the year he graduates, using a published curve
// rather than a line drawn through his own four swims.
//
// READ THIS BEFORE TRUSTING A NUMBER OUT OF THIS FILE.
//
// A projection is not evidence. Everything else here refuses to state what it
// cannot source, and this file states things that have not happened. So it is
// kept out of the scoring entirely. It never moves a tier, never changes a
// comparison, never touches a verdict. It is drawn on the board as a separate,
// labelled thing that a person can ignore.
//
// WHY THE OBVIOUS METHOD IS WRONG
//
// His 400 free went 5:20.53, 4:54.65, 4:18.07, 4:10.86 across four seasons.
// Average that and you get 7.8% a year, which projects 3:30 by 2029, ie,
// quicker than the Canadian senior record. Any model that hands a fifteen year
// old a national record is worse than no model. The drops were 8.1%, 12.4%,
// then 2.8%, because he came out of the fast part of his growth, and the
// average of a curve like that describes no year that will ever happen again.
//
// WHAT IS USED INSTEAD
//
// Ruiz-Navarro JJ, Born DP. "Annual Performance Progression in Swimming Across
// Competition Levels and Race Distances." Journal of Functional Morphology and
// Kinesiology 2025;10(3):297. doi:10.3390/jfmk10030297.
// Free full text: https://pmc.ncbi.nlm.nih.gov/articles/PMC12372078/
// Table 2, male swimmers, read 18 September 2026.
//
// 13,310 male swimmers from the European Aquatics database, each tracked year
// on year, split by performance level on World Aquatics points. It is the same
// swimmers followed through time, which is the only kind of data that answers
// "how much does a boy improve between 15 and 16".
//
// Level 3 is used, ie, 650 to 799 points, because that is where he sits. His
// 400 free is 674. Level 2, above 800, is within about 0.2 points a year of
// Level 3 at these ages, so the choice barely moves the answer.
//
// WHAT WAS DELIBERATELY NOT USED
//
// Federation motivational standards and meet qualifying times, ie, USA
// Swimming, Swim Ontario, Swimming Canada. They look like an age curve and are
// not one. They compare different swimmers at each age rather than following
// the same ones, so they carry dropout and selection rather than improvement,
// and every band in them implies the same percentage to two decimal places,
// which is the signature of one curve scaled by a constant rather than of
// anything measured. They give roughly half the longitudinal rate. Using them
// would understate him for a reason that has nothing to do with him.
(function () {

const SOURCE = {
  key: 'ruiz-navarro-born-2025',
  cite: 'Ruiz-Navarro and Born, Journal of Functional Morphology and Kinesiology 2025;10(3):297',
  url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12372078/',
  table: 'Table 2, male swimmers, performance level 3, ie, 650 to 799 World Aquatics points',
  n: 13310,
  recorded: '2026-09-18'
};

// Mean annual improvement and the between-swimmer standard deviation, per age
// step, males at level 3. Read off Table 2. The SD is carried because it is the
// point, ie, at 16 to 17 the spread between swimmers is larger than the average
// itself, and a projection that hides that is lying by omission.
const CURVE = {
  '200-free': { n: 6005, steps: {
    '9-10': [10.24, 7.21], '10-11': [8.44, 6.39], '11-12': [8.83, 5.50],
    '12-13': [7.28, 4.23], '13-14': [6.63, 3.31], '14-15': [4.77, 2.86],
    '15-16': [3.35, 2.68], '16-17': [1.99, 2.14], '17-18': [1.34, 2.05] } },
  '400-free': { n: 3627, steps: {
    '10-11': [9.43, 5.00], '11-12': [9.05, 3.41], '12-13': [6.94, 3.65],
    '13-14': [6.45, 3.44], '14-15': [4.55, 3.01], '15-16': [3.07, 2.68],
    '16-17': [1.94, 2.46], '17-18': [1.12, 2.25] } },
  '800-free': { n: 1678, steps: {
    '12-13': [4.62, 0], '13-14': [6.79, 0], '14-15': [4.49, 0],
    '15-16': [3.03, 2.80], '16-17': [2.12, 2.42], '17-18': [1.06, 2.18] } },
  '1500-free': { n: 1350, steps: {
    '13-14': [6.04, 2.75], '14-15': [4.23, 2.73], '15-16': [2.83, 2.67],
    '16-17': [1.61, 2.30], '17-18': [0.99, 2.19] } }
};

// The study is freestyle only. There is no published annual progression rate
// for the 400 IM at any age, in any source that was checked, so the 400 free
// curve stands in for it and says so every time it is used. A labelled
// assumption is not the same thing as a number, and the board prints the label.
const PROXY = {
  '400-im': { use: '400-free', why: 'No published progression rate exists for the 400 IM. The 400 free curve is standing in for it.' },
  '200-im': { use: '200-free', why: 'No published progression rate exists for the 200 IM at these ages. The 200 free curve is standing in for it.' }
};

// Which curve an event reads from. Distance and stroke only, ie, course does
// not change how fast a boy grows.
function curveKey(distance, stroke) {
  return String(distance) + '-' + String(stroke);
}

function rateFor(distance, stroke, fromAge) {
  const wanted = curveKey(distance, stroke);
  const proxy = PROXY[wanted];
  const key = proxy ? proxy.use : wanted;
  const curve = CURVE[key];
  if (!curve) return null;

  const step = curve.steps[fromAge + '-' + (fromAge + 1)];
  if (!step) return null;

  return {
    rate: step[0] / 100,
    sd: step[1] / 100,
    step: fromAge + ' to ' + (fromAge + 1),
    proxy: proxy ? wanted : null,
    proxyNote: proxy ? proxy.why : '',
    source: SOURCE
  };
}

// His age during a given season, ie, the age he was when the swims happened.
// Born 14 September 2011 and the season runs to July, so he is still the
// previous age when he races. Getting this wrong shifts every rate by a year
// and the rates nearly halve each year, so it matters more than it looks.
function ageInSeason(birth, season) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(birth || ''));
  if (!m) return null;
  const born = Number(m[1]);
  const bornAfterJuly = Number(m[2]) > 7;
  const age = Number(season) - born - (bornAfterJuly ? 1 : 0);
  return age >= 0 ? age : null;
}

// How he has actually tracked against the curve, which is the only honest way
// to read a projection made for somebody else's average swimmer.
//
// Returns the ratio of what he did to what the curve expected, per step. Above
// 1 means he beat it. This is reported, never applied, because two seasons is
// not enough to re-fit a curve built from 13,310 swimmers.
function tracking(progression, birth, distance, stroke) {
  if (!progression || progression.seasons.length < 2) return null;
  const out = [];
  for (let i = 1; i < progression.seasons.length; i += 1) {
    const from = progression.seasons[i - 1];
    const to = progression.seasons[i];
    const age = ageInSeason(birth, from.season);
    if (age === null) continue;
    const expected = rateFor(distance, stroke, age);
    if (!expected || !expected.rate) continue;
    const actual = (from.hundredths - to.hundredths) / from.hundredths;
    out.push({
      step: from.season + ' to ' + to.season,
      age: expected.step,
      actual: actual,
      expected: expected.rate,
      ratio: actual / expected.rate
    });
  }
  if (!out.length) return null;

  // Compounded over every step we have, which is fairer than averaging
  // percentages and is what "has he kept up" actually means.
  let mine = 1;
  let curve = 1;
  out.forEach(function (s) { mine *= (1 - s.actual); curve *= (1 - s.expected); });

  const how = out.length === 1 ? 'Over one season' : 'Over ' + out.length + ' seasons';
  return {
    steps: out,
    overall: (1 - mine) / (1 - curve),
    ahead: mine < curve,
    // One season on its own is noise. A boy has a quiet year and a loud year
    // and neither is a trend, so the count is always said.
    sentence: how + ' you have dropped ' +
      (mine < curve ? 'more' : 'less') + ' than the published curve expected, ie, ' +
      (Math.round((1 - mine) / (1 - curve) * 100) / 100) + ' times what it predicted.' +
      (out.length < 2 ? ' One season is not a trend.' : '')
  };
}

// The projection itself. One season at a time, compounding the published rate
// for the age he will actually be.
function toSeason(swim, progression, birth, season) {
  if (!progression || !progression.current) return null;
  const from = Number(progression.current.season);
  const target = Number(season);
  if (!Number.isFinite(from) || !Number.isFinite(target) || target <= from) return null;

  const parts = String(progression.event || '').split('-');
  const distance = Number(parts[0]);
  const stroke = parts[1];

  let factor = 1;
  const steps = [];
  let proxyNote = '';
  for (let year = from; year < target; year += 1) {
    const age = ageInSeason(birth, year);
    const step = rateFor(distance, stroke, age);
    if (!step) return null;
    factor *= (1 - step.rate);
    if (step.proxyNote) proxyNote = step.proxyNote;
    steps.push({ season: year + 1, age: age + 1, rate: step.rate, sd: step.sd });
  }

  const hundredths = Math.round(progression.current.hundredths * factor);
  const points = pointsAt(progression.current.hundredths, progression.current.points, hundredths);
  return {
    points: points,
    overreach: overreach(points),
    season: target,
    age: ageInSeason(birth, target),
    from: progression.current.time,
    fromSeason: from,
    hundredths: hundredths,
    time: swim.formatTime(hundredths),
    drop: swim.formatGap(hundredths - progression.current.hundredths),
    steps: steps,
    proxy: Boolean(proxyNote),
    proxyNote: proxyNote,
    source: SOURCE,
    projection: true,
    // Said every time, because the number looks like a time and is not one.
    label: 'Projected ' + target + ', on the published curve'
  };
}

// World Aquatics points for a projected time. This is exact arithmetic, not an
// assumption: points are 1000 times the cube of (base time over time), so the
// base cancels and the projection can be scored off his own current swim.
//
// It exists as the sanity check on the whole file. A time projection has no
// ceiling and points do, ie, 1000 is the world record. A drop that looks modest
// in seconds can quietly be a claim that he will be a world junior finalist,
// and this is what says so.
const CEILING = 900;

function pointsAt(currentHundredths, currentPoints, projectedHundredths) {
  if (!currentPoints || !projectedHundredths) return null;
  const ratio = currentHundredths / projectedHundredths;
  return Math.round(currentPoints * ratio * ratio * ratio);
}

function overreach(points) {
  if (!Number.isFinite(points) || points <= CEILING) return '';
  return 'This lands at about ' + points + ' World Aquatics points, ie, world junior final ' +
    'territory. The curve it came from was built from swimmers who peaked well below that, ' +
    'so treat this as the top of what the model can say rather than a forecast.';
}

// Every season from the next one to the year he graduates.
function toGraduation(swim, progression, birth, classOf) {
  if (!progression || !progression.current) return [];
  const out = [];
  for (let year = Number(progression.current.season) + 1; year <= Number(classOf); year += 1) {
    const one = toSeason(swim, progression, birth, year);
    if (one) out.push(one);
  }
  return out;
}

// What a projected time would mean against one programme, using its CURRENT
// squad, because that is the only squad anybody has.
//
// This caveat is the reason the sentence says it out loud. Their 2029 roster is
// not their 2026 roster and nobody knows who will be on it. What this answers
// is "would that time have been good enough last season", which is a real
// question and is not the same question.
function placeAgainst(swim, board, projectedHundredths, comparison) {
  if (!comparison || !comparison.theirTimes || !comparison.theirTimes.length) return null;

  const at = function (h) {
    return comparison.theirTimes.filter(function (t) { return t < h; }).length + 1;
  };
  const of = comparison.theirTimes.length + 1;
  const then = at(projectedHundredths);
  const now = at(comparison.mineHundredths);

  return {
    position: then, of: of, today: now, moved: then < now,
    sentence: then === now
      ? 'Still ' + board.ordinal(then) + ' of ' + of + ' on the squad they had in 2026.'
      : board.ordinal(then) + ' of ' + of + ' on the squad they had in 2026, up from ' +
        board.ordinal(now) + '.'
  };
}

// And against the time that won their conference.
function conferenceAgainst(swim, projectedHundredths, conference) {
  if (!conference) return null;
  const winner = swim.parseTime(conference.winner);
  if (winner === null) return null;
  const gap = projectedHundredths - winner;
  return {
    gap: gap,
    inside: gap <= 0,
    sentence: gap <= 0
      ? 'That would be inside the time that won the ' + conference.conference + ' in 2026.'
      : 'Still ' + swim.formatGap(gap).replace('+', '') + ' off the time that won the ' +
        conference.conference + ' in 2026.'
  };
}

// The spread, said in words. At 16 to 17 the between-swimmer SD is larger than
// the mean, which means a real number of boys get slower. A projection that
// does not say this is a lie by omission.
function spread(step) {
  if (!step || !step.sd) return '';
  if (step.sd >= step.rate) {
    return 'In that study the spread between swimmers was bigger than the average, ie, ' +
      'a real number of boys this age got slower rather than faster.';
  }
  return 'In that study individual swimmers varied by about ' +
    Math.round(step.sd * 1000) / 10 + ' points either side of the average.';
}

const api = {
  SOURCE: SOURCE,
  CURVE: CURVE,
  PROXY: PROXY,
  CEILING: CEILING,
  rateFor: rateFor,
  pointsAt: pointsAt,
  overreach: overreach,
  ageInSeason: ageInSeason,
  tracking: tracking,
  toSeason: toSeason,
  toGraduation: toGraduation,
  placeAgainst: placeAgainst,
  conferenceAgainst: conferenceAgainst,
  spread: spread
};

if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof window !== 'undefined') window.Project = api;

})();
