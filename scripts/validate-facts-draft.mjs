import fs from 'node:fs';
import assert from 'node:assert/strict';
const draft=JSON.parse(fs.readFileSync('data/import-staging/facts-draft.json'));
const curriculum=JSON.parse(fs.readFileSync('data/import-staging/curriculum-draft.json'));
const review=JSON.parse(fs.readFileSync('data/import-staging/review-status.json'));
assert.equal(draft.status,'not_for_live_use');assert.equal(draft.schemaVersion,1);
assert.equal(draft.sourceBlocks.length,41);assert.equal(draft.lessons.length,21);
assert.equal(draft.sources.length,2);
for(const source of draft.sources)assert.match(source.sha256,/^[a-f0-9]{64}$/);
const blocks=new Map(draft.sourceBlocks.map(b=>[b.id,b]));assert.equal(blocks.size,41);
const facts=new Map(curriculum.facts.map(f=>[f.id,f]));assert.equal(facts.size,41);
const factId=id=>'f-'+id.slice('source-'.length);
const lessons=new Map(draft.lessons.map(l=>[l.id,l]));assert.equal(lessons.size,21);
let caveats=0;
for(const b of blocks.values()){
 assert.equal(b.status,'editorial_pending');assert(['intro','bridge','context','caveat'].includes(b.category));
 assert(!/For the next quiz|The (first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth) letter|@letscrafthistory/.test(b.text.en),'source facts exclude clues/headings/footer');
 assert.equal(b.sourceLines.map(l=>l.text).join(' '),b.text.en,'complete source line order preserved');
 assert(b.sourceLines.length>0);const [x0,y0,x1,y1]=b.provenance.region;
 for(const line of b.sourceLines){const [a,c,z,d]=line.bbox;assert((a+z)/2>=x0&&(a+z)/2<=x1&&(c+d)/2>=y0&&(c+d)/2<=y1)}
 const f=facts.get(factId(b.id));assert.equal(f.status,'editorial_pending');assert.equal(f.sourceBlockId,b.id);assert.deepEqual(f.text,b.text);assert.deepEqual(f.provenance,b.provenance);assert.equal(f.introducesPlaces,null);
 for(const id of b.caveatBlockIds){assert.equal(blocks.get(id)?.category,'caveat');assert.equal(blocks.get(id).provenance.pdfPage,b.provenance.pdfPage)}
 if(b.category==='caveat'){caveats++;assert([...blocks.values()].some(other=>other.caveatBlockIds.includes(b.id)),'source qualifier attached to a bridge')}
}
assert.equal(caveats,5);
const referenced=[];
for(const l of lessons.values()){
 assert.equal(l.status,'editorial_pending');assert.equal(l.requiredBlockIds,null,'mandatory teaching not inferred');
 for(const id of l.sourceBlockIds){assert(blocks.has(id));referenced.push(id)}
}
assert.equal(new Set(referenced).size,41);assert.equal(referenced.length,41,'each block has one source lesson');
for(const c of curriculum.courses.slice(0,2))for(const s of c.steps){
 assert.equal(s.learnBefore,null);assert.equal(s.unlockAfter,null);assert.equal(s.introducedPlaces,null);assert.equal(s.status,'editorial_pending');
 for(const id of s.sourceLessonIds)assert.equal(lessons.get(id)?.candidateBinding.stepId,s.id);
 for(const id of [...s.candidateLearnBefore,...s.candidateUnlockAfter,...s.candidateOptionalAfter])assert(facts.has(id));
 const after=lessons.get(s.authoredPuzzleId+'-after');
 assert.deepEqual(s.candidateUnlockAfter,after.sourceBlockIds.filter(id=>['bridge','caveat'].includes(blocks.get(id).category)).map(factId));
}
assert.equal(lessons.get('l1-10-after').sourceBlockIds.length,0,'do not invent final L1 bridge facts');
assert(blocks.get('source-l1-p06-pacific-map').text.en.endsWith('one ocean.'));
assert(blocks.get('source-l1-p10-salinity-note').text.en.includes('average salinity'));
assert(blocks.get('source-l2-p07-nile-note').text.en.includes('Amazon River may be longer'));
assert(blocks.get('source-l2-p19-volga').text.en.endsWith('centuries'),'retain missing source punctuation without repairing authored text');
assert.equal(review.geographicReview.status,'testing_deferred');assert.equal(review.geographicReview.confirmedClues,0);assert.equal(review.publicationAllowed,false);
console.log('PASS: 41 pending source blocks, 21 proposed lessons, 5 attached caveats, source-line order, draft-only curriculum references and deferred geographic testing.');
