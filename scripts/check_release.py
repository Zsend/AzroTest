#!/usr/bin/env python3
"""Dependency-free release checks for the GitHub Pages artifact."""
from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]

PUBLIC_FILES = [
    "index.html", "404.html", "passport.html", "talent.html", "ops.html",
    "admin.html", "methodology.html", "privacy.html", "terms.html",
    "config.js", "manifest.webmanifest", "robots.txt", "sitemap.xml",
    "assets/mark.svg", "assets/static-api.js", "assets/social-card.png",
    "assets/icon-192.png", "assets/icon-512.png", ".nojekyll",
]
HTML_FILES = [
    "index.html", "404.html", "passport.html", "talent.html", "ops.html",
    "admin.html", "methodology.html", "privacy.html", "terms.html",
]
EXPECTED_SITE = "https://zsend.github.io/AzroTest/"


class AuditParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.refs: list[tuple[str, str]] = []
        self.img_missing_alt: list[str] = []
        self.links: list[str] = []
        self.forms = 0
        self.titles: list[str] = []
        self._in_title = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = dict(attrs)
        if data.get("id"):
            self.ids.append(str(data["id"]))
        if tag in {"script", "img"} and data.get("src"):
            self.refs.append((tag, str(data["src"])))
        if tag == "link" and data.get("href") and data.get("rel"):
            rel = " ".join(data.get("rel") if isinstance(data.get("rel"), list) else [str(data.get("rel"))])
            if any(word in rel for word in ("stylesheet", "icon", "manifest")):
                self.refs.append((tag, str(data["href"])))
        if tag == "a" and data.get("href"):
            self.links.append(str(data["href"]))
        if tag == "img" and "alt" not in data:
            self.img_missing_alt.append(str(data.get("src", "<unknown>")))
        if tag == "form":
            self.forms += 1
        if tag == "title":
            self._in_title = True

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._in_title = False

    def handle_data(self, data: str) -> None:
        if self._in_title and data.strip():
            self.titles.append(data.strip())


def local_target(page: Path, ref: str) -> Path | None:
    if not ref or ref.startswith(("#", "mailto:", "tel:", "data:", "javascript:")):
        return None
    parsed = urlsplit(ref)
    if parsed.scheme or parsed.netloc:
        return None
    raw_path = parsed.path
    if not raw_path:
        return None
    if raw_path.startswith("/"):
        # API routes are runtime calls, not static assets.
        return None
    return (page.parent / raw_path).resolve()


def fail(message: str, errors: list[str]) -> None:
    errors.append(message)


