/** Lazily-created Supabase client, shared by the storage and auth modules. */

import { createClient } from '@supabase/supabase-js';

import { SUPABASE_ANON_KEY, SUPABASE_URL } from './env.js';

let client = null;

export function getClient() {
  if (client) return client;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // The app has no OAuth redirects, so nothing useful is ever in the URL.
      detectSessionInUrl: false,
    },
  });

  return client;
}
