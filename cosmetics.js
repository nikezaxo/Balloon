'use strict';
// Profile cosmetics: avatars, avatar frames and the gold name. Free ones are static; the gem ones animate.
// Everything is drawn on small canvases in a 100x100 box centred on 0,0 (avatar disc radius 34, frame 35-48).
const AVATARS={
 sunny:{name:'Sunny',price:0,bg:['#bfe9ff','#5ab8ff']},
 kitty:{name:'Kitty',price:0,bg:['#ffd6e8','#ff8ab8']},
 bear:{name:'Bear',price:0,bg:['#d4ffe6','#6fd6a0']},
 frog:{name:'Froggy',price:0,bg:['#e2f4ff','#8ac6ff']},
 bot:{name:'Bot',price:0,bg:['#e6dcff','#9a7aff']},
 balloon:{name:'Balloon',price:0,bg:['#fff3c4','#ffc44d']},
 phoenix:{name:'Phoenix',gems:150,anim:true,bg:['#ff8a3c','#5a0a0a']},
 ghost:{name:'Ghost',gems:150,anim:true,bg:['#4a3a9a','#0c0626']},
 alien:{name:'Alien',gems:200,anim:true,bg:['#1f5a3a','#020a10']},
 dragon:{name:'Dragon',gems:250,anim:true,bg:['#7a2aa8','#1a0626']},
 lion:{name:'Lion King',gems:300,anim:true,bg:['#fff1a0','#e08a00']},
 // Season rewards: never sold, won by finishing a season in that tier or higher.
 eagle:{name:'Golden Eagle',season:'gold',anim:true,bg:['#fff3a0','#c98a00']},
 pilot:{name:'Mech Pilot',season:'titanium',anim:true,bg:['#bff4ff','#1f5a6e']},
 fox:{name:'Crystal Fox',season:'diamond',anim:true,bg:['#e8fbff','#2a7ad8']},
 legend:{name:'Star Legend',season:'legend',anim:true,bg:['#c49aff','#2a0e5e']}};
const FRAMES={
 basic:{name:'Classic',price:0},
 wood:{name:'Wood',price:0},
 sky:{name:'Cloud',price:0},
 leaf:{name:'Leafy',price:0},
 gold:{name:'Golden Laurel',gems:200,anim:true},
 fire:{name:'Inferno',gems:250,anim:true},
 rainbow:{name:'Rainbow',gems:250,anim:true},
 electric:{name:'Thunder',gems:300,anim:true},
 galaxy:{name:'Galaxy',gems:350,anim:true},
 diamond:{name:'Diamond',gems:400,anim:true},
 sBronze:{name:'Bronze Season',season:'bronze',anim:true},
 sSilver:{name:'Silver Season',season:'silver',anim:true},
 sGold:{name:'Gold Season',season:'gold',anim:true},
 sTitan:{name:'Titanium Season',season:'titanium',anim:true},
 sDiamond:{name:'Diamond Season',season:'diamond',anim:true},
 legend:{name:'Star Legend',season:'legend',anim:true}};
const SEASON_NAMES={bronze:'BRONZE',silver:'SILVER',gold:'GOLD',titanium:'TITANIUM',diamond:'DIAMOND',legend:'STAR LEGEND'};
const seasonGoal=tier=>tier==='legend'?'Season reward: finish a season as a STAR LEGEND to win it.':`Season reward: finish a season in ${SEASON_NAMES[tier]} or higher to win it.`;
const GOLD_NAME_PRICE=500,CLAN_PRICE=100;
const myCos=()=>{const c=save.cos||(save.cos={own:[],avatar:'sunny',frame:'basic',gold:false,goldOwned:false});c.own=c.own||[];return c};
// The look other players see: avatar, frame and whether the name is gold.
const myLook=()=>{const c=myCos();return {avatar:AVATARS[c.avatar]?c.avatar:'sunny',frame:FRAMES[c.frame]?c.frame:'basic',gold:!!(c.gold&&c.goldOwned)}};
const ownsCos=id=>{const item=AVATARS[id]||FRAMES[id];return !!item&&((!item.gems&&!item.season)||myCos().own.includes(id))};

function face(eyeY,{eye=4.5,gap=10,smile=true,blink=false}={}){ctx.fillStyle=INK;for(const s of [-1,1]){ctx.beginPath();ctx.ellipse(s*gap,eyeY,eye*.8,blink?.8:eye,0,0,TAU);ctx.fill();if(!blink){ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(s*gap+1.3,eyeY-1.6,1.4,0,TAU);ctx.fill();ctx.fillStyle=INK}}
 if(smile){ctx.strokeStyle=INK;ctx.lineWidth=2.6;ctx.lineCap='round';ctx.beginPath();ctx.arc(0,eyeY+5,7,.2*Math.PI,.8*Math.PI);ctx.stroke()}}
