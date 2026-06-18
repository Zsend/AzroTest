#!/usr/bin/env python3
"""Read-only smoke test for a running Justice Grows deployment."""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

CHECKS = [
    ("health", "/api/health", "application/json"),
    ("metrics", "/api/public/metrics", "application/json"),
    ("analytics", "/api/public/analytics", "application/json"),
    ("jobs", "/api/public/jobs", "application/json"),
    ("registry", "/api/public/registry", "application/json"),
    ("talent", "/api/public/talent", "application/json"),
    ("home", "/", "text/html"),
    ("passport", "/profile", "text/html"),
    ("admin", "/admin", "text/html"),
]


def run(base: str) -> int:
    base = base.rstrip("/")
    failed = False
    for name, path, expected in CHECKS:
        try:
            request = urllib.request.Request(base + path, headers={"User-Agent": "justice-grows-smoke-test/1.0"})
            with urllib.request.urlopen(request, timeout=10) as response:
                content_type = response.headers.get("content-type", "")
                body = response.read()
                ok = response.status == 200 and expected in content_type and len(body) > 10
                if expected == "application/json":
                    json.loads(body)
                print(f"{'PASS' if ok else 'FAIL'} {name:10} {response.status} {content_type}")
                failed |= not ok
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            print(f"FAIL {name:10} {exc}")
            failed = True
    return 1 if failed else 0


if __name__ == "__main__":
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"
    raise SystemExit(run(base_url))
