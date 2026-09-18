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
// Hamilton is the example because it still has none. Saint Peter's used to be
// here and now has real 2026 MAAC times, which is the system working.
check('Hamilton is not assessed', row('hamilton').computedFit, 'Not assessed');
check('Hamilton gets no suggested priority', row('hamilton').suggestedPriority, null);
check('Hamilton does not report a disagreement', row('hamilton').disagrees, false);

// The engine reads Bucknell one band kinder than the recorded call, because
// the recorded benchmark is the slower end of their distance group. The board
// reports the disagreement rather than silently overriding a human judgement.
check('Bucknell keeps its recorded priority', row('bucknell').recordedPriority, 'P3');
check('the engine suggests P2 for Bucknell', row('bucknell').suggestedPriority, 'P2');
check('and says so', row('bucknell').disagrees, true);

// Confidence is about evidence, never about odds.
check('high confidence where real times exist', row('stbonaventure').confidence, 'High');
check('low confidence where none were gathered', row('hamilton').confidence, 'Low');

// A champion and a roster time are not the same statement.
check('RIT is benchmarked against a champion', row('rit').comparisons[0].basis, 'champion');
check('American is benchmarked against a roster swimmer', row('american').comparisons[0].basis, 'roster');

// ---------- the comparison scale ----------
// It draws, it does not decide. These checks exist to keep it that way.
const bonnies = row('stbonaventure').comparisons[0];
const scale = B.scalePositions(bonnies);
ok('a group comparison has a scale', Boolean(scale));
ok('every one of their swimmers is placed', scale.theirs.length === bonnies.theirTimes.length);
ok('their range is drawn as a band', Boolean(scale.band));
ok('fast is on the left', scale.theirs[0].pos < scale.theirs[scale.theirs.length - 1].pos);
ok('every position is on the scale', scale.theirs.every(function (t) { return t.pos >= 0 && t.pos <= 100; }));
ok('his mark is on the scale', scale.mine.pos >= 0 && scale.mine.pos <= 100);
ok('he sits inside their band here', scale.mine.pos > scale.band.from && scale.mine.pos < scale.band.to);
check('and the caption says so', scale.verdict, 'inside their range');

// A single benchmark has no measured spread, so no band is invented for it.
const niagara = B.scalePositions(row('niagara').comparisons[0]);
check('one benchmark draws no band', niagara.band, null);
check('and one mark', niagara.theirs.length, 1);

// Ahead, and off the back, both read correctly.
check('ahead of all of them', B.scalePositions(row('manhattan').comparisons[0]).verdict, 'ahead of all 2');
ok('off the back names the gap', /back$/.test(B.scalePositions(row('marist').comparisons[1]).verdict));
ok('and puts him to the right of their slowest',
  B.scalePositions(row('marist').comparisons[1]).mine.pos >
  B.scalePositions(row('marist').comparisons[1]).theirs[0].pos);

check('no times means no scale', B.scalePositions({ theirTimes: [] }), null);
check('nothing at all means no scale', B.scalePositions(null), null);

// The scale must never feed back into a verdict. If this ever changes, the
// drawing has started deciding things, which is not its job.
check('drawing did not move Gannon', row('gannon').computedFit, 'Current fit');
check('drawing did not move Marist', row('marist').computedFit, 'Target / reach');
check('drawing did not move Bucknell', row('bucknell').suggestedPriority, 'P2');

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

// ---------- Canadian programmes ----------
// U SPORTS is not an NCAA member, so the NCAA calendar does not bind it. That
// is the difference between writing this week and waiting nine months, so the
// app must not tell a Canadian coach he cannot reply.
const canada = R.contactWindow('USPORTS', 2029, '2026-09-18');
check('a U SPORTS coach can reply now', canada.open, true);
check('and there is no date to wait for', canada.replyDate, null);
ok('the message says the NCAA calendar does not apply', canada.message.indexOf('not bound by the NCAA calendar') !== -1);
ok('but it does not claim to be confirmed', canada.confirmed === false);
check('the CCAA reads the same way', R.contactWindow('CCAA', 2029, '2026-09-18').open, true);
check('Division III still uses the safe date', R.contactWindow('D3', 2029, '2026-09-18').open, false);
ok('and is marked unconfirmed', R.CONTACT_RULES.D3.confirmed === false);

