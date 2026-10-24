// Normalize one generated original without changing the original file.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const [file,source,w,h,opaque]=process.argv.slice(2),width=Number(w),height=Number(h);
const manifestPath='data/graphics-manifest.json',manifest=JSON.parse(fs.readFileSync(manifestPath));
const asset=manifest.assets.find(a=>a.file===file);assert(asset,'Unknown planned asset');
assert(asset.status!=='ready','Already delivered; use explicit replacement workflow');
fs.mkdirSync(path.dirname(asset.path),{recursive:true});
const temporary=asset.path+'.import.png';
for(let attempt=0;attempt<2;attempt++){
 execFileSync('convert',[source,'-resize',`${width}x${height}${opaque==='true'?'^':''}`,'-gravity','center','-background',opaque==='true'?'#f4eddd':'none','-extent',`${width}x${height}`,'-strip','-define','png:compression-level=9','PNG32:'+temporary]);
 const png=fs.readFileSync(temporary);
 if(png.subarray(-8,-4).toString()==='IEND')break;
 assert(attempt===0,'Incomplete generated PNG');
}
const png=fs.readFileSync(temporary);assert.equal(png[25],6);assert.equal(png.readUInt32BE(16),width);assert.equal(png.readUInt32BE(20),height);
fs.renameSync(temporary,asset.path);
Object.assign(asset,{status:'ready',width,height,sha256:crypto.createHash('sha256').update(png).digest('hex'),visualReview:'awaiting_phone_review',transparent:opaque!=='true'});
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
console.log(`Imported ${file}: ${width}x${height}`);
