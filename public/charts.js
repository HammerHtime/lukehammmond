// charts.js
// The progression charts and the split panel.
//
// Both used to live inside index.html with their numbers typed in, and both
// had drifted. The 400 free chart ended at 4:11.47 and the split panel called
// 4:11.47 the personal best, while the back end had held 4:10.86 since May.
// The page was showing a slower time and labelling it his best.
//
// Everything here now reads the same results the time cards read, so entering
// a swim in the back end moves the cards, the charts and the split panel
// together. There is nothing left to keep in step by hand.

(function () {
  'use strict';

  var S = window.Swim;
  var St = window.Standards;
  if (!S) return;

  // Which events get a progression chart, and where each one draws.
  // Kept here rather than in the markup so the code and the page cannot
  // disagree about what is on screen.
  var PANELS = [
    { canvas: 'chart400', line: 'chart400-line', event: '400-free-LCM' },
    { canvas: 'chart800', line: 'chart800-line', event: '800-free-LCM' }
  ];

  // Fifty-metre splits, transcribed from the race result, one set per swim.
  //
  // These cannot come from the back end, because the back end stores a time
  // and not a race. So each set records WHICH swim it came from. That is the
  // whole point: the panel can then say "these are the splits from his 4:11.47
  // in March" and, if a faster swim has landed since, say that too, instead of
  // quietly presenting an old race as the current best.
  var SPLITS = {
    '400-free-LCM': {
      time: '4:11.47', date: '2026-03-08', meet: 'Ontario Junior International',
      splits: [28.91, 31.25, 31.86, 31.95, 32.13, 32.17, 32.30, 30.90]
    },
    '800-free-LCM': {
      time: '8:43.49', date: '2026-03-05', meet: 'Ontario Junior International',
      splits: [29.42, 32.22, 32.85, 33.18, 33.23, 33.58, 33.54, 34.01,
        33.50, 33.45, 33.40, 33.23, 33.35, 33.21, 31.72, 29.60]
    },
    '1500-free-LCM': {
      time: '16:59.80', date: '2026-03-07', meet: 'Ontario Junior International',
      splits: [30.55, 33.38, 33.98, 34.01, 34.33, 33.95, 33.90, 34.32, 34.20, 34.26,
        34.30, 34.05, 34.48, 34.31, 34.46, 34.53, 33.90, 34.36, 34.49, 34.08,
        34.45, 34.23, 34.54, 34.51, 34.87, 34.86, 34.58, 34.35, 32.95, 30.62]
    }
  };

  function hasSplits(eventId) { return Boolean(SPLITS[eventId]); }

  // Labels are the running distance, so they cannot fall out of step with the
  // number of splits. They used to be a second typed array beside the times.
  function labelsFor(record, eventId) {
    var per = eventId.indexOf('-SCY') !== -1 ? 25 : 50;
    return record.splits.map(function (v, i) { return String((i + 1) * per); });
  }

  function toSec(hundredths) { return hundredths / 100; }
  function fmt(seconds) {
    var m = Math.floor(seconds / 60);
    var s = (seconds - m * 60).toFixed(2);
    return m + ':' + (s.indexOf('.') === 1 ? '0' + s : s);
  }

  // Every stored swim for one event, oldest first. Four points or forty, it
  // draws the same. The back end holds season bests today; if Andrew starts
  // entering every meet, more points appear on their own.
  function seriesFor(results, eventId) {
    return (results || [])
      .filter(function (r) {
        // Normalised results carry `event`; raw ones do not. Both arrive here,
        // depending on whether the page or a test is calling.
        return (r.event || S.eventId(r.distance, r.stroke, r.course)) === eventId;
      })
      .map(function (r) {
        var h = Number.isFinite(r.hundredths) ? r.hundredths : S.parseTime(r.time);
        return { x: r.date, y: toSec(h), time: r.time };
      })
      .filter(function (p) { return Number.isFinite(p.y) && p.x; })
      .sort(function (a, b) { return a.x < b.x ? -1 : (a.x > b.x ? 1 : 0); });
  }

  function pbLine(series) {
    var best = Infinity;
    return series.map(function (p) {
      if (p.y < best) best = p.y;
      return { x: p.x, y: best };
    });
  }

  // "5:20.53 to 4:10.86 · 69.67s faster". Computed, so it cannot claim a drop
  // that the times on the same screen do not show.
  function headline(series) {
    if (series.length < 2) return '';
    var first = series[0], last = series[series.length - 1];
    var best = series.reduce(function (a, b) { return b.y < a.y ? b : a; });
    var drop = first.y - best.y;
    if (drop <= 0) return first.time;
    var shown = drop >= 60 ? fmt(drop) : drop.toFixed(2) + 's';
    return first.time + ' → ' + best.time +
      ' &nbsp;·&nbsp; <span style="color:var(--gold);">− ' + shown + '</span>';
  }

  var aqua = 'rgba(0,210,240,0.85)';
  var aquaDim = 'rgba(0,210,240,0.25)';
  var trialLine = 'rgba(232,184,75,0.5)';
  var gridColor = 'rgba(255,255,255,0.05)';
  var textColor = 'rgba(255,255,255,0.35)';

  var drawn = [];

  function makeChart(canvasId, series, cutSec, cutLabel) {
    var node = document.getElementById(canvasId);
    if (!node || !window.Chart || !series.length) return;

    var lows = series.map(function (p) { return p.y; });
    var yMin = Math.min.apply(null, lows) - 5;
    if (Number.isFinite(cutSec)) yMin = Math.min(yMin, cutSec - 5);
    var yMax = Math.max.apply(null, lows) + 5;

    var sets = [
      { label: 'Every swim on record', data: series, borderColor: 'transparent',
        backgroundColor: aquaDim, pointBackgroundColor: aqua, pointRadius: 4,
        pointHoverRadius: 6, showLine: false, order: 3 },
      { label: 'Personal best', data: pbLine(series), borderColor: aqua, borderWidth: 2,
        backgroundColor: 'transparent', pointRadius: 0, tension: 0.3, order: 2 }
    ];
    if (Number.isFinite(cutSec)) {
      sets.push({
        label: 'Junior Trials cut (' + cutLabel + ')',
        data: [{ x: series[0].x, y: cutSec }, { x: series[series.length - 1].x, y: cutSec }],
        borderColor: trialLine, borderWidth: 1.5, borderDash: [6, 4],
        backgroundColor: 'transparent', pointRadius: 0, order: 1
      });
    }

    drawn.push(new window.Chart(node.getContext('2d'), {
      type: 'line',
      data: { datasets: sets },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'nearest', intersect: true },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (c) { return c.dataset.label + ': ' + fmt(c.parsed.y); }
            }
          }
        },
        scales: {
          x: { type: 'time', time: { unit: 'month' },
            grid: { color: gridColor }, ticks: { color: textColor, font: { size: 10 } } },
          y: { reverse: true, min: yMin, max: yMax,
            grid: { color: gridColor },
            ticks: { color: textColor, font: { size: 10 },
              callback: function (v) { return fmt(v); } } }
        }
      }
    }));
  }

  function renderProgression(results) {
    drawn.forEach(function (c) { try { c.destroy(); } catch (e) { /* already gone */ } });
    drawn = [];
    PANELS.forEach(function (panel) {
      var series = seriesFor(results, panel.event);
      var line = document.getElementById(panel.line);
      if (line) line.innerHTML = headline(series);
      var cut = St && St.cutFor ? St.cutFor('can-jr-trials', panel.event) : null;
      makeChart(panel.canvas, series, cut ? toSec(S.parseTime(cut)) : NaN, cut || '');
    });
  }

  // ---- the split panel ----
  var splitsChart = null;
  var splitsOpener = null;

  function stat(label, value) {
    return '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);' +
      'border-radius:3px;padding:0.6rem 1rem;">' +
      '<div style="font-size:0.6rem;letter-spacing:0.15em;text-transform:uppercase;' +
      'color:var(--muted);margin-bottom:0.2rem;">' + label + '</div>' +
      '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:1.4rem;color:var(--gold);' +
      'letter-spacing:0.04em;">' + value + '</div></div>';
  }

  function openSplits(eventId, bests, opener) {
    var d = SPLITS[eventId];
    if (!d) return;
    var el = function (id) { return document.getElementById(id); };
    var modal = el('splits-modal');
    if (!modal) return;

    var splits = d.splits;
    var avg = splits.reduce(function (a, b) { return a + b; }, 0) / splits.length;
    var half = Math.floor(splits.length / 2);
    var firstHalf = splits.slice(0, half).reduce(function (a, b) { return a + b; }, 0) / half;
    var secondHalf = splits.slice(half).reduce(function (a, b) { return a + b; }, 0) / (splits.length - half);

    // The honest label. If a faster swim has landed since this race, the panel
    // says which race these splits are, rather than calling them the best.
    var best = bests && bests[eventId];
    var newer = best && S.parseTime(best.time) < S.parseTime(d.time);
    el('splits-label').textContent = newer
      ? 'Split analysis · ' + d.meet
      : 'Split analysis · personal best';
    // eventName takes a distance and a stroke, not an event id. Passing the id
    // put "400-free-LCM undefined" on screen.
    var parts = eventId.split('-');
    el('splits-title').textContent =
      parts[0] + 'm ' + S.STROKE_LABEL[parts[1]] + ' — ' + d.time;
    var note = el('splits-note');
    if (note) {
      note.textContent = newer
        ? 'These splits are from his ' + d.time + '. His best is now ' + best.time + '.'
        : '';
      note.style.display = newer ? '' : 'none';
    }

    el('splits-stats').innerHTML = [
      stat('Avg 50m', avg.toFixed(2) + 's'),
      stat('First half avg', firstHalf.toFixed(2) + 's'),
      stat('Second half avg', secondHalf.toFixed(2) + 's'),
      stat('Fastest 50m', Math.min.apply(null, splits).toFixed(2) + 's'),
      stat('Slowest 50m', Math.max.apply(null, splits).toFixed(2) + 's'),
      stat('Closing 50m', splits[splits.length - 1].toFixed(2) + 's')
    ].join('');

    var colors = splits.map(function (v, i) {
      if (i === splits.length - 1) return 'rgba(232,184,75,0.9)';
      if (i === 0) return 'rgba(232,184,75,0.6)';
      return v < avg ? aqua : 'rgba(0,210,240,0.35)';
    });

    if (splitsChart) { splitsChart.destroy(); splitsChart = null; }
    if (window.Chart) {
      splitsChart = new window.Chart(el('splits-chart').getContext('2d'), {
        type: 'bar',
        data: {
          labels: labelsFor(d, eventId).map(function (l) { return l + 'm'; }),
          datasets: [{ data: splits, backgroundColor: colors, borderWidth: 0 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false },
            tooltip: { callbacks: { label: function (c) { return c.parsed.y.toFixed(2) + 's'; } } } },
          scales: {
            x: { grid: { display: false }, ticks: { color: textColor, font: { size: 9 } } },
            y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 10 } } }
          }
        }
      });
    }

    splitsOpener = opener || null;
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    var close = modal.querySelector('[data-close-splits]');
    if (close) close.focus();
    document.addEventListener('keydown', escClose);
  }

  function closeSplits() {
    var modal = document.getElementById('splits-modal');
    if (!modal) return;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', escClose);
    if (splitsChart) { splitsChart.destroy(); splitsChart = null; }
    if (splitsOpener) splitsOpener.focus();
    splitsOpener = null;
  }

  function escClose(e) { if (e.key === 'Escape') closeSplits(); }

  document.addEventListener('DOMContentLoaded', function () {
    var modal = document.getElementById('splits-modal');
    if (!modal) return;
    modal.addEventListener('click', function (e) { if (e.target === modal) closeSplits(); });
    var close = modal.querySelector('[data-close-splits]');
    if (close) close.addEventListener('click', closeSplits);
  });

  window.Charts = {
    SPLITS: SPLITS,
    PANELS: PANELS,
    hasSplits: hasSplits,
    seriesFor: seriesFor,
    pbLine: pbLine,
    headline: headline,
    renderProgression: renderProgression,
    openSplits: openSplits,
    closeSplits: closeSplits
  };
})();