// The email used to read every school as Division I, which told a Canadian
// coach he could not reply until June 2027. He can.
const canDraft = R.draftEmail({
  swim: S, standards: St, swimmer: SWIMMER, results: results, today: '2026-09-18',
  profileUrl: 'https://example.org',
  school: { id: 'utoronto', name: 'University of Toronto', coach: 'A Coach', email: 'c@utoronto.ca', division: 'USPORTS' }
});
ok('a Canadian coach is not told to wait', canDraft.body.indexOf('15 June 2027') === -1);
ok('an American one still is', R.draftEmail({
  swim: S, standards: St, swimmer: SWIMMER, results: results, today: '2026-09-18',
  profileUrl: 'https://example.org',
  school: { id: 'x', name: 'X', coach: 'A Coach', email: 'c@x.edu', division: 'D1' }
}).body.indexOf('15 June 2027') !== -1);

// The school record has to accept a Canadian programme at all.
check('a U SPORTS school is valid', Sc.normaliseSchool({ name: 'University of Toronto', division: 'USPORTS', conference: 'OUA' }).ok, true);
check('and defaults to Canada', Sc.normaliseSchool({ name: 'University of Toronto', division: 'USPORTS' }).school.country, 'Canada');
check('a US school still defaults to the USA', Sc.normaliseSchool({ name: 'X', division: 'D1' }).school.country, 'USA');
ok('a Canadian school is recognised as Canadian', Sc.isCanadian({ division: 'USPORTS' }));
ok('so is one marked by country', Sc.isCanadian({ division: 'D1', country: 'Canada' }));
ok('a US school is not', !Sc.isCanadian({ division: 'D1', country: 'USA' }));
check('a nonsense division is still refused', Sc.normaliseSchool({ name: 'X', division: 'D9' }).ok, false);

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

// ---------- Ontario eligibility ----------
// Sourced to the NCAA Ontario country sheet dated September 2026, not to a
// recruiting service. These are the rules that quietly cost an Ontario swimmer
// a year or a grade point.
const El = require('./eligibility.js');

// The two courses a swimmer reaches for, and Luke's own stated academic
// interest, are both worth nothing. This is the most expensive line in the file.
check('Kinesiology earns no credit', El.checkCourse('PSK4U').approved, false);
check('Exercise Science earns no credit', El.checkCourse('PSE4U').approved, false);
check('English University Prep counts', El.checkCourse('ENG4U').approved, true);
check('and is a full credit', El.checkCourse('ENG4U').credit, 1);
check('an Applied course earns nothing', El.checkCourse('MFM2P').approved, false);
check('a Workplace course earns nothing', El.checkCourse('MEL4E').approved, false);
check('a College Prep course earns nothing', El.checkCourse('MCT4C').approved, false);
check('Civics counts, at half a credit', El.checkCourse('CHV2O').credit, 0.5);
check('Locally Developed is not assumed either way', El.checkCourse('ABC3L').approved, null);
check('rubbish is refused', El.checkCourse('nope').ok, false);
check('the grade is read from the fourth character', El.checkCourse('SBI4U').grade, 4);

// The 80 percent cliff. A 79 and a 70 are both worth 3.0, an 80 and a 100 both
// 4.0, so one mark at the boundary is worth a whole grade point.
check('79 percent is a B', El.convertMark(79).points, 3);
check('80 percent is an A', El.convertMark(80).points, 4);
check('and 79 is one mark away', El.convertMark(79).marksToNextPoint, 1);
check('95 wastes fifteen marks', El.convertMark(95).wasted, 15);
check('a mark at the top has nowhere to go', El.convertMark(100).marksToNextPoint, 0);
check('a nonsense mark returns nothing', El.convertMark(120), null);

// The timeline has to be able to say what is next, not just what exists.
const soon = El.nextMilestones('2026-09-18', 5);
check('five things are next', soon.length, 5);
ok('and they are in date order', soon[0].date <= soon[4].date);
ok('four of them are due now', soon.filter(function (m) { return m.by === 'now'; }).length === 4);
ok('the June 2027 date is on the list', El.MILESTONES.some(function (m) { return m.date === '2027-06-15'; }));
ok('so is the seventh semester deadline', El.MILESTONES.some(function (m) { return m.by.indexOf('HARD') !== -1; }));
check('nothing is overdue yet', El.overdue('2026-09-18').length, 0);

// Carding is permitted. Families believe the opposite, and the app must not
// repeat the myth.
ok('the carding myth is recorded and corrected',
  El.MYTHS.some(function (m) { return /[Cc]arding/.test(m.myth) && /permits|Bylaw 12\.1\.3\.1/.test(m.truth); }));

