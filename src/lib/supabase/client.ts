import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tzlkljbvbabhsygsrckq.supabase.co';
  // Defensively strip trailing /rest/v1 or trailing slashes
  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6bGtsamJ2YmFiaHN5Z3NyY2txIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MDYwOTMsImV4cCI6MjEwODA4MjA5M30.snbCvVbxo5w5Rx1meDxeEZa1FBAb2ssv8wRiIKE_auw';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
