#!/usr/bin/env python3
"""Extract calibrated source-only lesson regions from owner-provided PDFs.

Regions follow this edition's two-column layouts. No geographic claims,
knowledge IDs, or unlock timing are approved by extraction.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path
import fitz

# book, PDF page, category, stable region name, bounding box in PDF points.
REGIONS = [
    ('l1', 6, 'intro', 'continents', (225, 115, 740, 175)),
    ('l1', 6, 'intro', 'eurasia', (435, 180, 740, 268)),
    ('l1', 6, 'intro', 'oceans', (435, 278, 740, 362)),
    ('l1', 6, 'intro', 'land-water', (435, 375, 740, 476)),
    ('l1', 6, 'intro', 'pacific-map', (475, 480, 740, 558)),
    ('l1', 8, 'bridge', 'continent-properties', (300, 405, 740, 532)),
    ('l1', 10, 'bridge', 'oceans-left', (110, 440, 410, 510)),
    ('l1', 10, 'bridge', 'oceans-right', (430, 440, 740, 510)),
    ('l1', 10, 'caveat', 'salinity-note', (50, 520, 740, 556)),
    ('l1', 12, 'bridge', 'directions', (125, 430, 740, 516)),
    ('l1', 14, 'bridge', 'equator', (130, 450, 415, 520)),
    ('l1', 14, 'bridge', 'prime-meridian', (435, 450, 740, 520)),
    ('l1', 16, 'bridge', 'islands-left', (130, 430, 415, 503)),
    ('l1', 16, 'bridge', 'islands-right', (435, 430, 740, 503)),
    ('l1', 16, 'caveat', 'island-continent-note', (50, 510, 740, 556)),
    ('l1', 18, 'bridge', 'residents-climate-population', (90, 408, 740, 529)),
    ('l1', 20, 'bridge', 'records-left', (135, 378, 410, 511)),
    ('l1', 20, 'bridge', 'records-right', (425, 378, 740, 511)),
    ('l1', 20, 'caveat', 'nile-note', (50, 518, 740, 550)),
    ('l1', 22, 'bridge', 'deserts', (130, 415, 415, 518)),
    ('l1', 22, 'bridge', 'coldest-settlement', (450, 415, 740, 518)),
    ('l1', 24, 'bridge', 'appalachians', (105, 448, 415, 519)),
    ('l1', 24, 'bridge', 'himalayas', (425, 448, 740, 519)),
    ('l2', 7, 'bridge', 'nile-mediterranean', (365, 370, 740, 511)),
    ('l2', 7, 'caveat', 'nile-note', (90, 515, 740, 536)),
    ('l2', 9, 'bridge', 'amazon-volume', (135, 472, 380, 536)),
    ('l2', 9, 'bridge', 'amazon-location', (400, 472, 740, 530)),
    ('l2', 11, 'bridge', 'mississippi-gulf', (95, 405, 740, 505)),
    ('l2', 13, 'bridge', 'yangtze', (130, 405, 425, 536)),
    ('l2', 13, 'context', 'direction-tips', (515, 425, 740, 508)),
    ('l2', 15, 'bridge', 'ganges', (130, 460, 415, 510)),
    ('l2', 15, 'bridge', 'rituals', (430, 460, 740, 510)),
    ('l2', 17, 'bridge', 'danube', (95, 378, 380, 508)),
    ('l2', 17, 'context', 'roman-forts', (490, 393, 740, 513)),
    ('l2', 19, 'bridge', 'volga', (130, 397, 435, 497)),
    ('l2', 19, 'context', 'caspian', (490, 405, 740, 481)),
    ('l2', 19, 'caveat', 'volga-kama-note', (75, 499, 740, 531)),
    ('l2', 21, 'context', 'civilizations', (250, 350, 435, 413)),
    ('l2', 21, 'context', 'hydronyms', (500, 420, 740, 503)),
    ('l2', 23, 'context', 'river-benefits', (310, 421, 500, 486)),
    ('l2', 25, 'context', 'care-for-rivers', (225, 450, 550, 505)),
]


def normalize(text):
    return re.sub(r'\s+', ' ', text.replace('\u2028', '\n').replace('\u2029', '\n')).strip()


def extract_lines(page, region):
    x0, y0, x1, y1 = region
    rows = []
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines', []):
            rect = line['bbox']
            cx, cy = (rect[0]+rect[2])/2, (rect[1]+rect[3])/2
            text = normalize(''.join(span['text'] for span in line['spans']))
            if x0 <= cx <= x1 and y0 <= cy <= y1 and text and not text.isdigit() and not text.startswith('@'):
                rows.append({'text': text, 'bbox': [round(n, 3) for n in rect]})
    rows.sort(key=lambda row: (row['bbox'][1], row['bbox'][0]))
    return rows


def extract(paths):
    books = {book: fitz.open(path) for book, path in paths.items()}
    source_blocks = []
    for book, page_num, category, name, region in REGIONS:
        rows = extract_lines(books[book][page_num-1], region)
        text = normalize(' '.join(row['text'] for row in rows))
        if not text or re.search(r'The (?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth) letter|For the next quiz|Good to know:|Helpful Tips:|Interesting fact:|Remember:', text):
            raise ValueError(f'Empty or contaminated lesson region: {book} page {page_num} {name}')
        source_blocks.append({
            'id': f'source-{book}-p{page_num:02d}-{name}',
            'status': 'editorial_pending', 'category': category, 'text': {'en': text},
            'sourceLines': rows,
            'provenance': {'source': Path(paths[book]).name, 'pdfPage': page_num,
                           'region': list(region)},
            'caveatBlockIds': [],
        })
    # Keep the source's qualifiers attached to every affected lesson group.
    for caveat in source_blocks:
        if caveat['category'] == 'caveat':
            for block in source_blocks:
                if block['category'] == 'bridge' and block['provenance']['source'] == caveat['provenance']['source'] and block['provenance']['pdfPage'] == caveat['provenance']['pdfPage']:
                    block['caveatBlockIds'].append(caveat['id'])
    lessons = []
    for book, start in [('l1', 6), ('l2', 5)]:
        if book == 'l1':
            lessons.append({'id': 'l1-intro', 'status': 'editorial_pending',
                            'candidateBinding': {'phase': 'before', 'stepId': 'l1-01-step'},
                            'sourceBlockIds': [b['id'] for b in source_blocks if b['category'] == 'intro'],
                            'requiredBlockIds': None})
        for i in range(10):
            page = start+2*i+2
            matching = [b for b in source_blocks if b['provenance']['source'] == Path(paths[book]).name and b['provenance']['pdfPage'] == page]
            lessons.append({'id': f'{book}-{i+1:02d}-after', 'status': 'editorial_pending',
                            'candidateBinding': {'phase': 'after', 'stepId': f'{book}-{i+1:02d}-step'},
                            'sourceBlockIds': [b['id'] for b in matching],
                            'requiredBlockIds': None,
                            'nextAuthoredPuzzleId': f'{book}-{i+2:02d}' if i < 9 else None})
    return {'schemaVersion': 1, 'status': 'not_for_live_use',
            'warning': 'Source text only. A bridge/context label and candidate phase do not approve truth, prerequisite facts, unlock timing, or geographic semantics.',
            'sources': [{'bookId': book, 'source': Path(path).name,
                         'sha256': hashlib.sha256(Path(path).read_bytes()).hexdigest()} for book, path in paths.items()],
            'sourceBlocks': source_blocks, 'lessons': lessons}


def markdown(data):
    blocks = {b['id']: b for b in data['sourceBlocks']}
    out = ['# Факты L1/L2 — исходный текст для последующей проверки', '',
           'Все блоки — `editorial_pending`, не игровые факты. Формулировки ниже взяты из PDF, не исправлены и не переведены автоматически. Границы обязательного изучения и момента открытия ещё не утверждены.', '',
           'Важные оговорки источника сохранены рядом с утверждениями. Пустой список исходных блоков означает только, что в откалиброванной области не найден учебный блок; не означает утверждённый пустой урок.', '']
    categories = {'intro': 'Вводный блок', 'bridge': 'Блок «для следующего задания»', 'context': 'Дополнительный контекст', 'caveat': 'Оговорка автора'}
    for lesson in data['lessons']:
        out += ['## '+lesson['id'], '', 'Предлагаемая привязка: `'+lesson['candidateBinding']['stepId']+'`, `'+lesson['candidateBinding']['phase']+'` — требует проверки.', '']
        if not lesson['sourceBlockIds']:
            out += ['На этой странице не выделен исходный учебный блок. Не придумывать переходные факты.', '']
        for id in lesson['sourceBlockIds']:
            b = blocks[id]
            out += ['### '+categories[b['category']]+' · PDF стр. '+str(b['provenance']['pdfPage']), '',
                    '`'+id+'`', '', '> '+b['text']['en'], '']
    return '\n'.join(out)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--l1', required=True)
    parser.add_argument('--l2', required=True)
    parser.add_argument('--out', required=True)
    parser.add_argument('--markdown')
    args = parser.parse_args()
    data = extract({'l1': args.l1, 'l2': args.l2})
    Path(args.out).write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    if args.markdown:
        Path(args.markdown).write_text(markdown(data), encoding='utf-8')
    print(f"{len(data['sourceBlocks'])} source blocks, {len(data['lessons'])} candidate lessons; all editorial_pending")


if __name__ == '__main__':
    main()
