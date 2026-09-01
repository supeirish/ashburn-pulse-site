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
  AREA_PROMPT: true,      // ask new players for their Ashburn neighborhood (optional)

  /* ACCOUNTS — the master switch for sign-in (added 2026-09-01).
     ------------------------------------------------------------------
     false hides every sign-in control: the "Sign in to save" button on the
     game bar, the nudge toast after a play, and the sign-in prompt on the
     leaderboard page. The games are completely unaffected — they still play,
     still score, and still keep streaks in the browser.

     WHY IT IS OFF RIGHT NOW: the Supabase project is paused, so sign-in
     cannot complete and the leaderboard has nothing to read. Dead buttons are
     worse than absent ones.

     WORTH KNOWING: sign-in and the leaderboard are the same system. A score
     only reaches the database once a player is signed in (see _flush, which
     returns early without a user), so with accounts off the board stays empty
     even after Supabase wakes up. Turning this back to true is what restores
     both, and it needs no rebuild — this file is copied as-is.

     WHAT THIS FLAG CONTROLS AUTOMATICALLY
       - the "Sign in to save" button on the homepage Play section
       - the "Leaderboard" button on the homepage Play section
       - the Leaderboard button on the in-game bar (pulse.js)
       - the sign-in nudge toast after a play
       - the leaderboard page itself, which says "Standings are paused"

     WHAT IT DOES NOT — THREE PLACES REMOVED BY HAND ON 2026-09-01
     These files never load this config, so they cannot read the flag. Setting
     ACCOUNTS back to true will NOT bring these back; edit them yourself. Each
     carries a comment with the exact line to restore:
       1. website/games/site-chrome.js   footer "Games" list, Leaderboard link
       2. website/games/index.html       "View the leaderboard" link
       3. website/games/index.html       lede + meta copy promising a leaderboard
     The leaderboard PAGE is still published and still works by URL. It is only
     unlinked. build_publish.py requires the file to exist, and keeping it means
     no broken bookmarks. */
  ACCOUNTS: false
};
