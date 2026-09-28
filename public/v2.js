// v2.js
// Fills the alternative front page from the same modules the live site uses.
// Nothing on that page is typed. If a time changes in the back end it changes
// here too, which is the constraint the whole project runs on.

(function () {
  'use strict';

  var S = window.Swim, C = window.Convert, St = window.Standards, R = window.Recruiting;
  var D = window.SwimmerData;
  if (!S || !D) return;
  var SWIMMER = D.SWIMMER;

  function el(id) { return document.getElementById(id); }
  function esc(v) {
    return String(v === null || v === undefined ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function when(d) { var p = String(d).split('-'); return MONTHS[Number(p[1]) - 1] + ' ' + p[0]; }

  function clean(raw) {
    return (raw || []).map(function (r) { return S.normaliseResult(r); })
      .filter(function (n) { return n.ok; }).map(function (n) { return n.result; });
  }

  // ---- the hero says the strongest fact, not the name ----
  function hero(results, bests, rankings) {
    var ranked = S.rankedByPoints(results, 8, true);
    var lead = ranked[0];
    if (!lead) return;
    var rank = rankings[lead.event];

    el('hero-rank').textContent = rank
      ? '#' + rank.rank + ' in Canada for his age'
      : 'Distance freestyle';
    el('hero-time').textContent = lead.time;
    el('hero-what').innerHTML = esc(lead.name) + ' <b>' + esc(lead.course) + '</b>';
    el('hero-when').textContent = when(lead.date) + (lead.meet ? ', ' + lead.meet : '');
    el('hero-who').textContent = SWIMMER.name + '. Class of ' + SWIMMER.classOf + ', ' +
      SWIMMER.club + '. Distance freestyle, ' +
      (SWIMMER.clubCity || SWIMMER.city) + ', ' + SWIMMER.province + '.';
  }

  // ---- the board: dense, aligned, hairlines, no cards ----
  function board(results, bests, yards, rankings) {
    var ranked = S.rankedByPoints(results, 8, true);
    var rows = ranked.map(function (b, i) {
      var map = C && C.mappingFor ? C.mappingFor(b.event) : null;
      var yard = map && yards[map.to];
      var rank = rankings[b.event];
      var curve = S.progression(results, b.distance, b.stroke, b.course);
      var cut = curve && curve.totalDrop ? S.formatGap(curve.totalDrop) : '';

      return '<tr>' +
        '<td class="ev">' + esc(b.distance) + 'm ' + esc(S.STROKE_LABEL[b.stroke]) +
          '<small>' + esc(b.course) + ' · ' + esc(when(b.date)) + '</small></td>' +
        '<td class="n"><span class="t' + (i === 0 ? ' lead' : '') + '">' + esc(b.time) + '</span></td>' +
        '<td class="n hide-sm"><span class="y">' +
          (yard ? esc(yard.time) + ' <span style="color:var(--dim)">' +
            esc(yard.name.replace(/ (Free|Back|Breast|Fly|IM)$/, '')) + 'y</span>' : '') +
          '</span></td>' +
        '<td class="n hide-sm"><span class="rk">' + (rank ? '#' + esc(rank.rank) : '') + '</span></td>' +
        '<td class="n"><span class="drop">' + esc(cut) + '</span></td>' +
        '</tr>';
    }).join('');
    el('board-rows').innerHTML = rows;

    var withRank = Object.keys(rankings).length;
    el('board-lede').textContent =
      'Strongest first, by World Aquatics points, so a 400 freestyle and a 400 individual ' +
      'medley can be compared honestly. ' + withRank + ' of them are ranked nationally for his age. ' +
      'Yards figures are converted from the metres swim beside them. He has never raced a yard. ' +
      'Medley events have no accepted conversion factor, so those cells stay empty rather than guess.';
  }

  // ---- the drop, drawn ----
  // The only motion on the page, because it is the only thing on the page that
  // IS a movement. A line that draws itself while a coach reads it says "this
  // is still going" in a way a static chart does not.
  function curve(results) {
    var host = el('curve-host');
    if (!host) return;
    var lead = S.rankedByPoints(results, 1, true)[0];
    if (!lead) return;
    var c = S.progression(results, lead.distance, lead.stroke, lead.course);
    if (!c || c.seasons.length < 2) return;

    var narrow = (window.innerWidth || 1024) < 760;
    var W = narrow ? 360 : 640, H = narrow ? 300 : 300,
        L = narrow ? 34 : 54, Rt = narrow ? 14 : 18,
        T = narrow ? 34 : 26, B = narrow ? 34 : 42;
    var pts = c.seasons.map(function (s) { return { season: s.season, time: s.time, v: S.parseTime(s.time) }; });
    var cutRaw = St && St.cutFor ? St.cutFor('can-jr-trials', lead.event) : null;
    var cut = cutRaw ? S.parseTime(cutRaw) : null;

    var vals = pts.map(function (p) { return p.v; });
    if (cut) vals.push(cut);
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    var pad = (hi - lo) * 0.18 || 100;
    lo -= pad; hi += pad;

    function x(i) { return L + (i / (pts.length - 1)) * (W - L - Rt); }
    function y(v) { return T + ((v - lo) / (hi - lo)) * (H - T - B); }

    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.v).toFixed(1); }).join(' ');

    var svg = '<svg class="curve" viewBox="0 0 ' + W + ' ' + H + '" role="img" ' +
      'aria-label="' + esc(lead.name) + ' from ' + esc(pts[0].time) + ' in ' + esc(pts[0].season) +
      ' to ' + esc(pts[pts.length - 1].time) + ' in ' + esc(pts[pts.length - 1].season) + '">';

    svg += '<line class="axis" x1="' + L + '" y1="' + (H - B) + '" x2="' + (W - Rt) + '" y2="' + (H - B) + '"/>';

    if (cut) {
      svg += '<line class="cut" x1="' + L + '" y1="' + y(cut).toFixed(1) +
        '" x2="' + (W - Rt) + '" y2="' + y(cut).toFixed(1) + '"/>' +
        '<text class="cutlabel" x="' + L + '" y="' + (y(cut) - 8).toFixed(1) + '">JR TRIALS ' + esc(cutRaw) + '</text>';
    }

    svg += '<path class="path" d="' + d + '"/>';
    pts.forEach(function (p, i) {
      svg += '<circle class="dot" cx="' + x(i).toFixed(1) + '" cy="' + y(p.v).toFixed(1) +
        '" r="5" style="--i:' + i + '"/>';
      var above = !cut || Math.abs(y(p.v) - 15 - y(cut)) > 13;
      svg += '<text class="val" x="' + x(i).toFixed(1) + '" y="' +
        (above ? y(p.v) - 15 : y(p.v) + 24).toFixed(1) +
        '" text-anchor="middle" style="--i:' + i + '">' + esc(p.time) + '</text>';
      svg += '<text x="' + x(i).toFixed(1) + '" y="' + (H - B + 20) + '" text-anchor="middle">' +
        esc(p.season) + '</text>';
    });
    svg += '</svg>';
    host.innerHTML = svg;

    var path = host.querySelector('.path');
    var node = host.querySelector('.curve');
    if (path && node && path.getTotalLength) {
      node.style.setProperty('--len', Math.ceil(path.getTotalLength()));
      // Drawn when it is actually looked at, not on load behind the fold.
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries, obs) {
          entries.forEach(function (e) {
            if (e.isIntersecting) { node.classList.add('on'); obs.disconnect(); }
          });
        }, { threshold: 0.4 }).observe(node);
      } else {
        node.classList.add('on');
      }
    }

    // "Off the cut" and "off the event" would have been two different meanings
    // of off in the same list, so the wording splits them: one is time taken
    // away, the other is time still to find.
    var years = pts.length - 1;
    var bare = function (v) { return S.formatGap(v).replace(/^[+-]/, ''); };
    el('tally').innerHTML =
      row('Taken off the 400 free', bare(c.totalDrop),
        'in ' + years + ' season' + (years === 1 ? '' : 's')) +
      row('Where it started', pts[0].time, pts[0].season) +
      row('Where it is now', pts[pts.length - 1].time, pts[pts.length - 1].season) +
      (cut ? row('Still to find', bare(pts[pts.length - 1].v - cut),
        'the cut is ' + cutRaw) : '');

    function row(k, v, sub) {
      return '<div><dt>' + esc(k) + '</dt><dd>' + esc(v) +
        '<small>' + esc(sub) + '</small></dd></div>';
    }
  }

  // ---- him ----
  function him() {
    var a = SWIMMER.academics || {}, sc = SWIMMER.school || {};
    el('about-1').innerHTML = 'Distance freestyler with ' + esc(SWIMMER.club) +
      ', training under ' + esc(SWIMMER.coach) + '. Lives in ' + esc(SWIMMER.city) +
      ', ' + esc(SWIMMER.province) + '. Started racing in spring 2022.';
    el('about-2').textContent = R && R.trainingLine ? R.trainingLine(SWIMMER, 'third') : '';

    var kv = [
      ['Class of', SWIMMER.classOf],
      ['School', sc.name || ''],
      ['GPA', a.gpa ? a.gpa + ' of ' + a.gpaScale : ''],
      ['Wants to study', (a.interests || []).join(', ')],
      ['Born', '2011']
    ];
    (SWIMMER.recognition || []).slice(0, 2).forEach(function (r) {
      kv.push(['Selected for', r.label]);
    });
    el('about-kv').innerHTML = kv.filter(function (p) { return p[1]; }).map(function (p) {
      return '<div><dt>' + esc(p[0]) + '</dt><dd>' + esc(p[1]) + '</dd></div>';
    }).join('');
  }

  // ---- reach ----
  function reach() {
    el('reach-lede').textContent =
      'He is class of ' + SWIMMER.classOf + '. Canadian, Division II and Division III coaches ' +
      'may reply at any time. Division I coaches cannot write back until 15 June 2027, ' +
      'and he is not expecting them to.';
    var u = ['hammondluke11', 'icloud.com'].join('@');
    el('reach-kv').innerHTML = [
      ['Email', '<a href="mailto:' + u + '">' + u + '</a>'],
      ['Club', esc(SWIMMER.club) + ', ' + esc(SWIMMER.clubCity)],
      ['Coach', esc(SWIMMER.coach)],
      ['SwimCloud', '<a href="' + esc(SWIMMER.swimcloud) + '" target="_blank" rel="noopener">' +
        esc(String(SWIMMER.swimcloud).replace(/^https?:\/\/(www\.)?/, '')) + '</a>'],
      ['One page', '<a href="onepager.html">Printable summary</a>']
    ].map(function (p) {
      return '<div><dt>' + esc(p[0]) + '</dt><dd>' + p[1] + '</dd></div>';
    }).join('');
  }

  function render(results) {
    var bests = S.personalBests(results);
    var yards = C ? C.yardBests(S, results) : {};
    var rankings = D.seedRankings();
    hero(results, bests, rankings);
    board(results, bests, yards, rankings);
    curve(results);
    him();
    reach();
    el('foot-1').textContent = SWIMMER.name + ' · ' + SWIMMER.club;
    var newest = results.map(function (r) { return r.date; }).sort().pop();
    el('foot-2').textContent = 'Times current to ' + when(newest);
  }

  render(clean(D.SEED_RESULTS));

  // Live data when the back end answers, the shipped record when it does not.
  fetch('/api/results').then(function (r) { return r.json(); }).then(function (body) {
    if (body && Array.isArray(body.results) && body.results.length) render(clean(body.results));
  }).catch(function () { /* the seed is already on screen */ });
})();
