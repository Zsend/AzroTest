AZRO Site v13 — Customer Rebuild (No Screenshots)

What’s different in this build
- Charts are rendered from data (SVG + Canvas). No screenshots. No cut-off images.
- Responsive layout (mobile → desktop) built on an 8pt spacing system.
- Professional tone: no slang.
- Color system tuned for trust + premium (deep navy + muted gold, with restrained sky accent).
- Data is bundled into /data/data.js so the site works even if you open index.html directly (file://).

How to view locally
Option A (quick): double-click index.html
- Works because data is bundled in /data/data.js.

Option B (recommended): run a tiny local server
- In this folder, run:
  python3 -m http.server 8000
- Then open:
  http://localhost:8000

How to host
- Upload the folder to Netlify / Vercel / Cloudflare Pages / S3 static hosting.
- Set the publish directory to the site root (the folder that contains index.html).

Where to edit
- Copy / update customer copy directly in the HTML pages:
  index.html, performance.html, program.html, resources.html, faq.html
- Design system / spacing / color tokens:
  assets/css/styles.css
- Charts and data rendering:
  assets/js/app.js
- Underlying data bundle:
  data/data.js  (generated from the JSON files in /data)

Updating data
- Replace the JSON files in /data and regenerate data.js (or manually embed).
- Then refresh the site.

Downloads
- All v8 PDFs/XLSX are included under /downloads and linked from resources.html.
