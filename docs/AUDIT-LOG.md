# Audit log

Things that need Andrew's attention, and things that could not be fully tested.

Written by Claude after each change, under the standing rule in CLAUDE.md. If a
feature could not be proven end to end, it is listed here rather than reported
as done.

Newest first.

---

## 1 October 2026, a coach could not contact Luke from the page

**Found because Andrew asked how a coach would contact Luke.** Nobody had
noticed: from 19 September to 1 October 2026, "Click to reveal email" did
nothing. The script behind it was removed by mistake on 19 September, in the
commit that stripped the old editor out of the page, and nothing tested the
link. There was no other address anywhere on the page. A coach who wanted to
write to Luke for twelve days had no way to do it from his site.

**Fixed.** Tapping it now shows Luke's address and opens an email to him with
Andrew copied, which is what it did before 19 September. The address now stays
on screen after the tap. It used to vanish after four seconds, which left a
coach with no mail app nothing to copy. A "Get in touch" button now sits in the
first screen and goes straight to the contact card. Before, contact was only at
the very bottom. The handler runs in its own guarded section, from the data, and
a browser test clicks it at desktop and phone widths and checks the email app
is asked to open.

**Found on the way.** The data had two entries called contact. The second, with
empty fields, silently replaced the first. Merged into one.

## 1 October 2026, school, average, height and the meet calendar

From Andrew: Silverthorn Collegiate Institute, an 81% Grade 9 average, 6 ft,
and the club's 2026-27 meet calendar.

- **School and program**, on the card, in About, in the email and the
  one-pager. Silverthorn is a TDSB hub school for the High Performing Athletes
  program, checked on tdsb.on.ca: it takes students recognised at provincial or
  national level who train 15 hours a week or more, and builds the timetable
  around training. The data had it as "High Performer Program", which is not
  its name.
- **81% and 3.5.** Both shown: Canadian coaches read the percentage, US coaches
  a GPA. They agree. The NCAA's Ontario sheet scores 80 and up as 4 and 70 to
  79 as 3, so an 81 average of 80s and 70s lands near 3.5.
- **Height** in feet and centimetres. Andrew chose to show it.
- **The meet calendar is private.** It is in meets.js at the repository root,
  outside public/, served only by an admin-key function, and feeds one line of
  the coach email: "My next meet is the X in Month Year", with a warning to
  check Luke is entered, because it is the club's calendar and not his entry
  list. The sheet's title read 2025-2026; Andrew sent it as this season's. A
  test fails if any meet name or pool from it appears in a public file.
- **The email.** The rankings now say the group and season once, under the
  list, not on every line, which saved about 25 words and keeps it under 320
  with the new lines in.

---

## 1 October 2026, what coaches want, checked against the site

Three research agents looked at personal recruiting sites, US coach needs and
Canadian coach needs. The findings and sources are in docs/RECRUITING-RESEARCH.md.

### Built

1. **Short course metres table on the front page.** U SPORTS races short
   course, and the page showed long course only. Ten events, each with the meet
   and date, and the CSCA TAG short course rank where the list printed that
   exact time. Seven do. Three bests have improved since the list closed.
2. **The short course milestone was half wrong.** It said #3 in the 400 and 800.
   Volume 2, read off csca.org, has #3 in the 800 and #4 in the 400. Corrected.
   Andrew had chosen to leave it because it could not be checked. It can now,
   and a coach can check it too.
3. **The Junior Trials cuts are confirmed,** against Swimming Canada's own
   2026-2028 table. They matched. The same table shows his 800 is 0.32 seconds
   off the Canadian Open long course standard.
4. **The links go to the sources.** "Swimming Canada Rankings" went to Swimming
   Canada's home page. It now links the CSCA rankings page and the ID Team list,
   plus the printable one-pager.

### Found while testing it on a phone, and fixed

- **The short course table lost its event column on a phone,** because a rule
  meant to hide the results table's date column hid the first column of any
  table with that style. Scoped to the results table.
- **The page scrolled sideways on phones.** The results table was 20px too wide
  at 390px, and the charts held their column 14px too wide at 360px and 320px.
  Both fixed. A browser check now fails if the page is wider than the screen at
  320, 360, 390 or 414.

### For Andrew

See the reply on 1 October for the list: the Ontario percentage average, a race
video, the NCAA ID, and three decisions, ie, height, the school name, and the
club coach's contact details.

---

## 1 October 2026, Lakeshore until 2026, Mississauga now

