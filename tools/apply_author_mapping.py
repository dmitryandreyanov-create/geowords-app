#!/usr/bin/env python3
"""Apply human-approved glyph IDs to one or more staged author imports.

Never guesses positions, merges duplicate puzzle IDs, or publishes levels.
"""
import argparse
import copy
import json
from pathlib import Path


def load_staging(paths):
    puzzles = []
    seen = set()
    for path in paths:
        data = json.loads(Path(path).read_text(encoding='utf-8'))
        if data.get('status') != 'not_for_live_use':
            raise ValueError(f'{path}: only staged source data accepted')
        entries = data.get('books', data.get('puzzles'))
        if not isinstance(entries, list):
            raise ValueError(f'{path}: expected books or puzzles array')
        for p in entries:
            if p['id'] in seen:
                raise ValueError('Duplicate puzzle ID across input files: ' + p['id'])
            seen.add(p['id'])
            puzzles.append(copy.deepcopy(p))
    return puzzles


def apply(puzzles, review, require_complete=False):
    decisions = review.get('assignments')
    if review.get('version') != 1 or not isinstance(decisions, dict):
        raise ValueError('Review export must contain version=1 and assignments')
    if review.get('sourceQuizCount') not in (None, len(puzzles)):
        raise ValueError('Review export has the wrong number of source puzzles')
    known = {p['id'] for p in puzzles}
    if set(decisions) - known:
        raise ValueError('Unknown puzzle IDs: ' + ', '.join(sorted(set(decisions)-known)))
    unassigned = 0
    for puzzle in puzzles:
        glyphs = {m['id']: m for m in puzzle['markers']}
        assignments = decisions.get(puzzle['id'], {})
        if not isinstance(assignments, dict):
            raise ValueError('Bad review assignments for ' + puzzle['id'])
        positions = {str(c['position']) for c in puzzle['clues']}
        if set(assignments) - positions:
            raise ValueError('Unknown clue position for ' + puzzle['id'])
        selected = set()
        local_missing = 0
        for clue in puzzle['clues']:
            chosen = assignments.get(str(clue['position']), clue.get('markerId'))
            if chosen is None:
                local_missing += 1
                continue
            if chosen not in clue['candidateMarkerIds'] or chosen not in glyphs:
                raise ValueError(f'{puzzle["id"]}: marker {chosen} is not a valid candidate')
            if glyphs[chosen]['letter'] != clue['answerLetter']:
                raise ValueError('Wrong letter for ' + puzzle['id'])
            if chosen in selected:
                raise ValueError(f'{puzzle["id"]}: marker {chosen} assigned twice')
            clue['markerId'] = chosen
            selected.add(chosen)
        if local_missing == 0 and len(selected) != len(puzzle['markers']):
            raise ValueError('Non-bijective mapping for ' + puzzle['id'])
        unassigned += local_missing
    if require_complete and unassigned:
        raise ValueError(f'{unassigned} clues still need author review')
    return {'schemaVersion':1,
            'status':'source_mapped_not_yet_author_approved' if not unassigned else 'source_partially_mapped',
            'unassigned':unassigned, 'books':puzzles}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--staging', required=True, nargs='+', help='One combined books JSON or separate l1/l2 puzzles JSONs')
    parser.add_argument('--review', required=True)
    parser.add_argument('--out', required=True)
    parser.add_argument('--require-complete', action='store_true')
    args = parser.parse_args()
    result = apply(load_staging(args.staging),
                   json.loads(Path(args.review).read_text(encoding='utf-8')),
                   args.require_complete)
    Path(args.out).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f"{len(result['books'])} puzzles, {result['unassigned']} unresolved: {args.out}")


if __name__ == '__main__':
    main()
