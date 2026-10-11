'use strict';
// Boxes and skin cards.
// A box holds coins, sometimes gems (rare) and stacks of skin cards. EPIC, LEGENDARY and MYTHIC skins are not sold:
// collecting CARD_NEED cards of one unlocks it, and the rarer the skin, the more cards it needs and the rarer its
// cards are. Boxes are bought in the store (BOXES tab), won from BOX TASKS (three days a week, season.js), paid for
// clearing a stage goal the first time and sometimes found floating in the sky. Won and found boxes wait in the
// store until opened; opening one plays a full-screen show that reveals the rewards one by one.
const CARD_NEED={epic:10,legendary:20,mythic:30};
// Spare cards (for a skin that is already unlocked, or more than it needs) turn into coins.
const CARD_DUP={epic:15,legendary:40,mythic:80};
const CARD_RANK={epic:1,legendary:2,mythic:3};
const isCardSkin=id=>!!SKINS[id]&&!!CARD_NEED[SKINS[id].rarity];
const cardsOf=id=>(save.cards||{})[id]||0;
// coins: range; gems: [chance, min, max]; stacks: card stacks per box with the odds of each rarity and how many
// cards a stack holds; sure: the Legend Box's first stack is always legendary or better (this chance of mythic).
const BOXES={
 sky:{name:'SKY BOX',price:{coins:250},coins:[60,140],gems:[.03,1,2],stacks:2,odds:{epic:.76,legendary:.2,mythic:.04},amt:{epic:[2,4],legendary:[1,3],mythic:[1,2]},body:['#a6e4ff','#3d9bff','#1f4fb0'],trim:['#fff3a0','#ffc21a','#b87400'],glow:'#7cd0ff',emblem:'cloud'},
 storm:{name:'STORM BOX',price:{coins:750},coins:[180,360],gems:[.08,2,4],stacks:3,odds:{epic:.55,legendary:.35,mythic:.1},amt:{epic:[3,6],legendary:[2,4],mythic:[1,3]},body:['#dcc0ff','#8a4cff','#3c1890'],trim:['#ffffff','#c9d3ec','#6f7a9c'],glow:'#b98cff',emblem:'bolt'},
 legend:{name:'LEGEND BOX',price:{gems:40},coins:[400,800],gems:[.12,3,6],stacks:4,sure:.25,odds:{epic:.3,legendary:.45,mythic:.25},amt:{epic:[5,8],legendary:[3,6],mythic:[2,4]},body:['#ffa898','#e8402a','#8a1410'],trim:['#fff6b8','#ffd23f','#c98a00'],glow:'#ffcf4a',emblem:'crown'}};
const BOX_ORDER=['sky','storm','legend'];
// The box for clearing each stage's goal the first time.
const GOAL_BOX={sky:'sky',jungle:'sky',cave:'storm',factory:'storm',space:'storm',universe:'legend'};
const boxCount=k=>(save.boxes||{})[k]||0;
const boxTotal=()=>BOX_ORDER.reduce((n,k)=>n+boxCount(k),0);
function addBox(kind,n=1){save.boxes={...(save.boxes||{}),[kind]:boxCount(kind)+n};persist();refreshMeta()}
function refreshBoxUi(){const d=$('#store-dot'),n=boxTotal();if(!d)return;d.hidden=!n;d.textContent=n>9?'9+':n}

// ---- Rolling ----
const rint=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
function pickOdds(o){let r=Math.random();for(const k in o){r-=o[k];if(r<0)return k}return Object.keys(o)[0]}
// Cards go to a locked skin of the rolled rarity: usually the one closest to unlocking, sometimes any of them.
function cardTarget(rar,extra){const left=id=>CARD_NEED[rar]-cardsOf(id)-(extra[id]||0),open=SKIN_ORDER.filter(id=>SKINS[id].rarity===rar&&!save.skins.includes(id)&&left(id)>0);
 if(!open.length)return null;if(Math.random()<.6){const most=Math.min(...open.map(left));return pick(open.filter(id=>left(id)===most))}return pick(open)}
function rollBox(kind){const B=BOXES[kind],coins={type:'coins',n:rint(...B.coins),spare:0},items=[coins],extra={},cards={};
 if(Math.random()<B.gems[0])items.push({type:'gems',n:rint(B.gems[1],B.gems[2])});
 for(let k=0;k<B.stacks;k++){const rar=k===0&&B.sure?(Math.random()<B.sure?'mythic':'legendary'):pickOdds(B.odds),id=cardTarget(rar,extra);let n=rint(...B.amt[rar]);
  if(!id){coins.spare+=n*CARD_DUP[rar];continue}const room=CARD_NEED[rar]-cardsOf(id)-(extra[id]||0);if(n>room){coins.spare+=(n-room)*CARD_DUP[rar];n=room}
  extra[id]=(extra[id]||0)+n;if(cards[id])cards[id].n+=n;else cards[id]={type:'card',id,rar,n}}
 coins.n+=coins.spare;
 // Rarest last, so the best card is the final reveal.
 items.push(...Object.values(cards).sort((a,b)=>CARD_RANK[a.rar]-CARD_RANK[b.rar]||a.n-b.n));return items}
// Rewards are saved before the show starts, so closing the game mid-show loses nothing.
function applyBox(items){save.cards={...(save.cards||{})};
 for(const it of items){if(it.type==='coins')save.coins+=it.n;else if(it.type==='gems')save.gems=(save.gems||0)+it.n;
  else{it.from=cardsOf(it.id);it.to=it.from+it.n;save.cards[it.id]=it.to;if(it.to>=CARD_NEED[it.rar]&&!save.skins.includes(it.id)){save.skins.push(it.id);it.unlock=true}}}
 save.boxesOpened=(save.boxesOpened||0)+1;persist();refreshMeta()}
// src: 'stock' (a box you have), 'buy' (pay for it now) or 'gift' (a reward opened straight away).
function openBox(kind,src='stock'){const B=BOXES[kind];if(boxRun||!B)return false;
 if(src==='stock'){if(boxCount(kind)<1)return false;save.boxes={...save.boxes,[kind]:boxCount(kind)-1}}
 else if(src==='buy'){if(B.price.gems){if((save.gems||0)<B.price.gems)return false;save.gems-=B.price.gems}else{if(save.coins<B.price.coins)return false;save.coins-=B.price.coins}}
 const items=rollBox(kind);applyBox(items);startBoxShow(kind,items);return true}

