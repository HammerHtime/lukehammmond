// board.test.js
// The safety net. Run after every change.
//
// The board is the engine. If a change here alters a verdict, that is an
// engine change, and it needs a reason written down before the numbers move.

const S = require('./public/swim.js');
const C = require('./public/convert.js');
const St = require('./public/standards.js');
const Sc = require('./schools.js');
const B = require('./public/board.js');
const R = require('./public/recruiting.js');
const { SWIMMER, SEED_RESULTS } = require('./public/swimmer.js');
const Ro = require('./public/roster.js');

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
check('the board is seeded', schools.length, 64);
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
// Eight schools publish no personal coach address at all, and every one is
// recorded as unsendable rather than dressed up with a guessed address. Five of
// the eight are Patriot League, where the big athletics sites publish a
// recruiting form instead of a person.
check('fifty-six of sixty-four are sendable', schools.filter(Sc.isSendable).length, 56);
check('and the eight that are not are named',
  schools.filter(function (s) { return !Sc.isSendable(s); }).map(function (s) { return s.id; }),
  ['carleton', 'sherbrooke', 'uqtr', 'navy', 'army', 'bostonu', 'lehigh', 'colgate']);
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
// Their real squad is six deep in the 500, not the five mixed-conference times
// the card used to carry, so he sits further back and the card says so.
check('St. Bonaventure now spans current fit to reach', row('stbonaventure').computedFit, 'Current fit / reach');
check('Niagara is a target', row('niagara').computedFit, 'Target');
// American's real 2026 squad is two men in the 500, and he is inside them, so
// the card reads better than it did off the single time it used to carry.
check('American spans current fit to reach', row('american').computedFit, 'Current fit / reach');
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

// ---------- schools researched after the first save ----------
// Once anything is stored the seed is never consulted again. That rule is
// right, ie, nothing should silently overwrite an edit. But it meant the
// twenty-six Canadian schools sat in the repo and could never reach a board
// that had already been saved, which is every board in use.
const fnSrc0 = require('fs').readFileSync(
  require('path').join(__dirname, 'netlify', 'functions', 'schools.js'), 'utf8');
ok('the researched list can be asked for', /searchParams\.get\('seed'\) === '1'/.test(fnSrc0));
ok('and it is the seed, not the store', /json\(\{ schools: lib\.seedSchools\(\), seed: true \}\)/.test(fnSrc0));

const adminSrc0 = require('fs').readFileSync(require('path').join(__dirname, 'public', 'admin.html'), 'utf8');
ok('the page asks on load', /fetch\('\/api\/schools\?seed=1'/.test(adminSrc0));
ok('and offers rather than forces', adminSrc0.indexOf('Bring them onto the board') !== -1);
// Merge, never replace: a school removed on purpose stays removed, and an
// edited one keeps the edit.
ok('it merges rather than replacing',
  /mergeSchools\(schools, seedList\)/.test(adminSrc0));
ok('and says what it left alone', /already here and left alone/.test(adminSrc0));

// The merge itself, on the real lists. Seventeen American schools plus five
// added by hand is what a board in use actually looks like.
// A board in use, ie, the American schools plus one added by hand from the
// roster search that never found a contact.
const inUse = schools.filter(function (s) { return s.country === 'USA'; })
  .concat([{ id: 'x1', name: 'Florida State University', division: 'D1', country: 'USA' }]);
const topped = Sc.mergeSchools(inUse, schools);
check('the missing ones are added', topped.added, 26);
check('the ones already there are left alone', topped.updated, schools.length - 26);
check('and the hand-added one survives',
  topped.schools.filter(function (s) { return s.id === 'x1'; }).length, 1);
check('nothing is lost', topped.schools.length, inUse.length + 26);

// ---------- taking a school off the board ----------
// Adding was easy and removing did not exist, so a school added by mistake was
// there forever. Two clicks, because there is no undo and the list took a lot
// of gathering.
const adminSrc2 = require('fs').readFileSync(require('path').join(__dirname, 'public', 'admin.html'), 'utf8');
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
const adminMarkup = require('fs').readFileSync(require('path').join(__dirname, 'public', 'admin.html'), 'utf8');
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
check('Loyola now has a real squad behind it', row('loyolamd').evidenceCount, 3);
check('Hamilton is one of them', tierOf('hamilton'), 'Not scored');
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
  const src = require('fs').readFileSync(require('path').join(__dirname, 'public', f), 'utf8');
  ok(f + ' never prints a bare tier key', !/>\s*P[123]\s*</.test(src));
});

// ---------- where he would slot into the squad ----------
// The bar was not understood, and that is a design failure rather than a
// reading failure. "Fourth fastest of five" needs no explaining.
const bonniesPlace = B.placeIn(S, row('stbonaventure').comparisons[0]);
check('he slots in sixth of seven', bonniesPlace.position, 6);
check('the squad counts him', bonniesPlace.of, 7);
check('five of them are quicker', bonniesPlace.behind, 5);
check('and he is quicker than one', bonniesPlace.fasterThan, 1);
ok('the ladder holds everyone including him', bonniesPlace.ladder.length === 7);
check('and he is in the right rung', bonniesPlace.ladder[5].mine, true);
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
const adminSrc = require('fs').readFileSync(require('path').join(__dirname, 'public', 'admin.html'), 'utf8');
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
check('a 4:32 500 moves three schools up', faster500.moved.length, 3);
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
// Division II was the app's most expensive wrong answer. The rule was recorded
// as "a coach may not reply until 15 June after sophomore year" and marked
// unconfirmed, with a note saying it would stand until the NCAA Division II
// recruiting guide was read directly. That guide was read on 19 September 2026.
// Under its freshman and sophomore heading it says, in full: "Athletically
// related recruiting materials may be sent at anytime." Its 15 June heading
// lists only in-person off-campus contacts and official visits.
//
// Nine programmes on the board are Division II. The app had been telling Andrew
// that none of them could write back for another nine months.
ok('the D2 rule is confirmed now, from the NCAA guide itself', R.CONTACT_RULES.D2.confirmed === true);
ok('and it cites that guide', R.CONTACT_RULES.D2.source.indexOf('2026-27 Division II Coaches') !== -1);
check('a D2 coach may reply today', R.contactWindow('D2', 2029, '2026-09-19').open, true);
check('and there is no reply date to wait for', R.contactWindow('D2', 2029, '2026-09-19').replyDate, null);
// The half of the D2 rule that IS still on a calendar. Flattening the two into
// one "open" would have been the same mistake in the other direction.
check('but meeting in person still waits', R.inPersonDateFor('D2', 2029), '2027-06-15');
ok('and the message says so',
  R.contactWindow('D2', 2029, '2026-09-19').message.indexOf('15 June 2027') !== -1);
