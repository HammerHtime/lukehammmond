// visits.js
// Reading the visit counts back. Private, because who is looking at Luke's
// page is his business and not the internet's.

import { readJson, isAdmin, json, denied, needsSetup } from './lib/store.js';

export default async (request) => {
  if (!process.env.ADMIN_KEY) return needsSetup();
  if (!isAdmin(request)) return denied();
  if (request.method !== 'GET') return json({ error: 'Method not allowed.' }, 405);
  // Both halves in one call: who opened their own link, and how busy the site
  // has been overall.
  return json({
    visits: await readJson('visits', {}),
    traffic: await readJson('traffic', null)
  });
};

export const config = { path: '/api/visits' };
