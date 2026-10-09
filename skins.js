'use strict';
// Balloon skins sold in the store. Gores are the vertical panels (light, mid and dark tones);
// dots are decorations placed on the sphere, so they turn with the balloon.
const SKINS={
 classic:{name:'Classic',price:0,rarity:'common',about:'Bobs along happily, blowing hearts.',gores:[['#ff7a86','#ff3b52','#c41d3d'],['#ffe680','#ffc21a','#d98a00']]},
 gumball:{name:'Gumball',price:150,rarity:'common',about:'Bouncy pink gum that blows bubbles.',gores:[['#ffc6e6','#ff7ac0','#d94a98']],dots:'sprinkles',gloss:true},
 clown:{name:'Funny Clown',price:200,rarity:'rare',about:'Wobbly, goofy and full of confetti.',gores:[['#ff8a8a','#ff4d5e','#c41d3d'],['#ffffff','#eceaf6','#b9b6cf'],['#8fd8ff','#3d9bff','#1f5fc4'],['#fff08a','#ffd23f','#d99400']],face:'goofy',extras:['hair','nose']},
 toy:{name:'Toy Robot',price:250,rarity:'rare',about:'Clanky robot moves, sparks and laser eyes.',gores:[['#9cd8ff','#3d8bff','#2350b8'],['#d4dbe8','#9aa6bd','#6b7690']],face:'robot',dots:'rivets',extras:['antenna']},
 melon:{name:'Watermelon',price:300,rarity:'rare',about:'Spins like a top and splashes juice.',gores:[['#8be38f','#3fbf55','#23863a'],['#c5f7a8','#8fdc6e','#55a83e']],dots:'seeds'},
 monster:{name:'Monster',price:400,rarity:'epic',about:'Growls, shakes and drips slime.',gores:[['#c4ff8a','#7ad83f','#3f8f1d']],face:'monster',dots:'spots',extras:['horns']},
 ninja:{name:'Ninja',price:500,rarity:'epic',about:'Dashes in a blink and leaves smoke.',gores:[['#5a5a78','#34344c','#1a1a2c']],face:'ninja',extras:['headband']},
 galaxy:{name:'Galaxy',price:700,rarity:'legendary',about:'A swirl of stars that bends space.',gores:[['#8a6cff','#5232c4','#24125e'],['#4d7bff','#2846b8','#101d5c']],dots:'stars'},
 gold:{name:'Golden King',price:1000,rarity:'legendary',about:'Royal shine, glitter and a crown.',gores:[['#fff6b8','#ffd23f','#c98a00']],dots:'sparkle',extras:['crown'],gloss:true},
 // Gem-only skins: gems come from the weekly tournament top 10.
 dragon:{name:'Fire Dragon',gems:30,rarity:'mythic',about:'Breathes fire and leaves glowing embers.',gores:[['#ff9a6a','#f0441c','#a3200c'],['#ffd36b','#ff9a1a','#c25a00']],dots:'scales',extras:['dragon']},
 unicorn:{name:'Rainbow Unicorn',gems:50,rarity:'mythic',about:'A magic horn, a rainbow mane and sparkles.',gores:[['#ffc2d4','#ff6f9a','#d23e70'],['#fff3a6','#ffd23f','#d99a00'],['#c4ffd8','#4fd38a','#22945a'],['#c2e8ff','#4fb0ff','#2367c4'],['#e8d4ff','#a273ff','#6a35ef']],dots:'sparkle',extras:['mane','horn'],gloss:true},
 diamond:{name:'Diamond',gems:80,rarity:'mythic',about:'Crystal facets that flash in the light.',gores:[['#ffffff','#c9f6ff','#79d6f5'],['#eefcff','#9fe6ff','#3aa8e0'],['#f6feff','#b6eeff','#5cc0ea']],dots:'sparkle',extras:['shine'],gloss:true},
 // Season-only skins: never sold, given for finishing a season in Diamond (Prism) or as a Star Legend (Starlight).
 prism:{name:'Prism',season:'diamond',rarity:'season',about:'Splits sunlight into rainbows. A Diamond season reward.',gores:[['#ffffff','#ffd6f5','#ff8ad8'],['#ffffff','#d6f5ff','#7ad8ff'],['#ffffff','#fff6c4','#ffd23f'],['#ffffff','#d8ffe0','#6fe08a']],dots:'sparkle',extras:['shine'],gloss:true},
 starlight:{name:'Starlight',season:'legend',rarity:'season',about:'Woven from starlight, crowned with a halo. Only for Star Legends.',gores:[['#d6b8ff','#8a4cff','#3a1580'],['#3a2a8a','#22145e','#0c0630']],dots:'stars',extras:['halo'],gloss:true}};
