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


check('a bad course is refused', S.normaliseResult({ distance: 200, stroke: 'free', course: 'SCX', time: '1:58.35', date: '2025-11-06' }).ok, false);
check('an unswum event is refused', S.normaliseResult({ distance: 500, stroke: 'free', course: 'LCM', time: '4:37.20', date: '2025-11-06' }).ok, false);
check('a missing date is refused', S.normaliseResult({ distance: 200, stroke: 'free', course: 'LCM', time: '1:58.35', date: '' }).ok, false);
check('an unreadable time is refused', S.normaliseResult({ distance: 200, stroke: 'free', course: 'LCM', time: 'quick', date: '2025-11-06' }).ok, false);

const bests = S.personalBests(results);
check('the best 200 free long course', bests['200-free-LCM'].time, '1:59.75');
check('the best 400 free long course', bests['400-free-LCM'].time, '4:10.86');
check('the best 1500 free long course', bests['1500-free-LCM'].time, '16:59.80');
check('the best 400 IM long course', bests['400-im-LCM'].time, '4:52.37');

// ---------- four seasons, and the curve ----------
check('four seasons are on record', [2023, 2024, 2025, 2026].every(function (y) {
  return results.some(function (r) { return r.season === y; }); }), true);
check('one hundred and twenty nine swims', results.length, 129);
ok('every swim carries its points', results.every(function (r) { return r.points > 0; }));

// Relay lead-off splits are not in here. The source lists them separately with
// no points, and a lead-off sitting in a bests table quietly flatters a
// swimmer. Nothing should have a 'Lap' meet or a missing points value.
ok('no relay lead-offs leaked in', !results.some(function (r) { return /lap/i.test(r.meet); }));

// Points are the only number that means the same thing in every event and both
// courses, so they settle what to lead with.
const ranked = S.rankedByPoints(results, 5);
check('the strongest event is the 400 free long course', ranked[0].event, '400-free-LCM');
check('and it scores', ranked[0].points, 674);
ok('points descend', ranked.every(function (r, i) { return i === 0 || ranked[i - 1].points >= r.points; }));
ok('the 400 IM is not his strongest, whatever it feels like',
  ranked.slice(0, 3).every(function (r) { return r.stroke === 'free'; }));

// One row per event, not per course. Without this the 800 free took two of the
// top four slots, long course and short course, telling a coach nothing he did
// not know and pushing the 400 IM off the page entirely.
const perEvent = S.rankedByPoints(results, 5, true);
check('five events, not five course-and-event pairs', perEvent.length, 5);
ok('no event appears twice', perEvent.every(function (r, i) {
  return perEvent.findIndex(function (o) { return o.distance === r.distance && o.stroke === r.stroke; }) === i;
}));
check('and the 400 IM makes the list', perEvent[4].event, '400-im-SCM');
// It is his FIFTH event by points, not a co-lead. Range, not identity.
ok('the four ahead of it are all freestyle',
  perEvent.slice(0, 4).every(function (r) { return r.stroke === 'free'; }));

// The 400 IM curve, which is why it earns a place despite ranking fifth.
const imLong = S.progression(results, 400, 'im', 'LCM');
check('four seasons of the 400 IM long course', imLong.seasons.length, 4);
check('from here', imLong.seasons[0].time, '6:43.41');
check('to here', imLong.current.time, '4:52.37');
check('which is the largest drop of any event he swims', S.formatGap(imLong.totalDrop), '-1:51.04');
check('faster every season', imLong.everySeason, true);
const imShort = S.progression(results, 400, 'im', 'SCM');
check('and the short course tells the same story', imShort.everySeason, true);

// The curve. The thing a results database cannot show.
const curve = S.progression(results, 400, 'free', 'LCM');
check('four seasons of the 400 free', curve.seasons.length, 4);
check('it starts here', curve.seasons[0].time, '5:20.53');
check('and it is here now', curve.current.time, '4:10.86');
check('which is this much faster', S.formatGap(curve.totalDrop), '-1:09.67');
check('and this many points better', curve.pointsGained, 351);
check('faster every single season', curve.everySeason, true);
check('the first season has nothing to improve on', curve.seasons[0].droppedBy, null);
ok('and every later one does', curve.seasons.slice(1).every(function (s) { return s.droppedBy < 0; }));
check('an event never swum has no curve', S.progression(results, 500, 'free', 'SCY'), null);

// The mile and the 800 tell the same story, which is what makes it a profile
// rather than one good swim.
ok('the 1500 improved every season', S.progression(results, 1500, 'free', 'LCM').everySeason);
ok('so did the 800', S.progression(results, 800, 'free', 'LCM').everySeason);
ok('and the 400 IM', S.progression(results, 400, 'im', 'LCM').everySeason);

// ---------- metres to yards ----------
// Eight of the ten supplied pairs reproduce exactly and two land a hundredth
// out, because the factors are held to four decimals. One hundredth is the
// stated tolerance. Tightening it by tuning a factor would be fitting noise.
// boardBests, not yardBests. American programmes race yards, which he has never
// swum, so those comparisons run on converted times. Canadian programmes race
// short course metres, which he races every winter, so those run on real swims.
const yards = C.boardBests(S, results);
// The supplied pairs are the source of the FACTORS, not a snapshot of his
// times. He has since gone faster, so his converted times have moved and
// should have. What must still hold is that each factor reproduces the pair it
// was derived from. Checking his current time against an old conversion was
// testing the wrong thing, and it failed the moment the data improved, which
// is the test doing the right thing for the wrong reason.
C.MAPPINGS.forEach(function (m) {
  const from = S.parseTime(m.pair[0]);
  const to = S.parseTime(m.pair[1]);
  const drift = Math.abs(Math.round(from * m.factor) - to);
  ok(m.from + ' reproduces the pair it came from', drift <= 1);
});

// And every mapped event he has swum still gets a conversion, marked as one.
['50-free-SCY', '100-free-SCY', '200-free-SCY', '500-free-SCY',
 '1000-free-SCY', '1650-free-SCY', '100-back-SCY', '200-back-SCY',
 '200-im-SCY', '400-im-SCY'].forEach(function (eventId) {
  ok('a yard equivalent exists for ' + eventId, Boolean(yards[eventId]));
  if (yards[eventId]) ok(eventId + ' is marked an estimate', yards[eventId].estimated === true);
});

check('the 500 comes from the 400 metres', yards['500-free-SCY'].from.event, '400-free-LCM');
check('the mile comes from the 1500 metres', yards['1650-free-SCY'].from.event, '1500-free-LCM');
check('an event with no mapping gets no conversion', C.toYards(S, bests['200-breast-LCM']), null);

// ---------- the board ----------
const schools = Sc.seedSchools();
check('the board is seeded', schools.length, 43);
// Ten Ontario schools went on 18 September 2026. They are the only ones he can
// write to today, because U SPORTS puts no calendar on contact.
// Every university in Canada with a men's swim team, ie, all 26.
check('every Canadian programme is on it',
  schools.filter(function (s) { return s.division === 'USPORTS'; }).length, 26);
