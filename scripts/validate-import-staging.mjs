import fs from 'node:fs';
import assert from 'node:assert/strict';
const all=[],maps=new Set(),counts={l1:0,l2:0};
const headers=/Good to know|Interesting fact|For the next quiz|Remember:|Helpful Tips/i;
for(const book of ['l1','l2']){
  const d=JSON.parse(fs.readFileSync(`data/import-staging/${book}-staging.json`,'utf8'));
  assert.equal(d.status,'not_for_live_use');assert.equal(d.puzzles.length,10);
  for(const p of d.puzzles){
    assert(p.id.startsWith(book+'-'));
    const file=p.map.replace(/^\.\//,'');assert(fs.existsSync(file),'Missing map '+file);
    maps.add(file);
    assert.equal(p.markers.length,p.answer.length);
    assert.equal(p.clues.length,p.answer.length);
    assert.deepEqual(p.clues.map(c=>c.position),Array.from({length:p.answer.length},(_,i)=>i+1));
    assert.equal(p.markers.map(m=>m.letter).sort().join(''),p.answer.split('').sort().join(''));
    const byId=new Map(p.markers.map(m=>[m.id,m]));
    const arrowCount=p.markers.filter(m=>!!m.pointsTo).length;
    assert.equal(p.arrowCount,arrowCount,`Arrow count mismatch in ${p.id}`);
    counts[book]+=arrowCount;
    for(const m of p.markers){
      for(const pos of [m,...(m.pointsTo?[m.pointsTo,m.pointsTo.from]:[])]){
        assert(Number.isFinite(pos.x)&&Number.isFinite(pos.y)&&pos.x>=0&&pos.x<=100&&pos.y>=0&&pos.y<=100,`Bad geometry in ${p.id}`);
      }
    }
    for(let i=0;i<p.clues.length;i++){
      const c=p.clues[i];assert.equal(c.answerLetter,p.answer[i]);
      assert(c.text.startsWith('The '),`Bad first word ${p.id}#${i+1}`);
      assert(c.text.endsWith('.'),`Clipped clue ${p.id}#${i+1}: ${c.text}`);
      assert(!headers.test(c.text),`Fact contamination in ${p.id}#${i+1}`);
      assert(c.candidateMarkerIds.length>0);
      for(const id of c.candidateMarkerIds)assert.equal(byId.get(id)?.letter,c.answerLetter);
      assert.equal(c.markerId,c.candidateMarkerIds.length===1?c.candidateMarkerIds[0]:null,
        `Ambiguous source must remain unresolved: ${p.id}#${i+1}`);
    }
    assert(p.provenance.mapPdfPage>0&&p.provenance.cluesPdfPage>0);
    all.push(p);
  }
}
assert.equal(all.length,20);
assert.equal(all.reduce((n,p)=>n+p.markers.length,0),187);
assert.equal(all.reduce((n,p)=>n+p.clues.filter(c=>c.markerId===null).length,0),69);
assert.equal(maps.size,10);assert.deepEqual(counts,{l1:5,l2:50});
for(const [id,pos,text] of [
 ['l1-10',3,'longest river.'],['l1-07',5,'no permanent residents.'],
 ['l2-06',5,'important rivers in India.'],['l2-07',1,'Mediterranean Sea.'],
 ['l2-08',5,'Danube River.'],['l2-09',1,'Mississippi River.']
]){
  const p=all.find(x=>x.id===id);
  assert(p.clues[pos-1].text.endsWith(text),`Regression in ${id}#${pos}`);
}
console.log(`PASS: 20 staged puzzles, 187 glyphs/clues, 69 unresolved, 10 maps, 55 PDF arrows, no clipped or contaminated clues.`);