function cheeks(y,gap=17){ctx.fillStyle='rgba(255,90,130,.45)';for(const s of [-1,1]){ctx.beginPath();ctx.ellipse(s*gap,y,4.5,2.6,0,0,TAU);ctx.fill()}}
function blob(px,py,r,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.arc(px,py,r,0,TAU);ctx.fill();ctx.stroke()}
// Avatar art inside the disc. t is seconds; animated ones move with it.
const AVATAR_ART={
 sunny(t){ctx.fillStyle='#ffb000';for(let i=0;i<10;i++){ctx.save();ctx.rotate(i*TAU/10);ctx.beginPath();ctx.moveTo(-5,-22);ctx.lineTo(0,-31);ctx.lineTo(5,-22);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}blob(0,0,21,'#ffe04a');cheeks(5,12);face(-3,{gap:7,eye:3.5})},
 kitty(){ctx.fillStyle='#ff9a3c';for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(s*20,-8);ctx.lineTo(s*22,-30);ctx.lineTo(s*6,-20);ctx.closePath();ctx.fill();ctx.stroke()}blob(0,2,23,'#ffae5a');ctx.fillStyle='#ffd8b0';ctx.beginPath();ctx.ellipse(0,10,11,8,0,0,TAU);ctx.fill();face(-2,{gap:9,smile:false});ctx.fillStyle='#ff5a7a';ctx.beginPath();ctx.moveTo(-3,6);ctx.lineTo(3,6);ctx.lineTo(0,9);ctx.closePath();ctx.fill();ctx.lineWidth=1.6;for(const s of [-1,1])for(const k of [-1,1]){ctx.beginPath();ctx.moveTo(s*9,9+k*2);ctx.lineTo(s*24,8+k*5);ctx.stroke()}},
 bear(){for(const s of [-1,1]){blob(s*18,-18,8,'#a8683a');ctx.fillStyle='#e8b080';ctx.beginPath();ctx.arc(s*18,-18,4,0,TAU);ctx.fill()}blob(0,2,23,'#b8784a');ctx.fillStyle='#f0c9a0';ctx.beginPath();ctx.ellipse(0,10,12,9,0,0,TAU);ctx.fill();ctx.stroke();face(-4,{gap:9,smile:false});ctx.fillStyle=INK;ctx.beginPath();ctx.ellipse(0,6,4,3,0,0,TAU);ctx.fill();ctx.lineWidth=2;ctx.beginPath();ctx.arc(-3,11,3,0,Math.PI*.9);ctx.arc(3,11,3,Math.PI*.1,Math.PI);ctx.stroke()},
 frog(){ctx.fillStyle='#5fd06a';ctx.beginPath();ctx.ellipse(0,6,26,20,0,0,TAU);ctx.fill();ctx.stroke();for(const s of [-1,1]){blob(s*12,-12,9,'#5fd06a');blob(s*12,-12,5.5,'#fff');ctx.fillStyle=INK;ctx.beginPath();ctx.arc(s*12,-11,3,0,TAU);ctx.fill()}ctx.lineWidth=2.6;ctx.beginPath();ctx.arc(0,4,15,.15*Math.PI,.85*Math.PI);ctx.stroke();cheeks(10,17)},
 bot(){ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(0,-22);ctx.lineTo(0,-30);ctx.stroke();blob(0,-31,3.5,'#ff4d5e');ctx.fillStyle='#c9d3e6';ctx.beginPath();ctx.roundRect(-22,-22,44,40,10);ctx.fill();ctx.stroke();ctx.fillStyle=INK;ctx.beginPath();ctx.roundRect(-16,-12,32,14,6);ctx.fill();ctx.fillStyle='#5ff0ff';for(const s of [-1,1]){ctx.beginPath();ctx.roundRect(s*8-4,-9,8,8,2);ctx.fill()}ctx.fillStyle='#8a96b0';ctx.fillRect(-9,8,18,4);for(const s of [-1,1])blob(s*24,-2,4,'#9aa6bd')},
 balloon(t){ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,20);ctx.quadraticCurveTo(5,28,-2,36);ctx.stroke();ctx.fillStyle='#ff4d5e';ctx.beginPath();ctx.ellipse(0,-2,19,22,0,0,TAU);ctx.fill();ctx.lineWidth=2.5;ctx.stroke();ctx.fillStyle='#ffd23f';ctx.beginPath();ctx.ellipse(0,-2,7,22,0,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle='rgba(255,255,255,.8)';ctx.beginPath();ctx.ellipse(-9,-12,3,6,.5,0,TAU);ctx.fill();face(-4,{gap:7,eye:3.5});cheeks(3,11)},
 phoenix(t){for(let i=0;i<7;i++){const a=-Math.PI/2+(i-3)*.32,f=1+.25*Math.sin(t*12+i*1.7),len=22*f;ctx.save();ctx.rotate(a+Math.PI/2);ctx.fillStyle=i%2?'#ffd23f':'#ff6a1a';ctx.beginPath();ctx.moveTo(-5,-12);ctx.quadraticCurveTo(-6,-12-len*.6,0,-12-len);ctx.quadraticCurveTo(6,-12-len*.6,5,-12);ctx.closePath();ctx.fill();ctx.restore()}
  blob(0,4,19,'#ff8a2a');ctx.fillStyle='#ffd23f';ctx.beginPath();ctx.moveTo(-6,8);ctx.lineTo(0,20);ctx.lineTo(6,8);ctx.closePath();ctx.fill();ctx.stroke();const g=.6+.4*Math.sin(t*6);for(const s of [-1,1]){ctx.fillStyle=`rgba(255,240,150,${g})`;ctx.beginPath();ctx.arc(s*8,0,6,0,TAU);ctx.fill();ctx.fillStyle=INK;ctx.beginPath();ctx.moveTo(s*3,-4);ctx.lineTo(s*13,-6);ctx.lineTo(s*11,2);ctx.lineTo(s*4,1);ctx.closePath();ctx.fill()}},
 ghost(t){const y=Math.sin(t*2.4)*3;ctx.save();ctx.translate(0,y);ctx.fillStyle='rgba(180,140,255,.25)';ctx.beginPath();ctx.arc(0,-2,28,0,TAU);ctx.fill();ctx.fillStyle='#f4f2ff';ctx.beginPath();ctx.moveTo(-18,20);ctx.lineTo(-18,-6);ctx.arc(0,-6,18,Math.PI,0);ctx.lineTo(18,20);for(let i=0;i<=6;i++){const px=18-i*6,py=20+(i%2?6:0)*Math.sin(t*5+i);ctx.lineTo(px,py)}ctx.closePath();ctx.fill();ctx.stroke();
  const blink=(t%3.2)<.12;for(const s of [-1,1]){ctx.fillStyle=blink?INK:'#7a3cff';ctx.beginPath();ctx.ellipse(s*7,-6,4,blink?1:6,0,0,TAU);ctx.fill();if(!blink){ctx.fillStyle='#e0d0ff';ctx.beginPath();ctx.arc(s*7,-8,1.6,0,TAU);ctx.fill()}}ctx.fillStyle=INK;ctx.beginPath();ctx.ellipse(0,7,4,5+Math.sin(t*3),0,0,TAU);ctx.fill();ctx.restore()},
 alien(t){ctx.fillStyle='#fff';for(let i=0;i<12;i++){const tw=.5+.5*Math.sin(t*3+i*1.9);ctx.globalAlpha=tw;ctx.beginPath();ctx.arc((hash(i*3.1)-.5)*64,(hash(i*7.3)-.5)*64,1.2,0,TAU);ctx.fill()}ctx.globalAlpha=1;
  for(const s of [-1,1]){ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(s*7,-18);ctx.lineTo(s*13,-30);ctx.stroke();const g=.5+.5*Math.sin(t*5+s);ctx.fillStyle=`rgba(255,${180+70*g|0},80,1)`;ctx.beginPath();ctx.arc(s*13,-31,3+g*1.5,0,TAU);ctx.fill();ctx.stroke()}
  ctx.fillStyle='#7af08a';ctx.beginPath();ctx.moveTo(0,22);ctx.bezierCurveTo(-26,16,-24,-24,0,-24);ctx.bezierCurveTo(24,-24,26,16,0,22);ctx.fill();ctx.lineWidth=2.5;ctx.stroke();const blink=(t%2.7)<.12;
  for(const s of [-1,1]){ctx.save();ctx.translate(s*9,-3);ctx.rotate(s*.45);ctx.fillStyle=INK;ctx.beginPath();ctx.ellipse(0,0,6.5,blink?1:10,0,0,TAU);ctx.fill();if(!blink){ctx.fillStyle='rgba(255,255,255,.75)';ctx.beginPath();ctx.ellipse(-1.5,-4,1.8,3,0,0,TAU);ctx.fill()}ctx.restore()}ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,11,4,.2*Math.PI,.8*Math.PI);ctx.stroke()},
 dragon(t){for(let i=0;i<3;i++){const q=(t*.5+i/3)%1;ctx.globalAlpha=(1-q)*.6;ctx.fillStyle='#c9c4e0';ctx.beginPath();ctx.arc(-14-q*6+i*14,-14-q*26,4+q*7,0,TAU);ctx.fill()}ctx.globalAlpha=1;
  for(const s of [-1,1]){ctx.fillStyle='#ffe9b0';ctx.beginPath();ctx.moveTo(s*9,-14);ctx.quadraticCurveTo(s*16,-26,s*24,-28);ctx.quadraticCurveTo(s*19,-18,s*17,-10);ctx.closePath();ctx.fill();ctx.stroke()}
  ctx.fillStyle='#e8401a';ctx.beginPath();ctx.ellipse(0,0,20,17,0,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle='#ff8a5a';ctx.beginPath();ctx.ellipse(0,11,14,9,0,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle=INK;for(const s of [-1,1]){ctx.beginPath();ctx.arc(s*5,9,1.6,0,TAU);ctx.fill()}
  const g=.6+.4*Math.sin(t*4);for(const s of [-1,1]){ctx.fillStyle=`rgba(255,220,60,${g})`;ctx.beginPath();ctx.ellipse(s*8,-5,5,3.5,s*.3,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle=INK;ctx.fillRect(s*8-.8,-8,1.6,6)}},
 lion(t){for(let i=0;i<14;i++){const a=i*TAU/14,w=1+.08*Math.sin(t*3+i);ctx.fillStyle=i%2?'#c25a00':'#e07a10';ctx.beginPath();ctx.ellipse(Math.cos(a)*20*w,Math.sin(a)*20*w+3,9,13,a+Math.PI/2,0,TAU);ctx.fill();ctx.stroke()}
  blob(0,4,17,'#ffc44d');ctx.fillStyle='#fff3d0';ctx.beginPath();ctx.ellipse(0,11,9,6,0,0,TAU);ctx.fill();face(1,{gap:7,eye:3,smile:false});ctx.fillStyle=INK;ctx.beginPath();ctx.moveTo(-3,7);ctx.lineTo(3,7);ctx.lineTo(0,10);ctx.closePath();ctx.fill();
  ctx.save();ctx.translate(0,-17);ctx.fillStyle='#ffd23f';ctx.beginPath();ctx.moveTo(-11,4);ctx.lineTo(-13,-8);ctx.lineTo(-5,-2);ctx.lineTo(0,-11);ctx.lineTo(5,-2);ctx.lineTo(13,-8);ctx.lineTo(11,4);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();const sp=Math.max(0,Math.sin(t*2.5));ctx.globalAlpha=sp;ctx.fillStyle='#fff';star(9,-24,5*sp,1.2,4);ctx.fill();ctx.globalAlpha=1},
 eagle(t){const f=Math.sin(t*5)*.3;for(const s of [-1,1]){ctx.save();ctx.translate(s*14,8);ctx.rotate(s*(.5+f));ctx.fillStyle='#a8641a';ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(s*14,-14,s*26,-6);ctx.lineTo(s*22,0);ctx.lineTo(s*26,4);ctx.lineTo(s*20,8);ctx.lineTo(s*22,12);ctx.quadraticCurveTo(s*10,12,0,8);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}
  blob(0,14,15,'#b8701e');ctx.fillStyle='#fff8e8';ctx.beginPath();ctx.ellipse(0,-4,17,16,0,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle='#ffd23f';ctx.beginPath();ctx.moveTo(-6,0);ctx.quadraticCurveTo(0,-4,8,0);ctx.quadraticCurveTo(10,8,3,12);ctx.quadraticCurveTo(4,6,-6,4);ctx.closePath();ctx.fill();ctx.stroke();
  for(const s of [-1,1]){ctx.fillStyle=INK;ctx.beginPath();ctx.arc(s*7,-7,2.8,0,TAU);ctx.fill();ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(s*12,-14);ctx.lineTo(s*3,-10);ctx.stroke()}ctx.lineWidth=2.5;
  const sp=Math.max(0,Math.sin(t*2.2));ctx.globalAlpha=sp;ctx.fillStyle='#fff';star(-12,-20,5*sp,1.2,4);ctx.fill();ctx.globalAlpha=1},
 pilot(t){ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(14,-20);ctx.lineTo(19,-30);ctx.stroke();blob(19,-31,3.2,Math.sin(t*6)>0?'#ff4d5e':'#7ef08f');
  ctx.fillStyle='#5fb8c8';ctx.beginPath();ctx.arc(0,0,23,Math.PI*1.05,Math.PI*1.95);ctx.lineTo(23,14);ctx.quadraticCurveTo(0,26,-23,14);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#d8fbff';for(const s of [-1,1]){ctx.beginPath();ctx.roundRect(s*22-(s>0?0:6),-4,6,14,3);ctx.fill();ctx.stroke()}
  ctx.fillStyle='#14324a';ctx.beginPath();ctx.roundRect(-17,-10,34,15,7);ctx.fill();ctx.stroke();ctx.save();ctx.beginPath();ctx.roundRect(-17,-10,34,15,7);ctx.clip();const g=((t*.7)%1.6-.3)*50-25;ctx.fillStyle='rgba(160,240,255,.55)';ctx.beginPath();ctx.moveTo(g,-10);ctx.lineTo(g+8,-10);ctx.lineTo(g-2,5);ctx.lineTo(g-10,5);ctx.closePath();ctx.fill();ctx.restore();
  ctx.fillStyle='#5ff0ff';for(const s of [-1,1]){ctx.beginPath();ctx.arc(s*7,-3,2.6+Math.sin(t*4)*.5,0,TAU);ctx.fill()}ctx.fillStyle='#1f5a6e';ctx.fillRect(-8,12,16,3)},
 fox(t){for(const s of [-1,1]){ctx.fillStyle='#bff0ff';ctx.beginPath();ctx.moveTo(s*6,-14);ctx.lineTo(s*22,-30);ctx.lineTo(s*21,-6);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#ffd6f5';ctx.beginPath();ctx.moveTo(s*10,-14);ctx.lineTo(s*19,-24);ctx.lineTo(s*18,-11);ctx.closePath();ctx.fill()}
  ctx.fillStyle='#8adfff';ctx.beginPath();ctx.moveTo(-23,-8);ctx.quadraticCurveTo(-22,-20,0,-20);ctx.quadraticCurveTo(22,-20,23,-8);ctx.quadraticCurveTo(20,10,0,20);ctx.quadraticCurveTo(-20,10,-23,-8);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#ffffff';ctx.beginPath();ctx.moveTo(-12,4);ctx.quadraticCurveTo(0,0,12,4);ctx.quadraticCurveTo(6,16,0,20);ctx.quadraticCurveTo(-6,16,-12,4);ctx.fill();ctx.strokeStyle='rgba(42,122,216,.5)';ctx.lineWidth=1.2;for(const [a,b,c,d] of [[-23,-8,-8,-2],[23,-8,8,-2],[0,-20,0,-8]]){ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(c,d);ctx.stroke()}ctx.strokeStyle=INK;ctx.lineWidth=2.5;
  const blink=(t%3)<.12;for(const s of [-1,1]){ctx.fillStyle=INK;ctx.beginPath();ctx.ellipse(s*8,-5,3,blink?.8:4,s*.3,0,TAU);ctx.fill()}blob(0,12,2.6,INK);
  const sp=Math.max(0,Math.sin(t*2.6));ctx.globalAlpha=sp;ctx.fillStyle='#fff';star(14,-16,6*sp,1.4,4);ctx.fill();ctx.globalAlpha=1},
 legend(t){ctx.save();ctx.rotate(t*.4);for(let i=0;i<12;i++){ctx.rotate(TAU/12);ctx.fillStyle=i%2?'rgba(255,230,128,.5)':'rgba(255,255,255,.35)';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(40,-4);ctx.lineTo(40,4);ctx.closePath();ctx.fill()}ctx.restore();
  const p=1+.06*Math.sin(t*3);ctx.save();ctx.scale(p,p);ctx.fillStyle='#ffe680';star(0,4,24,11,5);ctx.fill();ctx.stroke();ctx.restore();face(3,{gap:6,eye:3});cheeks(9,10);
  ctx.save();ctx.translate(0,-21);ctx.fillStyle='#c46aff';ctx.beginPath();ctx.moveTo(-9,4);ctx.lineTo(-11,-6);ctx.lineTo(-4,-1);ctx.lineTo(0,-9);ctx.lineTo(4,-1);ctx.lineTo(11,-6);ctx.lineTo(9,4);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}};
// Frame art around the disc.
const FRAME_ART={
 basic(){frameRing('#ffffff','#dfe6f5')},
 wood(){frameRing('#c88a4a','#8a5326');ctx.strokeStyle='rgba(90,50,20,.55)';ctx.lineWidth=1.5;for(let i=0;i<14;i++){const a=i*TAU/14;ctx.beginPath();ctx.arc(0,0,41.5+(i%3-1)*2.5,a,a+.3);ctx.stroke()}},
 sky(){frameRing('#7cc8ff','#3d8bff');ctx.fillStyle='#fff';ctx.strokeStyle=INK;ctx.lineWidth=1.8;for(let i=0;i<6;i++){const a=i*TAU/6+.3;for(const [o,r] of [[-.1,4.5],[0,6],[.1,4.5]]){ctx.beginPath();ctx.arc(Math.cos(a+o)*44,Math.sin(a+o)*44,r,0,TAU);ctx.fill()}}},
 leaf(){frameRing('#6fd06a','#2f9a3a');for(let i=0;i<10;i++){const a=i*TAU/10;ctx.save();ctx.rotate(a);ctx.translate(0,-45);ctx.rotate(.6);ctx.fillStyle='#9be85a';ctx.strokeStyle=INK;ctx.lineWidth=1.6;ctx.beginPath();ctx.ellipse(0,0,3.5,7,0,0,TAU);ctx.fill();ctx.stroke();ctx.restore()}},
 gold(t){frameRing('#ffe46b','#d99400');for(let i=0;i<16;i++){const side=i<8?-1:1,k=i%8,a=Math.PI/2+side*(.35+k*.32);ctx.save();ctx.translate(Math.cos(a)*42,Math.sin(a)*42);ctx.rotate(a+side*.9);ctx.fillStyle='#fff3a0';ctx.strokeStyle='#8a5a00';ctx.lineWidth=1.3;ctx.beginPath();ctx.ellipse(0,0,2.6,6,0,0,TAU);ctx.fill();ctx.stroke();ctx.restore()}
  const a=t*1.4;ctx.fillStyle='#fff';star(Math.cos(a)*42,Math.sin(a)*42,6,1.5,4);ctx.fill();ctx.globalAlpha=.6;star(Math.cos(a+Math.PI)*42,Math.sin(a+Math.PI)*42,4,1,4);ctx.fill();ctx.globalAlpha=1},
 fire(t){frameRing('#ff8a2a','#c2300a');for(let i=0;i<22;i++){const a=i*TAU/22,f=1+.35*Math.sin(t*11+i*2.3),len=5.5*f;ctx.save();ctx.rotate(a);ctx.fillStyle=i%2?'#ffd23f':'#ff5a1f';ctx.beginPath();ctx.moveTo(-4,-40);ctx.quadraticCurveTo(-3,-40-len,0,-41-len*1.3);ctx.quadraticCurveTo(3,-40-len,4,-40);ctx.closePath();ctx.fill();ctx.restore()}},
 rainbow(t){const g=ctx.createConicGradient?ctx.createConicGradient(t*1.5,0,0):null;const cols=['#ff4d5e','#ff9a1a','#ffd23f','#4fd36b','#44d9ff','#7a3cff','#ff4d5e'];if(g){cols.forEach((c,i)=>g.addColorStop(i/6,c));frameRingFill(g)}else frameRing('#ff9ae6','#a273ff');ctx.fillStyle='#fff';for(let i=0;i<4;i++){const a=t*2+i*TAU/4,tw=.5+.5*Math.sin(t*6+i);star(Math.cos(a)*42,Math.sin(a)*42,3+tw*3,1,4);ctx.fill()}},
 electric(t){frameRing('#3d7bff','#14246a');ctx.strokeStyle='#bff4ff';ctx.lineWidth=2.2;ctx.lineCap='round';const seed=Math.floor(t*14);for(let k=0;k<3;k++){const a0=hash(seed*3.1+k)*TAU;ctx.beginPath();for(let j=0;j<=6;j++){const a=a0+j*.12,r=41.5+(hash(seed+k*7+j)-.5)*12;j?ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r):ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.stroke()}frameGlow('#5ff0ff',.35+.25*Math.sin(t*9))},
 galaxy(t){frameRing('#3a1a7a','#0c0626');ctx.fillStyle='#fff';for(let i=0;i<10;i++){const a=t*.6+i*TAU/10,tw=.4+.6*Math.abs(Math.sin(t*3+i));ctx.globalAlpha=tw;star(Math.cos(a)*42,Math.sin(a)*42,2.5+tw*2,.8,4);ctx.fill()}ctx.globalAlpha=1;const a=-t*1.1;blob(Math.cos(a)*42,Math.sin(a)*42,4.5,'#ff9a3c');ctx.strokeStyle='#ffd8a0';ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(Math.cos(a)*42,Math.sin(a)*42,8,2.5,.4,0,TAU);ctx.stroke()},
 diamond(t){const g=ctx.createLinearGradient(-48,-48,48,48);g.addColorStop(0,'#ffffff');g.addColorStop(.5,'#9fe6ff');g.addColorStop(1,'#3aa8e0');frameRingFill(g);ctx.strokeStyle='rgba(27,18,64,.45)';ctx.lineWidth=1.2;for(let i=0;i<16;i++){const a=i*TAU/16;ctx.beginPath();ctx.moveTo(Math.cos(a)*35.5,Math.sin(a)*35.5);ctx.lineTo(Math.cos(a+TAU/32)*47.5,Math.sin(a+TAU/32)*47.5);ctx.stroke()}
  const a=t*1.8;ctx.save();ctx.globalAlpha=.85;ctx.strokeStyle='#fff';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,41.5,a,a+.5);ctx.stroke();ctx.restore();ctx.fillStyle='#fff';star(Math.cos(a+.25)*41.5,Math.sin(a+.25)*41.5,6,1.4,4);ctx.fill()},
 // Season frames: the tier's metal with its badge at the bottom; the higher the tier, the more it moves.
 sBronze(t){frameRing('#ffd0a0','#8a4a1a');ctx.fillStyle='#ffe0c0';for(let i=0;i<8;i++){const a=i*TAU/8+TAU/16;blob(Math.cos(a)*41.5,Math.sin(a)*41.5,2,'#ffe0c0')}frameShine(t,'rgba(255,240,220,.7)');seasonBadge('#c8783a','#6e3a14')},
 sSilver(t){frameRing('#ffffff','#6a7a98');for(let k=0;k<2;k++){const a=t*1.2+k*Math.PI;ctx.fillStyle='#fff';star(Math.cos(a)*41.5,Math.sin(a)*41.5,5,1.4,4);ctx.fill();ctx.stroke()}frameShine(t,'rgba(255,255,255,.8)');seasonBadge('#c4d0e4','#6a7a98')},
 sGold(t){const f=Math.sin(t*4)*.12;for(const s of [-1,1]){ctx.save();ctx.translate(s*44,-6);ctx.rotate(s*(-.2+f));ctx.fillStyle='#ffd23f';ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(s*10,-14,s*6,-24);ctx.quadraticCurveTo(s*2,-12,-s*4,-6);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}
  frameRing('#fff3a0','#b87a00');ctx.fillStyle='#fff';for(let i=0;i<5;i++){const a=-Math.PI/2+(i-2)*.5,tw=.5+.5*Math.sin(t*4+i);ctx.globalAlpha=tw;star(Math.cos(a)*41.5,Math.sin(a)*41.5,3+tw*2,1,4);ctx.fill()}ctx.globalAlpha=1;seasonBadge('#ffc414','#b87a00')},
 sTitan(t){frameRing('#d8fbff','#1f5a6e');frameGlow('#5fe8ff',.25+.2*Math.sin(t*3));ctx.lineWidth=1.4;for(let i=0;i<6;i++){const a=i*TAU/6+t*.3;ctx.save();ctx.translate(Math.cos(a)*41.5,Math.sin(a)*41.5);ctx.rotate(a);ctx.fillStyle='#bff4ff';ctx.beginPath();for(let k=0;k<6;k++)ctx.lineTo(Math.cos(k*TAU/6)*4,Math.sin(k*TAU/6)*4);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}ctx.lineWidth=2.5;seasonBadge('#5fb8c8','#1f5a6e')},
 sDiamond(t){const g=ctx.createLinearGradient(-48,-48,48,48);g.addColorStop(0,'#ffffff');g.addColorStop(.5,'#7fe0ff');g.addColorStop(1,'#2a7ad8');frameRingFill(g);ctx.strokeStyle='rgba(27,18,64,.4)';ctx.lineWidth=1.2;for(let i=0;i<20;i++){const a=i*TAU/20;ctx.beginPath();ctx.moveTo(Math.cos(a)*35.5,Math.sin(a)*35.5);ctx.lineTo(Math.cos(a+TAU/40)*47.5,Math.sin(a+TAU/40)*47.5);ctx.stroke()}ctx.strokeStyle=INK;ctx.lineWidth=2.5;
  for(let i=0;i<4;i++){const a=i*TAU/4-Math.PI/4,tw=.6+.4*Math.sin(t*3+i);ctx.save();ctx.translate(Math.cos(a)*42,Math.sin(a)*42);ctx.rotate(a);ctx.fillStyle='#e8fbff';ctx.beginPath();ctx.moveTo(0,-6*tw-2);ctx.lineTo(4,0);ctx.lineTo(0,6*tw+2);ctx.lineTo(-4,0);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}frameShine(t*1.4,'rgba(255,255,255,.9)');seasonBadge('#7fe0ff','#2a7ad8')},
 legend(t){const g=ctx.createConicGradient?ctx.createConicGradient(t*1.2,0,0):null;if(g){['#c46aff','#ffe680','#ff7ad9','#7a3cff','#ffe680','#c46aff'].forEach((c,i,a)=>g.addColorStop(i/(a.length-1),c));frameRingFill(g)}else frameRing('#ffe680','#7a3cff');
  ctx.fillStyle='#fff';for(let i=0;i<8;i++){const a=-t*.8+i*TAU/8,tw=.4+.6*Math.abs(Math.sin(t*3+i));ctx.globalAlpha=tw;star(Math.cos(a)*41.5,Math.sin(a)*41.5,2+tw*3,1,4);ctx.fill()}ctx.globalAlpha=1;frameGlow('#ffe680',.2+.15*Math.sin(t*4));
  ctx.save();ctx.translate(0,-46);ctx.fillStyle='#ffd23f';ctx.beginPath();ctx.moveTo(-11,5);ctx.lineTo(-13,-7);ctx.lineTo(-5,-1);ctx.lineTo(0,-10);ctx.lineTo(5,-1);ctx.lineTo(13,-7);ctx.lineTo(11,5);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();seasonBadge('#c46aff','#3a1580',true)}};
function frameRingPath(){ctx.beginPath();ctx.arc(0,0,48,0,TAU);ctx.arc(0,0,35,0,TAU,true)}
function frameRingFill(fill){frameRingPath();ctx.fillStyle=fill;ctx.fill('evenodd');ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,0,48,0,TAU);ctx.stroke();ctx.beginPath();ctx.arc(0,0,35,0,TAU);ctx.stroke()}
function frameRing(a,b,alpha=1){const g=ctx.createLinearGradient(0,-48,0,48);g.addColorStop(0,a);g.addColorStop(1,b);ctx.save();ctx.globalAlpha=alpha;frameRingFill(g);ctx.restore();ctx.save();ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,44,-2.6,-1.4);ctx.stroke();ctx.restore()}
// A gleam running round the ring, and the little tier shield at the bottom of season frames.
function frameShine(t,color){const a=t*1.6;ctx.save();ctx.strokeStyle=color;ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.arc(0,0,41.5,a,a+.45);ctx.stroke();ctx.restore()}
function seasonBadge(a,b,starred=false){ctx.save();ctx.translate(0,44);const g=ctx.createLinearGradient(0,-9,0,10);g.addColorStop(0,a);g.addColorStop(1,b);ctx.fillStyle=g;ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(9,-6);ctx.lineTo(9,1);ctx.quadraticCurveTo(8,7,0,11);ctx.quadraticCurveTo(-8,7,-9,1);ctx.lineTo(-9,-6);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#fff';star(0,0,starred?5.5:4.5,starred?2.2:1.8,5);ctx.fill();ctx.restore()}
function frameGlow(color,alpha){ctx.save();ctx.globalAlpha=Math.max(0,alpha);ctx.strokeStyle=color;ctx.lineWidth=8;ctx.beginPath();ctx.arc(0,0,41.5,0,TAU);ctx.stroke();ctx.restore()}
// Draw an avatar with its frame into a 2D context at the given pixel size.
function paintAvatar(c,px,look,t){const main=ctx,a=AVATARS[look.avatar]||AVATARS.sunny,f=FRAME_ART[look.frame]||FRAME_ART.basic,k=px/100;ctx=c;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,px,px);c.setTransform(k,0,0,k,px/2,px/2);c.lineJoin='round';c.lineCap='round';
 const g=c.createRadialGradient(-10,-14,4,0,0,36);g.addColorStop(0,a.bg[0]);g.addColorStop(1,a.bg[1]);c.save();c.beginPath();c.arc(0,0,35.5,0,TAU);c.clip();c.fillStyle=g;c.fillRect(-36,-36,72,72);c.strokeStyle=INK;c.lineWidth=2.5;(AVATAR_ART[look.avatar]||AVATAR_ART.sunny)(t);c.restore();
 c.strokeStyle=INK;c.lineWidth=2.5;f(t);ctx=main}
// Avatar canvases; animated ones are redrawn every frame while they are on screen.
const liveAvatars=new Set();
function avatarEl(look,size=32,cls=''){const cv=document.createElement('canvas'),px=Math.round(size*Math.min(2,devicePixelRatio||1)),lk={avatar:look&&look.avatar,frame:look&&look.frame};cv.width=cv.height=px;cv.className='avatar-cv '+cls;cv.style.width=cv.style.height=size+'px';cv._look=lk;paintAvatar(cv.getContext('2d'),px,lk,performance.now()/1000);
 if((AVATARS[lk.avatar]||{}).anim||(FRAMES[lk.frame]||{}).anim)liveAvatars.add(cv);return cv}
function renderLiveAvatars(){if(!liveAvatars.size)return;const t=performance.now()/1000;for(const cv of liveAvatars){if(!cv.isConnected){liveAvatars.delete(cv);continue}paintAvatar(cv.getContext('2d'),cv.width,cv._look,t)}}
// A player name, gold and shimmering for players who bought the gold name, with their clan tag.
function nameEl(name,gold,tag,cls='rank-name'){const b=el('b',cls+(gold?' gold-name':''),name||'Player');if(tag){const s=el('small','clan-tag',`[${tag}]`);b.prepend(s)}return b}

// ---- Profile panel: pick or buy avatars, frames and the gold name ----
// Tapping an item you own equips it; tapping a gem item you don't own tries it on: the big avatar at the top
// shows it, animated, with a BUY button, so players can see exactly how it looks before buying.
let profileTab='avatars',cosPreview=null;
function renderProfile(){const list=$('#panel-list'),c=myCos(),look=myLook(),scroll=list.scrollTop,pv=cosPreview,shown={...look,...(pv?pv.look:{})};$('#panel-title').textContent='PROFILE';list.replaceChildren();
 const head=el('div','profile-head'+(pv?' previewing':'')),info=el('div','profile-info'),big=el('div','profile-big');big.append(avatarEl(shown,pv?110:92,'big'));if(pv)big.append(el('span','preview-tag','PREVIEW'));head.append(big);
 const name=typeof online!=='undefined'?online.displayName():'Player';info.append(nameEl(name,shown.gold,save.clan&&save.clan.tag,'profile-name'));
 if(pv&&pv.season){info.append(el('small','profile-note',pv.name),el('small','profile-note',seasonGoal(pv.tier)));const back=el('button','mini-btn','STOP PREVIEW');back.onclick=()=>{cosPreview=null;renderProfile()};info.append(back)}
 else if(pv){info.append(el('small','profile-note',`${pv.name} · ${pv.price} GEMS`));const buy=el('button','buy big gem');buy.innerHTML=`BUY ${iconHTML('gem')}${pv.price}`;buy.onclick=()=>{if((save.gems||0)<pv.price){buy.classList.remove('nope');void buy.offsetWidth;buy.classList.add('nope');gameSound.effect('warn');buy.innerHTML=`NEED ${iconHTML('gem')}${pv.price-(save.gems||0)}`;return}save.gems-=pv.price;pv.apply();cosPreview=null;gameSound.effect('buy');confetti(24);cosChanged()};
  const back=el('button','mini-btn','STOP PREVIEW');back.onclick=()=>{cosPreview=null;renderProfile()};info.append(buy,back)}
 else{const bestAll=Math.max(0,...Object.values(save.scores||{})),stars=Object.values(save.stars||{}).reduce((a,b)=>a+b,0);info.append(el('small','',`BEST ${bestAll.toLocaleString()} · ${stars} STARS`));if(save.clan)info.append(el('small','profile-clan',`CLAN: ${save.clan.name}`));
  if(typeof online!=='undefined'&&online.configured()){if(online.user){const rn=el('button','mini-btn','RENAME');rn.onclick=()=>{const n=prompt('Your name (up to 16 letters)',online.displayName());if(n!==null)online.rename(n).then(renderProfile)};info.append(rn)}else info.append(el('small','profile-note','Sign in so other players can see your look.'))}}
 const w=el('div','wallets'),gp=el('div','pill gem-pill');gp.innerHTML=iconHTML('gem');gp.append(el('b','',(save.gems||0).toLocaleString()));w.append(gp);info.append(w);
 head.append(info);list.append(head);
 const tabs=el('div','tabs rank-tabs');for(const [id,label,ic] of [['avatars','AVATARS','balloon'],['frames','FRAMES','star'],['name','NAME','crown']]){const b=el('button','tab'+(profileTab===id?' on':''));b.innerHTML=iconHTML(ic)+label;b.onclick=()=>{profileTab=id;renderProfile()};tabs.append(b)}list.append(tabs);
 if(profileTab==='name'){const box=el('div','name-shop');for(const gold of [false,true]){const owned=!gold||c.goldOwned,on=look.gold===gold&&!pv,trying=pv&&pv.id==='goldname'&&gold,card=el('button','cos-card'+(on?' on':'')+(owned?'':' locked')+(trying?' trying':''));card.append(nameEl(name,gold,'','name-preview'),el('small','',gold?'GOLD NAME':'WHITE NAME'),priceTag(gold?GOLD_NAME_PRICE:0,owned,on,trying));
   card.onclick=()=>{if(!owned){cosPreview={id:'goldname',name:'GOLD NAME',price:GOLD_NAME_PRICE,look:{gold:true},apply(){c.goldOwned=true;c.gold=true}};gameSound.effect('on');renderProfile();list.scrollTop=0;return}cosPreview=null;gameSound.effect('on');c.gold=gold;cosChanged()};box.append(card)}
  list.append(box,el('p','rank-note','A gold name shines on the leaderboards, in your clan and on your profile. Tap it to try it on.'));list.scrollTop=scroll;return}
 const cat=profileTab==='avatars'?AVATARS:FRAMES,grid=el('div','cos-grid');
 for(const [id,item] of Object.entries(cat)){const owned=ownsCos(id),on=(profileTab==='avatars'?look.avatar:look.frame)===id&&!pv,trying=pv&&pv.id===id,card=el('button','cos-card'+(on?' on':'')+(owned?'':' locked')+(item.anim?' anim':'')+(item.season?' season':'')+(trying?' trying':''));
  card.append(avatarEl(profileTab==='avatars'?{avatar:id,frame:look.frame}:{avatar:look.avatar,frame:id},64),el('small','',item.name),priceTag(item.gems||0,owned,on,trying,item.season));
  card.onclick=()=>{const isAvatar=profileTab==='avatars';if(!owned){cosPreview={id,name:item.name.toUpperCase(),price:item.gems,season:item.season&&SEASON_NAMES[item.season],tier:item.season,look:isAvatar?{avatar:id}:{frame:id},apply(){c.own.push(id);if(isAvatar)c.avatar=id;else c.frame=id}};gameSound.effect('on');renderProfile();list.scrollTop=0;return}
   cosPreview=null;gameSound.effect('on');if(isAvatar)c.avatar=id;else c.frame=id;cosChanged()};grid.append(card)}
 list.append(grid,el('p','rank-note','Tap any gem item to try it on. Gems come from the weekly top 10, tasks and seasons. Trophy items are season rewards: finish a season in that rank to win them.'));list.scrollTop=scroll}
function priceTag(gems,owned,on,trying,season){const s=el('span','cos-price'+(on?' on':owned?' own':'')+(trying?' trying':'')+(season&&!owned?' season':''));if(on)s.textContent='IN USE';else if(owned)s.textContent=gems||season?'OWNED':'FREE';else if(trying)s.textContent='TRYING ON';else if(season)s.innerHTML=iconHTML('trophy')+SEASON_NAMES[season];else s.innerHTML=iconHTML('gem')+gems;return s}
function cosShort(card,need){card.classList.remove('nope');void card.offsetWidth;card.classList.add('nope');gameSound.effect('warn');const p=card.querySelector('.cos-price');if(p){const old=p.innerHTML;p.innerHTML=`NEED ${iconHTML('gem')}${need-(save.gems||0)}`;setTimeout(()=>{if(p.isConnected)p.innerHTML=old},1200)}}
function cosChanged(){persist();refreshMeta();renderProfile();if(typeof online!=='undefined')online.publish();if(typeof refreshOnline==='function')refreshOnline(false)}
refreshMeta();
