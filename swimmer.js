// swimmer.js
// Who the swimmer is, and every swim on record.
//
// This is the seed. Once the site is deployed, the back end writes results to
// storage and the live list wins. This file is what the page shows before any
// result has been entered, and it is the record of where the data came from.
//
// Times transcribed from SwimCloud swimmer 3306753 on 18 September 2026.
// Flags are SwimCloud's own letters, carried through, not interpreted.

const SWIMMER = {
  name: 'Luke Hammond',
  shortName: 'Luke',
  classOf: 2029,
  club: 'Lakeshore Swim Club',
  clubShort: 'LSC',
  coach: 'Tristan Vowles',
  coachTitle: 'Head Coach, Lakeshore Swim Club',
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
    'Distance freestyler out of Lakeshore Swim Club in Etobicoke, Ontario. Trains ' +
    'under head coach Tristan Vowles.',
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

const api = { SWIMMER: SWIMMER, SEED_RESULTS: SEED_RESULTS };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof window !== 'undefined') window.SwimmerData = api;
