# AZRO — Customer Site (v10)

## How to preview

Open `index.html` in any modern browser.

For a clean local preview on macOS/Linux you can run:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## What’s included

- `index.html` — single-page customer site
- `assets/docs/` — PDFs + calculators (and a combined `AZRO_Customer_Packet_v8.zip`)
- `assets/img/performance/` — extracted charts from the performance addendum for web display

## Customization points

- Update the contact email in `index.html` (search for `mailto:`)
- Replace the favicon in `assets/img/ui/favicon.svg`
- If you add new PDFs, generate new thumbnails (optional)

