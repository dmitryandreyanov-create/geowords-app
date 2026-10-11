import fs from 'node:fs';
import assert from 'node:assert/strict';
const root='data/import-staging';
const all=[];
const cleanMaps=new Set();
for(const book of ['l1','l2']){
  const file=`${root}/${book}-staging.json`;
  const d=JSON.parse(fs.readFileSync(file,'utf8'));
  assert.equal(d.status,'not_for_live_use');
  assert.equal(d.puzzles.length,10);
  for(const p of d.puzzles){
    assert(p.id.startsWith(book+'-'));
    const mapPath=p.map.replace(/^\.\//,'');
    assert(fs.existsSync(mapPath),'missing original clean map: '+mapPath);
    cleanMaps.add(mapPath);
    assert.equal(p.markers.length,p.answer.length);
    assert.equal(p.clues.length,p.answer.length);
    assert.deepEqual(p.clues.map(c=>c.position),Array.from({length:p.answer.length},(_,i)=>i+1));
    assert.equal(p.markers.map(m=>m.letter).sort().join(''),p.answer.split('').sort().join(''));
    const markers=new Map(p.markers.map(m=>[m.id,m]));
    for(const [i,c] of p.clues.entries()){
      assert.equal(c.answerLetter,p.answer[i]);
      assert(c.text.toLowerCase().includes('letter'));
      assert(c.candidateMarkerIds.length>0);
      for(const id of c.candidateMarkerIds)assert.equal(markers.get(id)?.letter,c.answerLetter);
      if(c.candidateMarkerIds.length>1)assert.equal(c.markerId,null,'do not guess ambiguous repeated letters');
      else assert.equal(c.markerId,c.candidateMarkerIds[0]);
    }
    assert(p.provenance.mapPdfPage>0&&p.provenance.cluesPdfPage>0);
    all.push(p);
  }
}
const unresolved=all.reduce((n,p)=>n+p.clues.filter(c=>c.markerId===null).length,0);
assert.equal(all.length,20);
assert.equal(all.reduce((n,p)=>n+p.markers.length,0),187);
assert.equal(unresolved,69);
assert.equal(cleanMaps.size,10,'ten unique author maps imported');
console.log(`PASS: ${all.length} staged author puzzles, 187 exact letters/clues, ${unresolved} repeated-letter candidates require editorial matching.`);