const SKIN_ORDER=Object.keys(SKINS);
const DOTS=Array.from({length:28},(_,i)=>({lat:(hash(i*3.1)-.5)*2.3,lon:hash(i*7.7)*TAU,s:.7+hash(i*1.3)*.6,ang:hash(i*5.3)*TAU,c:i}));
const DOT_COLORS={sprinkles:['#ffffff','#4fd3ff','#ffe066','#7cf08a','#b48cff'],seeds:['#1b1240'],spots:['#4fa82a','#8fe04f'],stars:['#ffffff','#ffe680'],rivets:['#eef3fb'],sparkle:['#ffffff'],scales:['#a3200c','#7a1606']};
// Decorations inside the balloon clip, in balloon coordinates (centre 0,-5; radius about 29).
function skinDots(skin,turn){if(!skin.dots)return;const colors=DOT_COLORS[skin.dots];
 for(const d of DOTS){const lon=d.lon+turn,c=Math.cos(lon);if(c<.08)continue;const s=shape(d.lat),px=s.r*Math.sin(lon),py=s.y,k=d.s;ctx.save();ctx.translate(px,py);ctx.scale(Math.max(.2,c),1);ctx.fillStyle=colors[d.c%colors.length];
  if(skin.dots==='sprinkles'){ctx.rotate(d.ang);ctx.beginPath();ctx.roundRect(-3.5*k,-1.3*k,7*k,2.6*k,1.3*k);ctx.fill()}
  else if(skin.dots==='seeds'){ctx.rotate(d.ang*.3);ctx.beginPath();ctx.ellipse(0,0,1.6*k,2.8*k,0,0,TAU);ctx.fill()}
  else if(skin.dots==='spots'){ctx.beginPath();ctx.arc(0,0,3.6*k,0,TAU);ctx.fill()}
  else if(skin.dots==='scales'){ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(0,-1.5*k,3.4*k,.15*Math.PI,.85*Math.PI);ctx.stroke()}
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
  if(e==='halo'){ctx.save();ctx.translate(0,-48);ctx.strokeStyle='#ffe680';ctx.lineWidth=3.5;ctx.beginPath();ctx.ellipse(0,0,20,6,0,0,TAU);ctx.stroke();ctx.strokeStyle=INK;ctx.lineWidth=1.2;for(let i=0;i<5;i++){const a=t*2+i*TAU/5;ctx.fillStyle=i%2?'#ffffff':'#ffe680';star(Math.cos(a)*20,Math.sin(a)*6,Math.sin(a)>0?5:3.5,1.8,4);ctx.fill();ctx.stroke()}ctx.restore();ctx.strokeStyle=INK;ctx.lineWidth=2.5}
  if(e==='horns')for(const s of [-1,1]){ctx.fillStyle='#fff3d6';ctx.beginPath();ctx.moveTo(s*9,-33);ctx.quadraticCurveTo(s*20,-44,s*15,-54);ctx.quadraticCurveTo(s*24,-44,s*18,-30);ctx.closePath();ctx.fill();ctx.stroke()}
  if(e==='headband')for(const k of [0,1]){ctx.fillStyle='#ff3b52';ctx.beginPath();ctx.moveTo(27,-23);ctx.quadraticCurveTo(38,-26+k*6+Math.sin(t*8+k)*3,46,-18+k*8+Math.sin(t*8+k)*4);ctx.lineTo(44,-14+k*8);ctx.quadraticCurveTo(36,-20+k*6,27,-19);ctx.closePath();ctx.fill();ctx.stroke()}
  if(e==='dragon'){const flap=Math.sin(t*7)*.35;for(const s of [-1,1]){ctx.save();ctx.translate(s*27,-10);ctx.rotate(s*(-.25+flap));ctx.fillStyle='#c42a10';ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(s*14,-22,s*30,-18);ctx.lineTo(s*24,-8);ctx.lineTo(s*28,0);ctx.lineTo(s*20,4);ctx.lineTo(s*22,12);ctx.quadraticCurveTo(s*8,10,0,6);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle='rgba(27,18,64,.5)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,2);ctx.lineTo(s*24,-8);ctx.moveTo(0,4);ctx.lineTo(s*20,4);ctx.stroke();ctx.restore();ctx.strokeStyle=INK;ctx.lineWidth=2.5}
   for(const s of [-1,1]){ctx.fillStyle='#ffe9b0';ctx.beginPath();ctx.moveTo(s*8,-33);ctx.quadraticCurveTo(s*14,-46,s*22,-50);ctx.quadraticCurveTo(s*18,-40,s*16,-30);ctx.closePath();ctx.fill();ctx.stroke()}
   ctx.fillStyle='#fff';ctx.lineWidth=1.5;for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(s*5,3);ctx.lineTo(s*3.5,8);ctx.lineTo(s*2,3.5);ctx.closePath();ctx.fill();ctx.stroke()}ctx.lineWidth=2.5}
  if(e==='horn'){ctx.fillStyle='#ffe680';ctx.beginPath();ctx.moveTo(-6,-34);ctx.lineTo(0,-62);ctx.lineTo(6,-34);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle='#d99a00';ctx.lineWidth=1.8;for(let i=0;i<4;i++){const y=-38-i*6;ctx.beginPath();ctx.moveTo(-5+i*1.2,y);ctx.lineTo(4-i*1.2,y-3);ctx.stroke()}ctx.strokeStyle=INK;ctx.lineWidth=2.5}
  if(e==='mane')['#ff6f9a','#ffd23f','#4fd38a','#4fb0ff','#a273ff'].forEach((c,i)=>{const a=-1.9+i*.32,r=31+Math.sin(t*5+i)*1.5;ctx.fillStyle=c;ctx.beginPath();ctx.arc(Math.cos(a)*r+4,Math.sin(a)*r-5,6.5,0,TAU);ctx.fill();ctx.stroke()});
  if(e==='shine'){const k=.5+.5*Math.sin(t*3);ctx.save();ctx.globalAlpha=.6+.4*k;ctx.fillStyle='#fff';ctx.strokeStyle='#79d6f5';ctx.lineWidth=1.5;star(-15,-26,7+k*3,1.8,4);ctx.fill();ctx.stroke();star(14,6,4+k*2,1.2,4);ctx.fill();ctx.restore();ctx.strokeStyle=INK;ctx.lineWidth=2.5}
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
 gold:{anim:s=>{const p=1+Math.sin(s*4)*.025;return {y:Math.sin(s*2)*4,rot:Math.sin(s*1.2)*.05,sx:p,sy:p}},fx:'glitter',trail:{type:'star',colors:['#ffd23f','#fff6b0','#ffffff']}},
 dragon:{anim:s=>{const b=Math.sin(s*7);return {y:Math.sin(s*2.2)*5-Math.max(0,b)*3,rot:Math.sin(s*1.4)*.07,sx:1+Math.sin(s*1.1)*.03,sy:1-Math.sin(s*1.1)*.03}},fx:'embers',trail:{type:'spark',colors:['#ff8a2a','#ffd23f','#ff4d2e']}},
 unicorn:{anim:s=>{const g=Math.abs(Math.sin(s*3.4));return {y:-g*9,rot:Math.sin(s*3.4)*.09}},fx:'rainbow',trail:{type:'star',colors:['#ff6f9a','#ffd23f','#4fd38a','#4fb0ff','#a273ff']}},
 diamond:{anim:s=>({y:Math.sin(s*1.8)*5,rot:Math.sin(s*.9)*.05,turn:1.7}),fx:'prism',trail:{type:'star',colors:['#ffffff','#9fe6ff','#c9f6ff']}},
 prism:{anim:s=>({y:Math.sin(s*1.7)*5,rot:Math.sin(s*.8)*.05,turn:2.2}),fx:'rainbowPrism'},
 starlight:{anim:s=>({y:Math.sin(s*1.4)*6,rot:Math.sin(s*.9)*.05,sx:1+Math.sin(s*3)*.02,sy:1+Math.sin(s*3)*.02}),fx:'starburst'}};
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
 if(kind==='embers'&&layer==='front')for(let i=0;i<9;i++){const ph=(s*.7+i/9)%1,ex=(hash(i*2.3)-.5)*60+Math.sin(ph*8+i)*6,ey=30-ph*100;ctx.globalAlpha=1-ph;ctx.fillStyle=i%3?'#ff8a2a':'#ffd23f';ctx.beginPath();ctx.arc(ex,ey,2.4*(1-ph)+1,0,TAU);ctx.fill()}
 if(kind==='rainbow'){if(layer==='back'){ctx.lineWidth=5;['#ff6f9a','#ffd23f','#4fd38a','#4fb0ff','#a273ff'].forEach((c,i)=>{ctx.strokeStyle=c;ctx.globalAlpha=.75;ctx.beginPath();ctx.arc(0,18,58-i*5,Math.PI*1.05+Math.sin(s)*.1,Math.PI*1.95+Math.sin(s)*.1);ctx.stroke()})}else for(let i=0;i<6;i++){const tw=Math.max(0,Math.sin(s*3.3+i*1.7));ctx.globalAlpha=tw;ctx.fillStyle=['#ff6f9a','#ffd23f','#4fd38a','#4fb0ff','#a273ff','#fff'][i];star((hash(i*4.7)-.5)*90,(hash(i*1.9)-.5)*80-8,5*tw+1,1.5,4);ctx.fill()}}
 if(kind==='prism'){if(layer==='back'){ctx.save();ctx.translate(0,-5);ctx.rotate(s*.5);for(let i=0;i<8;i++){ctx.rotate(TAU/8);ctx.globalAlpha=.18+.1*Math.sin(s*2+i);ctx.fillStyle=['#9fe6ff','#ffffff','#ffb0f0','#fff3a0'][i%4];ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(80,-7);ctx.lineTo(80,7);ctx.closePath();ctx.fill()}ctx.restore()}else for(let i=0;i<5;i++){const tw=Math.max(0,Math.sin(s*2.6+i*2.1));if(tw<.1)continue;ctx.globalAlpha=tw;ctx.fillStyle='#fff';star((hash(i*6.1)-.5)*76,(hash(i*2.9)-.5)*76-5,6*tw,1.3,4);ctx.fill()}}
 if(kind==='rainbowPrism'){if(layer==='back'){ctx.save();ctx.translate(0,-5);ctx.rotate(s*.45);for(let i=0;i<12;i++){ctx.rotate(TAU/12);ctx.globalAlpha=.2+.1*Math.sin(s*2+i);ctx.fillStyle=RAINBOW[i%6];ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(82,-6);ctx.lineTo(82,6);ctx.closePath();ctx.fill()}ctx.restore()}
  else for(let i=0;i<6;i++){const tw=Math.max(0,Math.sin(s*2.6+i*1.7));if(tw<.1)continue;ctx.globalAlpha=tw;ctx.fillStyle=RAINBOW[i];star((hash(i*5.3)-.5)*86,(hash(i*2.9)-.5)*86-5,5*tw,1.5,4);ctx.fill()}}
 if(kind==='starburst'){if(layer==='back'){glow(0,-5,62,'#c46aff',.4+.15*Math.sin(s*2.5));ctx.save();ctx.translate(0,-5);ctx.rotate(-s*.35);for(let i=0;i<10;i++){ctx.rotate(TAU/10);ctx.globalAlpha=.16+.08*Math.sin(s*3+i);ctx.fillStyle=i%2?'#ffe680':'#c49aff';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(86,-6);ctx.lineTo(86,6);ctx.closePath();ctx.fill()}ctx.restore()}
  else for(let i=0;i<9;i++){const ph=(s*.5+i/9)%1,a=i*2.1+s*.3,r=34+ph*30;ctx.globalAlpha=Math.sin(ph*Math.PI);ctx.fillStyle=i%3?'#ffe680':'#ffffff';star(Math.cos(a)*r,-5+Math.sin(a)*r,3+Math.sin(ph*Math.PI)*3,1.2,4);ctx.fill()}}
 ctx.restore()}
