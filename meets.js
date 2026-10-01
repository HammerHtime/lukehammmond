// meets.js
// The club's high performance meet calendar for the 2026-27 season.
//
// PRIVATE. This file sits at the repository root, outside public/, so it is
// never deployed as a page. Only the admin-key function in
// netlify/functions/meets.js reads it. A public list of where a minor will be,
// on which dates, at which pool, is not something this site publishes. The coach
// emails use it for one line, "my next meet is", and the admin page warns to
// check Luke is entered before that line goes out.
//
// Source: "Copy of Meet Calendar (HP).xlsx", sent by Andrew on 1 October 2026.
// The sheet's title reads 2025-2026, but Andrew sent it as this season's, and
// the meets run October to July, so the years below are 2026 for October to
// December and 2027 for January to July. It is the club's calendar, not Luke's
// entry list: several meets need qualifying times.

const SEASON = '2026-27';

const MEETS = [
  { name: 'MAC Fall Invitational', start: '2026-10-24', end: '2026-10-25', host: 'MAC', course: 'SCM', pool: 'Markham' },
  { name: 'Harvest', start: '2026-11-13', end: '2026-11-15', host: 'MSSAC', course: 'SCM', pool: 'Etobicoke' },
  { name: 'Age Group Invitational (AGI)', start: '2026-11-20', end: '2026-11-21', host: 'ESWIM', course: 'SCM', pool: 'Etobicoke', note: 'Sat-Sun only' },
  { name: 'Ontario Junior International (OJI)', start: '2026-12-10', end: '2026-12-13', host: 'Swim Ontario', course: 'SCM', pool: 'TPASC', qualifier: true },
  { name: 'MSSAC Open', start: '2026-12-18', end: '2026-12-20', host: 'MSSAC', course: 'SCM', pool: 'Etobicoke' },
  { name: 'Stephen Clarke Invitational', start: '2027-01-09', end: '2027-01-10', host: 'COBRA', course: 'SCM', pool: 'Gore Meadows' },
  { name: 'Toronto Grand Prix', start: '2027-01-29', end: '2027-01-30', host: 'TSC', course: 'LCM', pool: 'U of T', note: 'OSC qualifiers' },
  { name: 'Mallards Winter Invitational', start: '2027-01-29', end: '2027-01-31', host: 'MST', course: 'LCM', pool: 'Markham' },
  { name: 'Division 1', start: '2027-02-04', end: '2027-02-07', host: 'Swim Ontario', course: 'SCM', pool: 'Etobicoke', qualifier: true },
  { name: 'GTA Skins', start: '2027-02-12', end: '2027-02-14', host: 'Milton', course: 'LCM', pool: 'Etobicoke' },
  { name: 'Ontario Age Group Championships (OAG)', start: '2027-03-04', end: '2027-03-07', host: 'Swim Ontario', course: 'LCM', pool: 'TPASC', qualifier: true },
  { name: 'Mallards LC Challenge', start: '2027-04-02', end: '2027-04-04', host: 'MST', course: 'LCM', pool: '', note: 'Non-Trials swimmers' },
  { name: 'Canadian Swimming Trials', start: '2027-04-05', end: '2027-04-10', host: 'Swimming Canada', course: 'LCM', pool: 'Saanich (Victoria, BC)', qualifier: true },
  { name: 'Hicken', start: '2027-04-29', end: '2027-05-02', host: 'MSSAC', course: 'LCM', pool: 'Etobicoke' },
  { name: 'MAC Spring Invitational', start: '2027-05-20', end: '2027-05-23', host: 'MAC', course: 'LCM', pool: 'Markham' },
  { name: 'Division 2', start: '2027-06-12', end: '2027-06-14', host: 'Swim Ontario', course: 'LCM', pool: '', qualifier: true },
  { name: 'Division 1', start: '2027-06-19', end: '2027-06-21', host: 'Swim Ontario', course: 'LCM', pool: '', qualifier: true },
  { name: 'Ontario Swimming Championships (OSC)', start: '2027-07-08', end: '2027-07-12', host: 'Swim Ontario', course: 'LCM', pool: '', qualifier: true },
  { name: 'Open Water', start: '2027-07-18', end: '2027-07-19', host: 'Swim Ontario', course: 'Open water', pool: 'Lake' }
];

// The first meet that starts after a given date, or null.
function nextMeet(today, meets) {
  const list = (meets || MEETS).slice().sort(function (a, b) { return a.start < b.start ? -1 : 1; });
  return list.filter(function (m) { return m.start > String(today || ''); })[0] || null;
}

module.exports = { SEASON: SEASON, MEETS: MEETS, nextMeet: nextMeet };