// ---- Boxes from stages ----
function goalBox(id){const k=GOAL_BOX[id]||'sky';addBox(k);runBoxes.push(k);setTimeout(()=>{if(state==='flying')popup(x*W,balloonY()-140,`+1 ${BOXES[k].name}`,'#7ef08f',24)},1200)}
// A mystery box floats by in about a third of runs (at most two a day), sometime in the first two and a half minutes.
function skyBoxRoll(){const f=save.boxFound&&save.boxFound.day===todayId()?save.boxFound.n:0;return f<2&&Math.random()<.35?rand(40,150):0}
function foundSkyBox(){const d=todayId();save.boxFound={day:d,n:(save.boxFound&&save.boxFound.day===d?save.boxFound.n:0)+1};addBox('sky');runBoxes.push('sky')}
function drawSkyBox(cx,cy){const g=ctx.createRadialGradient(cx,cy,4,cx,cy,66),pulse=.6+.25*Math.sin(t*5);g.addColorStop(0,`rgba(255,240,160,${pulse})`);g.addColorStop(1,'rgba(255,240,160,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,66,0,TAU);ctx.fill();
 ctx.save();ctx.translate(cx,cy+25);ctx.rotate(Math.sin(t*3)*.08);drawBoxArt(ctx,'sky',0,0,.36);ctx.restore();
 for(let k=0;k<3;k++){const a=t*2.4+k*TAU/3;ctx.fillStyle='#fff6b0';ctx.strokeStyle=BX_INK;ctx.lineWidth=1.5;starPath(ctx,cx+Math.cos(a)*44,cy+Math.sin(a)*30,7,2.8);ctx.fill();ctx.stroke()}}

// ---- Drawing: boxes ----
const BX_INK='#1b1240';
function hexA(hex,a){const n=parseInt(hex.slice(1),16);return `rgba(${n>>16},${n>>8&255},${n&255},${a})`}
function hueHex(h,l=.68){const f=n=>{const k=(n+h/30)%12,c=l-.5*Math.min(l,1-l)*2*Math.max(-1,Math.min(k-3,9-k,1));return Math.round(c*255).toString(16).padStart(2,'0')};return '#'+f(0)+f(8)+f(4)}
function starPath(c,x,y,r,ri,n=5,rot=-Math.PI/2){c.beginPath();for(let i=0;i<n*2;i++){const a=rot+i*Math.PI/n,rr=i%2?ri:r;c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}c.closePath()}
function rrect(c,x,y,w,h,r){c.beginPath();c.roundRect?c.roundRect(x,y,w,h,r):c.rect(x,y,w,h)}
function vgrad(c,y0,y1,stops){const g=c.createLinearGradient(0,y0,0,y1);stops.forEach((s,i)=>g.addColorStop(i/(stops.length-1),s));return g}
function lidPath(c){c.beginPath();c.moveTo(-90,0);c.lineTo(-90,-22);c.bezierCurveTo(-90,-54,-52,-64,0,-64);c.bezierCurveTo(52,-64,90,-54,90,-22);c.lineTo(90,0);c.closePath()}
function emblem(c,kind){c.lineWidth=3;c.strokeStyle=BX_INK;
 if(kind==='cloud'){c.fillStyle='#fff';c.beginPath();c.arc(-8,3,8,0,TAU);c.arc(9,3,8,0,TAU);c.fill();c.stroke();c.beginPath();c.arc(1,-4,10,0,TAU);c.fill();c.stroke();c.fillRect(-8,0,17,11);c.beginPath();c.moveTo(-15,10);c.lineTo(16,10);c.stroke()}
 else if(kind==='bolt'){c.beginPath();c.moveTo(4,-17);c.lineTo(-10,3);c.lineTo(-1,3);c.lineTo(-5,17);c.lineTo(10,-4);c.lineTo(1,-4);c.closePath();c.fillStyle='#ffe14d';c.fill();c.stroke()}
 else{c.beginPath();c.moveTo(-14,10);c.lineTo(-16,-8);c.lineTo(-7,0);c.lineTo(0,-14);c.lineTo(7,0);c.lineTo(16,-8);c.lineTo(14,10);c.closePath();c.fillStyle='#ffd23f';c.fill();c.stroke();for(const gx of [-8,0,8]){c.beginPath();c.arc(gx,4,2.6,0,TAU);c.fillStyle=gx?'#44d9ff':'#ff4d5e';c.fill()}}}
// The lid, drawn from the middle of its bottom edge.
function drawBoxLid(c,kind){const B=BOXES[kind];c.save();lidPath(c);c.fillStyle=vgrad(c,-64,0,[B.body[0],B.body[1]]);c.fill();c.save();c.clip();
 c.fillStyle=vgrad(c,-64,0,B.trim);for(const sx of [-52,52])c.fillRect(sx-10,-70,20,70);c.strokeStyle=BX_INK;c.lineWidth=3;for(const sx of [-62,-42,42,62]){c.beginPath();c.moveTo(sx,-70);c.lineTo(sx,0);c.stroke()}
 c.fillStyle='rgba(255,255,255,.45)';c.beginPath();c.ellipse(-30,-44,24,8,-.25,0,TAU);c.fill();c.restore();
 lidPath(c);c.lineWidth=5;c.strokeStyle=BX_INK;c.stroke();
 rrect(c,-93,-12,186,15,6);c.fillStyle=vgrad(c,-12,3,B.trim);c.fill();c.lineWidth=4;c.stroke();
 if(kind==='legend')for(const gx of [-72,0,72]){c.beginPath();c.moveTo(gx,-12);c.lineTo(gx+6,-5);c.lineTo(gx,3);c.lineTo(gx-6,-5);c.closePath();c.fillStyle=gx?'#44d9ff':'#ff4d5e';c.fill();c.lineWidth=2;c.stroke()}
 c.restore()}
// The body, drawn from the middle of its bottom edge; open shows the glowing inside.
function drawBoxBody(c,kind,open,glowCol){const B=BOXES[kind];c.save();
 if(open){c.beginPath();c.ellipse(0,-94,84,15,0,0,TAU);c.fillStyle=BX_INK;c.fill();const g=c.createRadialGradient(0,-96,2,0,-96,80);g.addColorStop(0,'#fff');g.addColorStop(.4,glowCol);g.addColorStop(1,hexA(glowCol.length===7?glowCol:'#ffffff',0));c.fillStyle=g;c.beginPath();c.ellipse(0,-95,80,13,0,0,TAU);c.fill()}
 rrect(c,-86,-94,172,94,[6,6,16,16]);c.fillStyle=vgrad(c,-94,0,[B.body[1],B.body[2]]);c.fill();c.save();c.clip();
 c.fillStyle=hexA('#000000',.18);c.fillRect(-90,-16,180,16);c.strokeStyle=hexA('#000000',.28);c.lineWidth=3;c.beginPath();c.moveTo(-86,-50);c.lineTo(86,-50);c.stroke();
 c.fillStyle='rgba(255,255,255,.16)';c.fillRect(-78,-90,16,84);
 c.fillStyle=vgrad(c,-94,0,B.trim);for(const sx of [-52,52])c.fillRect(sx-10,-96,20,96);c.strokeStyle=BX_INK;c.lineWidth=3;for(const sx of [-62,-42,42,62]){c.beginPath();c.moveTo(sx,-96);c.lineTo(sx,0);c.stroke()}
 for(const sx of [-52,52])for(const ry of [-76,-26]){c.beginPath();c.arc(sx,ry,3.2,0,TAU);c.fillStyle='#fff';c.fill();c.lineWidth=2;c.stroke()}c.restore();
 rrect(c,-86,-94,172,94,[6,6,16,16]);c.lineWidth=5;c.strokeStyle=BX_INK;c.stroke();
 rrect(c,-23,-82,46,48,10);c.fillStyle=vgrad(c,-82,-34,B.trim);c.fill();c.lineWidth=4;c.stroke();c.save();c.translate(0,-58);emblem(c,B.emblem);c.restore();
 c.restore()}
// A whole box: x,y is the middle of its bottom edge. lift raises the lid a little; lidOff leaves it out.
function drawBoxArt(c,kind,x,y,s,{lift=0,lidOff=false,open=false,glowCol='#ffffff',sx=1,sy=1,rot=0}={}){c.save();c.translate(x,y);c.rotate(rot);c.scale(s*sx,s*sy);c.lineJoin='round';c.lineCap='round';
 c.fillStyle='rgba(0,0,0,.25)';c.beginPath();c.ellipse(0,2,96/sx,13,0,0,TAU);c.fill();
 drawBoxBody(c,kind,open,glowCol);if(!lidOff){c.save();c.translate(0,-94-lift);drawBoxLid(c,kind);c.restore()}c.restore()}

// ---- Drawing: reward cards ----
const RAR_COL={coins:['#fff3a0','#ffb300'],gems:['#ffc4f2','#c81f8f'],epic:['#dcc0ff','#7a3cf0'],legendary:['#ffe27a','#ff8a00'],mythic:['#ffb8ee','#b020d0']};
const rarOf=it=>it.type==='card'?it.rar:it.type;
function itemCol(it,now){if(rarOf(it)==='mythic'){const h=now*90%360;return [hueHex(h,.78),hueHex((h+60)%360,.5)]}return RAR_COL[rarOf(it)]}
const itemLabel=it=>it.type==='card'?(RARITY[it.rar]||{}).name||'CARD':it.type==='gems'?'RARE GEMS!':'COINS';
const itemName=it=>it.type==='card'?SKINS[it.id].name.toUpperCase():'';
function drawGem(c,k){c.save();c.scale(k,k);c.beginPath();c.moveTo(-14,-23);c.lineTo(14,-23);c.lineTo(27,-7);c.lineTo(0,26);c.lineTo(-27,-7);c.closePath();c.fillStyle=vgrad(c,-23,26,['#ffc4f2','#c81f8f']);c.fill();c.lineWidth=3.5;c.strokeStyle=BX_INK;c.stroke();
 c.lineWidth=2;c.beginPath();c.moveTo(-27,-7);c.lineTo(27,-7);c.moveTo(-14,-23);c.lineTo(-7,-7);c.lineTo(0,26);c.lineTo(7,-7);c.lineTo(14,-23);c.moveTo(-7,-7);c.lineTo(0,-23);c.lineTo(7,-7);c.stroke();
 c.fillStyle='rgba(255,255,255,.5)';c.beginPath();c.moveTo(-7,-7);c.lineTo(0,-23);c.lineTo(7,-7);c.closePath();c.fill();c.restore()}
function cardArt(c,it,w,h,now,pose){if(it.type==='coins'){const main=ctx;ctx=c;const r=w*.13;for(const [px,py] of [[-1.5,.9],[0,.9],[1.5,.9],[-.75,-.15],[.75,-.15],[0,-1.2]])drawCoin(px*r*1.25,py*r*1.15+h*.02,r,now*2+px,false);ctx=main}
 else if(it.type==='gems'){for(const [px,py,k] of [[-.2,.08,.9],[.2,.1,.85],[0,-.02,1.3]]){c.save();c.translate(px*w,py*h);drawGem(c,w/190*k);c.restore()}}
 else{const main=ctx;ctx=c;c.save();c.translate(0,h*.04);const k=w/190*1.45;c.scale(k,k);drawSkinShow(it.id,now,pose,0);c.restore();ctx=main}}
function drawCardBack(c,it,w,h,now){const [a,b]=itemCol(it,now);rrect(c,-w/2,-h/2,w,h,16);c.fillStyle=vgrad(c,-h/2,h/2,[b,BX_INK]);c.fill();
 c.save();rrect(c,-w/2,-h/2,w,h,16);c.clip();c.strokeStyle=hexA('#ffffff',.1);c.lineWidth=10;for(let d=-h;d<w+h;d+=26){c.beginPath();c.moveTo(-w/2+d,-h/2);c.lineTo(-w/2+d-h,h/2);c.stroke()}c.restore();
 rrect(c,-w/2+9,-h/2+9,w-18,h-18,10);c.lineWidth=3;c.strokeStyle=a;c.stroke();rrect(c,-w/2,-h/2,w,h,16);c.lineWidth=5;c.strokeStyle=BX_INK;c.stroke();
 c.beginPath();c.arc(0,0,w*.22,0,TAU);c.fillStyle=a;c.fill();c.lineWidth=4;c.stroke();bxText(c,'?',0,w*.015,w*.3,'#fff')}
function drawCardFront(c,it,w,h,now,{count=it.n,pose=1}={}){const [a,b]=itemCol(it,now);rrect(c,-w/2,-h/2,w,h,16);c.fillStyle=vgrad(c,-h/2,h/2,[a,b]);c.fill();
 c.save();rrect(c,-w/2+9,-h/2+30,w-18,h-78,10);const g=c.createRadialGradient(0,-h*.05,4,0,-h*.05,w*.6);g.addColorStop(0,'#ffffff');g.addColorStop(1,a);c.fillStyle=g;c.fill();c.clip();cardArt(c,it,w,h,now,pose);c.restore();
 rrect(c,-w/2+9,-h/2+30,w-18,h-78,10);c.lineWidth=3;c.strokeStyle=BX_INK;c.stroke();rrect(c,-w/2,-h/2,w,h,16);c.lineWidth=5;c.stroke();
 bxText(c,itemLabel(it),0,-h/2+16,Math.min(18,w*.095),'#fff');const nm=itemName(it),amt=`+${count.toLocaleString()}${it.type==='card'?(it.n>1?' CARDS':' CARD'):''}`;
 if(nm){bxText(c,nm,0,h/2-36,Math.min(20,w*1.5/Math.max(8,nm.length)),'#fff');bxText(c,amt,0,h/2-14,Math.min(22,w*.12),'#fff6b0')}else bxText(c,amt,0,h/2-25,Math.min(34,w*.18),'#fff6b0')}
function bxText(c,txt,x,y,size,fill,{align='center',lw=size*.24,alpha=1}={}){c.save();c.globalAlpha*=alpha;c.font=`${Math.round(size)}px ${FONT}`;c.textAlign=align;c.textBaseline='middle';c.lineJoin='round';c.lineWidth=lw;c.strokeStyle=BX_INK;c.strokeText(txt,x,y);c.fillStyle=fill;c.fillText(txt,x,y);c.restore()}
function bxRays(c,x,y,r,rot,col,alpha,n=16){c.save();c.translate(x,y);c.rotate(rot);c.globalAlpha=alpha;const g=c.createRadialGradient(0,0,0,0,0,r);g.addColorStop(0,hexA(col,.9));g.addColorStop(1,hexA(col,0));c.fillStyle=g;c.beginPath();for(let i=0;i<n;i++){const a=i/n*TAU;c.moveTo(0,0);c.arc(0,0,r,a,a+TAU/n/2);c.closePath()}c.fill();c.restore()}

// ---- The opening show ----
// Phases: enter (the box drops in and bounces), idle (tap to open), charge (it shakes and light leaks out), burst
// (the lid blasts off), item (each reward flies out face down, the rarer ones tease longer, then flip and count up;
// a card fills its bar and a completed set unlocks the skin with its pose), summary (everything won, OPEN NEXT or OK).
let boxRun=null;
const easeBack=k=>{const s=1.7;k--;return k*k*((s+1)*k+s)+1};
function boxLayout(){const cv=$('#box-cv'),W=cv.clientWidth||360,H=cv.clientHeight||640,s=clamp(Math.min(W/380,H/680),.6,1.4),cw=clamp(Math.min(W*.52,H*.3),140,230);return {W,H,s,cx:W/2,gy:H*.8,cardY:H*.4,cw,ch:cw*1.36}}
function startBoxShow(kind,items){const ov=$('#box-open'),cv=$('#box-cv');ov.hidden=false;$('#bo-sum').hidden=true;$('#bo-btns').hidden=true;$('#bo-skip').hidden=false;$('#bo-name').textContent=BOXES[kind].name;
 const dpr=Math.min(2,devicePixelRatio||1);cv.width=Math.round(cv.clientWidth*dpr);cv.height=Math.round(cv.clientHeight*dpr);const L=boxLayout();
 boxRun={kind,items,phase:'enter',t:0,age:0,y:-(L.gy+150),vy:0,sq:0,sqv:0,shake:0,flash:0,flashCol:'#fff',lid:null,idx:-1,card:null,leave:null,parts:[],dpr,last:performance.now(),banner:null};
 gameSound.effect('whoosh');requestAnimationFrame(boxFrame)}
function boxFrame(now){const R=boxRun;if(!R)return;const dt=Math.min(.04,(now-R.last)/1000||0);R.last=now;R.t+=dt;R.age+=dt;try{boxUpdate(R,dt,now/1000);boxDraw(R,now/1000)}catch(e){console.error(e)}requestAnimationFrame(boxFrame)}
function bxPart(R,o){R.parts.push({life:0,max:1,g:0,drag:.6,rot:rand(0,TAU),vr:rand(-6,6),size:5,type:'spark',...o})}
function bxBurst(R,x,y,n,cols,{speed=[150,520],up=0,size=[4,9],types=['star','confetti','spark'],g=500}={}){for(let i=0;i<n;i++){const a=rand(0,TAU),v=rand(...speed);bxPart(R,{x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-up,g,max:rand(.7,1.4),size:rand(...size),color:pick(cols),type:pick(types)})}}
const RANK_COLS=[['#ffd23f','#fff3a0','#ffffff'],['#c79cff','#8a4cff','#ffffff'],['#ffd23f','#ff9a1a','#ffffff'],['#ff5e7a','#ffd23f','#5fe36b','#44d9ff','#a273ff','#ffffff']];
const itemRank=it=>it.type==='card'?CARD_RANK[it.rar]:it.type==='gems'?1:0;
// How long a face-down card shakes before it flips: the rarer, the longer.
const TEASE=[.12,.3,.6,1];
function boxUpdate(R,dt,now){const L=boxLayout(),{s,gy,cx}=L;
 R.flash=Math.max(0,R.flash-dt*2.4);R.shake=Math.max(0,R.shake-dt*40);R.sqv+=(-R.sq*190-R.sqv*11)*dt;R.sq+=R.sqv*dt;
 for(const p of R.parts){p.life+=dt;if(p.type==='in'){const dx=p.tx-p.x,dy=p.ty-p.y,d=Math.hypot(dx,dy)||1,v=420*s+p.life*900*s;p.x+=dx/d*Math.min(d,v*dt);p.y+=dy/d*Math.min(d,v*dt);if(d<8)p.life=p.max;continue}
  p.vx*=1-Math.min(1,p.drag*dt);p.vy=p.vy*(1-Math.min(1,p.drag*dt))+p.g*s*dt;p.x+=p.vx*s*dt;p.y+=p.vy*s*dt;p.rot+=p.vr*dt}
 R.parts=R.parts.filter(p=>p.life<p.max);
 if(R.lid){const l=R.lid;l.age+=dt;l.vy+=2600*s*dt;l.x+=l.vx*dt;l.y+=l.vy*dt;l.rot+=l.vr*dt;if(l.age>1.4||l.y>L.H+300)R.lid=null}
 if(R.phase==='enter'){R.vy+=5200*s*dt;R.y+=R.vy*dt;if(R.y>=0){const hit=R.vy;R.y=0;if(hit>300*s){R.vy=-hit*.3;R.sqv+=hit/(s*900);R.shake=Math.min(16,hit/(s*120));gameSound.effect('thud');for(let i=0;i<14;i++)bxPart(R,{x:cx+rand(-90,90)*s,y:gy,vx:rand(-160,160),vy:rand(-90,-20),g:-20,drag:2,max:rand(.5,.9),size:rand(10,20),color:'rgba(255,255,255,.5)',type:'dust'})}else{R.vy=0;R.phase='idle';R.t=0}}}
 else if(R.phase==='idle'&&R.t>5)boxTap();
 else if(R.phase==='charge'){const k=R.t/.95;if(Math.random()<.5+k){const a=rand(0,TAU);bxPart(R,{x:cx+Math.cos(a)*240*s,y:gy-90*s+Math.sin(a)*200*s,tx:cx,ty:gy-90*s,type:'in',max:2,size:rand(3,6),color:pick(['#ffffff',BOXES[R.kind].glow,'#fff6b0'])})}if(R.t>=.95)boxBurstOpen(R,L)}
 else if(R.phase==='burst'&&R.t>=.62)nextReward(R);
 else if(R.phase==='item'){const C=R.card,FLY=.42,flipAt=FLY+C.tease,rk=itemRank(C.it);C.t+=dt;
  if(C.t>FLY&&C.t-dt<=FLY){C.land=true;gameSound.effect('flip')}
  if(C.t>FLY&&C.t<flipAt&&rk>=2&&Math.random()<.6){const a=rand(0,TAU);bxPart(R,{x:cx+Math.cos(a)*L.cw*.8,y:L.cardY+Math.sin(a)*L.ch*.6,tx:cx,ty:L.cardY,type:'in',max:1.5,size:rand(3,6),color:pick(RANK_COLS[rk])})}
  if(!C.revealed&&C.t>=flipAt+.14){C.revealed=true;C.revealT=C.t;R.flash=[.35,.55,.75,.95][rk];R.flashCol=itemCol(C.it,now)[0];R.shake=[4,8,12,18][rk];gameSound.effect('reveal',rk);bxBurst(R,cx,L.cardY,[24,40,60,90][rk],RANK_COLS[rk],{up:120})}
  if(C.revealed&&C.it.unlock&&!C.unlocked&&C.t>=C.revealT+.95){C.unlocked=true;C.unlockT=C.t;skinPop[C.it.id]=now;R.banner={t:0,text:'NEW SKIN UNLOCKED!'};gameSound.effect('unlock');sayVoice('select',{skin:C.it.id,force:true});R.flash=.8;R.flashCol='#ffffff';bxBurst(R,cx,L.cardY,90,RANK_COLS[3],{up:200,speed:[200,700]})}
  C.ready=C.revealed&&C.t>=C.revealT+(C.it.unlock?2.2:.8)}
 if(R.leave){R.leave.t+=dt;if(R.leave.t>.35)R.leave=null}
 if(R.banner)R.banner.t+=dt}
function boxBurstOpen(R,L){const {s,cx,gy}=L;R.phase='burst';R.t=0;R.flash=1;R.flashCol='#ffffff';R.shake=22;R.sqv-=8;
 const side=Math.random()<.5?-1:1;R.lid={x:cx,y:gy-94*s,vx:side*rand(380,560)*s,vy:-1350*s,rot:0,vr:side*rand(5,9),age:0};gameSound.effect('burst');
 const best=Math.max(...R.items.map(itemRank));bxBurst(R,cx,gy-100*s,80,[...RANK_COLS[best],BOXES[R.kind].glow],{up:380,speed:[200,640]})}
function nextReward(R){if(R.card)R.leave={card:R.card,t:0};R.idx++;R.banner=null;if(R.idx>=R.items.length){R.card=null;boxSummary(R);return}
 const it=R.items[R.idx];R.card={it,t:0,tease:TEASE[itemRank(it)]};R.phase='item';R.t=0;gameSound.effect('whoosh')}
function boxTap(){const R=boxRun;if(!R)return;
 if(R.phase==='idle'){R.phase='charge';R.t=0;gameSound.effect('charge');return}
 if(R.phase==='item'){const C=R.card;if(!C.revealed){C.t=Math.max(C.t,.42+C.tease+.15);return}if(C.it.unlock&&!C.unlocked){C.t=C.revealT+.95;return}if(!C.ready&&C.t<C.revealT+.3)return;nextReward(R)}}
function boxSkip(){const R=boxRun;if(!R||R.phase==='summary')return;if(R.phase==='enter'||R.phase==='idle'||R.phase==='charge'){boxBurstOpen(R,boxLayout())}R.card=null;R.leave=null;R.banner=null;R.idx=R.items.length;
 const un=R.items.find(it=>it.unlock);if(un){sayVoice('select',{skin:un.id,force:true});gameSound.effect('unlock')}boxSummary(R)}
function boxDraw(R,now){const cv=$('#box-cv'),c=cv.getContext('2d'),L=boxLayout(),{W,H,s,cx,gy,cardY,cw,ch}=L,B=BOXES[R.kind];
 c.setTransform(R.dpr,0,0,R.dpr,0,0);c.clearRect(0,0,W,H);c.globalAlpha=Math.min(1,R.age/.3);
 const bg=c.createRadialGradient(cx,H*.45,10,cx,H*.45,Math.max(W,H)*.8);bg.addColorStop(0,B.body[1]);bg.addColorStop(.5,B.body[2]);bg.addColorStop(1,'#0b0624');c.fillStyle=bg;c.fillRect(0,0,W,H);
 c.save();if(R.shake>0)c.translate(rand(-1,1)*R.shake*s,rand(-1,1)*R.shake*s);
 // Light rays: soft white around the box, then the colour of the reward on show.
 const C=R.card,showCard=R.phase==='item'&&C,col=showCard?(C.revealed?itemCol(C.it,now)[0]:C.t>.42&&itemRank(C.it)>=2?itemCol(C.it,now)[0]:'#ffffff'):R.phase==='summary'?'#ffffff':R.phase==='burst'?B.glow:'#ffffff';
 const ry=showCard?cardY:R.phase==='summary'?H*.3:gy-80*s,ra=R.phase==='enter'||R.phase==='idle'?.35:R.phase==='charge'?.35+R.t*.5:showCard&&C.revealed?.95:.6;
 bxRays(c,cx,ry,Math.max(W,H)*.75,now*.25,col,ra,18);if(R.banner)bxRays(c,cx,cardY,Math.max(W,H)*.8,-now*.6,hueHex(now*120%360),.5,12);
 // The box (fades away for the summary).
 const boxA=R.phase==='summary'?Math.max(0,1-R.t*3):1;
 if(boxA>0){c.save();c.globalAlpha*=boxA;const opened=R.phase==='burst'||R.phase==='item'||R.phase==='summary',best=Math.max(...R.items.map(itemRank)),gcol=best===3?hueHex(now*120%360):best===2?'#ffd23f':best===1?'#c79cff':B.glow;
  const glow=c.createRadialGradient(cx,gy-80*s,4,cx,gy-80*s,200*s),pulse=R.phase==='charge'?.5+R.t*.5:.35+.12*Math.sin(now*3);glow.addColorStop(0,hexA(opened?gcol:B.glow,pulse));glow.addColorStop(1,hexA(opened?gcol:B.glow,0));c.fillStyle=glow;c.fillRect(0,0,W,H);
  if(opened){c.save();c.globalCompositeOperation='lighter';const top=showCard?cardY:H*.2,g=c.createLinearGradient(0,gy-94*s,0,top);g.addColorStop(0,hexA(gcol,.75));g.addColorStop(1,hexA(gcol,0));c.fillStyle=g;c.beginPath();c.moveTo(cx-70*s,gy-94*s);c.lineTo(cx+70*s,gy-94*s);c.lineTo(cx+(130+10*Math.sin(now*4))*s,top);c.lineTo(cx-(130+10*Math.sin(now*4))*s,top);c.closePath();c.fill();c.restore()}
  const bob=R.phase==='idle'?Math.sin(now*2.6)*4*s:0,wig=R.phase==='idle'&&R.t%2.2<.4?Math.sin(R.t*28)*.06:0;let jx=0,lift=0;if(R.phase==='charge'){const k=R.t/.95;jx=rand(-1,1)*k*k*10*s;lift=k*8+rand(0,k*5)}
  drawBoxArt(c,R.kind,cx+jx,gy+R.y+bob,s,{lift,lidOff:opened,open:opened,glowCol:gcol,sx:1+R.sq,sy:1-R.sq,rot:wig});
  if(R.phase==='charge'){const k=R.t/.95;c.save();c.globalCompositeOperation='lighter';for(let i=0;i<7;i++){const a=-Math.PI/2+(i-3)*.28+Math.sin(now*9+i)*.05,len=(120+i%3*40)*s*k;c.fillStyle=hexA('#fff6c0',.55*k);c.beginPath();c.moveTo(cx+jx+(i-3)*20*s,gy-94*s-lift*s);c.lineTo(cx+jx+(i-3)*20*s+Math.cos(a-.04)*len,gy-94*s+Math.sin(a-.04)*len);c.lineTo(cx+jx+(i-3)*20*s+Math.cos(a+.04)*len,gy-94*s+Math.sin(a+.04)*len);c.closePath();c.fill()}c.restore()}
  if(R.phase==='item'){const left=R.items.length-R.idx-1;if(left>0){const bx=cx+74*s,by=gy-120*s;c.beginPath();c.arc(bx,by,17*s,0,TAU);c.fillStyle='#ff4d5e';c.fill();c.lineWidth=4;c.strokeStyle=BX_INK;c.stroke();bxText(c,String(left),bx,by+1,20*s,'#fff')}}
  c.restore()}
 if(R.lid){const l=R.lid;c.save();c.globalAlpha*=Math.max(0,1-Math.max(0,l.age-.8)/.6);c.translate(l.x,l.y);c.rotate(l.rot);c.scale(s,s);c.lineJoin='round';drawBoxLid(c,R.kind);c.restore()}
 // A card that is leaving swoops up and away.
 if(R.leave){const k=R.leave.t/.35,lc=R.leave.card;c.save();c.globalAlpha*=1-k;c.translate(cx-k*W*.35,cardY-k*H*.2);c.rotate(-k*.6);c.scale(1-k*.5,1-k*.5);drawCardFront(c,lc.it,cw,ch,now);c.restore()}
 for(const p of R.parts)if(p.type==='dust'||p.type==='in')drawBxPart(c,p);
 if(showCard){const FLY=.42,flipAt=FLY+C.tease,k=Math.min(1,C.t/FLY),e=easeBack(k),x0=cx,y0=gy-100*s,px=x0+(cx-x0)*e,py=y0+(cardY-y0)*e-Math.sin(k*Math.PI)*60*s,sc=.25+.75*e;
  let ang=k<1?Math.PI+(1-k)*TAU*1.5:Math.PI,rot=0;if(C.t>=flipAt)ang=Math.PI+Math.min(1,(C.t-flipAt)/.28)*Math.PI;
  if(C.t>FLY&&C.t<flipAt){const q=(C.t-FLY)/C.tease;rot=Math.sin(C.t*(30+q*30))*(.03+q*.06);ang=Math.PI}
  const cosA=Math.cos(ang),face=cosA>0,glowC=itemCol(C.it,now)[0];
  if(C.t>FLY){const gg=c.createRadialGradient(px,py,cw*.2,px,py,cw*1.1),ga=C.revealed?.75:.2+Math.min(1,(C.t-FLY)/Math.max(.1,C.tease))*.5*(itemRank(C.it)>=1?1:.4);gg.addColorStop(0,hexA(glowC,ga));gg.addColorStop(1,hexA(glowC,0));c.fillStyle=gg;c.fillRect(0,0,W,H)}
  c.save();c.translate(px,py);c.rotate(rot);c.scale(sc*Math.max(.03,Math.abs(cosA)),sc);c.lineJoin='round';
  if(face){const since=C.revealed?C.t-C.revealT:0,pose=C.unlocked?Math.min(1,(now-skinPop[C.it.id])/POSE_TIME):1;drawCardFront(c,C.it,cw,ch,now,{count:Math.round(C.it.n*Math.min(1,since/.45)),pose})}else drawCardBack(c,C.it,cw,ch,now);c.restore();
  // The card's progress bar fills under it.
  if(C.revealed&&C.it.type==='card'){const need=CARD_NEED[C.it.rar],q=clamp((C.t-C.revealT-.25)/.6,0,1),have=C.it.from+(Math.min(C.it.to,need)-C.it.from)*q,bw=cw*1.05,bh=22*s,bx=cx-bw/2,by=cardY+ch/2+18*s,full=have>=need;
   rrect(c,bx,by,bw,bh,bh/2);c.fillStyle='rgba(0,0,0,.45)';c.fill();c.lineWidth=4;c.strokeStyle=BX_INK;c.stroke();if(have>0){rrect(c,bx+3,by+3,Math.max(bh-6,(bw-6)*Math.min(1,have/need)),bh-6,(bh-6)/2);c.fillStyle=full?'#5fe36b':glowC;c.fill()}
   bxText(c,full?'UNLOCKED!':`${Math.floor(have)} / ${need}`,cx,by+bh/2+1,15*s,'#fff')}}
 for(const p of R.parts)if(p.type!=='dust'&&p.type!=='in')drawBxPart(c,p);
 if(R.banner){const k=Math.min(1,R.banner.t/.35),e=easeBack(k);c.save();c.translate(cx,cardY-ch/2-34*s);c.scale(e,e);c.rotate(Math.sin(now*3)*.03);const bw=Math.min(W*.86,330*s),bh=46*s;rrect(c,-bw/2,-bh/2,bw,bh,12*s);c.fillStyle=vgrad(c,-bh/2,bh/2,['#ffe46b','#ff9a1a']);c.fill();c.lineWidth=4;c.strokeStyle=BX_INK;c.stroke();bxText(c,R.banner.text,0,1,Math.min(26*s,bw/12),'#fff');c.restore()}
 c.restore();
 if(R.flash>0){c.fillStyle=hexA(R.flashCol.length===7?R.flashCol:'#ffffff',Math.min(1,R.flash));c.fillRect(0,0,W,H)}
 // Prompts.
 if(R.phase==='idle')bxText(c,'TAP TO OPEN!',cx,H*.93,26*s*(1+.06*Math.sin(now*6)),'#fff');
 else if(R.phase==='item'&&C&&C.ready)bxText(c,R.idx<R.items.length-1?'TAP FOR THE NEXT ONE':'TAP TO FINISH',cx,H*.95,18*s,'#fff',{alpha:.6+.4*Math.sin(now*5)});
 c.globalAlpha=1}
function drawBxPart(c,p){const k=p.life/p.max,a=p.type==='in'?1:1-k*k;c.save();c.globalAlpha*=Math.max(0,a);c.translate(p.x,p.y);c.rotate(p.rot);
 if(p.type==='star'){c.fillStyle=p.color;starPath(c,0,0,p.size,p.size*.45);c.fill()}
 else if(p.type==='confetti'){c.fillStyle=p.color;c.scale(1,Math.cos(p.life*9));c.fillRect(-p.size/2,-p.size/4,p.size,p.size/2)}
 else if(p.type==='dust'){c.fillStyle=p.color;c.beginPath();c.arc(0,0,p.size*(1+k),0,TAU);c.fill()}
 else{c.globalCompositeOperation='lighter';c.fillStyle=p.color;c.beginPath();c.arc(0,0,p.size*.6,0,TAU);c.fill()}c.restore()}
// The summary: every reward of the box, then OPEN NEXT (more boxes waiting) or OK.
function boxSummary(R){R.phase='summary';R.t=0;$('#bo-skip').hidden=true;const sum=$('#bo-sum'),grid=el('div','bo-grid');sum.replaceChildren(el('h3','','YOU GOT'),grid);
 R.items.forEach((it,k)=>{const [a,b]=RAR_COL[rarOf(it)],tile=el('div','bo-tile'+(it.unlock?' new':''));tile.style.setProperty('--ca',a);tile.style.setProperty('--cb',b);tile.style.animationDelay=k*.08+'s';
  if(it.type==='card'){const cv=document.createElement('canvas');cv.width=120;cv.height=120;const c=cv.getContext('2d'),main=ctx;ctx=c;c.translate(60,66);c.scale(1.05,1.05);drawSkinShow(it.id,performance.now()/1000,1,0);ctx=main;tile.append(cv)}
  else{const i=el('span','bo-ico');i.innerHTML=icon(it.type==='gems'?'gem':'coin');tile.append(i)}
  tile.append(el('b','',`+${it.n.toLocaleString()}`),el('small','',it.type==='card'?SKINS[it.id].name:it.type==='gems'?'GEMS':it.spare?'COINS + SPARE CARDS':'COINS'));
  if(it.type==='card'){const need=CARD_NEED[it.rar],bar=el('i','bo-bar'),f=el('s');f.style.width=Math.min(100,it.to/need*100)+'%';bar.append(f);tile.append(bar,el('small','bo-prog',it.unlock?'UNLOCKED!':`${Math.min(it.to,need)} / ${need}`))}
  if(it.unlock)tile.append(el('span','bo-new','NEW!'));grid.append(tile)});
 sum.hidden=false;const btns=$('#bo-btns');btns.replaceChildren();const more=BOX_ORDER.find(k=>k===R.kind&&boxCount(k)>0)||BOX_ORDER.find(k=>boxCount(k)>0);
 if(more){const b=el('button','btn green',`OPEN ${BOXES[more].name} (${boxCount(more)})`);b.onclick=()=>{closeBoxShow();openBox(more)};btns.append(b)}
 const ok=el('button','btn','OK');ok.onclick=closeBoxShow;btns.append(ok);btns.hidden=false;gameSound.effect('buy')}
function closeBoxShow(){boxRun=null;$('#box-open').hidden=true;refreshMeta();if(panelKind==='store')renderStore();if(panelKind==='tasks')renderTasks();if(typeof resultsBoxes==='function')resultsBoxes()}
$('#box-open').addEventListener('pointerdown',e=>{if(e.target.closest('button,.bo-sum'))return;boxTap()});
$('#bo-skip').onclick=e=>{e.stopPropagation();boxSkip()};
window.addEventListener('keydown',e=>{if(!boxRun)return;e.stopImmediatePropagation();if(e.key===' '||e.key==='Enter'){e.preventDefault();if(boxRun.phase==='summary')closeBoxShow();else boxTap()}else if(e.key==='Escape'){if(boxRun.phase==='summary')closeBoxShow();else boxSkip()}},true);

// ---- Store: the BOXES tab ----
let boxTiles=[];
function boxTile(kind,w=100,h=78){const cv=document.createElement('canvas');cv.width=w*2;cv.height=h*2;cv.dataset.box=kind;cv.style.width=w+'px';cv.style.height=h+'px';boxTiles.push(cv);return cv}
function renderBoxTiles(){boxTiles=boxTiles.filter(cv=>cv.isConnected);const now=performance.now()/1000;for(const cv of boxTiles){const c=cv.getContext('2d'),k=cv.dataset.box,w=cv.width,h=cv.height;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,w,h);
  const g=c.createRadialGradient(w/2,h*.55,4,w/2,h*.55,w*.5);g.addColorStop(0,hexA(BOXES[k].glow,.55+.15*Math.sin(now*3)));g.addColorStop(1,hexA(BOXES[k].glow,0));c.fillStyle=g;c.fillRect(0,0,w,h);
  const wig=(now+k.length)%3<.35?Math.sin(now*30)*.05:0;drawBoxArt(c,k,w/2,h*.9+Math.sin(now*2.5+k.length)*3,Math.min(w/210,h/185),{rot:wig})}}
