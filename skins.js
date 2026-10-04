'use strict';
// Balloon skins sold in the store. Gores are the vertical panels (light, mid and dark tones);
// dots are decorations placed on the sphere, so they turn with the balloon.
const SKINS={
 classic:{name:'Classic',price:0,gores:[['#ff7a86','#ff3b52','#c41d3d'],['#ffe680','#ffc21a','#d98a00']]},
 gumball:{name:'Gumball',price:150,gores:[['#ffc6e6','#ff7ac0','#d94a98']],dots:'sprinkles',gloss:true},
 clown:{name:'Funny Clown',price:200,gores:[['#ff8a8a','#ff4d5e','#c41d3d'],['#ffffff','#eceaf6','#b9b6cf'],['#8fd8ff','#3d9bff','#1f5fc4'],['#fff08a','#ffd23f','#d99400']],face:'goofy',extras:['hair','nose']},
 toy:{name:'Toy Robot',price:250,gores:[['#9cd8ff','#3d8bff','#2350b8'],['#d4dbe8','#9aa6bd','#6b7690']],face:'robot',dots:'rivets',extras:['antenna']},
 melon:{name:'Watermelon',price:300,gores:[['#8be38f','#3fbf55','#23863a'],['#c5f7a8','#8fdc6e','#55a83e']],dots:'seeds'},
 monster:{name:'Monster',price:400,gores:[['#c4ff8a','#7ad83f','#3f8f1d']],face:'monster',dots:'spots',extras:['horns']},
 ninja:{name:'Ninja',price:500,gores:[['#5a5a78','#34344c','#1a1a2c']],face:'ninja',extras:['headband']},
 galaxy:{name:'Galaxy',price:700,gores:[['#8a6cff','#5232c4','#24125e'],['#4d7bff','#2846b8','#101d5c']],dots:'stars'},
 gold:{name:'Golden King',price:1000,gores:[['#fff6b8','#ffd23f','#c98a00']],dots:'sparkle',extras:['crown'],gloss:true}};
const SKIN_ORDER=Object.keys(SKINS);
const DOTS=Array.from({length:28},(_,i)=>({lat:(hash(i*3.1)-.5)*2.3,lon:hash(i*7.7)*TAU,s:.7+hash(i*1.3)*.6,ang:hash(i*5.3)*TAU,c:i}));
const DOT_COLORS={sprinkles:['#ffffff','#4fd3ff','#ffe066','#7cf08a','#b48cff'],seeds:['#1b1240'],spots:['#4fa82a','#8fe04f'],stars:['#ffffff','#ffe680'],rivets:['#eef3fb'],sparkle:['#ffffff']};
// Decorations inside the balloon clip, in balloon coordinates (centre 0,-5; radius about 29).
function skinDots(skin,turn){if(!skin.dots)return;const colors=DOT_COLORS[skin.dots];
 for(const d of DOTS){const lon=d.lon+turn,c=Math.cos(lon);if(c<.08)continue;const s=shape(d.lat),px=s.r*Math.sin(lon),py=s.y,k=d.s;ctx.save();ctx.translate(px,py);ctx.scale(Math.max(.2,c),1);ctx.fillStyle=colors[d.c%colors.length];
  if(skin.dots==='sprinkles'){ctx.rotate(d.ang);ctx.beginPath();ctx.roundRect(-3.5*k,-1.3*k,7*k,2.6*k,1.3*k);ctx.fill()}
  else if(skin.dots==='seeds'){ctx.rotate(d.ang*.3);ctx.beginPath();ctx.ellipse(0,0,1.6*k,2.8*k,0,0,TAU);ctx.fill()}
  else if(skin.dots==='spots'){ctx.beginPath();ctx.arc(0,0,3.6*k,0,TAU);ctx.fill()}
  else if(skin.dots==='rivets'){if(d.c%2){ctx.beginPath();ctx.arc(0,0,1.9,0,TAU);ctx.fill();ctx.strokeStyle='rgba(27,18,64,.6)';ctx.lineWidth=1;ctx.stroke()}}
  else{const tw=skin.dots==='sparkle'?.5+.5*Math.sin(t*4+d.c):1;star(0,0,3.6*k*tw,1.3*k*tw,4);ctx.fill()}
  ctx.restore()}
 if(skin.extras&&skin.extras.includes('headband')){ctx.fillStyle='#ff3b52';ctx.fillRect(-40,-27,80,8);ctx.fillStyle='rgba(255,255,255,.3)';ctx.fillRect(-40,-27,80,2)}}
