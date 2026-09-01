/* ============================================================
   Ashburn Pulse Games — accounts, saved scores & leaderboards
   One file, no build step. Loads after pulse-config.js.
   Degrades gracefully: if config keys aren't set, every method is a
   safe no-op and the games behave exactly as they did before.
   ============================================================ */
(function () {
  "use strict";
  var CFG = window.PULSE_CONFIG || {};
  var CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
  var PENDING_KEY = "pulse_pending_v1";
  var IMPORT_FLAG = "pulse_imported_v1";

  function configured() {
    return CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY &&
      CFG.SUPABASE_URL.indexOf("PASTE_") !== 0 &&
      CFG.SUPABASE_ANON_KEY.indexOf("PASTE_") !== 0;
  }
  function pad(n, w) { n = String(n); while (n.length < (w || 4)) n = "0" + n; return n; }

  var Pulse = {
    enabled: configured(),
    ready: false,
    user: null,        // {id, email, handle, avatar_emoji, home_area, current_streak}
    _sb: null,
    _listeners: [],
    _readyResolvers: [],

    /* games call this at the end of a play */
    recordPlay: function (r) {
      // r: {game, edition_id, edition_no, title, score, max_score, hints, misses, ms, squares}
      if (!this.enabled) return;                 // offline: localStorage already has it
      var pend = this._pending();
      pend.push(r);
      this._savePending(pend);                   // survives the OAuth redirect / reload
      if (this.user) this._flush();
      else if (!document.body.classList.contains("embed") && this.accountsOn())
        this._toast("👋 Sign in to save this score to the leaderboard");
    },

    /* Is sign-in offered at all? Set ACCOUNTS:false in pulse-config.js to hide
       every sign-in control. Defaults to true when the key is absent, so an
       older config file keeps working exactly as before. */
    accountsOn: function () {
      var c = window.PULSE_CONFIG || {};
      return c.ACCOUNTS !== false;
    },

    onChange: function (cb) { this._listeners.push(cb); return this; },
    whenReady: function () {
      var self = this;
      if (self.ready) return Promise.resolve(self);
      return new Promise(function (res) { self._readyResolvers.push(res); });
    },

    /* ---- auth actions ---- */
    // clean return URL: strip any #hash / ?query so Supabase's token fragment
    // is the ONLY hash (a stray #signin etc. breaks token parsing -> signed out)
    _returnURL: function () { return location.origin + location.pathname; },
    // path prefix to the games folder: "" when already inside /games/, else "games/".
    // lets the account chip + menu link correctly whether mounted on a game page
    // or on the main site (homepage) which lives one level up.
    _base: function () { return /\/games\//.test(location.pathname) ? "" : "games/"; },
    signInEmail: function (email) {
      return this._sb.auth.signInWithOtp({ email: email, options: { emailRedirectTo: this._returnURL() } });
    },
    signInGoogle: function () {
      return this._sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: this._returnURL() } });
    },
    signOut: function () { return this._sb.auth.signOut(); },

    /* ---- data reads (used by leaderboard.html) ---- */
    /* A failed read returns null, NOT an empty array.
       ------------------------------------------------------------------
       This line used to read `r.error ? [] : r.data`, which threw the error
       away and handed back an empty list. leaderboard.html cannot tell an
       empty list from a real one, so a dead backend rendered as the cheerful
       "No scores here yet - be the first on this board" message. On
       2026-08-31 the Supabase project was returning 503 and the live board
       was telling every visitor that nobody plays the games.

       That erased the exact distinction the 2026-08-16 leaderboard fix was
       written to make: an empty board is a working board with nobody on it,
       an unreachable board is a failure and must say so. The check for it
       (`if (rows === null) renderBoardUnavailable()`) could never fire,
       because the failure was flattened one layer below the page.

       null now means "we could not reach the scoreboard". An empty array
       still means "the board works and nobody is on it yet". The .catch
       covers a rejected promise, which .then alone would let escape. */
    leaderboard: function (game, win, limit) {
      if (!this.enabled || !this._sb) return Promise.resolve(null);
      return this._sb.rpc("leaderboard", { p_game: game || "pulse", p_window: win || "today", p_limit: limit || 100 })
        .then(function (r) { return r.error ? null : r.data; })
        .catch(function () { return null; });
    },
    myHistory: function (limit) {
      if (!this.enabled || !this._sb || !this.user) return Promise.resolve([]);
      return this._sb.from("game_results").select("*")
        .order("created_at", { ascending: false }).limit(limit || 200)
        .then(function (r) { return r.error ? [] : r.data; });
    },
    updateProfile: function (patch) {
      var self = this;
      if (!this.enabled || !this._sb || !this.user) return Promise.resolve({ error: "not signed in" });
      return this._sb.from("profiles").update(patch).eq("id", this.user.id).then(function (r) {
        if (!r.error) Object.assign(self.user, patch), self._emit();
        return r;
      });
    },

    /* ---- internals ---- */
    _pending: function () { try { return JSON.parse(localStorage.getItem(PENDING_KEY)) || []; } catch (e) { return []; } },
    _savePending: function (a) { try { localStorage.setItem(PENDING_KEY, JSON.stringify(a)); } catch (e) {} },

    _flush: function () {
      var self = this, q = this._pending();
      if (!this._sb || !this.user || !q.length) return;
      this._savePending([]);
      q.forEach(function (r) {
        self._sb.from("game_results").upsert({
          user_id: self.user.id, game: r.game, edition_id: r.edition_id,
          edition_no: r.edition_no, title: r.title, score: r.score, max_score: r.max_score,
          hints_used: r.hints || 0, misses: r.misses || 0, duration_ms: r.ms || 0,
          squares: r.squares || null
        }, { onConflict: "user_id,edition_id", ignoreDuplicates: true }).then(function (res) {
          if (res.error) { console.warn("[pulse] save failed:", res.error.message); var p = self._pending(); p.push(r); self._savePending(p); }
          else { self._toast("✅ Saved to your account"); self._emit(); }
        });
      });
    },

    _emit: function (kind) {
      this._renderChip();
      this._listeners.forEach(function (cb) { try { cb(Pulse, kind); } catch (e) {} });
    },

    _resolveReady: function () {
      this.ready = true;
      var rs = this._readyResolvers; this._readyResolvers = [];
      rs.forEach(function (r) { r(Pulse); });
    },

    _onSession: function (session) {
      var self = this;
      if (!session || !session.user) { this.user = null; this._emit(); return Promise.resolve(); }
      var u = session.user;
      return this._sb.from("profiles").select("handle,avatar_emoji,home_area,current_streak,longest_streak").eq("id", u.id).maybeSingle()
        .then(function (r) {
          var prof = r.data;
          if (!prof) { // fallback if the auto-profile trigger isn't installed
            var h = (u.email || "player").split("@")[0].replace(/[^a-z0-9_]/gi, "").toLowerCase() || "player";
            return self._sb.from("profiles").insert({ id: u.id, handle: h + "_" + Math.random().toString(36).slice(2, 5) })
              .select("handle,avatar_emoji,home_area,current_streak,longest_streak").single()
              .then(function (r2) { return r2.data; });
          }
          return prof;
        })
        .then(function (prof) {
          self.user = Object.assign({ id: u.id, email: u.email }, prof || {});
          self._importLocalOnce();
          self._flush();
          self._emit("signin");
        })
        .catch(function (e) { console.warn("[pulse] profile load:", e); self.user = { id: u.id, email: u.email }; self._emit(); });
    },

    // one-time: carry the player's existing on-device streak onto their new account
    _importLocalOnce: function () {
      var self = this;
      if (localStorage.getItem(IMPORT_FLAG)) return;
      var best = 0;
      ["wod_stats_v1", "ic_stats_v1"].forEach(function (k) {
        try { var s = JSON.parse(localStorage.getItem(k)); if (s && s.streak > best) best = s.streak; } catch (e) {}
      });
      localStorage.setItem(IMPORT_FLAG, "1");
      if (best > (self.user.current_streak || 0)) {
        self.updateProfile({ current_streak: best, longest_streak: Math.max(best, self.user.longest_streak || 0) });
      }
    },

    _init: function () {
      var self = this;
      if (!this.enabled) { this._resolveReady(); return; }
      import(CDN).then(function (mod) {
        self._sb = mod.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY, {
          auth: {
            persistSession: true,        // keep the session in localStorage
            autoRefreshToken: true,      // silently refresh so people stay signed in indefinitely
            detectSessionInUrl: true,    // process the magic-link / OAuth token on return
            flowType: "implicit"         // token in the URL hash — works even across devices/mail apps
          }
        });
        return self._sb.auth.getSession();
      }).then(function (res) {
        return self._onSession(res && res.data ? res.data.session : null);
      }).then(function () {
        self._sb.auth.onAuthStateChange(function (_e, s) { self._onSession(s); });
        self._renderChip();
        self._resolveReady();
      }).catch(function (e) {
        console.warn("[pulse] init failed:", e); self.enabled = false; self._resolveReady();
      });
    },

    /* ================= UI ================= */
    _injectCSS: function () {
      if (document.getElementById("pulse-css")) return;
      var css = document.createElement("style"); css.id = "pulse-css";
      css.textContent = [
        ".pulse-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-left:auto}",
        ".pulse-btn{font:700 13px/1 -apple-system,Segoe UI,Roboto,sans-serif;border-radius:10px;padding:8px 12px;border:1px solid #d7e3ef;background:#fff;color:#0F3D4C;cursor:pointer;display:inline-flex;align-items:center;gap:7px;text-decoration:none;transition:.15s}",
        ".pulse-btn:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(15,61,76,.12)}",
        ".pulse-btn.solid{background:#0F3D4C;color:#fff;border-color:#0F3D4C}",
        ".pulse-btn.coral{background:#FF5A47;color:#fff;border-color:#FF5A47}",
        ".pulse-chip{display:inline-flex;align-items:center;gap:7px;border:1px solid #d7e3ef;background:#fff;border-radius:999px;padding:5px 6px 5px 10px;cursor:pointer;font:700 13px/1 -apple-system,Segoe UI,Roboto,sans-serif;color:#0F3D4C}",
        ".pulse-chip .av{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:#eaf2f4;font-size:14px}",
        ".pulse-menu{position:absolute;z-index:1000;background:#fff;border:1px solid #e7e6e2;border-radius:14px;box-shadow:0 20px 50px rgba(15,61,76,.22);padding:6px;min-width:200px;display:none}",
        ".pulse-menu.on{display:block}",
        ".pulse-menu a,.pulse-menu button{display:flex;width:100%;gap:9px;align-items:center;border:0;background:none;text-align:left;padding:10px 11px;border-radius:9px;font:600 13px/1 -apple-system,Segoe UI,Roboto,sans-serif;color:#181b20;cursor:pointer;text-decoration:none}",
        ".pulse-menu a:hover,.pulse-menu button:hover{background:#f6f8f7}",
        ".pulse-menu .hd{padding:9px 11px 4px;color:#62707A;font:600 11px/1.3 -apple-system,Segoe UI,Roboto,sans-serif}",
        ".pulse-ov{position:fixed;inset:0;z-index:2000;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(8,28,35,.5);backdrop-filter:blur(4px)}",
        ".pulse-ov.on{display:flex}",
        ".pulse-sheet{background:#fff;border-radius:22px;box-shadow:0 24px 60px rgba(15,61,76,.3);width:100%;max-width:360px;padding:22px;position:relative;font-family:-apple-system,Segoe UI,Roboto,sans-serif}",
        ".pulse-sheet h3{margin:0 0 4px;font-size:20px;color:#0F3D4C;letter-spacing:-.02em}",
        ".pulse-sheet p{margin:0 0 14px;color:#62707A;font-size:13px;line-height:1.5}",
        ".pulse-art{height:70px;border-radius:16px;margin-bottom:14px;display:grid;place-items:center;font-size:30px;color:#fff;background:conic-gradient(from 200deg,#0F3D4C,#3D9BD9,#3FA776,#FFB341,#FF5A47,#0F3D4C)}",
        ".pulse-field{width:100%;border:1px solid #d7e3ef;background:#f6f8f7;border-radius:12px;padding:13px;font:600 14px/1 inherit;color:#181b20;margin:4px 0 10px}",
        ".pulse-field:focus{outline:none;border-color:#0F3D4C;background:#fff}",
        ".pulse-x{position:absolute;top:13px;right:13px;width:30px;height:30px;border-radius:50%;border:1px solid #e7e6e2;background:#f6f8f7;cursor:pointer;color:#62707A;font-size:14px}",
        ".pulse-or{display:flex;align-items:center;gap:10px;color:#9fb0b8;font:600 11px/1 inherit;letter-spacing:.1em;margin:12px 0}",
        ".pulse-or:before,.pulse-or:after{content:'';flex:1;height:1px;background:#e7e6e2}",
        ".pulse-fine{font-size:10.5px;color:#9aa7af;text-align:center;margin-top:12px;line-height:1.5}",
        ".pulse-g{background:#fff;color:#1f2937;border:1px solid #dadce0}",
        ".pulse-toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%) translateY(16px);background:#181b20;color:#fff;font:700 12.5px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;padding:11px 15px;border-radius:12px;box-shadow:0 16px 40px rgba(0,0,0,.3);z-index:3000;opacity:0;pointer-events:none;transition:.28s;max-width:84%;text-align:center}",
        ".pulse-toast.on{opacity:1;transform:translateX(-50%) translateY(0)}",
        ".pulse-toast b{color:#FFB341}",
        "body.embed .pulse-bar{display:none}"
      ].join("");
      document.head.appendChild(css);
    },

    _btn: function (label, cls, onclick) {
      var b = document.createElement(onclick && onclick._href ? "a" : "button");
      b.className = "pulse-btn " + (cls || ""); b.innerHTML = label;
      if (onclick && onclick._href) b.href = onclick._href; else if (onclick) b.onclick = onclick;
      return b;
    },

    _renderChip: function () {
      if (!this.enabled) return;
      var host = this._barHost; if (!host) return;
      host.innerHTML = "";
      // No leaderboard link while scores are switched off — the board cannot
      // fill up without accounts, so pointing at it only disappoints.
      if (this.accountsOn()) {
        var lb = document.createElement("a");
        lb.className = "pulse-btn"; lb.href = this._base() + "leaderboard.html"; lb.innerHTML = "🏆 Leaderboard";
        host.appendChild(lb);
      }
      if (!this.user) {
        // With accounts off, the Leaderboard link stays (it explains itself)
        // but the sign-in button does not, because it cannot complete.
        if (this.accountsOn())
          host.appendChild(this._btn("Sign in to save", "solid", this.openSignIn.bind(this)));
      } else {
        var chip = document.createElement("button");
        chip.className = "pulse-chip";
        chip.innerHTML = '<span class="av">' + (this.user.avatar_emoji || "🟢") + "</span>" +
          "<span>" + (this.user.handle || "you") + "</span><span style='opacity:.5'>▾</span>";
        chip.onclick = this._toggleMenu.bind(this);
        host.appendChild(chip);
      }
    },

    _toggleMenu: function (e) {
      var self = this;
      var m = document.getElementById("pulse-menu");
      if (!m) {
        m = document.createElement("div"); m.id = "pulse-menu"; m.className = "pulse-menu";
        document.body.appendChild(m);
        document.addEventListener("click", function (ev) {
          if (m.classList.contains("on") && !m.contains(ev.target) && !ev.target.closest(".pulse-chip")) m.classList.remove("on");
        });
      }
      m.innerHTML =
        '<div class="hd">Signed in as <b>' + (this.user.handle || "you") + "</b><br>🔥 streak " + (this.user.current_streak || 0) + "</div>" +
        '<a href="' + this._base() + 'leaderboard.html#me">📜 My history & stats</a>' +
        '<button id="pulse-edit">✏️ Edit profile</button>' +
        '<button id="pulse-out">↩︎ Sign out</button>';
      var r = e.currentTarget.getBoundingClientRect();
      m.style.top = (window.scrollY + r.bottom + 6) + "px";
      m.style.left = (window.scrollX + Math.max(8, r.right - 210)) + "px";
      m.classList.toggle("on");
      m.querySelector("#pulse-out").onclick = function () { m.classList.remove("on"); self.signOut(); self._toast("Signed out"); };
      m.querySelector("#pulse-edit").onclick = function () { m.classList.remove("on"); self.openProfile(); };
    },

    openSignIn: function () {
      // Belt and braces: even if something still calls this, honour the switch
      // rather than opening a dialog that cannot complete.
      if (!this.accountsOn()) return;
      var self = this;
      var ov = this._overlay();
      var g = CFG.GOOGLE ? '<button class="pulse-btn pulse-g" id="pulse-google" style="width:100%;justify-content:center;padding:13px"><svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.8-6.8C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.5 13.3l7.9 6.1C12.3 13.3 17.6 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.1 5.3-4.6 6.9l7.1 5.5C43.4 37.5 46.1 31.5 46.1 24.5z"/><path fill="#FBBC05" d="M10.4 28.6c-.5-1.4-.8-2.9-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.7l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.1-5.5c-2 1.3-4.5 2.1-8.1 2.1-6.4 0-11.7-3.8-13.6-9.1l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg> Continue with Google</button><div class="pulse-or">OR</div>' : "";
      ov.querySelector(".pulse-sheet").innerHTML =
        '<button class="pulse-x" data-close>✕</button>' +
        '<div class="pulse-art">🎟️</div>' +
        "<h3>Save your scores</h3>" +
        "<p>Sign in to keep your streak, sync across devices, and climb the Ashburn leaderboard.</p>" +
        g +
        '<input class="pulse-field" id="pulse-email" type="email" placeholder="you@email.com" autocomplete="email">' +
        '<button class="pulse-btn solid" id="pulse-magic" style="width:100%;justify-content:center;padding:13px">✉️ Email me a magic link</button>' +
        '<div class="pulse-fine">No passwords. Magic link &amp; Google sign in to the same account. We only ever show your handle &amp; scores — never your email.</div>';
      ov.classList.add("on");
      ov.querySelector("[data-close]").onclick = function () { ov.classList.remove("on"); };
      var gb = ov.querySelector("#pulse-google"); if (gb) gb.onclick = function () { self.signInGoogle(); };
      ov.querySelector("#pulse-magic").onclick = function () {
        var em = ov.querySelector("#pulse-email").value.trim();
        if (!/.+@.+\..+/.test(em)) { self._toast("Enter a valid email"); return; }
        self.signInEmail(em).then(function () {
          ov.querySelector(".pulse-sheet").innerHTML =
            '<button class="pulse-x" data-close>✕</button><div class="pulse-art">📬</div><h3>Check your email</h3>' +
            "<p>We sent a magic link to <b>" + em + "</b>. Open it on any device to finish signing in — your scores will sync automatically.</p>";
          ov.querySelector("[data-close]").onclick = function () { ov.classList.remove("on"); };
        }).catch(function (e) { self._toast("Couldn't send link: " + (e.message || "error")); });
      };
    },

    openProfile: function () {
      var self = this, u = this.user || {};
      var ov = this._overlay();
      var emos = ["🦊", "🟢", "🚴", "🦢", "🌲", "🐟", "📚", "🌅", "🚗", "🎩", "⚡", "🏆"];
      ov.querySelector(".pulse-sheet").innerHTML =
        '<button class="pulse-x" data-close>✕</button><h3>Your profile</h3><p>This is what other players see on the board.</p>' +
        '<label class="pulse-fine" style="text-align:left;display:block;margin:0 0 2px">Handle</label>' +
        '<input class="pulse-field" id="pp-handle" maxlength="20" value="' + (u.handle || "") + '">' +
        '<label class="pulse-fine" style="text-align:left;display:block;margin:6px 0 2px">Neighborhood (optional)</label>' +
        '<input class="pulse-field" id="pp-area" maxlength="24" placeholder="e.g. Brambleton" value="' + (u.home_area || "") + '">' +
        '<label class="pulse-fine" style="text-align:left;display:block;margin:6px 0 6px">Avatar</label>' +
        '<div id="pp-emos" style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:14px">' +
        emos.map(function (e) { return '<button class="pulse-btn pp-emo" data-e="' + e + '" style="font-size:18px;padding:7px 9px' + (e === (u.avatar_emoji || "🟢") ? ";border-color:#0F3D4C;background:#eaf2f4" : "") + '">' + e + "</button>"; }).join("") +
        "</div>" +
        '<button class="pulse-btn solid" id="pp-save" style="width:100%;justify-content:center;padding:13px">Save</button>';
      ov.classList.add("on");
      var chosen = u.avatar_emoji || "🟢";
      ov.querySelector("[data-close]").onclick = function () { ov.classList.remove("on"); };
      ov.querySelectorAll(".pp-emo").forEach(function (b) {
        b.onclick = function () { chosen = b.dataset.e; ov.querySelectorAll(".pp-emo").forEach(function (x) { x.style.borderColor = "#d7e3ef"; x.style.background = "#fff"; }); b.style.borderColor = "#0F3D4C"; b.style.background = "#eaf2f4"; };
      });
      ov.querySelector("#pp-save").onclick = function () {
        var h = ov.querySelector("#pp-handle").value.trim().replace(/\s+/g, "_");
        var a = ov.querySelector("#pp-area").value.trim();
        if (h.length < 2) { self._toast("Handle too short"); return; }
        self.updateProfile({ handle: h, home_area: a || null, avatar_emoji: chosen }).then(function (r) {
          if (r.error) self._toast("That handle may be taken — try another");
          else { ov.classList.remove("on"); self._toast("✅ Profile updated"); }
        });
      };
    },

    _overlay: function () {
      var ov = document.getElementById("pulse-ov");
      if (!ov) {
        ov = document.createElement("div"); ov.id = "pulse-ov"; ov.className = "pulse-ov";
        ov.innerHTML = '<div class="pulse-sheet"></div>';
        ov.addEventListener("click", function (e) { if (e.target === ov) ov.classList.remove("on"); });
        document.body.appendChild(ov);
      }
      return ov;
    },

    _toast: function (msg) {
      var t = document.getElementById("pulse-toast");
      if (!t) { t = document.createElement("div"); t.id = "pulse-toast"; t.className = "pulse-toast"; document.body.appendChild(t); }
      t.innerHTML = msg; t.classList.add("on");
      clearTimeout(this._tT); this._tT = setTimeout(function () { t.classList.remove("on"); }, 2600);
    },

    /* mount the account bar; games auto-mount into <header class="top">,
       leaderboard.html mounts manually via Pulse.mountAuthChip(el) */
    mountAuthChip: function (el) {
      this._injectCSS();
      var bar = document.createElement("div"); bar.className = "pulse-bar";
      el.appendChild(bar); this._barHost = bar; this._renderChip();
      return bar;
    },

    _autoMount: function () {
      this._injectCSS();
      if (this._barHost) return;
      var hdr = document.querySelector("header.top");
      if (hdr && !document.body.hasAttribute("data-pulse-manual")) this.mountAuthChip(hdr);
    }
  };

  // expose util for game pages
  Pulse.canonicalId = function (game, number) { return game + "-" + pad(number, 4); };
  window.Pulse = Pulse;

  function boot() {
    // inside the homepage iframe (?embed=1) stay silent: no chrome, no auth calls.
    // Plays still queue to localStorage and sync when the player signs in on the full page.
    if (document.body.classList.contains("embed")) return;
    Pulse._autoMount(); Pulse._init();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
