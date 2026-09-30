// functions.test.js
// Runs the real server functions, not a reading of their source.
//
// Until 30 September every check on the back end read the function files as
// text and looked for a line. That proves a line is there, not that the
// function does the right thing with it. This copies the functions into a
// scratch folder, puts an in-memory stand-in where Netlify Blobs would be, and
// sends them real requests. Nothing here touches the live site.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');

let passed = 0;
let failed = 0;
function ok(name, condition) {
  if (condition) { passed += 1; return; }
  failed += 1;
  console.log('  FAIL  ' + name);
}
function check(name, actual, expected) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { passed += 1; return; }
  failed += 1;
  console.log('  FAIL  ' + name + '\n        got      ' + a + '\n        expected ' + e);
}

// ---------- a scratch copy of the back end ----------
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lukehammond-fn-'));
function copy(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}
function copyDir(from, to) {
  fs.readdirSync(from, { withFileTypes: true }).forEach(function (e) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) copyDir(a, b); else copy(a, b);
  });
}
copyDir(path.join(__dirname, 'netlify', 'functions'), path.join(root, 'netlify', 'functions'));
fs.readdirSync(path.join(__dirname, 'public')).filter(function (f) { return /\.js$/.test(f); })
  .forEach(function (f) { copy(path.join(__dirname, 'public', f), path.join(root, 'public', f)); });
copy(path.join(__dirname, 'schools.js'), path.join(root, 'schools.js'));
// Netlify bundles the functions as modules. Plain Node needs telling.
fs.writeFileSync(path.join(root, 'netlify', 'functions', 'package.json'), '{"type":"module"}');

// The stand-in for Netlify Blobs: one Map, the calls the functions use.
const blobs = path.join(root, 'node_modules', '@netlify', 'blobs');
fs.mkdirSync(blobs, { recursive: true });
fs.writeFileSync(path.join(blobs, 'package.json'), '{"name":"@netlify/blobs","main":"index.js"}');
fs.writeFileSync(path.join(blobs, 'index.js'), `
const data = globalThis.__BLOBS__ || (globalThis.__BLOBS__ = new Map());
exports.getStore = function () {
  return {
    async get(key, opts) {
      if (!data.has(key)) return null;
      const v = data.get(key).value;
      return opts && opts.type === 'json' ? JSON.parse(v) : v;
    },
    async getWithMetadata(key) {
      if (!data.has(key)) return null;
      return { data: data.get(key).value, metadata: data.get(key).metadata || {} };
    },
    async setJSON(key, value) { data.set(key, { value: JSON.stringify(value) }); },
    async set(key, value, opts) { data.set(key, { value: value, metadata: (opts && opts.metadata) || {} }); },
    async delete(key) { data.delete(key); }
  };
};`);

const KEY = 'k'.repeat(40);
process.env.ADMIN_KEY = KEY;

function req(method, url, body, key) {
  const headers = { 'content-type': 'application/json' };
  if (key !== null) headers['x-admin-key'] = key === undefined ? KEY : key;
  return new Request('https://test.local' + url, {
    method: method, headers: headers,
    body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body))
  });
}
async function call(fn, method, url, body, key) {
  const res = await fn(req(method, url, body, key));
  let payload = null;
  try { payload = await res.clone().json(); } catch (e) { payload = null; }
  return { status: res.status, body: payload, res: res };
}

