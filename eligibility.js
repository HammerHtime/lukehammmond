// eligibility.js
// The NCAA rules that actually bind an Ontario swimmer, and when.
//
// Sourced to NCAA's own material on 18 September 2026, not to recruiting
// services: the 2026-27 Guide for the College-Bound Student-Athlete, the
// 2026-27 Guide to International Academic Standards, the NCAA Ontario country
// sheet dated September 2026, and the 2026-27 Division I and II Manuals.
//
// The framing that governs everything here: there are TWO gates, and both must
// be cleared. NCAA initial eligibility is a low academic bar. University
// admission is a separate and usually much higher bar. A student can be NCAA
// eligible and still be rejected. Do not let one be mistaken for the other.

(function () {

const RECORDED = '2026-09-18';

// ---------------------------------------------------------------------------
// Ontario course codes
// ---------------------------------------------------------------------------
// The fifth character of an Ontario course code decides whether the NCAA will
// count it at all. This is the single cheapest mistake to avoid and the most
// expensive to discover in Grade 12.
const LEVELS = {
  D: { name: 'Academic', approved: true },
  U: { name: 'University Preparation', approved: true },
  M: { name: 'College/University Preparation', approved: true },
  P: { name: 'Applied', approved: false },
  O: { name: 'Open', approved: false },
  C: { name: 'College Preparation', approved: false },
  E: { name: 'Workplace Preparation', approved: false },
  L: { name: 'Locally Developed', approved: null }   // case by case
};

// Named on the NCAA Ontario sheet as NOT approved, whatever their level.
// The first two matter most here: Luke's stated academic interest is exercise
// science and kinesiology, and those are exactly the two courses an Ontario
// swimmer gravitates towards. They earn zero NCAA credit.
const NOT_APPROVED = {
  PSK4U: 'Introduction to Kinesiology', PSE4U: 'Exercise Science',
  AMU3M: 'Music', AMU4M: 'Music', ADA4M: 'Drama',
  TDJ3M: 'Technological Design', TMJ4M: 'Manufacturing Engineering Technology',
  BOH4M: 'Organizational Studies', BAT4M: 'Financial Accounting', BAF3M: 'Financial Accounting',
  HFA4U: 'Nutrition and Health', NFA4U: 'Nutrition and Health', HFA4M: 'Food and Nutrition Science',
  EMS3O: 'Media Studies', CGG3O: 'Regional Geography',
  IDP4U: 'Interdisciplinary Studies', IDC4U: 'Medieval and Renaissance History',
  HRE3M: 'Religious Education', MCT4C: 'Math for College Technology',
  MAP4C: 'College and Apprenticeship Math', MEL3E: 'Math for Everyday Life',
  MEL4E: 'Math for Everyday Life', MBF3C: 'Math of Personal Finance',
  MFM1P: 'Foundations of Mathematics', MFM2P: 'Foundations of Mathematics'
};

// The one Open-level course the NCAA does count, and it is worth half a credit.
const HALF_CREDIT = { CHV2O: 'Civics' };

// Ontario de-streamed Grade 9 in 2021, and the new courses end in W, which is
// not in the NCAA's fifth-character table at all. The table was written before
// they existed. What the sheet does instead is name them one by one on the
// approved TITLE list, so these five count and any other W code does not, until
// the Eligibility Center names it.
//
// This is not academic. Luke sat Grade 9 in 2025-26, which is fully de-streamed,
// so MTH1W and SNC1W are the actual codes on his transcript. Before this the
// checker rejected them outright as an unrecognised level.
// Source: NCAA Eligibility Center, Ontario (Canada) country sheet, approved
// course title list, read 18 September 2026.
const DESTREAMED = {
  MTH1W: 'Grade 9 Mathematics', ENL1W: 'English 9', SNC1W: 'Science 9',
  FRL1W: 'French First Language 9', CGC1W: 'Exploring Canadian Geography'
};

function checkCourse(code) {
  const c = String(code || '').trim().toUpperCase();
  if (!/^[A-Z]{3}[1-4][A-Z]$/.test(c)) {
    return { ok: false, reason: 'That is not an Ontario course code, ie, four letters and numbers then a level letter.' };
  }

  const grade = Number(c[3]);
  const level = LEVELS[c[4]] || null;

  if (DESTREAMED[c]) {
    return { ok: true, approved: true, credit: 1, grade: grade,
      level: 'De-streamed Grade 9', name: DESTREAMED[c],
      note: 'A de-streamed Grade 9 course. The NCAA level table predates these, so it ' +
        'counts because the Eligibility Center names it, not because of its level letter.' };
  }
  if (c[4] === 'W') {
    return { ok: true, approved: null, credit: 0, grade: grade,
      level: 'De-streamed', name: '',
      note: 'A de-streamed course the NCAA Ontario sheet does not name. Only five are ' +
        'listed, ie, MTH1W, ENL1W, SNC1W, FRL1W and CGC1W. Ask the guidance office to ' +
        'have this one checked rather than assuming either way.' };
  }
  if (HALF_CREDIT[c]) {
    return { ok: true, approved: true, credit: 0.5, grade: grade,
      level: level ? level.name : '', name: HALF_CREDIT[c],
      note: 'Counts, and it is the exception to the Open level rule, but it is worth half a credit not one.' };
  }
  if (NOT_APPROVED[c]) {
    return { ok: true, approved: false, credit: 0, grade: grade,
      level: level ? level.name : '', name: NOT_APPROVED[c],
      note: 'Named on the NCAA Ontario sheet as not approved. It earns no core credit at all.' };
  }
  if (!level) {
    return { ok: false, reason: 'Unrecognised level letter, ie, the last character.' };
  }
  if (level.approved === false) {
    return { ok: true, approved: false, credit: 0, grade: grade, level: level.name,
      note: level.name + ' level courses are not approved. Only Academic, University and College/University count.' };
  }
  if (level.approved === null) {
    return { ok: true, approved: null, credit: 0, grade: grade, level: level.name,
      note: 'Locally Developed courses are judged case by case. Do not assume it counts.' };
  }
  return { ok: true, approved: true, credit: 1, grade: grade, level: level.name,
    note: 'The level is approved. It must ALSO appear on this school’s own NCAA approved course list.' };
}

// ---------------------------------------------------------------------------
// Which Eligibility Center account
// ---------------------------------------------------------------------------
// Source: NCAA Eligibility Center, Choose Your Account, read 18 September 2026.
//
// There is a trap on that page for a Canadian, and it is easy to walk into.
// The free Profile Page account lists "a DOMESTIC Division III prospective
// student-athlete". An international student-athlete going to a Division III
// school is sent to the paid Athletics Certification account instead. So an
// American teammate at Ithaca needs nothing and Luke needs a paid account for
// the same school. Five of the seventeen on the board are Division III.
const ACCOUNTS = {
  profile: {
    name: 'Profile Page Account', paid: false,
    who: 'Still exploring, not yet in high school, unsure of division, or not being recruited yet.',
    note: 'Free. It reserves the NCAA ID and transitions to a certification account later without losing anything, from the dashboard.'
  },
  full: {
    name: 'Academic and Athletics Certification Account', paid: true,
    who: 'Competing at, being recruited by, visiting, or walking on at a Division I or II school.',
    note: 'Both halves, ie, the academic certification and the athletics one. Needed before an official visit and before signing.'
  },
  athletics: {
    name: 'Athletics Certification Account', paid: true,
    who: 'An international student-athlete enrolling at a Division III school, or a transfer who only needs the athletics half.',
    note: 'The one a Canadian going Division III needs. A domestic student in the same position needs only the free profile page.'
  }
};

// Walking on does not avoid any of this. The Eligibility Center says walk-on
// and preferred walk-on recruits must register and meet initial-eligibility
// standards, same as a scholarship athlete.
const WALK_ON_STILL_REGISTERS = true;

// Which account, given the divisions actually in play and whether recruiting
// has started. Deliberately returns the free one while it is still honest to,
// because paying early buys nothing.
function accountFor(divisions, options) {
  const opts = options || {};
  const list = (divisions || []).map(function (d) { return String(d).toUpperCase(); });
  const hasD1D2 = list.indexOf('D1') !== -1 || list.indexOf('D2') !== -1;
  const hasD3 = list.indexOf('D3') !== -1;
  const active = Boolean(opts.beingRecruited || opts.visiting || opts.signing);

  if (hasD1D2 && active) {
    return { pick: ACCOUNTS.full, key: 'full',
      why: 'Division I or II is in play and recruiting has started. This account covers both halves.' };
  }
  if (!hasD1D2 && hasD3 && active) {
    return { pick: opts.international === false ? ACCOUNTS.profile : ACCOUNTS.athletics,
      key: opts.international === false ? 'profile' : 'athletics',
      why: opts.international === false
        ? 'Division III only, and a domestic student needs no certification account.'
        : 'Division III only, but an international student-athlete still needs an athletics certification account. A domestic teammate would not.' };
  }
  return { pick: ACCOUNTS.profile, key: 'profile',
    why: 'Nothing is being sent yet, so the free account is enough. It reserves the NCAA ID and ' +
      'transitions later without losing anything.' +
      (hasD1D2 ? ' Division I and II are on the board, so a full certification account comes before the first official visit.' : '') };
}

// ---------------------------------------------------------------------------
// The sixteen core courses
// ---------------------------------------------------------------------------
// Sixteen is not a total to reach, it is a shape to fill. A student can have
// twenty approved credits and still fail, because the English is short and the
// extras went somewhere that does not count.
//
// Division I: NCAA Guide for the College-Bound Student-Athlete 2026-27,
// Division I core-course requirement table.
// Division II: NCAA Division II Manual, Bylaw 14.2.8.2.1, revised 7/21/26
// effective 8/1/26. Both read 18 September 2026.
//
// Division III sets no NCAA academic requirement at all. The university decides,
// and its own admissions bar is usually far higher than anything below.
const CORE = {
  D1: {
    division: 'NCAA Division I', total: 16, gpa: 2.3,
    // The 10/7 rule, which only Division I has.
    lockIn: { count: 10, inCore: 7, when: 'before the start of the seventh semester' },
    areas: [
      { key: 'english', name: 'English', years: 4 },
      { key: 'math', name: 'Mathematics, at Algebra I or higher', years: 3 },
      { key: 'science', name: 'Natural or physical science, with a lab year if the school offers one', years: 2 },
      { key: 'extraCore', name: 'More English, maths or science', years: 1 },
      { key: 'social', name: 'Social science', years: 2 },
      { key: 'extra', name: 'Anything above, or a language, philosophy or comparative religion', years: 4 }
    ]
  },
  D2: {
    division: 'NCAA Division II', total: 16, gpa: 2.2,
    lockIn: null,
    areas: [
      { key: 'english', name: 'English', years: 3 },
      { key: 'math', name: 'Mathematics, at Algebra I or higher', years: 2 },
      { key: 'science', name: 'Natural or physical science', years: 2 },
      { key: 'extraCore', name: 'More English, maths or science', years: 3 },
      { key: 'social', name: 'Social science', years: 2 },
      { key: 'extra', name: 'Anything above, or a language, philosophy or comparative religion', years: 4 }
    ]
  },
  D3: {
    division: 'NCAA Division III', total: null, gpa: null, lockIn: null, areas: [],
    note: 'Division III sets no NCAA academic requirement. The university decides, and its own admissions bar is normally the harder one.'
  }
};

// Which NCAA area an Ontario course falls in, by the first three letters of the
// code. Taken from how the NCAA Ontario sheet itself groups its approved
// titles, not from what the subject sounds like.
//
// Computer science, ie, ICS, is listed by the NCAA under BOTH maths and
// science. It is recorded here as maths, which is the safer of the two, and the
// note says so rather than letting it look settled.
const AREAS = {
  english: ['ENG', 'EAE', 'ENL', 'EAU', 'EAL', 'NBE', 'ETS', 'EWC', 'EAT', 'ETC', 'FRA', 'FRL'],
  math: ['MPM', 'MTH', 'MCR', 'MCF', 'MHF', 'MCV', 'MDM', 'MGA', 'MCB', 'ICS'],
  science: ['SNC', 'SBI', 'SCH', 'SPH', 'SES', 'SVN'],
  social: ['CHC', 'CHV', 'CHA', 'CHI', 'CHW', 'CHY', 'CGC', 'CGD', 'CGF', 'CGO', 'CGR', 'CGU',
    'CGW', 'CIA', 'CIE', 'CIU', 'CLN', 'CPW', 'HSB', 'HSC', 'HSE', 'HSG', 'HSP', 'HHG', 'HHS',
    'NDA', 'NDG', 'NDW', 'LVV'],
  language: ['FSF', 'FEF', 'FIF', 'LWS', 'LWI', 'LWG', 'LWP', 'LKD', 'LKJ', 'LKM', 'LBG', 'LVG',
    'LVL', 'LYH', 'LRP', 'LRQ', 'LRZ', 'LRU', 'LLU', 'LBC', 'LPV'],
  philosophy: ['HZT', 'HZB', 'HRT', 'HRE']
};

function areaOf(code) {
  const c = String(code || '').trim().toUpperCase().slice(0, 3);
  const keys = Object.keys(AREAS);
  for (let i = 0; i < keys.length; i += 1) {
    if (AREAS[keys[i]].indexOf(c) !== -1) return keys[i];
  }
  return null;
}

// Fill the shape, in the order the NCAA fills it, ie, the named areas first and
// only then the flexible ones. Doing it the other way round would let a
// language soak up a slot that English needed and report a pass that is not one.
function auditCore(codes, division) {
  const spec = CORE[String(division || 'D1').toUpperCase()];
  if (!spec) return null;
  if (!spec.total) {
    return { division: spec.division, applies: false, note: spec.note, areas: [], credits: 0 };
  }

  const counted = { english: 0, math: 0, science: 0, social: 0, language: 0, philosophy: 0 };
  const rejected = [];
  let credits = 0;

  (codes || []).forEach(function (code) {
    const checked = checkCourse(code);
    if (!checked.ok || checked.approved !== true) {
      rejected.push({ code: String(code).toUpperCase(), why: checked.reason || checked.note });
      return;
    }
    const area = areaOf(code);
    if (!area) {
      rejected.push({ code: String(code).toUpperCase(), why: 'Approved level, but not in an NCAA core subject area.' });
      return;
    }
    counted[area] += checked.credit;
    credits += checked.credit;
  });

  // The pools, spent in order. What is left over at each step is what can go
  // toward the flexible slots underneath.
  const left = Object.assign({}, counted);
  const filled = spec.areas.map(function (a) {
    let have = 0;
    if (a.key === 'extraCore') {
      // Whatever English, maths and science is left over once their own slots
      // are filled. Which of the three it comes out of changes nothing but the
      // bookkeeping, so it is spent in a fixed order.
      have = Math.min(left.english + left.math + left.science, a.years);
      let need = have;
      ['english', 'math', 'science'].forEach(function (k) {
        const spend = Math.min(left[k], need);
        left[k] -= spend;
        need -= spend;
      });
    } else if (a.key === 'extra') {
      have = left.english + left.math + left.science + left.social + left.language + left.philosophy;
      have = Math.min(have, a.years);
    } else {
      have = Math.min(left[a.key], a.years);
      left[a.key] -= have;
    }
    return {
      key: a.key, name: a.name, need: a.years, have: have,
      short: Math.max(0, a.years - have), met: have >= a.years
    };
  });

  const short = filled.filter(function (f) { return !f.met; });
  return {
    division: spec.division, applies: true, gpa: spec.gpa, lockIn: spec.lockIn,
    total: spec.total, credits: credits, areas: filled, rejected: rejected,
    met: short.length === 0 && credits >= spec.total,
    short: short,
    sentence: short.length === 0 && credits >= spec.total
      ? 'The shape is filled for ' + spec.division + '.'
      : 'Short in ' + short.map(function (f) { return f.name.split(',')[0].toLowerCase(); }).join(', ') + '.'
  };
}

// ---------------------------------------------------------------------------
// How an Ontario mark converts
// ---------------------------------------------------------------------------
// Coarse, and that coarseness is worth money. A 79 and a 70 are both 3.0. An
// 80 and a 100 are both 4.0. So one mark, from 79 to 80, is a full grade point,
// and everything above 80 is free.
const BANDS = [
  { from: 80, to: 100, letter: 'A', points: 4 },
  { from: 70, to: 79, letter: 'B', points: 3 },
  { from: 60, to: 69, letter: 'C', points: 2 },
  { from: 50, to: 59, letter: 'D', points: 1 },
  { from: 0, to: 49, letter: 'F', points: 0 }
];

function convertMark(percent) {
  const p = Number(percent);
  if (!Number.isFinite(p) || p < 0 || p > 100) return null;
  const band = BANDS.filter(function (b) { return p >= b.from && p <= b.to; })[0];
  const toNext = BANDS.filter(function (b) { return b.points === band.points + 1; })[0];
  return {
    percent: p,
    letter: band.letter,
    points: band.points,
    // The useful number: how close is this mark to being worth a whole grade
    // point more, and how much of the mark above it is being wasted.
    marksToNextPoint: toNext ? Math.max(0, toNext.from - p) : 0,
    wasted: p - band.from
  };
}

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------
// Dated, so the back end can say what is next rather than what exists.
// Built from the graduation year rather than written out, because every date
// below moves with it. Written-out years were correct for 2029 and would have
// quietly stayed at 2029 if the class ever changed, which is the same bug this
// project has already shipped twice.
function milestones(classOf) {
  const g = Number(classOf);
  if (!Number.isFinite(g)) return [];
  const grade10 = g - 3;     // the academic year now
  const grade11 = g - 2;
  const seventh = g - 1;     // seventh semester starts this September

  return [
    { date: (grade10) + '-10-01', by: 'now', title: 'Open a free NCAA Profile Page account',
      detail: 'Costs nothing, reserves the NCAA ID, and transitions to a full certification account later without losing it. NCAA tells students to register before Grade 9, so this is already late.',
      why: 'Needed before any official visit and before signing anything.' },
    { date: (grade10) + '-10-01', by: 'now', title: 'Check the high school in the NCAA High School Portal',
      detail: 'A course only counts if the SCHOOL holds an Eligibility Center account and lists that course as NCAA approved. If it has never dealt with the NCAA, a review is needed and it is slow.',
      why: 'Discovering this in Grade 12 is too late to fix. web3.ncaa.org/hsportal' },
    { date: (grade10) + '-10-01', by: 'now', title: 'Map every course against the NCAA Ontario sheet',
      detail: 'Applied, College, Open and Workplace level courses earn nothing. Kinesiology PSK4U and Exercise Science PSE4U are named as not approved, and they are exactly what a swimmer picks.',
      why: 'Luke\u2019s stated interest is exercise science and kinesiology. Those two courses are worth zero NCAA credit.' },
    { date: (grade10) + '-10-01', by: 'now', title: 'Confirm the age rule with the Eligibility Center',
      detail: 'The five year clock starts at the earlier of first enrolment, or the academic year after a 19th birthday that falls BEFORE 1 September. His birthday falls after that date, so the trigger does not fire the way it does for a summer birthday. He is on the favourable side of it.',
      why: 'That reading is arguable for a birth date after 1 September. Get it in writing before betting a year of eligibility on it.' },
    { date: (grade10) + '-11-01', by: 'this term', title: 'Confirm Grade 9 marks are on the transcript',
      detail: 'NCAA warns that many Canadian transcripts omit ninth year marks. Grade 9 core courses count toward the 16.',
      why: 'If they are missing, the Grade 9 school has to send them, and that takes chasing.' },
    { date: (grade11) + '-06-01', by: 'end of Grade 10', title: 'Upload the transcript after two academic years',
      detail: 'The guidance counsellor sends it. NCAA asks for it at this point.', why: '' },
    { date: (grade11) + '-06-01', by: 'end of Grade 10', title: 'Transition to a full certification account',
      detail: 'Academic and Athletics Certification, for Division I or II. A Canadian pays the international rate. NCAA has stopped publishing the amount; its last published figure was 160 USD in July 2024.',
      why: 'Must be complete before official visits and before signing.' },
    { date: (grade11) + '-06-15', by: '15 June ' + grade11, title: 'Division I and II coaches may reply',
      detail: 'Calls, texts and emails from coaches become permitted. Division II may also offer expense-paid official visits from this date.',
      why: 'Have the times, transcript and video ready BEFORE this date, not after.' },
    { date: (grade11) + '-08-01', by: '1 August ' + grade11, title: 'Division I off-campus contact and official visits open',
      detail: 'The first date a D1 programme may pay for a visit.', why: '' },
    { date: (seventh) + '-05-01', by: 'spring of Grade 11', title: 'Sit the SAT or ACT',
      detail: 'The NCAA dropped the test requirement in January 2023. The universities have brought it back, ie, Ohio State requires it of international freshmen and the Ivies have largely reinstated.',
      why: 'Two different bodies made two different decisions. The NCAA not needing it does not mean the university does not.' },
    { date: (seventh) + '-09-01', by: 'September ' + seventh + ', HARD', title: 'Ten core courses done, seven in English, maths and science',
      detail: 'The start of the seventh semester. After it, a course needed for this cannot be replaced or repeated for a better grade.',
      why: 'There is an argument this does not bind a student with solely international credentials, but Ontario schools can hold NCAA accounts, which sends them down the domestic path. Plan as if it applies. It costs nothing.' },
    { date: g + '-04-01', by: '1 April ' + g, title: 'Request the final athletics certification',
      detail: 'In the Eligibility Center account, for swimming, for a fall ' + g + ' enrolment. Do it even if other tasks are outstanding.', why: '' },
    { date: g + '-06-30', by: 'June ' + g, title: 'Graduate on time with the OSSD',
      detail: 'Sixteen approved core credits inside eight semesters from the start of Grade 9, ie, September ' + (g - 4) + ' to June ' + g + '. Minimum 2.3 core GPA for Division I, 2.2 for Division II.',
      why: 'The OSSD is the only proof of graduation the NCAA accepts from Ontario, alongside the Dipl\u00f4me d\u2019\u00c9tudes Secondaires.' }
  ];
}

// Kept for anything that wants the list without passing a year.
const MILESTONES = milestones(2029);

function nextMilestones(today, count, classOf) {
  const day = String(today || '');
  return milestones(classOf || 2029).filter(function (m) { return m.date >= day; })
    .sort(function (a, b) { return a.date.localeCompare(b.date); })
    .slice(0, count || 4);
}

function overdue(today, classOf) {
  const day = String(today || '');
  return milestones(classOf || 2029).filter(function (m) { return m.date < day; });
}

// The age rule, answered for one birth date rather than left as a worry.
//
// The clock starts at the EARLIER of first full time enrolment, or the start
// of the academic year following the 19th birthday, and the second only fires
// if the athlete turns 19 BEFORE 1 September.
//
// Returns what is known, and says plainly what is not. A birth date that falls
// after 1 September sits outside the clean case the rule was written for, and
// the reading is genuinely arguable. This function does not pretend otherwise.
function ageClock(birthMonth, birthDay, classOf) {
  const m = Number(birthMonth), d = Number(birthDay), g = Number(classOf);
  // Number(null) is 0 and Number('') is 0, both finite. Checking only for
  // finite let a missing birth date through and it answered confidently, which
  // is worse than declining to answer. Range-check instead.
  if (!(m >= 1 && m <= 12) || !(d >= 1 && d <= 31) || !Number.isFinite(g)) return null;

  // Before 1 September, ie, month 1 to 8, or 9 with a day before the 1st,
  // which cannot happen, so month 1 to 8 is the whole of it.
  const beforeSeptember = m < 9;

  return {
    turns19: 'the year of the 19th birthday',
    triggerFires: beforeSeptember,
    onTimeEnrolment: g,
    message: beforeSeptember
      ? 'The birthday falls before 1 September, so the clock can start on its own, ' +
        'whether or not he has enrolled. A delayed start costs eligibility.'
      : 'The birthday falls AFTER 1 September, so the trigger does not fire in the ' +
        'straightforward way it does for a summer birthday. That is the favourable side ' +
        'of the line.',
    confirm: 'The reading for a birth date after 1 September is arguable. Confirm it in ' +
      'writing with the NCAA Eligibility Center before deciding anything on the strength of it.'
  };
}

// ---------------------------------------------------------------------------
// The things families get wrong
// ---------------------------------------------------------------------------
const MYTHS = [
  { myth: 'Carding kills NCAA eligibility.',
    truth: 'It does not. NCAA Division I Bylaw 12.1.3.1 permits training grants from a national governing body, and Swimming Canada is one. The real constraint is Canadian: Sport Canada policy pauses Athlete Assistance Program payments for the months an athlete is attending a foreign institution on an athletic scholarship. Carding and a scholarship coexist, the money just stops during term.' },
  { myth: 'A 2.3 GPA is the target.',
    truth: 'A 2.3 core GPA clears NCAA eligibility and clears essentially nothing else. Admission and merit money at any school worth swimming for demand far more. In Ontario terms, 80 percent in all sixteen core courses is a perfect 4.0 NCAA core GPA, and still nowhere near enough for a selective American university.' },
  { myth: 'The NCAA dropped the SAT, so we do not need one.',
    truth: 'Two different bodies. The NCAA dropped it in January 2023. Many universities have since brought it back.' },
  { myth: 'A Canadian is exempt from English proficiency tests automatically.',
    truth: 'Usually exempt outside Quebec, but it is per school and has to be claimed. Michigan ties its exemption to an SAT or ACT score, so going test-optional there can force a TOEFL.' },
  { myth: 'A victory lap is harmless.',
    truth: 'Under the age-based rule adopted 23 June 2026 it can cost a full year of eligibility, and the waivers that used to cover it are gone.' }
];

const api = {
  RECORDED: RECORDED,
  LEVELS: LEVELS,
  NOT_APPROVED: NOT_APPROVED,
  HALF_CREDIT: HALF_CREDIT,
  DESTREAMED: DESTREAMED,
  ACCOUNTS: ACCOUNTS,
  WALK_ON_STILL_REGISTERS: WALK_ON_STILL_REGISTERS,
  accountFor: accountFor,
  CORE: CORE,
  AREAS: AREAS,
  areaOf: areaOf,
  auditCore: auditCore,
  BANDS: BANDS,
  MILESTONES: MILESTONES,
  milestones: milestones,
  ageClock: ageClock,
  MYTHS: MYTHS,
  checkCourse: checkCourse,
  convertMark: convertMark,
  nextMilestones: nextMilestones,
  overdue: overdue
};

if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof window !== 'undefined') window.Eligibility = api;

})();
