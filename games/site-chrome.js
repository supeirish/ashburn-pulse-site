/* ============================================================
   Ashburn Pulse — shared site chrome (header + footer)
   ------------------------------------------------------------
   Drop <script src="site-chrome.js"></script> on any standalone
   page (games, leaderboard) and it gets the SAME top header and
   bottom footer as the homepage, so every page feels like one site.
   Single source of truth — edit here, every page updates.
   Skips itself inside the homepage's ?embed=1 iframes.
   ============================================================ */
(function () {
  "use strict";

  function build() {
    if (document.body.classList.contains("embed")) return;          // not inside homepage embeds
    if (document.getElementById("apc-chrome-css")) return;          // already mounted

    var css = document.createElement("style");
    css.id = "apc-chrome-css";
    css.textContent = [
      ".apc-header,.apc-footer{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}",
      ".apc-header{background:#fff;border-bottom:1px solid #e7e6e2;position:relative;z-index:50}",
      ".apc-sunrise{height:4px;background:linear-gradient(90deg,#0F3D4C,#3D9BD9,#3FA776,#FFB341,#FF5A47)}",
      ".apc-nav{max-width:1080px;margin:0 auto;padding:11px 18px;display:flex;align-items:center;gap:14px}",
      ".apc-brand{display:flex;align-items:center;gap:11px;margin-right:auto;text-decoration:none}",
      ".apc-mark{width:34px;height:34px;display:block;flex:0 0 auto}",
      ".apc-name{font-weight:800;font-size:19px;letter-spacing:-.02em;color:#0F3D4C;line-height:1;display:block}",
      ".apc-name b{color:#FF5A47}",
      ".apc-tag{display:block;font:600 9.5px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:#62707A;margin-top:3px}",
      ".apc-menu{display:flex;gap:2px;flex-wrap:wrap;align-items:center}",
      ".apc-tab{font-weight:700;font-size:14px;color:#0F3D4C;text-decoration:none;padding:8px 12px;border-radius:9px;transition:.15s;white-space:nowrap}",
      ".apc-tab:hover{background:#eaf2f4}",
      ".apc-sub-btn{background:#0F3D4C;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:9px 15px;border-radius:10px;white-space:nowrap}",
      ".apc-sub-btn:hover{background:#16566b}",
      "@media(max-width:680px){.apc-tag{display:none}.apc-tab{padding:8px 8px;font-size:13px}.apc-sub-btn{display:none}.apc-nav{gap:8px}}",
      ".apc-footer{background:#0F3D4C;color:#cfe0e5;margin-top:44px}",
      ".apc-fwrap{max-width:1080px;margin:0 auto;padding:34px 18px 18px}",
      ".apc-fgrid{display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:26px}",
      "@media(max-width:720px){.apc-fgrid{grid-template-columns:1fr 1fr}}",
      ".apc-fname{font-weight:800;font-size:18px;color:#fff}.apc-fname b{color:#FF5A47}",
      ".apc-fblurb{font-size:13px;line-height:1.6;color:#9fc2cc;margin-top:8px;max-width:34ch}",
      ".apc-footer h5{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#fff;margin:0 0 10px}",
      ".apc-footer ul{list-style:none;padding:0;margin:0}.apc-footer li{margin:7px 0}",
      ".apc-footer a{color:#cfe0e5;text-decoration:none;font-size:13.5px}.apc-footer a:hover{color:#fff;text-decoration:underline}",
      ".apc-fbar{display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;border-top:1px solid rgba(255,255,255,.13);margin-top:24px;padding-top:16px;font:600 12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;color:#9fc2cc}",
      /* the standalone pages' own one-line footers are replaced by this shared one */
      "body:not(.embed) .foot{display:none!important}"
    ].join("");
    document.head.appendChild(css);

    var logo = '<span class="apc-mark"><svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="1" y="1" width="38" height="38" rx="9" fill="#0F3D4C"/>' +
      '<path d="M5 23 L13 23 L16 14 L21 30 L25 19 L28 23 L35 23" stroke="#FFB341" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="35" cy="23" r="2.4" fill="#FF5A47"/></svg></span>';

    var header = document.createElement("header");
    header.className = "apc-header";
    header.innerHTML =
      '<div class="apc-sunrise"></div>' +
      '<div class="apc-nav">' +
        '<a class="apc-brand" href="/" title="Ashburn Pulse home">' + logo +
          '<span><span class="apc-name">Ashburn <b>Pulse</b></span><span class="apc-tag">Live life, together.</span></span>' +
        '</a>' +
        '<nav class="apc-menu">' +
          '<a class="apc-tab" href="/#home">Newsletter</a>' +
          '<a class="apc-tab" href="/#play">Play</a>' +
          '<a class="apc-tab" href="/#guide">Local Links</a>' +
          '<a class="apc-tab" href="/#history">Ashburn History</a>' +
        '</nav>' +
        '<a class="apc-sub-btn" href="/#home">Subscribe</a>' +
      '</div>';
    document.body.insertBefore(header, document.body.firstChild);

    var footer = document.createElement("footer");
    footer.className = "apc-footer";
    footer.innerHTML =
      '<div class="apc-fwrap">' +
        '<div class="apc-fgrid">' +
          '<div><div class="apc-fname">Ashburn <b>Pulse</b></div>' +
            '<p class="apc-fblurb">Your four minutes on Ashburn — news, weekends, a daily puzzle, and the only local reference you’ll bookmark.</p></div>' +
          '<div><h5>The site</h5><ul>' +
            '<li><a href="/#home">Newsletter</a></li><li><a href="/#play">Play</a></li>' +
            '<li><a href="/#guide">Local Links</a></li><li><a href="/#history">Ashburn History</a></li></ul></div>' +
          '<div><h5>Games</h5><ul>' +
            '<li><a href="wod.html">W&amp;OD</a></li><li><a href="interchange.html">The Interchange</a></li>' +
            '<li><a href="leaderboard.html">Leaderboard</a></li></ul></div>' +
          '<div><h5>Community</h5><ul>' +
            '<li><a href="/#about">About</a></li><li><a href="/#home">Subscribe</a></li></ul></div>' +
        '</div>' +
        '<div class="apc-fbar"><span>© 2026 Ashburn Pulse · Built for ZIP 20147</span><span>Made in Ashburn · ZIP 20147</span></div>' +
      '</div>' +
      '<div class="apc-sunrise"></div>';
    document.body.appendChild(footer);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();
