// store.js
// Storage and the door. Everything the back end writes goes through here.
//
// Netlify Blobs holds the data. No database to run, no table to migrate, and
// it survives a redeploy, which a file in the repo does not when the site is
// dragged onto Netlify by hand.

import { getStore } from '@netlify/blobs';
import { timingSafeEqual } from 'node:crypto';

const STORE = 'swim-recruit';

export function store() {
  return getStore(STORE);
}

export async function readJson(key, fallback) {
  try {
    const value = await store().get(key, { type: 'json' });
    return value === null || value === undefined ? fallback : value;
  } catch (err) {
    return fallback;
  }
}

export async function writeJson(key, value) {
  await store().setJSON(key, value);
  return value;
}

// The door. One shared key, held in the ADMIN_KEY environment variable on
// Netlify. Compared in constant time so the comparison itself cannot be used
// to guess the key one character at a time.
export function isAdmin(request) {
  const expected = process.env.ADMIN_KEY || '';
  if (!expected) return false;
  const supplied = request.headers.get('x-admin-key') || '';
  if (supplied.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
  } catch (err) {
    return false;
  }
}

export function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
  });
}

export function denied() {
  return json({ error: 'Not allowed.' }, 401);
}

export function needsSetup() {
  return json({ error: 'ADMIN_KEY is not set on this site, so the back end is closed.' }, 503);
}
