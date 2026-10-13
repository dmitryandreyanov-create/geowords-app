#!/usr/bin/env python3
"""Extract lossless authored geometry and clue text for review, not live puzzles.

Requires local copyright-owner-provided PDFs and PyMuPDF. Never guesses
ambiguous letter-to-clue assignments. Outputs staged JSON and clean maps.
"""
import argparse
import json
import re
from collections import Counter
from pathlib import Path
import fitz
from PIL import Image
from io import BytesIO

ORD = {w: n+1 for n,w in enumerate('first second third fourth fifth sixth seventh eighth ninth tenth eleventh twelfth thirteenth fourteenth fifteenth sixteenth seventeenth eighteenth nineteenth twentieth'.split())}
PAT = re.compile(r'(?i)\bThe\s+('+'|'.join(ORD)+r'|\d+(?:st|nd|rd|th))\s+letter\b')
ANSWERS={
 'l1':'CONTINENT HEMISPHERE PLANKTON METEOROLOGIST SPACE EXPLORATION HYDRATION TRIBUTARY DESERTIFICATION LANDMASS'.split(),
 'l2':'CHANNEL FLOODPLAIN RAINFOREST MUDDINESS IRRIGATION HINDUISM BARBARIANS MEANDER ATMOSPHERE HIMALAYAS'.split()
}

FACT_HEADERS = re.compile(r'(?i)For the next quiz|Helpful Tips|Good to know:|Interesting fact:|Remember:|Let.s practice more!')

def clues(page):
    # Limit BOTH columns at the first factual inset heading, rather than a
    # hard-coded bottom coordinate. The final clue can extend below y=402.
    blocks=[b for b in page.get_text('blocks') if b[6]==0]
    first_clue_y=min((b[1] for b in blocks if PAT.search(b[4])),default=80)
    facts_start=min((b[1] for b in blocks if b[1]>first_clue_y+35 and FACT_HEADERS.search(b[4])),default=517)
    columns=[]
    for low,high in [(0,400),(400,800)]:
        text=' '.join(b[4].replace('\n',' ') for b in sorted(blocks,key=lambda z:z[1])
                      if 80<=b[1]<facts_start-0.4 and low<=b[0]<high)
        columns.append(text)
    records=[]
    for col in columns:
        matches=list(PAT.finditer(col))
        for j,m in enumerate(matches):
            ordstr=m.group(1).lower()
            index=ORD.get(ordstr) or int(re.match(r'\d+',ordstr).group())
            end=matches[j+1].start() if j+1<len(matches) else len(col)
            part=re.sub(r'\s+',' ',col[m.start():end]).strip()
            part=FACT_HEADERS.split(part)[0].strip()
            if not part.endswith('.'):
                raise ValueError(f'Incomplete clue #{index} on PDF page {page.number+1}: {part!r}')
            records.append({'position':index,'text':part})
    return sorted(records,key=lambda x:x['position'])


def extract_arrows(page,rect,markers):
    """Match a vector arrow shaft + black triangular head to a PDF glyph.

    This is structural geometry, not semantic interpretation: all results
    retain source coordinates, and geography still requires author review.
    """
    import math
    black=lambda color: color is not None and max(color)<0.12
    lines=[]; heads=[]
    for d in page.get_drawings():
        if not rect.intersects(d['rect']) or not black(d['color']):
            continue
        items=d['items']
        if d['type']=='s' and len(items)==1 and items[0][0]=='l':
            _,start,end=items[0]
            lines.append((start,end))
        elif d['type']=='fs' and len(items)==3 and all(item[0]=='l' for item in items):
            vertices=[]
            for item in items:
                for point in item[1:]:
                    if not any(math.hypot(point.x-v.x,point.y-v.y)<0.001 for v in vertices):
                        vertices.append(point)
            if len(vertices)==3:
                heads.append({'rect':d['rect'],'vertices':vertices})
    matches=[]
    for start,end in lines:
        candidate=[]
        for idx,m in enumerate(markers):
            cx=rect.x0+m['x']*rect.width/100;cy=rect.y0+m['y']*rect.height/100
            d=math.hypot(start.x-cx,start.y-cy)
            if d<31:candidate.append((d,idx))
        if not candidate: continue
        d,idx=min(candidate)
        matching=[h for h in heads if math.hypot((h['rect'].x0+h['rect'].x1)/2-end.x,(h['rect'].y0+h['rect'].y1)/2-end.y)<14]
        if len(matching)!=1:continue
        if any(m['marker']==idx for m in matches):raise ValueError('Multiple arrows for same glyph')
        head=matching[0]
        dx,dy=end.x-start.x,end.y-start.y
        # The shaft ends inside the triangle, short of its visible apex.
        tip=max(head['vertices'],key=lambda v:(v.x-start.x)*dx+(v.y-start.y)*dy)
        def percent(point):
            return {'x':round((point.x-rect.x0)*100/rect.width,3),
                    'y':round((point.y-rect.y0)*100/rect.height,3)}
        matches.append({'marker':idx,'from':percent(start),'shaftEnd':percent(end),
                        'headPoints':[percent(v) for v in head['vertices']],
                        'target':percent(tip)})
    if len(matches)!=len(lines):
        raise ValueError(f'Arrow matching incomplete on PDF page {page.number+1}: {len(matches)}/{len(lines)}')
    for m in matches:
        markers[m['marker']]['pointsTo']={**m['target'],'from':m['from'],
                                        'shaftEnd':m['shaftEnd'],'headPoints':m['headPoints']}
    return len(matches)

