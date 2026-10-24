// Makes the small WebP copies the game and the offline cache use from the delivered PNG originals.
// Run after each graphics batch: node scripts/make-game-images.mjs
// For every ready square asset in data/graphics-manifest.json it writes <dir>/game/<name>.webp
// (GAME_SIZE×GAME_SIZE for square art, SCENE_WIDTH wide for scenes and intro cards) and records gamePath / gameBytes / gameSourceSha256 in the manifest.
// A copy is rebuilt only when its PNG changed. The PNG originals stay untouched in the repository.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const MANIFEST='data/graphics-manifest.json';
const GAME_SIZE=384;
const QUALITY=85;
const SCENE_WIDTH=1200;

try{execFileSync('ffmpeg',['-version'],{stdio:'ignore'})}
catch{console.error('ffmpeg is required: install it (apt install ffmpeg / brew install ffmpeg) and run again.');process.exit(1)}

const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
let made=0,kept=0,skipped=0;
for(const a of manifest.assets){
  if(a.status!=='ready')continue;
  // Square art becomes GAME_SIZE square; wide scenes and cards keep their shape at SCENE_WIDTH.
  // Reference sheets are for review only.
  if(/-sheet\.png$/.test(a.file)){skipped++;continue}
  const out=path.join(path.dirname(a.path),'game',path.basename(a.path).replace(/\.png$/i,'.webp')).replaceAll(path.sep,'/');
  const square=a.width===a.height;
  const size=square?Math.min(GAME_SIZE,a.width):Math.min(SCENE_WIDTH,a.width);
  if(a.gamePath===out&&a.gameSourceSha256===a.sha256&&a.gameSize===size&&fs.existsSync(out)){kept++;continue}
  fs.mkdirSync(path.dirname(out),{recursive:true});
  execFileSync('ffmpeg',['-loglevel','error','-y','-i',a.path,'-vf',square?`scale=${size}:${size}:flags=lanczos`:`scale=${size}:-2:flags=lanczos`,
    '-c:v','libwebp','-q:v',String(QUALITY),'-compression_level','6',out]);
  Object.assign(a,{gamePath:out,gameSize:size,gameBytes:fs.statSync(out).size,gameSourceSha256:a.sha256});
  made++;
}
fs.writeFileSync(MANIFEST,JSON.stringify(manifest,null,2)+'\n');
const total=manifest.assets.filter(a=>a.gamePath).reduce((s,a)=>s+a.gameBytes,0);
console.log(`Game images: ${made} made, ${kept} up to date, ${skipped} skipped (reference sheets). All game copies: ${Math.round(total/1024)} KB.`);
