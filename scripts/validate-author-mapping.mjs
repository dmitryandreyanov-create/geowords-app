import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const l1='data/import-staging/l1-staging.json',l2='data/import-staging/l2-staging.json';
const template='data/import-staging/review-assignments.json';
const out='/tmp/geowords-import-mapped-test.json';
function apply(extra=[]){return spawnSync('python3',['tools/apply_author_mapping.py','--staging',l1,l2,
    '--review',template,'--out',out,...extra],{encoding:'utf8'});}
const p=apply();assert.equal(p.status,0,p.stderr);
const data=JSON.parse(fs.readFileSync(out,'utf8'));
assert.equal(data.books.length,20);assert.equal(data.unassigned,69);
assert.equal(apply(['--require-complete']).status!==0,true);
// The combined format must also be accepted without needing a fresh PDF import.
console.log('PASS: Separate staged JSONs feed author mapping; incomplete choices fail closed.');
