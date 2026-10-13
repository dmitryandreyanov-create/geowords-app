#!/usr/bin/env python3
"""Reproduce staged L1/L2 from owner-provided PDFs; never approve geography."""
import argparse
import json
import tempfile
from pathlib import Path
from PIL import Image, ImageChops
from import_workbooks import extract_book
from extract_curriculum_facts import extract as extract_facts, markdown as facts_markdown


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--l1', required=True)
    parser.add_argument('--l2', required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parent.parent
    count = arrows = maps = 0
    with tempfile.TemporaryDirectory(prefix='geowords-source-qa-') as scratch:
        out = Path(scratch)
        for book, source in [('l1', args.l1), ('l2', args.l2)]:
            fresh, images = extract_book(source, book, out)
            staged = json.loads((root / f'data/import-staging/{book}-staging.json').read_text())['puzzles']
            if fresh != staged:
                changes = [(a['id'], key) for a, b in zip(fresh, staged)
                           for key in set(a) | set(b) if a.get(key) != b.get(key)]
                raise ValueError(f'{book}: staged source differs: {changes}')
            for name in images.values():
                with Image.open(out / name) as new, Image.open(root / 'assets/import-staging' / name) as old:
                    if new.size != old.size or ImageChops.difference(new.convert('RGB'), old.convert('RGB')).getbbox():
                        raise ValueError('Source map pixels differ: ' + name)
            count += len(fresh)
            arrows += sum(p['arrowCount'] for p in fresh)
            maps += len(images)
    expected_facts = json.loads((root / 'data/import-staging/facts-draft.json').read_text())
    fresh_facts = extract_facts({'l1': args.l1, 'l2': args.l2})
    if fresh_facts != expected_facts:
        raise ValueError('Source lesson transcript differs from staged facts')
    if facts_markdown(fresh_facts) != (root / 'docs/SOURCE_FACTS_DRAFT.md').read_text():
        raise ValueError('Human-readable facts draft differs from source transcript')
    print(f"PASS: {len(fresh_facts['sourceBlocks'])} source lesson blocks and their readable transcript reproduced exactly.")
    print(f'PASS: {count} staged puzzles, {arrows} PDF arrows, {maps} pixel-identical maps; no geographic approvals inferred.')


if __name__ == '__main__':
    main()