**Andrew confirmed Luke swam for Lakeshore Swim Club until 2026 and swims
for Mississauga now.** The move was already in the data, but no page said so.
Every time and ranking on the site was swum for Lakeshore, and the CSCA TAG
rankings and both ID Team lists show him under LSC. A coach checking those
lists against a page that only says Mississauga would find two clubs.

**The name.** Andrew wrote "Mississauga Swim Club". Swimming Canada's national
lists carry one Mississauga club, Mississauga Aquatic Club, code MSSAC, which
is what the site already used, so the name stays. The short code in the data
read "MSC" and now reads MSSAC. It is not shown anywhere. **If Luke's club is
a different club from MSSAC, Andrew should say so.**

**Where the line now appears, all from the data, none typed by hand:**
- About Luke: "Swam for Lakeshore Swim Club until 2026, so every time and
  ranking on this page was swum for Lakeshore, which is the club the national
  lists show."
- The rankings footnote: "Swum for Lakeshore Swim Club (LSC)".
- /v2.html, the same sentence in About.
- The one-pager, under the club name.
- The coach email: "I swam for Lakeshore Swim Club until 2026, so that is the
  club you will see on my results." Its own sentence, with the club named in
  full, because "LSC" means nothing to an American coach.

An old test stopped the former club being typed into the pages by hand, and
it still does, now across five files. A new test checks the line is stated,
from the data, on all four surfaces.

---

## 1 October 2026, the ID Team, second year running

**Andrew said Luke was named to the Swimming Canada ID Team again.** Checked
against Swimming Canada's own published lists before anything went on the page:

- Male NDTP ID Team 2026: Hammond, Luke, LSC, ON, boys born 2011, 400 free.
- Male NDTP ID Team 2025: Luke Hammond, LSC, ON, boys born 2011.

The 2025 events are not stated on the site. The table wraps in that PDF, and
from where the words sit his events look like the 50, 200, 400 and 800 free,
but the 800 cannot be read for certain.

**What changed.** The About paragraph says two years running, 2025 and 2026.
A 2026 milestone was added above the others, and the 2025 one was renamed.
The recognition data, which /v2.html and the one-pager read, records both
years, the 2026 event, and the source URL.

**A naming fix on the way.** The site called it the "Swim Canada National ID
Development Program". The national body is Swimming Canada and the programme
is the National Development Program ID Team. Five more places said "Swim
Canada" for the national body, ie, the goals, the chart caption and a link
label, and all now say Swimming Canada. A test fails if either old name comes
back.

---

## 30 September 2026, the rank badge sat in two different places

**Found by Andrew, from a screenshot of the time cards.** On the 100 free
(55.88) and the 50 free (25.96) the "in Canada" badge sat beside the time. On
the other eight it sat underneath. The badge flowed inline, so a short time
left room for it on the same line and a long one pushed it down. When it
wrapped it also kept its left margin, so it sat indented from the time.

Now it always sits under the time, lined up with it, with the same gap on
every card. Measured in a browser on all ten cards at 1440px, 1000px and 390px.

The times were checked too. All ten match the CSCA TAG list. The lighter 50
free card in the screenshot was the hover highlight.

---

## 30 September 2026, the external audit, checked claim by claim

Andrew sent two reviews: a detailed code and security audit, and a shorter UX
guide. Every claim was checked against the code before anything was built.

### Built

1. **Chart.js, its date add-on and the QR library now load from this site.**
   A CDN failure took the charts down during a test run on 29 September. Each
   file was checked against a second, independent source. One thing surfaced:
   the CDN's "chart.umd.min.js" was its own re-minified copy, not a file
   Chart.js publishes. The site now serves the published file, whose npm
   integrity hash matched the registry. The QR file still matches the security
   hash the page already pinned.
2. **The front page fonts, Bebas Neue and DM Sans, are served from this site.**
   No Google request, so no third party is told a coach opened the page.
3. **The content policy names no outside host at all.** Scripts, styles and
   fonts from this site only.
4. **The profile store takes rankings and the club coach, nothing else.**
   Anything else is refused and named. Ranks must be whole numbers and events
   must be real ones. The coach email must look like an email. Capped at
   64 KB. It used to store any object, and whatever it stored was public.
5. **Every swim is checked on the server before it is stored,** by the same
   rule the admin form runs. Capped at 2,000 swims and 1 MB. All 129 swims on
   record pass, and they still pass after being checked twice, so a save from
   the phone after a meet cannot start failing.
