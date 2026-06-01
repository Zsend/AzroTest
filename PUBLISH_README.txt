Reserve Standard v148 — Customer-ready final

Publish steps:
1. Upload the contents of this folder as the full site replacement.
2. Purge host/CDN/browser cache so style.css?v=148, script.js?v=148, and gate.js?v=148 load.
3. Spot check the home page on desktop and mobile.

Access tracking:
- Successful gate unlocks and authorized return visits are now instrumented.
- Default mode posts to a hidden Netlify form named rs-login-events. If you deploy on Netlify, view entries in Netlify → Forms.
- If you use another host, paste a webhook URL into site-config.js as loginTrackerEndpoint.
- To mark your own browser as the owner device, visit your live site once with:
  ?rs_owner=RS-OWNER-2026-8K4M
  The URL cleans itself after the marker is stored. Logs from that browser show isOwner=true.
- To clear the owner marker on a browser, visit:
  ?rs_owner=clear

Tracking notes:
This is lightweight static-site analytics, not authentication. It never sends the access code. It sends event type, timestamp, anonymous client ID, owner flag, page, referrer, viewport, timezone, screen size, and user agent.
