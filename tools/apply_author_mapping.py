#!/usr/bin/env python3
"""Apply author-reviewed clue-to-glyph bindings to a staged GeoWords source import.

Fails closed on wrong letters, repeated marker assignment, and unknown puzzle IDs.
Does not make the resulting content live in the PWA or validate geography itself.
"""
import argparse,copy,json
from pathlib import Path

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--staging',required=True,help='import-staging.json produced from author PDFs')
    ap.add_argument('--review',required=True,help='geowords-author-mapping.json from reviewer UI')
    ap.add_argument('--out',required=True)
    ap.add_argument('--require-complete',action='store_true')
    args=ap.parse_args()
    data=json.loads(Path(args.staging).read_text(encoding='utf-8'))
    review=json.loads(Path(args.review).read_text(encoding='utf-8'))
    assignments=review.get('assignments')
    if not isinstance(assignments,dict):raise ValueError('Review export has no assignments')
    puzzles=copy.deepcopy(data['books'])
    ids={p['id'] for p in puzzles}
    unknown=set(assignments)-ids
    if unknown:raise ValueError('Unknown puzzle IDs: '+', '.join(sorted(unknown)))
    unassigned=0
    for puzzle in puzzles:
        markers={m['id']:m for m in puzzle['markers']}
        selected=set()
        fixes=assignments.get(puzzle['id'],{})
        if not isinstance(fixes,dict):raise ValueError('Bad review object for '+puzzle['id'])
        valid_positions={str(c['position']) for c in puzzle['clues']}
        if set(fixes)-valid_positions:raise ValueError('Unknown clue position in '+puzzle['id'])
        for c in puzzle['clues']:
            answer=fixes.get(str(c['position']),c.get('markerId'))
            if answer is None:
                unassigned+=1;continue
            if answer not in markers:raise ValueError(f'{puzzle["id"]}: nonexistent marker {answer}')
            if answer not in c['candidateMarkerIds']:raise ValueError(f'{puzzle["id"]}: marker {answer} has wrong letter')
            if markers[answer]['letter']!=c['answerLetter']:raise ValueError('Letter mismatch')
            if answer in selected:raise ValueError(f'{puzzle["id"]}: marker {answer} was already assigned')
            c['markerId']=answer
            selected.add(answer)
        if unassigned==0 and len(selected)!=len(puzzle['markers']):
            raise ValueError(f'{puzzle["id"]}: puzzle assignment not bijective')
    if args.require_complete and unassigned:
        raise ValueError(f'{unassigned} clues are not mapped; author mapping is not ready for game')
    result={'schemaVersion':1,'status':'source_mapped_not_yet_author_approved' if unassigned==0 else 'source_partially_mapped',
            'unassigned':unassigned,'books':puzzles}
    Path(args.out).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'{len(puzzles)} puzzles, {unassigned} unresolved clues, saved {args.out}')
if __name__=='__main__':main()