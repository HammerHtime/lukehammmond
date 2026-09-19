// photos.js
// The photo library. Listing is public, because the gallery needs it.
// Adding, captioning, choosing the main one and removing all need the key.
//
// The bytes live in blob storage under the photo's own id. The index, ie, the
// list of what exists and which one leads, is a separate small JSON blob. That
// split means reading the gallery never loads a single image byte.

import { store, readJson, writeJson, isAdmin, json, denied, needsSetup } from './lib/store.js';
import lib from '../../public/photos.js';

const INDEX = 'photo-index';

export default async (request) => {
  if (request.method === 'GET') {
    const photos = await readJson(INDEX, []);
    return json({ photos: lib.galleryOrder(photos) });
  }

  if (!process.env.ADMIN_KEY) return needsSetup();
  if (!isAdmin(request)) return denied();

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return json({ error: 'Body was not readable JSON.' }, 400);
  }

  const photos = await readJson(INDEX, []);

  if (request.method === 'POST') {
    // The admin screen shrinks and re-encodes before sending, so what arrives
    // is already web sized and already stripped of its EXIF block.
    const checked = lib.normalisePhoto(body.photo);
    if (!checked.ok) return json({ error: checked.errors.join(' ') }, 400);

    const data = String(body.data || '');
    if (!data) return json({ error: 'No image data.' }, 400);

    let bytes;
    try {
      bytes = Buffer.from(data, 'base64');
    } catch (err) {
      return json({ error: 'Image data was not readable.' }, 400);
    }
    if (!bytes.length) return json({ error: 'Image data was empty.' }, 400);
    if (bytes.length > lib.MAX_BYTES) return json({ error: 'Image is too large.' }, 413);

    await store().set('photo/' + checked.photo.id, bytes, {
      metadata: { type: checked.photo.type }
    });
    const next = lib.addPhoto(photos, Object.assign({}, checked.photo, { bytes: bytes.length }));
    await writeJson(INDEX, next);
    return json({ ok: true, photos: lib.galleryOrder(next) });
  }

  if (request.method === 'PUT') {
    // Choosing the main photo, or editing a caption. Never touches the bytes.
    let next = photos;
    if (body.main) next = lib.setMain(next, String(body.main));
    if (body.caption && body.id) {
      const id = String(body.id);
      const caption = String(body.caption).trim().slice(0, 140);
      next = next.map(function (p) {
        return p.id === id ? Object.assign({}, p, { caption: caption }) : p;
      });
    }
    await writeJson(INDEX, next);
    return json({ ok: true, photos: lib.galleryOrder(next) });
  }

  if (request.method === 'DELETE') {
    const id = String(body.id || '');
    if (!id) return json({ error: 'No photo named.' }, 400);
    // The index is written first. If the blob delete then fails, the page has
    // already stopped showing the photo, which is the outcome that matters.
    const next = lib.removePhoto(photos, id);
    await writeJson(INDEX, next);
    try { await store().delete('photo/' + id); } catch (err) { /* orphan bytes, harmless */ }
    return json({ ok: true, photos: lib.galleryOrder(next) });
  }

  return json({ error: 'Method not allowed.' }, 405);
};

export const config = { path: '/api/photos' };