6. **Photo uploads must be the image they claim to be,** read from the first
   bytes. The admin page always re-encodes to JPEG and says so, so real
   uploads are unaffected.
7. **The link preview is a 1200 by 630 card, 163 KB,** cropped so Luke is alone
   in his lane. It was the full 587 KB photo with the next swimmer along the
   bottom edge.
8. **Chart tooltips answer a tap near a swim.** It used to take a direct hit
   on a four-pixel dot. The same near-miss tap showed nothing under the old
   setting and the swim under the new one.

**New test, functions.test.js, in npm test.** It runs the real server
functions against an in-memory stand-in for the store and sends them real
requests. Until now every back-end check read the source as text.
**pages.e2e.js** now serves the pages under the real content policy with every
outside request cut off: all four pages reach nothing outside the site, the
policy refuses nothing, both charts draw, both fonts load and the QR draws.

### Already done, so not rebuilt

- **noindex on /v2.html and the one-pager.** Both have carried it since they
  were built. So has admin.
- **Gallery and About photos load full-size JPEGs.** They load the 900px WebP
  copies. The JPEG is only the fallback for browsers without WebP.
- **Charts do not scale on a phone.** Fixed on 28 September, tested at 390px.
- **Engine versus recorded priority must be loud on the phone card.** It is an
  amber tag on the school card itself, plus a count on the dashboard.
- **A what-if tool.** The admin page has one, "What a drop would unlock".
- **A stale-benchmark queue.** The dashboard already flags schools past 300
  days since their times were checked.
- **A one-pager a coach can file.** Built, with a QR, and it prints to PDF
  from any browser.
- **A coach landing for one school.** The signed school link does this. It
  waits for spring 2027 with the rest of sending.
- **Search and filters on the admin page.** Course, stroke and distance chips.

### Wrong, so not acted on

- **"Flip cards hide the times and ranks behind hover on a phone."** The time,
  the rank and the date are all on the front. The flip is a tap, with a "tap
  to flip" label. The back holds only the meet name.
- **"The logo sits under the iPhone notch."** The page does not ask to draw
  under the notch, so iOS keeps it clear. Nothing to fix.
- **"Coach visits are logged through the ?c= link."** Visit tracking was
  removed on Andrew's instruction on 24 September. The finding describes code
  that no longer exists.
- **"Dashboard, roster and eligibility pages need adaptive grids."** Those are
  calculation modules, not pages.
- **"1332 checks" and "no node_modules, so tests could not run."** The suites
  need nothing installed. They ran from the zip: 1,418 checks then.

### Agreed, but not now

- **Coach link signatures break if the admin key is rotated.** True. Nothing is
  sent until spring 2027. Written into STATUS under "Before the first coach
  email", with the key-length point and the forwarded-link note.
- **No limit on key guesses.** True, and a long random key makes it moot. In
  STATUS: check the key is 32 or more random characters.
- **A light theme toggle, CSV export, live syncing.** Declined. The site is
  dark by design, SwimCloud already exports his results and the one-pager is
  the printable export, and one person edits the board, so there is nothing to
  sync.
- **A public what-if teaser.** Declined. It would show coaches which schools
  he is aiming at, which is the board's private side.
- **A Junior Trials season plan page.** Parked. The admin already shows the gap
  to the cut. A plan by meet is a later piece of work, if it is wanted.

### For Andrew

- **Teammate photo.** The audit points out that if the teammate in the gallery
  is also a minor, their family's okay matters as well as yours. Your decision
  to keep the gallery stands. This is only passed on.

---

## 30 September 2026, three open items closed by Andrew's decision

Andrew said he is good with all three as they stand. Do not raise them again
unless he does.

