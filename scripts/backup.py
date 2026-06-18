#!/usr/bin/env python3
from __future__ import annotations
import argparse, os, sqlite3
from datetime import datetime, timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SRC=Path(os.getenv("DATABASE_PATH",ROOT/"data"/"justice_grows.db"))

def main():
    ap=argparse.ArgumentParser(description="Create a consistent SQLite backup.")
    ap.add_argument("--output",type=Path)
    args=ap.parse_args()
    out=args.output or ROOT/"backups"/f"justice_grows_{datetime.now(timezone.utc):%Y%m%dT%H%M%SZ}.db"
    out.parent.mkdir(parents=True,exist_ok=True)
    with sqlite3.connect(SRC) as src, sqlite3.connect(out) as dst: src.backup(dst)
    print(out)
if __name__=="__main__": main()
