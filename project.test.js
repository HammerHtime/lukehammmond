// project.test.js
// The projection is the one part of this app that states things which have not
// happened. So it gets the strictest tests, and most of them are about what it
// REFUSES to claim.

const S = require('./swim.js');
const B = require('./board.js');
const P = require('./project.js');
const Sc = require('./schools.js');
const C = require('./convert.js');
const { SWIMMER, SEED_RESULTS } = require('./swimmer.js');

let passed = 0;
let failed = 0;
function check(name, actual, expected) {
  const a = JSON.stringify(actual); const e = JSON.stringify(expected);
  if (a === e) { passed += 1; return; }
  failed += 1;
  console.log('  FAIL  ' + name + '\n        got      ' + a + '\n        expected ' + e);
}
function ok(name, condition) {
  if (condition) { passed += 1; return; }
  failed += 1;
  console.log('  FAIL  ' + name);
}

const results = SEED_RESULTS.map(function (r) { return S.normaliseResult(r).result; });
const BIRTH = '2011-09-14';
const p400 = S.progression(results, 400, 'free', 'LCM');
const p1500 = S.progression(results, 1500, 'free', 'LCM');
const pIM = S.progression(results, 400, 'im', 'SCM');

// ---------- the age, which shifts everything if it is wrong ----------
// He was born in September and the season runs to July, so he is still the
// previous age when he races. The rates nearly halve each year, so getting
// this wrong by one would change every number in the file.
check('his 2026 swims were at fourteen', P.ageInSeason(BIRTH, 2026), 14);
check('2027 at fifteen', P.ageInSeason(BIRTH, 2027), 15);
check('and he graduates at seventeen', P.ageInSeason(BIRTH, 2029), 17);
check('a January birthday would count a year older', P.ageInSeason('2011-01-20', 2026), 15);
check('rubbish has no age', P.ageInSeason('', 2026), null);

