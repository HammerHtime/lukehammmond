// schools.js
// The school data. NOT PUBLIC.
//
// This file carries seventeen coach email addresses, the benchmarks gathered
// from conference results, and Luke's recorded priority for each programme.
// None of that belongs on the open web. netlify.toml returns 404 for it, and
// the only thing that reads it is netlify/functions/schools.js, which sits
// behind the admin key.
//
// The pure functions live in school-utils.js, which IS public, because the
// admin screen in the browser needs the importer and the merge rules. They are
// re-exported here so every existing caller keeps working unchanged.
//
// Two rules, and they are the reason this file is boring on purpose.
//
// 1. A school only appears here if it sponsors MEN'S swimming. Programmes are
//    cut and added every year. A school that dropped the sport is a wasted
//    email and a bad look.
// 2. A coach email is either verified against the school's own staff directory
//    on a recorded date, or it is empty. There is no third state. An invented
//    address bounces, or worse, reaches a stranger.
//
//    The seventeen addresses below were read off each school's own athletics
//    site on 18 September 2026, and every one carries the page it came from in
//    staffUrl. None was built from a naming pattern. Three are odd enough to be
//    worth NOT "correcting": Manhattan's begins with j while the coach is
//    displayed as Brian, American's ends in a single t, and RPI publishes only
//    a shared programme mailbox rather than any personal address.
//
//    Coaching staff turn over constantly. Five of these seventeen changed head
//    coach in the last eighteen months, and search engines still return the old
//    name for four of them. So re-check verifiedOn before a send rather than
//    trusting it forever.
//
// Anything with verified:false has NOT had its contact confirmed. The back end
// will not send to it. Fill it with the importer, from the school's own site.

const utils = require('./school-utils.js');
const AID = utils.AID;
const CONTACT_FIELDS = utils.CONTACT_FIELDS;
const aidFor = utils.aidFor;