const oddsText=B=>Object.entries(B.odds).map(([r,p])=>`${RARITY[r].name} ${Math.round(p*100)}%`).join(' · ');
function renderBoxShop(list){boxTiles=[];
 if(boxTotal()){const mine=el('div','box-mine');mine.append(el('h4','box-head','YOUR BOXES'));const row=el('div','box-row');
  for(const k of BOX_ORDER){const n=boxCount(k);if(!n)continue;const t=el('div','box-card mine');t.style.setProperty('--glow',BOXES[k].glow);t.append(boxTile(k),el('b','',BOXES[k].name),el('span','box-count',`x${n}`));const b=el('button','buy go','OPEN');b.onclick=()=>openBox(k);t.append(b);row.append(t)}
  mine.append(row);list.append(mine)}
 list.append(el('h4','box-head','BUY A BOX'));const shop=el('div','box-row');
 for(const k of BOX_ORDER){const B=BOXES[k],t=el('div','box-card');t.style.setProperty('--glow',B.glow);t.append(boxTile(k),el('b','',B.name),el('small','',B.sure?`${B.stacks} STACKS · 1 LEGENDARY+`:`${B.stacks} CARD STACKS`));
  const b=el('button','buy'+(B.price.gems?' gem':''));b.innerHTML=B.price.gems?iconHTML('gem')+B.price.gems:iconHTML('coin')+B.price.coins;b.onclick=()=>{const need=B.price.gems||B.price.coins,have=B.price.gems?(save.gems||0):save.coins;if(have<need)return notEnough(b,need,!!B.price.gems);openBox(k,'buy')};t.append(b);shop.append(t)}
 list.append(shop);
 const info=el('div','box-info');info.append(el('p','',"Every box has coins, sometimes GEMS (rare) and stacks of SKIN CARDS. Collect enough cards of an EPIC, LEGENDARY or MYTHIC skin to unlock it. Win free boxes from BOX TASKS (Tuesday, Thursday and Saturday), by clearing a stage's goal for the first time, and from mystery boxes floating in the sky."));
 for(const k of BOX_ORDER){const B=BOXES[k];info.append(el('small','',`${B.name}: ${B.coins[0]}-${B.coins[1]} coins · gems ${Math.round(B.gems[0]*100)}% · each stack ${oddsText(B)}${B.sure?' (the first stack is always legendary or mythic)':''}`))}list.append(info);
 list.append(el('h4','box-head','CARD COLLECTION'));const col=el('div','card-col');
 for(const id of SKIN_ORDER){if(!isCardSkin(id))continue;const sk=SKINS[id],r=RARITY[sk.rarity],own=save.skins.includes(id),need=CARD_NEED[sk.rarity],have=Math.min(need,cardsOf(id)),chip=el('button','card-chip'+(own?' own':''));chip.style.setProperty('--ca',r.a);chip.style.setProperty('--cb',r.b);
  const bar=el('i','bo-bar'),f=el('s');f.style.width=(own?100:have/need*100)+'%';bar.append(f);chip.append(el('b','',sk.name),bar,el('small','',own?'UNLOCKED ✓':`${have} / ${need} CARDS`));chip.onclick=()=>{storeTab='skins';storePick=id;skinPop[id]=performance.now()/1000;renderStore()};col.append(chip)}
 list.append(col)}
