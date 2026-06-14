/*
 * Ashburn Pulse — game embed snippet.
 * Lets any website drop in a playable game with one line. It just writes a
 * responsive <iframe> pointing at the hosted player, so there is only ONE real
 * implementation (the iframe) behind both embed styles.
 *
 * Usage on a host page:
 *   <script src="https://play.ashburnpulse.com/embed.js"
 *           data-game="wod" data-id="wod-0001"></script>
 *   <script src="https://play.ashburnpulse.com/embed.js"
 *           data-game="interchange" data-id="interchange-0001" data-height="620"></script>
 *
 * data-game   "wod" | "interchange"        (required)
 * data-id     canonical edition id         (optional; defaults to latest)
 * data-height iframe height in px          (optional; sensible default per game)
 */
(function () {
  var s = document.currentScript;
  if (!s) return;
  var game = (s.getAttribute("data-game") || "wod").toLowerCase();
  var id = s.getAttribute("data-id") || "latest";
  var defaultH = game === "interchange" ? 600 : 560;
  var height = parseInt(s.getAttribute("data-height") || defaultH, 10);

  // base = the folder this script was served from (so it works on any host)
  var base = s.src.replace(/\/embed\.js(?:\?.*)?$/, "");
  var file = game === "interchange" ? "interchange.html" : "wod.html";
  var src = base + "/" + file + "?embed=1&id=" + encodeURIComponent(id);

  var iframe = document.createElement("iframe");
  iframe.src = src;
  iframe.title = game === "interchange" ? "The Interchange" : "W&OD";
  iframe.loading = "lazy";
  iframe.style.cssText =
    "width:100%;max-width:680px;height:" + height +
    "px;border:1px solid #e2e8f0;border-radius:14px;display:block;margin:0 auto;background:#fff;";
  iframe.setAttribute("scrolling", "no");
  s.parentNode.insertBefore(iframe, s.nextSibling);
})();
