'use strict';
// Medals: achievements with five levels each (I to V). Each level needs more than the one before and looks better:
// I bronze, II silver, III gold, IV fire gold (animated flames, shifting colours) and V royal fire (fire gold with
// wings, a crown and a turning halo). Medals you haven't earned yet are shown faded. PROFILE > MEDALS lists them;
// tapping one opens it big, spinning round in 3D. Lifetime stats (save.life) count what the medals need.
const MEDAL_TIERS=[{name:'BRONZE',c:['#ffdcae','#c8782a','#7a3e10']},{name:'SILVER',c:['#ffffff','#b8c4d8','#66718c']},{name:'GOLD',c:['#fff6b0','#ffc414','#b87400']},
 {name:'FIRE GOLD',c:['#fff3a0','#ff9a1a','#c2300a'],fire:true},{name:'ROYAL FIRE',c:['#fff6c8','#ff7a1a','#a0106a'],fire:true,royal:true}];
const MEDAL_LOCKED=['#e2e6ee','#a3a9b8','#5d6375'];
const ROMAN=['I','II','III','IV','V'];
// Medal reward for reaching each level.
const MEDAL_PRIZE=[{coins:100},{coins:300},{gems:10},{gems:25},{gems:60}];
const life=k=>(save.life||{})[k]||0;
const sumOf=o=>Object.values(o||{}).reduce((a,v)=>a+(Math.floor(v)||0),0);
const MEDAL_LIST=[
 {id:'explorer',name:'SKY EXPLORER',icon:'balloon',rib:['#3d9bff','#ffffff'],unit:'m flown in total',goals:[25000,250000,1200000,5000000,25000000],get:()=>Math.floor(save.totalM||0)},
 {id:'flyer',name:'HIGH FLYER',icon:'rocket',rib:['#7a3cff','#5ff0ff'],unit:'m in one run',goals:[8000,20000,40000,70000,120000],get:()=>Math.max(life('runAlt'),save.freeAlt||0,...Object.values(save.best||{}).map(v=>Math.floor(v)||0))},
 {id:'hunter',name:'BOSS HUNTER',icon:'skull',rib:['#e0203c','#1b1240'],unit:'bosses beaten',goals:[5,30,100,300,1000],get:()=>sumOf(save.bossWins)},
 {id:'stars',name:'STAR COLLECTOR',icon:'star',rib:['#ffd23f','#ff7a00'],unit:'stage stars',goals:[3,6,10,14,18],get:()=>sumOf(save.stars)},
 {id:'tycoon',name:'COIN TYCOON',icon:'coin',rib:['#ffc414','#2fbf4f'],unit:'coins collected in runs',goals:[2000,20000,100000,400000,1500000],get:()=>life('coins')},
 {id:'perfect',name:'PERFECTIONIST',icon:'gem',rib:['#ff7ad9','#ffffff'],unit:'perfect coin rows',goals:[50,250,1000,3000,8000],get:()=>life('rows')},
 {id:'daredevil',name:'DAREDEVIL',icon:'shield',rib:['#44d9ff','#1b1240'],unit:'close calls',goals:[60,250,1000,3000,8000],get:()=>life('close')},
 {id:'smasher',name:'SMASHER',icon:'flame',rib:['#ff5a1f','#ffd23f'],unit:'smashes and bonks',goals:[150,700,2500,8000,25000],get:()=>life('smashes')},
 {id:'booster',name:'TURBO ACE',icon:'bolt',rib:['#ffd23f','#3d7bff'],unit:'engine boosts',goals:[15,60,200,600,1500],get:()=>life('boosts')},
 {id:'veteran',name:'VETERAN',icon:'play',rib:['#4fd36b','#1b1240'],unit:'runs played',goals:[25,100,400,1000,3000],get:()=>life('runs')},
 {id:'taskmaster',name:'TASK MASTER',icon:'trophy',rib:['#a273ff','#ffd23f'],unit:'daily tasks done',goals:[15,60,150,400,900],get:()=>life('dailyDone')},
 {id:'treasure',name:'TREASURE HUNTER',icon:'box',rib:['#c98a4a','#ffd23f'],unit:'boxes opened',goals:[3,20,60,150,400],get:()=>save.boxesOpened||0},
 // Boss medals, one per boss: a medal level for each boss rank level (SERGEANT I to V) you have beaten it at.
 ...STAGES.map(s=>({id:'b'+s.id.slice(0,3),name:BOSSES[s.id].name,icon:'boss:'+s.id,rib:[BOSSES[s.id].colors[1],BOSSES[s.id].colors[2]],unit:'boss rank level beaten',goals:[1,2,3,4,5],boss:true,get:()=>(save.bossTop||{})[s.id]||0}))];
