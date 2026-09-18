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

## Not built yet
- index.html, the public profile a coach reads.
- admin.html, the back end for entering a time and working the board.
- Sending. netlify/functions/send.js is not written. See the blocker below.
- Coach visit tracking from the ?c= link in each email.

## Blockers and open questions

### Sending needs a domain
Andrew chose "the site sends it." Resend, or any sender, needs a domain that
is verified for email. A netlify.app subdomain cannot be verified. Until a
domain is owned and verified, nothing can actually reach a coach, and mail
from an unverified sender lands in spam anyway. A draft-in-your-own-email
fallback is the honest interim, and it gets better replies regardless, because
a coach replies to the athlete rather than to a no-reply address.

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

### Eight schools have no swimmer times
Saint Peter's, Manhattan, Clarkson, RPI, Fairfield, Iona, Loyola Maryland and
Hamilton read "Not assessed". Gathering their distance times is the highest
value research left, because six of them are already recorded P1 or P2.

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
