#!/usr/bin/env python3
"""Reproduce staged L1/L2 from owner-provided PDFs; never approve geography."""
import argparse
import json
import tempfile
import fitz
import math
from pathlib import Path
from PIL import Image, ImageChops
from import_workbooks import extract_book, get_map
from extract_curriculum_facts import extract as extract_facts, markdown as facts_markdown


def verify_arrow_vertices(source, puzzles):
    """Independently compare every stored triangle/shaft to raw PDF drawings."""
    pdf = fitz.open(source)
    total = 0
    for puzzle in puzzles:
        page = pdf[puzzle['provenance']['mapPdfPage'] - 1]
        _, rect = get_map(page)
        def pct(point):
            return (round((point.x - rect.x0) * 100 / rect.width, 3),
                    round((point.y - rect.y0) * 100 / rect.height, 3))
        lines, triangles = [], []
        for drawing in page.get_drawings():
            color = drawing.get('color')
            if color is None or max(color) >= .12 or not rect.intersects(drawing['rect']):
                continue
            items = drawing['items']
            if drawing['type'] == 's' and len(items) == 1 and items[0][0] == 'l':
                lines.append(items[0][1:])
            elif drawing['type'] == 'fs' and len(items) == 3 and all(i[0] == 'l' for i in items):
                triangles.append(items)
        # The equator/meridian page also has non-arrow black lines.
        # A decorative triangle also occurs on L2-06. Only polygons paired
        # with the stored source shafts are arrow heads; every such pair is
        # checked below, independently of the importer's nearest-head search.
        assert len(triangles) >= puzzle['arrowCount'], (puzzle['id'], 'source triangle count')
        used = set()
        for marker in puzzle['markers']:
            target = marker.get('pointsTo')
            if not target:
                continue
            xy = lambda p: (p['x'], p['y'])
            line = [line for line in lines if pct(line[0]) == xy(target['from']) and pct(line[1]) == xy(target['shaftEnd'])]
            assert len(line) == 1, (puzzle['id'], 'source shaft mismatch')
            stored = {xy(p) for p in target['headPoints']}
            matches = [(i, items) for i, items in enumerate(triangles)
                       if {pct(vertex) for item in items for vertex in item[1:]} == stored]
            assert len(matches) == 1 and matches[0][0] not in used, (puzzle['id'], 'source polygon mismatch')
            index, items = matches[0]; used.add(index)
            start, end = line[0]
            tip = max([v for item in items for v in item[1:]],
                      key=lambda v: (v.x - start.x) * (end.x - start.x) + (v.y - start.y) * (end.y - start.y))
            assert pct(tip) == xy(target), (puzzle['id'], 'shaft endpoint used instead of source apex')
            assert math.hypot(tip.x - end.x, tip.y - end.y) > 0
            total += 1
    pdf.close()
    return total


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
            assert verify_arrow_vertices(source, staged) == sum(p['arrowCount'] for p in staged)
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
    print(f'PASS: {count} staged puzzles, {arrows} exact PDF triangles/apices/shafts, {maps} pixel-identical maps; no geographic approvals inferred.')


if __name__ == '__main__':
    main()
