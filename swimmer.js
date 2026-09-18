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
  club: 'Mississauga Aquatic Club',
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
  coachTitle: 'Head Coach, Mississauga Aquatic Club',
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
    // What the email says. The full list reads "History and Exercise Science
    // and Kinesiology" once it is joined with "and", which is one "and" too
    // many for a sentence.
    interestsShort: 'history or exercise science',
    note: 'Intended field of study, not yet declared.'
  },

  // Anything a coach could not work out from a times sheet.
  about: [
    'Distance freestyler with Mississauga Aquatic Club, training under head coach ' +
    'Aris Bousoulegkas. Lives in Etobicoke, Ontario. Started racing in spring 2022.',
    'Selected to the Swim Canada National ID Development Program and the Swim ' +
    'Ontario Aerobic Development Program.',
    'Ranked inside the top five in Canada for age across four distance freestyle events.'
  ],

  // One line, in his voice, for the coach email. Written out rather than
  // assembled from fields, because a sentence assembled from fields reads like
  // one.
  training: 'I train six days a week, about fifteen hours in the water.',

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
    { label: 'Swim Ontario Aerobic Development Program', detail: 'Selected' },
    { label: 'Gold, 400 free', detail: '2026 Ontario Age Group Championships, Markham' },
    { label: 'Gold, 800 free', detail: '2025 Ontario Swimming Championships' }
  ],

  // The high school. Recorded because two separate pieces of research point at
  // it: every one of the 21 recruiting questionnaires asks for the school by
  // name, address and phone, and NCAA core credit depends on the SCHOOL holding
  // an Eligibility Center account with an approved course list. That check
  // belongs in Grade 10, ie, now.
  school: {
    name: 'Silverthorn Collegiate Institute',
    programme: 'High Performer Program',
    ncaaPortalChecked: false
  },

  // Written about by someone other than us. Coaches discount what a family
  // says about its own swimmer and do not discount a provincial body saying it.
  press: [
    {
      title: 'Next Wave: Up and Coming Swimmers',
      publisher: 'Swim Ontario',
      date: '2026-05-11',
      url: 'https://www.swimontario.com/news/next-wave-up-and-coming-swimmers-series-lukehammond/',
      // The piece predates the move to Mississauga and names Lakeshore. Said
      // here so the date does the explaining rather than a coach wondering
      // which club is right.
      note: 'Published while he was at Lakeshore Swim Club.'
    }
  ],

  // His own words, from that piece. The coach research was emphatic that what
  // they look for is agency and a want to get better, and that it is heard
  // rather than claimed. This is him saying it, quoted by a third party.
  quote: {
    text: 'To be honest, I really do think I can go faster.',
    source: 'Swim Ontario, May 2026'
  },

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
// Every season best on record, four seasons, with World Aquatics points.
//
// Transcribed from the season-by-season best times, 18 September 2026. The
// points column is the reason this is worth having twice over. A time only
// means something against its own event and course; points mean the same thing
// everywhere, so they compare a 400 free against a 400 IM and a metre pool
// against a yard one without a conversion factor anywhere in the sum.
//
// Relay lead-off splits are deliberately NOT here. The source lists them
// separately and gives them no points, and a lead-off in a bests table quietly
// flatters a swimmer. They are real swims and they belong on a results sheet,
// not in a personal best.
//
// Two swims from the earlier transcription are gone, ie, the 50 breast long
// course and the 100 fly long course, both flagged as exhibition swims at the
// source. An exhibition swim is not a best time.
const SEED_RESULTS = [
  // ---- 2026 season ----
  { distance: 50, stroke: 'free', course: 'LCM', time: '25.96', points: 522, date: '2026-06-20', meet: 'Central Region Div 1 LC', season: 2026 },
  { distance: 50, stroke: 'free', course: 'SCM', time: '25.06', points: 500, date: '2026-07-26', meet: 'Summer Sprint Invitational', season: 2026 },
  { distance: 100, stroke: 'free', course: 'LCM', time: '55.88', points: 572, date: '2026-05-31', meet: 'MAC Spring Invitational', season: 2026 },
  { distance: 100, stroke: 'free', course: 'SCM', time: '54.51', points: 556, date: '2026-01-18', meet: 'Joanne Malar Invitational', season: 2026 },
  { distance: 200, stroke: 'free', course: 'LCM', time: '1:59.75', points: 617, date: '2026-07-09', meet: 'Ontario Championships', season: 2026 },
  { distance: 200, stroke: 'free', course: 'SCM', time: '1:58.35', points: 578, date: '2025-11-08', meet: 'Gus Ryder Memorial Cup', season: 2026 },
  { distance: 400, stroke: 'free', course: 'LCM', time: '4:10.86', points: 674, date: '2026-05-29', meet: 'MAC Spring Invitational', season: 2026 },
  { distance: 400, stroke: 'free', course: 'SCM', time: '4:09.77', points: 613, date: '2025-12-06', meet: 'Invitation Pointe-Claire', season: 2026 },
  { distance: 800, stroke: 'free', course: 'LCM', time: '8:43.49', points: 644, date: '2026-03-05', meet: 'Ontario Age Groups, MPAC', season: 2026 },
  { distance: 800, stroke: 'free', course: 'SCM', time: '8:30.34', points: 642, date: '2025-11-27', meet: 'Age Group International SC', season: 2026 },
  { distance: 1500, stroke: 'free', course: 'LCM', time: '16:59.80', points: 622, date: '2026-03-07', meet: 'Ontario Age Groups, MPAC', season: 2026 },
  { distance: 1500, stroke: 'free', course: 'SCM', time: '16:38.24', points: 610, date: '2025-12-04', meet: 'Invitation Pointe-Claire', season: 2026 },
  { distance: 50, stroke: 'back', course: 'LCM', time: '30.37', points: 466, date: '2026-05-30', meet: 'MAC Spring Invitational', season: 2026 },
  { distance: 50, stroke: 'back', course: 'SCM', time: '28.97', points: 444, date: '2026-07-15', meet: 'Time Trials', season: 2026 },
  { distance: 100, stroke: 'back', course: 'LCM', time: '1:04.17', points: 519, date: '2026-07-11', meet: 'Ontario Championships', season: 2026 },
  { distance: 100, stroke: 'back', course: 'SCM', time: '1:00.57', points: 502, date: '2026-07-15', meet: 'Time Trials', season: 2026 },
  { distance: 200, stroke: 'back', course: 'LCM', time: '2:14.23', points: 579, date: '2026-07-10', meet: 'Ontario Championships', season: 2026 },
  { distance: 200, stroke: 'back', course: 'SCM', time: '2:12.79', points: 496, date: '2025-12-06', meet: 'Invitation Pointe-Claire', season: 2026 },
  { distance: 50, stroke: 'breast', course: 'SCM', time: '33.62', points: 408, date: '2026-07-25', meet: 'Summer Sprint Invitational', season: 2026 },
  { distance: 100, stroke: 'breast', course: 'LCM', time: '1:20.22', points: 356, date: '2026-04-24', meet: 'Marilyn Bell Swim Classic', season: 2026 },
  { distance: 100, stroke: 'breast', course: 'SCM', time: '1:13.30', points: 428, date: '2026-07-25', meet: 'Summer Sprint Invitational', season: 2026 },
  { distance: 200, stroke: 'breast', course: 'LCM', time: '2:51.20', points: 393, date: '2026-04-25', meet: 'Marilyn Bell Swim Classic', season: 2026 },
  { distance: 200, stroke: 'breast', course: 'SCM', time: '2:37.87', points: 433, date: '2025-11-30', meet: 'Age Group International SC', season: 2026 },
  { distance: 50, stroke: 'fly', course: 'LCM', time: '28.57', points: 473, date: '2026-06-19', meet: 'Central Region Div 1 LC', season: 2026 },
  { distance: 50, stroke: 'fly', course: 'SCM', time: '28.83', points: 404, date: '2025-11-30', meet: 'Age Group International SC', season: 2026 },
  { distance: 100, stroke: 'fly', course: 'SCM', time: '1:02.46', points: 444, date: '2026-01-17', meet: 'Joanne Malar Invitational', season: 2026 },
  { distance: 200, stroke: 'fly', course: 'LCM', time: '2:25.93', points: 432, date: '2026-05-31', meet: 'MAC Spring Invitational', season: 2026 },
  { distance: 200, stroke: 'fly', course: 'SCM', time: '2:23.57', points: 412, date: '2025-11-28', meet: 'Age Group International SC', season: 2026 },
  { distance: 100, stroke: 'im', course: 'SCM', time: '1:05.79', points: 420, date: '2025-11-08', meet: 'Gus Ryder Memorial Cup', season: 2026 },
  { distance: 200, stroke: 'im', course: 'LCM', time: '2:19.92', points: 522, date: '2026-04-24', meet: 'Marilyn Bell Swim Classic', season: 2026 },
  { distance: 200, stroke: 'im', course: 'SCM', time: '2:14.64', points: 528, date: '2025-11-28', meet: 'Age Group International SC', season: 2026 },
  { distance: 400, stroke: 'im', course: 'LCM', time: '4:52.37', points: 570, date: '2026-07-11', meet: 'Ontario Championships', season: 2026 },
  { distance: 400, stroke: 'im', course: 'SCM', time: '4:41.07', points: 583, date: '2026-07-15', meet: 'Time Trials', season: 2026 },

  // ---- 2025 season ----
  { distance: 50, stroke: 'free', course: 'LCM', time: '26.72', points: 479, date: '2025-07-25', meet: 'MAC Summer Invitational', season: 2025 },
  { distance: 50, stroke: 'free', course: 'SCM', time: '27.40', points: 383, date: '2025-02-08', meet: 'Central Region Division 1', season: 2025 },
  { distance: 100, stroke: 'free', course: 'LCM', time: '57.71', points: 519, date: '2025-07-10', meet: 'Ontario Swimming Championships', season: 2025 },
  { distance: 100, stroke: 'free', course: 'SCM', time: '59.53', points: 427, date: '2025-01-11', meet: 'New Years Cup', season: 2025 },
  { distance: 200, stroke: 'free', course: 'LCM', time: '2:02.50', points: 577, date: '2025-07-26', meet: 'MAC Summer Invitational', season: 2025 },
  { distance: 200, stroke: 'free', course: 'SCM', time: '2:07.36', points: 464, date: '2025-01-12', meet: 'New Years Cup', season: 2025 },
  { distance: 400, stroke: 'free', course: 'LCM', time: '4:18.07', points: 619, date: '2025-07-12', meet: 'Ontario Swimming Championships', season: 2025 },
  { distance: 400, stroke: 'free', course: 'SCM', time: '4:36.76', points: 451, date: '2025-01-10', meet: 'New Years Cup', season: 2025 },
  { distance: 800, stroke: 'free', course: 'LCM', time: '8:55.00', points: 603, date: '2025-07-24', meet: 'MAC Summer Invitational', season: 2025 },
  { distance: 800, stroke: 'free', course: 'SCM', time: '9:14.65', points: 500, date: '2025-01-10', meet: 'New Years Cup', season: 2025 },
  { distance: 1500, stroke: 'free', course: 'LCM', time: '17:20.99', points: 585, date: '2025-07-13', meet: 'Ontario Swimming Championships', season: 2025 },
  { distance: 1500, stroke: 'free', course: 'SCM', time: '18:14.35', points: 463, date: '2024-11-15', meet: 'Gus Ryder Memorial Cup', season: 2025 },
  { distance: 50, stroke: 'back', course: 'LCM', time: '31.95', points: 400, date: '2025-05-17', meet: 'MAC Spring Invitational', season: 2025 },
  { distance: 50, stroke: 'back', course: 'SCM', time: '32.21', points: 323, date: '2025-01-10', meet: 'New Years Cup', season: 2025 },
  { distance: 100, stroke: 'back', course: 'LCM', time: '1:09.00', points: 418, date: '2025-05-16', meet: 'MAC Spring Invitational', season: 2025 },
  { distance: 100, stroke: 'back', course: 'SCM', time: '1:07.99', points: 355, date: '2025-01-12', meet: 'New Years Cup', season: 2025 },
  { distance: 200, stroke: 'back', course: 'LCM', time: '2:17.27', points: 541, date: '2025-07-27', meet: 'MAC Summer Invitational', season: 2025 },
  { distance: 200, stroke: 'back', course: 'SCM', time: '2:29.05', points: 350, date: '2024-11-09', meet: 'Age Group International', season: 2025 },
  { distance: 50, stroke: 'breast', course: 'LCM', time: '38.69', points: 301, date: '2025-04-26', meet: 'Marilyn Bell Swim Classic', season: 2025 },
  { distance: 50, stroke: 'breast', course: 'SCM', time: '38.99', points: 262, date: '2024-10-20', meet: 'Hall of Fame Meet', season: 2025 },
  { distance: 100, stroke: 'breast', course: 'LCM', time: '1:23.52', points: 315, date: '2025-05-17', meet: 'MAC Spring Invitational', season: 2025 },
  { distance: 100, stroke: 'breast', course: 'SCM', time: '1:22.89', points: 296, date: '2024-11-16', meet: 'Gus Ryder Memorial Cup', season: 2025 },
  { distance: 200, stroke: 'breast', course: 'LCM', time: '2:57.72', points: 351, date: '2025-04-26', meet: 'Marilyn Bell Swim Classic', season: 2025 },
  { distance: 200, stroke: 'breast', course: 'SCM', time: '2:52.80', points: 330, date: '2025-02-08', meet: 'Central Region Division 1', season: 2025 },
  { distance: 50, stroke: 'fly', course: 'LCM', time: '29.54', points: 428, date: '2025-06-08', meet: 'Age Group International LC', season: 2025 },
  { distance: 50, stroke: 'fly', course: 'SCM', time: '33.40', points: 260, date: '2024-10-20', meet: 'Hall of Fame Meet', season: 2025 },
  { distance: 100, stroke: 'fly', course: 'LCM', time: '1:10.18', points: 349, date: '2025-04-27', meet: 'Marilyn Bell Swim Classic', season: 2025 },
  { distance: 100, stroke: 'fly', course: 'SCM', time: '1:13.20', points: 276, date: '2025-02-09', meet: 'Central Region Division 1', season: 2025 },
  { distance: 200, stroke: 'fly', course: 'LCM', time: '2:39.98', points: 328, date: '2025-04-25', meet: 'Marilyn Bell Swim Classic', season: 2025 },
  { distance: 200, stroke: 'fly', course: 'SCM', time: '2:45.37', points: 269, date: '2025-01-10', meet: 'New Years Cup', season: 2025 },
  { distance: 200, stroke: 'im', course: 'LCM', time: '2:24.61', points: 473, date: '2025-06-06', meet: 'Age Group International LC', season: 2025 },
  { distance: 200, stroke: 'im', course: 'SCM', time: '2:25.38', points: 420, date: '2025-02-07', meet: 'Central Region Division 1', season: 2025 },
  { distance: 400, stroke: 'im', course: 'LCM', time: '5:04.07', points: 507, date: '2025-07-26', meet: 'MAC Summer Invitational', season: 2025 },
  { distance: 400, stroke: 'im', course: 'SCM', time: '5:09.98', points: 434, date: '2025-01-11', meet: 'New Years Cup', season: 2025 },

  // ---- 2024 season ----
  { distance: 50, stroke: 'free', course: 'LCM', time: '28.93', points: 377, date: '2024-05-25', meet: 'Central Region B LC', season: 2024 },
  { distance: 50, stroke: 'free', course: 'SCM', time: '29.11', points: 319, date: '2024-02-03', meet: 'Central Region B SC', season: 2024 },
  { distance: 100, stroke: 'free', course: 'LCM', time: '1:02.84', points: 402, date: '2024-05-11', meet: 'MAC Spring Long Course', season: 2024 },
  { distance: 100, stroke: 'free', course: 'SCM', time: '1:04.24', points: 340, date: '2024-02-18', meet: 'Winter Ontario Festival', season: 2024 },
  { distance: 200, stroke: 'free', course: 'LCM', time: '2:17.80', points: 405, date: '2024-05-31', meet: 'Age Group International LC', season: 2024 },
  { distance: 200, stroke: 'free', course: 'SCM', time: '2:21.20', points: 340, date: '2024-03-09', meet: 'Pentathlon Plus', season: 2024 },
  { distance: 400, stroke: 'free', course: 'LCM', time: '4:54.65', points: 416, date: '2024-04-26', meet: 'Marilyn Bell Swim Classic', season: 2024 },
  { distance: 400, stroke: 'free', course: 'SCM', time: '5:02.87', points: 344, date: '2024-02-18', meet: 'Winter Ontario Festival', season: 2024 },
  { distance: 800, stroke: 'free', course: 'LCM', time: '10:00.94', points: 425, date: '2024-05-09', meet: 'MAC Spring Long Course', season: 2024 },
  { distance: 800, stroke: 'free', course: 'SCM', time: '10:32.16', points: 338, date: '2024-02-17', meet: 'Winter Ontario Festival', season: 2024 },
  { distance: 1500, stroke: 'free', course: 'LCM', time: '19:48.92', points: 392, date: '2024-04-25', meet: 'Marilyn Bell Swim Classic', season: 2024 },
  { distance: 1500, stroke: 'free', course: 'SCM', time: '20:00.82', points: 350, date: '2024-01-12', meet: 'A/B Meet', season: 2024 },
  { distance: 50, stroke: 'back', course: 'LCM', time: '36.06', points: 278, date: '2024-06-22', meet: 'BAD Outdoor LC Invitational', season: 2024 },
  { distance: 50, stroke: 'back', course: 'SCM', time: '35.26', points: 246, date: '2024-01-14', meet: 'A/B Meet', season: 2024 },
  { distance: 100, stroke: 'back', course: 'LCM', time: '1:12.73', points: 357, date: '2024-06-02', meet: 'Age Group International LC', season: 2024 },
  { distance: 100, stroke: 'back', course: 'SCM', time: '1:11.81', points: 301, date: '2024-02-17', meet: 'Winter Ontario Festival', season: 2024 },
  { distance: 200, stroke: 'back', course: 'LCM', time: '2:36.69', points: 364, date: '2024-04-28', meet: 'Marilyn Bell Swim Classic', season: 2024 },
  { distance: 200, stroke: 'back', course: 'SCM', time: '2:42.25', points: 271, date: '2023-11-11', meet: 'Age Group International SC', season: 2024 },
  { distance: 50, stroke: 'breast', course: 'LCM', time: '41.20', points: 249, date: '2024-04-28', meet: 'Marilyn Bell Swim Classic', season: 2024 },
  { distance: 50, stroke: 'breast', course: 'SCM', time: '45.18', points: 168, date: '2023-10-15', meet: 'Hall of Fame', season: 2024 },
  { distance: 100, stroke: 'breast', course: 'LCM', time: '1:27.09', points: 278, date: '2024-05-25', meet: 'Central Region B LC', season: 2024 },
  { distance: 100, stroke: 'breast', course: 'SCM', time: '1:30.67', points: 226, date: '2024-03-09', meet: 'Pentathlon Plus', season: 2024 },
  { distance: 200, stroke: 'breast', course: 'LCM', time: '3:16.85', points: 259, date: '2024-04-27', meet: 'Marilyn Bell Swim Classic', season: 2024 },
  { distance: 50, stroke: 'fly', course: 'LCM', time: '34.14', points: 277, date: '2024-04-27', meet: 'Marilyn Bell Swim Classic', season: 2024 },
  { distance: 50, stroke: 'fly', course: 'SCM', time: '38.35', points: 171, date: '2024-01-13', meet: 'A/B Meet', season: 2024 },
  { distance: 100, stroke: 'fly', course: 'LCM', time: '1:19.94', points: 236, date: '2024-05-26', meet: 'Central Region B LC', season: 2024 },
  { distance: 100, stroke: 'fly', course: 'SCM', time: '1:26.20', points: 169, date: '2024-03-09', meet: 'Pentathlon Plus', season: 2024 },
  { distance: 200, stroke: 'fly', course: 'LCM', time: '3:16.17', points: 177, date: '2024-04-26', meet: 'Marilyn Bell Swim Classic', season: 2024 },
  { distance: 200, stroke: 'fly', course: 'SCM', time: '3:12.96', points: 169, date: '2024-02-03', meet: 'Central Region B SC', season: 2024 },
  { distance: 200, stroke: 'im', course: 'LCM', time: '2:39.37', points: 353, date: '2024-05-10', meet: 'MAC Spring Long Course', season: 2024 },
  { distance: 200, stroke: 'im', course: 'SCM', time: '2:48.75', points: 268, date: '2024-01-13', meet: 'A/B Meet', season: 2024 },
  { distance: 400, stroke: 'im', course: 'LCM', time: '5:51.27', points: 329, date: '2024-05-09', meet: 'MAC Spring Long Course', season: 2024 },
  { distance: 400, stroke: 'im', course: 'SCM', time: '6:01.58', points: 273, date: '2023-11-11', meet: 'Age Group International SC', season: 2024 },

  // ---- 2023 season ----
  { distance: 50, stroke: 'free', course: 'LCM', time: '32.75', points: 260, date: '2023-06-03', meet: 'Age Group International LC', season: 2023 },
  { distance: 50, stroke: 'free', course: 'SCM', time: '33.92', points: 201, date: '2023-02-05', meet: 'Central Region B SC Champs', season: 2023 },
  { distance: 100, stroke: 'free', course: 'LCM', time: '1:10.11', points: 289, date: '2023-06-18', meet: 'Summer Ontario Festival', season: 2023 },
  { distance: 100, stroke: 'free', course: 'SCM', time: '1:13.12', points: 230, date: '2023-02-19', meet: 'Winter Ontario Festival', season: 2023 },
  { distance: 200, stroke: 'free', course: 'LCM', time: '2:33.23', points: 294, date: '2023-06-16', meet: 'Summer Ontario Festival', season: 2023 },
  { distance: 200, stroke: 'free', course: 'SCM', time: '2:36.76', points: 248, date: '2023-02-18', meet: 'Winter Ontario Festival', season: 2023 },
  { distance: 400, stroke: 'free', course: 'LCM', time: '5:20.53', points: 323, date: '2023-06-17', meet: 'Summer Ontario Festival', season: 2023 },
  { distance: 400, stroke: 'free', course: 'SCM', time: '5:29.10', points: 268, date: '2023-03-04', meet: 'Trojan Pentathlon', season: 2023 },
  { distance: 800, stroke: 'free', course: 'LCM', time: '10:57.43', points: 325, date: '2023-06-18', meet: 'Summer Ontario Festival', season: 2023 },
  { distance: 800, stroke: 'free', course: 'SCM', time: '10:59.93', points: 297, date: '2023-03-04', meet: 'Trojan Pentathlon', season: 2023 },
  { distance: 1500, stroke: 'free', course: 'SCM', time: '22:55.04', points: 233, date: '2023-01-13', meet: 'ESWIM A/B Meet', season: 2023 },
  { distance: 50, stroke: 'back', course: 'LCM', time: '37.95', points: 238, date: '2023-05-06', meet: 'MAC Spring Long Course', season: 2023 },
  { distance: 50, stroke: 'back', course: 'SCM', time: '39.16', points: 179, date: '2023-03-05', meet: 'Trojan Pentathlon', season: 2023 },
  { distance: 100, stroke: 'back', course: 'LCM', time: '1:20.54', points: 262, date: '2023-06-17', meet: 'Summer Ontario Festival', season: 2023 },
  { distance: 100, stroke: 'back', course: 'SCM', time: '1:22.00', points: 202, date: '2023-02-18', meet: 'Winter Ontario Festival', season: 2023 },
  { distance: 200, stroke: 'back', course: 'LCM', time: '2:50.90', points: 280, date: '2023-06-18', meet: 'Summer Ontario Festival', season: 2023 },
  { distance: 200, stroke: 'back', course: 'SCM', time: '2:52.04', points: 228, date: '2023-03-05', meet: 'Trojan Pentathlon', season: 2023 },
  { distance: 50, stroke: 'breast', course: 'SCM', time: '47.67', points: 143, date: '2023-03-05', meet: 'Trojan Pentathlon', season: 2023 },
  { distance: 100, stroke: 'breast', course: 'LCM', time: '1:41.51', points: 175, date: '2023-05-27', meet: 'Central Region LC B Championships', season: 2023 },
  { distance: 100, stroke: 'breast', course: 'SCM', time: '1:42.54', points: 156, date: '2023-03-04', meet: 'Trojan Pentathlon', season: 2023 },
  { distance: 200, stroke: 'breast', course: 'LCM', time: '3:42.17', points: 180, date: '2023-05-26', meet: 'Central Region LC B Championships', season: 2023 },
  { distance: 200, stroke: 'breast', course: 'SCM', time: '3:42.06', points: 155, date: '2023-02-04', meet: 'Central Region B SC Champs', season: 2023 },
  { distance: 50, stroke: 'fly', course: 'SCM', time: '43.02', points: 121, date: '2023-03-05', meet: 'Trojan Pentathlon', season: 2023 },
  { distance: 100, stroke: 'fly', course: 'LCM', time: '1:37.15', points: 131, date: '2023-06-03', meet: 'Age Group International LC', season: 2023 },
  { distance: 100, stroke: 'fly', course: 'SCM', time: '1:44.32', points: 95, date: '2023-03-04', meet: 'Trojan Pentathlon', season: 2023 },
  { distance: 100, stroke: 'im', course: 'SCM', time: '1:26.97', points: 181, date: '2023-03-05', meet: 'Trojan Pentathlon', season: 2023 },
  { distance: 200, stroke: 'im', course: 'LCM', time: '2:59.86', points: 245, date: '2023-05-26', meet: 'Central Region LC B Championships', season: 2023 },
  { distance: 200, stroke: 'im', course: 'SCM', time: '3:04.96', points: 203, date: '2023-03-04', meet: 'Trojan Pentathlon', season: 2023 },
  { distance: 400, stroke: 'im', course: 'LCM', time: '6:43.41', points: 217, date: '2023-04-29', meet: 'Marilyn Bell Swim Classic', season: 2023 }
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
