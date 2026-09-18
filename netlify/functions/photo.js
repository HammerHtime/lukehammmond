// photo.js
// Serves one photo's bytes. Public, because the gallery is public.
//
// A photo is never edited in place. Changing a picture means uploading a new
// one with a new id, so the bytes behind an id never change and the answer can
// be cached hard. That is what keeps a gallery of a dozen photos from costing
// a function call every time a coach scrolls.

import { store, json } from './lib/store.js';

export default async (request, context) => {
  if (request.method !== 'GET') return json({ error: 'Method not allowed.' }, 405);

  const id = String((context.params && context.params.id) || '');
  if (!/^[a-z0-9-]{6,64}$/.test(id)) return json({ error: 'Not found.' }, 404);

  let result;
  try {
    result = await store().getWithMetadata('photo/' + id, { type: 'arrayBuffer' });
  } catch (err) {
    result = null;
  }
  if (!result || !result.data) return json({ error: 'Not found.' }, 404);

  const type = (result.metadata && result.metadata.type) || 'image/jpeg';
  return new Response(result.data, {
    headers: {
      'content-type': type,
      'cache-control': 'public, max-age=31536000, immutable',
      'x-content-type-options': 'nosniff'
    }
  });
};

export const config = { path: '/api/photo/:id' };
