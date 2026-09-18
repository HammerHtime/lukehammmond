// browser.test.js
// Loads the front end scripts the way a browser does, ie, all of them into one
// shared global scope, in the order the page lists them.
//
// This file exists because of a bug that every other test missed. Each module
// declared `const api` at the top level. Node gives every file its own scope,
// so all 232 checks passed. A browser gives them ONE scope, so the second
// script threw "Identifier 'api' has already been declared" and every script
// after it never ran. The public page showed stale times and the admin screen
// did not open at all, while the suite stayed green.
//
// The lesson generalises: a test that does not load the code the way the
// product loads it is not testing the product.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

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

// The script tags each page carries, in order. Keep these in step with the
// pages, which is what the last test in this file checks.
const PUBLIC = ['swim.js', 'swimmer.js', 'convert.js', 'photos.js', 'standards.js', 'recruiting.js'];
const ADMIN = ['swim.js', 'swimmer.js', 'convert.js', 'school-utils.js', 'photos.js', 'standards.js', 'board.js', 'recruiting.js'];

// One shared global, no `module`, exactly as a browser presents it.
function loadLikeABrowser(files) {
  const sandbox = { console: console, fetch: function () {}, Date: Date, Math: Math, JSON: JSON };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  const context = vm.createContext(sandbox);
  files.forEach(function (file) {
    const source = fs.readFileSync(path.join(__dirname, file), 'utf8');
    vm.runInContext(source, context, { filename: file });
  });
  return sandbox;
}

// ---------- the public page ----------
let publicScope = null;
let publicError = null;
try { publicScope = loadLikeABrowser(PUBLIC); } catch (err) { publicError = err; }

ok('the public page scripts load without throwing', publicError === null);
if (publicError) console.log('        ' + publicError.message);

if (publicScope) {
  ok('Swim is published', Boolean(publicScope.Swim));
  ok('SwimmerData is published', Boolean(publicScope.SwimmerData));
  ok('Convert is published', Boolean(publicScope.Convert));
  ok('Standards is published', Boolean(publicScope.Standards));
  ok('Recruiting is published', Boolean(publicScope.Recruiting));
  ok('Photos is published', Boolean(publicScope.Photos));

  // The page is useless if the later scripts silently never ran, which is
  // exactly how the bug presented. So exercise the last one loaded.
  const S = publicScope.Swim;
  const results = publicScope.SwimmerData.SEED_RESULTS
    .map(function (r) { return S.normaliseResult(r); })
    .filter(function (n) { return n.ok; })
    .map(function (n) { return n.result; });
  check('the 400 free reads through', S.personalBests(results)['400-free-LCM'].time, '4:10.86');
  check('the yards conversion reads through', publicScope.Convert.yardBests(S, results)['500-free-SCY'].time, '4:37.20');
  check('the contact rule reads through', publicScope.Recruiting.replyDateFor('D1', 2029), '2027-06-15');
}

// ---------- the admin page ----------
let adminScope = null;
let adminError = null;
try { adminScope = loadLikeABrowser(ADMIN); } catch (err) { adminError = err; }

ok('the admin page scripts load without throwing', adminError === null);
if (adminError) console.log('        ' + adminError.message);

if (adminScope) {
  ok('Board is published', Boolean(adminScope.Board));
  ok('Schools is published', Boolean(adminScope.Schools));
  // school-utils is the public half. It must expose the importer and nothing
  // resembling the board.
  ok('the importer is reachable in the browser', typeof adminScope.Schools.parsePaste === 'function');
  ok('the logo helper is reachable', typeof adminScope.Schools.logoFor === 'function');
  ok('the browser is never handed the school list', adminScope.Schools.SCHOOLS === undefined);
  ok('and never handed the seed', adminScope.Schools.seedSchools === undefined);
  ok('the board engine works in the browser', typeof adminScope.Board.scoreBoard === 'function');
}

// ---------- every front end file keeps its own scope ----------
// The shared-context load above is the real proof. This is the early warning:
// if someone unwraps a file, it fails here by name rather than as a confusing
// redeclaration error.
const unwrapped = [];
ADMIN.concat(PUBLIC).filter(function (f, i, all) { return all.indexOf(f) === i; }).forEach(function (file) {
  const source = fs.readFileSync(path.join(__dirname, file), 'utf8');
  const firstCode = source.split('\n').filter(function (line) {
    return line.trim() && !line.trim().startsWith('//');
  })[0] || '';
  if (firstCode.trim() !== '(function () {') unwrapped.push(file);
});
check('every front end file is wrapped in its own scope', unwrapped, []);

// ---------- the pages load what this file claims they load ----------
function tagsIn(page) {
  const html = fs.readFileSync(path.join(__dirname, page), 'utf8');
  const found = [];
  const re = /<script src="([^"]+)"><\/script>/g;
  let m;
  // Relative sources only. A page may also pull a library off a CDN, which is
  // not part of this repo and not this test's business.
  while ((m = re.exec(html)) !== null) if (!/^https?:/.test(m[1])) found.push(m[1]);
  return found;
}
const publicTags = tagsIn('index.html').filter(function (f) { return f !== 'live-profile.js'; });
const adminTags = tagsIn('admin.html');
check('index.html loads what this test loads', publicTags, PUBLIC);
check('admin.html loads what this test loads', adminTags, ADMIN);

// The data file must never appear in a page. That is the leak this repo
// already had once.
ok('no page loads the school data file',
  tagsIn('index.html').concat(adminTags).indexOf('schools.js') === -1);

console.log((failed === 0 ? '  PASS' : '  FAIL') + '  browser.test.js  ' + (passed + failed) + ' checks, ' + failed + ' failed');
process.exit(failed === 0 ? 0 : 1);
