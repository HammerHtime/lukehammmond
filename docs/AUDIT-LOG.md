# Audit log

Things that need Andrew's attention, and things that could not be fully tested.

Written by Claude after each change, under the standing rule in CLAUDE.md. If a
feature could not be proven end to end, it is listed here rather than reported
as done.

Newest first.

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
