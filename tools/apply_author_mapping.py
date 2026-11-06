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


def apply(puzzles, review, require_complete=False, require_reviewed=False):
    decisions = review.get('assignments')
    if review.get('version') not in (1, 2) or review.get('generatedFrom') != 'author map review' or not isinstance(decisions, dict):
        raise ValueError('Review export must contain version=1/2, author map review, and assignments')
    if review.get('sourceQuizCount') != len(puzzles):
        raise ValueError('Review export has the wrong number of source puzzles')
    known = {p['id'] for p in puzzles}
    if set(decisions) - known:
        raise ValueError('Unknown puzzle IDs: ' + ', '.join(sorted(set(decisions)-known)))
    confirmations = review.get('confirmations') if review['version'] == 2 else {}
    if not isinstance(confirmations, dict) or set(confirmations) - known:
        raise ValueError('Invalid confirmation puzzle IDs or format')
    unassigned = 0
    unreviewed = 0
    for puzzle in puzzles:
        glyphs = {m['id']: m for m in puzzle['markers']}
        assignments = decisions.get(puzzle['id'], {})
        if not isinstance(assignments, dict):
            raise ValueError('Bad review assignments for ' + puzzle['id'])
        positions = {str(c['position']) for c in puzzle['clues']}
        if set(assignments) - positions:
            raise ValueError('Unknown clue position for ' + puzzle['id'])
        approvals = confirmations.get(puzzle['id'], {})
        if not isinstance(approvals, dict) or set(approvals) - positions:
            raise ValueError('Invalid confirmation positions for ' + puzzle['id'])
        selected = set()
        local_missing = 0
        for clue in puzzle['clues']:
            chosen = assignments.get(str(clue['position']), clue.get('markerId'))
            if chosen is None:
                if str(clue['position']) in approvals:
                    raise ValueError('Confirmation without mapping for ' + puzzle['id'])
                local_missing += 1
                unreviewed += 1
                clue['geographyReviewed'] = False
                continue
            if chosen not in clue['candidateMarkerIds'] or chosen not in glyphs:
                raise ValueError(f'{puzzle["id"]}: marker {chosen} is not a valid candidate')
            if glyphs[chosen]['letter'] != clue['answerLetter']:
                raise ValueError('Wrong letter for ' + puzzle['id'])
            if chosen in selected:
                raise ValueError(f'{puzzle["id"]}: marker {chosen} assigned twice')
            clue['markerId'] = chosen
            selected.add(chosen)
            marker = glyphs[chosen]
            evidence = {'markerId': chosen, 'clueText': clue['text'], 'x': marker['x'],
                        'y': marker['y'], 'pointsTo': marker.get('pointsTo')}
            approved = str(clue['position']) in approvals
            if approved and approvals[str(clue['position'])] != evidence:
                raise ValueError('Stale or invalid geographic confirmation for ' + puzzle['id'])
            clue['geographyReviewed'] = approved
            if not approved:
                unreviewed += 1
        if local_missing == 0 and len(selected) != len(puzzle['markers']):
            raise ValueError('Non-bijective mapping for ' + puzzle['id'])
        unassigned += local_missing
    if require_complete and unassigned:
        raise ValueError(f'{unassigned} clues still need author review')
    if require_reviewed and (unassigned or unreviewed):
        raise ValueError(f'{unassigned} unmapped and {unreviewed} geographically unreviewed clues')
    return {'schemaVersion':2,
            'status':('source_geographically_reviewed_facts_pending' if not unreviewed else
                      'source_mapped_not_yet_author_approved' if not unassigned else 'source_partially_mapped'),
            'unassigned':unassigned, 'unreviewed':unreviewed, 'books':puzzles}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--staging', required=True, nargs='+', help='One combined books JSON or separate l1/l2 puzzles JSONs')
    parser.add_argument('--review', required=True)
    parser.add_argument('--out', required=True)
    parser.add_argument('--require-complete', action='store_true')
    parser.add_argument('--require-reviewed', action='store_true', help='Require geographic confirmation of every clue, including unique glyphs')
    args = parser.parse_args()
    result = apply(load_staging(args.staging),
                   json.loads(Path(args.review).read_text(encoding='utf-8')),
                   args.require_complete, args.require_reviewed)
    Path(args.out).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f"{len(result['books'])} puzzles, {result['unassigned']} unresolved: {args.out}")


if __name__ == '__main__':
    main()