ok('while Division I has no such split', R.inPersonDateFor('D1', 2029) === null);
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
// Division III, read from the Division III Manual on 19 September 2026. Bylaw
// 13.02.10.1: "There are no restrictions on the timing for electronic
// communication (e.g., telephone call, electronic mail, Instant Messenger,
// text messages or facsimiles) to prospective student-athletes."
check('a D3 coach may reply today', R.contactWindow('D3', 2029, '2026-09-19').open, true);
ok('confirmed from the Division III manual', R.CONTACT_RULES.D3.confirmed === true);
ok('and it cites the bylaw', R.CONTACT_RULES.D3.source.indexOf('13.02.10.1') !== -1);
check('with no date attached', R.contactWindow('D3', 2029, '2026-09-19').replyDate, null);
ok('and no in-person gate either', R.inPersonDateFor('D3', 2029) === null);

// The NAIA has NOT been read, so it keeps the later, safer date and keeps
// saying it is unconfirmed. Confirming two bodies is not a licence to assume
// the third.
ok('the NAIA is still unconfirmed', R.CONTACT_RULES.NAIA.confirmed === false);
check('and still uses the safe date', R.contactWindow('NAIA', 2029, '2026-09-19').open, false);

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
  const src = require('fs').readFileSync(require('path').join(__dirname, 'public', f), 'utf8');
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

// ---------- which schools would he actually swim at ----------
// Andrew's question, and the reason for it: hiding a school takes it off the
// board AND out of the scoring, so a good fit hidden by mistake disappears.
// This searches everything researched, not just what is on the board.
const fitRow = rows.filter(function (r) { return r.school.id === 'clarkson'; })[0];
const fit = B.fitScore(S, fitRow);
ok('a school with ladders gets a score', fit !== null);
ok('the share is between nought and one', fit.share >= 0 && fit.share <= 1);
check('all three of his events counted', fit.events, 3);
check('and all three rest on a real squad', fit.ranked, 3);
check('a school with nothing gathered gets nothing', B.fitScore(S, row('hamilton')), null);

// The bands say what the year looks like rather than scoring the school.
check('the three bands are named', Object.keys(B.FIT_BANDS), ['race', 'compete', 'develop']);
ok('and each says why', Object.keys(B.FIT_BANDS).every(function (k) {
  return B.FIT_BANDS[k].label && B.FIT_BANDS[k].why; }));

// A lone benchmark is NOT a squad and the sentence must not call it one.
const lone = B.fitScore(S, row('canisius'));
check('Canisius rests on one time', lone.ranked, 0);
ok('so it says there is no squad to rank against',
  /no squad to rank against yet/.test(lone.sentence));
ok('rather than claiming he leads one', lone.sentence.indexOf('Fastest on their squad') === -1);

// The search itself, with half the board hidden.
const kept = schools.filter(function (s, i) { return i % 2 === 0; });
const found = B.bestFits(S, yards, kept, schools, 10);
check('the shortlist is capped', found.shortlist.length, 10);
ok('it ranks more than the board holds', found.all.length > kept.length / 2);
ok('and finds schools that were hidden', found.missing > 0);
ok('every hidden one is marked as off the board',
  found.all.filter(function (x) { return !x.onBoard; })
    .every(function (x) { return !kept.some(function (k) { return k.id === x.school.id; }); }));
// Best first, by where he would sit on the squad.
ok('the shortlist is in order', found.shortlist.every(function (x, i, a) {
  return i === 0 || a[i - 1].fit.share <= x.fit.share; }));
// A real squad outranks a single recorded time at the same position, because
// being quicker than one time is not the same as leading a group of six.
const tied = found.all.filter(function (x) { return x.fit.share === 0; });
ok('a real ladder outranks a lone time', tied.every(function (x, i, a) {
  return i === 0 || a[i - 1].fit.ranked >= x.fit.ranked; }));
// Searching only the board still works, ie, nothing is required to be missing.
check('nothing hidden means nothing to find back',
  B.bestFits(S, yards, schools, schools, 5).missing, 0);

