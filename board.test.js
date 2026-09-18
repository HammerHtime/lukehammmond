// board.test.js
// The safety net. Run after every change.
//
// The board is the engine. If a change here alters a verdict, that is an
// engine change, and it needs a reason written down before the numbers move.

const S = require('./swim.js');
const C = require('./convert.js');
const St = require('./standards.js');
const Sc = require('./schools.js');
const B = require('./board.js');
const R = require('./recruiting.js');
const { SWIMMER, SEED_RESULTS } = require('./swimmer.js');

let passed = 0;
let failed = 0;

function check(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) { passed += 1; return; }
  failed += 1;
  console.log('  FAIL  ' + name + '\n        got      ' + a + '\n        expected ' + e);
}

function ok(name, condition) {
  if (condition) { passed += 1; return; }
  failed += 1;
  console.log('  FAIL  ' + name);
}

// ---------- times ----------
check('parse a sprint', S.parseTime('25.69'), 2569);
check('parse a middle distance', S.parseTime('1:58.35'), 11835);
check('parse a mile', S.parseTime('16:38.24'), 99824);
check('parse a comma decimal', S.parseTime('1:58,35'), 11835);
check('reject rubbish', S.parseTime('fast'), null);
check('reject an empty time', S.parseTime(''), null);
check('reject sixty seconds inside a minute', S.parseTime('1:60.00'), null);
check('format a sprint', S.formatTime(2569), '25.69');
check('format a middle distance', S.formatTime(11835), '1:58.35');
check('format a mile', S.formatTime(99824), '16:38.24');
check('pad the hundredths', S.formatTime(6005), '1:00.05');
check('a drop reads negative', S.formatGap(-142), '-1.42');
check('a shortfall reads positive', S.formatGap(328), '+3.28');
ok('a time survives a round trip', S.formatTime(S.parseTime('4:52.37')) === '4:52.37');

// ---------- events ----------
ok('the 500 free is a yards event', S.isRealEvent(500, 'free', 'SCY'));
ok('the 500 free is not a metres event', !S.isRealEvent(500, 'free', 'LCM'));
ok('the 400 free is a metres event', S.isRealEvent(400, 'free', 'LCM'));
ok('there is no 100 IM in long course', !S.isRealEvent(100, 'im', 'LCM'));
ok('there is a 100 IM in short course metres', S.isRealEvent(100, 'im', 'SCM'));

// ---------- the seed results ----------
const normalised = SEED_RESULTS.map(function (r) { return S.normaliseResult(r); });
check('every seeded result is valid', normalised.filter(function (n) { return !n.ok; }).length, 0);
const results = normalised.map(function (n) { return n.result; });
check('all thirty five swims survive', results.length, 35);

check('a bad course is refused', S.normaliseResult({ distance: 200, stroke: 'free', course: 'SCX', time: '1:58.35', date: '2025-11-06' }).ok, false);
check('an unswum event is refused', S.normaliseResult({ distance: 500, stroke: 'free', course: 'LCM', time: '4:37.20', date: '2025-11-06' }).ok, false);
check('a missing date is refused', S.normaliseResult({ distance: 200, stroke: 'free', course: 'LCM', time: '1:58.35', date: '' }).ok, false);
check('an unreadable time is refused', S.normaliseResult({ distance: 200, stroke: 'free', course: 'LCM', time: 'quick', date: '2025-11-06' }).ok, false);

const bests = S.personalBests(results);
check('the best 200 free long course', bests['200-free-LCM'].time, '1:59.75');
check('the best 400 free long course', bests['400-free-LCM'].time, '4:10.86');
check('the best 1500 free long course', bests['1500-free-LCM'].time, '16:59.80');
check('the best 400 IM long course', bests['400-im-LCM'].time, '4:52.37');

