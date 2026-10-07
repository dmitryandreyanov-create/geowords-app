import fs from "node:fs";
import vm from "node:vm";

const source=fs.readFileSync("data/levels.js","utf8");
const sandbox={window:{}};
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:"data/levels.js"});

const levels=sandbox.window.GEOWORD_LEVELS;
const errors=[];
const seenLevelIds=new Set();

if(!Array.isArray(levels)||levels.length===0){
  errors.push("window.GEOWORD_LEVELS must be a non-empty array");
}else{
  levels.forEach((level,index)=>{
    const label=level?.id||`level #${index+1}`;

    if(!level?.id)errors.push(`${label}: missing id`);
    else if(seenLevelIds.has(level.id))errors.push(`${label}: duplicate level id`);
    else seenLevelIds.add(level.id);

    if(typeof level?.answer!=="string"||!level.answer.length){
      errors.push(`${label}: missing answer`);
    }

    if(typeof level?.map!=="string"||!level.map.length){
      errors.push(`${label}: missing map path`);
    }else{
      const mapPath=level.map.replace(/^\.\//,"");
      if(!fs.existsSync(mapPath))errors.push(`${label}: missing map file ${mapPath}`);
    }

    const markers=Array.isArray(level?.markers)?level.markers:[];
    const clues=Array.isArray(level?.clues)?level.clues:[];
    const markerById=new Map();

    markers.forEach(marker=>{
      if(!marker?.id){
        errors.push(`${label}: marker missing id`);
        return;
      }
      if(markerById.has(marker.id))errors.push(`${label}: duplicate marker id ${marker.id}`);
      markerById.set(marker.id,marker);

      for(const axis of ["x","y"]){
        const value=marker[axis];
        if(!Number.isFinite(value)||value<0||value>100){
          errors.push(`${label}: marker ${marker.id} has invalid ${axis}=${value}`);
        }
      }

      if(typeof marker.letter!=="string"||marker.letter.length!==1){
        errors.push(`${label}: marker ${marker.id} must have one letter`);
      }
    });

    if(level?.answer&&clues.length!==level.answer.length){
      errors.push(`${label}: ${clues.length} clues for ${level.answer.length}-letter answer`);
    }

    const built=clues.map((clue,clueIndex)=>{
      if(!clue?.markerId){
        errors.push(`${label}: clue #${clueIndex+1} missing markerId`);
        return "?";
      }
      const marker=markerById.get(clue.markerId);
      if(!marker){
        errors.push(`${label}: clue #${clueIndex+1} references missing marker ${clue.markerId}`);
        return "?";
      }
      if(typeof clue.text!=="string"||!clue.text.trim()){
        errors.push(`${label}: clue #${clueIndex+1} missing text`);
      }
      return marker.letter;
    }).join("");

    if(level?.answer&&built!==level.answer){
      errors.push(`${label}: clue sequence builds ${built}, expected ${level.answer}`);
    }
  });
}

if(errors.length){
  console.error("GeoWords validation failed:");
  errors.forEach(error=>console.error(" - "+error));
  process.exit(1);
}

console.log(`GeoWords validation passed: ${levels.length} levels, all maps and clue sequences valid.`);
