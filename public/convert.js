// convert.js
// Metres to yards. The single most important translation in this project.
//
// Luke races metres. Every NCAA programme races short course yards. A coach
// reading 4:10.86 for a 400 free has to do arithmetic before he knows whether
// to care. He will not. So the board works in yards.
//
// Where these numbers come from, and why it is written down this way.
// No published NCAA or USA Swimming factor table could be verified on
// 18 September 2026. What we do have is ten metric times and their yard
// equivalents, supplied by Andrew on 18 September 2026 and produced using
// NCAA conversion factors. Each factor below is the quotient of that pair,
// and the pair itself is stored beside it so anyone can re-derive it.
//
// This is an estimate and the board labels it as one. Replace this table with
// the official NCAA factors the moment they can be read from source.

// Wrapped in a function on purpose. The browser runs every script tag in ONE
// shared scope, so two files that both declare `const api` at the top level
// throw "Identifier 'api' has already been declared" and every script after
// the first one dies silently. Node gives each file its own scope, so the
// whole test suite passed while the live site was broken. browser.test.js now
// loads these the way a browser does, which is the only way to see it.
(function () {

const SOURCE = 'Derived from converted times supplied by Andrew, 18 September 2026';

// Distance freestyle does not map event to event. 400 metres becomes the
// 500 yards, 800 becomes the 1000, 1500 becomes the 1650. The factor carries
// the change of distance as well as the change of unit, which is why two of
// them are greater than one.
const MAPPINGS = [
  { from: '50-free-LCM',    to: '50-free-SCY',   factor: 0.8596, pair: ['26.43', '22.72'] },
  { from: '100-free-LCM',   to: '100-free-SCY',  factor: 0.8629, pair: ['55.88', '48.22'] },
  { from: '200-free-LCM',   to: '200-free-SCY',  factor: 0.8650, pair: ['1:59.75', '1:43.58'] },
  { from: '400-free-LCM',   to: '500-free-SCY',  factor: 1.1050, pair: ['4:10.86', '4:37.20'] },
  { from: '800-free-LCM',   to: '1000-free-SCY', factor: 1.1050, pair: ['8:43.49', '9:38.45'] },
  { from: '1500-free-LCM',  to: '1650-free-SCY', factor: 0.9650, pair: ['16:59.80', '16:24.10'] },
  { from: '100-back-LCM',   to: '100-back-SCY',  factor: 0.8350, pair: ['1:04.17', '53.58'] },
  { from: '200-back-LCM',   to: '200-back-SCY',  factor: 0.8490, pair: ['2:14.23', '1:53.96'] },
  { from: '200-im-LCM',     to: '200-im-SCY',    factor: 0.8570, pair: ['2:19.92', '1:59.91'] },
  { from: '400-im-LCM',     to: '400-im-SCY',    factor: 0.8650, pair: ['4:52.37', '4:12.90'] }
];

// Events with no pair on file get no conversion. The board shows a dash, not
// a guess. A wrong yard time sent to a coach is worse than no yard time.
const BY_FROM = {};
MAPPINGS.forEach(function (m) { BY_FROM[m.from] = m; });

function mappingFor(eventId) {
  return BY_FROM[eventId] || null;
}

// Convert one metric best into its yard equivalent.
// Returns null when there is no mapping, which the caller must handle as
// "not known", never as zero.
function toYards(swim, result) {
  if (!result || !Number.isFinite(result.hundredths)) return null;
  const mapping = mappingFor(result.event);
  if (!mapping) return null;

  const hundredths = Math.round(result.hundredths * mapping.factor);
  const parts = /^(\d+)-([a-z]+)-SCY$/.exec(mapping.to);

  return {
    event: mapping.to,
    distance: parts ? Number(parts[1]) : null,
    stroke: parts ? parts[2] : '',
    course: 'SCY',
    name: parts ? swim.eventName(Number(parts[1]), parts[2]) : mapping.to,
    time: swim.formatTime(hundredths),
    hundredths: hundredths,
    estimated: true,
    from: { event: result.event, time: result.time, date: result.date, meet: result.meet },
    factor: mapping.factor,
    source: SOURCE
  };
}

// Every yard equivalent we can produce from a set of results, best per event.
// Long course is preferred over short course metres when both could map,
// because the mapping table was built from long course pairs.
function yardBests(swim, results) {
  const bests = swim.personalBests(results);
  const out = {};
  Object.keys(bests).forEach(function (eventId) {
    const yards = toYards(swim, bests[eventId]);
    if (!yards) return;
    const held = out[yards.event];
    if (!held || yards.hundredths < held.hundredths) out[yards.event] = yards;
  });
  return out;
}

// What the board should actually compare against.
//
// American programmes race short course yards, which he has never swum, so
// those comparisons run on converted times and say so on every rung. Canadian
// programmes race short course metres, which he races every winter, so those
// comparisons run on times he actually swam. No conversion, no estimate, no
// caveat.
//
// Merging them is the whole trick: the engine looks an event up by id, so a
// '400-free-SCM' benchmark finds his real 400 free and a '500-free-SCY'
// benchmark finds the converted one, with no special case anywhere downstream.
function boardBests(swim, results) {
  const out = {};
  const yards = yardBests(swim, results);
  Object.keys(yards).forEach(function (id) { out[id] = yards[id]; });

  // His own metres swims, untouched. estimated stays false, which is what
  // makes the ladder drop the "converted" label on a Canadian card.
  const bests = swim.personalBests(results);
  Object.keys(bests).forEach(function (id) {
    if (id.indexOf('-SCM') === -1) return;
    const best = bests[id];
    out[id] = {
      event: id, distance: best.distance, stroke: best.stroke, course: 'SCM',
      name: best.name, time: best.time, hundredths: best.hundredths,
      estimated: false, from: null, factor: null,
      source: 'Swum, not converted.'
    };
  });
  return out;
}

const api = {
  SOURCE: SOURCE,
  MAPPINGS: MAPPINGS,
  mappingFor: mappingFor,
  toYards: toYards,
  yardBests: yardBests,
  boardBests: boardBests
};

if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof window !== 'undefined') window.Convert = api;

// Known precision. Re-running the ten supplied pairs through this table
// reproduces eight exactly and two a hundredth out, because the factors are
// held to four decimals. Anything comparing against the supplied numbers
// should allow one hundredth. Do not chase the last hundredth by tuning a
// factor to fit one event, ie, that is fitting noise.

})();