1. **The short course milestone** ("CSCA TAG Rankings, #3 Canada, 400m and
   800m free, SCM") stays on the front page as written. It is from an earlier
   volume that has not been checked here. Andrew's call.
2. **The gallery** keeps its current photos, including the second podium shot
   and the deck photo with a teammate.
3. **/v2.html** stays a separate page. It does not replace the front page.

---

## 29 September 2026, the charts under the wrong heading, and the menu

**Found by Andrew, from a screenshot of the live page.** "Performance Over
Time" and its line about the Junior Trials dashed line were followed straight
away by the Season by Season cards. The charts that heading describes sat
below the cards, which at laptop width is a full screen further down. It read
as a heading with no chart.

It was built that way, not broken: the season block was placed between the
heading and the charts. Now the charts come straight after their heading and
the season cards follow them. Checked at 1000px, 1440px and 390px wide.

**Found while rendering that section: the menu did not fit laptop windows.**
From about 900px to 1040px wide the logo ran into ABOUT with no space between
them, and at 920px to 960px the last link, Recruit, went off the right edge of
the screen. An iPad held sideways is 1024px. The compact menu now starts at
1080px and the menu button takes over below 820px. The logo has at least 70px
of clear space at every width measured, the menu button opens and closes at
810px, 780px and 390px, and following a link from it lands on the section.

Both are covered by tests now, and I put the old order back on purpose to
confirm the test fails on it.

**Checked and left alone.** The drop under each chart title uses a true minus
sign, not an en or em dash, so it stays. While testing, the season cards
disappeared once at 1180px. That was this container's network dropping one of
the site's own files, not the site. When the files load, all five cards render
at every width.

---

## 29 September 2026, the national rankings, from a named list

**Andrew sent the CSCA TAG Rankings, Volume 4, September 2026.** Luke is ranked
in ten long course events, Boys 13-14, for the season 1 September 2025 to
31 August 2026. The list runs 50 deep.

| Event | Rank | Time |
|---|---|---|
| 400 free | 4 | 4:10.86 |
| 800 free | 4 | 8:43.49 |
| 1500 free | 5 | 16:59.80 |
| 200 free | 6 | 1:59.75 |
| 200 back | 10 | 2:14.23 |
| 400 IM | 13 | 4:52.37 |
| 100 free | 18 | 55.88 |
| 100 back | 33 | 1:04.17 |
| 200 IM | 35 | 2:19.92 |
| 50 free | 46 | 25.96 |

Every time the list printed matches his best on this site for that event in
that season, so each rank is for a swim on this site. The list shows him under
LSC, ie, Lakeshore, which is right for the season it covers.

### What was wrong before

**The ranks in the code were higher than the published list.** They had been
copied from the old profile page on 18 September with a note saying to confirm
them before quoting. The 400 free said #2 (list: #4), the 800 said #3 (#4) and
the 200 said #4 (#6). The new front page led with "#2 in Canada". That is the
number a coach would have checked first.

**The live back end was already partly right.** Someone had saved #6, #4, #4
and #5 for the four distance events through the admin page. But four more it
held do not match the list (50 free #20, list #46; 100 free #15, #18; 200 back
#9, #10; 400 IM #11, #13) and two ranked events were missing (100 back, 200 IM).
I cannot write to the back end from here. **See "for Andrew" below.**

**My new page ignored the back end.** /v2.html read the ranks in the code only,
so it kept showing #2 after the back end had #4. Fixed. It reads the back end
the same way the live page does.

**One sentence was no longer true.** The profile data said he was "ranked
inside the top five across four distance freestyle events". With the 200 at #6
it is three. Rewritten.

### Found while testing, and fixed

**One CDN hiccup blanked most of the front page.** The page drew every section
in one chain with the charts in the middle. When a chart add-on failed to load
from its CDN during a test run, the error stopped the chain, and the time
cards, the rankings, the results table, the yards panel and the gallery never
drew. That was live for anyone whose connection dropped that one file. Each
section now runs on its own, and a test fails if any section is added outside
that guard. I broke it on purpose to check the test catches it. It does.

**The test for the no-script copy checked times but not ranks.** That is how
"#2 in Canada" sat in the page markup unnoticed. It now checks both.

### What changed

- One list of ranks, with its source, group and season. The four headline
  events no longer carry a second copy of the numbers.
- Where a rank came from the list, the page names the list and the group.
  Where it was typed in by hand, the page says "for age" and claims no source.
- The hero badge counts distance freestyle only, so it reads "Ranked Top 5 in
  Canada · 3 Distance Free Events". Counting all ten would have made the #46
  in the 50 free set it, ie, "Top 46", which is true and says nothing.
- The hero strip shows the three best ranked headline events (400, 800, 1500)
  instead of the first three in the list, which would have led with the 200 at
  #6 and dropped the 1500 at #5.
- The coach email names the group and season: "ranked #4 in Canada for 13-14
  boys in 2025-26". By the time it is sent he is in the next age group, and a
  bare "#4 in Canada" reads as a claim about now. It does not say "last
  season", which would go wrong a year later.
- /v2.html has a ranked list, all ten, in rank order, with the source under it.
- The one-pager prints the source under the times. It also had an em dash in
  the yards column, removed.
- A milestone for the Volume 4 list on the front page.

### The photo

The About Luke photo on the live front page was the podium shot with the gold
medal. It is now the freestyle race shot, cropped and zoomed so he is alone in
the frame. At the first crop the swimmer in the next lane's face was the second
thing you saw, so the zoom takes her out. My change yesterday went to /v2.html
only. Andrew meant the live page, and asked whether it had changed.

### Tested end to end

`npm run e2e` renders the real pages in Chromium against three back-end states:
nothing saved, the ranks the live back end holds today, and ranks saved from
the new fill button with one box cleared and one typed by hand. It checks the
hero, the strip, the badge, the sentence, the footnote, the no-script copy, the
ranked list at phone width, the admin save payload, the one-pager, and the
front page with the chart add-on blocked. Not part of `npm test` because it
needs Chromium.

### For Andrew

1. **Done 29 September.** Andrew filled from the list and saved. Read back from
   the live back end: all ten ranks match the list, each carries its source and
   group, and the coach details survived the save. The live front page reads
   "Ranked Top 5 in Canada · 3 Distance Free Events", the strip reads #4, #4,
   #5, and the footnote names the list. /v2.html leads with "#4 in Canada,
   13-14 boys" and lists all ten with the source.
   Original instruction: **Open the admin page, go to National rankings, tap
   "Fill from the published list", then tap Save.** Two taps. That replaces the four stale ranks, adds
   the two missing ones, and stamps each one with its source so the public page
   can name the list. Nothing saves until you tap Save, so you can clear any box
   first if you would rather not show, say, the #46.
2. **The short course milestone** on the front page says "#3 Canada, 400m and
   800m free, SCM" from the CSCA TAG Rankings. I have not seen that list, so I
   cannot confirm it. If you have Volume 2, send it and I will check it the
   same way.
3. **The gallery** still has the second podium shot and the deck photo with a
   teammate. Only the About photo was changed.

---

## 28 September 2026, a second front page, built and rendered before it moves

**Nothing has replaced the live page.** `public/v2.html` is a separate file at
`/v2.html`. `index.html` is untouched. This entry is the audit of the new one.

### What it is

Andrew asked for a front page that stands out rather than looking like every
other swimmer profile. Those are all built the same way, ie, a hero photo, a big
name, a story. Luke's content is not a story. It is evidence, so the new page is
built like a timing console: dense, aligned, monospaced numerals, hairlines
instead of cards, and two accent colours with one job each. Gold is only ever
Luke's own number. Aqua is only ever structure and labels.

The hero leads with 4:10.86, not with his name. The name is underneath.

Every number on it is read from the same modules the live page reads. Nothing is
typed into the page.

### Tested end to end

Rendered in a real browser at 1440px and at 390px, with the real fonts, and read
back:

- No console errors beyond `/api/results`, which has no key in this container.
- No horizontal overflow at either width.
- The hero fits the first screen at both, ie, 748px of 900 on desktop, 685px of
  844 on a phone.
- The improvement curve draws itself when it is scrolled to, and is fully drawn
  and readable with reduced motion turned on.
- All four nav links land below the sticky bar rather than under it.
- Both buttons sit on one line and pass contrast.
- No em dashes and no en dashes in the rendered text.

### What I found and fixed while testing it

1. **An en dash in the yards column.** The house rule bans it, and in a column
   of times it read as a minus sign. Medley events have no accepted yard
   conversion, so those cells are now empty and the lede says why.
2. **The column header said "Since 2023".** The number is each event's total
   drop, and most of those events did not start in 2023. It now says "Dropped".
3. **"Off the Junior Trials cut" meant the opposite of "off the 400 free."** One
   was time taken away, the other time still to find. Now "Taken off the 400
   free" and "Still to find".
4. **The curve was unreadable on a phone.** One drawing scaled down shrank every
   label with it. A narrow screen now gets its own, taller geometry.
5. **The hero ran past the fold on a phone**, because a portrait crop of a
   landscape action shot is very tall. It goes wide on small screens.
6. **The nav went completely blank on a phone.** It now keeps the one link a
   coach actually wants, ie, Contact.
7. **Anchor links landed under the sticky bar.** Fixed with a scroll margin.
8. **A value label sat on top of the Junior Trials line.** It now moves under
   its dot when it would collide.
9. **The fonts came from Google.** They are now served from this site. A coach
   opening the page should not have a third party told about it, and a font on
   someone else's URL can go missing. Adds 220 KB to the deploy, of which about
   120 KB is actually fetched.

### Photos, changed 28 September on Andrew's word

The hero is now the backstroke competition shot and the About section has the
freestyle one. They traded places.

Two things had to change with it. The hero caption used to be generated from the
fastest time, so it would have said "400 Free LCM" under a photo of a backstroke
race. It is now a caption about the photo, and the meet and date for that time
moved up under the claim, where they belong. I also wrote "lane four" in that
caption, could not tell the lane from the photo, and took it out.

Of the five photos on the site only two work as a hero. The other three are a
podium shot, a second podium shot and a deck snap. All three are shirtless, and
two of them have other people's children in frame. Andrew is finding more.

### Still open, for Andrew
- **The page needs JavaScript.** With scripts off it renders the headings and
  nothing else, ie, no times. Same as the live page. Worth fixing only if a
  coach is ever likely to browse with scripts off, which is unlikely.
- **Nothing has been swapped.** Look at `/v2.html` beside `/` and say whether it
  replaces the front page, or whether pieces of it get folded into the current
  one instead.


## 28 September 2026, the charts were eating the page

**Found by finally looking at the site with the real charting library running.**

### What was wrong

Both progression charts had grown to about **6,500 pixels tall**. The page was
**16,621px instead of 10,273**, ie, roughly six extra screens of empty dark blue
between the charts and the rest of the page. It had been live for nine days.

charts.js runs Chart.js with `maintainAspectRatio: false`, which tells it to
size the canvas to fill its container. The container was a grid cell with no
height of its own, so it took its height FROM the canvas. Canvas grows, cell
grows, canvas grows.

Fixed: each canvas now sits in a `.chart-box` with a real height, 240px on
desktop and 200px on a phone. Page is back to 10,286px and the charts render
properly.

### Why I did not catch it, which matters more than the bug

**Every browser check I have run in this project stubbed Chart.js out.** This
sandbox cannot reach the CDN, so I replaced the library with a fake constructor
that does nothing. So "verified in a real browser" was true and close to
worthless for anything chart-shaped: the code that does the work was never the
code that ran.

I have downloaded the real library and now serve it locally in the check. The
suite also gained a static guard, ie, a canvas that sizes itself to its
container must have a container with a fixed height, so the pairing cannot come
apart again.

**The general lesson: a stub is a place where verification stops.** If a
dependency has to be faked to run a check, the check does not cover whatever
that dependency does, and that needs saying out loud rather than being folded
into "verified".

---

## 24 September 2026, the training hours, and a rule the code was breaking

**Tested end to end?** Yes. All three pages and the email were rendered and read.

### Closed: the unverified training claim

Andrew confirmed the figures: **thirteen hours a week in the pool, four in the
weight room.** The old claim of "six days a week, about fifteen hours in the
water" is gone from everywhere.

He gave the hours and not the days, so no claim is made about days per week.
This app does not fill in the gap.

### What the fix turned up

There were **two** copies of that claim, not one. `swimmer.js` held a
first-person sentence for the email and `index.html` held a hand-typed
third-person one for the public page. They had to be kept in step by hand and
they were not: both still said fifteen hours after the correction.

Now the hours are stored as numbers in one place and both sentences are built
from them. There is nothing left to keep in step.

### Fixed: the project was breaking its own writing rule

CLAUDE.md says no em dashes or en dashes in anything a person reads. There were
**twenty** across the public page, the back end and the live code.

Worse, the first test written for this passed while five of them were rendering
on the live page. It looked for the dash character, and those five were written
as the escape `\u2014`, which is the same thing to a browser and invisible to a
regex looking for the glyph. The test checks both spellings now, and the moment
it did it found three more in the back end that had been sitting there.

Every dash is now a word or the punctuation the sentence actually wanted. A
screen reader announces "none on file" rather than silence.

### Proven, not asserted

Rendered and read, rather than inferred from the source:

| | dashes | training line |
|---|---|---|
| Public page, iPhone width | 0 | thirteen hours, plus four |
| One pager | 0 | not shown on it |
| Back end | 0 | not shown on it |
| The email itself | 0 | thirteen hours, plus four |

No console errors on any of them. 1,294 checks green.

---

## 24 September 2026, the coach email

**Tested end to end?** As far as this app can go. Read the first item.

What was actually done, not just asserted: the back end was opened in a real
browser, the Email Coach Lichter button on the Fairfield card was clicked, the
draft panel opened, the mailto link was read back and confirmed addressed to
jlichter@fairfield.edu, Copy the text was clicked and the clipboard read back
with all the times in it, and the finished email was rendered at iPhone width
and looked at. It comes to 1.8 phone screens with no sideways scrolling and
tappable links.

### 1. NEEDS YOUR ATTENTION: the email cannot actually be sent

There is no send path in this app and never has been. `netlify/functions/send.js`
was deliberately never written. "Fire" means the button assembles the text and
hands it to your own mail client through a `mailto:` link. Nothing leaves this
app.

So the closest thing to a true end-to-end test is: build the real draft from the
real code, render it exactly as a phone mail client would, and read it. That is
what was done. **No email was actually delivered to an inbox, because there is
nothing here that can deliver one.**

Why it is like this: a draft that opens in your own mail, from your own address,
gets better replies than anything sent from a robot domain, and nothing is being
sent before spring 2027 anyway.

**To make it genuinely sendable** you would need a verified sending domain, ie,
not a netlify.app subdomain, plus a mail service such as Resend or Postmark, plus
SPF and DKIM records. About half a day. Say the word and it gets built and then
genuinely tested by sending one to you.

### 2. NEEDS YOUR ATTENTION: one sentence in the email is unverified

The email says, in Luke's voice:

> I train six days a week, about fifteen hours in the water.

That string lives in `swimmer.js` and nobody has checked it this season. You
corrected the *2022* version of this claim in an earlier session, ie, that he
started on two days a week and three to four hours. The present-day figure was
never revisited.

**Confirm or correct it before any of this is sent.** Every other number in the
email was checked against the stored record and is right.

### 3. Fixed: the subject line was cut off on a phone

It read `Luke Hammond · 2029 distance free · 400 Free 4:10.86`, 52 characters. A
phone inbox shows roughly 35 to 40, so it truncated to
`Luke Hammond · 2029 distance free · 40...`, cutting the number, which is the
only part a coach scans for.

Now `400 Free 4:10.86 · Luke Hammond · 2029`, 38 characters, fits whole.

### 4. Fixed: an empty email was possible

With no swims on record the body printed "My primary events are ." followed by a
promise of times and then nothing. It cannot happen on the real board, which
always has times, and that is exactly why it would have sat there unnoticed. The
section is guarded now, and a warning says so rather than letting it through.

### 5. Fixed: a sentence I had cut was doing a job

The rewrite removed "I know I'm still early in the recruiting process", and the
test suite caught it. That sentence stopped a coach who cannot legally answer
from feeling rude, and stopped Luke reading the silence as a no.

It is back, better than before. The old version said it to everybody, which was
wrong for the forty programmes that CAN answer today, ie, it told a U SPORTS
coach not to bother replying. Now it only appears where it is true:

> Thanks for reading. I know you probably can't write back yet, so I'm not
> expecting a reply. I'll keep sending updates as my times come down.

The other forty get the plain version.

### 6. Fixed: the wording read like a machine wrote it

The draft ran 2,625 characters over ten paragraphs, opened with "I'm reaching out
because", claimed to want "a strong academic and team environment", and closed
with two paragraphs that repeated the opening and said nothing. A coach with
three hundred of these does not read that, and worse, it did not sound like a
fifteen-year-old.

Rewritten through the humanizer skill. 1,601 characters, 39 percent shorter,
every time and fact identical. Renders in 1.8 phone screens with no sideways
scrolling.

### 7. Known, mitigated: Outlook may truncate a long draft

A `mailto:` over about 2,048 characters is cut short by Outlook's protocol
handler. This draft encodes to about 2,400. Apple Mail, which is what you use, is
fine to roughly 8,000.

The draft panel already has a **Copy the text** button, and it now warns you when
a draft is long enough for this to bite. Not worth more than that unless Luke
ends up on Outlook.

### 8. Open question, not a defect

The warning "Nothing specific to this programme" fires whenever there is no
hand-written `personalNote`, even though the email already carries an
auto-generated line comparing his converted time to that squad's conference
range. That line is genuinely programme-specific. Arguably the warning should
only fire when neither exists. Left alone because a nudge to write one real
sentence yourself is probably worth the false alarm. Tell me if it nags.
