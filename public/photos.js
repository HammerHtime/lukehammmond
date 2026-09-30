// photos.js
// The rules for the photo library. Pure logic, no browser and no network,
// so the admin screen, the public page and the server all agree on what a
// photo is and which one is the main one.

(function () {

// What the uploader accepts. A camera original is many megabytes, so the
// admin screen shrinks and re-encodes before anything is sent. That re-encode
// also drops the EXIF block, which is how the GPS coordinates on Luke's
// earlier photos leave the file rather than being published.
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 4 * 1024 * 1024;   // after shrinking, not before
const MAX_EDGE = 2200;               // long edge, in pixels
const QUALITY = 0.82;

// What the bytes actually are, read from their first few bytes, or null.
// The declared type used to be trusted, so a file that said image/jpeg was
// stored and served publicly as one whatever it contained. Admin only, so the
// risk was small, but the check is a dozen lines. Takes a Buffer or Uint8Array.
function sniffType(bytes) {
  if (!bytes || bytes.length < 12) return null;
  const b = function (i) { return bytes[i]; };
  if (b(0) === 0xFF && b(1) === 0xD8 && b(2) === 0xFF) return 'image/jpeg';
  if (b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4E && b(3) === 0x47 &&
      b(4) === 0x0D && b(5) === 0x0A && b(6) === 0x1A && b(7) === 0x0A) return 'image/png';
  if (b(0) === 0x52 && b(1) === 0x49 && b(2) === 0x46 && b(3) === 0x46 &&
      b(8) === 0x57 && b(9) === 0x45 && b(10) === 0x42 && b(11) === 0x50) return 'image/webp';
  return null;
}

function isAllowedType(type) {
  return ALLOWED.indexOf(String(type || '').toLowerCase()) !== -1;
}

function normalisePhoto(raw) {
  const input = raw || {};
  const errors = [];

  const id = String(input.id || '').trim();
  if (!/^[a-z0-9-]{6,64}$/.test(id)) errors.push('Photo id is missing or not usable.');
  if (!isAllowedType(input.type)) errors.push('That is not a JPEG, PNG or WebP.');

  const bytes = Number(input.bytes);
  if (!Number.isFinite(bytes) || bytes <= 0) errors.push('The file is empty.');
  else if (bytes > MAX_BYTES) errors.push('Still too large after shrinking.');

  if (errors.length) return { ok: false, errors: errors };

  return {
    ok: true,
    photo: {
      id: id,
      type: String(input.type).toLowerCase(),
      bytes: Math.round(bytes),
      width: Number(input.width) || 0,
      height: Number(input.height) || 0,
      // The caption is what a coach reads, and what a screen reader reads.
      caption: String(input.caption || '').trim().slice(0, 140),
      addedOn: /^\d{4}-\d{2}-\d{2}$/.test(String(input.addedOn || ''))
        ? input.addedOn
        : new Date().toISOString().slice(0, 10),
      main: Boolean(input.main)
    }
  };
}

// Exactly one main photo, always. Marking a new one unmarks the rest, because
// two mains is not a state the page can render and neither is none.
function setMain(photos, id) {
  const list = (photos || []).map(function (p) {
    return Object.assign({}, p, { main: p.id === id });
  });
  return list.some(function (p) { return p.main; }) ? list : ensureMain(list);
}

// If nothing is marked, the newest photo leads. A gallery is never headless.
function ensureMain(photos) {
  const list = (photos || []).slice();
  if (!list.length) return list;
  if (list.some(function (p) { return p.main; })) return list;
  const newest = ordered(list)[0];
  return list.map(function (p) {
    return Object.assign({}, p, { main: p.id === newest.id });
  });
}

function mainPhoto(photos) {
  const list = ensureMain(photos);
  return list.filter(function (p) { return p.main; })[0] || null;
}

// Newest first. The point of the library is that this season's photos lead.
function ordered(photos) {
  return (photos || []).slice().sort(function (a, b) {
    if (a.addedOn !== b.addedOn) return String(b.addedOn).localeCompare(String(a.addedOn));
    return String(b.id).localeCompare(String(a.id));
  });
}

// The main photo first, then the rest newest first. This is the gallery order.
function galleryOrder(photos) {
  const list = ensureMain(photos);
  const main = mainPhoto(list);
  const rest = ordered(list).filter(function (p) { return !main || p.id !== main.id; });
  return main ? [main].concat(rest) : rest;
}

// Removing the main photo promotes the next one rather than leaving the page
// with a hole where the lead image was.
function removePhoto(photos, id) {
  const kept = (photos || []).filter(function (p) { return p.id !== id; });
  return ensureMain(kept.map(function (p) {
    return Object.assign({}, p, { main: p.main && p.id !== id });
  }));
}

function addPhoto(photos, photo) {
  const list = (photos || []).filter(function (p) { return p.id !== photo.id; });
  list.push(photo);
  return ensureMain(list);
}

function urlFor(photo) {
  return photo && photo.id ? '/api/photo/' + encodeURIComponent(photo.id) : '';
}

const api = {
  ALLOWED: ALLOWED,
  MAX_BYTES: MAX_BYTES,
  MAX_EDGE: MAX_EDGE,
  QUALITY: QUALITY,
  isAllowedType: isAllowedType,
  sniffType: sniffType,
  normalisePhoto: normalisePhoto,
  setMain: setMain,
  ensureMain: ensureMain,
  mainPhoto: mainPhoto,
  ordered: ordered,
  galleryOrder: galleryOrder,
  removePhoto: removePhoto,
  addPhoto: addPhoto,
  urlFor: urlFor
};

if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof window !== 'undefined') window.Photos = api;

})();