const medalById=id=>MEDAL_LIST.find(m=>m.id===id);
const medalTierOf=(m,v)=>m.goals.filter(g=>v>=g).length;
const medalLevel=id=>(save.medals||{})[id]||0;
const medalTotal=()=>MEDAL_LIST.reduce((n,m)=>n+medalLevel(m.id),0);
// Lifetime stats: every tracked stat adds up (the best single run is kept as a maximum). Called from trackTask.
function lifeStat(stat,amount){const l=save.life||(save.life={});if(stat==='runAlt')l.runAlt=Math.max(l.runAlt||0,amount);else l[stat]=(l[stat]||0)+amount;checkMedals()}
// Players from before medals start from this season's counts (in memory only; it is saved with the next change).
{const l=save.life||(save.life={}),st=((save.tasks||{}).st)||{};for(const [k,v] of Object.entries(st))if(typeof v==='number'&&!(l[k]>=v))l[k]=v}
// New medal levels: record them, pay their reward and announce them (in flight, and on the results screen).
let runMedals=[];
function medalsNewRun(){runMedals=[]}
function checkMedals(){const got=[];save.medals=save.medals||{};
 for(const m of MEDAL_LIST){const was=medalLevel(m.id),now=medalTierOf(m,m.get());if(now>was){save.medals[m.id]=now;for(let k=was;k<now;k++){const r=MEDAL_PRIZE[k];if(r.coins)save.coins+=r.coins;if(r.gems)save.gems=(save.gems||0)+r.gems;got.push({id:m.id,tier:k+1,...r})}}}
 if(!got.length)return got;runMedals.push(...got);persist();
 if(typeof state!=='undefined'&&state==='flying'){const g=got[got.length-1];popup(x*W,balloonY()-150,`MEDAL! ${medalById(g.id).name} ${ROMAN[g.tier-1]}`,'#ffd23f',22);gameSound.effect('record')}
 return got}
const prizeText=r=>r.coins?`+${r.coins} COINS`:`+${r.gems} GEMS`;