check('ten in Ontario', schools.filter(function (s) { return s.conference === 'OUA'; }).length, 10);
check('six in Quebec', schools.filter(function (s) { return s.conference === 'RSEQ'; }).length, 6);
check('six out west', schools.filter(function (s) { return s.conference === 'Canada West'; }).length, 6);
check('four in the Atlantic', schools.filter(function (s) { return s.conference === 'AUS'; }).length, 4);
// ---------- the coach contacts ----------
// Every address was read off the school's own athletics site on 18 September
// 2026. The test does not check that an address still works, because it cannot.
// It checks that the record is shaped honestly, ie, nothing is marked verified
// without both an address and the page it was read from.
// Carleton is the one school with no coach address at all. What is recorded is
// the club manager's address, deliberately, and the card says to ask to be put
// through rather than pretending it is the coach.
// Three schools publish no personal coach address at all. Carleton publishes
// only a club manager, Sherbrooke and UQTR only a department mailbox. Each is
// recorded as unsendable rather than dressed up with a guessed address.
check('forty of forty-three are sendable', schools.filter(Sc.isSendable).length, 40);
check('and the three that are not are named',
  schools.filter(function (s) { return !Sc.isSendable(s); }).map(function (s) { return s.id; }),
  ['carleton', 'sherbrooke', 'uqtr']);
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