// ---------- the questionnaire ----------
// Built from 21 real forms read field by field, so every count is evidence.
const Qn = require('./questionnaire.js');
ok('the source is recorded', Qn.SOURCE.indexOf('21') !== -1);
ok('and the date', Qn.RECORDED === '2026-09-18');
check('fields are ordered by how often they are asked', Qn.fields()[0].asked, 21);
ok('every field records a count', Qn.FIELDS.every(function (f) { return Number.isFinite(f.asked) && f.asked > 0; }));
ok('no field claims more than the forms read', Qn.FIELDS.every(function (f) { return f.asked <= 21; }));

// The finding that shaped the page: not one form asked about volunteering,
// service or leadership. If a field claiming otherwise is ever added here, it
// did not come from the research.
ok('nothing claims forms ask about volunteering',
  !Qn.FIELDS.some(function (f) { return /volunteer|community service|leadership/i.test(f.label); }));

// The course warning is the single most consequential note in the file, ie, an
// unlabelled metric time is read as yards and makes him look slower than he is.
const course = Qn.FIELDS.filter(function (f) { return f.key === 'course'; })[0];
ok('the course field exists', Boolean(course));
ok('and warns that unlabelled means yards', /YARDS/.test(course.note));

// Readiness counts what matters, not everything.
const empty = Qn.readiness({}, {});
check('nothing filled in means nothing ready', empty.mustAnswered, 0);
ok('and it names what to find first', Boolean(empty.next));
const auto = Qn.readiness({}, { bestTimes: true, club: true, clubCoach: true });
check('what we already know counts', auto.mustAnswered, 3);
ok('an auto filled field is not still listed as missing',
  !auto.missing.some(function (f) { return f.key === 'bestTimes'; }));
check('a blank string does not count as an answer', Qn.readiness({ email: '   ' }, {}).mustAnswered, 0);

// ---------- the full roster ----------
// Generated from the NCAA's own membership directory rather than assembled by
// hand or copied from a recruiting site. That matters: the popular published
// lists carry programmes cut years ago and miss ones recently added.
const Ro = require('./roster.js');
check('every programme is present', Ro.counts().total, 458);
check('NAIA, from a different source entirely', Ro.counts().NAIA, 16);
ok('and every NAIA entry says so', Ro.ROSTER.filter(function (s) { return s.division === 'NAIA'; })
  .every(function (s) { return s.src === 'cscaa'; }));
// Private versus public decides the money for a Canadian more than the swim
// does: a private college gives merit aid a coach's letter can move, a public
// campus is cheaper on sticker and gives an international almost nothing.
ok('private and public are recorded', Ro.ROSTER.filter(function (s) { return s.private === true; }).length > 250);
check('Ithaca is private', Ro.search('ithaca')[0].private, true);
check('Division I', Ro.counts().D1, 137);
check('Division II', Ro.counts().D2, 77);
check('Division III', Ro.counts().D3, 228);
ok('the roster records where it came from', Ro.SOURCE.indexOf('NCAA') !== -1);
ok('and when', Ro.RECORDED === '2026-09-18');

// The roster holds no contacts. Contacts are researched and live with the
// schools that matter, not against 442 rows nobody has looked at.
ok('the roster carries no email addresses',
  !/@[a-z0-9.-]+\.(edu|com|org)/i.test(JSON.stringify(Ro.ROSTER)));

check('search finds a school by name', Ro.search('bucknell')[0].name, 'Bucknell University');
ok('search finds a conference by acronym', Ro.search('psac', 50).length > 5);
ok('and one the directory names differently', Ro.search('maac', 50).length > 5);
// A state code also matches names containing those letters, ie, Pennsylvania
// for "ny". That is the right behaviour for a search box a person types into,
// so the check is that the state is found, not that nothing else is.
ok('a two letter state finds that state', Ro.search('ny', 400).filter(function (s) { return s.state === 'NY'; }).length > 15);
check('a single character finds nothing', Ro.search('b').length, 0);
check('nonsense finds nothing', Ro.search('zzzzzz').length, 0);

