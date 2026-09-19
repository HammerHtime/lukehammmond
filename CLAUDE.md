# CLAUDE.md — Luke Hammond, swimming recruiting

Read this first, every session.

## What this is
A recruiting site for one swimmer, and the board behind it.

The public page is what a college coach reads. The private back end is where
Luke's times go in, and where the board gets re-scored.

## The core idea, the whole product in one line
Take the times Luke actually swam, convert them to the yards American coaches
race in, compare them against what swimmers at each programme are actually
doing, and report the gap. Then say what a given time drop would unlock.

That last part is the point. Not "you are eight seconds off Niagara" but
"four seconds off the 500 moves Niagara and Ithaca to P1."

## The golden rule: the board is the engine
board.js decides nothing about whether Luke is good enough. It computes gaps
and suggests. Priority stays a human call. When the engine and the recorded
priority disagree, the board says so rather than overriding. That disagreement
is a prompt to look again, ie, it is the feature.

- Presentation, wording and layout are open to edit.
- Scoring, bands, conversion factors and benchmarks are not, without a reason
  written down first.
- After ANY change, run the tests. They must stay green:
    npm test          1223 checks
    npm run lint      confirms every js file parses, functions included
    npm run check     lint then test, run this before pushing

## Three ideas that run through everything
1. **Priority is relevance, not quality.** P1 does not mean a better school
   than P2. It means his times overlap that programme right now.
2. **Confidence is about the evidence, not the odds.** High confidence means
   we have real times from real swimmers there. It says nothing about whether
   he gets recruited. Keeping those apart is why the column exists.
3. **A benchmark is only as good as what it was drawn from.** Beating a
   conference champion is a different statement from sitting inside roster
   depth. Every benchmark carries its basis and the engine never treats them
   as the same thing.

## Silence is not a verdict
A school with no swimmer times gathered reads "Not assessed" and gets no
suggested priority. A missing Junior Trials cut shows nothing. An event with
no conversion mapping shows a dash. Never a zero, never a guess. The moment
this app invents a number it is worth less than the spreadsheet it replaced.

## What gets deployed
Only public/. Nothing else.

This is not a style choice. The publish root used to be the whole repository,
with a redirect per file that had to stay private, and it failed in production:
Netlify serves files case-insensitively but matches redirects case-sensitively,
so /schools.JS returned the whole board, ie, ninety coach addresses and every
benchmark, while /schools.js correctly 404ed. A blocklist cannot be tested for
the file nobody remembered to add to it. An allowlist can, and board.test.js
now asserts the shape of public/.

So: a new file is private unless it is deliberately put in public/.

## Files
- public/index.html   The public profile. What a coach reads.
- public/admin.html   The private back end. Opens on the dashboard.
- public/onepager.html  The printable one page for coaches. Reads live data.
- public/charts.js    Progression charts and the split panel.
- public/dashboard.js Counts the board, ages the data, builds the queue.
- schools.js      NOT deployed. The board's schools, benchmarks and contacts.
- swim.js         Events, courses, time parsing, personal bests. The data core.
- swimmer.js      Who Luke is, and every swim on record.
- convert.js      Metres to yards. Every factor carries the pair it came from.
- standards.js    Time standards, ie, the Canadian Junior Trials cuts.
- board.js        The engine. Scoring, fit bands, what-if.
- recruiting.js   NCAA contact rules and the interest email.
- board.test.js   The safety net. Run after every change.
- netlify/functions/  The server side. Netlify Blobs storage behind an admin key.

## The plan, decided 18 September 2026, revised 19 September 2026
The original plan said nothing is sent until SPRING 2027, on the reasoning that
a coach cannot reply until 15 June 2027 anyway.

That reasoning holds for Division I and for nobody else. Read directly from the
sources on 19 September 2026:

- NCAA Division II dropped its communication restriction on 1 August 2024. Its
  own 2026-27 recruiting guide says athletically related recruiting materials
  may be sent at any time to a freshman or sophomore. Only in-person off-campus
  contact and paid visits wait for 15 June 2027.
- NCAA Division III Bylaw 13.02.10.1: there are no restrictions on the timing of
  electronic communication at all.
- U SPORTS has no calendar over it and never did.

Of the 64 programmes on the board, 40 can be written to today and can legally
write back. 24 are Division I and wait. The app had been telling Andrew that
none of them could answer before June 2027, which was wrong for 40 of them.

So the plan now splits. Division I is still a spring 2027 arrival, for exactly
the reason above. Canada, Division II and Division III are live work this
autumn. The NAIA has not been read and keeps the later, safer date until it is.

What that means for this project between now and then.

Everything is preparation. The job is to arrive in spring with a board that is
accurate, a page that is current, and every answer a form will ask for already
on file. Not to send anything.

So:
- Sending is NOT a blocker. netlify/functions/send.js is still unwritten and
  that is fine. Do not push Andrew towards a verified sending domain until
  spring is close. The drafts open in his own email, which gets better replies
  anyway.
- The thing that matters most is boring and already built: entering a time
  after each meet. Every swim this season moves the board, and the board in
  spring is the product of that habit. Protect it.
- The questionnaire answer sheet should be full before spring, not during it.
  Finding a guidance counsellor's phone number in March is easy. Finding it
  the week you are trying to send thirty emails is not.
- Anything with a lead time, ie, NCAA Eligibility Center registration, tests,
  transcripts, gets done on its own schedule, not in the spring rush.

## The dates that matter
Luke is class of 2029, ie, Grade 10 now. Under NCAA Division I rules a coach
cannot reply to him until 15 June 2027. He may write at any time and many
coaches keep a file. The app says this on screen so silence is not read as
rejection. Re-verify the rule before that date rather than trusting today's.

## Writing conventions, for anything a user sees
- Canadian spelling.
- No em dashes and no en dashes. Use "ie," instead.
- Short sentences.
