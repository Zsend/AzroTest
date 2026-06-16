#!/usr/bin/env python3
from pathlib import Path
from bs4 import BeautifulSoup
import sys, re
root = Path(__file__).resolve().parents[1]
html_files = list(root.rglob('*.html'))
errors=[]
for f in html_files:
    text=f.read_text(errors='replace')
    soup=BeautifulSoup(text, 'html.parser')
    if not soup.find('title'):
        errors.append(f'{f}: missing title')
    if not soup.find('meta', attrs={'name':'viewport'}):
        errors.append(f'{f}: missing viewport')
    for tag in soup.find_all(['a','link','script']):
        attr='href' if tag.name in ['a','link'] else 'src'
        val=tag.get(attr)
        if not val or val.startswith(('#','http','mailto:','tel:','javascript:')):
            continue
        if tag.name=='a' and val.startswith('#'):
            continue
        clean=val.split('#')[0].split('?')[0]
        target=(f.parent/clean).resolve()
        try:
            target.relative_to(root.resolve())
        except ValueError:
            errors.append(f'{f}: link leaves root: {val}')
            continue
        if clean and not target.exists():
            errors.append(f'{f}: missing local target: {val}')
if errors:
    print('FAILED')
    for e in errors: print('-', e)
    sys.exit(1)
print(f'PASSED: {len(html_files)} HTML files checked, local links/assets valid.')
