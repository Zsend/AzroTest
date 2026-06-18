#!/usr/bin/env python3
"""Import reviewed registry rows as DRAFTS only. Publication remains an admin/legal approval step."""
from __future__ import annotations
import argparse, csv, os, sqlite3, uuid
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = Path(os.getenv("DATABASE_PATH", ROOT / "data" / "justice_grows.db"))

def now(): return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00","Z")
def truthy(v): return str(v).strip().lower() in {"1","true","yes","y"}

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("csv_file", type=Path)
    args=ap.parse_args()
    conn=sqlite3.connect(DB)
    conn.execute("PRAGMA foreign_keys=ON")
    count=0
    with args.csv_file.open(newline="",encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            rid=(row.get("id") or f"reg_{uuid.uuid4().hex[:16]}").strip()
            required=["jurisdiction","custody_status","cannabis_classification","violence_screen_statement","confidence","last_verified_at"]
            missing=[x for x in required if not (row.get(x) or "").strip()]
            if missing: raise SystemExit(f"Row {count+2}: missing {', '.join(missing)}")
            ts=now()
            conn.execute("""
              INSERT INTO public_registry_records(
                id,display_name,jurisdiction,state,agency_identifier,custody_status,cannabis_classification,
                violence_screen_statement,confidence,source_count,last_verified_at,projected_release_date,
                release_date,publication_status,profile_consent,created_at,updated_at
              ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,'draft',?,?,?)
            """,(
              rid,row.get("display_name") or None,row["jurisdiction"],row.get("state") or None,
              row.get("agency_identifier") or None,row["custody_status"],row["cannabis_classification"],
              row["violence_screen_statement"],row["confidence"],int(row.get("source_count") or 0),
              row["last_verified_at"],row.get("projected_release_date") or None,row.get("release_date") or None,
              int(truthy(row.get("profile_consent"))),ts,ts
            ))
            count+=1
    conn.commit(); conn.close()
    print(f"Imported {count} registry drafts. No rows were published.")
if __name__=="__main__": main()
