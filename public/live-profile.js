// live-profile.js
// Wires the hand-built page to the live data.
//
// The page Andrew built is kept exactly as it is. Its design, its ripple
// hero, its flip cards, its gallery and its reveal animations are untouched.
// This file replaces only the parts that go stale, ie, the numbers.
//
// Why it works this way rather than as a rewrite: the site already looked
// right. What it could not do was change. Every time on it was typed by hand,
// so the 200 free still read 2:00.73 months after Luke swam 1:59.75. Those
// regions are now generated from the same results the back end writes, which
// means entering a swim updates the public page and nothing else has to move.

(function () {
  'use strict';

  var S = window.Swim, C = window.Convert, R = window.Recruiting;
  var SWIMMER = window.SwimmerData.SWIMMER;
  var SEED = window.SwimmerData.SEED_RESULTS;
  var rankings = window.SwimmerData.seedRankings();
  var photos = [];
  var coach = {};
  if (!S || !SWIMMER) return;

  var today = new Date().toISOString().slice(0, 10);

  function el(id) { return document.getElementById(id); }
  function esc(v) {
    return String(v === null || v === undefined ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Meet names are typed by a person into the back end, so nothing from the
  // data is ever treated as markup.
  function render(results) {
    var bests = S.personalBests(results);
    var yards = C ? C.yardBests(S, results) : {};
    heroEyebrow();
    heroStats(bests);
    heroBadge(bests);
    if (window.Charts) window.Charts.renderProgression(results);
    schoolPanel();
    timeCards(results, bests);
    rankingLines(bests);
    compTable(results, bests);
    clubCoach();
    clubLines(results);
    progression(results);
    coachPanel(yards);
    gallery();
  }

  // Age goes stale every birthday. A graduating class never does, and it is
  // the field a college coach actually sorts on.
  function heroEyebrow() {
    var node = el('hero-eyebrow');
    if (!node) return;
    node.textContent = SWIMMER.club + ' · Distance Freestyle · Class of ' + SWIMMER.classOf;
  }

  function heroStats(bests) {
    var node = el('hero-stats');
    if (!node) return;
    var html = (SWIMMER.primary || []).slice(0, 3).map(function (p) {
      var id = S.eventId(p.distance, p.stroke, p.course);
      var best = bests[id];
      var rank = window.SwimmerData.rankFor(rankings, id);
      // No ranking on file means no box, rather than a box with nothing in it.
      if (!best || !rank) return '';
      return '<div class="hero-stat">' +
        '<div class="hero-stat-val">#' + esc(rank.rank) + '</div>' +
        '<div class="hero-stat-label">Ranked in Canada · ' + esc(p.distance) + 'm ' +
        esc(S.STROKE_SHORT[p.stroke]) + ' · ' + esc(best.time) + '</div></div>';
    }).join('');
    // Clear every ranking and the whole strip goes, rather than leaving a row
    // of empty boxes under his name.
    node.innerHTML = html;
    node.style.display = html ? '' : 'none';
  }

  // The flip cards, rebuilt with the same classes so the existing CSS keeps
  // working untouched. They used to carry onclick="flipCard(this)" and lean on
  // a function in index.html. That function sat inside the block holding the
  // photo uploader and the theme editor, so removing that block took the flip
  // with it and every card silently stopped turning over. They wire themselves
  // now, which is also what makes them reachable from a keyboard.
  function timeCards(results, bests) {
    var node = el('times-grid');
    if (!node) return;

    // Which events get a card.
    //
    // It used to be the four primary events and nothing else, so adding a
    // ranking in the back end for, say, the 200 back set the number and then
    // had nowhere to show it. Andrew expected the event to appear, and he is
    // right: putting a national ranking on an event IS the statement that it
    // matters. The ranking is the decision, so it should carry the card.
    //
    // Primary events keep their order and always show, ranked or not. Anything
    // else with a saved ranking follows, best ranking first. Clear the box and
    // the card goes with it.
    var shown = (SWIMMER.primary || []).map(function (p) {
      return { id: S.eventId(p.distance, p.stroke, p.course), primary: true };
    });
    var already = {};
    shown.forEach(function (x) { already[x.id] = true; });

    Object.keys(rankings)
      .filter(function (id) { return !already[id] && bests[id]; })
      .map(function (id) { return { id: id, primary: false, rank: rankings[id].rank }; })
      .sort(function (a, b) { return a.rank - b.rank; })
      .forEach(function (x) { shown.push(x); });

    var cards = shown.map(function (p) {
      var id = p.id;
      var best = bests[id];
      if (!best) return '';
      var rank = window.SwimmerData.rankFor(rankings, id);

      var courseLabel = best.course === 'LCM' ? 'Long Course' : (best.course === 'SCM' ? 'Short Course' : 'Yards');
      var when = friendlyMonth(best.date);

      // No progress rail. It tracked the gap to the Canadian Junior Trials
      // cut, and a US head coach carries his own standards in his head, so on
      // a coach facing page it is noise sitting underneath the one number that
      // matters. The gap is still computed and still reported in the back end,
      // where it is Luke's own target and genuinely useful.
      var progress = '';

      // The back of the card answers the question a coach actually has about a
      // time on a page, ie, where and when was it swum.
      var back =
        '<div class="back-label">Where it was swum</div>' +
        '<div class="back-gap" style="font-size:1.15rem;line-height:1.35;">' +
          esc(best.meet || 'Meet not recorded') + '</div>' +
        '<div class="back-standard">' + esc(courseLabel) + ' \u00b7 ' + esc(when) + '</div>';

      var splits = window.Charts && window.Charts.hasSplits(id)
        ? '<button type="button" class="splits-open" data-splits="' + esc(id) + '">View splits ↗</button>'
        : '';

      return '<div class="time-card" tabindex="0" role="button" ' +
        'aria-label="' + esc(best.distance) + ' metre ' + esc(S.STROKE_LABEL[best.stroke]) +
        ', ' + esc(best.time) + '. Activate to see where it was swum.">' +
        '<span class="flip-hint">tap to flip ↩</span>' +
        '<div class="time-card-inner">' +
          '<div class="time-card-front">' +
            // Read off the swim itself, not off the list entry. The list used
            // to carry distance and stroke and no longer does, and taking them
            // from it turned every label into a bare "m".
            '<div class="time-event">' + esc(best.distance) + 'm ' + esc(S.STROKE_LABEL[best.stroke]) + '</div>' +
            '<div class="time-value gold">' + esc(best.time) +
              (rank ? '<span class="time-pb-badge">#' + esc(rank.rank) +
                ' in Canada</span>' : '') +
            '</div>' +
            '<div class="time-course">' + esc(courseLabel) + ' · ' + esc(when) + '</div>' +
            progress + splits +
          '</div>' +
          '<div class="time-card-back">' + back +
            '<div class="back-flip-hint">tap to flip back ↩</div>' +
          '</div>' +
        '</div></div>';
    }).join('');

    if (cards) node.innerHTML = cards;

    // Wired here rather than with an inline onclick, so the page carries no
    // executable markup and a strict content policy stays possible.
    // Flipping, by click or by keyboard. It was an inline onclick on a div, so
    // the back of the card, ie, the meet and the date, could not be reached
    // without a mouse.
    Array.prototype.forEach.call(node.querySelectorAll('.time-card'), function (card) {
      function flip() { card.classList.toggle('flipped'); }
      card.addEventListener('click', flip);
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
      });
    });

    Array.prototype.forEach.call(node.querySelectorAll('[data-splits]'), function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();          // the card itself flips on click
        window.Charts.openSplits(b.getAttribute('data-splits'), bests, b);
      });
    });
  }

  // The hero badge read "Ranked Top 5 in Canada · 4 Distance Events", typed in,
  // so it would have kept saying 4 events after a fifth ranking was added and
  // kept saying Top 5 if a rank slipped to 7. Both halves are counted now.
  function heroBadge(bests) {
    var node = el('hero-badge-claim');
    if (!node) return;

    var held = Object.keys(rankings)
      .filter(function (id) { return bests[id]; })
      .map(function (id) { return { rank: rankings[id].rank, distance: bests[id].distance }; })
      .filter(function (r) { return Number.isFinite(r.rank); });

    if (!held.length) { node.textContent = ''; node.parentNode.style.display = 'none'; return; }

    // The bracket has to hold for EVERY event the badge counts, so it comes off
    // the WORST rank, not the best. A coach reads "Top 5 in Canada, 4 events" as
    // all four being inside the top five. Taking the best rank would have read
    // "Top 3, 4 events" off a single #2 while a #5 sat in the same four, which
    // is the sentence saying more than the numbers under it.
    var worst = Math.max.apply(null, held.map(function (r) { return r.rank; }));
    var bracket = [3, 5, 10, 20].filter(function (b) { return worst <= b; })[0] || worst;

    // 400 and up is a distance event. Saying "distance events" when the count
    // includes a 200 is the kind of small overclaim a coach notices.
    var distance = held.filter(function (r) { return r.distance >= 400; }).length;
    var label = distance === held.length
      ? (held.length === 1 ? 'Distance Event' : 'Distance Events')
      : (held.length === 1 ? 'Event' : 'Events');

    node.textContent = 'Ranked Top ' + bracket + ' in Canada · ' + held.length + ' ' + label;
    node.parentNode.style.display = '';
  }

  // The Best Times section carried its rankings as a sentence typed by hand.
  // Once the badges became editable those two got out of step, ie, the sentence
  // claimed #3, #5 and #6 while the badges above it read #4, #2, #3 and #5.
  // Both now come from the same place, so they cannot disagree.
  function rankingLines(bests) {
    var intro = el('times-intro');
    if (intro) {
      var listed = Object.keys(rankings).map(function (id) {
        var best = bests[id];
        if (!best) return null;
        return { rank: rankings[id].rank, name: best.name, course: best.course };
      }).filter(Boolean).sort(function (a, b) { return a.rank - b.rank; });

      intro.innerHTML = listed.length
        ? '<span style="color:var(--aqua);">Ranked in Canada for age: ' +
          listed.map(function (r) {
            return '#' + esc(r.rank) + ' ' + esc(r.name) + ' ' + esc(r.course);
          }).join(' \u00b7 ') + '.</span>'
        : '';
      // No rankings means no sentence, rather than an empty coloured line.
      intro.style.display = listed.length ? '' : 'none';
    }

    var foot = el('times-footnote');
    if (foot) {
      // The age was written into this line as "14-year-old males", which goes
      // wrong on his next birthday. The graduating class does not.
      foot.textContent = '\u2605 Rankings are for age, Canada. Class of ' + SWIMMER.classOf;
    }
  }

  function compTable(results) {
    var table = el('comp-table');
    if (!table) return;
    var body = table.querySelector('tbody');
    if (!body) return;

    var rows = S.recentResults(results, 14).map(function (r) {
      return '<tr>' +
        '<td>' + esc(friendlyMonth(r.date)) + '</td>' +
        '<td class="meet-name">' + esc(r.meet || '—') + '</td>' +
        '<td>' + esc(r.distance) + 'm ' + esc(S.STROKE_LABEL[r.stroke]) + '</td>' +
        '<td>' + esc(r.time) + '</td>' +
        '<td><span class="place-badge place-other">' + esc(r.course) + '</span></td>' +
        '</tr>';
    }).join('');
    if (rows) body.innerHTML = rows;
  }

  // The one thing the page did not have, and the one thing an American coach
  // needs. He races yards. Luke races metres. Without this a coach has to do
  // arithmetic before he knows whether to keep reading, and he will not.
  function coachPanel(yards) {
    var host = document.getElementById('recruit');
    if (!host || !C) return;

    var order = ['200-free-SCY', '500-free-SCY', '1000-free-SCY', '1650-free-SCY', '200-back-SCY', '400-im-SCY'];
    var cells = order.map(function (id) {
      var y = yards[id];
      if (!y) return '';
      var actual = esc(y.from.time) + ' ' + esc(y.from.event.split('-').pop());
      return '<div style="background:var(--card-bg);border:1px solid rgba(255,255,255,0.07);' +
        'border-radius:4px;padding:1.25rem 1.35rem;">' +
        '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">' +
        '<span style="font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;' +
        'color:var(--aqua);font-weight:500;">' + esc(y.name) + '</span>' +
        '<span style="font-size:0.55rem;letter-spacing:0.14em;text-transform:uppercase;' +
        'color:var(--gold);border:1px solid var(--gold);border-radius:2px;padding:1px 5px;' +
        'font-weight:600;white-space:nowrap">Converted</span></div>' +
        '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:2.1rem;line-height:1.1;' +
        'margin:0.35rem 0 0.35rem;color:var(--white);">' + esc(y.time) +
        '<span style="font-size:0.8rem;font-family:\'DM Sans\',sans-serif;color:var(--gold);' +
        'margin-left:0.35rem;">est.</span></div>' +
        '<div style="font-size:0.72rem;color:var(--muted);line-height:1.5;">' +
        '<span style="color:var(--white);">Actually swum:</span> ' + actual + '</div>' +
        '</div>';
    }).join('');
    if (!cells) return;

    // Rendering happens twice by design, ie, seed first so the page is never
    // blank, then the stored results. An insert that does not replace shows
    // this panel twice, which is exactly what it did.
    var existing = document.getElementById('coach-panel');
    if (existing) existing.parentNode.removeChild(existing);

    var block = document.createElement('div');
    block.id = 'coach-panel';
    block.className = 'reveal';
    block.style.cssText = 'max-width:1200px;margin:0 auto 3.5rem;padding:0 4rem;';
    block.innerHTML =
      '<p class="section-label">For College Coaches</p>' +
      '<h2 class="section-title" style="margin-bottom:0.75rem;">Short Course Yards</h2>' +
      '<p style="display:inline-block;color:var(--gold);border:1px solid var(--gold);' +
      'border-radius:3px;padding:0.4rem 0.8rem;font-size:0.7rem;letter-spacing:0.16em;' +
      'text-transform:uppercase;font-weight:600;margin-bottom:1.25rem;">' +
      'Converted estimates. Not times Luke has swum.</p>' +
      '<p style="color:var(--muted);font-size:0.875rem;max-width:700px;line-height:1.7;margin-bottom:2rem;">' +
      'Luke races metres and every NCAA programme races yards, so these are his metric bests converted, ' +
      'to save you the arithmetic. <span style="color:var(--white);">He has never raced a short course ' +
      'yards pool.</span> Each card shows the metric swim it was converted from, and those are the ' +
      'times that actually happened, at the meets listed above.</p>' +
      '<div style="display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));">' +
      cells + '</div>' +
      contactRuleLine();

    host.insertBefore(block, host.firstChild);

    // The page reveals sections as they scroll into view. A block added after
    // that observer was set up would stay invisible, so it is shown outright.
    block.classList.add('visible');
    block.style.opacity = '1';
    block.style.transform = 'none';
  }

  // Said out loud on the page, because a coach who reads it sees a swimmer who
  // already understands the calendar. And because Luke needs to know that
  // silence before that date is the rule rather than an answer.
  function contactRuleLine() {
    if (!R) return '';
    var w = R.contactWindow('D1', SWIMMER.classOf, today);
    if (!w || w.open) return '';
    return '<p style="color:var(--muted);font-size:0.8rem;line-height:1.7;margin-top:1.75rem;">' +
      'Luke is class of ' + esc(SWIMMER.classOf) + '. Under NCAA Division I rules a coach cannot reply ' +
      'until ' + esc(R.friendlyDate(w.replyDate)) + '. He would rather you had his times before then.</p>';
  }

  // The progression table. Season best, season by season, with what came off.
  //
  // This is the highest value element on the page and the one thing it does
  // better than a results database, which shows a best time while hiding the
  // slope that produced it. Coaches named rate of improvement as one of two
  // swimming criteria, so this is the half a database cannot show.
  //
  // Which events appear is decided by World Aquatics points, not by opinion.
  // Points mean the same thing in every event and both courses, so they settle
  // what to lead with rather than leaving it to be argued about.
  function progression(results) {
    var host = el('progression');
    if (!host) return;

    // Five, one row per event rather than per course. That brings the 400 IM
    // in, which matters: coaches named RANGE of events alongside rate of
    // improvement, and a distance freestyler who can also swim a 400 IM is a
    // different proposition from one who cannot. It is his fifth event by
    // points, not a co-lead, and the page says so rather than overselling it.
    var top = S.rankedByPoints(results, 5, true);
    var curves = top.map(function (best) {
      return S.progression(results, best.distance, best.stroke, best.course);
    }).filter(Boolean).filter(function (c) { return c.seasons.length > 1; });
    if (!curves.length) { host.innerHTML = ''; return; }

    host.innerHTML =
      '<p class="section-label">Rate of Improvement</p>' +
      '<h2 class="section-title" style="margin-bottom:0.75rem;">Season by Season</h2>' +
      '<p style="color:var(--muted);font-size:0.875rem;max-width:700px;line-height:1.7;' +
      'margin-bottom:2rem;">His five strongest events, chosen by World Aquatics points rather ' +
      'than by preference, with the season best for each year and what came off it. Points are ' +
      'the same scale in every event and both courses, so they compare a 400 freestyle against ' +
      'a 400 individual medley honestly. The distance freestyle is the identity. The ' +
      '<span style="color:var(--white);">400 individual medley is the range</span>, and range ' +
      'is what lets a coach use a swimmer in more than one place.</p>' +
      '<div style="display:grid;gap:1.25rem;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));">' +
      curves.map(function (c) {
        return '<div style="background:var(--card-bg);border:1px solid rgba(255,255,255,0.07);' +
          'border-radius:4px;padding:1.35rem;">' +
          '<div style="font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;' +
          'color:var(--aqua);font-weight:500;margin-bottom:0.9rem;">' + esc(c.name) + '</div>' +
          c.seasons.map(function (s) {
            return '<div style="display:flex;justify-content:space-between;align-items:baseline;' +
              'gap:10px;padding:0.3rem 0;border-bottom:1px solid rgba(255,255,255,0.05);">' +
              '<span style="color:var(--muted);font-size:0.78rem;">' + esc(s.season) + '</span>' +
              '<span style="font-variant-numeric:tabular-nums;color:var(--white);' +
              'font-size:0.95rem;">' + esc(s.time) + '</span>' +
              '<span style="font-variant-numeric:tabular-nums;font-size:0.78rem;color:' +
              (s.droppedBy ? 'var(--gold)' : 'var(--muted)') + ';min-width:62px;text-align:right;">' +
              (s.droppedBy ? esc(S.formatGap(s.droppedBy)) : '\u2014') + '</span></div>';
          }).join('') +
          '<div style="margin-top:0.9rem;font-size:0.8rem;color:var(--white);">' +
          '<strong style="color:var(--gold);">' + esc(S.formatGap(c.totalDrop)) + '</strong> in ' +
          (c.seasons.length - 1) + ' season' + (c.seasons.length === 2 ? '' : 's') +
          (c.pointsGained ? ', <strong>+' + esc(c.pointsGained) + '</strong> points' : '') +
          '</div>' +
          (c.everySeason
            ? '<div style="margin-top:0.35rem;font-size:0.74rem;color:var(--aqua);">' +
              'Faster every season on record.</div>'
            : '') +
          '</div>';
      }).join('') + '</div>';

    host.classList.add('visible');
    host.style.opacity = '1';
    host.style.transform = 'none';
  }

  // Everything that names the club. It was written into the markup in four
  // places, which is why a club change was a code change. It is data now.
  function clubLines(results) {
    var club = String(coach.club || SWIMMER.club || '').trim();

    var lead = el('about-lead');
    if (lead) {
      // The old paragraph said "14-year-old", named the former club, and
      // repeated the rankings in prose where they could drift from the badges
      // above. All three are gone. This is built from the same data as
      // everything else, so it cannot disagree with itself.
      lead.textContent = SWIMMER.about[0];
    }

    var quote = el('about-quote');
    if (quote && SWIMMER.quote) {
      quote.innerHTML =
        '<blockquote style="margin:1.5rem 0;padding-left:1.1rem;' +
        'border-left:2px solid var(--aqua);">' +
        '<p style="font-size:1.15rem;line-height:1.6;color:var(--white);margin:0 0 0.5rem;">' +
        '\u201c' + esc(SWIMMER.quote.text) + '\u201d</p>' +
        '<footer style="font-size:0.72rem;letter-spacing:0.12em;text-transform:uppercase;' +
        'color:var(--muted);">' + esc(SWIMMER.quote.source) + '</footer></blockquote>';
    }

    var press = el('about-press');
    if (press && (SWIMMER.press || []).length) {
      press.innerHTML = '<div style="margin:1.25rem 0;">' +
        '<div style="font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;' +
        'color:var(--aqua);font-weight:500;margin-bottom:0.6rem;">Written about</div>' +
        SWIMMER.press.map(function (item) {
          return '<a href="' + esc(item.url) + '" target="_blank" rel="noopener" ' +
            'style="color:var(--white);text-decoration:none;display:block;margin-bottom:0.4rem;">' +
            esc(item.publisher) + ', \u201c' + esc(item.title) + '\u201d ' +
            '<span style="color:var(--muted);font-size:0.8rem;">' +
            esc(friendlyMonth(item.date)) + (item.note ? ' \u00b7 ' + esc(item.note) : '') +
            '</span></a>';
        }).join('') + '</div>';
    }

    var card = el('contact-club');
    if (card) {
      // The club's OWN town, not Luke's. He lives in Etobicoke and trains in
      // Mississauga, and this line was printing "Mississauga Aquatic Club,
      // Etobicoke", which puts the club somewhere it is not. The same mistake
      // was fixed in the coach email once already and this was the copy of it
      // that survived on the public page.
      var town = String(coach.clubCity || SWIMMER.clubCity || '').trim();
      card.textContent = club + (town ? ', ' + town + ', ' + SWIMMER.province : '');
    }

    var footer = el('footer-line');
    if (footer) {
      // "Updated April 2026" was typed in and then stopped being true. The date
      // of his most recent swim is the only honest answer, and it maintains
      // itself.
      var latest = (results || []).reduce(function (a, r) { return r.date > a ? r.date : a; }, '');
      footer.textContent = club + (latest ? ' \u00b7 Times current to ' + friendlyMonth(latest) : '');
    }
  }

  // The club coach. Coaches told researchers repeatedly that the thing they
  // actually do is telephone the club coach, so this is one of the highest
  // value lines on the page. It is also the one most likely to go stale, and a
  // stale name sends a programme to someone who no longer coaches him. So:
  // no name means no row, rather than a wrong name or an empty label.
  function clubCoach() {
    var name = String(coach.name || SWIMMER.coach || '').trim();
    var box = el('contact-coach');
    var label = el('contact-coach-label');
    if (box) {
      box.innerHTML = name
        ? esc(name) + (coach.email
            ? ' <a href="mailto:' + esc(coach.email) + '" style="color:var(--aqua);text-decoration:none">' +
              esc(coach.email) + '</a>' : '')
        : '';
      box.style.display = name ? '' : 'none';
    }
    if (label) label.style.display = name ? '' : 'none';
  }

  // The gallery, and the picture at the top of the page.
  //
  // The page shipped with six fixed slots, two of which pointed at files that
  // were never uploaded and rendered broken. It now shows exactly the photos
  // in the library, however many that is, with the one marked main leading.
  // Nothing stored means the shipped photos stay, so the page is never empty
  // on the day the library is.
  function gallery() {
    var P = window.Photos;
    if (!P || !photos.length) return;

    var list = P.galleryOrder(photos);
    var grid = el('gallery-grid');
    if (grid) {
      grid.innerHTML = list.map(function (photo, index) {
        // The first tile is the tall one, the way the hand-built layout had it.
        var lead = index === 0 ? ' style="grid-row: 1 / 3; min-height: 480px;"' : '';
        // No overlay element here. It carried a "+" meaning "upload here" and
        // it outlived the photo uploader, whose CSS went with it, so on any
        // visit where live photos existed it rendered as a stray plus sign.
        return '<div class="gallery-item has-photo"' + lead + '>' +
          '<img class="slot-photo" src="' + esc(P.urlFor(photo)) + '" alt="' +
          esc(photo.caption || 'Luke Hammond swimming') + '" loading="lazy">' +
          '</div>';
      }).join('');
    }

    // The main photo also leads the About section, which is the first picture
    // of him anyone scrolling the page meets.
    var main = P.mainPhoto(list);
    if (main) {
      var about = document.querySelector('[data-slot="about-photo"] img.slot-photo');
      if (about) {
        about.src = P.urlFor(main);
        about.alt = main.caption || 'Luke Hammond swimming';
      }
    }
  }

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function friendlyMonth(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    return m ? MONTHS[Number(m[2]) - 1] + ' ' + m[1] : String(iso || '');
  }

  function clean(raw) {
    return raw.map(function (r) { return S.normaliseResult(r); })
      .filter(function (n) { return n.ok; })
      .map(function (n) { return n.result; });
  }

  // A coach who followed their own signed link gets their own comparison at the
  // top of the page, before the generic profile. The numbers come from the
  // server, because the board itself is not deployed: schools.js holds ninety
  // coach addresses and every programme's benchmarks, and a coach must never be
  // able to read it. The response carries one school and nothing else.
  function schoolPanel() {
    var panel = el('school-panel');
    if (!panel) return;
    var params;
    try { params = new URLSearchParams(location.search); } catch (err) { return; }
    var from = params.get('c'), token = params.get('t');
    if (!from || !token) return;

    fetch('/api/coach?c=' + encodeURIComponent(from) + '&t=' + encodeURIComponent(token))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (body) {
        // A bad or missing token simply shows the ordinary page. No error, no
        // mention that a panel exists, ie, nothing to poke at.
        if (!body || !body.comparison || !body.comparison.events.length) return;
        var cmp = body.comparison;

        var rows = cmp.events.map(function (ev) {
          var provenance = ev.mineEstimated && ev.mineFrom
            ? 'Converted from his ' + esc(ev.mineFrom.time) + ' ' + esc(ev.mineFrom.event) +
              '. Not a time he has swum.'
            : '';
          // The basis follows a full stop, so it needs a capital. It read
          // "Not a time he has swum. roster depth, 4 swimmers."
          var basis = [ev.basis, ev.context].filter(Boolean).map(function (t) {
            return esc(t.charAt(0).toUpperCase() + t.slice(1));
          }).join(' ');
          return '<div class="coach-row">' +
            '<div class="coach-event">' + esc(ev.name) + '</div>' +
            '<div>' +
              '<div class="coach-time">' + esc(ev.mine) + '</div>' +
              '<div class="coach-line">' + esc(ev.line) +
                (ev.theirs ? ' Your group: ' + esc(ev.theirs) + '.' : '') + '</div>' +
              (provenance || basis
                ? '<div class="coach-sub">' + provenance + (provenance && basis ? ' ' : '') + basis +
                  (ev.sourceUrl ? ' <a href="' + esc(ev.sourceUrl) +
                    '" target="_blank" rel="noopener">Results</a>' : '') + '</div>'
                : '') +
            '</div></div>';
        }).join('');

        panel.innerHTML =
          '<div class="coach-card">' +
            '<p class="coach-eyebrow">Put beside your squad</p>' +
            '<h2 class="coach-title">' + esc(SWIMMER.shortName || SWIMMER.name) +
              ' and ' + esc(cmp.school.name) + '</h2>' +
            '<div class="coach-rows">' + rows + '</div>' +
            '<p class="coach-foot">Class of ' + esc(SWIMMER.classOf) + ', ' +
              esc(SWIMMER.club) + '. His full record is below. ' +
              'Every yards time on this page is converted from a metres swim and is marked ' +
              'as such, because he has never raced a yard.</p>' +
          '</div>';
        panel.hidden = false;
      })
      .catch(function () { /* the ordinary page is the fallback */ });
  }

  // A coach arriving from an emailed link carries ?c=<school>. A bare count
  // against a school id, nothing about the person reading.

  function start() {
    // The seed renders immediately so the page is never blank or stale-looking
    // while the network is slow. The stored list replaces it when it arrives.
    render(clean(SEED));
    Promise.all([
      fetch('/api/results', { headers: { accept: 'application/json' } })
        .then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
      fetch('/api/profile', { headers: { accept: 'application/json' } })
        .then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
      fetch('/api/photos', { headers: { accept: 'application/json' } })
        .then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
    ]).then(function (all) {
      var stored = all[0];
      var profile = all[1];
      if (profile && profile.profile) {
        rankings = window.SwimmerData.rankingsFrom(profile.profile);
        coach = profile.profile.coach || {};
      }
      photos = (all[2] && all[2].photos) || [];
      var list = stored && Array.isArray(stored.results) && stored.results.length ? stored.results : SEED;
      render(clean(list));
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