// Every school on the board must actually sponsor men's swimming. If one does
// not appear in the NCAA's men's list, it is either cut, women's only, or
// misnamed, and all three are worth knowing before an email goes out.
const missing = [];
const wrongDivision = [];
schools.forEach(function (s) {
  if (Sc.isCanadian(s)) return;                 // U SPORTS is not in an NCAA list
  const key = Sc.matchKey(s.name);
  const hit = Ro.ROSTER.filter(function (r) { return Sc.matchKey(r.name) === key; })[0];
  if (!hit) { missing.push(s.name); return; }
  if (hit.division !== s.division) wrongDivision.push(s.name + ': board ' + s.division + ', NCAA ' + hit.division);
});
check('every board school sponsors mens swimming', missing, []);
check('and is in the division the board says', wrongDivision, []);

// ---------- the photo library ----------
const Ph = require('./photos.js');

function photo(id, day, main) {
  const made = Ph.normalisePhoto({ id: id, type: 'image/jpeg', bytes: 100000, addedOn: day, main: main });
  ok('photo ' + id + ' is valid', made.ok);
  return made.photo;
}

check('a photo needs a usable id', Ph.normalisePhoto({ id: 'x', type: 'image/jpeg', bytes: 1 }).ok, false);
check('a photo needs a real image type', Ph.normalisePhoto({ id: 'abc123', type: 'text/html', bytes: 1 }).ok, false);
check('an empty file is refused', Ph.normalisePhoto({ id: 'abc123', type: 'image/jpeg', bytes: 0 }).ok, false);
check('an oversized file is refused', Ph.normalisePhoto({ id: 'abc123', type: 'image/jpeg', bytes: 99e6 }).ok, false);
check('a PDF is not an image', Ph.isAllowedType('application/pdf'), false);
check('a caption is trimmed to something sane', Ph.normalisePhoto({
  id: 'abc123', type: 'image/jpeg', bytes: 10, caption: 'x'.repeat(400) }).photo.caption.length, 140);

// A gallery is never headless and never two-headed.
let lib = [];
check('an empty library has no main', Ph.mainPhoto(lib), null);
lib = Ph.addPhoto(lib, photo('aaaaaa', '2026-01-10'));
check('the first photo added leads', Ph.mainPhoto(lib).id, 'aaaaaa');
lib = Ph.addPhoto(lib, photo('bbbbbb', '2026-09-01'));
check('a newer photo does not steal the lead', Ph.mainPhoto(lib).id, 'aaaaaa');
check('exactly one photo is ever main', lib.filter(function (p) { return p.main; }).length, 1);

lib = Ph.setMain(lib, 'bbbbbb');
check('choosing a main moves it', Ph.mainPhoto(lib).id, 'bbbbbb');
check('and unmarks the other', lib.filter(function (p) { return p.main; }).length, 1);
check('the main leads the gallery order', Ph.galleryOrder(lib)[0].id, 'bbbbbb');

lib = Ph.addPhoto(lib, photo('cccccc', '2026-09-15'));
check('behind the main, newest first', Ph.galleryOrder(lib).map(function (p) { return p.id; }), ['bbbbbb', 'cccccc', 'aaaaaa']);

// Removing the lead promotes the next rather than leaving the page headless.
lib = Ph.removePhoto(lib, 'bbbbbb');
check('removing the main promotes another', Ph.mainPhoto(lib).id, 'cccccc');
check('and it is still exactly one', lib.filter(function (p) { return p.main; }).length, 1);
check('the removed photo is gone', lib.filter(function (p) { return p.id === 'bbbbbb'; }).length, 0);

// Re-adding the same id replaces rather than duplicating.
lib = Ph.addPhoto(lib, photo('cccccc', '2026-09-15'));
check('the same id never appears twice', lib.filter(function (p) { return p.id === 'cccccc'; }).length, 1);

check('removing everything empties cleanly',
  Ph.removePhoto(Ph.removePhoto(lib, 'cccccc'), 'aaaaaa').length, 0);
check('a url is built from the id', Ph.urlFor({ id: 'abc123' }), '/api/photo/abc123');
check('no photo means no url', Ph.urlFor(null), '');

// ---------- rankings, editable and clearable ----------
const SD = require('./swimmer.js');
check('the seed carries four rankings', Object.keys(SD.seedRankings()).length, 4);
check('nothing saved yet falls back to the seed', Object.keys(SD.rankingsFrom(null)).length, 4);

