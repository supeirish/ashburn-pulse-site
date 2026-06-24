/* ============================================================
   Ashburn Pulse — shared site chrome (header + footer)
   ------------------------------------------------------------
   Drop <script src="site-chrome.js"></script> on any standalone
   page (games, leaderboard) and it gets the SAME top header and
   bottom footer as the homepage — same fonts, same sticky nav,
   and the same hamburger menu on mobile — so every page feels
   like one site. Single source of truth — edit here, every page
   updates. Skips itself inside the homepage's ?embed=1 iframes.
   ============================================================ */
(function () {
  "use strict";

  function build() {
    if (document.body.classList.contains("embed")) return;          // not inside homepage embeds
    if (document.getElementById("apc-chrome-css")) return;          // already mounted

    // Brand fonts (match the homepage header) — load once, defensively.
    if (!document.getElementById("apc-fonts")) {
      var pre1 = document.createElement("link"); pre1.rel = "preconnect"; pre1.href = "https://fonts.googleapis.com"; document.head.appendChild(pre1);
      var pre2 = document.createElement("link"); pre2.rel = "preconnect"; pre2.href = "https://fonts.gstatic.com"; pre2.crossOrigin = ""; document.head.appendChild(pre2);
      var fl = document.createElement("link"); fl.id = "apc-fonts"; fl.rel = "stylesheet";
      fl.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap";
      document.head.appendChild(fl);
    }

    var css = document.createElement("style");
    css.id = "apc-chrome-css";
    css.textContent = [
      ".apc-header,.apc-footer{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}",
      ".apc-header{position:sticky;top:0;z-index:60;background:rgba(255,255,255,.93);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border-bottom:1px solid #e7e6e2}",
      ".apc-sunrise{height:4px;display:flex}",
      ".apc-sunrise i{flex:1}",
      ".apc-sunrise i:nth-child(1){background:#FF5A47}.apc-sunrise i:nth-child(2){background:#3D9BD9}.apc-sunrise i:nth-child(3){background:#3FA776}.apc-sunrise i:nth-child(4){background:#FFB341}",
      ".apc-nav{max-width:1080px;margin:0 auto;padding:0 22px;display:flex;align-items:center;gap:8px;height:62px}",
      ".apc-brand{display:flex;align-items:center;gap:11px;margin-right:auto;text-decoration:none}",
      ".apc-mark{width:38px;height:38px;display:block;flex:0 0 auto}",
      ".apc-name{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:20px;letter-spacing:-.02em;color:#0F3D4C;line-height:1;display:block}",
      ".apc-name b{color:#FF5A47;font-weight:800}",
      ".apc-tag{display:block;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:#62707A;margin-top:3px}",
      ".apc-menu{display:flex;gap:2px}",
      ".apc-tab{appearance:none;background:none;border:0;font-family:inherit;cursor:pointer;font-weight:600;font-size:14.5px;color:#62707A;letter-spacing:-.01em;text-decoration:none;padding:9px 14px;border-radius:9px;transition:.15s;white-space:nowrap}",
      ".apc-tab:hover{color:#0F3D4C;background:#eaf2f4}",
      ".apc-navsub{display:flex;align-items:center;gap:6px}",
      ".apc-sub-btn{background:#0F3D4C;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:9px 15px;border-radius:10px;white-space:nowrap}",
      ".apc-sub-btn:hover{background:#16566b}",
      ".apc-hamb{display:none;background:none;border:1px solid #e7e6e2;border-radius:9px;width:40px;height:40px;align-items:center;justify-content:center;cursor:pointer}",
      ".apc-hamb svg{width:20px;height:20px;stroke:#0F3D4C}",
      "@media(max-width:920px){",
        ".apc-menu{position:fixed;inset:62px 0 auto 0;background:#fff;flex-direction:column;padding:10px;border-bottom:1px solid #e7e6e2;transform:translateY(-130%);transition:.25s;box-shadow:0 20px 40px -30px rgba(0,0,0,.4);z-index:59}",
        ".apc-menu.open{transform:none}",
        ".apc-tab{text-align:left;width:100%;padding:13px 16px;font-size:16px}",
        ".apc-hamb{display:flex}",
        ".apc-sub-btn{padding:8px 12px;font-size:13px}",
      "}",
      ".apc-footer{background:#0F3D4C;color:#cfe0e5;margin-top:44px}",
      ".apc-fwrap{max-width:1080px;margin:0 auto;padding:34px 22px 18px}",
      ".apc-fgrid{display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:26px}",
      "@media(max-width:720px){.apc-fgrid{grid-template-columns:1fr 1fr}}",
      ".apc-fname{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:18px;color:#fff}.apc-fname b{color:#FF5A47}",
      ".apc-fblurb{font-size:13px;line-height:1.6;color:#9fc2cc;margin-top:8px;max-width:34ch}",
      ".apc-footer h5{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#8fb4bd;margin:0 0 12px}",
      ".apc-footer ul{list-style:none;padding:0;margin:0}.apc-footer li{margin:9px 0}",
      ".apc-footer a{color:#cfe0e5;text-decoration:none;font-size:14px}.apc-footer a:hover{color:#fff}",
      ".apc-fbar{display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;border-top:1px solid rgba(255,255,255,.13);margin-top:30px;padding-top:16px;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:11px;color:#8fb4bd}",
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
      '<div class="apc-sunrise"><i></i><i></i><i></i><i></i></div>' +
      '<div class="apc-nav">' +
        '<a class="apc-brand" href="/" title="Ashburn Pulse home">' + logo +
          '<span><span class="apc-name">Ashburn <b>Pulse</b></span><span class="apc-tag">Live life, together.</span></span>' +
        '</a>' +
        '<nav class="apc-menu" id="apc-menu">' +
          '<a class="apc-tab" href="/#home">Newsletter</a>' +
          '<a class="apc-tab" href="/#weekend">This Weekend</a>' +
          '<a class="apc-tab" href="/#play">Play</a>' +
          '<a class="apc-tab" href="/#guide">Local Links</a>' +
          '<a class="apc-tab" href="/#history">Ashburn History</a>' +
        '</nav>' +
        '<div class="apc-navsub">' +
          '<a class="apc-sub-btn" href="/#home">Subscribe</a>' +
          '<button class="apc-hamb" type="button" aria-label="Menu" aria-expanded="false">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16" stroke-linecap="round"/></svg>' +
          '</button>' +
        '</div>' +
      '</div>';
    document.body.insertBefore(header, document.body.firstChild);

    var hamb = header.querySelector(".apc-hamb");
    var menu = header.querySelector("#apc-menu");
    if (hamb && menu) {
      hamb.addEventListener("click", function () {
        var open = menu.classList.toggle("open");
        hamb.setAttribute("aria-expanded", open ? "true" : "false");
      });
      menu.addEventListener("click", function (e) {
        if (e.target && e.target.classList.contains("apc-tab")) {
          menu.classList.remove("open");
          hamb.setAttribute("aria-expanded", "false");
        }
      });
    }

    var footer = document.createElement("footer");
    footer.className = "apc-footer";
    footer.innerHTML =
      '<div class="apc-fwrap">' +
        '<div class="apc-fgrid">' +
          '<div><div class="apc-fname">Ashburn <b>Pulse</b></div>' +
            '<p class="apc-fblurb">Your four minutes on Ashburn — news, weekends, a daily puzzle, and the only local reference you’ll bookmark.</p></div>' +
          '<div><h5>The site</h5><ul>' +
            '<li><a href="/#home">Newsletter</a></li><li><a href="/#weekend">This Weekend</a></li><li><a href="/#play">Play</a></li>' +
            '<li><a href="/#guide">Local Links</a></li><li><a href="/#history">Ashburn History</a></li></ul></div>' +
          '<div><h5>Games</h5><ul>' +
            '<li><a href="wod.html">W&amp;OD</a></li><li><a href="interchange.html">The Interchange</a></li>' +
            '<li><a href="leaderboard.html">Leaderboard</a></li></ul></div>' +
          '<div><h5>Community</h5><ul>' +
            '<li><a href="/#about">About</a></li><li><a href="/#home">Subscribe</a></li></ul></div>' +
        '</div>' +
        '<div class="apc-fbar"><span>© 2026 Ashburn Pulse · Built for ZIP 20147</span><span>Made in Ashburn · ZIP 20147</span></div>' +
      '</div>' +
      '<div class="apc-sunrise"><i></i><i></i><i></i><i></i></div>';
    document.body.appendChild(footer);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();
