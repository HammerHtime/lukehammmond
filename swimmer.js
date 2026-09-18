// swimmer.js
// Who the swimmer is, and every swim on record.
//
// This is the seed. Once the site is deployed, the back end writes results to
// storage and the live list wins. This file is what the page shows before any
// result has been entered, and it is the record of where the data came from.
//
// Times transcribed from SwimCloud swimmer 3306753 on 18 September 2026.
// Flags are SwimCloud's own letters, carried through, not interpreted.

// Wrapped in a function on purpose. The browser runs every script tag in ONE
// shared scope, so two files that both declare `const api` at the top level
// throw "Identifier 'api' has already been declared" and every script after
// the first one dies silently. Node gives each file its own scope, so the
// whole test suite passed while the live site was broken. browser.test.js now
// loads these the way a browser does, which is the only way to see it.
(function () {

const SWIMMER = {
  name: 'Luke Hammond',
  shortName: 'Luke',
  classOf: 2029,
  club: 'Mississauga Swim Club',
  clubShort: 'MSC',
  // Moved from Lakeshore Swim Club, September 2026. Worth knowing when reading
  // the results below: every swim on record was swum for Lakeshore. A club
  // change mid-development is completely ordinary and coaches read it without
  // comment, but the history and the badge do not match and that is why.
  formerClub: 'Lakeshore Swim Club',
  // Still overridable from the back end, which is where it should be set when
  // it next changes. Publishing the WRONG name is worse than publishing none,
  // because the one thing college coaches said they actually do is telephone
  // the club coach.
  coach: 'Aris Bousoulegkas',
  coachTitle: 'Head Coach, Mississauga Swim Club',
  city: 'Etobicoke',
  province: 'Ontario',
  country: 'Canada',
  swimcloud: 'https://www.swimcloud.com/swimmer/3306753/',

  // What a coach wants in the first ten seconds.
  headline: 'Distance freestyle. Class of 2029. Etobicoke, Ontario.',

  academics: {
    gpa: '3.5',
    gpaScale: '4.0',
    interests: ['History', 'Exercise Science and Kinesiology'],
    note: 'Intended field of study, not yet declared.'
  },

  // Anything a coach could not work out from a times sheet.
  about: [
    'Distance freestyler with Mississauga Swim Club, training under head coach ' +
    'Aris Bousoulegkas. Lives in Etobicoke, Ontario. Started racing in spring 2022.',
    'Selected to the Swim Canada National ID Development Program and the Swim ' +
    'Ontario Aerobic Development Program.',
    'Ranked inside the top five in Canada for age across four distance freestyle events.'
  ],

  interests: ['History', 'Kinesiology', 'Open water swimming', 'Strength training'],

  goals: [
    'Qualify for Canadian Junior Trials',
    'Earn national carding',
    'Represent Canada internationally',
    'Swim for an NCAA Division I or Division II programme'
  ],

  // The events he is actually recruited on. Stated, not inferred. A best-times
  // sheet has one row per event, so counting swims cannot tell you what he is.
  // National rankings are for age, as shown on the existing profile page,
  // recorded 18 September 2026. Confirm against Swimming Canada before quoting.
  primary: [
    { distance: 200, stroke: 'free', course: 'LCM', rank: 4, rankBasis: 'Canada, for age' },
    { distance: 400, stroke: 'free', course: 'LCM', rank: 2, rankBasis: 'Canada, for age' },
    { distance: 800, stroke: 'free', course: 'LCM', rank: 3, rankBasis: 'Canada, for age' },
    { distance: 1500, stroke: 'free', course: 'LCM', rank: 5, rankBasis: 'Canada, for age' }
  ],

  recognition: [
    { label: 'Swim Canada National ID Development Program', detail: 'Selected' },
    { label: 'Swim Ontario Aerobic Development Program', detail: 'Selected' }
  ],

  // Kept deliberately short. A recruiting page needs a way to reach the family
  // and the club coach. It does not need an address or a date of birth.
  contact: {
    email: '',
    coachEmail: '',
    note: 'Enquiries are welcome from college coaches at any time.'
  },

  video: []
};

// Every swim on record. distance, stroke, course, time, date, meet.
const SEED_RESULTS = [
  // Freestyle
  { distance: 50, stroke: 'free', course: 'SCM', time: '25.69', date: '2025-11-29', meet: 'ESwim Age Group Internationals' },
  { distance: 50, stroke: 'free', course: 'LCM', time: '26.43', date: '2026-05-29', meet: 'MAC Spring Invitational' },
  { distance: 100, stroke: 'free', course: 'SCM', time: '56.47', date: '2025-12-07', meet: 'Invitation Pointe-Claire Invitational' },
  { distance: 100, stroke: 'free', course: 'LCM', time: '55.88', date: '2026-05-31', meet: 'MAC Spring Invitational' },
  { distance: 200, stroke: 'free', course: 'SCM', time: '1:58.35', date: '2025-11-06', meet: 'Gus Ryder Memorial Cup 2025', flag: 'U' },
  { distance: 200, stroke: 'free', course: 'LCM', time: '1:59.75', date: '2026-07-09', meet: 'Ontario Swim Championships' },
  { distance: 400, stroke: 'free', course: 'SCM', time: '4:09.77', date: '2025-12-06', meet: 'Invitation Pointe-Claire Invitational' },
  { distance: 400, stroke: 'free', course: 'LCM', time: '4:10.86', date: '2026-05-29', meet: 'MAC Spring Invitational' },
  { distance: 800, stroke: 'free', course: 'SCM', time: '8:30.34', date: '2025-11-27', meet: 'ESwim Age Group Internationals' },
  { distance: 800, stroke: 'free', course: 'LCM', time: '8:43.49', date: '2026-03-05', meet: 'Ontario Age Groups (MPAC)' },
  { distance: 1500, stroke: 'free', course: 'SCM', time: '16:38.24', date: '2025-12-04', meet: 'Invitation Pointe-Claire Invitational' },
  { distance: 1500, stroke: 'free', course: 'LCM', time: '16:59.80', date: '2026-03-07', meet: 'Ontario Age Groups (MPAC)' },

  // Backstroke
  { distance: 50, stroke: 'back', course: 'SCM', time: '29.62', date: '2025-11-28', meet: 'ESwim Age Group Internationals' },
  { distance: 50, stroke: 'back', course: 'LCM', time: '30.37', date: '2026-05-30', meet: 'MAC Spring Invitational' },
  { distance: 100, stroke: 'back', course: 'SCM', time: '1:04.29', date: '2025-11-06', meet: 'Gus Ryder Memorial Cup 2025', flag: 'U' },
  { distance: 100, stroke: 'back', course: 'LCM', time: '1:04.17', date: '2026-07-11', meet: 'Ontario Swim Championships', flag: 'R' },
  { distance: 200, stroke: 'back', course: 'SCM', time: '2:12.79', date: '2025-12-06', meet: 'Invitation Pointe-Claire Invitational' },
  { distance: 200, stroke: 'back', course: 'LCM', time: '2:14.23', date: '2026-07-10', meet: 'Ontario Swim Championships' },

  // Breaststroke
  { distance: 50, stroke: 'breast', course: 'SCM', time: '38.71', date: '2025-10-18', meet: 'Hall of Fame', flag: 'X' },
  { distance: 50, stroke: 'breast', course: 'LCM', time: '38.69', date: '2025-04-26', meet: 'Marilyn Bell Swim Classic' },
  { distance: 100, stroke: 'breast', course: 'SCM', time: '1:18.81', date: '2025-10-18', meet: 'Hall of Fame' },
  { distance: 100, stroke: 'breast', course: 'LCM', time: '1:20.22', date: '2026-04-24', meet: 'Marilyn Bell Swim Classic' },
  { distance: 200, stroke: 'breast', course: 'SCM', time: '2:37.87', date: '2025-11-30', meet: 'ESwim Age Group Internationals' },
  { distance: 200, stroke: 'breast', course: 'LCM', time: '2:51.20', date: '2026-04-25', meet: 'Marilyn Bell Swim Classic' },

  // Butterfly
  { distance: 50, stroke: 'fly', course: 'SCM', time: '28.83', date: '2025-11-30', meet: 'ESwim Age Group Internationals' },
  { distance: 50, stroke: 'fly', course: 'LCM', time: '29.54', date: '2025-06-08', meet: 'Age Group International L' },
  { distance: 100, stroke: 'fly', course: 'SCM', time: '1:03.50', date: '2025-11-29', meet: 'ESwim Age Group Internationals' },
  { distance: 100, stroke: 'fly', course: 'LCM', time: '1:06.03', date: '2026-07-11', meet: 'Ontario Swim Championships', flag: 'X' },
  { distance: 200, stroke: 'fly', course: 'SCM', time: '2:23.57', date: '2025-11-28', meet: 'ESwim Age Group Internationals' },
  { distance: 200, stroke: 'fly', course: 'LCM', time: '2:25.93', date: '2026-05-31', meet: 'MAC Spring Invitational' },

  // Individual medley
  { distance: 100, stroke: 'im', course: 'SCM', time: '1:05.79', date: '2025-11-06', meet: 'Gus Ryder Memorial Cup 2025', flag: 'U' },
  { distance: 200, stroke: 'im', course: 'SCM', time: '2:14.64', date: '2025-11-28', meet: 'ESwim Age Group Internationals' },
  { distance: 200, stroke: 'im', course: 'LCM', time: '2:19.92', date: '2026-04-24', meet: 'Marilyn Bell Swim Classic' },
  { distance: 400, stroke: 'im', course: 'SCM', time: '4:54.66', date: '2025-11-29', meet: 'ESwim Age Group Internationals' },
  { distance: 400, stroke: 'im', course: 'LCM', time: '4:52.37', date: '2026-07-11', meet: 'Ontario Swim Championships' }
];

// Rankings change every time the national lists are republished, so they are
// the one part of the profile that must be editable without touching code.
//
// The rule that matters: once anything has been saved from the back end, the
// saved map is the whole truth. A cleared field means "no ranking", NOT "fall
// back to what was hardcoded". Otherwise clearing a stale #4 would silently
// restore it, which is the opposite of what clearing a field means.
//
// Before anything has ever been saved, the seed below is used, so the page is
// never blank on day one.
function seedRankings() {
  const out = {};
  (SWIMMER.primary || []).forEach(function (p) {
    if (!p.rank) return;
    out[p.distance + '-' + p.stroke + '-' + p.course] = { rank: p.rank, basis: p.rankBasis || '' };
  });
  return out;
}

function rankingsFrom(profile) {
  if (!profile || !profile.rankings || typeof profile.rankings !== 'object') return seedRankings();
  const out = {};
  Object.keys(profile.rankings).forEach(function (eventId) {
    const entry = profile.rankings[eventId];
    const rank = Number(entry && typeof entry === 'object' ? entry.rank : entry);
    // A blank, a zero, or anything unreadable means no ranking on this event,
    // and no badge on the page.
    if (!Number.isFinite(rank) || rank < 1) return;
    out[eventId] = {
      rank: Math.round(rank),
      basis: String((entry && entry.basis) || 'Canada, for age')
    };
  });
  return out;
}

function rankFor(rankings, eventId) {
  return (rankings && rankings[eventId]) || null;
}

const api = {
  SWIMMER: SWIMMER,
  SEED_RESULTS: SEED_RESULTS,
  seedRankings: seedRankings,
  rankingsFrom: rankingsFrom,
  rankFor: rankFor
};
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof window !== 'undefined') window.SwimmerData = api;

})();