// A gleam that sweeps across the golden balloon.
function goldSweep(s){const p=(s*.6)%1.6-.3;ctx.save();ctx.clip(BALLOON);ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.moveTo(-40+p*90,-45);ctx.lineTo(-28+p*90,-45);ctx.lineTo(-48+p*90,30);ctx.lineTo(-60+p*90,30);ctx.closePath();ctx.fill();ctx.restore()}
// Celebration burst when a skin is picked in the store.
function chosenFx(k){ctx.save();ctx.globalAlpha=k;ctx.strokeStyle='#ffd23f';ctx.lineWidth=5*k;ctx.beginPath();ctx.arc(0,-5,30+(1-k)*30,0,TAU);ctx.stroke();for(let i=0;i<10;i++){const a=i*TAU/10,r=30+(1-k)*36;ctx.fillStyle=i%2?'#fff':'#ffd23f';star(Math.cos(a)*r,-5+Math.sin(a)*r,6*k+1,2,4);ctx.fill()}ctx.restore()}

// Store cards: each rarity has its own card colours.
const RARITY={common:{name:'COMMON',a:'#5fe3d6',b:'#1f8fa8'},rare:{name:'RARE',a:'#7cc0ff',b:'#2c5ee0'},epic:{name:'EPIC',a:'#c79cff',b:'#6a35ef'},legendary:{name:'LEGENDARY',a:'#ffd36b',b:'#ff7a00'},mythic:{name:'MYTHIC',a:'#ff9ae6',b:'#a020c0'},season:{name:'SEASON',a:'#fff3a0',b:'#8a3cff'}};
// Selection poses: a short show each skin performs on its store card after you pick it. fn(p,s) gets the
// progress p (0 to 1) and the clock s, and returns the balloon's offset, turn, face and fx drawn behind
// (back) and in front (front) of it, in balloon coordinates. sfx lists sounds to play at given progress.
const POSE_TIME=2.2;
const seg=(p,a,b)=>Math.min(1,Math.max(0,(p-a)/(b-a))),bell=k=>Math.sin(Math.PI*Math.min(1,Math.max(0,k))),ease=k=>k<.5?2*k*k:1-(2-2*k)**2/2;
function poseText(text,px,py,size,color,rot=0){ctx.save();ctx.translate(px,py);ctx.rotate(rot);ctx.font=`${size}px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.lineWidth=size*.32;ctx.strokeStyle=INK;ctx.strokeText(text,0,0);ctx.fillStyle=color;ctx.fillText(text,0,0);ctx.restore()}
function puffs(px,py,k,n=7,r=12){ctx.save();ctx.globalAlpha=(1-k)*.85;ctx.fillStyle='#8a8aa6';for(let i=0;i<n;i++){const a=i*TAU/n;ctx.beginPath();ctx.arc(px+Math.cos(a)*(10+k*40),py+Math.sin(a)*(8+k*30),Math.max(0,r*(1+k)),0,TAU);ctx.fill()}ctx.restore()}
const SKIN_POSES={
 dragon:{name:'DRAGON FIRE',sfx:[[.3,'nitro'],[.32,'boom']],fn(p,s){const back=bell(seg(p,0,.3)),fire=seg(p,.3,.85),on=fire>0&&fire<1;
  return {x:on?Math.sin(s*60)*2:0,y:back*8-(on?4:0),rot:-back*.15,sx:1-back*.06+(on?.06:0),sy:1-back*.1+(on?.05:0),face:on?'angry':'happy',
   front(){if(!on)return;const len=40+ease(Math.min(1,fire*3))*70;for(let i=0;i<22;i++){const q=(s*3+i/22)%1,d=10+q*len,sp=(hash(i*3.7)-.5)*(8+q*26);ctx.globalAlpha=(1-q)*.9;ctx.fillStyle=q<.3?'#fff6b0':q<.6?'#ffd23f':'#ff5a1f';ctx.beginPath();ctx.arc(sp,6+d,(3+q*9)*(1-q*.3),0,TAU);ctx.fill()}ctx.globalAlpha=1;if(fire>.2)poseText('ROAR!',0,-64+Math.sin(s*40)*2,24,'#ff8a2a',-.08)}}}},
 unicorn:{name:'RAINBOW DASH',sfx:[[0,'launch'],[.5,'charged']],fn(p,s){const jump=bell(seg(p,0,.6)),spin=ease(seg(p,.05,.55)),b=seg(p,.5,1);
  return {y:-jump*34,rot:spin*TAU,face:p>.5?'star':'joy',
   back(){const k=bell(seg(p,0,.9));if(k>0){ctx.lineWidth=7;ctx.globalAlpha=k;['#ff6f9a','#ffd23f','#4fd38a','#4fb0ff','#a273ff'].forEach((c,i)=>{ctx.strokeStyle=c;ctx.beginPath();ctx.arc(0,-5,46+i*6,-Math.PI/2,-Math.PI/2+TAU*Math.min(1,p*1.8));ctx.stroke()})}},
   front(){if(b>0&&b<1)for(let i=0;i<12;i++){const a=i*TAU/12,r=30+ease(b)*60;ctx.globalAlpha=1-b;ctx.fillStyle=['#ff6f9a','#ffd23f','#4fd38a','#4fb0ff','#a273ff','#fff'][i%6];star(Math.cos(a)*r,-5+Math.sin(a)*r,6,2,4);ctx.fill()}}}}},
 diamond:{name:'CRYSTAL SHINE',sfx:[[0,'shield'],[.55,'charged']],fn(p,s){const sp=bell(seg(p,0,.6)),fl=seg(p,.55,1);
  return {spin:ease(seg(p,0,.6))*30,y:-sp*12,sx:1+bell(seg(p,.5,.65))*.12,sy:1+bell(seg(p,.5,.65))*.12,face:p>.55?'cool':'joy',
   back(){const k=bell(fl);if(k>0){ctx.save();ctx.translate(0,-5);ctx.rotate(s);ctx.globalAlpha=k*.6;for(let i=0;i<12;i++){ctx.rotate(TAU/12);ctx.fillStyle=i%2?'#ffffff':'#9fe6ff';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(110,-8);ctx.lineTo(110,8);ctx.closePath();ctx.fill()}ctx.restore()}},
   front(){if(fl>0&&fl<1)for(let i=0;i<10;i++){const a=i*TAU/10+.3,r=30+ease(fl)*55;ctx.save();ctx.globalAlpha=1-fl;ctx.translate(Math.cos(a)*r,-5+Math.sin(a)*r);ctx.rotate(a);ctx.fillStyle=i%2?'#c9f6ff':'#ffffff';ctx.strokeStyle=INK;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(4,0);ctx.lineTo(0,6);ctx.lineTo(-4,0);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}}}}},
 prism:{name:'RAINBOW FLASH',sfx:[[0,'shield'],[.5,'charged']],fn(p,s){const up=bell(seg(p,0,.5)),fl=seg(p,.5,1),pump=bell(seg(p,.45,.6));
  return {spin:ease(seg(p,0,.5))*24,y:-up*16,sx:1+pump*.14,sy:1+pump*.14,face:p>.5?'star':'joy',
   back(){const k=bell(fl);if(k>0){ctx.save();ctx.translate(0,-5);ctx.rotate(s*.6);ctx.globalAlpha=k*.7;for(let i=0;i<12;i++){ctx.rotate(TAU/12);ctx.fillStyle=RAINBOW[i%6];ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(115,-9);ctx.lineTo(115,9);ctx.closePath();ctx.fill()}ctx.restore()}},
   front(){if(fl>0&&fl<1)for(let i=0;i<12;i++){const a=i*TAU/12+.2,r=30+ease(fl)*60;ctx.globalAlpha=1-fl;ctx.fillStyle=RAINBOW[i%6];ctx.strokeStyle=INK;ctx.lineWidth=1.2;star(Math.cos(a)*r,-5+Math.sin(a)*r,6,2.2,4);ctx.fill();ctx.stroke()}}}}},
 starlight:{name:'SUPERNOVA',sfx:[[0,'zone'],[.55,'boom'],[.6,'record']],fn(p,s){const rise=ease(seg(p,0,.5)),sh=bell(seg(p,.35,.6)),bu=seg(p,.55,1);
  return {y:-rise*20+ease(seg(p,.6,.9))*20,sx:1-sh*.5+bell(bu)*.15,sy:1-sh*.5+bell(bu)*.15,rot:Math.sin(s*30)*.04*sh,face:p>.55?'star':'wow',
   back(){if(p<.6)glow(0,-5,40+rise*34,'#c46aff',.6*rise);const k=bell(bu);if(k>0){ctx.save();ctx.translate(0,-5);ctx.rotate(s*.5);ctx.globalAlpha=k*.75;for(let i=0;i<16;i++){ctx.rotate(TAU/16);ctx.fillStyle=i%2?'#ffe680':'#c49aff';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(130,-8);ctx.lineTo(130,8);ctx.closePath();ctx.fill()}ctx.restore()}},
   front(){if(p<.55)for(let i=0;i<10;i++){const q=1-((s*1.4+i/10)%1),a=i*2.3+s;ctx.globalAlpha=rise*(1-q*.3);ctx.fillStyle=i%2?'#fff':'#ffe680';star(Math.cos(a)*q*90,-5+Math.sin(a)*q*70,3+q*2,1.2,4);ctx.fill()}
    if(bu>0&&bu<1){ctx.globalAlpha=1-bu;ctx.strokeStyle='#ffe680';ctx.lineWidth=8*(1-bu)+1;ctx.beginPath();ctx.arc(0,-5,30+bu*80,0,TAU);ctx.stroke();ctx.globalAlpha=Math.min(1,(1-bu)*3);poseText('LEGEND!',0,-80,22,'#ffe680',-.1)}}}}},
 classic:{name:'HEART HUG',sfx:[[0,'boop'],[.2,'boop'],[.42,'boost'],[.58,'charged']],fn(p){const h1=bell(seg(p,0,.18)),h2=bell(seg(p,.2,.4)),spin=ease(seg(p,.4,.66)),b=seg(p,.58,1),land=bell(seg(p,.4,.5));
  return {y:-(h1*16+h2*26),rot:spin*TAU,sx:1+land*.14,sy:1-land*.12,face:p>.58?'star':'joy',
   back(){if(b>0&&b<1){ctx.save();ctx.translate(0,4);const k=.6+ease(b)*2.4;ctx.scale(k,k);heart(30);ctx.globalAlpha=(1-b)*.35;ctx.fillStyle='#ff9ab0';ctx.fill();ctx.globalAlpha=1-b;ctx.lineWidth=7/k;ctx.strokeStyle='#ff4d6d';ctx.stroke();ctx.lineWidth=2.5/k;ctx.strokeStyle='#fff';ctx.stroke();ctx.restore()}},
   front(){if(b>0&&b<1)for(let i=0;i<10;i++){const a=i*TAU/10+b,r=34+ease(b)*58;ctx.save();ctx.globalAlpha=1-b*b;ctx.translate(Math.cos(a)*r,-5+Math.sin(a)*r);ctx.rotate(Math.sin(a)*.4);ctx.fillStyle=i%2?'#ff4d6d':'#ff9ab0';ctx.strokeStyle=INK;ctx.lineWidth=1.5;heart(7);ctx.fill();ctx.stroke();ctx.restore()}}}}},
 gumball:{name:'BUBBLE POP',sfx:[[.08,'boop'],[.62,'pop']],fn(p,s){const blow=seg(p,.1,.62),pop=seg(p,.62,.82),after=seg(p,.62,1),wob=p>.62&&p<.86?Math.sin(s*60)*3*(1-after):0,sq=bell(seg(p,.62,.76));
  return {x:wob,y:-bell(seg(p,0,.12))*8,sx:1+sq*.12,sy:1-sq*.1,face:p<.62?'happy':p<.86?'wow':'joy',
   front(){if(p<.62&&blow>0){const r=3+ease(blow)*30+Math.sin(s*12)*blow;ctx.fillStyle='rgba(255,140,200,.82)';ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,4+r*.45,r,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle='rgba(255,255,255,.8)';ctx.beginPath();ctx.ellipse(-r*.38,4+r*.05,r*.18,r*.28,.5,0,TAU);ctx.fill()}
    if(pop>0&&pop<1){ctx.globalAlpha=1-pop;ctx.strokeStyle='#ff7ac0';ctx.lineWidth=4;for(let i=0;i<12;i++){const a=i*TAU/12,r1=16+pop*20,r2=r1+10+pop*28;ctx.beginPath();ctx.moveTo(Math.cos(a)*r1,18+Math.sin(a)*r1);ctx.lineTo(Math.cos(a)*r2,18+Math.sin(a)*r2);ctx.stroke()}poseText('POP!',0,-58-pop*12,22,'#ff7ac0',-.15)}
    if(after>0&&after<1){ctx.globalAlpha=1;ctx.fillStyle='#ff9ad5';ctx.strokeStyle=INK;ctx.lineWidth=1.5;for(const [bx,by,br] of [[-14,4,5],[12,8,6],[2,16,4],[-6,-2,3]]){ctx.beginPath();ctx.arc(bx,by+after*6,br*(1-after*.5),0,TAU);ctx.fill();ctx.stroke()}}}}}},
 clown:{name:'JUGGLE & HONK',sfx:[[0,'launch'],[.3,'boop'],[.8,'boop'],[.82,'record']],fn(p,s){const jump=bell(seg(p,0,.3)),flip=ease(seg(p,.03,.27)),jug=seg(p,.3,.8),honk=bell(seg(p,.8,.92)),c=seg(p,.8,1);
  return {y:-jump*40,rot:flip*TAU,sx:1+honk*.16,sy:1-honk*.14,face:p>.8?'joy':'happy',
   front(){if(jug>0&&jug<1)['#ff4d5e','#ffd23f','#44d9ff'].forEach((col,i)=>{const ph=(s*2.4+i/3)%1,bx=Math.cos(ph*TAU)*24,by=-62-Math.sin(ph*TAU)*16-Math.abs(Math.cos(ph*TAU))*6;ctx.fillStyle=col;ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.beginPath();ctx.arc(bx,by,6,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.arc(bx-2,by-2,1.8,0,TAU);ctx.fill()});
    if(honk>0)poseText('HONK!',34,-30,18,'#ffd23f',.25);
    if(c>0&&c<1)for(let i=0;i<22;i++){const a=-Math.PI/2+(hash(i*1.7)-.5)*2.6,sp=50+hash(i*3.1)*60,px=Math.cos(a)*sp*c,py=-10+Math.sin(a)*sp*c+c*c*60;ctx.save();ctx.globalAlpha=1-c*c;ctx.translate(px,py);ctx.rotate(c*12+i);ctx.fillStyle=['#ff4d5e','#ffd23f','#44d9ff','#4fd36b','#a273ff'][i%5];ctx.fillRect(-3.5,-1.8,7,3.6);ctx.restore()}}}}},
 toy:{name:'ROBOT DANCE',sfx:[[0,'on'],[.1,'on'],[.2,'on'],[.3,'on'],[.4,'on'],[.5,'on'],[.62,'zap']],fn(p,s){const step=Math.floor(p*10),dance=p<.6,beam=seg(p,.62,.95),mv=[[-10,-.22,0],[0,0,-7],[10,.22,0],[0,0,-7]][step%4];
  return {x:dance?mv[0]:0,rot:dance?mv[1]:0,y:dance?mv[2]:0,face:'happy',
   front(){if(dance&&(p*10)%1<.35){ctx.strokeStyle='#5ff0ff';ctx.lineWidth=2;for(let k=0;k<3;k++){const a=-Math.PI/2+(k-1)*.9;let px=0,py=-54;ctx.beginPath();ctx.moveTo(px,py);for(let j=1;j<=3;j++){px+=Math.cos(a)*6+(j%2?3:-3);py+=Math.sin(a)*6;ctx.lineTo(px,py)}ctx.stroke()}}
    if(beam>0&&beam<1){const tx=-66+beam*132,ty=64;ctx.globalAlpha=Math.min(1,bell(beam)*3);for(const ex of [-8,8]){ctx.strokeStyle='rgba(255,60,80,.45)';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(ex,-9);ctx.lineTo(tx+ex*.3,ty);ctx.stroke();ctx.strokeStyle='#fff';ctx.lineWidth=2.5;ctx.stroke()}
     for(let i=0;i<5;i++){ctx.fillStyle=i%2?'#ffd23f':'#fff';star(tx+(hash(i+s*9)-.5)*18,ty-hash(i*2+s*7)*14,4,1.5,4);ctx.fill()}}}}}},
 melon:{name:'MELON TWISTER',sfx:[[0,'boost'],[.52,'smash']],fn(p,s){const sp=bell(seg(p,0,.8)),spl=seg(p,.52,1);
  return {spin:ease(seg(p,0,.8))*48,y:-sp*16,rot:Math.sin(s*34)*.05*sp,sx:1+sp*.08,sy:1-sp*.08,face:p>.52?'star':'joy',
   back(){if(sp>.05){ctx.globalAlpha=sp*.8;ctx.strokeStyle='#ffffff';ctx.lineWidth=3;ctx.lineCap='round';for(let k=0;k<3;k++){const a=s*14+k*TAU/3;ctx.beginPath();ctx.ellipse(0,-5,44,14,0,a,a+1.6);ctx.stroke()}}},
   front(){if(spl>0&&spl<1)for(let i=0;i<16;i++){const a=i*TAU/16,r=30+ease(spl)*64;ctx.save();ctx.globalAlpha=1-spl;ctx.translate(Math.cos(a)*r,-5+Math.sin(a)*r+spl*spl*30);ctx.rotate(a+Math.PI/2);ctx.fillStyle=i%3===0?'#1b1240':i%2?'#ff5a7a':'#7fe08a';ctx.beginPath();ctx.ellipse(0,0,i%3===0?1.8:3,i%3===0?3:5,0,0,TAU);ctx.fill();ctx.restore()}}}}},
 monster:{name:'MONSTER ROAR',sfx:[[.28,'roar']],fn(p,s){const crouch=bell(seg(p,0,.28)),roar=seg(p,.28,.86),on=roar>0&&roar<1,lunge=bell(seg(p,.28,.42)),grow=on?.2*(1-roar*.6):0;
  return {x:on?Math.sin(s*70)*3:0,y:crouch*9-lunge*12,sx:1-crouch*.08+grow,sy:1-crouch*.15+grow,face:on?'wow':'happy',
   front(){if(on){for(let i=0;i<3;i++){const q=(roar*2.4+i/3)%1;ctx.globalAlpha=1-q;ctx.strokeStyle='#b6ff7a';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,4,24+q*58,-.9,.9);ctx.stroke();ctx.beginPath();ctx.arc(0,4,24+q*58,Math.PI-.9,Math.PI+.9);ctx.stroke()}ctx.globalAlpha=1;poseText('ROAR!',0,-66+Math.sin(s*50)*2,26,'#b6ff7a',Math.sin(s*30)*.06)}
    if(roar>.1)for(let i=0;i<6;i++){const q=(roar*1.6+hash(i*2.3))%1;ctx.globalAlpha=1-q;ctx.fillStyle='#7ad83f';ctx.strokeStyle=INK;ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse((hash(i*5.1)-.5)*50,26+q*40,3,4+q*4,0,0,TAU);ctx.fill();ctx.stroke()}}}}},
 ninja:{name:'SHADOW CLONES',sfx:[[0,'close'],[.5,'zap'],[.76,'close']],fn(p,s){const out=seg(p,0,.14),cl=seg(p,.14,.76),sl=seg(p,.5,.78),back=seg(p,.76,.92);
  return {alpha:p<.14?1-out:p<.76?0:back,y:p>=.76?(1-back)*-8:0,face:'happy',
   back(){if(cl>0&&cl<1){const spread=ease(Math.min(1,cl*3))*(1-seg(cl,.85,1));for(const k of [-1,0,1]){ctx.save();ctx.globalAlpha=k?.75:1;ctx.translate(k*50*spread,Math.abs(k)*6-bell(seg(cl,.2+Math.abs(k)*.1,.5+Math.abs(k)*.1))*10);ctx.scale(.72,.72);drawBalloonBody(SKINS.ninja,s*.9,'happy',0);ctx.restore()}}},
   front(){if(p<.24)puffs(0,-5,seg(p,0,.24));if(p>.7&&p<.95)puffs(0,-5,seg(p,.7,.95));
    if(sl>0&&sl<1)for(let i=0;i<3;i++){const k=seg(sl,i*.2,i*.2+.5);if(k<=0||k>=1)continue;const y0=-40+i*30,dx=70;ctx.globalAlpha=1-k*k;ctx.strokeStyle='#fff';ctx.lineWidth=6*(1-k)+1;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-dx,y0-20);ctx.lineTo(-dx+ease(Math.min(1,k*2))*dx*2,y0-20+ease(Math.min(1,k*2))*40);ctx.stroke()}}}}},
 galaxy:{name:'COSMIC WARP',sfx:[[0,'zone'],[.7,'boom']],fn(p,s){const v=bell(seg(p,0,1)),sh=bell(seg(p,.3,.72)),out=seg(p,.7,1);
  return {y:-v*10,rot:ease(seg(p,.3,.72))*TAU*2,sx:1-sh*.72+bell(out)*.2,sy:1-sh*.72+bell(out)*.2,face:'star',
   back(){ctx.globalAlpha=v;ctx.save();ctx.translate(0,-5);ctx.rotate(s*4);for(let k=0;k<3;k++){ctx.rotate(TAU/3);const g=ctx.createLinearGradient(0,0,70,0);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(.4,'rgba(162,115,255,.7)');g.addColorStop(1,'rgba(68,140,255,0)');ctx.strokeStyle=g;ctx.lineWidth=10;ctx.lineCap='round';ctx.beginPath();for(let a=0;a<3.2;a+=.2){const r=6+a*20;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.stroke()}ctx.restore()},
   front(){ctx.globalAlpha=v;for(let i=0;i<12;i++){const q=1-((s*1.6+i/12)%1),a=i*2.4+s;ctx.fillStyle=i%2?'#fff':'#ffe680';star(Math.cos(a)*q*80,-5+Math.sin(a)*q*60,3+q*3,1.2+q,4);ctx.fill()}
    if(out>0&&out<1){ctx.globalAlpha=1-out;ctx.strokeStyle='#c9a8ff';ctx.lineWidth=7*(1-out)+1;ctx.beginPath();ctx.arc(0,-5,30+out*60,0,TAU);ctx.stroke()}}}}},
 gold:{name:"KING'S TREASURE",sfx:[[0,'launch'],[.3,'coin'],[.45,'coin'],[.5,'buy']],fn(p,s){const toss=seg(p,0,.5),rain=seg(p,.25,1),land=bell(seg(p,.48,.6));
  return {y:-bell(seg(p,.5,.66))*10,sx:1+land*.1,sy:1-land*.1,face:p>.5?'star':'joy',noCrown:toss<1,
   back(){const k=bell(rain);if(k>0){ctx.save();ctx.translate(0,-5);ctx.rotate(s*.8);ctx.globalAlpha=k*.5;ctx.fillStyle='#fff3a0';for(let i=0;i<12;i++){ctx.rotate(TAU/12);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(110,-11);ctx.lineTo(110,11);ctx.closePath();ctx.fill()}ctx.restore()}},
   front(){if(toss<1){ctx.save();ctx.translate(0,-44-bell(toss)*70);ctx.rotate(toss*TAU*2);ctx.translate(0,44);skinExtras({extras:['crown']});ctx.restore()}
    if(rain>0&&rain<1)for(let i=0;i<12;i++){const q=(rain*1.7+hash(i*3.3))%1,cx=(hash(i*1.9)-.5)*130,cy=-95+q*180;ctx.globalAlpha=Math.min(1,(1-rain)*4);drawCoin(cx,cy,6,s*8+i,false)}}}}}};

// Signature trails: what each balloon leaves behind in flight (the engine boost's fire replaces it while it
// burns). Each tick emits from every emitter; chance thins out the extras. The store cards preview them too.
const RAINBOW=['#ff4d5e','#ff9a1a','#ffd23f','#4fd36b','#44d9ff','#a273ff'];
const SKIN_TRAILS={
 classic:[{type:'heart',colors:['#ff4d6d','#ff8aa8'],size:[3.5,5.5],vy:[25,55],life:[.8,1.1],chance:.55},{type:'puff',colors:['#ffffff'],size:[4,6],vy:[15,30],life:[.7,.9]}],
 gumball:[{type:'bubble',colors:['#ff9ad5','#ffc6e6','#ffffff'],size:[3,6.5],vy:[10,30],life:[1,1.3]}],
 clown:[{type:'confetti',colors:RAINBOW,size:[5,8],vy:[20,50],life:[.8,1.1],vr:[-8,8]},{type:'ball',colors:['#ff3b3b','#ffd23f','#44d9ff'],size:[2.5,4],vy:[30,70],gravity:150,chance:.3}],
 toy:[{type:'gear',colors:['#c9d3e6','#9aa6bd'],size:[3.5,5.5],vy:[30,60],vr:[-6,6],life:[.8,1]},{type:'bolt',colors:['#5ff0ff','#ffd23f'],size:[3,5],life:[.25,.4],vr:[-2,2],chance:.35},{type:'smoke',colors:['#5f6b85'],size:[4,6],chance:.4}],
 melon:[{type:'seed',colors:['#1b1240'],size:[3,5],vy:[30,60],gravity:120,vr:[-6,6]},{type:'drop',colors:['#ff5a7a','#ff8aa0'],size:[3,4.5],vy:[20,50],gravity:160,chance:.6}],
 monster:[{type:'slime',colors:['#7ad83f','#b6ff7a'],size:[3,5],vy:[40,80],gravity:120},{type:'stink',colors:['#9be85a'],size:[5,8],vr:[-3,3],chance:.5}],
 ninja:[{type:'smoke',colors:['#4a4a63','#2c2c40','#6b6b88'],size:[5,8],vy:[10,30],life:[.9,1.2]},{type:'shuriken',colors:['#dfe6f5'],size:[3.5,5],vx:[-120,120],vy:[20,60],vr:[14,20],life:[.6,.8],chance:.08}],
 galaxy:[{type:'glow',colors:['#a273ff','#4d7bff','#ff7ad9'],size:[7,11],vy:[10,25],life:[.9,1.2]},{type:'star',colors:['#ffffff','#ffe680'],size:[2.5,4.5],chance:.6}],
 gold:[{type:'coin',colors:['#ffd23f'],size:[3,4.5],vy:[40,80],gravity:180,vr:[8,14],chance:.45},{type:'star',colors:['#ffd23f','#fff6b0'],size:[3,5]}],
 dragon:[{type:'flame',colors:['#ffd23f'],size:[4,7],vy:[20,45],life:[.5,.7]},{type:'spark',colors:['#ff8a2a','#ffd23f'],size:[1.5,2.5],vx:[-60,60],vy:[40,90],chance:.4}],
 unicorn:[{type:'band',colors:RAINBOW,size:[4,4],vx:[0,0],vy:[0,0],life:[.75,.75],still:true},{type:'star',colors:RAINBOW,size:[3,5],chance:.4}],
 diamond:[{type:'crystal',colors:['#ffffff','#c9f6ff','#9fe6ff'],size:[3,5],vy:[20,50],vr:[-5,5],life:[.8,1.1]},{type:'star',colors:['#ffffff'],size:[2.5,4],life:[.3,.5],chance:.4}],
 prism:[{type:'crystal',colors:['#ffb0f0','#9fe6ff','#fff3a0','#b8ffc8'],size:[3,5],vy:[20,50],vr:[-5,5],life:[.8,1.1]},{type:'glow',colors:['#ff8ad8','#7ad8ff','#ffd23f','#6fe08a'],size:[6,9],vy:[10,25],life:[.6,.9],chance:.5}],
 starlight:[{type:'glow',colors:['#c46aff','#ffd23f'],size:[8,12],vy:[5,20],life:[.9,1.2]},{type:'star',colors:['#ffe680','#ffffff','#c49aff'],size:[3.5,6],vy:[15,40],vr:[-3,3],life:[1,1.3]},{type:'star',colors:['#ffffff'],size:[1.5,2.5],vx:[-80,80],vy:[30,80],life:[.4,.6],chance:.5}]};
const between=(r,d)=>r?r[0]+Math.random()*(r[1]-r[0]):d;
function emitTrail(id,bx,by){for(const e of SKIN_TRAILS[id]||SKIN_TRAILS.classic){if(e.chance!==undefined&&Math.random()>e.chance)continue;
 particles.push({type:e.type,back:true,world:true,x:bx+(e.still?0:(Math.random()-.5)*8),y:by,vx:between(e.vx,(Math.random()-.5)*32),vy:between(e.vy,10+Math.random()*20)*.8,life:0,max:between(e.life,.8)*1.25,size:between(e.size,4)*1.5,color:e.colors[Math.floor(Math.random()*e.colors.length)],gravity:e.gravity||0,drag:1,rot:Math.random()*TAU,vr:between(e.vr,(Math.random()-.5)*6)})}}
// One particle shape at the origin; k is its age from 0 to 1.
function drawPart(type,sz,color,k,rot){ctx.lineJoin='round';ctx.lineCap='round';
 if(type==='puff'){ctx.globalAlpha=(1-k)*.6;ctx.fillStyle=color;ctx.beginPath();ctx.arc(0,0,sz*(1+k*1.4),0,TAU);ctx.fill()}
 else if(type==='smoke'){ctx.globalAlpha=(1-k)*.55;ctx.fillStyle=color;for(const [ox,oy,r] of [[-.5,0,.8],[.5,-.2,.7],[0,-.5,.9]]){ctx.beginPath();ctx.arc(ox*sz*(1+k),oy*sz*(1+k),sz*r*(1+k*1.6),0,TAU);ctx.fill()}}
 else if(type==='stink'){ctx.globalAlpha=(1-k)*.45;ctx.fillStyle=color;ctx.beginPath();ctx.arc(0,0,sz*(1+k*1.5),0,TAU);ctx.fill();ctx.globalAlpha=(1-k)*.8;ctx.strokeStyle='#4f8f1d';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(0,0,sz*.6*(1+k),rot,rot+3.6);ctx.stroke()}
 else if(type==='star'){ctx.globalAlpha=1-k;ctx.rotate(rot);ctx.fillStyle=color;star(0,0,sz*(1-k*.5),sz*.4*(1-k*.5),4);ctx.fill()}
 else if(type==='bubble'){ctx.globalAlpha=k>.8?(1-k)/.2:1;ctx.fillStyle='rgba(255,230,245,.3)';ctx.strokeStyle=color;ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(0,0,sz,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-sz*.35,-sz*.35,sz*.28,0,TAU);ctx.fill()}
 else if(type==='seed'){ctx.globalAlpha=1-k;ctx.rotate(rot);ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(0,0,sz*.45,sz*.75,0,0,TAU);ctx.fill()}
 else if(type==='drop'){ctx.globalAlpha=1-k;ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,-sz*1.3);ctx.quadraticCurveTo(sz,0,0,sz*.8);ctx.quadraticCurveTo(-sz,0,0,-sz*1.3);ctx.fill();ctx.fillStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.arc(-sz*.25,-sz*.1,sz*.22,0,TAU);ctx.fill()}
 else if(type==='slime'){ctx.globalAlpha=1-k;ctx.fillStyle=color;ctx.strokeStyle=INK;ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(0,0,sz*.7,sz*(1+k),0,0,TAU);ctx.fill();ctx.stroke()}
 else if(type==='heart'){ctx.globalAlpha=1-k*k;ctx.rotate(rot*.2);ctx.fillStyle=color;heart(sz);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1.5;ctx.stroke()}
 else if(type==='confetti'){ctx.rotate(rot);ctx.scale(Math.cos(rot*3),1);ctx.globalAlpha=k>.7?(1-k)/.3:1;ctx.fillStyle=color;ctx.fillRect(-sz/2,-sz/4,sz,sz/2)}
 else if(type==='ball'){ctx.globalAlpha=1-k*k;ctx.fillStyle=color;ctx.strokeStyle=INK;ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,0,sz,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.arc(-sz*.3,-sz*.3,sz*.3,0,TAU);ctx.fill()}
 else if(type==='gear'){ctx.globalAlpha=1-k*k;ctx.rotate(rot);ctx.fillStyle=color;ctx.strokeStyle=INK;ctx.lineWidth=1.2;ctx.beginPath();for(let i=0;i<16;i++){const a=i*TAU/16,r=i%2?sz:sz*.72;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle=INK;ctx.beginPath();ctx.arc(0,0,sz*.28,0,TAU);ctx.fill()}
 else if(type==='bolt'){ctx.globalAlpha=1-k;ctx.rotate(rot);ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-sz,-sz*1.2);ctx.lineTo(sz*.3,-sz*.2);ctx.lineTo(-sz*.3,sz*.2);ctx.lineTo(sz,sz*1.2);ctx.stroke()}
 else if(type==='shuriken'){ctx.globalAlpha=k>.7?(1-k)/.3:1;ctx.rotate(rot);ctx.fillStyle=color;ctx.strokeStyle=INK;ctx.lineWidth=1.2;star(0,0,sz*1.3,sz*.35,4);ctx.fill();ctx.stroke();ctx.fillStyle=INK;ctx.beginPath();ctx.arc(0,0,sz*.22,0,TAU);ctx.fill()}
 else if(type==='glow'){ctx.globalAlpha=(1-k)*.7;ctx.globalCompositeOperation='lighter';const r=sz*(1+k),g=ctx.createRadialGradient(0,0,0,0,0,r);g.addColorStop(0,color);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fill();ctx.globalCompositeOperation='source-over'}
 else if(type==='coin'){ctx.globalAlpha=1-k*k;const w=Math.max(.15,Math.abs(Math.cos(rot)));ctx.fillStyle='#ffcf2e';ctx.strokeStyle='#a86a00';ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(0,0,sz*w,sz,0,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle='#fff6c2';ctx.beginPath();ctx.ellipse(-sz*.25*w,-sz*.3,sz*.25*w,sz*.3,0,0,TAU);ctx.fill()}
 else if(type==='flame'){const c=k<.3?'#fff6b0':k<.55?'#ffb020':k<.75?'#ff5a1f':'#5a4a5a';ctx.globalAlpha=k<.75?1:(1-k)/.25*.6;ctx.fillStyle=c;const r=sz*(k<.75?1-k*.4:1+k);ctx.beginPath();ctx.moveTo(0,r*1.5);ctx.quadraticCurveTo(r,0,0,-r);ctx.quadraticCurveTo(-r,0,0,r*1.5);ctx.fill()}
 else if(type==='band'){ctx.globalAlpha=(1-k)*.85;const n=RAINBOW.length,w=sz*.9;RAINBOW.forEach((c,i)=>{ctx.fillStyle=c;ctx.fillRect((i-n/2)*w,-5,w+.5,10)})}
 else if(type==='crystal'){ctx.globalAlpha=k>.7?(1-k)/.3:1;ctx.rotate(rot);ctx.fillStyle=color;ctx.strokeStyle='#3aa8e0';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(0,-sz*1.4);ctx.lineTo(sz*.8,0);ctx.lineTo(0,sz*1.4);ctx.lineTo(-sz*.8,0);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='rgba(255,255,255,.85)';ctx.beginPath();ctx.moveTo(0,-sz*1.4);ctx.lineTo(sz*.25,-sz*.2);ctx.lineTo(-sz*.3,0);ctx.closePath();ctx.fill()}
 else if(type==='shard'){ctx.rotate(rot);ctx.globalAlpha=k>.75?(1-k)/.25:1;ctx.fillStyle=color;ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-sz,-sz*.4);ctx.lineTo(sz*.8,-sz*.6);ctx.lineTo(sz*.3,sz*.6);ctx.closePath();ctx.fill();ctx.stroke()}
 else return false;return true}
// Store preview: the trail drawn procedurally below the balloon (balloon coordinates).
function drawTrailPreview(id,s){const em=SKIN_TRAILS[id]||SKIN_TRAILS.classic;ctx.save();em.forEach((e,j)=>{const n=e.still?16:e.chance!==undefined&&e.chance<.3?2:7;for(let i=0;i<n;i++){const ph=(s*(e.still?.9:.6)+i/n+j*.37)%1,seed=hash(i*7.3+j*3.1);
  const x=e.still?Math.sin(s*2-ph*4)*3:(seed-.5)*18+Math.sin(ph*6+i)*4+(e.type==='shuriken'?(seed-.5)*60*ph:0),y=38+ph*(e.still?70:60)+(e.gravity?ph*ph*30:0),sz=(e.size[0]+e.size[1])/2;
  ctx.save();ctx.translate(x,y);if(drawPart(e.type,sz,e.colors[(i+j)%e.colors.length],ph,s*(e.vr?3:1)+i)===false){ctx.globalAlpha=1-ph;ctx.strokeStyle=e.colors[0];ctx.lineWidth=sz;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-6);ctx.stroke()}ctx.restore()}});ctx.restore()}
