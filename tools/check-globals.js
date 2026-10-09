// All game scripts share one global scope, so two top-level functions with the same name silently replace
// each other (and duplicate const/let names stop the page loading). Run: node tools/check-globals.js
const fs=require('fs'),path=require('path'),root=path.join(__dirname,'..');
const files=[...fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="([^"?]+)/g)].map(m=>m[1]);
const seen={};
for(const f of files)for(const line of fs.readFileSync(path.join(root,f),'utf8').split('\n')){
 let m=line.match(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/);if(m){(seen[m[1]]=seen[m[1]]||[]).push(f);continue}
 m=line.match(/^(?:const|let|var)\s+(.*)/);if(!m)continue;let depth=0,cur='';const names=[];
 for(const ch of m[1]){if('([{'.includes(ch))depth++;else if(')]}'.includes(ch))depth--;if(depth===0&&(ch===','||ch===';')){names.push(cur);cur='';if(ch===';')break}else cur+=ch}names.push(cur);
 for(const n of names){const k=n.split('=')[0].trim();if(/^[A-Za-z_$][\w$]*$/.test(k))(seen[k]=seen[k]||[]).push(f)}}
const dup=Object.entries(seen).filter(([,v])=>v.length>1);
for(const [k,v] of dup)console.log(`duplicate global "${k}" in ${v.join(', ')}`);
console.log(dup.length?`${dup.length} duplicate(s)`:`OK: ${Object.keys(seen).length} globals across ${files.length} scripts, no duplicates`);process.exit(dup.length?1:0);