// ---------- the rate comes off a paper, not out of the air ----------
check('the source is the one that was read', P.SOURCE.key, 'ruiz-navarro-born-2025');
ok('and it is citable', /^https:\/\/pmc\.ncbi\.nlm\.nih\.gov\//.test(P.SOURCE.url));
check('the 400 free at 15 to 16', Math.round(P.rateFor(400, 'free', 15).rate * 10000) / 100, 3.07);
check('at 16 to 17', Math.round(P.rateFor(400, 'free', 16).rate * 10000) / 100, 1.94);
check('the 1500 is flatter than the 400 at 16 to 17',
  P.rateFor(1500, 'free', 16).rate < P.rateFor(400, 'free', 16).rate, true);
// Every source says improvement keeps slowing. If a step ever reads faster than
// the one before it, a number has been typed in wrong.
[200, 400, 1500].forEach(function (d) {
  for (let age = 14; age <= 16; age += 1) {
    const a = P.rateFor(d, 'free', age);
    const b = P.rateFor(d, 'free', age + 1);
    if (a && b) ok(d + ' free keeps slowing at ' + age, b.rate < a.rate);
  }
});
check('an age off the end of the table has no rate', P.rateFor(400, 'free', 30), null);
check('and so does an event with no curve', P.rateFor(100, 'fly', 15), null);

// ---------- the 400 IM is a proxy, and says so every time ----------
// The study is freestyle only. There is no published progression rate for the
// 400 IM anywhere that was checked, so the 400 free curve stands in and the
// board prints the label.
const imRate = P.rateFor(400, 'im', 15);
check('the IM borrows the 400 free rate', imRate.rate, P.rateFor(400, 'free', 15).rate);
check('and admits whose rate it is', imRate.proxy, '400-im');
ok('with a reason attached', /No published progression rate/.test(imRate.proxyNote));
check('a freestyle rate is not a proxy', P.rateFor(400, 'free', 15).proxy, null);

// ---------- the projection ----------
const to2029 = P.toGraduation(S, p400, BIRTH, 2029);
check('three seasons to graduation', to2029.length, 3);
check('ending in his graduating year', to2029[2].season, 2029);
check('at seventeen', to2029[2].age, 17);
ok('every one is flagged as a projection', to2029.every(function (x) { return x.projection; }));
ok('and labelled where it came from', /on the published curve/.test(to2029[0].label));
ok('each season is quicker than the last', to2029.every(function (x, i, all) {
  return i === 0 || x.hundredths < all[i - 1].hundredths; }));
ok('and all of them quicker than today', to2029[0].hundredths < p400.current.hundredths);

// The number itself, so a change to the curve cannot pass silently.
check('2027 on the curve', to2029[0].time, '3:59.45');
check('2029 on the curve', to2029[2].time, '3:47.59');
check('the 1500 in 2029', P.toGraduation(S, p1500, BIRTH, 2029)[2].time, '15:33.74');

// Nothing to project from, nothing projected.
check('a season already past is refused', P.toSeason(S, p400, BIRTH, 2025), null);
check('and so is the current one', P.toSeason(S, p400, BIRTH, 2026), null);
check('no progression, no projection', P.toGraduation(S, null, BIRTH, 2029), []);

// ---------- the ceiling, which is the whole safety net ----------
// A time projection has no ceiling and points do. A drop that looks modest in
// seconds can quietly claim he will be a world junior finalist.
check('points are exact off his own swim', P.pointsAt(25086, 674, 25086), 674);
ok('a quicker time scores higher', P.pointsAt(25086, 674, 24000) > 674);
check('no points in means no points out', P.pointsAt(25086, null, 24000), null);
check('an ordinary projection is not flagged', P.overreach(775), '');
ok('but one above the ceiling is', /world junior final/.test(P.overreach(950)));
check('the ceiling is stated, not hidden', P.CEILING, 900);
// His own 2029 400 free lands over it, and the app says so rather than
// printing a national record with a straight face.
ok('the 2029 400 free is flagged', to2029[2].overreach !== '');
check('while 2027 is not', to2029[0].overreach, '');
ok('and the 1500 never is',
  P.toGraduation(S, p1500, BIRTH, 2029).every(function (x) { return x.overreach === ''; }));

// ---------- how he has actually tracked the curve ----------
// This is reported and never applied. Two seasons is not enough to re-fit a
// curve built from 13,310 swimmers, but it is enough to say whether the curve
// is describing him at all.
const t400 = P.tracking(p400, BIRTH, 400, 'free');
check('three of his steps have a published rate', t400.steps.length, 3);
ok('and he has tracked it closely', Math.abs(t400.overall - 1) < 0.15);
ok('the sentence says how many seasons', /Over 3 seasons/.test(t400.sentence));
// One season on its own is noise, and the wording has to say so.
const t1500 = P.tracking(p1500, BIRTH, 1500, 'free');
check('the 1500 only has one', t1500.steps.length, 1);
ok('so it warns that is not a trend', /One season is not a trend/.test(t1500.sentence));
check('nothing to compare against gives nothing', P.tracking(null, BIRTH, 400, 'free'), null);

// ---------- against a real programme ----------
const rows = B.scoreBoard(S, C.yardBests(S, results), Sc.seedSchools());
function row(id) { return rows.filter(function (r) { return r.school.id === id; })[0]; }
const fair500 = row('fairfield').comparisons.filter(function (c) {
  return c.event === '500-free-SCY'; })[0];

// He is fourth of five there today. A projection has to be converted the same
// way his current time is, so this uses the yard event's own progression.
const yardProj = P.toSeason(S, S.progression(results, 400, 'free', 'LCM'), BIRTH, 2029);
const place = P.placeAgainst(S, B, Math.round(yardProj.hundredths * 1.105), fair500);
ok('it places him against their squad', place !== null);
ok('and says which squad that was', /squad they had in 2026/.test(place.sentence));
ok('moving up is reported as moving up', place.moved);
check('nothing to place against gives nothing', P.placeAgainst(S, B, 27000, null), null);

const conf = B.conferenceContext(S, row('fairfield').school, fair500);
const against = P.conferenceAgainst(S, Math.round(yardProj.hundredths * 1.105), conf);
ok('and against the conference winner', against !== null);
ok('naming the conference', /MAAC/.test(against.sentence));
check('no conference on file, nothing said', P.conferenceAgainst(S, 27000, null), null);

// ---------- the spread, which is the honest part ----------
// At 16 to 17 the between-swimmer SD is larger than the mean, ie, a real number
// of boys get slower. A projection that hides that is a lie by omission.
ok('the spread is said in words', /got slower rather than faster/.test(
  P.spread({ rate: 0.0194, sd: 0.0246 })));
ok('and a tight step reads differently', /varied by about/.test(
  P.spread({ rate: 0.0455, sd: 0.0301 })));
check('no spread recorded, nothing claimed', P.spread({ rate: 0.03, sd: 0 }), '');

// ---------- it never touches a verdict ----------
// The one rule that matters. Scoring must be identical whether this file is
// loaded or not.
const before = JSON.stringify(B.scoreBoard(S, C.yardBests(S, results), Sc.seedSchools()));
P.toGraduation(S, p400, BIRTH, 2029);
P.tracking(p400, BIRTH, 400, 'free');
const after = JSON.stringify(B.scoreBoard(S, C.yardBests(S, results), Sc.seedSchools()));
check('projecting changes no verdict anywhere', after, before);

// And the board must not import it, ie, no verdict can ever depend on a guess.
const boardSrc = require('fs').readFileSync(require('path').join(__dirname, 'board.js'), 'utf8');
ok('board.js does not reach for the projection', boardSrc.indexOf('Project') === -1);
ok('nor for the curve', boardSrc.indexOf('toGraduation') === -1);

console.log((failed === 0 ? '  PASS' : '  FAIL') + '  project.test.js  ' + (passed + failed) + ' checks, ' + failed + ' failed');
process.exit(failed === 0 ? 0 : 1);
