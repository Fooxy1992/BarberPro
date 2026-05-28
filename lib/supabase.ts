import { createClient } from '@supabase/supabase-js';

// User keys provided for the real Supabase backend:
const DEFAULT_SUPABASE_URL = 'https://hxpgjgdiimpudjttbhhh.supabase.co';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4cGpnZGlpbXB1ZGp0dGJoaHhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NjMzNDYsImV4cCI6MjA5NTUzOTM0Nn0.gSHXV1aSkBkWvJvQcL1h3ILz_wdVY6t-ZHkGUsuKP3Q';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to check connection/configuration
export const isSupabaseLive = !!(supabaseUrl && supabaseAnonKey);
