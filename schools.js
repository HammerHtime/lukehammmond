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
,

  // ---------- Ontario, ie, U SPORTS. ----------
  //
  // These are the only schools on the board he can write to today. U SPORTS
  // Policy 40.10.7.4.2 puts no calendar, age or grade gate on contact, so the
  // NCAA's 15 June wall does not apply to any of them.
  //
  // They are also the only comparisons on this board made against times he has
  // actually swum. The OUA races SHORT COURSE METRES and so does he every
  // winter, so there is no conversion and no estimate on these rungs.
  //
  // One thing to know before reading the ladders: there is no men's 800 free in
  // the OUA. The 800 is a women's event. The 1500 stands in its place
  // throughout, which is what he swims anyway.
  // Contacts and times read 18 September 2026 from each school's own staff page
  // and from the 2026 OUA Championship results hosted by Toronto.
  {
    id: 'utoronto',
    coach: "Byron MacDonald", coachTitle: "Swimming - Head Coach",
    email: "byron.macdonald@utoronto.ca",
    staffUrl: "https://varsityblues.ca/sports/swimming/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Linda Kiefer", assistantEmail: "linda.kiefer@utoronto.ca",
    contactNote: "Four further assistants are named with no published address. The coaches page had not rolled over to 2026-27 when it was read. Search results are dominated by his CBC Olympic commentary rather than by a former coach.",
    name: 'University of Toronto', division: 'USPORTS', conference: 'OUA',
    state: 'ON', country: 'Canada', priority: '', confidence: 'High',
    note: "Won the 2026 OUA men's banner with 975 points, a 22nd straight provincial title. The strongest distance programme in the conference by a distance, and they entered no men in the 400 IM.",
    benchmarks: [
      { event: '400-free-SCM', times: ["3:49.88", "3:58.28", "3:58.60", "4:04.63"],
        basis: 'roster', context: "2026 OUA Championships, four men", sourceUrl: "https://sidearmstats.com/Toronto/swimming/260219F020.htm" },
      { event: '1500-free-SCM', times: ["15:26.45", "15:47.91", "16:25.70"],
        basis: 'roster', context: "2026 OUA Championships, three men, 1st, 3rd and 10th", sourceUrl: "https://sidearmstats.com/Toronto/swimming/260219F040.htm" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'western',
    coach: "Paul Midgley", coachTitle: "Head Coach, Swimming",
    email: "paul.midgley@uwo.ca",
    staffUrl: "https://westernmustangs.ca/sports/swimming/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "Head coach since 2002, eight-time OUA Coach of the Year. Andrew Midgley appears as a Western swimming coach on an archived page and is a different person who is not on the current staff.",
    name: 'Western University', division: 'USPORTS', conference: 'OUA',
    state: 'ON', country: 'Canada', priority: '', confidence: 'High',
    note: "Second at the 2026 OUA championships with 627 points. The best distance recruiting story in the conference, ie, rookie Riley Carswell took 1500 silver and was named OUA Male Rookie of the Year.",
    benchmarks: [
      { event: '400-free-SCM', times: ["3:51.43", "3:51.87", "3:58.75", "4:11.14"],
        basis: 'roster', context: "2026 OUA Championships, four men, 2nd and 3rd", sourceUrl: "https://sidearmstats.com/Toronto/swimming/260219F020.htm" },
      { event: '1500-free-SCM', times: ["15:44.90", "16:52.93"],
        basis: 'roster', context: "2026 OUA Championships, two men, Carswell 2nd", sourceUrl: "https://sidearmstats.com/Toronto/swimming/260219F040.htm" },
      { event: '400-im-SCM', times: ["4:22.70", "4:30.49", "4:32.77", "4:36.83"],
        basis: 'roster', context: "2026 OUA Championships, four men, Uy 2nd", sourceUrl: "https://sidearmstats.com/Toronto/swimming/260219F012.htm" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'mcmaster',
    coach: "Grey Fairley", coachTitle: "Swimming Head Coach",
    email: "fairleyg@mcmaster.ca",
    staffUrl: "https://marauders.ca/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "The address does not follow the usual pattern, ie, fairleyg not gfairley. Aggregators list a ghacswimming.ca address from his club role, do not use it. No assistant published.",
    name: 'McMaster University', division: 'USPORTS', conference: 'OUA',
    state: 'ON', country: 'Canada', priority: '', confidence: 'High',
    note: "Third at the 2026 OUA championships with 488 points, the best of the group behind Toronto and Western. Four men in the 1500 and four in the 400 free, ie, more distance depth than anyone outside the top two.",
    benchmarks: [
      { event: '400-free-SCM', times: ["3:58.63", "4:02.41", "4:05.59", "4:07.22"],
        basis: 'roster', context: "2026 OUA Championships, four men", sourceUrl: "https://sidearmstats.com/Toronto/swimming/260219F020.htm" },
      { event: '1500-free-SCM', times: ["16:02.71", "16:13.05", "16:39.33", "16:39.50"],
        basis: 'roster', context: "2026 OUA Championships, four men, all scoring", sourceUrl: "https://sidearmstats.com/Toronto/swimming/260219F040.htm" },
      { event: '400-im-SCM', times: ["4:27.84", "4:27.98"],
        basis: 'roster', context: "2026 OUA Championships, two men", sourceUrl: "https://sidearmstats.com/Toronto/swimming/260219F012.htm" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'waterloo',
    coach: "Jacqueline Beckford-Henriques", coachTitle: "Head Coach, Swimming",
    email: "jbeckfor@uwaterloo.ca",
    staffUrl: "https://athletics.uwaterloo.ca/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "The address is truncated, ie, jbeckfor not jbeckfordhenriques. Head coach since 2017, formerly head coach of Jamaica's national team across three Olympics. Often written up as Jacky Beckford-Henriques, same person.",
    name: 'University of Waterloo', division: 'USPORTS', conference: 'OUA',
    state: 'ON', country: 'Canada', priority: '', confidence: 'High',
    note: "Fourth at the 2026 OUA championships with 406 points. Four men in the 1500, ie, the strongest distance depth outside the top three.",
    benchmarks: [
      { event: '400-free-SCM', times: ["4:06.75", "4:17.42"],
        basis: 'roster', context: "2026 OUA Championships, two men", sourceUrl: "https://sidearmstats.com/Toronto/swimming/260219F020.htm" },
      { event: '1500-free-SCM', times: ["15:56.27", "16:28.05", "16:34.32", "17:44.33"],
        basis: 'roster', context: "2026 OUA Championships, four men, Boden 4th", sourceUrl: "https://sidearmstats.com/Toronto/swimming/260219F040.htm" },
      { event: '400-im-SCM', times: ["4:30.40", "4:43.32", "4:45.89"],
        basis: 'roster', context: "2026 OUA Championships, three men", sourceUrl: "https://sidearmstats.com/Toronto/swimming/260219F012.htm" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'laurier',
    coach: "Cathy Pardy", coachTitle: "Head Coach, Swimming",
    email: "swim@laurierathletics.com",
    staffUrl: "https://laurierathletics.com/sports/swimming/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Ron Forrest", assistantEmail: "",
    contactNote: "SHARED programme mailbox, not a personal address, so address her by name. She has no published personal address, and the wlu.ca pattern other Laurier staff use does not apply to her. Named 2026 OUA Men's Coach of the Year.",
    name: 'Wilfrid Laurier University', division: 'USPORTS', conference: 'OUA',
    state: 'ON', country: 'Canada', priority: '', confidence: 'High',
    note: "Fifth at the 2026 OUA championships with 376 points and rising. The best 400 IM programme in the conference, ie, George Radic won it and Owen Jibb took bronze, and four men in the 1500. For a distance freestyler who also swims the 400 IM this is the closest event fit on the whole board.",
    benchmarks: [
      { event: '400-free-SCM', times: ["4:01.77", "4:03.56", "4:11.70", "4:17.68"],
        basis: 'roster', context: "2026 OUA Championships, four men", sourceUrl: "https://sidearmstats.com/Toronto/swimming/260219F020.htm" },
      { event: '1500-free-SCM', times: ["15:56.96", "16:32.72", "16:38.08", "16:46.92"],
        basis: 'roster', context: "2026 OUA Championships, four men, Jibb 5th", sourceUrl: "https://sidearmstats.com/Toronto/swimming/260219F040.htm" },
      { event: '400-im-SCM', times: ["4:21.47", "4:23.17", "4:39.56"],
        basis: 'roster', context: "2026 OUA Championships, three men, Radic won it and Jibb was 3rd", sourceUrl: "https://sidearmstats.com/Toronto/swimming/260219F012.htm" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'brock',
    coach: "David Ling", coachTitle: "Head Coach, Men's & Women's Swimming",
    email: "dling@brocku.ca",
    staffUrl: "https://gobadgers.ca/sports/mens-swimming/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Gokhan Bozyigit", assistantEmail: "",
    contactNote: "Peter Bradstreet coached Brock for decades, retired in July 2022 and still ranks high in search including Brock's own retirement story. Ling was announced 27 June 2022. He is also written as Dave Ling, address him as David.",
    name: 'Brock University', division: 'USPORTS', conference: 'OUA',
    state: 'ON', country: 'Canada', priority: '', confidence: 'High',
    note: "Sixth at the 2026 OUA championships with 296 points. The men's strength is breaststroke. Jared Banta is the distance and IM anchor and the only Brock man scoring across all three of these events.",
    benchmarks: [
      { event: '400-free-SCM', times: ["4:01.81", "4:11.59"],
        basis: 'roster', context: "2026 OUA Championships, two men", sourceUrl: "https://sidearmstats.com/Toronto/swimming/260219F020.htm" },
      { event: '1500-free-SCM', times: ["16:02.20", "17:08.11"],
        basis: 'roster', context: "2026 OUA Championships, two men, Banta 6th", sourceUrl: "https://sidearmstats.com/Toronto/swimming/260219F040.htm" },
      { event: '400-im-SCM', times: ["4:34.92", "4:35.69", "4:39.65", "4:42.01"],
        basis: 'roster', context: "2026 OUA Championships, four men, all scoring", sourceUrl: "https://sidearmstats.com/Toronto/swimming/260219F012.htm" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'york',
    coach: "Brett D'Souza", coachTitle: "Head Coach",
    email: "brettd@yorku.ca",
    staffUrl: "https://reconline.yorkulions.ca/Program/GetProgramDetails?courseId=ca311ceb-9286-4cbc-a401-2c5ff72c40d3&semesterId=7de1c7dd-b9fb-4975-8160-99c99480cfe2",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "York swimming is NOT on the varsity athletics site and does not appear in York's staff directory at all. It runs as a sport club through York Recreation, and the registration portal above is the only place the coach's address is published. Anyone searching yorkulions.ca will conclude there is no programme. There is one.",
    name: 'York University', division: 'USPORTS', conference: 'OUA',
    state: 'ON', country: 'Canada', priority: '', confidence: 'High',
    note: "Seventh of ten with 260 points, but Eric Ginzburg was named 2026 OUA Men's Swimmer of the Year with four individual medals. A sprint-led programme with a very small distance group.",
    benchmarks: [
      { event: '400-free-SCM', times: ["4:01.76", "4:31.82"],
        basis: 'roster', context: "2026 OUA Championships, two men", sourceUrl: "https://sidearmstats.com/Toronto/swimming/260219F020.htm" },
      { event: '1500-free-SCM', times: ["16:04.31"],
        basis: 'roster', context: "2026 OUA Championships, one man, 8th", sourceUrl: "https://sidearmstats.com/Toronto/swimming/260219F040.htm" },
      { event: '400-im-SCM', times: ["4:25.83", "5:06.25"],
        basis: 'roster', context: "2026 OUA Championships, two men, Rasmussen 4th", sourceUrl: "https://sidearmstats.com/Toronto/swimming/260219F012.htm" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'guelph',
    coach: "Chantique Carey-Payne", coachTitle: "Head Coach - Swimming",
    email: "cpayne@uoguelph.ca",
    staffUrl: "https://gryphons.ca/sports/swimming/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "The address does not follow the name, ie, cpayne not ccareypayne. Head coach since June 2017, a Guelph alumna and the first Black woman in Canada named head coach of a university swim programme.",
    name: 'University of Guelph', division: 'USPORTS', conference: 'OUA',
    state: 'ON', country: 'Canada', priority: '', confidence: 'High',
    note: "Eighth of ten on the men's side with 147 points. No Guelph man reached a 400 free or 1500 final in 2026, so a distance freestyler would be the fastest in the programme on day one by a wide margin.",
    benchmarks: [
      { event: '400-free-SCM', times: ["4:14.86", "4:15.69", "4:16.58"],
        basis: 'roster', context: "2026 OUA Championships, three men, prelims, none advanced", sourceUrl: "https://sidearmstats.com/Toronto/swimming/260219F020.htm" },
      { event: '1500-free-SCM', times: ["16:56.63", "17:37.27"],
        basis: 'roster', context: "2026 OUA Championships, two men, 19th and 22nd", sourceUrl: "https://sidearmstats.com/Toronto/swimming/260219F040.htm" },
      { event: '400-im-SCM', times: ["4:32.05", "4:47.47"],
        basis: 'roster', context: "2026 OUA Championships, two men, Steele 6th", sourceUrl: "https://sidearmstats.com/Toronto/swimming/260219F012.htm" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'carleton',
    coach: "", coachTitle: "",
    email: "Lynn.Marshall@carleton.ca",
    staffUrl: "https://goravens.ca/clubteams/swimming",
    verified: false, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "NEEDS A HUMAN CHECK BEFORE SENDING. This address is the club contact and manager, Lynn Marshall, NOT the head coach, and it is the only address Carleton publishes. Swimming is a club sport, so there is no swimming coach anywhere in Carleton's athletics directory. The team-run site names Nico Belisle as head coach but it could not be opened, so that name is unconfirmed and is deliberately not recorded here. Use this address to ask to be put through to the coach.",
    name: 'Carleton University', division: 'USPORTS', conference: 'OUA',
    state: 'ON', country: 'Canada', priority: '', confidence: 'Medium',
    note: "Ninth of ten with 123 points. A small club programme in the OUA since 1985. Two men in the 400 free and none in the 1500 or 400 IM.",
    benchmarks: [
      { event: '400-free-SCM', times: ["4:24.29", "4:31.69"],
        basis: 'roster', context: "2026 OUA Championships, two men, prelims only", sourceUrl: "https://sidearmstats.com/Toronto/swimming/260219F020.htm" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'queens',
    coach: "Ken Anderson", coachTitle: "Head Coach, Swimming",
    email: "qswim@queensu.ca",
    staffUrl: "https://gogaelsgo.com/staff-directory/ken-anderson/158",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "SHARED programme mailbox, not a personal address, so address him by name. Listed under Varsity Club Coaches, ie, swimming is a varsity club at Queen's rather than a fully funded sport, which changes what he can offer. Do not confuse the mailbox with qsynchro@queensu.ca, which is artistic swimming.",
    name: "Queen's University", division: 'USPORTS', conference: 'OUA',
    state: 'ON', country: 'Canada', priority: '', confidence: 'High',
    note: "Tenth and last with 80 points, and effectively a sprint-only group. Queen's entered NO men in the 400 free, the 1500 free or the 400 IM at the 2026 OUA championships, so there is no distance training group here at all.",
    benchmarks: [],
    benchmarksCheckedOn: '2026-09-18',  }
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
