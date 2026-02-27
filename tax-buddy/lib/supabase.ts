import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/auth-helpers-nextjs';

let serverClient: SupabaseClient | null = null;

/**
 * Returns the Supabase server client singleton.
 * Uses service role key for API routes, admin operations, and RAG.
 * Only use in server-side code (API routes, Server Components).
 */
export function getSupabaseServer(): SupabaseClient {
  if (!serverClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables'
      );
    }
    serverClient = createClient(url, key);
  }
  return serverClient;
}

/**
 * Creates a Supabase client for use in the browser.
 * Uses anon key and handles auth cookies automatically.
 * Use in Client Components.
 */
export function createSupabaseBrowserClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set'
    );
  }
  return createBrowserClient(url, key);
}