// ---- Drawing ----
// Medal icons come from the game's SVG icons, drawn into the medal (cached as images).
const medalIcons={};
// Boss medals show the boss's own face: its art is painted once onto a small canvas.
function bossFace(id){const def=BOSSES[id],cv=document.createElement('canvas');cv.width=cv.height=160;const main=ctx;ctx=cv.getContext('2d');try{ctx.translate(80,86);ctx.scale(.6,.6);def.art({t:1.2,tired:false,attack:0,lookX:0,lookY:.4})}finally{ctx=main}return cv}
function medalIcon(name){let im=medalIcons[name];if(!im&&name.startsWith('boss:'))return medalIcons[name]=bossFace(name.slice(5));if(im&&im.getContext)return im;if(!im){im=medalIcons[name]=new Image();im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(icon(name).replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" '))}return im.complete&&im.naturalWidth?im:null}
function medalPath(c,tier){c.beginPath();
 if(tier<=1)c.arc(0,0,28,0,TAU);
 else if(tier===2){for(let i=0;i<=64;i++){const a=i/64*TAU,r=28.5+1.6*Math.cos(a*16);c.lineTo(Math.cos(a)*r,Math.sin(a)*r)}}
 else for(let i=0;i<24;i++){const a=i/24*TAU-Math.PI/2,r=i%2?27:33;c.lineTo(Math.cos(a)*r,Math.sin(a)*r)}
 c.closePath()}
function medalCols(tier,locked,t){if(locked||!tier)return MEDAL_LOCKED;const T=MEDAL_TIERS[tier-1];if(!T.fire)return T.c;const h=30+12*Math.sin(t*2.2);return [`hsl(${h+20},100%,82%)`,`hsl(${h},100%,55%)`,T.royal?`hsl(${(320+20*Math.sin(t*1.7)+360)%360},85%,38%)`:`hsl(${h-22},90%,38%)`]}
// One medal in a 100x110 box (ribbon on top, medal below, centred on 0,12). spin turns it round its vertical axis.
function drawMedal(c,m,tier,t,{spin=0,locked=false}={}){const cols=medalCols(tier,locked,t),T=MEDAL_TIERS[Math.max(0,tier-1)],sx=Math.cos(spin),w=Math.max(.02,Math.abs(sx)),face=sx>=0,fade=locked||!tier;
 c.save();c.lineJoin='round';c.lineCap='round';c.strokeStyle=INK;c.lineWidth=2.5;if(fade)c.globalAlpha*=.55;
 // Royal fire: a turning halo of rays behind everything.
 if(!fade&&T.royal){c.save();c.translate(0,12);c.rotate(t*.6);for(let i=0;i<14;i++){c.rotate(TAU/14);c.fillStyle=i%2?'rgba(255,214,90,.55)':'rgba(255,120,200,.4)';c.beginPath();c.moveTo(0,0);c.lineTo(48,-5);c.lineTo(48,5);c.closePath();c.fill()}c.restore()}
 // The ribbon turns with the medal.
 c.save();c.scale(w,1);for(const s of [-1,1]){c.beginPath();c.moveTo(s*20,-46);c.lineTo(s*6,-46);c.lineTo(s*2,-14);c.lineTo(s*12,-14);c.closePath();c.fillStyle=fade?'#8a90a0':m.rib[0];c.fill();c.stroke();c.save();c.clip();c.fillStyle=fade?'#b8bcc8':m.rib[1];c.fillRect(s>0?9:-15,-50,6,40);c.restore();c.beginPath();c.moveTo(s*20,-46);c.lineTo(s*6,-46);c.lineTo(s*2,-14);c.lineTo(s*12,-14);c.closePath();c.stroke()}c.restore();
 c.translate(0,12);
 // Fire gold: flickering flames round the rim.
 if(!fade&&T.fire){for(let i=0;i<18;i++){const a=i/18*TAU+t*.5,f=1+.35*Math.sin(t*11+i*2.1),len=(T.royal?11:8)*f;c.save();c.scale(w,1);c.rotate(a);c.fillStyle=i%2?'#ffd23f':'#ff5a1f';c.beginPath();c.moveTo(-5,-29);c.quadraticCurveTo(-3,-29-len,0,-31-len*1.3);c.quadraticCurveTo(3,-29-len,5,-29);c.closePath();c.fill();c.restore()}}
 // Royal fire: small wings on both sides.
 if(!fade&&T.royal){c.save();c.scale(w,1);const fl=Math.sin(t*4)*.12;for(const s of [-1,1])for(let k=0;k<3;k++){c.save();c.translate(s*30,-2+k*8);c.rotate(s*(-.5+k*.35+fl));c.fillStyle=k%2?'#fff6d0':'#ffffff';c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(s*9,-7,s*15,-2);c.quadraticCurveTo(s*9,4,0,4);c.closePath();c.fill();c.lineWidth=1.8;c.stroke();c.restore()}c.restore()}
 // The edge (thickness) shows while the medal turns.
 const edge=Math.sin(spin)*5;if(Math.abs(edge)>.3){c.save();c.translate(-edge,0);c.scale(w,1);medalPath(c,Math.max(1,tier));c.fillStyle=cols[2];c.fill();c.stroke();c.restore()}
 c.save();c.scale(w,1);medalPath(c,Math.max(1,tier));const g=c.createLinearGradient(-30,-30,30,30);g.addColorStop(0,cols[0]);g.addColorStop(.55,cols[1]);g.addColorStop(1,cols[2]);c.fillStyle=g;c.fill();c.lineWidth=3;c.stroke();
 // Inner disc and the moving shine.
 c.beginPath();c.arc(0,0,20,0,TAU);const g2=c.createRadialGradient(-6,-8,2,0,0,22);g2.addColorStop(0,cols[0]);g2.addColorStop(1,cols[1]);c.fillStyle=g2;c.fill();c.lineWidth=2;c.strokeStyle=cols[2];c.stroke();c.strokeStyle=INK;
 c.save();medalPath(c,Math.max(1,tier));c.clip();const sh=((spin/TAU)%1+1)%1,bx=-60+sh*120+Math.sin(t*1.3)*6;c.fillStyle='rgba(255,255,255,.35)';c.beginPath();c.moveTo(bx-8,-40);c.lineTo(bx+4,-40);c.lineTo(bx-14,40);c.lineTo(bx-26,40);c.closePath();c.fill();c.restore();
 if(face){const im=medalIcon(m.icon);if(im){c.save();if(fade)c.globalAlpha*=.5;if(m.boss){c.beginPath();c.arc(0,0,19,0,TAU);c.clip();c.drawImage(im,-24,-24,48,48)}else c.drawImage(im,-15,-15,30,30);c.restore()}}
 else{c.fillStyle='rgba(255,255,255,.55)';starP(c,0,0,13,5.5);c.fill();c.lineWidth=1.6;c.stroke()}
 c.restore();
 // Royal fire: a crown on top.
 if(!fade&&T.royal){c.save();c.scale(w,1);c.translate(0,-36);c.fillStyle='#ffd23f';c.beginPath();c.moveTo(-10,5);c.lineTo(-12,-6);c.lineTo(-5,-1);c.lineTo(0,-9);c.lineTo(5,-1);c.lineTo(12,-6);c.lineTo(10,5);c.closePath();c.fill();c.lineWidth=2;c.stroke();c.fillStyle='#ff4d5e';c.beginPath();c.arc(0,1,2.2,0,TAU);c.fill();c.restore()}
 // The level banner.
 if(tier||locked){c.save();c.scale(w,1);c.translate(0,30);c.fillStyle=fade?'#6a7084':['#8a4a1a','#5a6680','#b87400','#c2300a','#8a106a'][tier-1];c.beginPath();c.moveTo(-17,-6);c.lineTo(17,-6);c.lineTo(21,0);c.lineTo(17,6);c.lineTo(-17,6);c.lineTo(-21,0);c.closePath();c.fill();c.lineWidth=2;c.stroke();
  if(face){c.font=`12px ${FONT}`;c.textAlign='center';c.textBaseline='middle';c.lineWidth=3;c.strokeText(fade?'?':ROMAN[tier-1],0,.8);c.fillStyle='#fff';c.fillText(fade?'?':ROMAN[tier-1],0,.8)}c.restore()}
 // Sparkles for the fire levels.
 if(!fade&&T.fire){c.fillStyle='#fff';for(let i=0;i<4;i++){const a=t*1.6+i*TAU/4,tw=.4+.6*Math.abs(Math.sin(t*3+i));c.globalAlpha=tw;starP(c,Math.cos(a)*36*w,Math.sin(a)*34,3+tw*3,1.2);c.fill()}c.globalAlpha=1}
 c.restore()}
function starP(c,x,y,r,ri,n=4){c.beginPath();for(let i=0;i<n*2;i++){const a=-Math.PI/2+i*Math.PI/n,rr=i%2?ri:r;c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}c.closePath()}
// Medal canvases on screen: animated ones (fire levels, or the viewer) are redrawn every frame.
const medalCanvases=new Set();
function medalEl(m,tier,size=64,{locked=false,spin=false}={}){const cv=document.createElement('canvas'),k=Math.min(2,devicePixelRatio||1);cv.width=Math.round(size*k);cv.height=Math.round(size*1.1*k);cv.style.width=size+'px';cv.style.height=size*1.1+'px';cv.className='medal-cv';cv._medal={m,tier,locked,spin,t0:performance.now()/1000};paintMedal(cv,performance.now()/1000);if(spin||(tier>=4&&!locked)||!medalIcon(m.icon))medalCanvases.add(cv);return cv}
function paintMedal(cv,now){const d=cv._medal,c=cv.getContext('2d'),s=cv.width/100;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,cv.width,cv.height);c.setTransform(s,0,0,s,cv.width/2,cv.height*.5);drawMedal(c,d.m,d.tier,now,{spin:d.spin?(now-d.t0)*2.4:0,locked:d.locked})}
function renderMedals(){if(!medalCanvases.size)return;const now=performance.now()/1000;for(const cv of medalCanvases){if(!cv.isConnected){medalCanvases.delete(cv);continue}paintMedal(cv,now);const d=cv._medal;if(!d.spin&&!(d.tier>=4&&!d.locked)&&medalIcon(d.m.icon))medalCanvases.delete(cv)}}

// ---- Profile: the MEDALS tab ----
function renderMedalsTab(list){checkMedals();const box=el('div','medal-sum'),tot=medalTotal();box.append(el('b','',`MEDALS ${tot} / ${MEDAL_LIST.length*5}`),el('small','',`${MEDAL_LIST.filter(m=>medalLevel(m.id)).length} of ${MEDAL_LIST.length} medals earned · tap a medal to see it`));list.append(box);
 const grid=el('div','medal-grid');for(const m of MEDAL_LIST){const lv=medalLevel(m.id),v=m.get(),next=m.goals[lv],card=el('button','medal-card'+(lv?' got t'+lv:' locked'));card.append(medalEl(m,lv||1,70,{locked:!lv}),el('b','',m.name),el('small','medal-lv',lv?`LEVEL ${ROMAN[lv-1]} · ${MEDAL_TIERS[lv-1].name}`:'NOT EARNED YET'));
  const bar=el('i','bo-bar'),f=el('s');f.style.width=(next?Math.min(100,v/next*100):100)+'%';bar.append(f);card.append(bar,el('small','',next?`${Math.min(v,next).toLocaleString()} / ${next.toLocaleString()}`:'MAX LEVEL'));card.onclick=()=>openMedal(m,lv,true);grid.append(card)}
 list.append(grid)}
// ---- The medal viewer: the medal big and spinning, its levels and what the next one needs ----
function openMedal(m,lv,mine){const ov=$('#medal-view'),stage=$('#mv-medal'),info=$('#mv-info');stage.replaceChildren(medalEl(m,lv||1,190,{locked:!lv,spin:true}));info.replaceChildren();
 info.append(el('b','mv-name',m.name),el('small','mv-lv',lv?`LEVEL ${ROMAN[lv-1]} · ${MEDAL_TIERS[lv-1].name}`:'NOT EARNED YET'));
 const ladder=el('div','mv-ladder');m.goals.forEach((g,k)=>{const w=el('div','mv-step'+(k<lv?' got':''));w.append(medalEl(m,k+1,40,{locked:k>=lv}),el('small','',`${ROMAN[k]} · ${g.toLocaleString()}`));ladder.append(w)});info.append(ladder);
 if(mine&&m.boss){const next=lv+1<=5?lv+1:0;info.append(el('p','mv-goal',next?`Next level: beat ${m.name} at ${BOSS_RANKS[next-1]}. Reward: ${prizeText(MEDAL_PRIZE[lv])}.`:`All five levels earned: ${m.name} beaten at SERGEANT V, the top rank.`))}
 else if(m.boss)info.append(el('p','mv-goal',`Beat ${m.name} at rank levels SERGEANT I to V to earn each medal level.`));
 else if(mine){const v=m.get(),next=m.goals[lv];info.append(el('p','mv-goal',next?`Next level: ${next.toLocaleString()} ${m.unit} (you have ${v.toLocaleString()}). Reward: ${prizeText(MEDAL_PRIZE[lv])}.`:`All five levels earned: ${v.toLocaleString()} ${m.unit}.`))}
 else info.append(el('p','mv-goal',`Levels need ${m.goals.map(g=>g.toLocaleString()).join(' / ')} ${m.unit}.`));
 ov.hidden=false;gameSound.effect('on')}
$('#mv-close').onclick=()=>{$('#medal-view').hidden=true};
$('#medal-view').addEventListener('pointerdown',e=>{if(e.target.id==='medal-view')$('#medal-view').hidden=true});
// Public profile: "explorer3,hunter2" (earned medals only), and the row of medals on player cards.
const medalCode=()=>MEDAL_LIST.filter(m=>medalLevel(m.id)).map(m=>m.id+medalLevel(m.id)).join(',').slice(0,160);
function medalRow(code){const row=el('div','pc-medals');for(const part of String(code||'').split(',')){const mm=/^([a-z]+)([1-5])$/.exec(part),m=mm&&medalById(mm[1]);if(!m)continue;const lv=+mm[2],b=el('button','pc-medal');b.append(medalEl(m,lv,40));b.onclick=()=>openMedal(m,lv,false);row.append(b)}return row.children.length?row:null}
// Results: medals earned in this run.
function resultsMedals(){const box=$('#res-medal');if(!runMedals.length){box.hidden=true;return}box.hidden=false;box.replaceChildren();const last=runMedals[runMedals.length-1],m=medalById(last.id);
 box.append(medalEl(m,last.tier,34),el('div','res-medal-mid'));box.lastChild.append(el('b','',`NEW MEDAL! ${m.name} ${ROMAN[last.tier-1]}`),el('small','',runMedals.length>1?`+${runMedals.length-1} MORE · TAP TO SEE`:`${prizeText(last)} · TAP TO SEE`));box.onclick=()=>openMedal(m,medalLevel(m.id),true)}
