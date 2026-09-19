// onepager.js
// Builds the coach one-pager from the stored results.
//
// Nothing on the sheet is typed. A PDF written out by hand is correct on the
// day it is made and wrong a meet later, and a coach reading a slower time than
// the swimmer owns is worse off than a coach reading nothing.

(function () {
  'use strict';

  var S = window.Swim, C = window.Convert, D = window.SwimmerData;
  if (!S || !D) return;
  var SWIMMER = D.SWIMMER;

  function esc(v) {
    return String(v === null || v === undefined ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function shortDate(d) {
    var p = String(d).split('-');
    return p.length === 3 ? MONTHS[Number(p[1]) - 1] + ' ' + p[0] : '';
  }
  function today() {
    var n = new Date();
    return n.getDate() + ' ' + ['January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'][n.getMonth()] + ' ' + n.getFullYear();
  }

  function clean(raw) {
    return (raw || []).map(function (r) { return S.normaliseResult(r); })
      .filter(function (n) { return n.ok; }).map(function (n) { return n.result; });
  }

  // The events a coach is being asked to look at: his stated primaries, plus
  // anything he is nationally ranked in. Ranked and not shown would be the one
  // number worth printing left off the page.
  function eventsToShow(bests, rankings) {
    var ids = (SWIMMER.primary || []).map(function (p) {
      return S.eventId(p.distance, p.stroke, p.course);
    });
    Object.keys(rankings).forEach(function (id) {
      if (ids.indexOf(id) === -1 && bests[id]) ids.push(id);
    });
    return ids.filter(function (id) { return bests[id]; });
  }

  function timesTable(bests, yards, rankings) {
    var rows = eventsToShow(bests, rankings).map(function (id) {
      var b = bests[id];
      var map = C && C.mappingFor ? C.mappingFor(id) : null;
      var y = map && yards[map.to];
      var rank = rankings[id];
      return '<tr>' +
        '<td>' + esc(b.distance) + 'm ' + esc(S.STROKE_LABEL[b.stroke]) + '</td>' +
        '<td class="t">' + esc(b.time) + '</td>' +
        '<td class="y">' + (y ? esc(y.time) + ' <span style="color:var(--faint)">' +
          esc(y.name) + '</span>' : '<span style="color:var(--faint)">&mdash;</span>') + '</td>' +
        '<td>' + (rank ? '<span class="rank">#' + esc(rank.rank) + ' Canada</span>' : '') + '</td>' +
        '<td class="y">' + esc(shortDate(b.date)) + '</td>' +
        '</tr>';
    }).join('');

    return '<table><thead><tr>' +
      '<th>Event</th><th>Best, metres</th><th>Yards equivalent</th>' +
      '<th>Ranking</th><th>Swum</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table>' +
      '<p class="note">Yards times are converted from the metres swim beside them. ' +
      'He races in Canada and has never swum a yard, so every yards figure here is an ' +
      'equivalent, not a result. Rankings are Canadian, for age.</p>';
  }

  // A QR to the profile, drawn if the library loads and simply left out if it
  // does not. A missing square is nothing; a broken image on a coach's desk is
  // worse than no square at all.
  function drawQr(url) {
    var host = document.getElementById('qr');
    if (!host || !window.qrcode) return;
    try {
      var q = window.qrcode(0, 'M');
      q.addData(url);
      q.make();
      host.innerHTML = q.createSvgTag({ cellSize: 3, margin: 0, scalable: true });
      host.insertAdjacentHTML('beforeend', '<div class="qr-label">Full profile</div>');
    } catch (err) { /* no square, no harm */ }
  }

  function render(results, rankings, coach) {
    var bests = S.personalBests(results);
    var yards = C ? C.yardBests(S, results) : {};
    var site = location.origin;
    var academics = SWIMMER.academics || {};
    var school = SWIMMER.school || {};

    var recognition = (SWIMMER.recognition || []).slice(0, 5).map(function (r) {
      return '<li>' + esc(r.label) + (r.detail ? ', ' + esc(r.detail) : '') + '</li>';
    }).join('');

    document.getElementById('sheet').innerHTML =
      '<div class="bar">' +
        '<div>' +
          '<h1>' + esc(SWIMMER.name) + '</h1>' +
          '<div class="tagline">Distance freestyle · Class of ' + esc(SWIMMER.classOf) +
            ' · ' + esc(SWIMMER.clubCity || SWIMMER.city) + ', ' + esc(SWIMMER.province) + '</div>' +
        '</div>' +
        '<div class="bar-right">' +
          esc(SWIMMER.club) + '<br>' +
          esc(school.name || '') +
        '</div>' +
      '</div>' +

      '<h2>Best times</h2>' + timesTable(bests, yards, rankings) +

      '<div class="cols">' +
        '<div>' +
          '<h2>Academics</h2>' +
          '<dl class="pair">' +
            '<dt>School</dt><dd>' + esc(school.name || '') +
              (school.programme ? ', ' + esc(school.programme) : '') + '</dd>' +
            '<dt>GPA</dt><dd>' + esc(academics.gpa || '') +
              (academics.gpaScale ? ' of ' + esc(academics.gpaScale) : '') + '</dd>' +
            '<dt>Interest</dt><dd>' + esc((academics.interests || []).join(', ')) + '</dd>' +
            '<dt>Graduates</dt><dd>June ' + esc(SWIMMER.classOf) + '</dd>' +
          '</dl>' +
        '</div>' +
        '<div>' +
          '<h2>Contact</h2>' +
          '<dl class="pair">' +
            '<dt>Club</dt><dd>' + esc(SWIMMER.club) + '</dd>' +
            '<dt>Coach</dt><dd>' + esc((coach && coach.name) || SWIMMER.coach) +
              ((coach && coach.email) ? '<br>' + esc(coach.email) : '') + '</dd>' +
            '<dt>Profile</dt><dd>' + esc(site.replace(/^https?:\/\//, '')) + '</dd>' +
            '<dt>SwimCloud</dt><dd>' + esc(String(SWIMMER.swimcloud || '')
              .replace(/^https?:\/\/(www\.)?/, '')) + '</dd>' +
          '</dl>' +
        '</div>' +
      '</div>' +

      (recognition ? '<h2>Selected for</h2><ul class="plain">' + recognition + '</ul>' : '') +

      '<div class="foot">' +
        '<div>Every time on this sheet is read from his record on the day it was printed, ie, ' +
          'nothing here is typed out and left to go stale.<br>Printed ' + esc(today()) + '.</div>' +
        '<div class="qr" id="qr"></div>' +
      '</div>';

    drawQr(site + '/');
  }

  // Live data where it exists, the shipped record where it does not, so the
  // sheet prints correctly even if the back end is unreachable.
  Promise.all([
    fetch('/api/results').then(function (r) { return r.json(); }).catch(function () { return {}; }),
    fetch('/api/profile').then(function (r) { return r.json(); }).catch(function () { return {}; })
  ]).then(function (both) {
    var raw = both[0] && Array.isArray(both[0].results) && both[0].results.length
      ? both[0].results : D.SEED_RESULTS;
    var rankings = both[1] && both[1].profile
      ? D.rankingsFrom(both[1].profile) : D.seedRankings();
    var coach = (both[1] && both[1].profile && both[1].profile.coach) || {};
    render(clean(raw), rankings, coach);
  });

  var btn = document.getElementById('printIt');
  if (btn) btn.addEventListener('click', function () { window.print(); });
})();
