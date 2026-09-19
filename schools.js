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

const utils = require('./public/school-utils.js');
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
      { event: '500-free-SCY', times: ["4:38.16", "4:46.01", "4:52.00", "4:52.78"],
        basis: 'roster', context: "2026 PSAC, four men", sourceUrl: "https://calvulcans.com/documents/2026/2/21/swim26psac_full.pdf" },
      { event: '1650-free-SCY', times: ["16:29.04", "16:44.11", "16:58.75", "17:19.86"],
        basis: 'roster', context: "2026 PSAC, four men", sourceUrl: "https://calvulcans.com/documents/2026/2/21/swim26psac_full.pdf" },
      { event: '400-im-SCY', times: ["4:05.41", "4:08.74", "4:20.38"],
        basis: 'roster', context: "2026 PSAC, three men", sourceUrl: "https://calvulcans.com/documents/2026/2/21/swim26psac_full.pdf" }
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
      { event: '500-free-SCY', times: ["4:28.10", "4:30.05", "4:32.96", "4:33.04", "4:35.38", "4:42.27"],
        basis: 'roster', context: "2026 Atlantic 10, six men, best of prelims and finals", sourceUrl: "https://swimmeetresults.tech/Atlantic-10-2026/260218P007.htm" },
      { event: '1650-free-SCY', times: ["15:28.65", "15:45.25", "15:52.04", "16:09.68"],
        basis: 'roster', context: "2026 Atlantic 10, four men", sourceUrl: "https://swimmeetresults.tech/Atlantic-10-2026/260218F029.htm" },
      { event: '400-im-SCY', times: ["3:53.04", "3:55.93", "4:04.88", "4:05.32"],
        basis: 'roster', context: "2026 Atlantic 10, four men", sourceUrl: "https://swimmeetresults.tech/Atlantic-10-2026/260218P018.htm" }
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
      { event: '500-free-SCY', times: ["4:32.75", "4:38.74"],
        basis: 'roster', context: "2026 Patriot League, two men", sourceUrl: "https://sidearmstats.com/navy/cswim/260218P007.htm" },
      { event: '1650-free-SCY', times: ["16:02.48"],
        basis: 'roster', context: "2026 Patriot League, one man", sourceUrl: "https://sidearmstats.com/navy/cswim/260218F029.htm" },
      { event: '400-im-SCY', times: ["3:59.25"],
        basis: 'roster', context: "2026 Patriot League, one man", sourceUrl: "https://sidearmstats.com/navy/cswim/260218F018.htm" }
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
      { event: '500-free-SCY', times: ["4:28.92", "4:29.99", "4:30.64", "4:35.74", "4:36.08"],
        basis: 'roster', context: "2026 Patriot League, five men", sourceUrl: "https://sidearmstats.com/navy/cswim/260218F007.htm" },
      { event: '1650-free-SCY', times: ["15:32.56", "15:43.34", "16:12.07"],
        basis: 'roster', context: "2026 Patriot League, three men", sourceUrl: "https://sidearmstats.com/navy/cswim/260218F029.htm" },
      { event: '400-im-SCY', times: ["3:52.49", "3:55.99", "3:57.92", "3:59.98", "4:00.07"],
        basis: 'roster', context: "2026 Patriot League, five men", sourceUrl: "https://sidearmstats.com/navy/cswim/260218F018.htm" }
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
    state: 'MD', country: 'USA', priority: 'P3', confidence: 'Low', benchmarks: [
      { event: '500-free-SCY', times: ["4:27.46", "4:27.78", "4:33.28"],
        basis: 'roster', context: "2026 Patriot League, three men", sourceUrl: "https://sidearmstats.com/navy/cswim/260218F007.htm" },
      { event: '1650-free-SCY', times: ["15:33.73", "15:41.33"],
        basis: 'roster', context: "2026 Patriot League, two men", sourceUrl: "https://sidearmstats.com/navy/cswim/260218F029.htm" },
      { event: '400-im-SCY', times: ["3:54.95", "3:56.79", "3:56.93", "3:58.43"],
        basis: 'roster', context: "2026 Patriot League, four men", sourceUrl: "https://sidearmstats.com/navy/cswim/260218F018.htm" }
    ],
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
,

  // ---------- The rest of Canada, ie, RSEQ, Canada West and the AUS. ----------
  //
  // Same rule as Ontario: these compare against times he has actually swum,
  // because U SPORTS races short course metres and so does he.
  //
  // Three things to know before reading these cards.
  //
  // Canada West races its championship in NOVEMBER, so the 2025-26 conference
  // meet was 28 to 30 November 2025 at Lethbridge. That is the current one, not
  // an old one.
  //
  // The AUS published NO results at all for its 2026 championship, only day
  // recaps naming winners. So Dalhousie and UNB carry only national-meet times
  // and Mount Allison and Memorial carry none. That is a missing source, not a
  // missing programme.
  //
  // An empty benchmark array where a school simply entered nobody is recorded
  // deliberately. Lethbridge and Manitoba both have men's teams and neither put
  // a man in the 400 free, the 1500 or the 400 IM. That is a fact about the
  // programme and the card should say it.
  {
    id: 'ubc',
    coach: "Derrick Schoof", coachTitle: "Head Coach, Swimming",
    email: "derrick.schoof@ubc.ca",
    staffUrl: "https://gothunderbirds.ca/sports/swimming-and-diving/roster/coaches/derrick-schoof/4719",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Sarah Rudolf", assistantEmail: "sarah.rudolf@ubc.ca",
    contactNote: "The address is only on his individual bio page, not in the staff directory.",
    name: 'University of British Columbia', division: 'USPORTS', conference: 'Canada West',
    state: 'BC', country: 'Canada', priority: '', confidence: 'High',
    note: "The national power and it is not close. UBC won all four U SPORTS and Canada West banners in 2025-26 and swept the 400 free, 1500 free and 400 IM national titles. Read every time here as national-final standard.",
    benchmarks: [
      { event: '400-free-SCM', times: ["3:44.87", "3:45.52", "3:46.36", "3:47.98", "3:58.45"],
        basis: 'roster', context: "2026 U SPORTS, five men", sourceUrl: "https://results.swimming.ca/2026_USPORTS/" },
      { event: '1500-free-SCM', times: ["14:53.64", "14:55.39", "15:24.01", "15:32.64"],
        basis: 'roster', context: "2026 U SPORTS, four men", sourceUrl: "https://results.swimming.ca/2026_USPORTS/" },
      { event: '400-im-SCM', times: ["4:09.72", "4:12.66", "4:14.69", "4:17.80", "4:21.54"],
        basis: 'roster', context: "2026 U SPORTS, plus Kirk's 2025 Canada West title", sourceUrl: "https://results.swimming.ca/2026_USPORTS/" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'calgary',
    coach: "Mike Blondal", coachTitle: "Head Coach",
    email: "blondal@ucalgary.ca",
    staffUrl: "https://godinos.com/sports/swimming-and-diving/roster/coaches/mike-blondal/2702",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Nick Lapointe", assistantEmail: "",
    contactNote: "The roster page still lists Ray Betuzzi as assistant with his address. He has left for the Calgary Patriots club. Nick Lapointe was announced 20 August 2026 and publishes no address. Blondal's own bio text stops at 2011 but he is confirmed in his 33rd season.",
    name: 'University of Calgary', division: 'USPORTS', conference: 'Canada West',
    state: 'AB', country: 'Canada', priority: '', confidence: 'High',
    note: "The second national power, third at 2026 U SPORTS. The deepest distance roster in the country after UBC, ie, six men scored in the national 1500 and seven made the 400 IM field. Hosts the 2027 U SPORTS championships.",
    benchmarks: [
      { event: '400-free-SCM', times: ["3:46.39", "3:49.87", "3:54.89", "3:55.39", "4:00.74", "4:02.88"],
        basis: 'roster', context: "2026 U SPORTS, six men", sourceUrl: "https://results.swimming.ca/2026_USPORTS/" },
      { event: '1500-free-SCM', times: ["15:12.59", "15:16.06", "15:16.88", "15:24.37", "15:53.85", "15:56.50"],
        basis: 'roster', context: "2026 U SPORTS, six men", sourceUrl: "https://results.swimming.ca/2026_USPORTS/" },
      { event: '400-im-SCM', times: ["4:17.98", "4:18.37", "4:20.04", "4:21.77", "4:23.94", "4:27.12", "4:29.50"],
        basis: 'roster', context: "2026 U SPORTS, seven men", sourceUrl: "https://results.swimming.ca/2026_USPORTS/" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'victoria',
    coach: "Ryan Clouston", coachTitle: "Head Coach",
    email: "ryanpc@uvic.ca",
    staffUrl: "https://govikesgo.com/sports/swimming-and-diving/roster/coaches/ryan-clouston/1140",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "Eight coaches are listed and he is the only one with a published address. It is a short form, ie, ryanpc, so do not guess a UVic address from any pattern.",
    name: 'University of Victoria', division: 'USPORTS', conference: 'Canada West',
    state: 'BC', country: 'Canada', priority: '', confidence: 'High',
    note: "Third in Canada West, seventh at 2026 U SPORTS. Distance heavy relative to its scoring, ie, five men in the national 400 free field and three in the 1500, none in an A final. Their times sit right in the zone he is aiming at, which makes this arguably the best fit in Canada West.",
    benchmarks: [
      { event: '400-free-SCM', times: ["3:57.28", "3:58.70", "3:59.59", "3:59.73", "4:00.61", "4:00.72", "4:02.27"],
        basis: 'roster', context: "2026 U SPORTS and 2025 Canada West, five men", sourceUrl: "https://results.swimming.ca/2026_USPORTS/" },
      { event: '1500-free-SCM', times: ["15:52.63", "15:54.68", "16:04.85"],
        basis: 'roster', context: "2026 U SPORTS, three men", sourceUrl: "https://results.swimming.ca/2026_USPORTS/" },
      { event: '400-im-SCM', times: ["4:26.97", "4:28.44", "4:29.49", "4:33.00", "4:35.04", "4:37.91", "4:38.18", "4:43.94"],
        basis: 'roster', context: "2026 U SPORTS and 2025 Canada West, five men", sourceUrl: "https://www.winthewest.ca/swim/251128F014.htm" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'lethbridge',
    coach: "Peter Schori", coachTitle: "Swimming Head Coach",
    email: "peter.schori@uleth.ca",
    staffUrl: "https://gohorns.ca/sports/swimming-and-diving/roster/coaches/peter-schori/653",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "One-man coaching staff, the only swimming coach listed anywhere on the Pronghorns site.",
    name: 'University of Lethbridge', division: 'USPORTS', conference: 'Canada West',
    state: 'AB', country: 'Canada', priority: '', confidence: 'High',
    note: "Hosted the 2025 Canada West championships and finished fourth. Lethbridge entered men at that meet but put NOBODY in the 400 free, the 1500 or the 400 IM. There is no distance or IM group here at all, which is either wide open or a warning depending on what he wants.",
    benchmarks: [],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'manitoba',
    coach: "Vlastimil Cerny", coachTitle: "Head Coach - Swimming",
    email: "vlastimil.cerny@umanitoba.ca",
    staffUrl: "https://gobisons.ca/sports/swimming-and-diving/roster/coaches/vlastimil-cerny/1430",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Craig McCormick", assistantEmail: "craig.mccormick@umanitoba.ca",
    contactNote: "Page is current, the bio names his 34th season in 2026-27. He goes by Vlastik.",
    name: 'University of Manitoba', division: 'USPORTS', conference: 'Canada West',
    state: 'MB', country: 'Canada', priority: '', confidence: 'High',
    note: "Fifth in Canada West. Same gap as Lethbridge, ie, Manitoba raced men at the conference meet and entered nobody in the 400 free, the 1500 or the 400 IM. For scale, their 400 free school record is 4:05.77.",
    benchmarks: [],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'regina',
    coach: "Baylee Munro", coachTitle: "Women's and Men's Swimming Head Coach",
    email: "baylee.munro@uregina.ca",
    staffUrl: "https://reginacougars.com/sports/swimming-and-diving/roster/coaches/baylee-munro/1669",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Jacob Dakiniewich", assistantEmail: "",
    contactNote: "The title is published in that exact word order.",
    name: 'University of Regina', division: 'USPORTS', conference: 'Canada West',
    state: 'SK', country: 'Canada', priority: '', confidence: 'Medium',
    note: "Smallest Canada West men's programme, but unlike Lethbridge and Manitoba they DO race the distance and IM events, so there is a training group. Their conference times are the closest in Canada West to his, ie, the strongest case on this side for scoring immediately. The 1500 time is a seed, not a swum result, because the official results file was never updated past the psych sheet.",
    benchmarks: [
      { event: '400-free-SCM', times: ["4:08.20", "5:07.90", "5:19.19"],
        basis: 'roster', context: "2025 Canada West B final, three men", sourceUrl: "https://www.winthewest.ca/swim/251128F036.htm" },
      { event: '400-im-SCM', times: ["4:36.48", "5:02.06"],
        basis: 'roster', context: "2025 Canada West final, two men", sourceUrl: "https://www.winthewest.ca/swim/251128F014.htm" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'mcgill',
    coach: "Peter Carpenter", coachTitle: "Swimming, head coach",
    email: "peter.carpenter@mcgill.ca",
    staffUrl: "https://mcgillathletics.ca/staff-directory/peter-carpenter/41",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Nikki van Noord", assistantEmail: "nikki.vannoord@mcgill.ca",
    contactNote: "His bio carries the line 'updated Sept. 23, 2020' and still describes his 12th season. The address is live and correct, the biography is six years old. Van Noord only became full-time associate coach in June 2026.",
    name: 'McGill University', division: 'USPORTS', conference: 'RSEQ',
    state: 'QC', country: 'Canada', priority: '', confidence: 'High',
    note: "RSEQ men's champions in 2026 and fourth at nationals. Carpenter was RSEQ coach of the year for both programmes. A deep mid-distance group rather than a distance specialist one.",
    benchmarks: [
      { event: '400-free-SCM', times: ["3:49.37", "3:51.72", "3:54.91", "3:57.12", "4:00.84", "4:02.16", "4:02.86"],
        basis: 'roster', context: "2026 U SPORTS and 2026 RSEQ, seven swims", sourceUrl: "https://results.swimming.ca/2026_USPORTS/" },
      { event: '1500-free-SCM', times: ["15:32.72", "15:44.54", "15:47.24", "15:53.37", "16:03.00", "16:10.32"],
        basis: 'roster', context: "2026 U SPORTS and 2026 RSEQ, five men", sourceUrl: "https://results.swimming.ca/2026_USPORTS/" },
      { event: '400-im-SCM', times: ["4:22.43", "4:23.71", "4:25.22", "4:29.21", "4:32.10", "4:39.40"],
        basis: 'roster', context: "2026 U SPORTS and 2026 RSEQ, five men", sourceUrl: "https://results.swimming.ca/2026_USPORTS/" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'montreal',
    coach: "Chrystèle Roy L'Ecuyer", coachTitle: "Entraîneuse-chef",
    email: "chrystele.roy-lecuyer@umontreal.ca",
    staffUrl: "https://carabins.umontreal.ca/natation/entraineurs/chrystele-roy-lecuyer-entraineuse-chef/",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Araya Therrien", assistantEmail: "",
    contactNote: "Title published in French and recorded as published. A Carabins page headed 'Entraîneur-chef recherché' still ranks in search, ie, head coach wanted. It is dated February 2023, was for 2023-24, and the address on it is an HR contact. It is not a current vacancy.",
    name: 'Université de Montréal', division: 'USPORTS', conference: 'RSEQ',
    state: 'QC', country: 'Canada', priority: '', confidence: 'High',
    note: "The best distance freestyle programme in Quebec. Montréal won all three of these events at the 2026 RSEQ championships, and Édouard Duffy was RSEQ men's rookie of the year.",
    benchmarks: [
      { event: '400-free-SCM', times: ["3:46.97", "3:48.09", "3:51.42", "4:10.55"],
        basis: 'roster', context: "2026 U SPORTS A and B finals, four men", sourceUrl: "https://results.swimming.ca/2026_USPORTS/" },
      { event: '1500-free-SCM', times: ["15:09.55", "15:25.43", "16:40.72"],
        basis: 'roster', context: "2026 U SPORTS and 2026 RSEQ", sourceUrl: "https://results.swimming.ca/2026_USPORTS/" },
      { event: '400-im-SCM', times: ["4:10.95", "4:28.71", "4:31.36", "4:32.23"],
        basis: 'roster', context: "2026 U SPORTS final and 2026 RSEQ final, four men", sourceUrl: "https://results.swimming.ca/2026_USPORTS/" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'ottawa',
    coach: "Vince Sljuka", coachTitle: "Head Coach",
    email: "vincenzo.sljuka@uottawa.ca",
    staffUrl: "https://teams.geegees.ca/sports/swim/coaches/sljuka_vince",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "Made full-time head coach in May 2026 after a year as interim. Dave Heinbuch, the previous head coach, retired after 2024-25 and still comes up first in many searches, do not write to him. The athletics site moved, ie, geegees.ca is a splash page and teams.geegees.ca is live. Ottawa is in Ontario but competes in RSEQ.",
    name: 'University of Ottawa', division: 'USPORTS', conference: 'RSEQ',
    state: 'ON', country: 'Canada', priority: '', confidence: 'High',
    note: "Second in RSEQ and sixth at nationals, a strong all-round programme, but distance freestyle is its weak spot. NO Ottawa man made the 400 free, 1500 or 400 IM at 2026 nationals. A distance recruit would fill a real hole, and it is two hours from home.",
    benchmarks: [
      { event: '400-free-SCM', times: ["4:05.69", "4:07.13", "4:10.18", "4:12.87"],
        basis: 'roster', context: "2026 RSEQ prelims and B final, two men", sourceUrl: "https://live.swimrankings.net/49295/" },
      { event: '1500-free-SCM', times: ["16:21.90", "16:24.48"],
        basis: 'roster', context: "2026 RSEQ, two men", sourceUrl: "https://live.swimrankings.net/49295/" },
      { event: '400-im-SCM', times: ["4:34.03", "4:36.42"],
        basis: 'roster', context: "2026 RSEQ finals, two men", sourceUrl: "https://live.swimrankings.net/49295/" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'laval',
    coach: "Samuel Matte", coachTitle: "Entraîneur-chef",
    email: "sammatte01@gmail.com",
    staffUrl: "https://www.rougeetornatation.com/fr/",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "THIS IS A PERSONAL GMAIL, NOT A UNIVERSITY ADDRESS. The official Rouge et Or coaching page publishes no address at all. This one is behind the 'Contactez notre entraîneur chef' button on the club's own site, which is where the varsity programme actually runs from. It is genuinely published, but write accordingly. Matte took over in February 2025.",
    name: 'Université Laval', division: 'USPORTS', conference: 'RSEQ',
    state: 'QC', country: 'Canada', priority: '', confidence: 'Medium',
    note: "Fourth in RSEQ. A genuine distance presence, ie, two men scored in the 1500 at nationals, and strong 400 IM depth for the size of the team.",
    benchmarks: [
      { event: '400-free-SCM', times: ["3:51.50", "3:54.72", "3:56.22", "4:03.49", "4:27.51"],
        basis: 'roster', context: "2026 U SPORTS and 2026 RSEQ, three men", sourceUrl: "https://results.swimming.ca/2026_USPORTS/" },
      { event: '1500-free-SCM', times: ["15:26.24", "15:34.18", "15:43.11", "15:53.44"],
        basis: 'roster', context: "2026 U SPORTS and 2026 RSEQ, two men", sourceUrl: "https://results.swimming.ca/2026_USPORTS/" },
      { event: '400-im-SCM', times: ["4:22.75", "4:26.75", "4:28.19", "4:28.62", "4:28.99", "4:32.74", "4:35.29"],
        basis: 'roster', context: "2026 U SPORTS and 2026 RSEQ, five men", sourceUrl: "https://results.swimming.ca/2026_USPORTS/" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'sherbrooke',
    coach: "David Bruandet", coachTitle: "Entraîneur-chef",
    email: "vertetor@USherbrooke.ca",
    staffUrl: "https://www.usherbrooke.ca/vertetor/equipes/natation/entraineurs",
    verified: false, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "NO PERSONAL ADDRESS IS PUBLISHED. This is the department mailbox, with that capitalisation exactly as printed, so address him by name. Two Sherbrooke swimming URLs exist and only the vertetor one renders staff.",
    name: 'Université de Sherbrooke', division: 'USPORTS', conference: 'RSEQ',
    state: 'QC', country: 'Canada', priority: '', confidence: 'Medium',
    note: "Hosted the 2026 RSEQ championships, fifth in the conference. Small but real distance group. Three Sherbrooke swimmers qualified for the 2025 World Cup, so the coaching reaches a high level despite the team size. No Sherbrooke man swam the 400 IM at either championship.",
    benchmarks: [
      { event: '400-free-SCM', times: ["3:54.60", "3:57.81", "4:00.31", "4:01.35", "4:02.55", "4:08.20"],
        basis: 'roster', context: "2026 U SPORTS and 2026 RSEQ, four men", sourceUrl: "https://results.swimming.ca/2026_USPORTS/" },
      { event: '1500-free-SCM', times: ["15:53.75", "15:55.57"],
        basis: 'roster', context: "2026 RSEQ and 2026 U SPORTS, one man", sourceUrl: "https://results.swimming.ca/2026_USPORTS/" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'uqtr',
    coach: "Charles Labrie", coachTitle: "Entraîneur-chef",
    email: "patriotes@uqtr.ca",
    staffUrl: "https://oraprdnt.uqtr.uquebec.ca/portail/gscw031?owa_no_site=133&owa_no_fiche=78",
    verified: false, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "NO PERSONAL ADDRESS IS PUBLISHED, this is the shared programme mailbox, so address him by name. Careful with the URL, ie, the UQTR site numbers its pages and fiche=92 is GOLF, not swimming. Labrie has coached the Patriotes about fourteen years.",
    name: 'Université du Québec à Trois-Rivières', division: 'USPORTS', conference: 'RSEQ',
    state: 'QC', country: 'Canada', priority: '', confidence: 'Medium',
    note: "By far the smallest men's programme in the country. UQTR entered TWO men at the 2026 RSEQ championships and scored 4 points at nationals, last of 21. Effectively a women's programme with a token men's entry, so there is almost no training group.",
    benchmarks: [],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'dalhousie',
    coach: "Lance Cansdale", coachTitle: "Head Coach",
    email: "lance.cansdale@dal.ca",
    staffUrl: "https://daltigers.ca/sports/swim/coaches/Lance_Candsale",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "Dalhousie misspelled his surname in the page URL, ie, Candsale. The displayed name and the address are both Cansdale. Parts of his bio are years out of date and the recruit form shows a placeholder address rather than a real one.",
    name: 'Dalhousie University', division: 'USPORTS', conference: 'AUS',
    state: 'NS', country: 'Canada', priority: '', confidence: 'High',
    note: "The AUS programme that matters. Fifth straight AUS banner in 2026 and the only AUS men's team in the national top ten. Genuinely distance led, ie, Morgan Sparkes won the AUS 1500 and 400 IM and swam the only men's 800 free at the national meet.",
    benchmarks: [
      { event: '400-free-SCM', times: ["3:55.47", "3:57.80", "4:04.95", "4:08.60"],
        basis: 'roster', context: "2026 U SPORTS final and prelims, four men", sourceUrl: "https://results.swimming.ca/2026_USPORTS/" },
      { event: '1500-free-SCM', times: ["15:33.18", "16:14.87"],
        basis: 'roster', context: "2026 U SPORTS, two men", sourceUrl: "https://results.swimming.ca/2026_USPORTS/" },
      { event: '800-free-SCM', times: ["8:15.74"],
        basis: 'champion', context: "2026 U SPORTS time trial, the only men's 800 swum at the national meet", sourceUrl: "https://results.swimming.ca/2026_USPORTS/" },
      { event: '400-im-SCM', times: ["4:25.68", "4:30.21"],
        basis: 'roster', context: "2026 U SPORTS final and prelims, two men", sourceUrl: "https://results.swimming.ca/2026_USPORTS/" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'unb',
    coach: "Marta Belsh", coachTitle: "Head Coach, Men's Swimming",
    email: "marta.belsh@unb.ca",
    staffUrl: "https://goredsgo.ca/sports/mswim/coaches/Marta_Belsh",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "Page is current, the bio names her eighth season in 2026-27. She coaches both programmes. A RECRUIT ME link sits in the swim navigation.",
    name: 'University of New Brunswick', division: 'USPORTS', conference: 'AUS',
    state: 'NB', country: 'Canada', priority: '', confidence: 'High',
    note: "Second AUS programme, but a sprint and stroke one rather than a distance one. NO UNB man swam the 400 free, the 1500 or the 400 IM at 2026 nationals, and the AUS published no times at all, so there is nothing to compare against here yet.",
    benchmarks: [],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'mountallison',
    coach: "Brenna Maddelena", coachTitle: "Head Coach, Mounties Swimming",
    email: "bmaddalena@mta.ca",
    staffUrl: "https://mountiepride.ca/sports/swim/coaches/Brenna_Rothfuss",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "THREE SPELLINGS, ONE PERSON. The site displays Maddelena with an e, the page URL and title use a former surname Rothfuss, and the published address uses Maddalena with an a. The address is exactly as printed and is the one to use. Deriving it from the displayed name gets it wrong. The athletics domain is mountiepride.ca.",
    name: 'Mount Allison University', division: 'USPORTS', conference: 'AUS',
    state: 'NB', country: 'Canada', priority: '', confidence: 'Medium',
    note: "Small AUS programme that scored no men's points at 2026 nationals. Its only men's podium in three days of AUS recaps was a bronze in the 400 IM, and no time was published. The AUS published no results file, so there is nothing to compare against.",
    benchmarks: [],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'memorial',
    coach: "Duffy Earle", coachTitle: "Co-Head Coach",
    email: "duffy.earle@gmail.com",
    staffUrl: "https://www.goseahawks.ca/sports/mswim/coaches/index",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Chris Roberts", assistantEmail: "",
    contactNote: "TWO THINGS. There are two co-head coaches, Duffy Earle and Chris Roberts, and only Earle has a published address. It is A PERSONAL GMAIL, not a mun.ca address, and it appears that way on both the coaches page and the staff directory, so it is the published contact rather than a mistake. Separately the men's swimming section is badly stale, ie, its newest roster is 2023-24 and its news feed stops in December 2023.",
    name: 'Memorial University of Newfoundland', division: 'USPORTS', conference: 'AUS',
    state: 'NL', country: 'Canada', priority: '', confidence: 'Medium',
    note: "Hosted the 2026 AUS championships and scored no men's points at nationals. The AUS published no results file, so there is nothing to compare against. Their 400 free school record on the national sheet is 3:57.01.",
    benchmarks: [],
    benchmarksCheckedOn: '2026-09-18',  }
,

  // ---------- The Patriot League. ----------
  // Contacts and times read 18 September 2026 from each school's own staff page
  // and from the 2026 Patriot League Championships, hosted by Navy at Lejeune
  // Hall, 18 to 21 February 2026. Results: https://sidearmstats.com/navy/cswim/
  //
  // Six of the ten publish no coach address at all. Those fields are empty on
  // purpose. An empty field is fine, a guessed one is not, and American proves
  // why: its coach is gbartlet with ONE t.
  {
    id: 'navy',
    coach: "Bill Roberts", coachTitle: "Head Coach",
    email: "",
    staffUrl: "https://navysports.com/staff-directory/bill-roberts/41",
    verified: false, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "NO ADDRESS PUBLISHED that could be read, and none has been guessed. SERVICE ACADEMY, and for a Canadian this is the hard blocker: admission runs through congressional nomination and carries a military service obligation, and the academies admit only a small quota of international candidates by inter-government arrangement. A Canadian is not eligible through the ordinary route. Check that before anyone invests time. Roberts is in his 23rd season, so no coaching-change risk.",
    name: 'U.S. Naval Academy', division: 'D1', conference: 'Patriot League',
    state: 'MD', country: 'USA', priority: '', confidence: 'High',
    note: "Won the 2026 Patriot League championships with 1792 points, 582 clear of Army, and hosted it. The distance group is the class of the league by a wide margin, ie, Navy went 1-2-3-4-5 in the 500 free final and 1-2 in the mile.",
    benchmarks: [
      { event: '500-free-SCY', times: ["4:16.73", "4:16.76", "4:19.44", "4:19.73", "4:21.64", "4:26.53", "4:27.59"],
        basis: 'roster', context: "2026 Patriot League, seven men, includes the conference champion", sourceUrl: "https://sidearmstats.com/navy/cswim/260218F007.htm" },
      { event: '1650-free-SCY', times: ["14:54.68", "15:12.08", "15:33.87"],
        basis: 'roster', context: "2026 Patriot League, three men, includes the conference champion", sourceUrl: "https://sidearmstats.com/navy/cswim/260218F029.htm" },
      { event: '400-im-SCY', times: ["3:48.08", "3:49.67", "3:50.08"],
        basis: 'roster', context: "2026 Patriot League, three men", sourceUrl: "https://sidearmstats.com/navy/cswim/260218F018.htm" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'army',
    coach: "Scott Thacker", coachTitle: "Director of Swimming & Diving",
    email: "",
    staffUrl: "https://goarmywestpoint.com/staff-directory/scott-thacker/1213",
    verified: false, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "NO ADDRESS PUBLISHED that could be read, and none has been guessed. Thacker is a brand new hire, June 2026, from VMI. Brandt Nigro, the former director, still has a live staff page that ranks first in search, do not write to him. SERVICE ACADEMY, same congressional nomination, service obligation and international quota as Navy.",
    name: 'U.S. Military Academy', division: 'D1', conference: 'Patriot League',
    state: 'NY', country: 'USA', priority: '', confidence: 'High',
    note: "Second at the 2026 Patriot League championships with 1210 points and the defending 2025 champion. Kalvin Hahn won the 400 IM. The distance group is thin next to Navy's.",
    benchmarks: [
      { event: '500-free-SCY', times: ["4:23.42", "4:27.36", "4:35.71", "4:36.71"],
        basis: 'roster', context: "2026 Patriot League, four men", sourceUrl: "https://sidearmstats.com/navy/cswim/260218F007.htm" },
      { event: '1650-free-SCY', times: ["15:34.23", "15:46.18"],
        basis: 'roster', context: "2026 Patriot League, two men", sourceUrl: "https://sidearmstats.com/navy/cswim/260218F029.htm" },
      { event: '400-im-SCY', times: ["3:47.66", "3:52.05"],
        basis: 'roster', context: "2026 Patriot League, two men, includes the conference champion", sourceUrl: "https://sidearmstats.com/navy/cswim/260218F018.htm" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'bostonu',
    coach: "James Sica", coachTitle: "Head Coach",
    email: "",
    staffUrl: "https://goterriers.com/staff-directory/james-sica/6679",
    verified: false, verifiedOn: '2026-09-18',
    assistant: "Stephen Andersen", assistantEmail: "",
    contactNote: "NO ADDRESS PUBLISHED that could be read, and none has been guessed. Sica is in his fourth season. Bill Smyth, a former BU men's coach, still has a live coach bio page that ranks in search. Stephen Andersen was promoted to Associate Head Coach ahead of 2026-27.",
    name: 'Boston University', division: 'D1', conference: 'Patriot League',
    state: 'MA', country: 'USA', priority: '', confidence: 'High',
    note: "Fourth at the 2026 Patriot League championships with 936 points, up about 310 on the previous year, the biggest improvement of any team at the meet. Three men in the mile and four in the 500, ie, the strongest non-academy distance squad in the league.",
    benchmarks: [
      { event: '500-free-SCY', times: ["4:22.92", "4:25.89", "4:27.74", "4:37.01"],
        basis: 'roster', context: "2026 Patriot League, four men", sourceUrl: "https://sidearmstats.com/navy/cswim/260218F007.htm" },
      { event: '1650-free-SCY', times: ["15:22.64", "15:26.65", "15:50.92"],
        basis: 'roster', context: "2026 Patriot League, three men", sourceUrl: "https://sidearmstats.com/navy/cswim/260218F029.htm" },
      { event: '400-im-SCY', times: ["3:52.54", "3:56.63", "4:08.45"],
        basis: 'roster', context: "2026 Patriot League, three men", sourceUrl: "https://sidearmstats.com/navy/cswim/260218F018.htm" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'lehigh',
    coach: "Rob Herb", coachTitle: "Head Coach",
    email: "",
    staffUrl: "https://lehighsports.com/staff-directory/rob-herb/393",
    verified: false, verifiedOn: '2026-09-18',
    assistant: "Adam Coffman", assistantEmail: "",
    contactNote: "NO ADDRESS PUBLISHED that could be read, on three different page URLs, and none has been guessed. Head coach of both programmes since around 2004-05, so no change risk. He also founded and runs Atlantis Club Swimming alongside the college job, so a club versus college distinction may matter when contacting him.",
    name: 'Lehigh University', division: 'D1', conference: 'Patriot League',
    state: 'PA', country: 'USA', priority: '', confidence: 'High',
    note: "Sixth at the 2026 Patriot League championships with 560 points. The deepest distance group of the lower half, ie, four men in the mile and five in the 500.",
    benchmarks: [
      { event: '500-free-SCY', times: ["4:27.05", "4:30.39", "4:34.09", "4:34.48", "4:36.74"],
        basis: 'roster', context: "2026 Patriot League, five men", sourceUrl: "https://sidearmstats.com/navy/cswim/260218F007.htm" },
      { event: '1650-free-SCY', times: ["15:34.62", "15:41.86", "16:04.52", "16:10.49"],
        basis: 'roster', context: "2026 Patriot League, four men", sourceUrl: "https://sidearmstats.com/navy/cswim/260218F029.htm" },
      { event: '400-im-SCY', times: ["3:51.97", "3:57.00", "3:59.56"],
        basis: 'roster', context: "2026 Patriot League, three men", sourceUrl: "https://sidearmstats.com/navy/cswim/260218F018.htm" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'holycross',
    coach: "Kristy Jones", coachTitle: "Director of Swimming & Diving",
    email: "klmjones@holycross.edu",
    staffUrl: "https://goholycross.com/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Kate Magill", assistantEmail: "kmagill@holycross.edu",
    contactNote: "The published title is Director of Swimming & Diving, not head coach, so address her that way. Second assistant Kevin Salisbury, ksalisbury@holycross.edu, is also published. She came from six seasons as head coach at Babson.",
    name: 'College of the Holy Cross', division: 'D1', conference: 'Patriot League',
    state: 'MA', country: 'USA', priority: '', confidence: 'High',
    note: "Seventh at the 2026 Patriot League championships with 453 points off a 5-2 dual season. John Greiner was the fastest prelim swimmer in the whole 400 IM field at 3:48.65. The mile group is three deep and beatable.",
    benchmarks: [
      { event: '500-free-SCY', times: ["4:32.92", "4:42.23", "4:45.37"],
        basis: 'roster', context: "2026 Patriot League, three men", sourceUrl: "https://sidearmstats.com/navy/cswim/260218P007.htm" },
      { event: '1650-free-SCY', times: ["15:49.05", "15:53.93", "16:25.78"],
        basis: 'roster', context: "2026 Patriot League, three men", sourceUrl: "https://sidearmstats.com/navy/cswim/260218F029.htm" },
      { event: '400-im-SCY', times: ["3:48.65", "4:03.33", "4:04.33"],
        basis: 'roster', context: "2026 Patriot League, three men", sourceUrl: "https://sidearmstats.com/navy/cswim/260218F018.htm" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'lafayette',
    coach: "Mike Rinde", coachTitle: "Head Coach",
    email: "rindem@lafayette.edu",
    staffUrl: "https://goleopards.com/sports/swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "James Dailey", assistantEmail: "daileyj@lafayette.edu",
    contactNote: "Rinde is in his first season as head coach after the interim tag came off. James Dailey, head coach for 32 seasons, retired from that job but IS STILL ON STAFF as an assistant and still ranks first in search as Lafayette's head coach. So the old name is not a dead lead, it is a live person in a different role. Write to Rinde as head coach and do not address Dailey as one.",
    name: 'Lafayette College', division: 'D1', conference: 'Patriot League',
    state: 'PA', country: 'USA', priority: '', confidence: 'High',
    note: "Eighth at the 2026 Patriot League championships with 360 points, and the team broke eleven school records over four days. Distance is thin, ie, one man in the mile, but Trevor Olson's 4:21.39 won the 500 B final and was the fastest non-Navy 500 of the meet after the A final.",
    benchmarks: [
      { event: '500-free-SCY', times: ["4:21.39", "4:29.44", "4:35.07"],
        basis: 'roster', context: "2026 Patriot League, three men", sourceUrl: "https://sidearmstats.com/navy/cswim/260218F007.htm" },
      { event: '1650-free-SCY', times: ["16:00.09"],
        basis: 'roster', context: "2026 Patriot League, one man", sourceUrl: "https://sidearmstats.com/navy/cswim/260218F029.htm" },
      { event: '400-im-SCY', times: ["4:01.75", "4:03.01", "4:09.75", "4:18.96"],
        basis: 'roster', context: "2026 Patriot League, four men", sourceUrl: "https://sidearmstats.com/navy/cswim/260218F018.htm" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'colgate',
    coach: "Ed Pretre", coachTitle: "Mark S. Randall Head Swimming and Diving Coach",
    email: "",
    staffUrl: "https://www.colgate.edu/about/directory/epretre",
    verified: false, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "NO ADDRESS PUBLISHED anywhere that could be read. Colgate's own directory prints his name, title and office but no address and asks for a sign-in. The title is an ENDOWED one and is easy to misread, ie, Mark S. Randall is the name of the position, not a person, and several summaries wrongly list Mark S. Randall as the head coach. Pretre has held the job since May 2019.",
    name: 'Colgate University', division: 'D1', conference: 'Patriot League',
    state: 'NY', country: 'USA', priority: '', confidence: 'High',
    note: "Ninth at the 2026 Patriot League championships with 345 points. The softest distance group in the league, ie, their two milers went 16:35 and 16:36, which is slower than his own converted mile.",
    benchmarks: [
      { event: '500-free-SCY', times: ["4:27.61", "4:35.19", "4:36.03", "4:41.76", "4:49.76"],
        basis: 'roster', context: "2026 Patriot League, five men", sourceUrl: "https://sidearmstats.com/navy/cswim/260218F007.htm" },
      { event: '1650-free-SCY', times: ["16:35.26", "16:36.31"],
        basis: 'roster', context: "2026 Patriot League, two men", sourceUrl: "https://sidearmstats.com/navy/cswim/260218F029.htm" },
      { event: '400-im-SCY', times: ["4:01.20", "4:02.37", "4:08.49", "4:14.05"],
        basis: 'roster', context: "2026 Patriot League, four men", sourceUrl: "https://sidearmstats.com/navy/cswim/260218F018.htm" }
    ],
    benchmarksCheckedOn: '2026-09-18',  }
,

  // ---------- The rest of the Atlantic 10. ----------
  // Seven programmes and only seven contested the 2026 A-10 men's championship.
  // The conference's own sport page renders a fourteen-school navigation menu,
  // which is the school list and NOT the list that sponsors the sport, and
  // Wikipedia's table is wrong in the other direction. The championship start
  // list is the only reliable source and is what these came from.
  // https://swimmeetresults.tech/Atlantic-10-2026/
  {
    id: 'georgewashington',
    coach: "Chico Rego", coachTitle: "Men's and Women's Swimming & Diving Head Coach",
    email: "f.rego@gwu.edu",
    staffUrl: "https://gwsports.com/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Caroline Pape", assistantEmail: "caroline.pape@gwu.edu",
    contactNote: "Hired June 2024 from Georgia Tech. Two search traps: Brian Thomas, the former head coach, still ranks highly but his staff page is now a 404, and Christopher Lane, who also surfaces, is the head DIVING coach. Kyrylo Shvets is Associate Head Coach with no published address.",
    name: 'The George Washington University', division: 'D1', conference: 'Atlantic 10',
    state: 'DC', country: 'USA', priority: '', confidence: 'High',
    note: "Won the 2026 A-10 title with 784.83 points, their sixth straight. The deepest 400 IM group in the league by a distance, ie, four men under 3:56.",
    benchmarks: [
      { event: '500-free-SCY', times: ["4:22.30", "4:24.58"],
        basis: 'roster', context: "2026 Atlantic 10, two men", sourceUrl: "https://swimmeetresults.tech/Atlantic-10-2026/260218P007.htm" },
      { event: '1650-free-SCY', times: ["15:10.07"],
        basis: 'roster', context: "2026 Atlantic 10, one man, 2nd overall", sourceUrl: "https://swimmeetresults.tech/Atlantic-10-2026/260218F029.htm" },
      { event: '400-im-SCY', times: ["3:47.60", "3:50.63", "3:54.71", "3:55.07", "3:59.63"],
        basis: 'roster', context: "2026 Atlantic 10, five men, includes the conference champion", sourceUrl: "https://swimmeetresults.tech/Atlantic-10-2026/260218P018.htm" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'georgemason',
    coach: "Jamie Greenwood", coachTitle: "Head Coach",
    email: "jgreenw@gmu.edu",
    staffUrl: "https://gomason.com/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Ryan Westhafer", assistantEmail: "rwesthaf@gmu.edu",
    contactNote: "Interim for 2023-24 and made permanent in May 2024, so older listings calling him interim are stale. Mason publishes an address for every coach. Note the truncated usernames, ie, jgreenw and rwesthaf, which are as published and not a pattern to copy.",
    name: 'George Mason University', division: 'D1', conference: 'Atlantic 10',
    state: 'VA', country: 'USA', priority: '', confidence: 'High',
    note: "Second at the 2026 A-10 championships with 585.66 points. The distance group is thin at the top, ie, Alex Crown is the whole story, so a distance recruit has a real path to points here.",
    benchmarks: [
      { event: '500-free-SCY', times: ["4:23.48", "4:33.61", "4:35.78"],
        basis: 'roster', context: "2026 Atlantic 10, three men", sourceUrl: "https://swimmeetresults.tech/Atlantic-10-2026/260218P007.htm" },
      { event: '1650-free-SCY', times: ["15:22.97", "15:53.00"],
        basis: 'roster', context: "2026 Atlantic 10, two men", sourceUrl: "https://swimmeetresults.tech/Atlantic-10-2026/260218F029.htm" },
      { event: '400-im-SCY', times: ["3:59.94", "4:04.50"],
        basis: 'roster', context: "2026 Atlantic 10, two men, prelims, neither advanced", sourceUrl: "https://swimmeetresults.tech/Atlantic-10-2026/260218P018.htm" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'davidson',
    coach: "John Young", coachTitle: "Head Coach",
    email: "swim@davidson.edu",
    staffUrl: "https://davidsonwildcats.com/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Chris Carter", assistantEmail: "swim@davidson.edu",
    contactNote: "DAVIDSON PUBLISHES NO INDIVIDUAL ADDRESSES AT ALL. Every swim coach shows the same shared mailbox, so address the person by name in the subject line. Chris Carter was promoted to Associate Head Coach and Recruiting Coordinator on 1 September 2026 and is the right name to use.",
    name: 'Davidson College', division: 'D1', conference: 'Atlantic 10',
    state: 'NC', country: 'USA', priority: '', confidence: 'High',
    note: "Fifth at the 2026 A-10 championships but they won BOTH distance freestyle events. Easily the deepest distance group in the conference, ie, five men in the 500 and four in the mile, and the mile winner was a freshman.",
    benchmarks: [
      { event: '500-free-SCY', times: ["4:19.28", "4:23.19", "4:28.43", "4:31.91", "4:37.09", "4:41.17"],
        basis: 'roster', context: "2026 Atlantic 10, six men, includes the conference champion", sourceUrl: "https://swimmeetresults.tech/Atlantic-10-2026/260218P007.htm" },
      { event: '1650-free-SCY', times: ["15:09.61", "15:23.05", "15:41.24", "16:09.53", "16:17.35"],
        basis: 'roster', context: "2026 Atlantic 10, five men, includes the conference champion", sourceUrl: "https://swimmeetresults.tech/Atlantic-10-2026/260218F029.htm" },
      { event: '400-im-SCY', times: ["3:56.56", "3:56.77", "3:57.99", "4:00.47", "4:04.50"],
        basis: 'roster', context: "2026 Atlantic 10, five men", sourceUrl: "https://swimmeetresults.tech/Atlantic-10-2026/260218P018.htm" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'lasalle',
    coach: "Kerry Smith", coachTitle: "Head Coach",
    email: "smithka@lasalle.edu",
    staffUrl: "https://goexplorers.com/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "George Wade", assistantEmail: "",
    contactNote: "George Wade is the MEN'S RECRUITING COORDINATOR and publishes no address, so the head coach is the only way in. Smith has coached both programmes since July 2021, ie, no change risk.",
    name: 'La Salle University', division: 'D1', conference: 'Atlantic 10',
    state: 'PA', country: 'USA', priority: '', confidence: 'High',
    note: "Fourth at the 2026 A-10 championships, mostly on sprint and relay strength. Distance free is the weakest in the conference, ie, their best 500 was 4:35.69 and only one man swam the mile.",
    benchmarks: [
      { event: '500-free-SCY', times: ["4:35.69", "4:37.26", "4:45.22", "4:45.57"],
        basis: 'roster', context: "2026 Atlantic 10, four men, prelims, none advanced", sourceUrl: "https://swimmeetresults.tech/Atlantic-10-2026/260218P007.htm" },
      { event: '1650-free-SCY', times: ["16:18.38"],
        basis: 'roster', context: "2026 Atlantic 10, one man, 15th", sourceUrl: "https://swimmeetresults.tech/Atlantic-10-2026/260218F029.htm" },
      { event: '400-im-SCY', times: ["3:58.10", "4:11.00"],
        basis: 'roster', context: "2026 Atlantic 10, two men", sourceUrl: "https://swimmeetresults.tech/Atlantic-10-2026/260218P018.htm" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'saintlouis',
    coach: "Ryan McCoy", coachTitle: "Head Coach",
    email: "ryan.mccoy@slu.edu",
    staffUrl: "https://slubillikens.com/sports/swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Skye Evans", assistantEmail: "skye.evans@slu.edu",
    contactNote: "Named head coach on 26 August 2025, so 2026-27 is his second season and the 2026 result was his first. SLU runs ONE combined page for both programmes, ie, the men's-specific URL 404s.",
    name: 'Saint Louis University', division: 'D1', conference: 'Atlantic 10',
    state: 'MO', country: 'USA', priority: '', confidence: 'High',
    note: "Sixth at the 2026 A-10 championships. Kyle Algrim is a genuine distance and IM piece and Noah Benton backs him up, but it falls away quickly after those two.",
    benchmarks: [
      { event: '500-free-SCY', times: ["4:27.40", "4:31.10", "4:36.70", "4:43.95"],
        basis: 'roster', context: "2026 Atlantic 10, four men", sourceUrl: "https://swimmeetresults.tech/Atlantic-10-2026/260218P007.htm" },
      { event: '1650-free-SCY', times: ["15:30.46", "15:54.68", "16:02.53"],
        basis: 'roster', context: "2026 Atlantic 10, three men", sourceUrl: "https://swimmeetresults.tech/Atlantic-10-2026/260218F029.htm" },
      { event: '400-im-SCY', times: ["3:55.86", "3:58.36", "3:58.69", "4:05.27", "4:13.03"],
        basis: 'roster', context: "2026 Atlantic 10, five men", sourceUrl: "https://swimmeetresults.tech/Atlantic-10-2026/260218P018.htm" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'fordham',
    coach: "Tom Wilkens", coachTitle: "Head Coach",
    email: "twilkens1@fordham.edu",
    staffUrl: "https://fordhamsports.com/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Stuart Vickery", assistantEmail: "svickery1@fordham.edu",
    contactNote: "Interim from October 2023 and permanent from 29 April 2024, so listings calling him interim are stale. He is the 2000 Olympic bronze medallist in the 200 IM and a five-time NCAA champion at Stanford, which is a real hook for an IM-capable recruit. Note the 1 suffix in Fordham addresses, which is as published.",
    name: 'Fordham University', division: 'D1', conference: 'Atlantic 10',
    state: 'NY', country: 'USA', priority: '', confidence: 'High',
    note: "Seventh and last at the 2026 A-10 championships. Quinn Macphail carried the distance and IM load almost alone as a freshman, and the drop-off behind him is the steepest in the conference. The clearest opening on this board for a distance freestyler to score immediately.",
    benchmarks: [
      { event: '500-free-SCY', times: ["4:23.67", "4:37.99", "4:42.58", "4:42.90", "4:56.02", "4:59.44"],
        basis: 'roster', context: "2026 Atlantic 10, six men", sourceUrl: "https://swimmeetresults.tech/Atlantic-10-2026/260218P007.htm" },
      { event: '1650-free-SCY', times: ["15:13.65", "16:13.21", "16:17.61"],
        basis: 'roster', context: "2026 Atlantic 10, three men", sourceUrl: "https://swimmeetresults.tech/Atlantic-10-2026/260218F029.htm" },
      { event: '400-im-SCY', times: ["3:54.35", "4:10.53", "4:11.41", "4:12.70", "4:18.84"],
        basis: 'roster', context: "2026 Atlantic 10, five men", sourceUrl: "https://swimmeetresults.tech/Atlantic-10-2026/260218P018.htm" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },

  // ---------- The rest of the PSAC, ie, Division II. ----------
  // The conference site would not serve a team list, so the nine schools come
  // from its own 2026 championship results, which is the definitive record of
  // who fielded men. The full meet PDF carries all four days.
  // https://calvulcans.com/documents/2026/2/21/swim26psac_full.pdf
  //
  // The D2 national context the board was missing: the 2026 NCAA Division II
  // automatic cuts are 4:19.98 for the 500 free, 15:11.41 for the mile and
  // 3:46.91 for the 400 IM, with provisional cuts of 4:32.98, 15:56.98 and
  // 3:58.26. Read from the NCAA's own standards document. The PSAC mile was won
  // slower than the automatic cut, ie, D2 nationals are materially faster than
  // this conference's results imply.
  {
    id: 'westchester',
    coach: "Steve Mazurek", coachTitle: "Head Coach - Swimming & Diving and Aquatics Coordinator",
    email: "smazurek@wcupa.edu",
    staffUrl: "https://wcupagoldenrams.com/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Victor Polyakov", assistantEmail: "vpolyakov@wcupa.edu",
    contactNote: "Write to Polyakov first, ie, his published title is Assistant Coach and Recruiting Coordinator. He is also the PSAC record holder in the 500 free and the 400 IM, so his name is on every results sheet. Six further assistants are listed with no address at all.",
    name: 'West Chester University of Pennsylvania', division: 'D2', conference: 'Pennsylvania State Athletic',
    state: 'PA', country: 'USA', priority: '', confidence: 'High',
    note: "Won the 2026 PSAC men's title by a landslide, 1050 points to Gannon's 529, and swept all three of these events with two meet records. Six men under 4:42 in the 500 and six under 16:24 in the mile. A genuine national-level D2 programme and the hardest room in the conference to crack.",
    benchmarks: [
      { event: '500-free-SCY', times: ["4:23.91", "4:24.14", "4:27.77", "4:36.13", "4:38.61", "4:41.14"],
        basis: 'roster', context: "2026 PSAC, six men, includes the champion and a meet record", sourceUrl: "https://calvulcans.com/documents/2026/2/21/swim26psac_full.pdf" },
      { event: '1650-free-SCY', times: ["15:19.54", "15:37.56", "15:37.64", "15:54.00", "16:09.92", "16:23.64"],
        basis: 'roster', context: "2026 PSAC, six men, includes the champion", sourceUrl: "https://calvulcans.com/documents/2026/2/21/swim26psac_full.pdf" },
      { event: '400-im-SCY', times: ["3:53.46", "3:57.40", "3:57.46", "3:59.68", "4:04.98", "4:13.79"],
        basis: 'roster', context: "2026 PSAC, six men, includes the champion and a meet record", sourceUrl: "https://calvulcans.com/documents/2026/2/21/swim26psac_full.pdf" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'bloomsburg',
    coach: "Bridget Flick", coachTitle: "Head Coach",
    email: "bflick@bloomu.edu",
    staffUrl: "https://bloomsburgathletics.com/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Eric Usbeck", assistantEmail: "eusbeck@bloomu.edu",
    contactNote: "NAME CHANGE. The legal institution is now Commonwealth University of Pennsylvania, from the 2022 consolidation of Bloomsburg, Lock Haven and Mansfield, but athletics has kept the Bloomsburg identity and the legacy bloomu.edu domain. Address mail to Bloomsburg, not Commonwealth.",
    name: 'Bloomsburg University of Pennsylvania', division: 'D2', conference: 'Pennsylvania State Athletic',
    state: 'PA', country: 'USA', priority: '', confidence: 'High',
    note: "Third at the 2026 PSAC championships. Stronger in the IM than in pure distance, ie, five men in the 400 IM but only two contested the mile, so a distance recruit would have room immediately.",
    benchmarks: [
      { event: '500-free-SCY', times: ["4:38.98", "4:48.49", "4:49.14", "4:56.75"],
        basis: 'roster', context: "2026 PSAC, four men", sourceUrl: "https://calvulcans.com/documents/2026/2/21/swim26psac_full.pdf" },
      { event: '1650-free-SCY', times: ["16:41.75", "16:52.34"],
        basis: 'roster', context: "2026 PSAC, only two men entered", sourceUrl: "https://calvulcans.com/documents/2026/2/21/swim26psac_full.pdf" },
      { event: '400-im-SCY', times: ["4:02.72", "4:09.12", "4:13.35", "4:13.85", "4:28.98"],
        basis: 'roster', context: "2026 PSAC, five men", sourceUrl: "https://calvulcans.com/documents/2026/2/21/swim26psac_full.pdf" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'clarion',
    coach: "Brehan Kelley", coachTitle: "Head Coach",
    email: "bheebner@pennwest.edu",
    staffUrl: "https://clariongoldeneagles.com/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Valerie Childs", assistantEmail: "childs_v@pennwest.edu",
    contactNote: "READ THE ADDRESS CAREFULLY, IT DOES NOT MATCH HER NAME. The head coach is Brehan Kelley and her published address is bheebner@pennwest.edu, retained from her maiden name. Anyone reconstructing bkelley@pennwest.edu would be writing to nobody. NAME CHANGE: the former Clarion University is now the Clarion campus of Pennsylvania Western University, though athletics still competes as Clarion.",
    name: 'Pennsylvania Western University, Clarion', division: 'D2', conference: 'Pennsylvania State Athletic',
    state: 'PA', country: 'USA', priority: '', confidence: 'High',
    note: "Fourth at the 2026 PSAC championships. Kelley is a two-time PSAC Coach of the Year, the first woman to win it, a Clarion alumna and a twelve-time D2 All-American, now in her tenth season. Freshman Connor Hoy is the distance and IM anchor.",
    benchmarks: [
      { event: '500-free-SCY', times: ["4:40.43", "4:50.61", "4:55.16", "4:55.51"],
        basis: 'roster', context: "2026 PSAC, four men", sourceUrl: "https://calvulcans.com/documents/2026/2/21/swim26psac_full.pdf" },
      { event: '1650-free-SCY', times: ["16:14.82", "16:38.40", "17:03.42"],
        basis: 'roster', context: "2026 PSAC, three men", sourceUrl: "https://calvulcans.com/documents/2026/2/21/swim26psac_full.pdf" },
      { event: '400-im-SCY', times: ["4:09.32", "4:16.01", "4:17.55"],
        basis: 'roster', context: "2026 PSAC, three men", sourceUrl: "https://calvulcans.com/documents/2026/2/21/swim26psac_full.pdf" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'iup',
    coach: "Chris Villa", coachTitle: "Director of Men's and Women's Swimming & Diving / Head Coach",
    email: "cvilla@iup.edu",
    staffUrl: "https://iupathletics.com/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Adam Stoner", assistantEmail: "astoner@iup.edu",
    contactNote: "Stoner is Associate Head Coach and Recruiting Coordinator, so copy him. Search hygiene: Luke Mikesell still holds the PSAC 500 free meet record and appears on every results sheet, but he is a former athlete, not staff.",
    name: 'Indiana University of Pennsylvania', division: 'D2', conference: 'Pennsylvania State Athletic',
    state: 'PA', country: 'USA', priority: '', confidence: 'High',
    note: "Fifth at the 2026 PSAC championships. Very thin in distance freestyle, ie, two men in the mile and two in the 500, though Ty Uhlig's 15:54.57 is the second fastest in the conference outside West Chester.",
    benchmarks: [
      { event: '500-free-SCY', times: ["4:45.48", "5:00.56"],
        basis: 'roster', context: "2026 PSAC, only two men finished", sourceUrl: "https://calvulcans.com/documents/2026/2/21/swim26psac_full.pdf" },
      { event: '1650-free-SCY', times: ["15:54.57", "17:45.61"],
        basis: 'roster', context: "2026 PSAC, only two men entered", sourceUrl: "https://calvulcans.com/documents/2026/2/21/swim26psac_full.pdf" },
      { event: '400-im-SCY', times: ["4:05.33", "4:23.21", "4:27.98"],
        basis: 'roster', context: "2026 PSAC, three men", sourceUrl: "https://calvulcans.com/documents/2026/2/21/swim26psac_full.pdf" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'shippensburg',
    coach: "Andrew Hale", coachTitle: "Head Coach",
    email: "ARHale@ship.edu",
    staffUrl: "https://shipraiders.com/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Alyssa Brown", assistantEmail: "",
    contactNote: "The address is published with capitals exactly as recorded here. The assistant publishes no address anywhere on the staff page, so that field is deliberately empty rather than inferred from his pattern.",
    name: 'Shippensburg University of Pennsylvania', division: 'D2', conference: 'Pennsylvania State Athletic',
    state: 'PA', country: 'USA', priority: '', confidence: 'High',
    note: "Sixth at the 2026 PSAC championships and they entered NOBODY in the men's 400 IM. Among the weakest distance groups in the conference, ie, one man of consequence, which cuts both ways for a recruit.",
    benchmarks: [
      { event: '500-free-SCY', times: ["4:46.03", "4:54.84", "4:59.54"],
        basis: 'roster', context: "2026 PSAC, three men, a fourth scratched", sourceUrl: "https://calvulcans.com/documents/2026/2/21/swim26psac_full.pdf" },
      { event: '1650-free-SCY', times: ["16:42.17", "17:17.82"],
        basis: 'roster', context: "2026 PSAC, two men, a third scratched", sourceUrl: "https://calvulcans.com/documents/2026/2/21/swim26psac_full.pdf" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'kutztown',
    coach: "Tim Flannery", coachTitle: "Head Swimming Coach",
    email: "flannery@kutztown.edu",
    staffUrl: "https://kubears.com/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "Claire Frank", assistantEmail: "frank@kutztown.edu",
    contactNote: "Both addresses are BARE SURNAMES with no initial, which looks wrong and is what the page prints. Do not correct them to tflannery or cfrank.",
    name: 'Kutztown University of Pennsylvania', division: 'D2', conference: 'Pennsylvania State Athletic',
    state: 'PA', country: 'USA', priority: '', confidence: 'High',
    note: "Seventh at the 2026 PSAC championships. Distance is the relative strength of a small squad, ie, three men in the mile led by a freshman, so a distance swimmer would be central to the roster here.",
    benchmarks: [
      { event: '500-free-SCY', times: ["4:45.93", "4:51.06", "4:51.47", "5:01.33"],
        basis: 'roster', context: "2026 PSAC, four men", sourceUrl: "https://calvulcans.com/documents/2026/2/21/swim26psac_full.pdf" },
      { event: '1650-free-SCY', times: ["16:26.61", "17:07.21", "17:39.83"],
        basis: 'roster', context: "2026 PSAC, three men", sourceUrl: "https://calvulcans.com/documents/2026/2/21/swim26psac_full.pdf" },
      { event: '400-im-SCY', times: ["4:08.12", "4:09.92", "4:26.99"],
        basis: 'roster', context: "2026 PSAC, three men", sourceUrl: "https://calvulcans.com/documents/2026/2/21/swim26psac_full.pdf" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'edinboro',
    coach: "Chris Rhodes", coachTitle: "Head Men's and Women's Swimming Coach",
    email: "crhodes@pennwest.edu",
    staffUrl: "https://gofightingscots.com/sports/mens-swimming-and-diving/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "ONE-MAN STAFF, ie, Rhodes is the only coach published for 2026-27, no assistant and no diving coach. He is the single point of contact and will be slow to reply, so plan for that. NAME CHANGE: the former Edinboro University is now the Edinboro campus of Pennsylvania Western University, though athletics still brands as Edinboro.",
    name: 'Pennsylvania Western University, Edinboro', division: 'D2', conference: 'Pennsylvania State Athletic',
    state: 'PA', country: 'USA', priority: '', confidence: 'High',
    note: "Eighth and last of the scoring teams at the 2026 PSAC championships. The smallest and slowest distance group in the conference, ie, one man in the mile. A rebuilding programme where a recruit would be the fastest distance swimmer on arrival by a wide margin.",
    benchmarks: [
      { event: '500-free-SCY', times: ["4:50.66", "4:51.25", "5:12.79", "5:23.86"],
        basis: 'roster', context: "2026 PSAC, four men, the 5:23.86 was a time trial rather than the scored event", sourceUrl: "https://calvulcans.com/documents/2026/2/21/swim26psac_full.pdf" },
      { event: '1650-free-SCY', times: ["16:41.74"],
        basis: 'roster', context: "2026 PSAC, only one man entered", sourceUrl: "https://calvulcans.com/documents/2026/2/21/swim26psac_full.pdf" },
      { event: '400-im-SCY', times: ["4:18.30", "4:31.17"],
        basis: 'roster', context: "2026 PSAC, two men", sourceUrl: "https://calvulcans.com/documents/2026/2/21/swim26psac_full.pdf" }
    ],
    benchmarksCheckedOn: '2026-09-18',  },
  {
    id: 'pittjohnstown',
    coach: "Kile Zeller", coachTitle: "Head Men's/Women's Swim Coach & Director of Aquatics",
    email: "KCZ9@pitt.edu",
    staffUrl: "https://pittjohnstownathletics.com/sports/mens-swimming/coaches",
    verified: true, verifiedOn: '2026-09-18',
    assistant: "", assistantEmail: "",
    contactNote: "TWO TRAPS. The URL pattern differs from every other PSAC school, ie, /sports/mens-swimming and NOT /sports/mens-swimming-and-diving, which 404s. And the main staff directory lists Zeller twice and publishes NO address for either entry; this one came only from the sport page. He is the programme's first ever head coach, hired 2025, so almost nothing about this team exists in older search results.",
    name: 'University of Pittsburgh at Johnstown', division: 'D2', conference: 'Pennsylvania State Athletic',
    state: 'PA', country: 'USA', priority: '', confidence: 'Medium',
    note: "BRAND NEW PROGRAMME. Announced April 2025 with 2025-26 as the first season. They entered the 2026 PSAC championships, scored no team points, and NO Pitt-Johnstown man entered the 500 free, the 1650 or the 400 IM. No distance group exists yet, which makes this the biggest blank slate in the conference.",
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