// ---------- metres to yards ----------
// Eight of the ten supplied pairs reproduce exactly and two land a hundredth
// out, because the factors are held to four decimals. One hundredth is the
// stated tolerance. Tightening it by tuning a factor would be fitting noise.
const yards = C.yardBests(S, results);
const SUPPLIED = {
  '50-free-SCY': '22.72', '100-free-SCY': '48.22', '200-free-SCY': '1:43.58',
  '500-free-SCY': '4:37.20', '1000-free-SCY': '9:38.45', '1650-free-SCY': '16:24.10',
  '100-back-SCY': '53.58', '200-back-SCY': '1:53.96', '200-im-SCY': '1:59.91',
  '400-im-SCY': '4:12.90'
};
Object.keys(SUPPLIED).forEach(function (eventId) {
  const got = yards[eventId];
  ok('a yard equivalent exists for ' + eventId, Boolean(got));
  if (!got) return;
  const drift = Math.abs(got.hundredths - S.parseTime(SUPPLIED[eventId]));
  ok(eventId + ' is within a hundredth of the supplied conversion', drift <= 1);
  ok(eventId + ' is marked an estimate', got.estimated === true);
});
check('the 500 comes from the 400 metres', yards['500-free-SCY'].from.event, '400-free-LCM');
check('the mile comes from the 1500 metres', yards['1650-free-SCY'].from.event, '1500-free-LCM');
check('an event with no mapping gets no conversion', C.toYards(S, bests['200-breast-LCM']), null);

// ---------- the board ----------
const schools = Sc.seedSchools();
check('the board is seeded', schools.length, 17);
// ---------- the coach contacts ----------
// Every address was read off the school's own athletics site on 18 September
// 2026. The test does not check that an address still works, because it cannot.
// It checks that the record is shaped honestly, ie, nothing is marked verified
// without both an address and the page it was read from.
check('every school has a contact', schools.filter(Sc.isSendable).length, 17);
schools.forEach(function (s) {
  ok(s.name + ' records where the address came from', Boolean(s.staffUrl));
  ok(s.name + ' records when it was checked', Boolean(s.verifiedOn));
  ok(s.name + ' is not verified without an address', !s.verified || Sc.isEmail(s.email));
});

// Three addresses look wrong and are not. A future tidy-up must not "fix" them.
check('Manhattan keeps the j prefix', schools.filter(function (s) { return s.id === 'manhattan'; })[0].email, 'jhansbury01@manhattan.edu');
check('American keeps the single t', schools.filter(function (s) { return s.id === 'american'; })[0].email, 'gbartlet@american.edu');
check('RPI keeps the shared mailbox', schools.filter(function (s) { return s.id === 'rpi'; })[0].email, 'swimdive@rpi.edu');
ok('and RPI says it is shared', schools.filter(function (s) { return s.id === 'rpi'; })[0].contactNote.indexOf('SHARED') !== -1);

// Loyola is the only programme with a named recruiting coordinator.
check('Loyola records the recruiting coordinator', schools.filter(function (s) { return s.id === 'loyolamd'; })[0].assistantEmail, 'jvenit@loyola.edu');

// A school whose head coach changed recently carries the warning, because a
// stale name is the most likely way an email goes to the wrong person.
['ithaca', 'marist', 'bucknell', 'american', 'stbonaventure'].forEach(function (id) {
  var s = schools.filter(function (x) { return x.id === id; })[0];
  ok(id + ' warns about the former coach', /former|out of date|stale|left in|newly hired|replacing/i.test(s.contactNote));
});

const rows = B.scoreBoard(S, yards, schools);
function row(id) { return rows.filter(function (r) { return r.school.id === id; })[0]; }