const fitSrc = require('fs').readFileSync(require('path').join(__dirname, 'public', 'admin.html'), 'utf8');
ok('the button sits at the top of the schools list', fitSrc.indexOf('id="findFits"') !== -1);
ok('it searches the researched list, not just the board',
  /bestFits\(S, C\.boardBests\(S, results\), schools, seedList/.test(fitSrc));
ok('and anything off the board can be put back', /data-restore="/.test(fitSrc));

// ---------- a school with no men's swimming is not a school ----------
// Andrew's rule: if a university does not offer swimming, take it off the list
// entirely. The NCAA directory's sport code covers swimming AND diving
// together, which is how a diving-only programme ends up in a swimming list.
//
// Miami is the case. Every one of its 162 men's points at the 2026 ACC
// championships came from 1m, 3m and platform diving, and no Miami man entered
// a single swimming event. Checked line by line through the 155-page results
// file rather than taken on trust.
ok('Miami is recorded as not fielding men\u2019s swimming',
  Boolean(Ro.NO_MENS_SWIMMING['University of Miami (Florida)']));
ok('with the evidence, not just the verdict',
  /No Miami man entered a single swimming event/.test(Ro.NO_MENS_SWIMMING['University of Miami (Florida)']));
check('the search never offers it',
  Ro.search('miami', 5).filter(function (h) { return h.name === 'University of Miami (Florida)'; }).length, 0);
// Miami of Ohio is a different school and does swim, so it must survive.
check('but Miami of Ohio still does',
  Ro.search('miami', 5).filter(function (h) { return h.name === 'Miami University (Ohio)'; }).length, 1);
// The count the admin page prints must be what it will actually offer.
check('the count is of programmes that swim', Ro.counts().total, Ro.sponsoring().length);
check('and it is one short of the raw directory', Ro.ROSTER.length - Ro.counts().total, 1);
check('with the drop stated', Ro.counts().dropped, 1);
// And none of them may reach the board itself.
check('no school on the board fails the rule',
  schools.filter(function (s) { return Ro.NO_MENS_SWIMMING[s.name]; }).length, 0);

// ---------- a ranking brings its own event onto the public page ----------
// Andrew added a ninth in the 200 back and a sixth in the 400 IM in the back
// end and nothing appeared. The cards came from a hardcoded list of four
// events, so the ranking was saved with nowhere to show.
//
// Putting a national ranking on an event IS the statement that it matters, so
// the ranking now carries the card. Clear the box and the card goes with it.
const liveSrc = require('fs').readFileSync(
  require('path').join(__dirname, 'public', 'live-profile.js'), 'utf8');
ok('the primary events always show', /var shown = \(SWIMMER\.primary \|\| \[\]\)/.test(liveSrc));
ok('and anything ranked follows them', /Object\.keys\(rankings\)\s*\n\s*\.filter/.test(liveSrc));
ok('best ranking first', /\.sort\(function \(a, b\) \{ return a\.rank - b\.rank; \}\)/.test(liveSrc));
ok('and only where he has actually swum it', /!already\[id\] && bests\[id\]/.test(liveSrc));

// The label reads off the SWIM, not off the list entry. Taking it from the
// list entry, which no longer carries distance or stroke, turned every card
// label into a bare "m".
ok('the card label comes from the swim',
  /esc\(best\.distance\) \+ 'm ' \+ esc\(S\.STROKE_LABEL\[best\.stroke\]\)/.test(liveSrc));
// Scoped to the times grid. The hero stats still walk SWIMMER.primary, where
// those fields do exist, so a file-wide check would be wrong.
const gridBlock = /var cards = shown\.map\(function \(p\) \{[\s\S]*?'<\/div>';\n\s*\}\)/.exec(liveSrc)[0];
ok('and the grid never reads them off the list entry', gridBlock.indexOf('esc(p.distance)') === -1);

// ---------- what he actually did when he started ----------
// The 2022 milestone described his CURRENT training load, ie, six days a week
// and fifteen hours, as though he had walked in doing it. He started on two
// days a week and three to four hours.
const pageSrc = require('fs').readFileSync(require('path').join(__dirname, 'public', 'index.html'), 'utf8');
ok('the 2022 entry says what he actually started on',
  /Started competitive swimming in the spring of 2022, two days a week, three to four hours\./.test(pageSrc));
ok('and no longer claims fifteen hours from day one',
  pageSrc.indexOf('spring of 2022 \u2014 6 days a week') === -1);
// His current load is still stated, in the present tense, where it belongs.
ok('the about section still carries the real load now',
  /trains 6 days a week and spends over 15 hours/.test(pageSrc));

// ---------- the club is in a different town to the swimmer ----------
// He LIVES in Etobicoke and TRAINS in Mississauga. The public contact card was
// pairing his home town with the club's name, ie, "Mississauga Aquatic Club,
// Etobicoke", which puts the club somewhere it is not. A coach checking the
// address would have found nothing there.
//
// The same mistake was caught in the coach email once already. This was the
// copy of it that survived on the public page, which is why both now read from
// their own field rather than sharing one.
check('he lives in Etobicoke', SWIMMER.city, 'Etobicoke');
check('and the club is in Mississauga', SWIMMER.clubCity, 'Mississauga');
ok('they are not the same town', SWIMMER.city !== SWIMMER.clubCity);

const profileSrc = require('fs').readFileSync(
  require('path').join(__dirname, 'public', 'live-profile.js'), 'utf8');
ok('the contact card uses the club\u2019s town', /coach\.clubCity \|\| SWIMMER\.clubCity/.test(profileSrc));
ok('and never the swimmer\u2019s', profileSrc.indexOf("SWIMMER.city") === -1);
// The province is read, not typed, so a move does not leave a stale "ON".
ok('the province comes from the data', /', ' \+ SWIMMER\.province/.test(profileSrc));
// And the em dash went with it. Andrew's rule, on a line a coach reads. The one
// em dash left in the file is a table cell meaning "no value", which is a
// glyph rather than punctuation, so it stays.
const cardLine = /var card = el\('contact-club'\);[\s\S]*?\n    \}/.exec(profileSrc)[0];
ok('no em dash on the contact card', cardLine.indexOf('\u2014') === -1);
check('and only one is left in the file, as a placeholder',
  (profileSrc.match(/\u2014/g) || []).length, 1);

// The email had this fixed already and must stay fixed.
ok('the email still keeps the club out of the wrong town',
  clubDraft.body.indexOf('Mississauga Aquatic Club in Etobicoke') === -1);

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
  const src = require('fs').readFileSync(require('path').join(__dirname, 'public', f), 'utf8');
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

// ---------- the dashboard ----------
// The back end had everything and surfaced nothing. It opened onto a form and
// a table of sixty-four rows, and the counting was left to Andrew: which
// schools may be written to, which contact is old enough to bounce, which
// coach has been on the page, which email was never answered.
const Dash = require('./public/dashboard.js');

// The pipeline. `status` has always been free text defaulting to "Not
// contacted", shown as a tag and settable from nowhere, so every school read
// "Not contacted" forever. Old values map rather than being thrown away.
check('the pipeline runs in order', Dash.STAGES.map(function (s) { return s.key; }),
  ['researching', 'ready', 'contacted', 'viewed', 'replied', 'call', 'visit', 'closed']);
check('an empty status starts at the beginning', Dash.stageOf({ status: '' }), 'researching');
check('so does the old default', Dash.stageOf({ status: 'Not contacted' }), 'researching');
check('a label maps back to its key', Dash.stageOf({ status: 'Ready to contact' }), 'ready');
check('free text is read where it plainly means something',
  Dash.stageOf({ status: 'coach replied' }), 'replied');
check('and where it means closed', Dash.stageOf({ status: 'declined' }), 'closed');
// 'no' as a prefix matched "nonsense" and filed it as closed. Anything
// unrecognised now sits at the start rather than somewhere invented.
check('nonsense is not read as a decision', Dash.stageOf({ status: 'nonsense' }), 'researching');
check('nor is a month', Dash.stageOf({ status: 'November' }), 'researching');
check('but a bare no is', Dash.stageOf({ status: 'no' }), 'closed');

// Data age. Contacts go stale faster than benchmarks: staff move in the
// spring, and a bounced address in 2027 is a wasted slot.
ok('a contact is stale sooner than a benchmark',
  Dash.CONTACT_STALE_DAYS < Dash.BENCHMARK_STALE_DAYS);
check('days are counted plainly', Dash.daysBetween('2026-06-01', '2026-09-19'), 110);
check('a missing date counts as nothing', Dash.daysBetween('', '2026-09-19'), null);
check('so does rubbish', Dash.daysBetween('soon', '2026-09-19'), null);

const fresh = Dash.ageReport(
  { email: 'a@b.ca', verifiedOn: '2026-09-01', benchmarks: [1], benchmarksCheckedOn: '2026-09-01' },
  '2026-09-19');
ok('a recent contact is not flagged', fresh.contactStale === false);
ok('nor are recent benchmarks', fresh.benchmarkStale === false);

const old = Dash.ageReport(
  { email: 'a@b.ca', verifiedOn: '2026-01-05', benchmarks: [1], benchmarksCheckedOn: '2024-01-05' },
  '2026-09-19');
ok('an old contact is flagged', old.contactStale);
ok('and old benchmarks are', old.benchmarkStale);

// Never verified is worse than verified long ago, and both need a look.
const never = Dash.ageReport({ email: 'a@b.ca', verifiedOn: '', benchmarks: [] }, '2026-09-19');
ok('a contact that was never verified is flagged', never.contactStale);
check('and has no age to report', never.contactDays, null);
// A school with no email is not a stale contact, it is a missing one. Calling
// it stale would hide it among the ones that merely need re-checking.
ok('a school with no email is not called stale',
  Dash.ageReport({ email: '', verifiedOn: '' }, '2026-09-19').contactStale === false);
ok('and a school with no benchmarks is not called stale either',
  Dash.ageReport({ email: 'a@b.ca', verifiedOn: '2026-09-01', benchmarks: [] }, '2026-09-19')
    .benchmarkStale === false);

// The summary. Built on the real board so the numbers are the real numbers.
const dashSchools = Sc.seedSchools();
const dashResults = require('./public/swimmer.js').SEED_RESULTS
  .map(S.normaliseResult).filter(function (r) { return r.ok; })
  .map(function (r) { return r.result; });
const dashRows = B.scoreBoard(S, C.boardBests(S, dashResults), dashSchools);
const dashCtx = {
  today: '2026-09-19',
  visits: {},
  windowFor: function (division) { return R.contactWindow(division, 2029, '2026-09-19'); },
  tierLabel: function (p) { const t = B.tierFor(p, true); return t ? t.label : null; }
};
const picture = Dash.summarise(dashRows, dashCtx);

check('every school is counted once', picture.counts.schools, dashSchools.length);
check('and split into those who may answer and those who may not',
  picture.counts.openNow + picture.counts.waiting, dashSchools.length);
// The number this whole screen exists to show. Forty of the sixty-four can be
// written to today. Before the D2 and D3 rules were read, the app said none.
ok('most of the board can be emailed today', picture.counts.openNow > picture.counts.waiting);
check('and the ones waiting are the Division I programmes',
  picture.counts.waiting,
  dashSchools.filter(function (sc) { return sc.division === 'D1'; }).length);

// Every school lands on exactly one rung.
const staged = Object.keys(picture.counts.byStage)
  .reduce(function (n, k) { return n + picture.counts.byStage[k]; }, 0);
check('every school sits on exactly one rung', staged, dashSchools.length);

// Attention items. Ranked so the rarest, most perishable signal is first.
const withVisit = Object.assign({}, dashCtx, {
  visits: { fairfield: { count: 3, first: '2026-09-12', last: '2026-09-18', days: {} } }
});
const visited = Dash.summarise(dashRows, withVisit);
check('a coach on the page is counted', visited.counts.viewedRecently, 1);
check('and is the first thing on the list', visited.attention[0].kind, 'viewed');
ok('naming the school', visited.attention[0].school.id === 'fairfield');
ok('and how many times', visited.attention[0].text.indexOf('3 visits') !== -1);

// A visit from a year ago is not news.
const stale = Dash.summarise(dashRows, Object.assign({}, dashCtx, {
  visits: { fairfield: { count: 3, first: '2025-01-01', last: '2025-01-02', days: {} } } }));
check('an old visit is not reported as activity', stale.counts.viewedRecently, 0);

// Contacted and unanswered becomes a follow-up, but only after a fair wait.
function withStatus(id, patch) {
  return dashRows.map(function (row) {
    return row.school.id === id
      ? Object.assign({}, row, { school: Object.assign({}, row.school, patch) })
      : row;
  });
}
const waited = Dash.summarise(
  withStatus('fairfield', { status: 'contacted', lastContact: '2026-09-01' }), dashCtx);
ok('an unanswered email becomes a follow-up',
  waited.attention.some(function (a) { return a.kind === 'follow-up'; }));
const justSent = Dash.summarise(
  withStatus('fairfield', { status: 'contacted', lastContact: '2026-09-18' }), dashCtx);
ok('but not the day after it was sent',
  !justSent.attention.some(function (a) { return a.kind === 'follow-up'; }));

// The cheapest win: allowed to answer, never asked.
ok('a school that may answer and has not been asked is surfaced',
  picture.attention.some(function (a) { return a.kind === 'can-send'; }));
ok('and a Division I one is not, because it may not answer yet',
  !picture.attention.some(function (a) {
    return a.kind === 'can-send' && a.school.division === 'D1';
  }));

// Overflow wording is generic on purpose. Saying "36 more can be emailed
// today, NCAA Division II coaches may reply now" borrows one school's division
// and implies it of thirty-six.
ok('an overflow line names no division', Dash.summaryFor('can-send').indexOf('Division') === -1);
Object.keys(Dash.KIND_SUMMARY).forEach(function (kind) {
  ok(kind + ' has a plural summary', /^(have|are|can|were)\b/.test(Dash.KIND_SUMMARY[kind]));
});
check('an unknown kind still says something', Dash.summaryFor('nope'), 'need a look');

// ---------- the back end shows what it collects ----------
// /api/visits shipped with the visit counter and nothing ever read it.
const adminSrcDash = require('fs').readFileSync(
  require('path').join(__dirname, 'public', 'admin.html'), 'utf8');
ok('the back end now reads the visit data it collects',
  adminSrcDash.indexOf("api('/api/visits')") !== -1);
ok('the dashboard renders before anything else', /renderAll\(\)\s*\{\s*\n\s*renderDashboard\(\);/.test(adminSrcDash));
ok('the dashboard card sits above Add a swim',
  adminSrcDash.indexOf('id="dashCard"') < adminSrcDash.indexOf('<h2>Add a swim</h2>'));
ok('each school carries a pipeline control', adminSrcDash.indexOf('data-stage=') !== -1);
ok('and changing it saves straight away', /addEventListener\('change', function \(\) \{ setStage/.test(adminSrcDash));
// Entering "contacted" stamps the date, so the follow-up counter starts on its
// own rather than waiting for someone to type today's date.
ok('moving to contacted stamps the date',
  /stage === 'contacted' && !sc\.lastContact\) copy\.lastContact = today/.test(adminSrcDash));
ok('the stale status tag is gone from the card',
  adminSrcDash.indexOf("esc(r.school.status || 'Not contacted')") === -1);

// ---------- the public page carries no editing tools ----------
// A coach opening the page used to be able to click a gallery photo and get a
// FILE PICKER, and every photo tile carried a remove button. It only touched
// their own browser storage, but a coach should never be shown an interface
// that looks like they can edit the athlete's profile. There was also a live
// theme editor on the page, with colour pickers and a postMessage handshake
// left over from a site builder. Photos are managed in admin.html now.
const publicHtml = require('fs').readFileSync(
  require('path').join(__dirname, 'public', 'index.html'), 'utf8');

ok('no file picker on the public page', publicHtml.indexOf('type="file"') === -1);
ok('no upload affordance', !/uploadable|upload-hint|upload-remove/.test(publicHtml));
ok('no remove-photo button', publicHtml.indexOf('Remove photo') === -1);
ok('no theme editor panel', publicHtml.indexOf('tweaks-panel') === -1);
ok('no edit-mode handshake with a parent frame', publicHtml.indexOf('__edit_mode') === -1);
ok('and the page never writes to browser storage',
  !/localStorage\.(set|remove)Item/.test(publicHtml));

// The split panel and the lightbox are real dialogs now, not bare divs.
ok('the split panel announces itself as a dialog', /id="splits-modal"[^>]*role="dialog"/.test(publicHtml));
ok('and is labelled by its own title', /aria-labelledby="splits-title"/.test(publicHtml));
ok('its close button has a name', /data-close-splits[^>]*aria-label=/.test(publicHtml));

// ---------- the stylesheet is not broken ----------
// Two rules had lost their opening. The orphaned declarations after
// .hero-stat-label were discarded by the browser, and .reveal had lost its
// selector AND its opacity, so the fade animation silently stopped existing.
const pageCss = publicHtml.slice(publicHtml.indexOf('<style>') + 7, publicHtml.indexOf('</style>'));
check('every CSS rule is closed exactly once',
  pageCss.split('{').length, pageCss.split('}').length);
ok('the reveal rule has its selector back', /\.js \.reveal \{/.test(pageCss));
ok('and it sets the opacity it starts from', /\.js \.reveal \{\s*opacity: 0;/.test(pageCss));
// Gated on .js, so a script failure cannot leave a coach looking at a blank page.
ok('nothing is hidden unless the script is running', pageCss.indexOf('\n  .reveal {') === -1);
ok('reduced motion turns the animation off', /prefers-reduced-motion[\s\S]{0,120}\.reveal/.test(pageCss));

// ---------- claims are counted, not typed ----------
ok('the hero badge is filled from the rankings', publicHtml.indexOf('id="hero-badge-claim"') !== -1);
ok('and carries no typed claim of its own', publicHtml.indexOf('Ranked Top 5 in Canada · 4 Distance') === -1);
const liveJs = require('fs').readFileSync(
  require('path').join(__dirname, 'public', 'live-profile.js'), 'utf8');
ok('the bracket comes off the worst rank, so it holds for every event counted',
  /Math\.max\.apply\(null, held\.map/.test(liveJs));

// Forty of the sixty-four programmes on the board are not Division I. A page
// that says the goal is Division I tells a U SPORTS, D2 or D3 coach they are
// not the target, and "scholarship" says the same to the Ivies and to D3,
// neither of which award athletic money at all.
ok('the public copy does not promise Division I', publicHtml.indexOf('Division I') === -1);
ok('and does not hang the goal on a scholarship', !/earning a scholarship/.test(publicHtml));

// ---------- the no-script fallback matches the data ----------
// index.html carries static cards and a static results table for the case
// where the scripts do not run. That copy had drifted to 4:11.47 while the
// stored best was 4:10.86, ie, the page was showing a slower time and calling
// it his best. These checks fail the moment it drifts again.
const seedResults = require('./public/swimmer.js').SEED_RESULTS
  .map(S.normaliseResult).filter(function (r) { return r.ok; })
  .map(function (r) { return r.result; });
const seedBests = S.personalBests(seedResults);
const seedRanks = require('./public/swimmer.js').seedRankings();

Object.keys(seedRanks).forEach(function (id) {
  const best = seedBests[id];
  if (!best) return;
  ok('the fallback card for ' + id + ' shows ' + best.time,
    publicHtml.indexOf('>' + best.time + '<span class="time-pb-badge">') !== -1);
});
ok('no superseded 400 free time survives in the markup',
  publicHtml.split('4:11.47').filter(function (chunk, i) { return i > 0; }).length <= 2);

// ---------- the charts and the split panel ----------
const chartsSrc = require('fs').readFileSync(
  require('path').join(__dirname, 'public', 'charts.js'), 'utf8');
ok('the chart data is no longer typed into the page', publicHtml.indexOf('splitsData') === -1);
ok('nor are the chart series', !/const data400|const data800/.test(publicHtml));
ok('the Junior Trials line is read from standards.js', /cutFor\('can-jr-trials'/.test(chartsSrc));
ok('the page loads standards.js so that line can be drawn',
  /<script src="standards\.js"><\/script>/.test(publicHtml));
ok('and loads charts.js before live-profile.js',
  publicHtml.indexOf('<script src="charts.js">') <
  publicHtml.indexOf('<script src="live-profile.js">'));
ok('the chart headline is an empty node the code fills',
  /id="chart400-line"[^>]*><\/div>/.test(publicHtml));

const Ch = (function () {
  const vmC = require('vm');
  const scope = { window: {}, document: { addEventListener: function () {} }, console: console };
  scope.window.Swim = S;
  scope.window.Standards = require('./public/standards.js');
  scope.globalThis = scope;
  vmC.createContext(scope);
  vmC.runInContext(chartsSrc, scope, { filename: 'charts.js' });
  return scope.window.Charts;
})();

const ser400 = Ch.seriesFor(seedResults, '400-free-LCM');
ok('the 400 series is built from the stored swims', ser400.length >= 4);
check('and ends on the stored best', ser400[ser400.length - 1].time, seedBests['400-free-LCM'].time);
ok('the series runs oldest to newest', ser400[0].x < ser400[ser400.length - 1].x);
const pb = Ch.pbLine(ser400);
ok('the personal-best line never goes back up',
  pb.every(function (p, i) { return i === 0 || p.y <= pb[i - 1].y; }));
ok('the headline names the stored best, not a superseded swim',
  Ch.headline(ser400).indexOf(seedBests['400-free-LCM'].time) !== -1);
ok('and it does not name the old 4:11.47', Ch.headline(ser400).indexOf('4:11.47') === -1);
check('a single swim makes no improvement claim at all', Ch.headline(ser400.slice(0, 1)), '');
check('and no swims at all gives nothing', Ch.headline([]), '');

// Splits are transcribed from one race, so each set records WHICH race. That
// is what lets the panel say "these are from his 4:11.47, his best is now
// 4:10.86" instead of presenting an old swim as the current best.
Object.keys(Ch.SPLITS).forEach(function (id) {
  const rec = Ch.SPLITS[id];
  ok(id + ' splits name the swim they came from', Boolean(rec.time && rec.date && rec.meet));
  check(id + ' has one split per 50 of the race',
    rec.splits.length, Number(id.split('-')[0]) / 50);
  ok(id + ' splits add up to the time they claim',
    Math.abs(rec.splits.reduce(function (a, b) { return a + b; }, 0) -
      S.parseTime(rec.time) / 100) < 0.5);
});
ok('a superseded split set is detectable',
  S.parseTime(Ch.SPLITS['400-free-LCM'].time) > S.parseTime(seedBests['400-free-LCM'].time));
ok('the panel has somewhere to say so', publicHtml.indexOf('id="splits-note"') !== -1);

// ---------- the school-specific coach view ----------
// A coach who follows the link in their own email opens the page with their
// own programme's comparison at the top. The numbers come from the server,
// because schools.js is not deployed: it holds ninety coach addresses and
// every programme's benchmarks, and a coach must never be able to read it.
const coachFn = require('fs').readFileSync(
  require('path').join(__dirname, 'netlify', 'functions', 'coach.js'), 'utf8');

ok('the coach endpoint exists', coachFn.length > 0);
ok('it is mounted at /api/coach', /path: '\/api\/coach'/.test(coachFn));
ok('and refuses anything but a read', /request\.method !== 'GET'/.test(coachFn));

// The response is built as an allowlist. Deleting fields from the school record
// instead would publish anything added to schools.js later, which is the exact
// shape of the bug that put the whole file on the internet.
const built = coachFn.slice(coachFn.indexOf('function publicComparison'),
  coachFn.indexOf('export default'));
ok('the response names the fields it returns', built.indexOf('name: row.school.name') !== -1);
['email', 'assistantEmail', 'priority', 'confidence', 'notes', 'contactNote', 'staffUrl',
  'nextAction', 'lastContact', 'coachReply'].forEach(function (field) {
  ok('the coach response never carries ' + field, built.indexOf(field) === -1);
});
ok('and it returns one school, never the list', built.indexOf('schools') === -1);

// The token is an HMAC under ADMIN_KEY, compared in constant time. It is not
// privacy, ie, whoever is sent the link can open it and may forward it. It
// stops the addresses being guessed one school at a time.
ok('the token is signed, not guessable', /createHmac\('sha256', process\.env\.ADMIN_KEY\)/.test(coachFn));
ok('and compared in constant time', /timingSafeEqual/.test(coachFn));
ok('a wrong token is refused', /if \(!admin && !tokenOk\(id, url\.searchParams\.get\('t'\)\)\) return denied\(\)/.test(coachFn));
// A school that is not on the board and a school with a bad token must answer
// the same way, or the endpoint becomes a way to find out which ids exist.
ok('an unknown school looks the same as a bad token to a stranger',
  /if \(!school\) return admin \? json\(\{ error: 'No such school\.' \}, 404\) : denied\(\)/.test(coachFn));

// The page side.
ok('the page has somewhere to put it', publicHtml.indexOf('id="school-panel"') !== -1);
ok('and it starts hidden', /<section id="school-panel" hidden/.test(publicHtml));
// live-profile.js already built an element with id "coach-panel" for the yards
// block. Naming this one the same meant the older code found this one with
// getElementById and wrote the yards panel into it, so the school panel turned
// up on every visit carrying entirely the wrong content.
check('only one element claims the id coach-panel',
  (publicHtml.match(/id="coach-panel"/g) || []).length, 0);
ok('the yards block still builds its own', liveJs.indexOf("block.id = 'coach-panel'") !== -1);
ok('and the school panel uses a different id', liveJs.indexOf("el('school-panel')") !== -1);
ok('two functions with one name would have shadowed each other',
  liveJs.indexOf('function schoolPanel()') !== -1 &&
  liveJs.indexOf('function coachPanel(yards)') !== -1);
ok('nothing is shown without both a school and a token',
  /if \(!from \|\| !token\) return;/.test(liveJs));
ok('and a refused token leaves the ordinary page alone',
  /r\.ok \? r\.json\(\) : null/.test(liveJs));

// ---------- the one page for coaches ----------
// A PDF typed out by hand is right the day it is made and wrong a meet later,
// and a coach reading a slower time than the swimmer owns is worse off than a
// coach reading nothing.
const onePager = require('fs').readFileSync(
  require('path').join(__dirname, 'public', 'onepager.html'), 'utf8');
const onePagerJs = require('fs').readFileSync(
  require('path').join(__dirname, 'public', 'onepager.js'), 'utf8');

ok('the one pager is deployed', onePager.length > 0);
ok('it is kept out of search results', /name="robots" content="noindex/.test(onePager));
ok('it prints to A4', /@page \{ size: A4/.test(onePager));
ok('it reads the stored results', onePagerJs.indexOf("fetch('/api/results')") !== -1);
ok('and falls back to the shipped record when the back end is unreachable',
  onePagerJs.indexOf('D.SEED_RESULTS') !== -1);
ok('it carries no typed times', !/\d:\d\d\.\d\d/.test(onePagerJs));
ok('every yards figure is marked as converted',
  onePagerJs.indexOf('has never swum a yard') !== -1);
ok('a ranked event cannot be left off the sheet',
  /Object\.keys\(rankings\)\.forEach/.test(onePagerJs));
// The QR is optional. A missing square is nothing, a broken image on a coach's
// desk is worse than no square.
ok('the QR is drawn only if its library loaded', /if \(!host \|\| !window\.qrcode\) return;/.test(onePagerJs));
ok('the QR library is pinned by hash',
  /integrity="sha512-[A-Za-z0-9+/=]{88}"/.test(onePager));
ok('and loaded cross-origin with no referrer', /crossorigin="anonymous" referrerpolicy="no-referrer"/.test(onePager));

// The back end can reach both.
ok('the back end links the one pager', adminSrcDash.indexOf('href="/onepager.html"') !== -1);
ok('and offers a per-school link to copy', adminSrcDash.indexOf('data-coachlink=') !== -1);
ok('which is minted on the server, not in the page',
  /api\('\/api\/coach\?link=1&c='/.test(adminSrcDash));

// ---------- what is actually deployed ----------
// This block exists because of a live leak, not a hypothetical one.
//
// The publish root used to be the whole repository, guarded by a redirect per
// file that had to stay private. Netlify serves files case-insensitively and
// matches redirects case-sensitively, so the guard could be walked around by
// changing one letter. On 19 September 2026 the deployed site returned
// /schools.JS in full, ie, ninety coach email addresses and every benchmark,
// while /schools.js correctly returned 404. /claude.md and /Board.test.js went
// the same way.
//
// The fix is an allowlist: only public/ is deployed. These checks assert the
// shape of that folder, because a blocklist cannot be tested for the file
// nobody remembered to add to it, and an allowlist can.
const fsP = require('fs');
const pathP = require('path');
const PUBLIC_DIR = pathP.join(__dirname, 'public');
const deployed = fsP.readdirSync(PUBLIC_DIR);

check('the publish root is public/, not the repository',
  /publish\s*=\s*"public"/.test(fsP.readFileSync(pathP.join(__dirname, 'netlify.toml'), 'utf8')), true);

// The school file carries every coach address on the board. It is the single
// most damaging file in the repository and it must not be deployable.
ok('schools.js is not in the deployed folder', deployed.indexOf('schools.js') === -1);
ok('and it still exists at the root, where the functions read it',
  fsP.existsSync(pathP.join(__dirname, 'schools.js')));

// Nothing that is not the website goes out.
['board.test.js', 'browser.test.js', 'CLAUDE.md', 'README.md', 'package.json', 'docs',
  'node_modules', 'netlify', '.git'].forEach(function (name) {
  ok(name + ' is not deployed', deployed.indexOf(name) === -1);
});

// Nothing private can hide in the deployed folder either. Anything that is not
// a page, a script or a photo has no business being served.
deployed.forEach(function (name) {
  ok('public/' + name + ' is a page, a script or the photo folder',
    /\.(html|js|css)$/.test(name) || name === 'uploads');
});
ok('no test file slipped into the deployed folder',
  deployed.filter(function (n) { return /\.test\.js$/.test(n); }).length === 0);
ok('and no markdown notes did either',
  deployed.filter(function (n) { return /\.md$/i.test(n); }).length === 0);

// Every script each page asks for has to be inside the publish folder, or the
// page loads a 404 in production and the suite never notices.
['index.html', 'admin.html'].forEach(function (page) {
  const html = fsP.readFileSync(pathP.join(PUBLIC_DIR, page), 'utf8');
  const srcs = (html.match(/src="([^"]+\.js)"/g) || [])
    .map(function (s) { return s.slice(5, -1); })
    .filter(function (s) { return s.indexOf('//') === -1; });
  ok(page + ' asks for at least one local script', srcs.length > 0);
  srcs.forEach(function (s) {
    ok(page + ' can actually load ' + s, fsP.existsSync(pathP.join(PUBLIC_DIR, s)));
  });
});

// The old redirect blocklist is gone. Leaving it would suggest it still works.
const toml = fsP.readFileSync(pathP.join(__dirname, 'netlify.toml'), 'utf8');
ok('no per-file blocklist remains to be trusted', toml.indexOf('/schools.js') === -1);
ok('the security headers survived the move', toml.indexOf('X-Content-Type-Options') !== -1);
ok('and admin.html is still kept out of search results', toml.indexOf('noindex') !== -1);

// ---------- Ontario eligibility ----------
// Sourced to the NCAA Ontario country sheet dated September 2026, not to a
// recruiting service. These are the rules that quietly cost an Ontario swimmer
// a year or a grade point.
const El = require('./public/eligibility.js');

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

// The core GPA, ie, where the halves come from. convertMark only ever returns a
// whole number because the NCAA Ontario table only has whole numbers on it. A
// 3.5 is the AVERAGE of those whole numbers across the core courses.
check('an A and a B average to 3.5', El.coreGpa(
  [{ code: 'ENG4U', mark: 84 }, { code: 'MHF4U', mark: 78 }]).gpa, 3.5);
check('and it prints to three decimals like the NCAA does', El.coreGpa(
  [{ code: 'ENG4U', mark: 84 }, { code: 'MHF4U', mark: 78 }]).shown, '3.500');
check('a B and a C average to 2.5', El.coreGpa(
  [{ code: 'ENG4U', mark: 74 }, { code: 'MHF4U', mark: 64 }]).gpa, 2.5);
check('three A and one C is 3.5 too', El.coreGpa(
  [{ code: 'ENG4U', mark: 84 }, { code: 'MHF4U', mark: 88 },
    { code: 'SPH4U', mark: 91 }, { code: 'SBI4U', mark: 62 }]).gpa, 3.5);

// Civics is half a credit, so it pulls half as hard. An A in Civics beside a C
// in a full credit is not a 3.0, it is a 2.667.
const civics = El.coreGpa([{ code: 'CHV2O', mark: 95 }, { code: 'ENG4U', mark: 65 }]);
check('a half credit is weighted at a half', civics.shown, '2.667');
check('and the credit count says 1.5', civics.credits, 1.5);

// An empty mark box is not a zero. Number('') is 0, which would book an F.
const blank = El.coreGpa([{ code: 'ENG4U', mark: 84 }, { code: 'MHF4U', mark: '' }]);
check('an unmarked course is left out, not failed', blank.gpa, 4);
check('and it is named as waiting for a mark', blank.skipped[0].code, 'MHF4U');

// Courses that earn no core credit never reach the average at all, whatever
// the mark on them is. A 95 in Kinesiology changes nothing.
const kin = El.coreGpa([{ code: 'ENG4U', mark: 84 }, { code: 'PSK4U', mark: 95 }]);
check('a 95 in a non-core course does not lift the GPA', kin.gpa, 4);
check('it is reported as skipped', kin.skipped[0].code, 'PSK4U');

// The best 16 core credits, not the first 16 and not all of them. A bad extra
// course that was never needed does not drag the number down.
const sixteen = ['ENG4U', 'ENG3U', 'ENG2D', 'ENG1D', 'MHF4U', 'MCR3U', 'MPM2D',
  'SPH4U', 'SBI4U', 'SNC2D', 'CHC2D', 'CGC1W', 'FSF2D', 'FSF3U', 'SCH4U', 'MDM4U']
  .map(function (c) { return { code: c, mark: 85 }; });
const best = El.coreGpa(sixteen.concat([{ code: 'CHW3M', mark: 55 }]));
check('sixteen credits is the cap', best.credits, 16);
check('so a seventeenth weak course cannot drag it down', best.gpa, 4);
check('and it is held as spare, not thrown away', best.spare[0].code, 'CHW3M');

// The bars, and what is still needed to clear them.
check('Division I asks 2.300', El.coreGpa(sixteen).bar, 2.3);
check('Division II asks 2.200', El.coreGpa(sixteen, 'D2').bar, 2.2);
check('sixteen A credits clears it', El.coreGpa(sixteen).clears, true);
const weak = El.coreGpa([{ code: 'ENG4U', mark: 55 }, { code: 'MHF4U', mark: 55 }]);
check('two D credits is a 1.000 so far', weak.shown, '1.000');
check('and the other fourteen must average 2.486', weak.needed, 2.486);
ok('the sentence says so plainly', weak.sentence.indexOf('average 2.49') !== -1);
// Fourteen F credits with two D credits already banked cannot be rescued.
const sunk = El.coreGpa(['ENG4U', 'ENG3U', 'ENG2D', 'ENG1D', 'MHF4U', 'MCR3U',
  'MPM2D', 'SPH4U', 'SBI4U', 'SNC2D', 'CHC2D', 'CGC1W']
  .map(function (c) { return { code: c, mark: 30 }; }));
ok('a sunk GPA is said to be sunk', sunk.impossible);

// Division III sets no NCAA academic requirement, so there is no bar to print.
check('Division III has no core GPA to meet', El.coreGpa(sixteen, 'D3').applies, false);

// People type the list every way there is.
const typed = El.parseCourseLines('ENG4U 84\nMHF4U, 78\n\nsph4u: 71\nSBI4U - 66%');
check('four lines read back', typed.length, 4);
check('a lower case code is lifted', typed[2].code, 'SPH4U');
check('a percent sign is dropped', typed[3].mark, '66');
check('and the blank line is ignored', typed[1].code, 'MHF4U');

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
const eligSource = require('fs').readFileSync(require('path').join(__dirname, 'public', 'eligibility.js'), 'utf8');
ok('no full date of birth is written down anywhere',
  !/1[0-9] September 2011|2011-09-|September 14|14 September/.test(eligSource));
const pageSource = require('fs').readFileSync(require('path').join(__dirname, 'public', 'index.html'), 'utf8');
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
// The directory holds 484. One of them, Miami, fields men's diving and no
// men's swimming, so 483 is what the search offers and what the page counts.
check('the directory holds every programme', Ro.ROSTER.length, 484);
check('and 483 of them actually swim', Ro.counts().total, 483);
check('NAIA, from a different source entirely', Ro.counts().NAIA, 16);
ok('and every NAIA entry says so', Ro.ROSTER.filter(function (s) { return s.division === 'NAIA'; })
  .every(function (s) { return s.src === 'cscaa'; }));
// Private versus public decides the money for a Canadian more than the swim
// does: a private college gives merit aid a coach's letter can move, a public
// campus is cheaper on sticker and gives an international almost nothing.
ok('private and public are recorded', Ro.ROSTER.filter(function (s) { return s.private === true; }).length > 250);
check('Ithaca is private', Ro.search('ithaca')[0].private, true);
check('Division I, one short of the directory because of Miami', Ro.counts().D1, 136);
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
const stdSource = require('fs').readFileSync(require('path').join(__dirname, 'public', 'standards.js'), 'utf8');
ok('and the reason is written down', /NO men\u2019s 800|NO men's 800/.test(stdSource));

// ---------- the photo library ----------
const Ph = require('./public/photos.js');

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
const SD = require('./public/swimmer.js');
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
const utilsSource = require('fs').readFileSync(require('path').join(__dirname, 'public', 'school-utils.js'), 'utf8');
ok('the public file carries no email address', !/@[a-z0-9.-]+\.(edu|com|org)/i.test(utilsSource));
ok('the public file names no school',
  !/\b(Gannon|Canisius|Bonaventure|Bucknell|Fairfield|Niagara|Marist|Ithaca|Clarkson|Hamilton|Iona|Loyola|Manhattan)\b/i.test(utilsSource));
ok('the public file carries no benchmark time', !/\d:\d\d\.\d\d/.test(utilsSource));
ok('the public file carries no priority', !/'P[123]'/.test(utilsSource));
ok('but it still exports the importer', typeof require('./public/school-utils.js').parsePaste === 'function');
ok('and the merge rules', typeof require('./public/school-utils.js').mergeSchools === 'function');

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
// Pitt-Johnstown is a brand new programme whose first season was 2025-26. It
// entered the conference meet and put nobody in any of his events, which is a
// fact about the roster rather than a gap in the research.
check('Pitt-Johnstown has no distance group yet', row('pittjohnstown').evidenceCount, 0);
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
check('five schools now disagree with the recorded call',
  rows.filter(function (r) { return r.disagrees; }).length, 5);

console.log((failed === 0 ? '  PASS' : '  FAIL') + '  board.test.js  ' + (passed + failed) + ' checks, ' + failed + ' failed');
process.exit(failed === 0 ? 0 : 1);
