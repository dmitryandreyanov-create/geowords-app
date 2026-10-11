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

def clues(page):
    columns=[]
    for xlower,xupper in [(0,400),(400,800)]:
        blocks=[(b[1],b[4]) for b in page.get_text('blocks') if b[6]==0 and 85<=b[1]<402 and xlower<=b[0]<xupper]
        txt=' '.join(t.replace('\n',' ') for _,t in sorted(blocks))
        columns.append(txt)
    records=[]
    for c in columns:
        matches=list(PAT.finditer(c))
        for j,m in enumerate(matches):
            ordstr=m.group(1).lower()
            index=ORD.get(ordstr) or int(re.match(r'\d+',ordstr).group())
            end=matches[j+1].start() if j+1<len(matches) else len(c)
            part=re.sub(r'\s+',' ',c[m.start():end]).strip()
            # trim visible fact header if the layout boundary includes it
            part=re.split(r'For the next quiz|Helpful Tips',part,flags=re.I)[0].strip()
            records.append({'position':index,'text':part})
    return sorted(records,key=lambda x:x['position'])

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
        record_clues=clues(instructions)
        if len(record_clues)!=len(answer) or [x['position'] for x in record_clues]!=list(range(1,len(answer)+1)):
            raise ValueError(f'Clue parsing failed for {book_id}-{i+1}: {len(record_clues)}/{len(answer)}')
        for x in record_clues:
            letter=answer[x['position']-1]
            candidates=[m['id'] for m in markers if m['letter']==letter]
            x.update({'answerLetter':letter,'candidateMarkerIds':candidates,
                      'markerId':candidates[0] if len(candidates)==1 else None})
        facts_page=instructions.get_text('text',clip=fitz.Rect(65,390,733,570),sort=True).strip()
        entries.append({
          'id':f'{book_id}-{i+1:02d}', 'source':'authored',
          'status':'staged_requires_semantic_mapping',
          'title':f'Original {book_id.upper()} Puzzle {i+1}',
          'answer':answer, 'map':f'./assets/import-staging/{map_files[xref]}',
          'mapAspect':f'{image[2]} / {image[3]}',
          'provenance':{'source':Path(pdf_path).name,'mapPdfPage':page_num+1,
                        'cluesPdfPage':page_num+2,'pdfMapRect':[round(v,2) for v in rect]},
          'markers':markers,'clues':record_clues,'factsExtract':facts_page})
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