check('Gannon is a current fit', row('gannon').computedFit, 'Current fit');
check('Gannon is ahead on the 500', row('gannon').comparisons[0].ahead, true);
check('Canisius is a current fit', row('canisius').computedFit, 'Current fit');
check('St. Bonaventure sits inside the roster group', row('stbonaventure').comparisons[0].inside, true);
check('St. Bonaventure is a current fit', row('stbonaventure').computedFit, 'Current fit');
check('Niagara is a target', row('niagara').computedFit, 'Target');
check('American spans target to reach', row('american').computedFit, 'Target / reach');
check('Ithaca reads as one span, not three', row('ithaca').computedFit, 'Target / reach');
check('Marist spans target to reach', row('marist').computedFit, 'Target / reach');

// A school with no swimmer times found is not assessed. That is silence, not
// a verdict, and it must never be scored as though the gap were zero.
check('Saint Peters is not assessed', row('saintpeters').computedFit, 'Not assessed');
check('Saint Peters gets no suggested priority', row('saintpeters').suggestedPriority, null);
check('Saint Peters does not report a disagreement', row('saintpeters').disagrees, false);

// The engine reads Bucknell one band kinder than the recorded call, because
// the recorded benchmark is the slower end of their distance group. The board
// reports the disagreement rather than silently overriding a human judgement.
check('Bucknell keeps its recorded priority', row('bucknell').recordedPriority, 'P3');
check('the engine suggests P2 for Bucknell', row('bucknell').suggestedPriority, 'P2');
check('and says so', row('bucknell').disagrees, true);

// Confidence is about evidence, never about odds.
check('high confidence where real times exist', row('stbonaventure').confidence, 'High');
check('low confidence where none were gathered', row('fairfield').confidence, 'Low');

// A champion and a roster time are not the same statement.
check('RIT is benchmarked against a champion', row('rit').comparisons[0].basis, 'champion');
check('American is benchmarked against a roster swimmer', row('american').comparisons[0].basis, 'roster');

// ---------- what a time drop unlocks ----------
const faster500 = B.whatIfFaster(S, yards, schools, '500-free-SCY', '4:32.00');
check('a 4:32 500 moves two schools up', faster500.moved.length, 2);
ok('Niagara is one of them', faster500.moved.some(function (m) { return m.school.indexOf('Niagara') !== -1 && m.to === 'P1'; }));
const fasterMile = B.whatIfFaster(S, yards, schools, '1650-free-SCY', '16:00.00');
ok('a 16:00 mile moves RIT up', fasterMile.moved.some(function (m) { return m.school.indexOf('Rochester') !== -1 && m.to === 'P1'; }));
check('a slower time moves nothing up', B.whatIfFaster(S, yards, schools, '500-free-SCY', '4:45.00').moved.filter(function (m) { return m.to === 'P1'; }).length, 0);
check('an unreadable what-if returns nothing', B.whatIfFaster(S, yards, schools, '500-free-SCY', 'quick'), null);

// ---------- standards ----------
const progress = St.progressAgainst(S, results, 'can-jr-trials');
check('four Junior Trials cuts are tracked', progress.length, 4);
check('the 400 free is closest to its cut', S.formatGap(progress[1].gap.behindBy), '+2.13');
ok('no cut is claimed as made yet', progress.every(function (p) { return p.gap.made === false; }));
check('an unknown standard yields nothing', St.gapToCut(S.parseTime, 10000, 'nope', '200-free-LCM'), null);
ok('the Junior Trials cuts are flagged unconfirmed', St.STANDARDS[0].confirmed === false);

// ---------- the contact rule ----------
check('a D1 coach cannot reply until June 2027', R.replyDateFor('D1', 2029), '2027-06-15');
check('the window is shut today', R.contactWindow('D1', 2029, '2026-09-18').open, false);
check('and open the day it opens', R.contactWindow('D1', 2029, '2027-06-15').open, true);
check('and open after', R.contactWindow('D1', 2029, '2027-08-01').open, true);
ok('the D2 rule is marked unconfirmed', R.CONTACT_RULES.D2.confirmed === false);
ok('the shut message names the date', R.contactWindow('D1', 2029, '2026-09-18').message.indexOf('15 June 2027') !== -1);

