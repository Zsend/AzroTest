AZRO Fintech Site (Static)
=========================

What this is
------------
A clean, presentation‑ready static website for the AZRO Bitcoin Treasury Program. It is designed around:
- an 8‑point spacing grid
- consistent typography
- components that never overlap (cards, tables, accordions)
- responsive layout (desktop + mobile)

How to use
----------
Option 1 (simplest): open `index.html` in a browser.

Option 2 (recommended): run a local web server (so links and assets behave consistently):
- Python 3: `python -m http.server 8080`
- then visit: http://localhost:8080

Edit points
-----------
- Update the email in the footer CTA: search for `hello@azro.example`
- Update brand name/logo styles in `styles.css` (tokens are at the top under `:root`)
- Copy changes propagate automatically because all pages share the same CSS + header/footer structure.

Pages
-----
- `index.html` — overview landing page
- `customer.html` — customer packet narrative + policy template
- `performance.html` — performance snapshot + mode table
- `security.html` — governance + custody + reporting
- `concerns.html` — FAQ / objections (accordion)

Notes
-----
This is informational content only and includes a standard risk disclosure.
