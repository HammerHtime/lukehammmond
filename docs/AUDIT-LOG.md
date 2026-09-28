# Audit log

Things that need Andrew's attention, and things that could not be fully tested.

Written by Claude after each change, under the standing rule in CLAUDE.md. If a
feature could not be proven end to end, it is listed here rather than reported
as done.

Newest first.

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

### Still open, for Andrew

- **The photos.** Andrew said he is replacing them. The hero uses the freestyle
  race shot and the About section uses the backstroke one. Both slot into the
  same markup, so new files drop straight in.
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
