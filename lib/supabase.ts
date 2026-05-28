import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

function isValidSupabaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const protocol = parsed.protocol.toLowerCase();

    if (protocol !== 'https:' && protocol !== 'http:') {
      return false;
    }

    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return true;
    }

    return hostname.endsWith('.supabase.co');
  } catch {
    return false;
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not configured. Database features will be disabled until NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.');
}

const hasValidSupabaseUrl = Boolean(supabaseUrl && isValidSupabaseUrl(supabaseUrl));

if (supabaseUrl && !hasValidSupabaseUrl) {
  console.warn('Supabase URL appears invalid. Database features will be disabled until NEXT_PUBLIC_SUPABASE_URL points to a valid Supabase host.');
}

const validSupabaseUrl = supabaseUrl && hasValidSupabaseUrl ? supabaseUrl : undefined;

export const supabase = validSupabaseUrl && supabaseAnonKey ? createClient(validSupabaseUrl, supabaseAnonKey) : null;

// Helper to check connection/configuration
export const isSupabaseLive = Boolean(supabase);

export function getSupabaseClient() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }

  return supabase;
}