// ---------- taking a school off the board ----------
// Adding was easy and removing did not exist, so a school added by mistake was
// there forever. Two clicks, because there is no undo and the list took a lot
// of gathering.
const adminSrc2 = require('fs').readFileSync(require('path').join(__dirname, 'admin.html'), 'utf8');
ok('every row carries a remove button', /data-drop="' \+ esc\(s\.id\)/.test(adminSrc2));
ok('the first click only arms it', /b\.classList\.contains\('sure'\)/.test(adminSrc2));
ok('and names what would go', /school\.name \+ '\?'/.test(adminSrc2));
// The same control sits at the bottom left of every board card, where a school
// is actually being looked at, and it shares one handler with the table so the
// two can never drift apart.
ok('every card carries a hide button',
  /'<button class="drop push" data-drop="' \+ esc\(r\.school\.id\)/.test(adminSrc2));
ok('the board wires the same handler', /wireDrops\(el\('boardTable'\)\)/.test(adminSrc2));
ok('and so does the table', /wireDrops\(el\('schoolTable'\)\)/.test(adminSrc2));
ok('arming one disarms every other, in both places',
  /document\.querySelectorAll\('\.drop\.sure'\)/.test(adminSrc2));
// Bottom right, pushed to the far edge, which puts the one destructive control
// as far from Email as the row allows.
ok('the hide button is pushed to the right edge', /\.drop\.push\{margin-left:auto\}/.test(adminSrc2));
ok('and comes after the staff page link',
  adminSrc2.indexOf('Staff page</a>') < adminSrc2.indexOf('class="drop push"'));
ok('arming one disarms the others', /querySelectorAll\('\.drop\.sure'\)/.test(adminSrc2));
ok('removing saves the list without it',
  /schools\.filter\(function \(s\) \{ return s\.id !== school\.id; \}\)/.test(adminSrc2));
ok('through the same endpoint everything else uses',
  adminSrc2.indexOf("api('/api/schools', { method: 'PUT', body: JSON.stringify({ schools: next }) })") !== -1);

// Forty-three rows is past what can be read as a wall, so the table filters
// and scrolls under a sticky header.
ok('the list can be narrowed', adminSrc2.indexOf('id="schoolQ"') !== -1);
ok('and says how many are showing', /Showing <strong>/.test(adminSrc2));
ok('the table scrolls on its own', /\.scroll\.tall\{max-height/.test(adminSrc2));
ok('with a header that stays put', /\.scroll\.tall thead th\{position:sticky/.test(adminSrc2));
// It was wider than the window, which put the remove button off the right edge.
ok('the school table wraps rather than overflowing', /#schoolTable td\{white-space:normal\}/.test(adminSrc2));

// The store has to tell "never saved" from "saved an empty list". Conflating
// them meant removing the last school silently restored all forty-three, ie,
// the one delete that cannot be undone was the one that did not work.
const fnSrc = require('fs').readFileSync(
  require('path').join(__dirname, 'netlify', 'functions', 'schools.js'), 'utf8');
ok('the store asks whether anything was ever saved', /const everSaved = Array\.isArray\(stored\)/.test(fnSrc));
ok('and does not reseed an emptied list', fnSrc.indexOf('stored && stored.length') === -1);

// ---------- Canadian programmes are marked on sight ----------
// A red edge and a maple leaf, and not for decoration. U SPORTS puts no
// calendar on contact, so these 26 are the only schools on the board he can
// write to today. Every American one is silent until June 2027.
const adminMarkup = require('fs').readFileSync(require('path').join(__dirname, 'admin.html'), 'utf8');
ok('the card takes a Canadian class', /class="school' \+ \(canada \? ' canada' : ''\)/.test(adminMarkup));
ok('which draws a red left edge', /\.school\.canada\{border-left:4px solid var\(--leaf\)/.test(adminMarkup));
ok('the leaf is inline SVG, not an emoji', adminMarkup.indexOf('<svg class="leaf"') !== -1);
ok('and takes its colour from the theme', /\.leaf\{[^}]*color:var\(--leaf\)/.test(adminMarkup));
// Both dark-mode forms, ie, the system preference and an explicit choice.
ok('the red is redefined for dark mode',
  /prefers-color-scheme: dark\)\{ :root:not\(\[data-theme="light"\]\)\{ --leaf:/.test(adminMarkup));
ok('and for an explicit dark theme', /:root\[data-theme="dark"\]\{--leaf:/.test(adminMarkup));
ok('and the key says what the edge means', /a red edge means U SPORTS/.test(adminMarkup));
// The flag follows the helper, not a hardcoded list, so a school added later
// gets it without anyone remembering to.
check('every U SPORTS school is Canadian',
  schools.filter(function (s) { return s.division === 'USPORTS' && !Sc.isCanadian(s); }).length, 0);
check('and no American one is',
  schools.filter(function (s) { return s.country === 'USA' && Sc.isCanadian(s); }).length, 0);
check('twenty-six carry the flag', schools.filter(Sc.isCanadian).length, 26);

// ---------- the tier says what year one looks like ----------
// P1, P2 and P3 were a code you had to remember, and the card carried a second
// scale underneath saying the same thing. The keys stay, because they sort and
// because the importer uses them. They are never shown.
check('P1 reads as racing', B.tierFor('P1', true).label, 'You\u2019d race');
check('P2 reads as pushing', B.tierFor('P2', true).label, 'You\u2019d push');
check('P3 reads as chasing', B.tierFor('P3', true).label, 'You\u2019d chase');
check('and each carries a tone', [B.tierFor('P1', true).tone, B.tierFor('P2', true).tone,
  B.tierFor('P3', true).tone], ['good', 'mid', 'warn']);
check('an unrecorded school has no tier', B.tierFor('', true), null);

// Nothing gathered means no reading. Printing "he'd chase" over an empty
// record would be a verdict drawn from silence, which this board never does.
check('no evidence outranks the recorded call', B.tierFor('P3', false).label, 'Not scored');
check('even a P1 with nothing behind it', B.tierFor('P1', false).label, 'Not scored');
check('and it is toned as nothing', B.tierFor('P1', false).tone, 'none');

// The grouping the board actually shows. The recorded call wins where there is
// one, the engine's reading fills in where there is not, and nothing scored
// beats both, because a tier drawn over an empty record is a verdict from
// silence.
function tierOf(id) {
  const r = row(id);
  const assessed = r.evidenceCount > 0;
  const shown = B.tierFor(r.recordedPriority, assessed) ||
    (assessed ? B.tierFor(r.suggestedPriority, true) : null) || { label: 'Not scored' };
  return shown.label;
}
function countTier(label) {
  return rows.filter(function (r) { return tierOf(r.school.id) === label; }).length;
}
check('every school lands in exactly one tier',
  countTier('You\u2019d race') + countTier('You\u2019d push') +
  countTier('You\u2019d chase') + countTier('Not scored'), rows.length);
// Nine schools have nothing to compare against. Two never had times gathered,
// and seven entered nobody in any of his events, which is a fact about the
// programme rather than a gap in the research.
check('nine schools have nothing to score', countTier('Not scored'), 9);
check('Loyola is one of them', tierOf('loyolamd'), 'Not scored');
check('Queen\u2019s is another, having entered nobody', tierOf('queens'), 'Not scored');
check('Canisius is not', tierOf('canisius'), 'You\u2019d race');

// A school you have never judged shows the engine's call rather than a blank.
check('Guelph has no recorded call', row('guelph').recordedPriority, null);
ok('but the engine has one', Boolean(row('guelph').suggestedPriority));
ok('so the board still says something', tierOf('guelph') !== 'Not scored');

// The disagreement is unchanged. The recorded call still stands and still
// sorts the board, and the engine only ever says so on the side.
check('Fairfield still reads higher than recorded', B.tierFor(row('fairfield').suggestedPriority, true).label,
  'You\u2019d race');
check('while the board still shows what was recorded', tierOf('fairfield'), 'You\u2019d chase');

// No page shows the raw key any more.
['admin.html', 'index.html'].forEach(function (f) {
  const src = require('fs').readFileSync(require('path').join(__dirname, f), 'utf8');
  ok(f + ' never prints a bare tier key', !/>\s*P[123]\s*</.test(src));
});

// ---------- where he would slot into the squad ----------
// The bar was not understood, and that is a design failure rather than a
// reading failure. "Fourth fastest of five" needs no explaining.
const bonniesPlace = B.placeIn(S, row('stbonaventure').comparisons[0]);
check('he slots in fifth of six', bonniesPlace.position, 5);
check('the squad counts him', bonniesPlace.of, 6);
check('four of them are quicker', bonniesPlace.behind, 4);
check('and he is quicker than one', bonniesPlace.fasterThan, 1);
ok('the ladder holds everyone including him', bonniesPlace.ladder.length === 6);
check('and he is in the right rung', bonniesPlace.ladder[4].mine, true);
ok('the ladder is in order', bonniesPlace.ladder.every(function (r, i, all) {
  return i === 0 || all[i - 1].hundredths <= r.hundredths; }));

// The middle swimmer, not the mean. One slow swim drags an average somewhere
// no real swimmer sits.
check('Clarkson has him fastest', B.placeIn(S, row('clarkson').comparisons[0]).position, 1);
ok('and he beats their middle', B.placeIn(S, row('clarkson').comparisons[0]).aboveMedian);
ok('at St Bonaventure he does not', !bonniesPlace.aboveMedian);

// This board exists to help Luke choose, so every rung says what the year
// would look like, not whether he is good enough.
ok('leading a group reads as leading it',
  /You would lead their distance group/.test(B.placeIn(S, row('clarkson').comparisons[0]).meaning));
ok('the back half reads as developing',
  /back half/.test(bonniesPlace.meaning));
ok('and being last says how long before he races',
  /before you race/.test(B.placeIn(S, row('saintpeters').comparisons[2]).meaning));

// One benchmark cannot be ranked against, and inventing a squad from it would
// be inventing evidence.
check('a single benchmark yields no ladder', B.placeIn(S, row('niagara').comparisons[0]), null);
check('nor does nothing at all', B.placeIn(S, { theirTimes: [] }), null);
check('ordinals read as words', B.ordinal(4), 'fourth');

// ---------- his rung is a conversion, theirs are real swims ----------
// He has never swum a yard. Every time of his on this board is an estimate
// standing next to real yard swims, and a ladder that does not say so is
// quietly comparing two different kinds of number.
const fairfield500 = row('fairfield').comparisons.filter(function (c) {
  return c.event === '500-free-SCY'; })[0];
ok('his time is marked as an estimate', fairfield500.mineEstimated);
check('and it carries the swim it came from', fairfield500.mineFrom.event, '400-free-LCM');
check('with that swim\u2019s actual time', fairfield500.mineFrom.time, '4:10.86');
check('said in a line a person can check', B.convertedNote(fairfield500),
  'Converted from your 400 free LCM, 4:10.86. Not a time you have swum.');
check('the mile comes from the 1500', B.convertedNote(row('fairfield').comparisons.filter(
  function (c) { return c.event === '1650-free-SCY'; })[0]),
  'Converted from your 1500 free LCM, 16:59.80. Not a time you have swum.');
// The 400 IM is not the "400 im", here either.
ok('an initialism survives the note', /400 IM LCM/.test(B.convertedNote(
  row('fairfield').comparisons.filter(function (c) { return c.event === '400-im-SCY'; })[0])));
// A group comparison carries it too, not only a single benchmark.
ok('a whole squad comparison says it as well',
  /^Converted from your /.test(B.convertedNote(row('stbonaventure').comparisons[0])));
// Nothing to say about a time that was not converted.
check('a real swim gets no note', B.convertedNote({ mineEstimated: false }), '');
check('nor does nothing at all', B.convertedNote(null), '');
// And it never guesses at a source it does not have.
check('an estimate with no source still admits it is one',
  B.convertedNote({ mineEstimated: true }), 'Converted, not a time you have swum.');

// The page has to actually print it, ie, on the rung and once under the event.
const adminSrc = require('fs').readFileSync(require('path').join(__dirname, 'admin.html'), 'utf8');
ok('the rung says converted', /You\' \+ \(c\.mineEstimated \? \', converted\'/.test(adminSrc));
ok('and the note is rendered', adminSrc.indexOf('B.convertedNote(c)') !== -1);

// ---------- the conference beside the squad ----------
// Making a squad and scoring at the championship are two different bars. The
// ladder answers the first. This answers the second, and only where the
// championship results were actually read.
const canisius = row('canisius');
const canisiusMile = canisius.comparisons.filter(function (c) { return c.event === '1650-free-SCY'; })[0];
const canisiusConf = B.conferenceContext(S, canisius.school, canisiusMile);
check('Canisius swims in the MAAC', canisiusConf.conference, 'MAAC');
check('and the mile was won in 15:39.33', canisiusConf.winner, '15:39.33');
check('the meet is named', canisiusConf.meet, '2026 MAAC Championships');
ok('and the results page is on file', /^https:\/\//.test(canisiusConf.source));
ok('he is behind that time', canisiusConf.gap > 0);
// It read "Won in 15:39.33", which has no subject, ie, who won, what they won
// and what it has to do with Luke were all left to the reader. Andrew could not
// read it, which is the only test that matters.
check('the line stands on its own', canisiusConf.sentence,
  'It took 15:39.33 to win this event at the 2026 MAAC Championships. You are 44.78 off that.');
ok('it names what it took', canisiusConf.sentence.indexOf('It took 15:39.33 to win') === 0);
ok('and which meet', /at the 2026 MAAC Championships/.test(canisiusConf.sentence));
// Canada West races in November, so its 2025-26 meet is the 2025 one. The year
// comes off the meet name, never assumed, or this read "the 2025 Canada West
// Championships in 2026".
ok('a November conference is not relabelled', /at the 2025 Canada West Championships\./.test(
  B.conferenceContext(S, row('victoria').school,
    row('victoria').comparisons.filter(function (c) { return c.event === '400-im-SCM'; })[0]).sentence));
ok('and no sentence says a year twice',
  rows.every(function (r) { return r.comparisons.every(function (c) {
    const cf = B.conferenceContext(S, r.school, c);
    return !cf || !/\b(20\d\d)\b.*\bin \1\b/.test(cf.sentence); }); }));
ok('and where you sit against it', /You are 44\.78 off that\./.test(canisiusConf.sentence));


// Ithaca sits in a different conference, so the same event gives a different
// bar. That is the whole reason the column exists.
const ithaca = row('ithaca');
const ithacaFive = ithaca.comparisons.filter(function (c) { return c.event === '500-free-SCY'; })[0];
const ithacaConf = B.conferenceContext(S, ithaca.school, ithacaFive);
check('Ithaca swims in the Liberty League', ithacaConf.conference, 'Liberty League');
check('and their 500 was won in 4:31.98', ithacaConf.winner, '4:31.98');
ok('which is a closer bar than the MAAC 500',
  ithacaConf.gap < B.conferenceContext(S, row('iona').school,
    row('iona').comparisons.filter(function (c) { return c.event === '500-free-SCY'; })[0]).gap);

// Silence rather than a guess. Three conferences on this board have no results
// on file, and inventing a winning time for them would be inventing evidence.
// The three conferences that used to be silent now have their 2026 results on
// file, so every conference on the board answers.
check('the PSAC now answers', B.conferenceContext(S, row('gannon').school,
  row('gannon').comparisons[0]).winner, '4:23.91');
check('so does the Atlantic 10', B.conferenceContext(S, row('stbonaventure').school,
  row('stbonaventure').comparisons[0]).winner, '4:19.28');
check('and the Patriot League', B.conferenceContext(S, row('bucknell').school,
  row('bucknell').comparisons[0]).winner, '4:16.73');
// The OUA races metres, not yards, and there is no men's 800 free.
check('the OUA answers in metres', B.conferenceContext(S, row('laurier').school,
  row('laurier').comparisons.filter(function (c) { return c.event === '400-im-SCM'; })[0]).winner, '4:21.47');
// The AUS is the one conference with no times, because it published none for
// its 2026 championship, only day recaps naming winners. Dalhousie is the only
// scored school in it, and its card shows no conference line rather than a
// guess.
check('only the AUS has no conference times',
  rows.filter(function (r) { return r.comparisons.length &&
    !B.conferenceContext(S, r.school, r.comparisons[0]); })
    .map(function (r) { return r.school.conference; }), ['AUS']);
check('Canada West answers in metres', B.conferenceContext(S, row('victoria').school,
  row('victoria').comparisons.filter(function (c) { return c.event === '400-im-SCM'; })[0]).winner, '4:14.69');
check('and so does the RSEQ', B.conferenceContext(S, row('mcgill').school,
  row('mcgill').comparisons.filter(function (c) { return c.event === '1500-free-SCM'; })[0]).winner, '15:25.43');
check('a school with no conference is silent too',
  B.conferenceContext(S, { name: 'X' }, canisiusMile), null);
check('and no comparison is silent',
  B.conferenceContext(S, canisius.school, null), null);

// Where the only benchmark on file IS the swim that won the conference, the
// strip has already printed it. The flag lets the page avoid saying one fact
// twice, without throwing the context away.
ok('Ithaca 500 is that same winning swim', ithacaConf.sameSwim);
ok('so is their 400 IM', B.conferenceContext(S, ithaca.school,
  ithaca.comparisons.filter(function (c) { return c.event === '400-im-SCY'; })[0]).sameSwim);
ok('Canisius mile is not, ie, their qualifier did not win it', !canisiusConf.sameSwim);
ok('and a whole squad is never one swim',
  !B.conferenceContext(S, row('saintpeters').school,
    row('saintpeters').comparisons.filter(function (c) { return c.theirTimes.length > 1; })[0]).sameSwim);

// Every recorded time has to parse, or the column would quietly print nothing
// while looking like it had been checked.
Object.keys(B.CONFERENCES).forEach(function (key) {
  const conf = B.CONFERENCES[key];
  ok(conf.name + ' cites its results page', /^https:\/\//.test(conf.source));
  ok(conf.name + ' records when it was read', /^\d{4}-\d\d-\d\d$/.test(conf.recorded));
  Object.keys(conf.winners).forEach(function (ev) {
    ok(conf.name + ' ' + ev + ' is a readable time', S.parseTime(conf.winners[ev]) !== null);
  });
});

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
ok('and now it is confirmed, from U SPORTS own policy', canada.confirmed === true);
ok('while the CCAA, unresearched, still does not claim to be',
  R.CONTACT_RULES.CCAA.confirmed === false);
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
// The letter itself quotes no calendar at anybody now. What must still hold is
// that the app knows the difference, because that is what the screen beside the
// draft tells Andrew before he sends.
ok('no letter quotes the calendar', canDraft.body.indexOf('15 June 2027') === -1);
check('a Canadian coach may reply now', canDraft.window.open, true);
check('and an American one may not yet', R.draftEmail({
  swim: S, standards: St, swimmer: SWIMMER, results: results, today: '2026-09-18',
  profileUrl: 'https://example.org',
  school: { id: 'x', name: 'X', coach: 'A Coach', email: 'c@x.edu', division: 'D1' }
}).window.replyDate, '2027-06-15');

// The school record has to accept a Canadian programme at all.
check('a U SPORTS school is valid', Sc.normaliseSchool({ name: 'University of Toronto', division: 'USPORTS', conference: 'OUA' }).ok, true);
check('and defaults to Canada', Sc.normaliseSchool({ name: 'University of Toronto', division: 'USPORTS' }).school.country, 'Canada');
check('a US school still defaults to the USA', Sc.normaliseSchool({ name: 'X', division: 'D1' }).school.country, 'USA');
ok('a Canadian school is recognised as Canadian', Sc.isCanadian({ division: 'USPORTS' }));
ok('so is one marked by country', Sc.isCanadian({ division: 'D1', country: 'Canada' }));
ok('a US school is not', !Sc.isCanadian({ division: 'D1', country: 'USA' }));
check('a nonsense division is still refused', Sc.normaliseSchool({ name: 'X', division: 'D9' }).ok, false);

// ---------- third party coverage ----------
// A provincial body writing about him is worth more than anything we write
// about him, and the coach research said agency is heard rather than claimed.
check('the Swim Ontario piece is on file', SWIMMER.press.length, 1);
ok('with its date', SWIMMER.press[0].date === '2026-05-11');
ok('and a link', /^https:\/\/www\.swimontario\.com\//.test(SWIMMER.press[0].url));
// The piece names his old club because it predates the move. Saying so is what
// stops a coach wondering which club is right.
ok('and it says which club it was written under', /Lakeshore/.test(SWIMMER.press[0].note));
ok('his own words are quoted, not paraphrased', SWIMMER.quote.text.indexOf('go faster') !== -1);
ok('and attributed', SWIMMER.quote.source.indexOf('Swim Ontario') !== -1);

// The two provincial golds, which are results rather than participation.
ok('the 400 free gold is recorded',
  SWIMMER.recognition.some(function (r) { return /400 free/.test(r.label) && /Gold/.test(r.label); }));
ok('the 800 free gold is recorded',
  SWIMMER.recognition.some(function (r) { return /800 free/.test(r.label) && /Gold/.test(r.label); }));

// The high school, which two separate lines of research both need: every
// questionnaire asks for it, and NCAA core credit depends on the SCHOOL
// holding an Eligibility Center account.
check('the school is recorded', SWIMMER.school.name, 'Silverthorn Collegiate Institute');
check('and the portal check is openly not done yet', SWIMMER.school.ncaaPortalChecked, false);

// ---------- the club ----------
// He moved clubs in September 2026. The old name was in the data AND in three
// places in the hand-written markup, so a club change was a code change. It is
// data now, and the tests check the markup too, because that is where the
// copies that survive a data edit live.
check('the club is current', SWIMMER.club, 'Mississauga Aquatic Club');
check('and the former one is recorded, not erased', SWIMMER.formerClub, 'Lakeshore Swim Club');
['index.html', 'live-profile.js', 'recruiting.js'].forEach(function (f) {
  const src = require('fs').readFileSync(require('path').join(__dirname, f), 'utf8');
  ok(f + ' names no former club', src.indexOf('Lakeshore') === -1);
});

// The club is in Mississauga and he lives in Etobicoke. The email said "with
// Mississauga Aquatic Club in Etobicoke", which puts the club in the wrong town.
const clubDraft = R.draftEmail({
  swim: S, standards: St, swimmer: SWIMMER, results: results, today: '2026-09-18',
  profileUrl: 'https://example.org',
  school: { id: 'x', name: 'X', coach: 'A Coach', email: 'c@x.edu', division: 'D1' }
});
ok('the email names the club', clubDraft.body.indexOf('Mississauga Aquatic Club') !== -1);
ok('and does not put it in the wrong town',
  clubDraft.body.indexOf('Mississauga Aquatic Club in Etobicoke') === -1);
ok('while still saying where he lives', clubDraft.body.indexOf('from Etobicoke, Ontario') !== -1);
ok('and names the new coach', clubDraft.body.indexOf('Aris Bousoulegkas') !== -1);

// ---------- the club coach ----------
// Coaches said the thing they actually do is telephone the club coach. So a
// stale name is not a cosmetic problem, it sends a US programme to someone who
// no longer coaches him. Better nothing than wrong.
check('the coach is the current one', SWIMMER.coach, 'Aris Bousoulegkas');
const noCoach = R.draftEmail({
  swim: S, standards: St, swimmer: Object.assign({}, SWIMMER, { coach: '' }),
  results: results, today: '2026-09-18',
  profileUrl: 'https://example.org',
  school: { id: 'x', name: 'X', coach: 'A Coach', email: 'c@x.edu', division: 'D1' }
});
ok('the email names no coach when none is set', noCoach.body.indexOf('club coach') === -1);
ok('and never leaves a dangling sentence', noCoach.body.indexOf('coach is  ') === -1);

const withCoach = R.draftEmail({
  swim: S, standards: St, swimmer: Object.assign({}, SWIMMER, { coach: 'A New Coach' }),
  results: results, today: '2026-09-18', profileUrl: 'https://example.org',
  school: { id: 'x', name: 'X', coach: 'A Coach', email: 'c@x.edu', division: 'D1' }
});
ok('and names them once one is set', withCoach.body.indexOf('My coach, A New Coach,') !== -1);

// The old name must not survive anywhere, including the hand-written markup,
// which is where two of the four copies were.
['swimmer.js', 'index.html', 'live-profile.js', 'recruiting.js'].forEach(function (f) {
  const src = require('fs').readFileSync(require('path').join(__dirname, f), 'utf8');
  ok(f + ' carries no former coach name', src.indexOf('Vowles') === -1);
});
// And the rule still holds when it is cleared again, which it will be.
ok('clearing the coach still removes the line', noCoach.body.indexOf('club coach') === -1);

// ---------- the email ----------
const draft = R.draftEmail({
  swim: S, standards: St, swimmer: SWIMMER, results: results, today: '2026-09-18',
  profileUrl: 'https://example.org',
  school: { id: 'canisius', name: 'Canisius University', coach: 'Pat Smith', email: 'coach@canisius.edu', division: 'D1' }
});
ok('the email greets the coach by name', draft.body.indexOf('Hi Coach Smith') === 0);
// The rewrite briefly stopped naming the school anywhere in the body. Without
// a personal note there was nothing school-specific at all, which is worse
// than the form letter it replaced.
ok('the email names the school', draft.body.indexOf('Canisius University') !== -1);
ok('the email carries the 400 free', draft.body.indexOf('4:10.86') !== -1);
ok('the email carries the profile link', draft.body.indexOf('https://example.org?c=canisius') !== -1);
// The NCAA date came out of the letter. Andrew's draft says the same thing in
// a fifteen year old's words, ie, "I know I'm still early in the recruiting
// process", and the hard date is still on the screen beside the draft where it
// belongs. Telling a coach the rule he wrote is not warm.
ok('the letter does not quote the NCAA calendar at him',
  draft.body.indexOf('15 June 2027') === -1);
ok('but it says he is not expecting a reply yet',
  /still early in the recruiting process/.test(draft.body));
check('and the date is still returned for the screen', draft.window.replyDate, '2027-06-15');
// A school with a contact but no personal note still warns, deliberately. The
// thing that gets an email deleted is that it could have gone to two hundred
// programmes, and no template can supply the line that fixes that.
check('a school with no personal note still warns', draft.warnings.length, 1);
ok('and the warning says what to do', /why this school/i.test(draft.warnings[0]));
const personalised = R.draftEmail({
  swim: S, standards: St, swimmer: SWIMMER, results: results, today: '2026-09-18',
  profileUrl: 'https://example.org',
  school: { id: 'canisius', name: 'Canisius University', coach: 'Pat Smith',
    email: 'coach@canisius.edu', division: 'D1',
    personalNote: 'Buffalo is an easy drive from home and I have watched your distance group.' }
});
check('a personalised one raises nothing', personalised.warnings.length, 0);
ok('and it uses the line rather than the generic one',
  personalised.body.indexOf('Buffalo is an easy drive') !== -1);
ok('dropping the researched sentence when it does',
  personalised.body.indexOf('I\u2019ve looked at what your') === -1);

// With nothing researched and nothing written, the letter says nothing about
// the programme rather than reaching for a sentence that could have gone to
// two hundred of them. The paragraph above it already says he has been reading
// about the school.
const bare = R.draftEmail({
  swim: S, standards: St, swimmer: SWIMMER, results: results, today: '2026-09-18',
  profileUrl: 'https://example.org',
  school: { id: 'x', name: 'X University', coach: 'A Coach', email: 'c@x.edu', division: 'D1' }
});
ok('no invented enthusiasm', bare.body.indexOf('I\u2019d like to swim there') === -1);
ok('and no empty gap where it would have been', bare.body.indexOf('\n\n\n') === -1);

// The email for a real school, end to end.
const realDraft = R.draftEmail({
  swim: S, standards: St, swimmer: SWIMMER, results: results, today: '2026-09-18',
  profileUrl: 'https://example.org',
  school: schools.filter(function (s) { return s.id === 'gannon'; })[0]
});
check('it is addressed to the verified address', realDraft.to, 'medo001@gannon.edu');
ok('it greets Coach Medo', realDraft.body.indexOf('Hi Coach Medo') === 0);
check('and warns only that it needs a personal line', realDraft.warnings.length, 1);

const noContact = R.draftEmail({
  swim: S, standards: St, swimmer: SWIMMER, results: results, today: '2026-09-18',
  profileUrl: 'https://example.org', school: { id: 'x', name: 'X', division: 'D1' }
});
check('a missing coach email is a warning', noContact.warnings.length, 2);

// ---------- the email is Andrew's letter, filled from live data ----------
// He wrote the letter he wants sent. The job here is that every fact in it is
// read from the profile rather than typed once, so a new swim in the back end
// changes every draft.
const voice = R.draftEmail({
  swim: S, standards: St, swimmer: SWIMMER, results: results, today: '2026-09-18',
  profileUrl: 'https://example.org',
  school: { id: 'x', name: 'X University', coach: 'A Coach', email: 'c@x.edu', division: 'D1' }
});

// Two earlier rules are overruled by his draft, and both were his to overrule.
// He is fifteen, writing to an adult he has never met. Polite beats clever.
ok('it introduces himself', voice.body.indexOf('My name is Luke Hammond') !== -1);
ok('and thanks them for reading',
  voice.body.indexOf('Thank you for taking the time to read my email') !== -1);
ok('it says the class year in words', voice.body.indexOf('I\u2019m a Class of 2029 swimmer') !== -1);
ok('it names the club with the article', voice.body.indexOf('train with the Mississauga Aquatic Club') !== -1);
ok('it names the school in the opening', voice.body.indexOf('learning more about X University') !== -1);

// The Junior Trials gap stays off. A US coach carries his own standards.
ok('no Junior Trials gap', voice.body.indexOf('Junior Trials') === -1);

// The events sentence is built, not typed, because his event profile will move.
check('his events read the way a swimmer says them',
  R.eventsSentence(S.rankedByPoints(results, 5, true)),
  'the 400, 800 and 1500 freestyle, along with the 200 free and 400 IM');
ok('and it is in the letter',
  voice.body.indexOf('My primary events are the 400, 800 and 1500 freestyle') !== -1);

// The times block, one line per event, with the ranking only where one is set.
ok('the 400 free is listed with its ranking',
  voice.body.indexOf('400 Free LCM: 4:10.86, #2 in Canada for my age') !== -1);
ok('the 800 too', voice.body.indexOf('800 Free LCM: 8:43.49, #3 in Canada for my age') !== -1);
ok('the 1500 too', voice.body.indexOf('1500 Free LCM: 16:59.80, #5 in Canada for my age') !== -1);
ok('the 200 too', voice.body.indexOf('200 Free LCM: 1:59.75, #4 in Canada for my age') !== -1);
// No ranking is set for the 400 IM, so none is claimed. This is the same rule
// as the public page, ie, a blank box means no badge, never a stale one.
ok('and the 400 IM is listed without one', voice.body.indexOf('400 IM SCM: 4:41.07\n') !== -1);
ok('with nothing invented after it', !/400 IM SCM: 4:41\.07,/.test(voice.body));

// A cleared ranking must disappear from the letter, not revert to the seed.
const noRanks = R.draftEmail({
  swim: S, standards: St, swimmer: SWIMMER, results: results, today: '2026-09-18',
  profileUrl: 'https://example.org', rankings: { '400-free-LCM': { rank: 9 } },
  school: { id: 'x', name: 'X University', coach: 'A Coach', email: 'c@x.edu', division: 'D1' }
});
ok('a saved ranking is used', noRanks.body.indexOf('400 Free LCM: 4:10.86, #9 in Canada') !== -1);
ok('and the ones not saved are gone', noRanks.body.indexOf('800 Free LCM: 8:43.49\n') !== -1);

// The improvement curve is the argument. It came from the data, so it stays
// true when he swims again.
ok('the curve is in the letter', voice.body.indexOf('In 2023, my 400 free was 5:20.53') !== -1);
ok('and says where it got to', voice.body.indexOf('brought that down to 4:10.86') !== -1);
ok('claiming every season only when true',
  voice.body.indexOf('have continued to improve each season') !== -1);
ok('the second event follows it',
  voice.body.indexOf('My 400 IM has followed a similar path, improving from 6:01.58 to 4:41.07') !== -1);

// Training, academics and the two links.
ok('the training load is his own sentence',
  voice.body.indexOf('I train six days a week, about fifteen hours in the water.') !== -1);
ok('the GPA is read from the profile',
  voice.body.indexOf('3.5 GPA on a 4.0 scale') !== -1);
ok('and the field of study reads as a choice',
  voice.body.indexOf('studying history or exercise science') !== -1);
ok('the profile link carries the school code',
  voice.body.indexOf('https://example.org?c=x') !== -1);
ok('and SwimCloud is offered as well',
  voice.body.indexOf('https://www.swimcloud.com/swimmer/3306753/') !== -1);
ok('the club coach is offered by name',
  voice.body.indexOf('My coach, Aris Bousoulegkas, would also be happy to speak with you') !== -1);

// The sign off, four lines, in his order.
const tail = voice.body.trim().split('\n').slice(-4);
check('the letter signs off as he wrote it', tail,
  ['Luke Hammond', 'Class of 2029', 'Mississauga Aquatic Club', 'Etobicoke, Ontario, Canada']);

// Nothing the engine cannot see. A swimmer with no results still gets a letter
// rather than a half sentence with a hole in it.
const empty = R.draftEmail({
  swim: S, standards: St, swimmer: SWIMMER, results: [], today: '2026-09-18',
  profileUrl: 'https://example.org',
  school: { id: 'x', name: 'X University', coach: 'A Coach', email: 'c@x.edu', division: 'D1' }
});
ok('an empty season still writes a letter', empty.body.indexOf('My name is Luke Hammond') !== -1);
ok('and claims no progress it cannot show', empty.body.indexOf('most proud of') === -1);

// The 400 IM is not the "400 im".
check('an initialism survives being said aloud', R.spoken({ distance: 400, stroke: 'im' }), '400 IM');
check('an ordinary stroke does not', R.spoken({ distance: 400, stroke: 'free' }), '400 free');

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

// Dates derive from the graduation year. Written-out years were right for 2029
// and would have quietly stayed at 2029 if the class ever changed.
check('the hard deadline moves with the class',
  El.milestones(2031).filter(function (m) { return m.by.indexOf('HARD') !== -1; })[0].date, '2030-09-01');
check('so does graduation',
  El.milestones(2031).filter(function (m) { return /OSSD/.test(m.title); })[0].date, '2031-06-30');
check('and the June contact date',
  El.milestones(2031).filter(function (m) { return /coaches may reply/.test(m.title); })[0].date, '2029-06-15');
check('a nonsense class yields nothing', El.milestones('soon').length, 0);

// The age rule, for a birth date after 1 September. The trigger that starts the
// five year clock on its own fires only for a birthday BEFORE 1 September, so a
// mid-September birthday sits on the favourable side of it.
const sept = El.ageClock(9, 14, 2029);
check('a September birthday does not fire the trigger', sept.triggerFires, false);
const june = El.ageClock(6, 1, 2029);
check('a June birthday does', june.triggerFires, true);
const aug31 = El.ageClock(8, 31, 2029);
check('the last day of August still does', aug31.triggerFires, true);
ok('and the answer never claims to be settled', sept.confirm.indexOf('Confirm it in') !== -1);
check('a missing birth date yields nothing', El.ageClock(null, null, 2029), null);

// Nothing anywhere records a full date of birth. The public page shows a birth
// YEAR, which is standard on a swim recruiting profile because a coach needs
// the age year for eligibility. The day and month are not the site's business
// and are not the repo's either, ie, ageClock takes them as arguments and
// nothing ever passes them.
const eligSource = require('fs').readFileSync(require('path').join(__dirname, 'eligibility.js'), 'utf8');
ok('no full date of birth is written down anywhere',
  !/1[0-9] September 2011|2011-09-|September 14|14 September/.test(eligSource));
const pageSource = require('fs').readFileSync(require('path').join(__dirname, 'index.html'), 'utf8');
ok('the public page carries a birth year and no more',
  /Year of Birth/i.test(pageSource) && !/date of birth/i.test(pageSource));
ok('and nothing on it is a full date',
  !/\b(0?[1-9]|[12][0-9]|3[01])\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+2011\b/i.test(pageSource));

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

// ---------- the full roster ----------
// Generated from the NCAA's own membership directory rather than assembled by
// hand or copied from a recruiting site. That matters: the popular published
// lists carry programmes cut years ago and miss ones recently added.
const Ro = require('./roster.js');
check('every programme is present', Ro.counts().total, 484);
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

// ---------- U SPORTS ----------
// 26 men's programmes, from the 2026 U SPORTS Championship entry statistics
// cross-checked against each conference's own championship standings.
check('twenty six Canadian programmes', Ro.counts().USPORTS, 26);
check('OUA', Ro.ROSTER.filter(function (s) { return s.conference === 'OUA'; }).length, 10);
check('RSEQ', Ro.ROSTER.filter(function (s) { return s.conference === 'RSEQ'; }).length, 6);
check('Canada West', Ro.ROSTER.filter(function (s) { return s.conference === 'Canada West'; }).length, 6);
check('AUS', Ro.ROSTER.filter(function (s) { return s.conference === 'AUS'; }).length, 4);
ok('every Canadian entry names its source',
  Ro.ROSTER.filter(function (s) { return s.division === 'USPORTS'; })
    .every(function (s) { return s.src === 'usports'; }));

// The contact rule is no longer a guess. U SPORTS Policy 40.10.7.4.2 says
// coaches and prospects "may contact each other at any time".
check('and it is confirmed now', R.CONTACT_RULES.USPORTS.confirmed, true);
ok('against the policy that says so', /40\.10\.7\.4\.2/.test(R.CONTACT_RULES.USPORTS.source));
ok('so the message claims no hedge', R.contactWindow('USPORTS', 2029, '2026-09-18').message.indexOf('Not yet confirmed') === -1);
// The CCAA is still unconfirmed and must still say so.
ok('the CCAA still hedges', R.contactWindow('CCAA', 2029, '2026-09-18').message.indexOf('Not yet confirmed') !== -1);

// ---------- the U SPORTS standard, in his own course ----------
// The first standard we can measure him against with NO conversion at all.
// U SPORTS races short course metres and so does he.
const usports = St.STANDARDS.filter(function (s) { return s.id === 'usports-2026'; })[0];
check('the U SPORTS standard is short course metres', usports.course, 'SCM');
ok('and it is confirmed, unlike the Junior Trials cuts', usports.confirmed === true);
const usProgress = St.progressAgainst(S, results, 'usports-2026');
check('four events are tracked', usProgress.length, 4);
ok('every one has a real swim behind it', usProgress.every(function (p) { return p.best && p.gap; }));
check('the 400 free gap', S.formatGap(usProgress.filter(function (p) { return p.eventId === '400-free-SCM'; })[0].gap.behindBy), '+14.32');
ok('none is made yet', usProgress.every(function (p) { return p.gap.made === false; }));

// There is no men's 800 free at U SPORTS. It is a women's event. So one of his
// four ranked events does not exist to a Canadian coach, and the file has to
// say so rather than quietly omitting it.
check('no men\u2019s 800 is claimed', usports.cuts['800-free-SCM'], undefined);
const stdSource = require('fs').readFileSync(require('path').join(__dirname, 'standards.js'), 'utf8');
ok('and the reason is written down', /NO men\u2019s 800|NO men's 800/.test(stdSource));

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

// ---------- which Eligibility Center account ----------
// Source: NCAA Eligibility Center, Choose Your Account, read 18 September 2026.
// The trap on that page is the word "domestic". The free profile page covers a
// DOMESTIC Division III prospect. An international one going to the same school
// is sent to a paid athletics certification account instead, and five of the
// seventeen schools on this board are Division III.
const nowAcct = El.accountFor(['D1', 'D2', 'D3'], {});
check('nothing sent yet means the free account', nowAcct.key, 'profile');
check('and it costs nothing', nowAcct.pick.paid, false);
ok('while warning what comes before a visit', /before the first official visit/.test(nowAcct.why));

const liveAcct = El.accountFor(['D1', 'D2', 'D3'], { beingRecruited: true });
check('once recruiting starts it is the full one', liveAcct.key, 'full');
check('which is paid', liveAcct.pick.paid, true);
// A visit or a signature triggers it just as much as being recruited does.
check('an official visit triggers it too', El.accountFor(['D1'], { visiting: true }).key, 'full');
check('and signing', El.accountFor(['D1'], { signing: true }).key, 'full');

// The asymmetry, which is the whole reason this is in code.
const d3Intl = El.accountFor(['D3'], { beingRecruited: true });
check('a Canadian going Division III still pays', d3Intl.key, 'athletics');
ok('and is told why', /A domestic teammate would not/.test(d3Intl.why));
check('an American in the same position does not',
  El.accountFor(['D3'], { beingRecruited: true, international: false }).key, 'profile');

// Walking on does not avoid any of it.
check('a walk-on registers like anybody else', El.WALK_ON_STILL_REGISTERS, true);
ok('the full account names walk-ons', /walking on/.test(El.ACCOUNTS.full.who));
// The free one has to say it transitions, because that is the reason to open it
// now rather than later.
ok('the free account transitions later', /transitions to a certification account/.test(El.ACCOUNTS.profile.note));
check('no divisions at all still answers', El.accountFor([], {}).key, 'profile');
check('and so does nothing at all', El.accountFor(null, null).key, 'profile');

// ---------- the sixteen core courses ----------
// Sixteen is a shape to fill, not a total to reach. A student can hold twenty
// approved credits and still fail because the English is short.
// Division I from the NCAA Guide 2026-27. Division II from Division II Manual
// Bylaw 14.2.8.2.1, revised 7/21/26.
check('Division I wants sixteen', El.CORE.D1.total, 16);
check('at a 2.3 core GPA', El.CORE.D1.gpa, 2.3);
check('Division II wants sixteen too', El.CORE.D2.total, 16);
check('at 2.2', El.CORE.D2.gpa, 2.2);
check('the areas add up to sixteen in D1',
  El.CORE.D1.areas.reduce(function (n, a) { return n + a.years; }, 0), 16);
check('and in D2', El.CORE.D2.areas.reduce(function (n, a) { return n + a.years; }, 0), 16);
// The difference that actually bites: D1 wants a fourth year of English and D2
// does not, and only D1 locks ten of them in before the seventh semester.
check('D1 wants four years of English', El.CORE.D1.areas[0].years, 4);
check('D2 wants three', El.CORE.D2.areas[0].years, 3);
check('only D1 has the lock-in', El.CORE.D2.lockIn, null);
check('and it is ten, seven of them core', [El.CORE.D1.lockIn.count, El.CORE.D1.lockIn.inCore], [10, 7]);
// Division III sets no NCAA academic bar at all, and saying "sixteen" there
// would be inventing a rule.
check('Division III sets no requirement', El.auditCore(['ENG4U'], 'D3').applies, false);
ok('and says who decides instead', /university decides/.test(El.auditCore(['ENG4U'], 'D3').note));

// Subject areas come from how the NCAA Ontario sheet groups its own approved
// titles, not from what the subject sounds like.
check('English is English', El.areaOf('ENG4U'), 'english');
check('a native language course is too', El.areaOf('FRA3U'), 'english');
check('maths is maths', El.areaOf('MHF4U'), 'math');
check('science is science', El.areaOf('SBI3U'), 'science');
check('history is social science', El.areaOf('CHC2D'), 'social');
check('geography as well', El.areaOf('CGC1D'), 'social');
check('core French is a language', El.areaOf('FSF3U'), 'language');
check('philosophy has its own slot', El.areaOf('HZT4U'), 'philosophy');
// Computer science is listed by the NCAA under BOTH maths and science. It is
// recorded as maths, which is the safer of the two.
check('computer science is filed under maths', El.areaOf('ICS4U'), 'math');
check('a gym code is in no core area', El.areaOf('PPL4O'), null);

// A full Ontario path that clears Division I.
const fullPath = El.auditCore(['ENG1D', 'ENG2D', 'ENG3U', 'ENG4U', 'MPM1D', 'MPM2D', 'MCR3U',
  'MHF4U', 'SNC1D', 'SNC2D', 'SBI3U', 'SCH4U', 'CHC2D', 'CGC1D', 'FSF1D', 'FSF2D'], 'D1');
check('sixteen credits counted', fullPath.credits, 16);
ok('and the shape is filled', fullPath.met);
ok('every area met', fullPath.areas.every(function (a) { return a.met; }));

// Twenty approved credits in the wrong shape still fails, which is the whole
// reason this is a table and not a number.
const lopsided = El.auditCore(['MPM1D', 'MPM2D', 'MCR3U', 'MHF4U', 'MCV4U', 'MDM4U',
  'SNC1D', 'SNC2D', 'SBI3U', 'SCH4U', 'SPH4U', 'ICS4U', 'CHC2D', 'CGC1D', 'ENG1D', 'ENG2D'], 'D1');
check('sixteen credits again', lopsided.credits, 16);
ok('but it does not qualify', !lopsided.met);
ok('and it names English as the hole', /english/.test(lopsided.sentence));

// Courses that earn nothing are reported, not silently dropped.
const withDuds = El.auditCore(['PSK4U', 'ENG4C', 'AMU3M', 'ENG4U'], 'D1');
check('three of those four count for nothing', withDuds.rejected.length, 3);
check('and only the U level English counts', withDuds.credits, 1);
ok('kinesiology is named in the rejects',
  withDuds.rejected.some(function (r) { return r.code === 'PSK4U'; }));
// Civics is half a credit, so it can never fill a whole year on its own.
check('Civics counts half', El.auditCore(['CHV2O'], 'D1').credits, 0.5);
check('an empty list clears nothing', El.auditCore([], 'D1').met, false);
check('and an unknown division is refused', El.auditCore(['ENG4U'], 'D9'), null);

// ---------- de-streamed Grade 9, ie, the codes on his actual transcript ----------
// Ontario de-streamed Grade 9 in 2021 and the new codes end in W, which is not
// in the NCAA fifth-character table because the table predates them. The
// checker used to reject them as an unrecognised level, and Luke sat Grade 9 in
// 2025-26, so these are the codes really on his transcript.
// Source: NCAA Eligibility Center Ontario country sheet, approved title list.
['MTH1W', 'ENL1W', 'SNC1W', 'FRL1W', 'CGC1W'].forEach(function (code) {
  const r = El.checkCourse(code);
  ok(code + ' is read, not rejected', r.ok);
  check(code + ' counts', r.approved, true);
  check(code + ' is a full credit', r.credit, 1);
  ok(code + ' says why it counts', /Eligibility Center names it/.test(r.note));
});
// Only those five are named. Anything else ending in W is a question for the
// guidance office, not a yes and not a no.
const otherW = El.checkCourse('TEJ1W');
check('an unnamed de-streamed course is neither', otherW.approved, null);
check('and earns nothing until it is checked', otherW.credit, 0);
ok('with the five that are named spelled out', /MTH1W, ENL1W, SNC1W, FRL1W and CGC1W/.test(otherW.note));
// The old codes still work, because both exist on transcripts right now.
check('the academic Grade 9 codes still count', El.checkCourse('ENG1D').approved, true);
check('and Civics is still the half credit exception', El.checkCourse('CHV2O').credit, 0.5);
// The two courses a swimmer gravitates to still earn nothing.
check('kinesiology still counts for nothing', El.checkCourse('PSK4U').approved, false);
check('and so does exercise science', El.checkCourse('PSE4U').approved, false);

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
ok('the public file names no school',
  !/\b(Gannon|Canisius|Bonaventure|Bucknell|Fairfield|Niagara|Marist|Ithaca|Clarkson|Hamilton|Iona|Loyola|Manhattan)\b/i.test(utilsSource));
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
// Loyola and Hamilton have no times gathered. Queen's entered no men in any of
// the three events at the 2026 OUA championships, which is not the same thing,
// but it reads the same on the board and should.
check('nine schools remain unassessed',
  rows.filter(function (r) { return r.evidenceCount === 0; }).length, 9);
// Lethbridge and Manitoba both field men and neither entered one in the 400
// free, the 1500 or the 400 IM. That is the roster, not a missing source.
check('Lethbridge fielded nobody in his events', row('lethbridge').evidenceCount, 0);
check('nor did Manitoba', row('manitoba').evidenceCount, 0);

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
