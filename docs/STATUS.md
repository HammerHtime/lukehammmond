# Status

## Done
- The swim data core. Events, courses, time parsing, personal bests.
- Luke's 35 results, transcribed from SwimCloud 3306753 on 18 September 2026.
- Metres to yards conversion, derived from the ten pairs Andrew supplied.
- The board. 17 schools, their benchmarks, the scoring engine, the what-if.
- NCAA contact rules and the interest email draft.
- The school importer, which merges a pasted staff directory without creating
  duplicates and never lets a blank overwrite a verified contact.
- 120 checks, green.

- The public page. Andrew's own hand-built design is kept exactly as it was,
  ie, the ripple hero, the flip cards, the gallery, the reveal animations.
  live-profile.js replaces only the parts that went stale. The page used to
  show 2:00.73 for the 200 free months after Luke swam 1:59.75. It now reads
  from the same results the back end writes.
- A short course yards panel on the public page, because an American coach
  reads yards and will not do the arithmetic himself.
- admin.html, the back end. Add a swim in about four taps on a phone, and it
  tells you what changed, ie, personal best, what moved on the board, and
  where the swim sits against the Junior Trials cut.
- Coach visit logging from the ?c= link in each email. A count against a
  school id and a date. No IP address, no user agent, nothing about the reader.
- All seventeen coach contacts, read off each school's own athletics site on
  18 September 2026, each carrying the page it came from.

## The full roster, 18 September 2026
442 NCAA programmes sponsor men's swimming: 137 Division I, 77 Division II,
228 Division III. Generated from the NCAA's own membership directory rather
than assembled by hand, and cross-checked against a separate pass that
verified schools against 2026 conference championship team standings.

Ten spot checks agreed across both methods, including the cases that trip up
every published list. Liberty is absent, ie, its men's team is a club not a
varsity programme, and it is the single most common error in public lists.
Michigan State, Cal Poly, Lindenwood men's, Iowa and UConn are all correctly
absent. Stonehill, VMI, Queens and Southern Indiana are all correctly present.

The roster is the universe, not the board. The board stays the short list
being actively worked, with contacts, benchmarks and a recorded priority.
Adding a school from the roster starts it with none of those, and it reads
"Not assessed" until they are researched, rather than pretending.

## What the D2 research changed about where he stands
Division II distance is much faster than the conference results suggested.
The D2 1650 record is 14:55.42 and sixth at the 2026 national meet was
15:14.66. Luke's 16:24 equivalent is roughly a minute off national scoring.

That does not make the board wrong, it makes it precise. He is a genuine
contributor at mid-table D2 on conference times, which is what the board says.
He is not a top-tier D2 distance recruit, which the board never claimed.

The more useful finding: his 400 IM of 4:12.90 is his most marketable event,
because IM depth is thinner than distance free depth across most of D2. The
board should probably lead with it. That is a decision for Andrew.

## Deliberately not built, and not a problem
- Sending. netlify/functions/send.js is not written, and it does not need to
  be. Andrew decided on 18 September 2026 that nothing goes out until spring
  2027, after another season. The admin screen drafts each email and opens it
  in his own mail app, which gets better replies anyway because a coach
  answers the athlete rather than a no-reply address.
  The domain question is therefore parked, not open. Revisit in spring.

## Blockers and open questions

### Sending needs a domain, PARKED until spring 2027
Still true, just not urgent. Any sender needs a domain verified for email and
a netlify.app subdomain cannot be. Since nothing is sent until spring, this is
a spring problem. Buying a domain early would only mean paying for it longer.

### Bucknell, engine versus recorded
The board records Bucknell as P3. The engine reads it P2, because the recorded
benchmark is 15:46, the slower end of their distance group, rather than 15:35.
The board reports the disagreement rather than picking. Andrew decides which
end of the group is the benchmark.

### Automatic monitoring of roster times
The goal is that the back end watches each programme's current results and
keeps the benchmarks fresh. SwimCloud sits behind Cloudflare and refused every
request from this environment. A Netlify function runs from a different
network and may do better, but it should not be assumed. Until then benchmarks
carry a benchmarksCheckedOn date and go stale visibly rather than silently.

### Two schools have no swimmer times
Loyola Maryland and Hamilton read "Not assessed". Six of the original eight
now carry real 2026 conference results, ie, the MAAC Championships and the
Liberty League Championships, each citing the meet it came from.

### Four schools now disagree with their recorded priority
This is the engine doing its job, and each one is a decision for Andrew.
- RPI, recorded P2, reads P1. Luke sits inside their distance group in all
  three events.
- Fairfield, recorded P3, reads P1. They won the 2026 MAAC men's title and he
  still lands inside their range. The deepest programme on the board, so this
  one is worth a proper look.
- Iona, recorded P3, reads P1. Their 500 conference record holder stopped
  competing, ie, the distance group got softer.
- Bucknell, recorded P3, reads P2, because the recorded benchmark is 15:46
  rather than 15:35.

Worth knowing about Manhattan: his times would make him the fastest man in
every distance event there immediately, and his mile would sit within a
fraction of a second of an eight-year-old school record. They finished ninth
of nine MAAC men's teams. That cuts both ways and is a conversation, not a
verdict.

### Coaching staff go stale fast
Five of the seventeen changed head coach in the last eighteen months, and
search engines still return the old name for four of them. Ithaca, Marist,
Bucknell, American and St. Bonaventure all carry a warning in contactNote.
Re-check verifiedOn before a send rather than trusting it forever.

### Numbers that need confirming
- The Canadian Junior Trials cuts were carried over from the existing profile
  page, not read from Swimming Canada. standards.js flags them unconfirmed.
- The NCAA Division II contact rule. Published guidance disagrees. The app uses
  the later, safer date and marks it unconfirmed.
- The conversion factors are derived, not official. Replace them with the NCAA
  table when it can be read from source.
- The national rankings on the profile came from the existing page. Confirm
  against Swimming Canada before quoting them to a coach.

### The old page is out of date
lukehammond.netlify.app still shows March 2026 bests. The 200 free is now
1:59.75 and the 400 is 4:10.86. That staleness is the problem this back end
exists to solve.