// ---------- the email ----------
const draft = R.draftEmail({
  swim: S, standards: St, swimmer: SWIMMER, results: results, today: '2026-09-18',
  profileUrl: 'https://example.org',
  school: { id: 'canisius', name: 'Canisius University', coach: 'Pat Smith', email: 'coach@canisius.edu', division: 'D1' }
});
ok('the email greets the coach by name', draft.body.indexOf('Dear Coach Smith') === 0);
ok('the email names the school', draft.body.indexOf('Canisius University') !== -1);
ok('the email carries the 400 free', draft.body.indexOf('4:10.86') !== -1);
ok('the email carries the profile link', draft.body.indexOf('https://example.org?c=canisius') !== -1);
ok('the email explains the reply date', draft.body.indexOf('15 June 2027') !== -1);
check('the email has no warnings when the school is complete', draft.warnings.length, 0);

// The email for a real school, end to end.
const realDraft = R.draftEmail({
  swim: S, standards: St, swimmer: SWIMMER, results: results, today: '2026-09-18',
  profileUrl: 'https://example.org',
  school: schools.filter(function (s) { return s.id === 'gannon'; })[0]
});
check('it is addressed to the verified address', realDraft.to, 'medo001@gannon.edu');
ok('it greets Coach Medo', realDraft.body.indexOf('Dear Coach Medo') === 0);
check('and raises no warnings', realDraft.warnings.length, 0);

const noContact = R.draftEmail({
  swim: S, standards: St, swimmer: SWIMMER, results: results, today: '2026-09-18',
  profileUrl: 'https://example.org', school: { id: 'x', name: 'X', division: 'D1' }
});
check('a missing coach email is a warning', noContact.warnings.length, 1);

// ---------- the importer ----------
const pasted = Sc.parsePaste([
  'School\tDivision\tCoach\tEmail',
  'Canisius University\tD1\tPat Smith\tcoach@canisius.edu',
  'Bad University\tD9\tNo One\tnope',
  'Half A Row'
].join('\n'));
check('one good row is imported', pasted.schools.length, 1);
check('two bad rows are reported, not dropped', pasted.rejected.length, 2);
check('an imported contact is verified', pasted.schools[0].verified, true);
ok('an imported school is sendable', Sc.isSendable(pasted.schools[0]));
check('a comma separated row works too', Sc.parsePaste('Iona University,D1,A Coach,a@iona.edu').schools.length, 1);

const merged = Sc.mergeSchools(schools, pasted.schools);
check('the merge adds nothing new for a known school', merged.added, 0);
check('the merge updates the known school', merged.updated, 1);
const mergedCanisius = merged.schools.filter(function (s) { return s.id === 'canisius'; })[0];
check('the merge keeps the benchmarks', mergedCanisius.benchmarks.length, 1);
check('the merge fills in the contact', mergedCanisius.email, 'coach@canisius.edu');
check('the merge keeps the recorded priority', mergedCanisius.priority, 'P1');

const blanked = Sc.mergeSchools(merged.schools, [{ id: 'canisius', name: 'Canisius University', division: 'D1', email: '', verified: false }]);
check('a blank never overwrites a verified contact',
  blanked.schools.filter(function (s) { return s.id === 'canisius'; })[0].email, 'coach@canisius.edu');

check('a nonsense address is refused', Sc.normaliseSchool({ name: 'A', division: 'D1', email: 'not-an-address' }).ok, false);
check('a school with no division is refused', Sc.normaliseSchool({ name: 'A' }).ok, false);
check('verified is false without an address', Sc.normaliseSchool({ name: 'A', division: 'D1', verified: true }).school.verified, false);

console.log((failed === 0 ? '  PASS' : '  FAIL') + '  board.test.js  ' + (passed + failed) + ' checks, ' + failed + ' failed');
process.exit(failed === 0 ? 0 : 1);