// Accessories drawn on top of the outline.
function skinExtras(skin){if(!skin.extras)return;ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.lineJoin='round';ctx.lineCap='round';
 for(const e of skin.extras){
  if(e==='nose'){ctx.fillStyle='#ff3b3b';ctx.beginPath();ctx.arc(0,-1,4.8,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle='rgba(255,255,255,.8)';ctx.beginPath();ctx.arc(-1.5,-2.5,1.4,0,TAU);ctx.fill()}
  if(e==='hair')for(const s of [-1,1])['#ff4d5e','#ffd23f','#44d9ff'].forEach((c,i)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(s*(25+i*3),-24+i*7,6.5,0,TAU);ctx.fill();ctx.stroke()});
  if(e==='antenna'){ctx.beginPath();ctx.moveTo(0,-37);ctx.lineTo(0,-50);ctx.stroke();ctx.fillStyle=Math.sin(t*6)>0?'#ff3b4f':'#ffd23f';ctx.beginPath();ctx.arc(0,-52,4,0,TAU);ctx.fill();ctx.stroke()}
  if(e==='horns')for(const s of [-1,1]){ctx.fillStyle='#fff3d6';ctx.beginPath();ctx.moveTo(s*9,-33);ctx.quadraticCurveTo(s*20,-44,s*15,-54);ctx.quadraticCurveTo(s*24,-44,s*18,-30);ctx.closePath();ctx.fill();ctx.stroke()}
  if(e==='headband')for(const k of [0,1]){ctx.fillStyle='#ff3b52';ctx.beginPath();ctx.moveTo(27,-23);ctx.quadraticCurveTo(38,-26+k*6+Math.sin(t*8+k)*3,46,-18+k*8+Math.sin(t*8+k)*4);ctx.lineTo(44,-14+k*8);ctx.quadraticCurveTo(36,-20+k*6,27,-19);ctx.closePath();ctx.fill();ctx.stroke()}
  if(e==='crown'){ctx.fillStyle='#ffd23f';ctx.beginPath();ctx.moveTo(-13,-34);ctx.lineTo(-15,-50);ctx.lineTo(-7,-42);ctx.lineTo(0,-54);ctx.lineTo(7,-42);ctx.lineTo(15,-50);ctx.lineTo(13,-34);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#ff4d5e';ctx.beginPath();ctx.arc(0,-40,2.6,0,TAU);ctx.fill();ctx.fillStyle='#44d9ff';ctx.beginPath();ctx.arc(-8,-38,2,0,TAU);ctx.arc(8,-38,2,0,TAU);ctx.fill()}}}
// Every skin has its own idle animation and particle effect in the store, plus its own flight trail.
// anim(s) returns an offset/rotation/scale; fx is drawn around the balloon (layer 'back' or 'front').
const SKIN_FX={
 classic:{anim:s=>({y:Math.sin(s*2)*4,rot:Math.sin(s*1.3)*.08}),fx:'hearts'},
 gumball:{anim:s=>{const b=Math.abs(Math.sin(s*3.2)),sq=(1-b)**4;return {y:4-b*13,sx:1+sq*.2,sy:1-sq*.18}},fx:'bubbles',trail:{type:'bubble',colors:['#ffc6e6','#ffffff','#ff9ad5']}},
 clown:{anim:s=>({y:-Math.abs(Math.sin(s*4))*7,rot:Math.sin(s*4)*.24}),fx:'confetti',trail:{type:'confetti',colors:['#ff4d5e','#ffd23f','#44d9ff','#4fd36b','#ffffff']}},
 toy:{anim:s=>{const step=Math.floor(s*3)/3;return {x:Math.round(Math.sin(step*2.2)*2)*4,rot:Math.round(Math.sin(step*1.7)*2)*.07,y:(s*3%1)<.15?-3:0}},fx:'sparks',trail:{type:'spark',colors:['#ffd23f','#5ff0ff','#ffffff']}},
 melon:{anim:s=>({y:Math.sin(s*2.5)*4,rot:Math.sin(s*5)*.1,turn:3.5}),fx:'juice',trail:{type:'seed',colors:['#1b1240','#ff5a7a']}},
 monster:{anim:s=>{const g=Math.max(0,Math.sin(s*1.7))**8;return {x:Math.sin(s*60)*2.6*g,y:Math.sin(s*2)*2,sx:1+g*.14,sy:1+g*.12}},fx:'slime',trail:{type:'slime',colors:['#7ad83f','#b6ff7a']}},
 ninja:{anim:s=>{const p=s%2.4,d=p<.2?-1+p/.2*2:p<1.2?1:p<1.4?1-(p-1.2)/.2*2:-1;return {x:d*13,rot:(p<.2?.25:p>=1.2&&p<1.4?-.25:0),y:Math.sin(s*3)*2}},fx:'smoke',afterimage:true,trail:{type:'puff',colors:['#4a4a63','#2c2c40','#6b6b88']}},
 galaxy:{anim:s=>({y:Math.sin(s*1.6)*6,rot:Math.sin(s)*.06}),fx:'orbit',trail:{type:'star',colors:['#ffffff','#c9a8ff','#9fe8ff']}},
 gold:{anim:s=>{const p=1+Math.sin(s*4)*.025;return {y:Math.sin(s*2)*4,rot:Math.sin(s*1.2)*.05,sx:p,sy:p}},fx:'glitter',trail:{type:'star',colors:['#ffd23f','#fff6b0','#ffffff']}}};
function skinFx(kind,s,layer){ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
 if(kind==='hearts'&&layer==='front')for(let i=0;i<3;i++){const ph=(s*.35+i/3)%1;ctx.globalAlpha=Math.sin(ph*Math.PI);ctx.fillStyle='#ff6b81';ctx.strokeStyle=INK;ctx.lineWidth=1.5;ctx.save();ctx.translate(Math.sin(ph*7+i*2)*8+(i-1)*24,30-ph*80);ctx.scale(.5,.5);ctx.beginPath();ctx.moveTo(0,4);ctx.bezierCurveTo(-11,-4,-4.5,-10.5,0,-4.5);ctx.bezierCurveTo(4.5,-10.5,11,-4,0,4);ctx.fill();ctx.stroke();ctx.restore()}
 if(kind==='bubbles'&&layer==='back')for(let i=0;i<7;i++){const ph=(s*.45+i/7)%1,x=(hash(i*3.3)-.5)*70,y=36-ph*96,r=2.5+hash(i*2.1)*4;if(ph>.92){ctx.strokeStyle='#ff9ad5';ctx.lineWidth=1.5;for(let k=0;k<6;k++){const a=k*TAU/6;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r);ctx.lineTo(x+Math.cos(a)*r*2,y+Math.sin(a)*r*2);ctx.stroke()}continue}ctx.fillStyle='rgba(255,220,240,.35)';ctx.strokeStyle='#ff7ac0';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x-r*.35,y-r*.35,r*.3,0,TAU);ctx.fill()}
 if(kind==='confetti'&&layer==='front')for(let i=0;i<14;i++){const ph=(s*.4+i/14)%1;ctx.save();ctx.translate((hash(i*3)-.5)*80+Math.sin(ph*6+i)*6,-58+ph*110);ctx.rotate(ph*9+i);ctx.scale(Math.cos(ph*14+i),1);ctx.fillStyle=['#ff4d5e','#ffd23f','#44d9ff','#4fd36b','#a273ff'][i%5];ctx.fillRect(-3,-1.5,6,3);ctx.restore()}
 if(kind==='sparks'&&layer==='front'){const ph=(s*1.5)%1;if(ph<.35){ctx.strokeStyle='#5ff0ff';ctx.lineWidth=2;for(let k=0;k<3;k++){const a=-Math.PI/2+(k-1)*.8+Math.sin(s*20+k);ctx.beginPath();let px=0,py=-52;ctx.moveTo(px,py);for(let j=1;j<=4;j++){px+=Math.cos(a)*5+(j%2?3:-3);py+=Math.sin(a)*5;ctx.lineTo(px,py)}ctx.stroke()}}for(let i=0;i<4;i++){const q=(s*1.1+i/4)%1;ctx.globalAlpha=1-q;ctx.fillStyle='#ffd23f';star((hash(i*5)-.5)*60,20-q*30,3*(1-q)+1,1,4);ctx.fill()}}
 if(kind==='juice'&&layer==='front')for(let i=0;i<8;i++){const ph=(s*.9+i/8)%1,a=i*TAU/8+s*.5,r=26+ph*26;ctx.globalAlpha=1-ph;ctx.fillStyle=i%2?'#ff5a7a':'#7fe08a';ctx.beginPath();ctx.ellipse(Math.cos(a)*r,-5+Math.sin(a)*r,2.4,3.4,a+Math.PI/2,0,TAU);ctx.fill()}
 if(kind==='slime'&&layer==='front')for(let i=0;i<3;i++){const ph=(s*.55+i/3)%1,x=(i-1)*11;ctx.fillStyle='#7ad83f';ctx.strokeStyle=INK;ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(x,24+ph*24,2.6+ph*1.5,3.5+ph*4,0,0,TAU);ctx.globalAlpha=1-ph*ph;ctx.fill();ctx.stroke()}
 if(kind==='smoke'){const p=s%2.4;for(const [at,side] of [[0,-1],[.2,1],[1.2,1],[1.4,-1]]){const age=p-at;if(age<0||age>.7)continue;ctx.globalAlpha=(1-age/.7)*.7;ctx.fillStyle='#8a8aa6';for(let k=0;k<4;k++){ctx.beginPath();ctx.arc(side*13+(k-1.5)*9,-5+Math.sin(k*2)*10,6+age*16,0,TAU);ctx.fill()}}}
 if(kind==='orbit')for(let i=0;i<4;i++){const a=s*1.4+i*TAU/4,front=Math.sin(a)>0;if(front!==(layer==='front'))continue;ctx.fillStyle=i%2?'#ffffff':'#ffe680';ctx.strokeStyle=INK;ctx.lineWidth=1.2;star(Math.cos(a)*40,-5+Math.sin(a)*12,front?5:3.5,front?2:1.4,4);ctx.fill();ctx.stroke()}
 if(kind==='glitter'){if(layer==='back')glow(0,-5,55,'#ffd23f',.4+.15*Math.sin(s*3));else for(let i=0;i<8;i++){const tw=Math.max(0,Math.sin(s*3+i*1.9));if(tw<.1)continue;ctx.globalAlpha=tw;ctx.fillStyle='#fff';star((hash(i*7.1)-.5)*84,(hash(i*3.7)-.5)*84-5,5*tw,1.4,4);ctx.fill()}}
 ctx.restore()}
// A gleam that sweeps across the golden balloon.
function goldSweep(s){const p=(s*.6)%1.6-.3;ctx.save();ctx.clip(BALLOON);ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.moveTo(-40+p*90,-45);ctx.lineTo(-28+p*90,-45);ctx.lineTo(-48+p*90,30);ctx.lineTo(-60+p*90,30);ctx.closePath();ctx.fill();ctx.restore()}
// Celebration burst when a skin is picked in the store.
function chosenFx(k){ctx.save();ctx.globalAlpha=k;ctx.strokeStyle='#ffd23f';ctx.lineWidth=5*k;ctx.beginPath();ctx.arc(0,-5,30+(1-k)*30,0,TAU);ctx.stroke();for(let i=0;i<10;i++){const a=i*TAU/10,r=30+(1-k)*36;ctx.fillStyle=i%2?'#fff':'#ffd23f';star(Math.cos(a)*r,-5+Math.sin(a)*r,6*k+1,2,4);ctx.fill()}ctx.restore()}
