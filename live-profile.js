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

  var S = window.Swim, C = window.Convert, St = window.Standards, R = window.Recruiting;
  var SWIMMER = window.SwimmerData.SWIMMER;
  var SEED = window.SwimmerData.SEED_RESULTS;
  var rankings = window.SwimmerData.seedRankings();
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
    timeCards(results, bests);
    compTable(results);
    coachPanel(yards);
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
      var best = bests[S.eventId(p.distance, p.stroke, p.course)];
      if (!best) return '';
      return '<div class="hero-stat">' +
        '<div class="hero-stat-val">#' + esc(p.rank) + '</div>' +
        '<div class="hero-stat-label">Canada — ' + esc(p.distance) + 'm ' +
        esc(S.STROKE_SHORT[p.stroke]) + ' · ' + esc(best.time) + '</div></div>';
    }).join('');
    if (html) node.innerHTML = html;
  }

  // The flip cards, rebuilt with the same classes so the existing CSS and the
  // existing flipCard handler keep working untouched.
  function timeCards(results, bests) {
    var node = el('times-grid');
    if (!node) return;

    var cards = (SWIMMER.primary || []).map(function (p) {
      var id = S.eventId(p.distance, p.stroke, p.course);
      var best = bests[id];
      if (!best) return '';
      var rank = window.SwimmerData.rankFor(rankings, id);

      var gap = St ? St.gapToCut(S.parseTime, best.hundredths, 'can-jr-trials', id) : null;
      var courseLabel = best.course === 'LCM' ? 'Long Course' : (best.course === 'SCM' ? 'Short Course' : 'Yards');
      var when = friendlyMonth(best.date);

      var progress = '';
      if (gap) {
        // How much of the way there, ie, the cut over the current swim. A swim
        // already under the cut reads as complete rather than over 100.
        var pct = gap.made ? 100 : Math.max(1, Math.min(99, Math.round((gap.cutHundredths / best.hundredths) * 100)));
        progress =
          '<div class="time-progress">' +
            '<div class="time-progress-label"><span>🏁 Jr Trials cut: ' + esc(gap.cut) + '</span>' +
            '<span>' + pct + '%</span></div>' +
            '<div class="time-progress-track">' +
            '<div class="time-progress-fill gold-fill" data-pct="' + pct + '" style="width:' + pct + '%"></div></div>' +
          '</div>';
      }

      var back = gap
        ? '<div class="back-label">' + (gap.made ? 'Under the Junior Trials standard' : 'Time needed to reach Jr Trials') + '</div>' +
          '<div class="back-gap">' + (gap.made ? 'Qualified' : '− ' + esc(S.formatGap(gap.behindBy).replace('+', '')) + 's') + '</div>' +
          '<div class="back-standard">Standard: ' + esc(gap.cut) + ' · Current: ' + esc(best.time) + '</div>'
        : '<div class="back-label">Best on record</div>' +
          '<div class="back-gap">' + esc(best.time) + '</div>' +
          '<div class="back-standard">' + esc(best.meet || '') + '</div>';

      return '<div class="time-card" onclick="flipCard(this)">' +
        '<span class="flip-hint">tap to flip ↩</span>' +
        '<div class="time-card-inner">' +
          '<div class="time-card-front">' +
            '<div class="time-event">' + esc(p.distance) + 'm ' + esc(S.STROKE_LABEL[p.stroke]) + '</div>' +
            '<div class="time-value gold">' + esc(best.time) +
              (p.rank ? '<span class="time-pb-badge">#' + esc(p.rank) + ' 🇨🇦</span>' : '') +
            '</div>' +
            '<div class="time-course">' + esc(courseLabel) + ' · ' + esc(when) + '</div>' +
            progress +
          '</div>' +
          '<div class="time-card-back">' + back +
            '<div class="back-flip-hint">tap to flip back ↩</div>' +
          '</div>' +
        '</div></div>';
    }).join('');

    if (cards) node.innerHTML = cards;
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
      return '<div style="background:var(--card-bg);border:1px solid rgba(255,255,255,0.07);' +
        'border-radius:4px;padding:1.25rem 1.35rem;">' +
        '<div style="font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;' +
        'color:var(--aqua);font-weight:500;">' + esc(y.name) + '</div>' +
        '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:2.1rem;line-height:1.1;' +
        'margin:0.35rem 0 0.15rem;color:var(--white);">' + esc(y.time) + '</div>' +
        '<div style="font-size:0.72rem;color:var(--muted);">converted from ' + esc(y.from.time) + '</div>' +
        '</div>';
    }).join('');
    if (!cells) return;

    var block = document.createElement('div');
    block.className = 'reveal';
    block.style.cssText = 'max-width:1200px;margin:0 auto 3.5rem;padding:0 4rem;';
    block.innerHTML =
      '<p class="section-label">For College Coaches</p>' +
      '<h2 class="section-title" style="margin-bottom:0.75rem;">Short Course Yards</h2>' +
      '<p style="color:var(--muted);font-size:0.875rem;max-width:700px;line-height:1.7;margin-bottom:2rem;">' +
      'Luke races metres. These are his yard equivalents, so the times can be read against an NCAA roster ' +
      'without conversion. They are <span style="color:var(--gold);">estimates</span>. The metric swim each ' +
      'one came from is shown beneath it, and those are the times that actually happened.</p>' +
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

  // A coach arriving from an emailed link carries ?c=<school>. A bare count
  // against a school id, nothing about the person reading.
  function logVisit() {
    try {
      var from = new URLSearchParams(location.search).get('c');
      if (!from) return;
      fetch('/api/visit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ school: from })
      }).catch(function () {});
    } catch (err) { /* a failed log must never break the page */ }
  }

  function start() {
    // The seed renders immediately so the page is never blank or stale-looking
    // while the network is slow. The stored list replaces it when it arrives.
    render(clean(SEED));
    Promise.all([
      fetch('/api/results', { headers: { accept: 'application/json' } })
        .then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
      fetch('/api/profile', { headers: { accept: 'application/json' } })
        .then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
    ]).then(function (both) {
      var stored = both[0];
      var profile = both[1];
      if (profile && profile.profile) rankings = window.SwimmerData.rankingsFrom(profile.profile);
      var list = stored && Array.isArray(stored.results) && stored.results.length ? stored.results : SEED;
      render(clean(list));
    });
    logVisit();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
