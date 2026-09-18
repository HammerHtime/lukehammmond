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
    npm test          120 checks
    npm run lint      confirms every js file still parses
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

## Files
- index.html      The public profile. What a coach reads. NOT YET BUILT.
- admin.html      The private back end. NOT YET BUILT.
- swim.js         Events, courses, time parsing, personal bests. The data core.
- swimmer.js      Who Luke is, and every swim on record.
- convert.js      Metres to yards. Every factor carries the pair it came from.
- standards.js    Time standards, ie, the Canadian Junior Trials cuts.
- schools.js      The board's schools, their benchmarks, contacts, importer.
- board.js        The engine. Scoring, fit bands, what-if.
- recruiting.js   NCAA contact rules and the interest email.
- board.test.js   The safety net. Run after every change.
- netlify/functions/  The server side. Netlify Blobs storage behind an admin key.

## The dates that matter
Luke is class of 2029, ie, Grade 10 now. Under NCAA Division I rules a coach
cannot reply to him until 15 June 2027. He may write at any time and many
coaches keep a file. The app says this on screen so silence is not read as
rejection. Re-verify the rule before that date rather than trusting today's.

## Writing conventions, for anything a user sees
- Canadian spelling.
- No em dashes and no en dashes. Use "ie," instead.
- Short sentences.