def main() -> int:
    errors: list[str] = []

    for rel in PUBLIC_FILES:
        if not (ROOT / rel).exists():
            fail(f"Missing required file: {rel}", errors)

    for rel in HTML_FILES:
        page = ROOT / rel
        if not page.exists():
            continue
        text = page.read_text(encoding="utf-8")
        parser = AuditParser()
        parser.feed(text)
        duplicates = sorted(k for k, v in Counter(parser.ids).items() if v > 1)
        if duplicates:
            fail(f"{rel}: duplicate IDs: {', '.join(duplicates)}", errors)
        if parser.img_missing_alt:
            fail(f"{rel}: images missing alt attribute: {', '.join(parser.img_missing_alt)}", errors)
        if not parser.titles:
            fail(f"{rel}: missing title", errors)
        for tag, ref in parser.refs:
            target = local_target(page, ref)
            if target is not None and not target.exists():
                try:
                    display = target.relative_to(ROOT)
                except ValueError:
                    display = target
                fail(f"{rel}: missing local {tag} resource {ref} -> {display}", errors)
        for href in parser.links:
            parsed = urlsplit(href)
            if parsed.scheme or parsed.netloc or href.startswith(("mailto:", "tel:", "javascript:")):
                continue
            if not parsed.path:
                if parsed.fragment and parsed.fragment not in parser.ids:
                    fail(f"{rel}: missing same-page anchor #{parsed.fragment}", errors)
                continue
            target = local_target(page, href)
            if target is None:
                continue
            if target.is_dir():
                target = target / "index.html"
            if not target.exists():
                try:
                    display = target.relative_to(ROOT)
                except ValueError:
                    display = target
                fail(f"{rel}: missing local link {href} -> {display}", errors)

    index = (ROOT / "index.html").read_text(encoding="utf-8")
    config = (ROOT / "config.js").read_text(encoding="utf-8")
    bridge = (ROOT / "assets/static-api.js").read_text(encoding="utf-8")
    combined = "\n".join([index, config, bridge])

    banned_content = [
        "Demo Person", "John Doe", "Jane Doe", "demo candidate", "sample prisoner",
        "sk_live_", "service_role", "BEGIN PRIVATE KEY", "AKIA",
    ]
    for token in banned_content:
        if token.lower() in combined.lower():
            fail(f"Banned release content detected: {token}", errors)

    if EXPECTED_SITE not in config:
        fail(f"config.js must target {EXPECTED_SITE}", errors)
    if not re.search(r'mode\s*:\s*["\']local["\']', config):
        fail("Published test configuration must default to local mode", errors)
    if "emptyDb" not in bridge or "candidates: []" not in bridge or "registry: []" not in bridge:
        fail("Browser test database must initialize without fabricated people or registry records", errors)
    passport = (ROOT / "passport.html").read_text(encoding="utf-8")
    if ".mobile-top,.mobile-nav{display:none}" not in passport:
        fail("Passport desktop layout must hide mobile-only navigation by default", errors)

    try:
        manifest = json.loads((ROOT / "manifest.webmanifest").read_text(encoding="utf-8"))
        if manifest.get("start_url") != "./" or manifest.get("scope") != "./":
            fail("Manifest must remain project-page relative", errors)
    except Exception as exc:
        fail(f"Invalid manifest.webmanifest: {exc}", errors)

    forbidden_paths: list[Path] = []
    for pattern in (".env", "*.db", "*.db-wal", "*.db-shm", "*.pyc", ".dev_encryption_key"):
        forbidden_paths.extend(p for p in ROOT.rglob(pattern) if p.is_file())
    forbidden_paths = [p for p in forbidden_paths if p.name != ".env.example"]
    if forbidden_paths:
        fail("Forbidden runtime/secret files present: " + ", ".join(str(p.relative_to(ROOT)) for p in forbidden_paths), errors)

    node = shutil.which("node")
    if node:
        for rel in ["config.js", "assets/static-api.js"]:
            proc = subprocess.run([node, "--check", str(ROOT / rel)], capture_output=True, text=True)
            if proc.returncode:
                fail(f"JavaScript syntax failed for {rel}: {proc.stderr.strip()}", errors)
        inline_pattern = re.compile(r"<script(?P<attrs>[^>]*)>(?P<body>.*?)</script>", re.IGNORECASE | re.DOTALL)
        for rel in HTML_FILES:
            text = (ROOT / rel).read_text(encoding="utf-8")
            for index, match in enumerate(inline_pattern.finditer(text), start=1):
                attrs = match.group("attrs").lower()
                if "src=" in attrs or "application/ld+json" in attrs:
                    continue
                proc = subprocess.run([node, "--check"], input=match.group("body"), capture_output=True, text=True)
                if proc.returncode:
                    fail(f"Inline JavaScript syntax failed for {rel} script {index}: {proc.stderr.strip()}", errors)

    if errors:
        print("Justice Grows release check FAILED", file=sys.stderr)
        for error in errors:
            print(f" - {error}", file=sys.stderr)
        return 1

    print("Justice Grows release check PASSED")
    print(f" - {len(PUBLIC_FILES)} required public files present")
    print(f" - {len(HTML_FILES)} HTML pages, local links, and scripts checked")
    print(" - local test database starts empty")
    print(" - target GitHub Pages path configured")
    print(" - no runtime database, private key, or environment file present")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
