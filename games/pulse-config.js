/* ============================================================
   Ashburn Pulse Games — backend config
   ------------------------------------------------------------
   This is the ONLY file you edit to switch accounts + leaderboards on.

   1) Create a free project at https://supabase.com
   2) Project Settings → API → copy the "Project URL" and the
      "anon / public" key (the anon key is safe to ship in the browser).
   3) Paste them below, replacing the PASTE_… placeholders.
   4) Run supabase/schema.sql once in the Supabase SQL editor.
   5) (optional) flip GOOGLE to true after you add a Google provider.

   Until real values are pasted here, the games behave EXACTLY as
   before (offline, localStorage-only) — nothing breaks.
   ============================================================ */
window.PULSE_CONFIG = {
  // Project: ashburn-pulse-games (Supabase, supeirish's Org) — set up 2026-06-18
  SUPABASE_URL:      "https://nhmekflguvoksczonczw.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_4_3ofewlgqTw8P3Cwtd0-w_aXHIl0_e",  // publishable (browser-safe) key
  GOOGLE: true,           // Google sign-in enabled in Supabase 2026-06-19
  AREA_PROMPT: true       // ask new players for their Ashburn neighborhood (optional)
};
