// meets.js
// The club's meet calendar, for the admin page only. It feeds one line of the
// coach email. It is never public, because a list of where a minor will be on
// which dates is not something this site publishes. See /meets.js at the root.

import { isAdmin, json, denied, needsSetup } from './lib/store.js';
import meetsLib from '../../meets.js';

export default async (request) => {
  if (!process.env.ADMIN_KEY) return needsSetup();
  if (!isAdmin(request)) return denied();
  if (request.method !== 'GET') return json({ error: 'Method not allowed.' }, 405);
  return json({ season: meetsLib.SEASON, meets: meetsLib.MEETS });
};

export const config = { path: '/api/meets' };
