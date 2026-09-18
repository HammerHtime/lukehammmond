// questionnaire.js
// Every field a US school's recruiting questionnaire actually asks for.
//
// Where this comes from: 21 real men's swimming recruiting questionnaires were
// read field by field on 18 September 2026, pulled from the form definitions
// the schools' own sites serve, ie, the Sidearm and ARMS JSON behind the page
// rather than anyone's description of it. Division I, II and III.
//
// The "asked" number on each field is how many of those 21 forms wanted it.
// That number is the whole point. It turns "what should we have ready" from a
// guess into a count.
//
// The finding that shaped this file: NOT ONE of the 21 forms asked about
// volunteering, community service or leadership. Two D2 forms had a single
// box labelled "Hobbies". That does not mean character is worthless, it means
// no form will collect it for you, so it belongs in the email and on the
// profile page instead.

(function () {

const SOURCE = '21 NCAA men’s swimming recruiting questionnaires, read from the form definitions';
const RECORDED = '2026-09-18';

// group: what part of the form it sits in
// asked: how many of the 21 forms wanted it
// note:  what a Canadian specifically needs to watch for
const FIELDS = [
  // ---- identity ----
  { key: 'legalName', group: 'You', label: 'Full legal name, first middle last', asked: 21 },
  { key: 'preferredName', group: 'You', label: 'Preferred or chosen name', asked: 4 },
  { key: 'email', group: 'You', label: 'Email address', asked: 21 },
  { key: 'mobile', group: 'You', label: 'Mobile number, full international format', asked: 21,
    note: 'Write it +1 416 555 0123. A US form will not assume a country code.' },
  { key: 'address', group: 'You', label: 'Home address, street, city, province, postal code', asked: 20,
    note: 'Some forms have a US states only dropdown and no country field, ie, Virginia’s does. Put Ontario wherever it fits and add Canada to any free text box.' },
  { key: 'country', group: 'You', label: 'Country', asked: 20 },
  { key: 'birthDate', group: 'You', label: 'Date of birth', asked: 20,
    note: 'US forms read dates month first. 3 April reads as 4 March if you type it the Canadian way.' },
  { key: 'citizenship', group: 'You', label: 'Citizenship', asked: 2,
    note: 'Only two forms asked outright, and one made it required. Neither asked about a visa or a study permit.' },

  // ---- school ----
  { key: 'schoolName', group: 'School', label: 'High school name', asked: 21 },
  { key: 'schoolAddress', group: 'School', label: 'High school address and phone', asked: 21,
    note: 'Every ARMS form asks for this inside its school picker, including a required "Does your school have an American Football Team?"' },
  { key: 'gradYear', group: 'School', label: 'Graduation year', asked: 21 },
  { key: 'gpa', group: 'School', label: 'GPA on a 4.0 scale, with the scale stated', asked: 19,
    note: 'Ontario reports percentages. Give the 4.0 figure and the percentage, because no form asks you to explain the scale and one school calls it "Core GPA".' },
  { key: 'classRank', group: 'School', label: 'Class rank, or that the school does not rank', asked: 14 },
  { key: 'satAct', group: 'School', label: 'SAT Math, Reading, Writing and Total, and ACT Composite', asked: 19,
    note: 'Eight forms split the SAT into components. MIT requires ACT Math and ACT Science separately.' },
  { key: 'intendedMajor', group: 'School', label: 'Intended major, plus a second and third choice', asked: 18 },
  { key: 'counsellor', group: 'School', label: 'Guidance counsellor name, phone and email', asked: 6,
    note: 'Required at Seton Hall and asked outright by Virginia.' },
  { key: 'transcript', group: 'School', label: 'Transcript, as a PDF', asked: 12,
    note: 'Required at Brown. Eleven forms also want a separate test score report PDF.' },

  // ---- swimming ----
  { key: 'bestTimes', group: 'Swimming', label: 'Best times, event by event', asked: 21, auto: true },
  { key: 'course', group: 'Swimming', label: 'The course for every time, SCY, SCM or LCM', asked: 11,
    note: 'THE ONE THAT MATTERS MOST. Eleven forms ask. The other ten do not, and an unlabelled time is read as YARDS. A metric time typed into an unlabelled box makes Luke look several seconds slower than he is.' },
  { key: 'club', group: 'Swimming', label: 'Club name, exactly as registered', asked: 18, auto: true },
  { key: 'clubCoach', group: 'Swimming', label: 'Club coach name, phone and email', asked: 16, auto: true,
    note: 'The ARMS forms quietly collect a coach’s occupation, employer, job title and the college they attended.' },
  { key: 'schoolCoach', group: 'Swimming', label: 'High school coach name, phone and email', asked: 7 },
  { key: 'height', group: 'Swimming', label: 'Height in feet and inches', asked: 17 },
  { key: 'weight', group: 'Swimming', label: 'Weight in pounds', asked: 14 },
  { key: 'athleticHonours', group: 'Swimming', label: 'Athletic honours, written out', asked: 15, auto: true },
  { key: 'academicHonours', group: 'Swimming', label: 'Academic honours, written out', asked: 14 },
  { key: 'video', group: 'Swimming', label: 'Video link, and a SwimCloud profile URL', asked: 10, auto: true,
    note: 'Berry asks for the SwimCloud URL by name.' },
  { key: 'otherSports', group: 'Swimming', label: 'Other sports played', asked: 6 },
  { key: 'meets', group: 'Swimming', label: 'Meets he will swim this season, with dates and venues', asked: 3,
    note: 'Three forms have a meet picker, ie, they are asking where they can come and watch him.' },

  // ---- the ones nobody expects ----
  { key: 'ncaaId', group: 'Not on any profile page', label: 'NCAA Eligibility Center registration status and ID', asked: 14,
    note: 'Required at Bucknell, Brown, Seton Hall and Virginia. Almost nobody puts this on a profile page and fourteen of twenty one forms demand it.' },
  { key: 'parents', group: 'Not on any profile page', label: 'Both parents, name, phone, email', asked: 16,
    note: 'The ARMS forms also collect occupation, employer, job title and which college the parent attended. Seton Hall requires "Parents’ Occupation(s)".' },
  { key: 'otherSchools', group: 'Not on any profile page', label: 'Which other schools he is considering', asked: 13 },
  { key: 'siblings', group: 'Not on any profile page', label: 'Siblings, names and ages', asked: 7 },
  { key: 'connection', group: 'Not on any profile page', label: 'Any relative or friend who attended that school', asked: 6,
    note: 'Six schools ask this by name. It is worth checking before filling in each form.' },
  { key: 'aidImportance', group: 'Not on any profile page', label: 'How much financial aid matters to the decision', asked: 2,
    note: 'American’s options run from "essential in my search" to "isn’t important". Think about the answer before you meet it.' },
  { key: 'entryTerm', group: 'Not on any profile page', label: 'Intended entry term, ie, Fall 2029', asked: 3 },
  { key: 'social', group: 'Not on any profile page', label: 'Instagram, Twitter, Facebook handles', asked: 6 },
  { key: 'injuries', group: 'Not on any profile page', label: 'Past and present injuries or illnesses', asked: 1,
    note: 'One form, Seton Hall, and it is required.' },
  { key: 'shoeSize', group: 'Not on any profile page', label: 'Shoe size, and wingspan', asked: 4 }
];

// Anything asked by 14 or more of the 21 forms. Not having one of these ready
// is what turns a ten minute form into an evening.
const MUST_HAVE = 14;

function fields() {
  return FIELDS.slice().sort(function (a, b) {
    if (b.asked !== a.asked) return b.asked - a.asked;
    return a.label.localeCompare(b.label);
  });
}

function groups() {
  const order = [];
  FIELDS.forEach(function (f) { if (order.indexOf(f.group) === -1) order.push(f.group); });
  return order.map(function (name) {
    return {
      name: name,
      fields: FIELDS.filter(function (f) { return f.group === name; })
        .sort(function (a, b) { return b.asked - a.asked; })
    };
  });
}

// What is filled in, what is not, and how much of it actually matters.
function readiness(answers, autoFilled) {
  const held = answers || {};
  const auto = autoFilled || {};
  const have = function (f) {
    if (f.auto && auto[f.key]) return true;
    return Boolean(String(held[f.key] || '').trim());
  };

  const musts = FIELDS.filter(function (f) { return f.asked >= MUST_HAVE; });
  const missingMusts = musts.filter(function (f) { return !have(f); });
  const all = FIELDS.filter(have);

  return {
    total: FIELDS.length,
    answered: all.length,
    mustTotal: musts.length,
    mustAnswered: musts.length - missingMusts.length,
    missing: missingMusts,
    // The single most useful sentence, ie, what to go and find next.
    next: missingMusts.length ? missingMusts[0] : null
  };
}

const api = {
  SOURCE: SOURCE,
  RECORDED: RECORDED,
  FIELDS: FIELDS,
  MUST_HAVE: MUST_HAVE,
  fields: fields,
  groups: groups,
  readiness: readiness
};

if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof window !== 'undefined') window.Questionnaire = api;

})();
