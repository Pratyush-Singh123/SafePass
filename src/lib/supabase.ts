import { createClient } from '@supabase/supabase-js';

// Safe fallbacks so production builds on Vercel never crash with a blank screen
// even if environment variables are not configured in Vercel project settings
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://gwtvgorxyylkwpkxwwuj.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3dHZnb3J4eXlsa3dwa3h3d3VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1NTUxOTEsImV4cCI6MjEwNzEzMTE5MX0.BrpzDJQyINijny_ebiVP8qoPZQzFrabLD5Oe13NeXjU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
