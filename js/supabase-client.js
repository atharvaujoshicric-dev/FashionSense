/* ==========================================
   SUPABASE CLIENT CONFIG
   ------------------------------------------
   1. Create a free project at https://supabase.com
   2. Go to Project Settings → API
   3. Copy "Project URL" and "anon public" key below
   4. Run supabase/schema.sql in the SQL Editor
   5. Create a public Storage bucket named "avatars"
   See SETUP.md for the full step-by-step.
   ========================================== */

const SUPABASE_URL = 'https://kbjdfojyydatsqmrrnnf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiamRmb2p5eWRhdHNxbXJybm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MTUzNDYsImV4cCI6MjA5ODk5MTM0Nn0.LQPinoL7kXF52i-8TdC68_zrv8Q9MjA3yqQprfuBouE';

if (SUPABASE_URL.includes('YOUR-PROJECT-REF')) {
  console.warn('[StyleAI] Supabase is not configured yet — edit js/supabase-client.js with your project URL and anon key.');
}

window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});