// The rule that matters. A cleared box means no ranking, not a revert to the
// hardcoded one, otherwise clearing a stale number silently restores it.
const cleared = SD.rankingsFrom({ rankings: { '200-free-LCM': 4 } });
check('a saved map is the whole truth', Object.keys(cleared).length, 1);
check('and keeps the one that was set', cleared['200-free-LCM'].rank, 4);
check('an empty map means no rankings at all', Object.keys(SD.rankingsFrom({ rankings: {} })).length, 0);
check('a blank clears', Object.keys(SD.rankingsFrom({ rankings: { '200-free-LCM': '' } })).length, 0);
check('a zero clears', Object.keys(SD.rankingsFrom({ rankings: { '200-free-LCM': 0 } })).length, 0);
check('rubbish clears', Object.keys(SD.rankingsFrom({ rankings: { '200-free-LCM': 'first' } })).length, 0);
check('a plain number works as well as an object', SD.rankingsFrom({ rankings: { '400-free-LCM': 2 } })['400-free-LCM'].rank, 2);
check('a missing event has no ranking', SD.rankFor(SD.seedRankings(), '100-fly-LCM'), null);

// ---------- the public half holds no data ----------
// school-utils.js is served to the open web. schools.js is not. This test
// exists because that line was crossed once: the data file was left public
// after the coach contacts were added to it, and the whole board went out on
// the first deploy. A grep is a blunt instrument and that is the point.
const utilsSource = require('fs').readFileSync(require('path').join(__dirname, 'school-utils.js'), 'utf8');
ok('the public file carries no email address', !/@[a-z0-9.-]+\.(edu|com|org)/i.test(utilsSource));
ok('the public file names no school', !/Gannon|Canisius|Bonaventure|Bucknell|Fairfield|Niagara|Marist|Ithaca|Clarkson|Hamilton|Iona|Loyola|Manhattan/i.test(utilsSource));
ok('the public file carries no benchmark time', !/\d:\d\d\.\d\d/.test(utilsSource));
ok('the public file carries no priority', !/'P[123]'/.test(utilsSource));
ok('but it still exports the importer', typeof require('./school-utils.js').parsePaste === 'function');
ok('and the merge rules', typeof require('./school-utils.js').mergeSchools === 'function');

// ---------- school logos ----------
const gannon = schools.filter(function (s) { return s.id === 'gannon'; })[0];
ok('a logo is derived from the athletics domain', Sc.logoFor(gannon).indexOf('gannonsports.com') !== -1);
check('the host is read from the recorded page', Sc.hostOf('https://gobonnies.com/sports/x'), 'gobonnies.com');
check('a bad url yields no host', Sc.hostOf('not a url'), '');
check('no source page means no logo', Sc.logoFor({ name: 'X' }), '');
check('an explicit logo wins', Sc.logoFor({ name: 'X', logo: 'https://example.org/x.png' }), 'https://example.org/x.png');
check('initials fall back cleanly', Sc.initialsFor({ name: 'St. Bonaventure University' }), 'SB');
check('initials skip the joining words', Sc.initialsFor({ name: 'Rensselaer Polytechnic Institute' }), 'RP');

// ---------- the six schools that gained real times ----------
// They read "Not assessed" until the 2026 conference results were gathered.
// Every one now carries the meet it came from.
['saintpeters', 'manhattan', 'clarkson', 'rpi', 'fairfield', 'iona'].forEach(function (id) {
  const r = row(id);
  ok(id + ' is now assessed', r.evidenceCount > 0);
  ok(id + ' cites its source', r.comparisons.every(function (c) { return Boolean(c.sourceUrl); }));
  check(id + ' is now high confidence', r.confidence, 'High');
});
check('only two schools remain unassessed',
  rows.filter(function (r) { return r.evidenceCount === 0; }).length, 2);

// Manhattan's whole distance group is slower than him, so he is ahead outright
// rather than merely inside the range.
ok('Manhattan reads ahead on the 500', row('manhattan').comparisons[0].ahead);
check('Manhattan is a current fit', row('manhattan').computedFit, 'Current fit');

// Fairfield won the conference and he still lands inside their range. The
// engine says P1, the board says P3. Reporting that clash is the point.
check('Fairfield is recorded P3', row('fairfield').recordedPriority, 'P3');
check('the engine reads Fairfield higher', row('fairfield').suggestedPriority, 'P1');
ok('and flags the clash', row('fairfield').disagrees);
// RPI, Fairfield and Iona all read higher than recorded now that their
// conference times are in, and Bucknell reads higher off its own benchmark.
check('four schools now disagree with the recorded call',
  rows.filter(function (r) { return r.disagrees; }).length, 4);

console.log((failed === 0 ? '  PASS' : '  FAIL') + '  board.test.js  ' + (passed + failed) + ' checks, ' + failed + ' failed');
process.exit(failed === 0 ? 0 : 1);