def get_map(page):
    candidates=[img for img in page.get_images(full=True) if img[2]>900 and img[3]>900]
    if not candidates: raise ValueError('No large author map image')
    im=max(candidates,key=lambda x:x[2]*x[3]); rects=page.get_image_rects(im[0])
    if not rects: raise ValueError('Map rectangle not found')
    return im,rects[0]

def extract_book(pdf_path,book_id,out_dir):
    pdf=fitz.open(pdf_path)
    entries=[];map_files={}
    for i,answer in enumerate(ANSWERS[book_id]):
        page_num=(6+2*i) if book_id=='l1' else (5+2*i)
        p=pdf[page_num];instructions=pdf[page_num+1]
        image,rect=get_map(p)
        xref=image[0]
        if xref not in map_files:
            media=pdf.extract_image(xref)
            source=Image.open(BytesIO(media['image'])).convert('RGB')
            file=f'{book_id}-clean-map-{len(map_files)+1}.webp'
            source.save(out_dir/file,quality=90,method=6,format='WEBP')
            with Image.open(out_dir/file) as saved:
                saved.load()
                if saved.size != source.size:
                    raise ValueError('Invalid extracted map image: ' + file)
            map_files[xref]=file
        spans=[s for block in p.get_text('dict')['blocks'] for line in block.get('lines',[]) for s in line['spans']
               if len(s['text'].strip())==1 and s['text'].strip().isalpha() and 18<s['size']<19.5 and
               rect.x0<=((s['bbox'][0]+s['bbox'][2])/2)<=rect.x1 and rect.y0<=((s['bbox'][1]+s['bbox'][3])/2)<=rect.y1]
        if Counter(''.join(s['text'].strip() for s in spans)) != Counter(answer):
            raise ValueError(f'Letter multiset incorrect for {book_id}-{i+1}')
        markers=[]
        for pos,s in enumerate(spans):
            box=s['bbox'];cx=(box[0]+box[2])/2;cy=(box[1]+box[3])/2
            markers.append({'id':f'{book_id}-{i+1:02d}-glyph-{pos+1:02d}',
              'letter':s['text'].strip(),'x':round((cx-rect.x0)*100/rect.width,3),
              'y':round((cy-rect.y0)*100/rect.height,3)})
        arrows=extract_arrows(p,rect,markers)
        record_clues=clues(instructions)
        if len(record_clues)!=len(answer) or [x['position'] for x in record_clues]!=list(range(1,len(answer)+1)):
            raise ValueError(f'Clue parsing failed for {book_id}-{i+1}: {len(record_clues)}/{len(answer)}')
        for x in record_clues:
            letter=answer[x['position']-1]
            candidates=[m['id'] for m in markers if m['letter']==letter]
            x.update({'answerLetter':letter,'candidateMarkerIds':candidates,
                      'markerId':candidates[0] if len(candidates)==1 else None})
        facts_page=instructions.get_text('text',clip=fitz.Rect(65,390,733,570),sort=True).replace('\u2028','\n').replace('\u2029','\n').strip()
        entries.append({
          'id':f'{book_id}-{i+1:02d}', 'source':'authored',
          'status':'staged_requires_semantic_mapping',
          'title':f'Original {book_id.upper()} Puzzle {i+1}',
          'answer':answer, 'map':f'./assets/import-staging/{map_files[xref]}',
          'mapAspect':f'{image[2]} / {image[3]}',
          'provenance':{'source':Path(pdf_path).name,'mapPdfPage':page_num+1,
                        'cluesPdfPage':page_num+2,'pdfMapRect':[round(v,2) for v in rect]},
          'markers':markers,'clues':record_clues,'factsExtract':facts_page,'arrowCount':arrows})
    return entries,map_files

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--l1',required=True);ap.add_argument('--l2',required=True);ap.add_argument('--out',required=True)
    args=ap.parse_args();out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
    combined=[];stats={}
    for level,path in [('l1',args.l1),('l2',args.l2)]:
        entries,maps=extract_book(path,level,out)
        combined+=entries
        stats[level]={'puzzles':len(entries),'markers':sum(len(e['markers']) for e in entries),
             'clues':sum(len(e['clues']) for e in entries),
             'unresolved':sum(x['markerId'] is None for e in entries for x in e['clues']),
             'uniqueMaps':len(maps)}
    (out/'import-staging.json').write_text(json.dumps({'schemaVersion':1,'status':'not_for_live_use',
      'warning':'Ambiguous repeated-letter clues require human geographic matching; factsExtract requires editorial review.',
      'books':combined,'summary':stats},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(stats,indent=2))
if __name__=='__main__':main()