const SCHOOLS = [
  // ---------- P1. His times already overlap these programmes. ----------
  {
    id: 'gannon',
    coach: "Milan Medo", coachTitle: "Head Swimming Coach",
    email: "medo001@gannon.edu",
    staffUrl: "https://gannonsports.com/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "Assistant: Bill Bradley, bradley069@gannon.edu. An older page naming Jacqueline Michalski as head coach is out of date.", name: 'Gannon University', division: 'D2', conference: 'Pennsylvania State Athletic',
    state: 'PA', country: 'USA', priority: 'P1', confidence: 'High',
    note: 'His 500 and mile equivalents are already slightly faster than the conference results found.',
    benchmarks: [
      { event: '500-free-SCY', time: '4:38.68', basis: 'qualifier', context: '2026 conference result' },
      { event: '1650-free-SCY', time: '16:29.04', basis: 'qualifier', context: '2026 conference result' }
    ]
  },
  {
    id: 'canisius',
    coach: "Scott Vanderzell", coachTitle: "Head Coach",
    email: "vanderzs@canisius.edu",
    staffUrl: "https://gogriffs.com/sports/swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "Assistant: Samantha Palma, palmas@canisius.edu. Combined men's and women's staff.", name: 'Canisius University', division: 'D1', conference: 'MAAC',
    state: 'NY', country: 'USA', priority: 'P1', confidence: 'High',
    note: 'Buffalo, ie, an easy drive from Toronto. His mile equivalent is well inside their MAAC result.',
    benchmarks: [
      { event: '1650-free-SCY', time: '17:06.24', basis: 'qualifier', context: 'MAAC 1650' }
    ]
  },
  {
    id: 'stbonaventure',
    coach: "Alec Kandt", coachTitle: "Head Men's and Women's Swimming and Diving Coach",
    email: "akandt@sbu.edu",
    staffUrl: "https://gobonnies.com/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "Assistant: Colby Clark, coclark@sbu.edu. Kandt is new. Older items naming Mike Smiechowski are out of date.", name: 'St. Bonaventure University', division: 'D1', conference: 'Atlantic 10',
    state: 'NY', country: 'USA', priority: 'P1', confidence: 'High',
    note: 'The most interesting comparison on the board. His 500 sits inside the times their swimmers were actually producing.',
    benchmarks: [
      { event: '500-free-SCY', times: ['4:28.10', '4:30.05', '4:35.22', '4:36.65', '4:42.27'],
        basis: 'roster', context: '2026 MAAC and A-10 calibre 500 performances' }
    ]
  },
  {
    id: 'saintpeters',
    coach: "McAllistar Milne", coachTitle: "Head Coach",
    email: "mmilne@saintpeters.edu",
    staffUrl: "https://saintpeterspeacocks.com/staff-directory/mcallistar-milne/2295",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "First year as head coach, 2026-27. The sport coaches page is stale and does not list him. No assistant emails published.", name: "Saint Peter's University", division: 'D1', conference: 'MAAC',
    state: 'NJ', country: 'USA', priority: 'P1', confidence: 'High',
    note: "One very strong distance swimmer and very little behind him. Nunez Barreras was MAAC 400 IM runner-up and 1650 bronze.",
    benchmarks: [
      { event: '500-free-SCY', times: ["4:32.25", "4:43.08"],
        basis: 'roster', context: "2026 MAAC, the only two men entered", sourceUrl: "https://swimmeetresults.tech/MAAC-2026/" },
      { event: '1650-free-SCY', times: ["15:51.06", "16:26.31"],
        basis: 'roster', context: "2026 MAAC, 3rd place and 17th", sourceUrl: "https://swimmeetresults.tech/MAAC-2026/" },
      { event: '400-im-SCY', times: ["3:53.31", "4:02.14"],
        basis: 'roster', context: "2026 MAAC, runner-up and 17th", sourceUrl: "https://swimmeetresults.tech/MAAC-2026/" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'manhattan',
    coach: "Brian Hansbury", coachTitle: "Head Coach, Swimming & Diving",
    email: "jhansbury01@manhattan.edu",
    staffUrl: "https://gojaspers.com/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "The address really does begin with j while the coach is displayed as Brian. Read twice on the page. Do not correct it to bhansbury.", name: 'Manhattan University', division: 'D1', conference: 'MAAC',
    state: 'NY', country: 'USA', priority: 'P1', confidence: 'High',
    note: "Thinnest programme of the six, 9th of 9 MAAC men's teams. Luke's times would make him the fastest man in every distance event immediately, and his mile would sit within a fraction of a second of an eight-year-old school record.",
    benchmarks: [
      { event: '500-free-SCY', times: ["5:06.98", "5:54.80"],
        basis: 'roster', context: "2026 MAAC, 39th and 40th of 40", sourceUrl: "https://swimmeetresults.tech/MAAC-2026/" },
      { event: '1650-free-SCY', times: ["17:19.96"],
        basis: 'roster', context: "2026 MAAC, 27th of 28, the only man entered", sourceUrl: "https://swimmeetresults.tech/MAAC-2026/" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'clarkson',
    coach: "Marc Danin", coachTitle: "Head Coach - Swimming & Diving",
    email: "mdanin@clarkson.edu",
    staffUrl: "https://clarksonathletics.com/sports/swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "Assistant: Finn Halstead, halstefw@clarkson.edu.", name: 'Clarkson University', division: 'D3', conference: 'Liberty League',
    state: 'NY', country: 'USA', priority: 'P1', confidence: 'High',
    note: "Fourth of nine Liberty League men's teams.",
    benchmarks: [
      { event: '500-free-SCY', times: ["4:40.43", "4:45.04", "5:03.42", "5:03.79", "5:13.41"],
        basis: 'roster', context: "2026 Liberty League, five men", sourceUrl: "https://athletics.ithaca.edu/sports/2026/1/29/2026-liberty-league-swimming-diving-championships-portal.aspx" },
      { event: '1650-free-SCY', times: ["16:48.39", "17:08.27", "17:49.52"],
        basis: 'roster', context: "2026 Liberty League, three men", sourceUrl: "https://athletics.ithaca.edu/sports/2026/1/29/2026-liberty-league-swimming-diving-championships-portal.aspx" },
      { event: '400-im-SCY', times: ["4:06.33", "4:20.50", "4:37.98", "4:50.44"],
        basis: 'roster', context: "2026 Liberty League, four men", sourceUrl: "https://athletics.ithaca.edu/sports/2026/1/29/2026-liberty-league-swimming-diving-championships-portal.aspx" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },

  // ---------- P2. Realistic if he keeps progressing. ----------
  {
    id: 'niagara',
    coach: "Matt Bosse", coachTitle: "Head Coach",
    email: "mbosse@niagara.edu",
    staffUrl: "https://purpleeagles.com/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "One-coach staff, no assistant listed. Second season, hired 2025.", name: 'Niagara University', division: 'D1', conference: 'MAAC',
    state: 'NY', country: 'USA', priority: 'P2', confidence: 'High',
    workingTarget: { '500-free-SCY': '4:32.00' },
    note: 'Very close to Toronto, so worth watching closely even while he is still improving. A 500 toward 4:32 makes the profile much more compelling here.',
    benchmarks: [
      { event: '500-free-SCY', time: '4:29.38', basis: 'qualifier', context: 'top 500 qualifier in the evidence found' }
    ]
  },
  {
    id: 'american',
    coach: "Garland Bartlett", coachTitle: "Head Coach",
    email: "gbartlet@american.edu",
    staffUrl: "https://aueagles.com/sports/swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Emmett Adams", assistantEmail: "emmett@american.edu",
    contactNote: "The address is gbartlet with a single t at the end, exactly as displayed. Matt McKenney left in April 2026, do not contact him here.", name: 'American University', division: 'D1', conference: 'Patriot League',
    state: 'DC', country: 'USA', priority: 'P2', confidence: 'High',
    note: 'An actual distance swimmer to compare against, and the 500 is only about four and a half seconds away.',
    benchmarks: [
      { event: '500-free-SCY', time: '4:32.57', basis: 'roster', context: 'a distance swimmer on the roster' },
      { event: '1650-free-SCY', time: '16:02.48', basis: 'roster', context: 'the same swimmer' },
      { event: '400-im-SCY', time: '3:59.25', basis: 'roster', context: 'the same swimmer' }
    ]
  },
  {
    id: 'rit',
    coach: "Phil Baretela", coachTitle: "Head Coach",
    email: "pjbatl@rit.edu",
    staffUrl: "https://ritathletics.com/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Daniel Dubois", assistantEmail: "dsdatl@rit.edu",
    contactNote: "RIT uses an initials-plus-atl convention. Only addresses actually seen are recorded.", name: 'Rochester Institute of Technology', division: 'D3', conference: 'Liberty League',
    state: 'NY', country: 'USA', priority: 'P2', confidence: 'High',
    workingTarget: { '1650-free-SCY': '16:00.00' },
    note: 'The benchmark is the conference winner, so being behind it is normal. A Grade 11 drop toward 16:00 changes the picture considerably.',
    benchmarks: [
      { event: '1650-free-SCY', time: '15:50.52', basis: 'champion', context: 'Liberty League 1650 winner' }
    ]
  },
  {
    id: 'ithaca',
    coach: "Mike Blakely-Armitage", coachTitle: "Head Swimming and Diving Coach",
    email: "marmitage@ithaca.edu",
    staffUrl: "https://athletics.ithaca.edu/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "Kevin Markwardt is the FORMER head coach and search engines still return him. Ithaca runs a recruit questionnaire form. Assistant Kyle Brown publishes no address but is likely the day to day recruiting contact, so ask for him by name.", name: 'Ithaca College', division: 'D3', conference: 'Liberty League',
    state: 'NY', country: 'USA', priority: 'P2', confidence: 'High',
    note: 'Meaningful gaps, but not ridiculous gaps for a Grade 10 swimmer. Both benchmarks are conference champions.',
    benchmarks: [
      { event: '500-free-SCY', time: '4:31.98', basis: 'champion', context: 'conference 500 champion' },
      { event: '400-im-SCY', time: '4:05.21', basis: 'champion', context: 'conference 400 IM champion' }
    ]
  },
  {
    id: 'rpi',
    coach: "Shannon O'Brien", coachTitle: "Head Coach",
    email: "swimdive@rpi.edu",
    staffUrl: "https://rpiathletics.com/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "SHARED programme mailbox, not a personal address. RPI publishes no individual coach emails at all. Address the email to Coach O'Brien by name.", name: 'Rensselaer Polytechnic Institute', division: 'D3', conference: 'Liberty League',
    state: 'NY', country: 'USA', priority: 'P2', confidence: 'High',
    note: "Third of nine Liberty League men's teams. Sam Ciegler carries the distance group.",
    benchmarks: [
      { event: '500-free-SCY', times: ["4:35.02", "4:44.64", "4:49.18", "4:50.43", "4:53.09"],
        basis: 'roster', context: "2026 Liberty League, five men", sourceUrl: "https://athletics.ithaca.edu/sports/2026/1/29/2026-liberty-league-swimming-diving-championships-portal.aspx" },
      { event: '1650-free-SCY', times: ["16:18.79", "16:45.39", "16:58.10"],
        basis: 'roster', context: "2026 Liberty League, three men", sourceUrl: "https://athletics.ithaca.edu/sports/2026/1/29/2026-liberty-league-swimming-diving-championships-portal.aspx" },
      { event: '400-im-SCY', times: ["4:06.55", "4:14.89", "4:15.11", "4:16.90", "4:25.28"],
        basis: 'roster', context: "2026 Liberty League, five men", sourceUrl: "https://athletics.ithaca.edu/sports/2026/1/29/2026-liberty-league-swimming-diving-championships-portal.aspx" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'marist',
    coach: "Billy Gordon", coachTitle: "Head Coach",
    email: "Billy.Gordon@marist.edu",
    staffUrl: "https://goredfoxes.com/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "Newly hired August 2026. Anthony Randall is the former head coach. The school now brands itself Marist University.", name: 'Marist College', division: 'D1', conference: 'MAAC',
    state: 'NY', country: 'USA', priority: 'P2', confidence: 'High',
    workingTarget: { '500-free-SCY': '4:32.00', '1650-free-SCY': '16:00.00' },
    note: 'Deliberately on the P2 and P3 boundary. The 500 gap is not enormous. The mile gap is much larger.',
    benchmarks: [
      { event: '500-free-SCY', time: '4:30.45', basis: 'qualifier', context: 'evidence found' },
      { event: '1650-free-SCY', time: '15:39.33', basis: 'qualifier', context: 'evidence found' }
    ]
  },

  // ---------- P3. Reach. Where the next level is. ----------
  {
    id: 'bucknell',
    coach: "Josh Huger", coachTitle: "Head Coach",
    email: "jh077@bucknell.edu",
    staffUrl: "https://bucknellbison.com/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Collin Hummel", assistantEmail: "cmh036@bucknell.edu",
    contactNote: "Hired July 2026 from Cal Berkeley, replacing Dan Schinnerer. Any list showing Schinnerer is stale.", name: 'Bucknell University', division: 'D1', conference: 'Patriot League',
    state: 'PA', country: 'USA', priority: 'P3', confidence: 'High',
    workingTarget: { '500-free-SCY': '4:28.00', '1650-free-SCY': '15:50.00' },
    note: 'Aggressive targets, but now we know what the target looks like rather than saying Bucknell is hard.',
    benchmarks: [
      { event: '500-free-SCY', time: '4:27.00', basis: 'roster', context: 'stronger distance swimmers, approximate' },
      { event: '1650-free-SCY', time: '15:46.00', basis: 'roster', context: 'stronger distance swimmers, slower end of 15:35 to 15:46' }
    ]
  },
  {
    id: 'fairfield',
    coach: "Jake Lichter", coachTitle: "Head Men's and Women's Swimming & Diving Coach",
    email: "jlichter@fairfield.edu",
    staffUrl: "https://fairfieldstags.com/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Emma Brown", assistantEmail: "ebrown3@fairfield.edu",
    contactNote: "Emma Brown is Associate Head Coach and the best second contact.", name: 'Fairfield University', division: 'D1', conference: 'MAAC',
    state: 'CT', country: 'USA', priority: 'P3', confidence: 'High', benchmarks: [
      { event: '500-free-SCY', times: ["4:26.25", "4:29.25", "4:33.53", "4:39.21"],
        basis: 'roster', context: "2026 MAAC, four men. Fairfield won the team title.", sourceUrl: "https://swimmeetresults.tech/MAAC-2026/" },
      { event: '1650-free-SCY', times: ["15:55.39", "16:21.49", "16:46.63"],
        basis: 'roster', context: "2026 MAAC, three men", sourceUrl: "https://swimmeetresults.tech/MAAC-2026/" },
      { event: '400-im-SCY', times: ["3:51.32", "3:57.99", "3:58.10", "4:01.61", "4:06.60", "4:08.02", "4:10.42"],
        basis: 'roster', context: "2026 MAAC, seven men. 3:51.32 won the conference.", sourceUrl: "https://swimmeetresults.tech/MAAC-2026/" }
    ],
    benchmarksCheckedOn: '2026-09-18',
    note: "Fairfield won the 2026 MAAC men's team title, their first. Deepest distance group on the board, so sitting inside their range says more here than it would elsewhere.",
  },
  {
    id: 'iona',
    coach: "Nick Cavataro", coachTitle: "Head Coach",
    email: "ncavataro@iona.edu",
    staffUrl: "https://ionagaels.com/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Mauro Pacsi", assistantEmail: "mpacsi@iona.edu",
    contactNote: "icgaels.com now redirects to ionagaels.com. Mauro Pacsi is Associate Head Coach and the best second contact.", name: 'Iona University', division: 'D1', conference: 'MAAC',
    state: 'NY', country: 'USA', priority: 'P3', confidence: 'High', benchmarks: [
      { event: '500-free-SCY', times: ["4:34.64", "4:36.59", "4:37.23", "4:48.18", "4:54.04"],
        basis: 'roster', context: "2026 MAAC, five men", sourceUrl: "https://swimmeetresults.tech/MAAC-2026/" },
      { event: '1650-free-SCY', times: ["16:09.73", "16:22.10", "17:11.07"],
        basis: 'roster', context: "2026 MAAC, three men", sourceUrl: "https://swimmeetresults.tech/MAAC-2026/" },
      { event: '400-im-SCY', times: ["4:05.84", "4:11.66"],
        basis: 'roster', context: "2026 MAAC, two men. 4:05.84 is the faster prelim swim.", sourceUrl: "https://swimmeetresults.tech/MAAC-2026/" }
    ],
    benchmarksCheckedOn: '2026-09-18',
    note: "Their 500 conference record holder, 4:19.62 in 2025, was no longer competing in 2026, ie, the distance group got softer.",
  },
  {
    id: 'loyolamd',
    coach: "Brian Loeffler", coachTitle: "Head Coach",
    email: "bloeffler@loyola.edu",
    staffUrl: "https://loyolagreyhounds.com/sports/swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Jay Venit", assistantEmail: "jvenit@loyola.edu",
    contactNote: "Jay Venit is the only person across all seventeen schools who actually carries the title Recruiting Coordinator. Write to him as well as to Loeffler.", name: 'Loyola University Maryland', division: 'D1', conference: 'Patriot League',
    state: 'MD', country: 'USA', priority: 'P3', confidence: 'Low', benchmarks: [],
    note: 'Same thinking as Bucknell. Swimmer times still to be gathered.'
  },
  {
    id: 'hamilton',
    coach: "John Geissinger", coachTitle: "Head Coach",
    email: "jgeissin@hamilton.edu",
    staffUrl: "https://athletics.hamilton.edu/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Ted Mebust", assistantEmail: "tmebust@hamilton.edu",
    contactNote: "", name: 'Hamilton College', division: 'D3', conference: 'NESCAC',
    state: 'NY', country: 'USA', priority: 'P3', confidence: 'Low', benchmarks: [],
    note: 'Same thinking as Bucknell. Swimmer times still to be gathered.'
  }
];
function seedSchools() {
  return SCHOOLS.map(function (s) {
    return Object.assign({}, CONTACT_FIELDS, s, {
      benchmarks: s.benchmarks || [],
      workingTarget: s.workingTarget || {},
      athleticAid: aidFor(s.division)
    });
  });
}

// A school is sendable only when someone confirmed the address against the
// school's own staff directory. This is the gate the send function checks.
const api = Object.assign({}, utils, {
  SCHOOLS: SCHOOLS,
  seedSchools: seedSchools
});

module.exports = api;