(async function () {
  const load = function (name) {
    return import(pathToFileURL(path.join(root, 'netlify', 'functions', name + '.js')).href)
      .then(function (m) { return m.default; });
  };
  const profile = await load('profile');
  const results = await load('results');
  const photos = await load('photos');
  const SD = require(path.join(__dirname, 'public', 'swimmer.js'));
  const S = require(path.join(__dirname, 'public', 'swim.js'));

  // ---------- the door ----------
  check('no key, no write', (await call(profile, 'PUT', '/api/profile', { profile: {} }, null)).status, 401);
  check('wrong key, no write', (await call(profile, 'PUT', '/api/profile', { profile: {} }, 'x'.repeat(40))).status, 401);
  check('reading is public', (await call(profile, 'GET', '/api/profile', undefined, null)).status, 200);

  // ---------- profile ----------
  const real = { rankings: SD.seedRankings(), coach: { name: 'Aris Bousoulegkas', email: 'coach@example.com' } };
  check('the save the admin page sends is stored', (await call(profile, 'PUT', '/api/profile', { profile: real })).status, 200);
  const back = (await call(profile, 'GET', '/api/profile', undefined, null)).body;
  check('and read back as rankings and coach only', Object.keys(back.profile).sort(), ['coach', 'rankings']);
  check('with all ten ranks', Object.keys(back.profile.rankings).length, 10);
  check('each still naming its source', back.profile.rankings['400-free-LCM'].source,
    'CSCA TAG Rankings, Volume 4, September 2026');

  const sneaky = await call(profile, 'PUT', '/api/profile', { profile: Object.assign({ homeAddress: '1 Main St' }, real) });
  check('an extra field is refused', sneaky.status, 400);
  ok('and the refusal names it', /homeAddress/.test(sneaky.body.error));
  const after = (await call(profile, 'GET', '/api/profile', undefined, null)).body;
  ok('and nothing about it reached the public read', JSON.stringify(after).indexOf('Main St') === -1);

  check('a bad rank is refused', (await call(profile, 'PUT', '/api/profile',
    { profile: { rankings: { '400-free-LCM': { rank: 0 } }, coach: {} } })).status, 400);
  check('a huge body is refused before it is read as JSON',
    (await call(profile, 'PUT', '/api/profile', '{"profile":{"rankings":{},"coach":{"name":"' + 'x'.repeat(70000) + '"}}}')).status, 413);
  check('broken JSON is refused', (await call(profile, 'PUT', '/api/profile', '{nope')).status, 400);

  // ---------- results ----------
  const seed = SD.SEED_RESULTS.map(function (r) { return S.normaliseResult(r).result; });
  const put = await call(results, 'PUT', '/api/results', { results: seed });
  check('every swim on record is accepted', put.status, 200);
  check('and all of them stored', put.body.count, 129);
  // The admin page adds one swim and sends the whole list back.
  const one = S.normaliseResult({ distance: 400, stroke: 'free', course: 'LCM', time: '4:09.99', date: '2026-10-04', meet: 'Test' }).result;
  const stored = (await call(results, 'GET', '/api/results', undefined, null)).body.results;
  const put2 = await call(results, 'PUT', '/api/results', { results: stored.concat([one]) });
  check('a new swim added to what is stored is accepted', put2.status, 200);
  check('so a save from the phone after a meet still works', put2.body.count, 130);
  const bad = await call(results, 'PUT', '/api/results', { results: stored.concat([{ distance: 400, stroke: 'free', course: 'LCM', time: 'fast' }]) });
  check('a swim that fails the check is refused', bad.status, 400);
  ok('and the refusal says which one', /^Swim 130 /.test(bad.body.error));
  check('and nothing was overwritten', (await call(results, 'GET', '/api/results', undefined, null)).body.results.length, 130);
  const many = []; for (let i = 0; i < 2001; i += 1) many.push(one);
  check('more than 2000 swims is refused', (await call(results, 'PUT', '/api/results', { results: many })).status, 413);
  const junk = await call(results, 'PUT', '/api/results', { results: [Object.assign({ script: '<x>' }, one)] });
  check('a swim with extra fields is stored', junk.status, 200);
  const reread = (await call(results, 'GET', '/api/results', undefined, null)).body.results;
  ok('but only as the checked swim, without them', reread.length === 1 && reread[0].script === undefined);

  // ---------- photos ----------
  const jpeg = fs.readFileSync(path.join(__dirname, 'public', 'uploads', 'og-card.jpg'));
  const meta = function (id, bytes) {
    return { id: id, type: 'image/jpeg', bytes: bytes.length, width: 1200, height: 630, caption: 'Test', addedOn: '2026-09-30' };
  };
  const good = await call(photos, 'POST', '/api/photos', { photo: meta('test-good-1', jpeg), data: jpeg.toString('base64') });
  check('a real JPEG is accepted', good.status, 200);
  const html = Buffer.from('<html><script>alert(1)</script></html>' + ' '.repeat(100));
  const fake = await call(photos, 'POST', '/api/photos', { photo: meta('test-fake-1', html), data: html.toString('base64') });
  check('a page of HTML labelled as a JPEG is refused', fake.status, 400);
  ok('with a plain reason', /not the image it says it is/.test(fake.body.error));
  const png = fs.readFileSync(path.join(__dirname, 'public', 'uploads', 'og-card.jpg'));
  const liar = await call(photos, 'POST', '/api/photos', { photo: Object.assign(meta('test-liar-1', png), { type: 'image/png' }), data: png.toString('base64') });
  check('a JPEG claiming to be a PNG is refused', liar.status, 400);
  const list = (await call(photos, 'GET', '/api/photos', undefined, null)).body.photos.map(function (p) { return p.id; });
  check('only the real one made the gallery', list, ['test-good-1']);

  fs.rmSync(root, { recursive: true, force: true });
  const label = failed ? 'FAIL' : 'PASS';
  console.log('  ' + label + '  functions.test.js  ' + (passed + failed) + ' checks, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})().catch(function (err) {
  console.log('  FAIL  functions.test.js could not run: ' + err.stack);
  process.exit(1);
});
