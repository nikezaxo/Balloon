'use strict';
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s),shell=$('.game-shell');
const FONT="'Lilita One',Impact,'Arial Black',sans-serif",calm=matchMedia('(prefers-reduced-motion: reduce)').matches;
const rand=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)],clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const PARTY=['#ff4d5e','#ffd23f','#44d9ff','#4fd36b','#a273ff','#ffffff'];
// Power-ups start appearing once the run passes their altitude; energy cells charge the boost engine.
const POWERS={
 gas:{name:'GAS BOOST',icon:'⛽',color:'#4fd36b',unlock:300,weight:3,desc:'A quick burst of speed plus 2 energy cells.'},
 energy:{name:'ENERGY CELL',icon:'⚡',color:'#ffd23f',unlock:800,weight:0,desc:'Collect 5 to charge the BOOST engine, then tap ⚡ BOOST (or press B) to rocket up and smash everything.'},
 magnet:{name:'COIN MAGNET',icon:'🧲',color:'#ff4d5e',unlock:1500,weight:2,desc:'Pulls nearby coins and energy cells to you for 8 seconds.'},
 nitro:{name:'NITRO ENGINE',icon:'🔥',color:'#ff8a2a',unlock:2500,weight:1.5,desc:'Rocket upward for 5 seconds and smash through anything.'},
 shield:{name:'BUBBLE SHIELD',icon:'🛡️',color:'#44d9ff',unlock:4500,weight:1.5,desc:'Absorbs one hit. Lasts up to 20 seconds.'}};
const PICKUPS=['gas','magnet','nitro','shield'];
const STAGE_EVENTS=[['Wind gusts with flying leaves','Plane drop: 3 parachutists at 1,200 m','Falling satellite junk from 1,500 m','Gas, magnet and nitro power-ups'],['Broken satellites raining down','Earth glowing far below','Bubble shields appear'],['Zero wind in space','Drifting asteroids','Shooting stars'],['Ringed giants and moons','A denser asteroid belt'],['Blazing meteors','Scorching solar glow'],['Meteor showers and asteroid fields','Nebulae and spiral galaxies','Endless: no finish line!']];
let SW=420,W=420,OX=0,H=700,dpr=1,state='menu',previousState='ready',alt=0,x=.5,vx=0,t=0,last=0,obstacles=[],coins=[],hazards=[],warnings=[],particles=[],pointer=null,target=null,sound=false,soundTouched=false,flightTime=0,spin=0,wind=0,weatherNow=null,leaves=[],leafClock=0,coinCount=0,shownCoins=0,nextObstacle=450,spawnIndex=0,planeEvent=null,people=[],nextPlaneTime=1200,junkClock=4;
// Game feel: camera shake, flashes, slow motion, popups, combos and a springy balloon with a face.
let shake=0,flash=0,flashColor='#fff',timeScale=1,slowTimer=0,deathTimer=0,popups=[],rings=[],flyers=[],streaks=[],trailClock=0,streakClock=0,combo=0,comboTimer=0,bestCombo=0,nearMisses=0,smashes=0,squash=0,squashV=0,blink=0,nextBlink=2,mood='happy',moodTimer=0,danger=0,ropeCut=null,lastZone='',nextMilestone=1000,passedBest=false,unlockNoted=new Set(),best=loadBest();
// Power-up state. A showcase is the short freeze-frame celebration after a pickup.
let energy=0,boost=null,speedMult=1,shield=0,magnet=0,invuln=0,showcase=null,powerCount=0;
const keys=new Set(),radius=29,worldScale=.65,hudCache={};
function loadBest(){try{return Number(localStorage.getItem('skybound-best'))||0}catch{return 0}}
function saveBest(value){try{localStorage.setItem('skybound-best',String(value))}catch{}}
// The canvas fills the screen; gameplay happens in a centred column at most 0.6× the screen height wide.
function resize(){const r=canvas.getBoundingClientRect();SW=r.width;H=r.height;W=Math.round(Math.min(SW,Math.max(360,H*.6)));OX=(SW-W)/2;dpr=Math.min(devicePixelRatio||1,2);canvas.width=SW*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);shell.style.setProperty('--pw',W+'px')}
new ResizeObserver(resize).observe(canvas);
function reset(mode='ready'){state=mode;alt=0;x=.5;vx=0;target=null;pointer=null;obstacles=[];coins=[];hazards=[];warnings=[];particles=[];leaves=[];flightTime=0;spin=0;wind=0;weatherNow=null;leafClock=0;coinCount=0;shownCoins=0;nextObstacle=450;spawnIndex=0;planeEvent=null;people=[];nextPlaneTime=1200;junkClock=4;keys.clear();
 shake=0;flash=0;timeScale=1;slowTimer=0;deathTimer=0;popups=[];rings=[];flyers=[];streaks=[];combo=0;comboTimer=0;bestCombo=0;nearMisses=0;smashes=0;squash=0;squashV=0;mood='happy';moodTimer=0;danger=0;ropeCut=null;lastZone=region().name;nextMilestone=1000;passedBest=false;
 energy=0;boost=null;speedMult=1;shield=0;magnet=0;invuln=0;showcase=null;powerCount=0;unlockNoted=new Set(Object.keys(POWERS).filter(k=>best>=POWERS[k].unlock));
 generateCourse();$('#weather').textContent='CALM AIR';$('#weather').classList.remove('gust');$('#hint').hidden=mode!=='ready';$('#menu').hidden=mode!=='menu';$('#overlay').hidden=true;$('#panel').hidden=true;$('#air-warning').hidden=true;$('#pause').textContent='Ⅱ';$('#pause').setAttribute('aria-label','Pause game');$('#announce').replaceChildren();showBest()}
function showBest(){const text=best?`🏆 BEST ${best.toLocaleString()} m`:'NO RECORD YET';$('#best').textContent=text;$('#menu-best').textContent=text}

// ---- Menu, full screen and sound ----
const fsElement=()=>document.fullscreenElement||document.webkitFullscreenElement;
function enterFullscreen(){const el=document.documentElement,request=el.requestFullscreen||el.webkitRequestFullscreen;if(fsElement()||!request)return;try{const p=request.call(el,{navigationUI:'hide'});if(p&&p.then)p.then(()=>{if(screen.orientation&&screen.orientation.lock)screen.orientation.lock('portrait').catch(()=>{})}).catch(()=>{})}catch{}}
function toggleFullscreen(){if(fsElement()){const p=(document.exitFullscreen||document.webkitExitFullscreen).call(document);if(p&&p.catch)p.catch(()=>{})}else enterFullscreen()}
if(!document.documentElement.requestFullscreen&&!document.documentElement.webkitRequestFullscreen)$$('.fs-toggle').forEach(b=>b.hidden=true);
function syncSound(){for(const b of $$('.sound-toggle')){b.textContent=sound?'🔊':'🔇';b.classList.toggle('on',sound);b.setAttribute('aria-pressed',String(sound));b.setAttribute('aria-label',sound?'Disable sound':'Enable sound')}}
async function toggleSound(){soundTouched=true;sound=await gameSound.enable(!sound);syncSound();if(sound)gameSound.effect('on')}
function play(){enterFullscreen();if(!soundTouched){soundTouched=true;gameSound.enable(true).then(on=>{sound=on;syncSound();if(on)gameSound.effect('on')})}reset('ready');canvas.focus()}
function openMenu(){reset('menu')}
function el(tag,cls='',text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e}
function openPanel(kind){const list=$('#panel-list');list.replaceChildren();
 if(kind==='stages'){$('#panel-title').textContent='STAGES & EVENTS';ZONES.forEach((z,i)=>{const next=ZONES[i+1],card=el('div','stage');card.style.setProperty('--a',z.top);card.style.setProperty('--b',z.bottom);if(i>0&&best<z.from){card.classList.add('locked');card.dataset.lock=`🔒 REACH ${z.from.toLocaleString()} m`}const ul=el('ul');for(const e of STAGE_EVENTS[i])ul.append(el('li','',e));card.append(el('span','range',next?`${z.from.toLocaleString()} – ${(next.from-1).toLocaleString()} m`:`${z.from.toLocaleString()} m +`),el('h3','',z.name),ul);list.append(card)})}
 else{$('#panel-title').textContent='POWER-UPS';for(const p of Object.values(POWERS)){const seen=best>=p.unlock,row=el('div','boost-item'+(seen?'':' locked')),ico=el('span','ico',p.icon),text=el('div');ico.style.setProperty('--c',p.color);text.append(el('h3','',p.name),el('p','',p.desc),el('small','',`${seen?'✔':'🔒'} APPEARS FROM ${p.unlock.toLocaleString()} m`));row.append(ico,text);list.append(row)}}
 $('#panel').hidden=false;list.scrollTop=0}
$('#play').onclick=play;$('#open-stages').onclick=()=>openPanel('stages');$('#open-boosts').onclick=()=>openPanel('boosts');$('#panel-close').onclick=()=>{$('#panel').hidden=true};
$$('.sound-toggle').forEach(b=>b.onclick=toggleSound);$$('.fs-toggle').forEach(b=>b.onclick=toggleFullscreen);$('#boost').onclick=activateEngine;

function launch(){if(state!=='ready')return;
 state='flying';$('#hint').hidden=true;gameSound.effect('launch');
 const r=rope(),cutY=(r.a.y+r.b.y)/2;ropeCut={age:0,length:r.b.y-cutY};
 burst(W/2,cutY,14,{type:'star',colors:['#fff','#ffd23f'],speed:[80,240],size:[4,7],life:[.3,.6]});
 rings.push({x:W/2,y:cutY,max:60,life:0,dur:.4,color:'#fff',width:5});
 burst(W/2,balloonY()+34,10,{type:'puff',colors:['#fff'],speed:[40,130],size:[8,14],life:[.5,.9],drag:3});
 squash=-.25;squashV=0;shake=7;mood='joy';moodTimer=1;announce('GO!','','go')}
function balloonY(){return H*(.68-Math.min(alt/300,1)*.09)}
function rope(){return {a:{x:W*.5,y:balloonY()+35},b:{x:W*.5,y:H-47}}}
function cross(a,b,c){return (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)}
function intersects(a,b,c,d){return cross(a,b,c)*cross(a,b,d)<=0&&cross(c,d,a)*cross(c,d,b)<=0&&Math.max(a.x,b.x)>=Math.min(c.x,d.x)&&Math.min(a.x,b.x)<=Math.max(c.x,d.x)&&Math.max(a.y,b.y)>=Math.min(c.y,d.y)&&Math.min(a.y,b.y)<=Math.max(c.y,d.y)}
function point(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left-OX,y:e.clientY-r.top}}
canvas.addEventListener('pointerdown',e=>{if(state==='menu')return;canvas.focus();canvas.setPointerCapture(e.pointerId);pointer=point(e);if(state==='flying')target=pointer.x/W});
canvas.addEventListener('pointermove',e=>{if(!pointer)return;const p=point(e);if(state==='ready'){const r=rope();if(intersects(pointer,p,r.a,r.b)&&Math.hypot(p.x-pointer.x,p.y-pointer.y)>2)launch()}else if(state==='flying')target=p.x/W;pointer=p});
function release(){pointer=null;target=null}canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
const GAME_KEYS=['ArrowLeft','ArrowRight','ArrowUp',' ','a','d','w','b','A','D','W','B','p','P','Escape','Shift'];
window.addEventListener('keydown',e=>{if(!GAME_KEYS.includes(e.key))return;if(!$('#panel').hidden){if(e.key==='Escape')$('#panel').hidden=true;return}e.preventDefault();const k=e.key.toLowerCase();keys.add(k);
 if(e.key===' '){if(state==='menu')play();else if(state==='ready')launch();else if(state==='dead'&&!$('#overlay').hidden)reset('ready')}
 if(['arrowup','w','b','shift'].includes(k))activateEngine();
 if(k==='p'||k==='escape')pause()});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
function show(label,title,text,primary,secondary,results=false){$('#result-label').textContent=label;$('#result-title').textContent=title;$('#result-text').textContent=text;$('#primary').textContent=primary;$('#secondary').textContent=secondary;$('#stats').hidden=!results;$('#record').hidden=true;$('#overlay').hidden=false}
function pause(){if(state==='paused'){state=previousState;$('#overlay').hidden=true;$('#pause').textContent='Ⅱ';$('#pause').setAttribute('aria-label','Pause game')}else if(state==='ready'||state==='flying'){previousState=state;state='paused';release();keys.clear();$('#pause').textContent='▶';$('#pause').setAttribute('aria-label','Resume game');show('PAUSED','Breather','The sky can wait a moment.','RESUME ▶','MENU')}gameSound.update(state,wind,flightSpeed(alt),alt,document.hidden)}
$('#pause').onclick=pause;$('#primary').onclick=()=>state==='paused'?pause():reset('ready');$('#secondary').onclick=openMenu;
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(state==='flying'||state==='ready'))pause()});

// ---- Effects helpers ----
function burst(px,py,n,{type='spark',colors=['#fff'],speed=[60,200],size=[2,5],life=[.4,.8],gravity=0,drag=2,world=false}={}){for(let i=0;i<n;i++){const a=Math.random()*TAU,s=rand(...speed);particles.push({type,x:px,y:py,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:0,max:rand(...life),size:rand(...size),color:pick(colors),gravity,drag,world,rot:rand(0,TAU),vr:rand(-8,8)})}}
function confetti(n){for(let i=0;i<n;i++)particles.push({type:'confetti',x:rand(0,W),y:rand(-90,-10),vx:rand(-40,40),vy:rand(60,170),gravity:80,drag:.4,life:0,max:rand(2,3),size:rand(7,11),color:pick(PARTY),rot:rand(0,TAU),vr:rand(-7,7)})}
function popup(px,py,text,color,size=24){popups.push({x:clamp(px,70,W-70),y:py,text,color,size,life:0,max:1,vy:-80,rot:rand(-.12,.12)})}
function bump(node){node.classList.remove('bump');void node.offsetWidth;node.classList.add('bump')}
function announce(text,sub,kind){const layer=$('#announce');layer.replaceChildren();const node=el('div',`announce ${kind}`);if(sub)node.append(el('small','',sub));node.append(el('strong','',text));node.addEventListener('animationend',e=>{if(e.target===node)node.remove()});layer.append(node)}
function countUp(node,value,suffix){const start=performance.now();const tick=now=>{const k=Math.min(1,(now-start)/900);node.textContent=Math.round(value*(1-(1-k)**3)).toLocaleString()+suffix;if(k<1)requestAnimationFrame(tick)};requestAnimationFrame(tick)}
const backOut=k=>1+3.2*(k-1)**3+2.2*(k-1)**2;

function finish(){state='dead';release();mood='dead';boost=null;shield=0;magnet=0;showcase=null;gameSound.effect('pop');const bx=x*W,by=balloonY();
 for(let i=0;i<16;i++){const a=Math.random()*TAU,s=rand(160,380);particles.push({type:'shard',x:bx+Math.cos(a)*15,y:by-5+Math.sin(a)*15,vx:Math.cos(a)*s,vy:Math.sin(a)*s-80,life:0,max:rand(.9,1.5),size:rand(6,12),color:i%2?'#ff4d5e':'#ffd23f',gravity:600,drag:1.2,rot:rand(0,TAU),vr:rand(-14,14)})}
 burst(bx,by,26,{type:'confetti',colors:PARTY,speed:[120,420],size:[6,10],life:[.7,1.2],gravity:300,drag:1.5});
 burst(bx,by,18,{colors:['#fff','#ffd23f'],speed:[200,500],size:[2,4],life:[.25,.5]});
 burst(bx,by,8,{type:'puff',colors:['#ffffff','#e9e4ff'],speed:[30,110],size:[10,18],life:[.6,1],drag:3});
 rings.push({x:bx,y:by,max:100,life:0,dur:.5,color:'#fff',width:8},{x:bx,y:by,max:160,life:0,dur:.75,color:'#ffd23f',width:5});
 popup(bx,by-40,'POP!','#ff4d5e',54);shake=22;flash=.9;flashColor='#fff';slowTimer=.45;deathTimer=1.1}
function showResult(){const a=Math.floor(alt),record=a>best;if(record){best=a;saveBest(a)}
 show(record?'NEW RECORD!':pick(['SO CLOSE!','NICE FLIGHT!','GREAT RUN!']),'POP!',`${region().name} · ${powerCount} power-up${powerCount===1?'':'s'} · ${smashes} smash${smashes===1?'':'es'} · ${nearMisses} close call${nearMisses===1?'':'s'} · best combo x${bestCombo}`,'PLAY AGAIN ↻','MENU',true);
 $('#record').hidden=!record;$('#stat-coins').textContent=coinCount;$('#stat-best').textContent=best.toLocaleString()+' m';countUp($('#stat-alt'),a,' m');showBest();if(record)gameSound.effect('record')}

// ---- Course ----
function spike(o){const yy=balloonY()+(alt-o.a)*worldScale;const len=W*(o.length+(o.moving?Math.sin(t*.8+o.phase)*.065:0));return {y:yy,len,side:o.side}}
function obstacleLook(){return alt<6000?{body:'#6b7aa6',top:'#a3b4e0',dark:'#4a557c'}:alt<16000?{body:'#6a3fd6',top:'#a885ff',dark:'#45238f'}:alt<23000?{body:'#b8432f',top:'#ff8a52',dark:'#7a2418'}:{body:'#2f6fd0',top:'#72b8ff',dark:'#1d4590'}}
// Chunky outlined ledge with a metal spike tip; moving ledges get hazard stripes and a siren.
function drawObstacle(o){if(o.broken)return;const z=spike(o);if(z.y<-70||z.y>H+70)return;const look=obstacleLook(),L=z.len;
 ctx.save();ctx.translate(o.side?W:0,z.y);ctx.scale(o.side?-1:1,1);ctx.lineJoin='round';
 const tip=new Path2D();tip.moveTo(L-16,-20);tip.lineTo(L+9,0);tip.lineTo(L-16,20);tip.closePath();
 ctx.fillStyle=o.moving?'#ff5a6a':'#eef3fb';ctx.fill(tip);ctx.fillStyle=o.moving?'#b3203a':'#9aa6bd';ctx.beginPath();ctx.moveTo(L-16,0);ctx.lineTo(L+9,0);ctx.lineTo(L-16,20);ctx.closePath();ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=3.5;ctx.stroke(tip);
 const body=new Path2D();body.moveTo(-12,-24);body.lineTo(L-20,-24);body.quadraticCurveTo(L-10,-24,L-10,-14);body.lineTo(L-10,14);body.quadraticCurveTo(L-10,24,L-20,24);body.lineTo(-12,24);body.closePath();
 ctx.fillStyle=look.body;ctx.fill(body);ctx.save();ctx.clip(body);ctx.fillStyle=look.top;ctx.fillRect(-12,-24,L,10);ctx.fillStyle=look.dark;ctx.fillRect(-12,13,L,11);
 if(o.moving){ctx.fillStyle='#ffd23f';ctx.fillRect(-12,-8,L,14);ctx.fillStyle=INK;for(let s=-12;s<L;s+=18){ctx.beginPath();ctx.moveTo(s,-8);ctx.lineTo(s+9,-8);ctx.lineTo(s+1,6);ctx.lineTo(s-8,6);ctx.closePath();ctx.fill()}}
 else{ctx.fillStyle='rgba(255,255,255,.22)';for(let s=10;s<L-24;s+=26){ctx.beginPath();ctx.arc(s,0,3.2,0,TAU);ctx.fill()}}
 const g=((t*.7+o.phase)%2.5)/2.5*(L+80)-40;ctx.fillStyle='rgba(255,255,255,.45)';ctx.beginPath();ctx.moveTo(g,-24);ctx.lineTo(g+14,-24);ctx.lineTo(g+2,24);ctx.lineTo(g-12,24);ctx.closePath();ctx.fill();ctx.restore();
 ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.stroke(body);
 if(o.moving){const on=Math.sin(t*10+o.phase)>0;if(on){ctx.fillStyle='rgba(255,60,80,.3)';ctx.beginPath();ctx.arc(L-30,-27,15,0,TAU);ctx.fill()}ctx.fillStyle=on?'#ff3b4f':'#6b1020';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(L-30,-24,7,Math.PI,0);ctx.closePath();ctx.fill();ctx.stroke()}
 ctx.restore()}
// Project a rotating 3D surface onto the 2D canvas, cel-shaded into three tones.
const shape=lat=>({r:29*Math.cos(lat)*(1-.16*Math.sin(lat)),y:33*Math.sin(lat)-5});
const BALLOON=(()=>{const p=new Path2D(),n=40;for(let i=0;i<=n;i++){const v=shape(-Math.PI/2+i/n*Math.PI);i?p.lineTo(v.r,v.y):p.moveTo(v.r,v.y)}for(let i=n;i>=0;i--){const v=shape(-Math.PI/2+i/n*Math.PI);p.lineTo(-v.r,v.y)}p.closePath();return p})();
const GORES=[['#ff7a86','#ff3b52','#c41d3d'],['#ffe680','#ffc21a','#d98a00']];
const engineOn=()=>boost&&boost.kind!=='gas';
function drawBalloon(){
 if(state==='dead')return;
 const flying=state==='flying'||(state==='paused'&&previousState==='flying'),waiting=state==='ready'||state==='menu';
 ctx.save();ctx.translate(x*W,balloonY()+Math.sin(t*2)*(waiting?3:1));ctx.rotate(vx*.16+wind*.12);
 if(invuln>0&&Math.sin(t*40)>0)ctx.globalAlpha=.45;
 if(engineOn()){const len=(boost.kind==='nitro'?50:40)*(1+Math.random()*.35),g=ctx.createLinearGradient(0,50,0,50+len);g.addColorStop(0,'#fff6b0');g.addColorStop(.35,'#ffb020');g.addColorStop(1,'rgba(255,60,40,0)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-9,50);ctx.quadraticCurveTo(0,50+len*1.25,9,50);ctx.closePath();ctx.fill();
  ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.lineJoin='round';ctx.fillStyle='#c4cee0';ctx.beginPath();ctx.roundRect(-10,33,20,15,4);ctx.fill();ctx.stroke();ctx.fillStyle='#ff4d5e';ctx.fillRect(-8.5,38,17,4);ctx.fillStyle='#5f6b85';ctx.beginPath();ctx.moveTo(-7,48);ctx.lineTo(7,48);ctx.lineTo(10,54);ctx.lineTo(-10,54);ctx.closePath();ctx.fill();ctx.stroke()}
 else if(flying){ctx.strokeStyle=INK;ctx.lineWidth=2.2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,35);ctx.bezierCurveTo(-wind*20-vx*14,46,8,52,Math.sin(t*5)*7-wind*30-vx*24,66);ctx.stroke()}
 const stretch=flying?Math.min(.08,(flightSpeed(alt)*speedMult-130)/2000):0;
 ctx.save();ctx.scale(1-squash*.6-stretch*.5,1+squash+stretch);
 ctx.save();ctx.clip(BALLOON);
 const rows=14,cols=24,vertex=(lat,lon)=>{const s=shape(lat);return {x:s.r*Math.sin(lon),y:s.y}};
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
  const lat=-Math.PI/2+row/rows*Math.PI,lon=-Math.PI/2+col/cols*Math.PI,ml=lat+Math.PI/rows/2,mo=lon+Math.PI/cols/2;
  const nx=Math.cos(ml)*Math.sin(mo),ny=Math.sin(ml),nz=Math.cos(ml)*Math.cos(mo),light=-nx*.4-ny*.45+nz*.72;
  const gore=Math.floor((((mo+spin)%TAU+TAU)%TAU)/(TAU/10));
  ctx.fillStyle=GORES[gore%2][light>.62?0:light>.28?1:2];
  ctx.beginPath();[vertex(lat,lon),vertex(lat+Math.PI/rows,lon),vertex(lat+Math.PI/rows,lon+Math.PI/cols),vertex(lat,lon+Math.PI/cols)].forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();ctx.fill();ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=1;ctx.stroke()}
 ctx.restore();
 ctx.fillStyle='rgba(255,255,255,.9)';ctx.beginPath();ctx.ellipse(-14,-21,4.5,8.5,.5,0,TAU);ctx.fill();ctx.beginPath();ctx.arc(-7,-31,2.3,0,TAU);ctx.fill();
 drawFace();
 ctx.strokeStyle=INK;ctx.lineWidth=3.5;ctx.lineJoin='round';ctx.stroke(BALLOON);
 ctx.fillStyle='#e8344c';ctx.beginPath();ctx.moveTo(0,26);ctx.lineTo(-6,35);ctx.lineTo(6,35);ctx.closePath();ctx.fill();ctx.lineWidth=2.5;ctx.stroke();
 ctx.restore();ctx.restore()}
// Eyes follow the steering and react: joy after coins, fright near hazards, sunglasses when powered up.
function drawFace(){const lx=clamp(vx*2.2+(state==='ready'||state==='menu'?Math.sin(t*.8)*.7:0),-1,1)*3;
 ctx.fillStyle='rgba(255,110,150,.5)';for(const s of [-1,1]){ctx.beginPath();ctx.ellipse(s*16,1,4,2.4,0,0,TAU);ctx.fill()}
 ctx.strokeStyle=INK;ctx.lineCap='round';ctx.lineJoin='round';
 if(mood==='cool'){ctx.fillStyle=INK;ctx.beginPath();ctx.moveTo(-18,-14);ctx.lineTo(18,-14);ctx.lineTo(16,-6);ctx.quadraticCurveTo(10,1,3,-5);ctx.lineTo(-3,-5);ctx.quadraticCurveTo(-10,1,-16,-6);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-14,-11);ctx.lineTo(-9,-11);ctx.moveTo(5,-11);ctx.lineTo(10,-11);ctx.stroke();ctx.strokeStyle=INK;ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(-5,3);ctx.quadraticCurveTo(1,9,8,1);ctx.stroke();return}
 if(mood==='star'){for(const s of [-1,1]){ctx.fillStyle='#ffd23f';star(s*9,-8,8.5,3.8,5);ctx.fill();ctx.lineWidth=2;ctx.stroke()}ctx.fillStyle='#7a1030';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(-8,2);ctx.quadraticCurveTo(0,17,8,2);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#ff7a9a';ctx.beginPath();ctx.ellipse(0,8.5,3.5,2,0,0,TAU);ctx.fill();return}
 const scared=mood==='scared'||mood==='wow',open=blink>0?.15:1,ly=scared?-1:0;
 for(const s of [-1,1]){ctx.fillStyle='#fff';ctx.lineWidth=2.2;ctx.beginPath();ctx.ellipse(s*9+lx*.4,-8,scared?7:6,(scared?9:7.5)*open,0,0,TAU);ctx.fill();ctx.stroke();
  if(open>.5){ctx.fillStyle=INK;ctx.beginPath();ctx.ellipse(s*9+lx,-7+ly,scared?2.6:3.2,scared?3.4:4.2,0,0,TAU);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(s*9+lx+1.2,-9+ly,1.2,0,TAU);ctx.fill()}
  if(mood==='scared'){ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(s*4,-19);ctx.lineTo(s*13,-21);ctx.stroke()}}
 ctx.lineWidth=2.3;ctx.fillStyle='#7a1030';
 if(scared){ctx.beginPath();ctx.ellipse(lx*.3,6,3.4,mood==='wow'?5:3.8,0,0,TAU);ctx.fill();ctx.stroke()}
 else if(mood==='joy'){ctx.beginPath();ctx.moveTo(-6,2);ctx.quadraticCurveTo(lx*.3,14,6,2);ctx.closePath();ctx.fill();ctx.stroke()}
 else{ctx.beginPath();ctx.arc(lx*.3,1,5,.18*Math.PI,.82*Math.PI);ctx.stroke()}}
// Shield bubble and magnet ring around the balloon.
function drawAuras(){const bx=x*W,by=balloonY()-4;
 if(magnet>0){ctx.save();ctx.translate(bx,by);ctx.rotate(t*2);ctx.setLineDash([8,10]);ctx.strokeStyle=`rgba(255,77,94,${magnet<2?.3+.3*Math.sin(t*20):.7})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,66,0,TAU);ctx.stroke();ctx.restore()}
 if(shield>0&&!(shield<3&&Math.sin(t*18)<0)){const r=50+Math.sin(t*4)*2,g=ctx.createRadialGradient(bx,by,r*.55,bx,by,r);g.addColorStop(0,'rgba(68,217,255,0)');g.addColorStop(.85,'rgba(68,217,255,.35)');g.addColorStop(1,'rgba(190,245,255,.85)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(bx,by,r,0,TAU);ctx.fill();ctx.strokeStyle='#bff4ff';ctx.lineWidth=3;ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.arc(bx,by,r-9,-2.6,-1.8);ctx.stroke()}}
function weatherAt(seconds){if(alt>=6000)return {warning:false,active:false,dir:1,force:0};const cycle=Math.floor(seconds/18),phase=seconds%18,dir=cycle%2===0?1:-1;return {warning:phase>=8&&phase<10,active:phase>=10&&phase<16,dir,force:phase>=10&&phase<16?dir*Math.sin((phase-10)/6*Math.PI)*(.19+.13*Math.min(alt/10000,1))*(1+.2*Math.sin(seconds*5)):0}}
// No speed cap or altitude finish line: speed starts brisk and keeps increasing with height.
function flightSpeed(height){return 130+1.4*Math.sqrt(Math.max(0,height))}
function weightedPick(kinds){let total=0;for(const k of kinds)total+=POWERS[k].weight;let r=Math.random()*total;for(const k of kinds){r-=POWERS[k].weight;if(r<=0)return k}return kinds[0]}
// Generate just ahead of the player; discard objects below the screen.
function generateCourse(){const horizon=alt+H/worldScale+flightSpeed(alt)*2.5;
 while(nextObstacle<horizon){const i=spawnIndex++,a=nextObstacle,slot=a-140,cx=.5+Math.sin(i*2.3)*.16;
  obstacles.push({a,side:i%2,length:.25+(Math.sin(i*4.7)+1)*.105,moving:i>5&&i%4===0,phase:i*1.8});
  let kind='coin';if(i>=2&&i%4===2){const pool=PICKUPS.filter(k=>POWERS[k].unlock<=slot);if(pool.length)kind=weightedPick(pool)}
  coins.push({a:slot,x:cx,kind});
  if(slot>=POWERS.energy.unlock&&i%3===1)coins.push({a:slot-75,x:cx,kind:'energy'});
  // Space rocks drift through the gaps beyond the starfield.
  if(slot>=6000&&Math.random()<clamp((slot-6000)/10000,.3,.65))hazards.push({kind:'rock',a:slot+rand(-20,20),x:cx>.5?cx-.3:cx+.3,vx:(Math.random()<.5?-1:1)*rand(.03,.07),r:rand(16,24),rot:rand(0,TAU),vr:rand(-1.5,1.5),fall:0,seed:Math.random()*100});
  nextObstacle+=Math.max(300,flightSpeed(a)*1.65)}
 const floor=alt-H/worldScale-100;obstacles=obstacles.filter(o=>o.a>floor);coins=coins.filter(c=>!c.collected&&c.a>floor);
}
function updateWeather(dt){const weather=weatherNow=weatherAt(flightTime);wind=weather.force;
 $('#weather').textContent=weather.warning?`GUST INCOMING ${weather.dir>0?'→':'←'}`:weather.active?`STRONG WIND ${weather.dir>0?'→':'←'}`:alt>=6000?'ZERO WIND':'CALM AIR';
 $('#weather').classList.toggle('gust',weather.active||weather.warning);
 if(weather.active){leafClock+=dt;while(leafClock>.075){leafClock-=.075;leaves.push({x:weather.dir>0?-20:SW+20,y:Math.random()*H,dir:weather.dir,speed:140+Math.random()*170,angle:Math.random()*6,size:4+Math.random()*5,phase:Math.random()*6})}}else leafClock=0;
 for(const l of leaves){l.x+=l.dir*l.speed*dt;l.y+=(22+Math.sin(t*4+l.phase)*28)*dt;l.angle+=dt*l.dir*5}leaves=leaves.filter(l=>l.x>-50&&l.x<SW+50&&l.y<H+30);
}
function drawLeaves(){if(Math.abs(wind)>.01){ctx.fillStyle=`rgba(52,88,140,${Math.abs(wind)*.18})`;ctx.fillRect(-40,-40,SW+80,H+80)}
 for(const l of leaves){ctx.save();ctx.translate(l.x,l.y);ctx.rotate(l.angle);ctx.scale(1,.45+.4*Math.abs(Math.sin(t*4+l.phase)));ctx.fillStyle=l.size>6?'#ffb340':'#5fcf5a';ctx.strokeStyle=INK;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-l.size,0);ctx.quadraticCurveTo(0,-l.size,l.size,0);ctx.quadraticCurveTo(0,l.size,-l.size,0);ctx.fill();ctx.stroke();ctx.restore()}}
function drawChevrons(){if(state!=='flying'||!weatherNow||!weatherNow.warning)return;const d=weatherNow.dir;ctx.save();ctx.globalAlpha=.55+.45*Math.sin(t*14);ctx.translate(d>0?30:W-30,H*.5);ctx.scale(d,1);ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();for(let i=0;i<3;i++){const ox=i*14-14;ctx.moveTo(ox-6,-14);ctx.lineTo(ox+6,0);ctx.lineTo(ox-6,14)}ctx.strokeStyle=INK;ctx.lineWidth=10;ctx.stroke();ctx.strokeStyle='#ffd23f';ctx.lineWidth=5;ctx.stroke();ctx.restore()}
function coinY(item){return balloonY()+(alt-item.a)*worldScale}
function star(cx,cy,outer,inner,n){ctx.beginPath();for(let i=0;i<n*2;i++){const a=-Math.PI/2+i*Math.PI/n,r=i%2?inner:outer;ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r)}ctx.closePath()}
// Spinning gold coin with a visible rim, star emblem and soft glow.
function drawCoin(cx,cy,r,phase,glow=true){const c=Math.cos(phase),w=Math.max(.14,Math.abs(c));ctx.save();ctx.translate(cx,cy);ctx.lineJoin='round';
 if(glow){ctx.globalAlpha=.3;ctx.fillStyle='#fff3a0';ctx.beginPath();ctx.arc(0,0,r*1.6+Math.sin(t*4+phase)*2,0,TAU);ctx.fill();ctx.globalAlpha=1}
 ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.fillStyle='#c27800';ctx.beginPath();ctx.ellipse((1-w)*r*.35*(c>0?1:-1),0,r*w,r,0,0,TAU);ctx.fill();ctx.stroke();
 ctx.fillStyle='#ffcf2e';ctx.beginPath();ctx.ellipse(0,0,r*w,r,0,0,TAU);ctx.fill();ctx.stroke();
 ctx.strokeStyle='#fff09a';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,r*w*.7,r*.7,0,0,TAU);ctx.stroke();
 ctx.scale(w,1);ctx.fillStyle='#fff6c2';star(0,0,r*.46,r*.2,5);ctx.fill();ctx.strokeStyle='#d99400';ctx.lineWidth=1.5;ctx.stroke();ctx.restore()}
// Power-up bubble with a hand-drawn symbol (canvas emoji support varies, so these are drawn).
function drawPickup(kind,cx,cy,r){const c=POWERS[kind].color;ctx.save();ctx.translate(cx,cy);ctx.lineJoin='round';ctx.lineCap='round';
 ctx.globalAlpha=.3;ctx.fillStyle=c;ctx.beginPath();ctx.arc(0,0,Math.max(0,r*1.55+Math.sin(t*5)*2),0,TAU);ctx.fill();ctx.globalAlpha=1;
 const g=ctx.createRadialGradient(-r*.3,-r*.35,r*.1,0,0,r);g.addColorStop(0,'#ffffff');g.addColorStop(.4,c);g.addColorStop(1,mixColor(c,INK,.35));ctx.fillStyle=g;ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fill();ctx.stroke();
 drawSymbol(kind,r*.62);ctx.fillStyle='rgba(255,255,255,.75)';ctx.beginPath();ctx.ellipse(-r*.42,-r*.5,r*.2,r*.12,-.6,0,TAU);ctx.fill();ctx.restore()}
function drawSymbol(kind,s){ctx.fillStyle='#fff';ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.beginPath();
 if(kind==='gas'){ctx.roundRect(-s*.6,-s*.5,s*1.2,s*1.4,s*.22);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-s*.2,-s*.5);ctx.lineTo(-s*.05,-s*.9);ctx.lineTo(s*.4,-s*.9);ctx.lineTo(s*.4,-s*.5);ctx.stroke();ctx.strokeStyle='#2fa84a';ctx.beginPath();ctx.moveTo(-s*.28,-s*.12);ctx.lineTo(s*.28,s*.55);ctx.moveTo(s*.28,-s*.12);ctx.lineTo(-s*.28,s*.55);ctx.stroke();return}
 if(kind==='magnet'){const r=s*.55,path=()=>{ctx.beginPath();ctx.moveTo(r,-s*.75);ctx.lineTo(r,0);ctx.arc(0,0,r,0,Math.PI);ctx.lineTo(-r,-s*.75)};ctx.lineCap='butt';path();ctx.lineWidth=s*.5+5;ctx.stroke();path();ctx.lineWidth=s*.5;ctx.strokeStyle='#fff';ctx.stroke();ctx.strokeStyle='#ff4d5e';for(const sx of [-r,r]){ctx.beginPath();ctx.moveTo(sx,-s*.75);ctx.lineTo(sx,-s*.42);ctx.stroke()}return}
 if(kind==='nitro'){ctx.moveTo(0,-s);ctx.bezierCurveTo(s*.9,-s*.2,s*.75,s*.9,0,s*.9);ctx.bezierCurveTo(-s*.75,s*.9,-s*.9,-s*.2,0,-s);ctx.fillStyle='#ffd23f';ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(0,-s*.2);ctx.bezierCurveTo(s*.4,s*.2,s*.35,s*.7,0,s*.7);ctx.bezierCurveTo(-s*.35,s*.7,-s*.4,s*.2,0,-s*.2);ctx.fillStyle='#fff';ctx.fill();return}
 if(kind==='shield'){ctx.moveTo(0,-s);ctx.lineTo(s*.8,-s*.65);ctx.lineTo(s*.7,s*.2);ctx.quadraticCurveTo(s*.5,s*.75,0,s);ctx.quadraticCurveTo(-s*.5,s*.75,-s*.7,s*.2);ctx.lineTo(-s*.8,-s*.65);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#44d9ff';ctx.beginPath();ctx.moveTo(0,-s*.65);ctx.lineTo(s*.5,-s*.42);ctx.lineTo(s*.42,s*.15);ctx.quadraticCurveTo(s*.3,s*.5,0,s*.68);ctx.closePath();ctx.fill();return}
 ctx.moveTo(s*.15,-s);ctx.lineTo(-s*.55,s*.12);ctx.lineTo(-s*.02,s*.12);ctx.lineTo(-s*.18,s);ctx.lineTo(s*.58,-s*.18);ctx.lineTo(s*.04,-s*.18);ctx.closePath();ctx.fillStyle='#fff6b0';ctx.fill();ctx.stroke()}
function drawPickups(){for(const item of coins){if(item.collected)continue;const yy=coinY(item),cx=item.x*W;if(yy<-50||yy>H+50)continue;const bob=Math.sin(t*3+item.a)*3;
 if(item.kind==='coin')drawCoin(cx,yy+bob,14,t*2.5+item.a);
 else if(item.kind==='energy')drawPickup('energy',cx,yy+bob,12);
 else{drawPickup(item.kind,cx,yy+bob,19*(1+.07*Math.sin(t*6)));const a=t*3;ctx.fillStyle='#fff';star(cx+Math.cos(a)*30,yy+bob+Math.sin(a)*30,5,2,4);ctx.fill()}}}
function collectPickups(dt){for(const item of coins){if(item.collected)continue;let cx=item.x*W,cy=coinY(item);
 if(magnet>0&&(item.kind==='coin'||item.kind==='energy')){const dx=x*W-cx,dy=balloonY()-cy;if(Math.hypot(dx,dy)<220){const k=Math.min(1,dt*6);item.x+=dx/W*k;item.a-=dy/worldScale*k;cx=item.x*W;cy=coinY(item)}}
 const dx=cx-x*W,dy=cy-balloonY();if((dx/43)**2+(dy/48)**2>=1)continue;item.collected=true;
 if(item.kind==='coin'){coinCount++;combo=comboTimer>0?combo+1:1;comboTimer=2.6;bestCombo=Math.max(bestCombo,combo);gameSound.effect('coin',combo);
  burst(cx,cy,12,{colors:['#ffd23f','#fff3a0','#fff'],speed:[80,240],size:[2,4],life:[.3,.6],world:true});burst(cx,cy,4,{type:'star',colors:['#fff6b0'],speed:[40,120],size:[5,8],life:[.5,.8],world:true});
  rings.push({x:cx,y:cy,max:40,life:0,dur:.35,color:'#ffe680',width:4});popup(cx,cy-24,combo>=3?`COMBO x${combo}!`:'+1',combo>=3?'#ff9a3c':'#ffd23f',combo>=3?28:24);
  flyers.push({x:cx,y:cy,age:0});squashV+=3;if(moodTimer<=0||mood==='happy'){mood='joy';moodTimer=.6}if(combo>=3)shake=Math.max(shake,3)}
 else if(item.kind==='energy'){const was=energy;energy=Math.min(5,energy+1);gameSound.effect('energy');burst(cx,cy,10,{type:'star',colors:['#ffd23f','#fff'],speed:[60,180],size:[3,6],life:[.3,.6],world:true});popup(cx,cy-22,energy===was?'FULL!':`⚡ ${energy}/5`,'#ffd23f',22);if(energy===5&&was<5)chargedUp()}
 else startShowcase(item.kind)}}
function chargedUp(){gameSound.effect('charged');announce('BOOST READY!','TAP ⚡ BOOST · B','record');bump($('#boost'))}

// ---- Hazards: course asteroids plus falling satellites, junk and meteors that arrive after a warning ----
function hazardY(h){return balloonY()+(alt-h.a)*worldScale}
function fallPlan(){if(alt<1500)return null;if(alt<3000)return[Math.random()<.25?'sat':'junk',[4.5,7]];if(alt<6000)return[Math.random()<.45?'sat':'junk',[2.4,3.8]];if(alt<16000)return['junk',[5,8]];if(alt<23000)return['meteor',[2.2,3.6]];return[Math.random()<.65?'meteor':'junk',[1.8,3]]}
function spawnFalling(w){const kind=w.kind;hazards.push({kind,a:alt+(balloonY()+70)/worldScale,x:w.x,vx:kind==='meteor'?(w.x<.5?1:-1)*rand(.06,.12):rand(-.05,.05),r:kind==='sat'?26:kind==='meteor'?17:15,rot:rand(0,TAU),vr:kind==='meteor'?rand(-2,2):rand(-1.6,1.6),fall:kind==='sat'?rand(90,120):kind==='meteor'?rand(150,200):rand(110,150),seed:Math.floor(Math.random()*100)})}
function updateHazards(dt){
 if(!planeEvent&&people.length===0){junkClock-=dt;if(junkClock<=0){const plan=fallPlan();if(plan){warnings.push({x:rand(.15,.85),time:1,kind:plan[0]});gameSound.effect('warn')}junkClock=plan?rand(...plan[1]):2}}
 for(const w of warnings){w.time-=dt;if(w.time<=0){w.done=true;spawnFalling(w)}}warnings=warnings.filter(w=>!w.done);
 for(const h of hazards){h.a-=h.fall/worldScale*dt;h.x+=h.vx*dt;h.rot+=h.vr*dt;if(h.kind!=='meteor'){const m=(h.r+6)/W;if(h.x<m||h.x>1-m){h.vx*=-1;h.x=clamp(h.x,m,1-m)}}
  const hy=hazardY(h);if(h.kind==='sat'&&Math.random()<dt*6)particles.push({type:'spark',x:h.x*W,y:hy,vx:rand(-90,90),vy:rand(-90,40),life:0,max:.35,size:2.5,color:pick(['#ffd23f','#fff']),gravity:200,drag:1,world:true,rot:0,vr:0});
  if(h.kind==='meteor'&&Math.random()<dt*30)particles.push({type:'puff',back:true,x:h.x*W+rand(-6,6),y:hy+rand(-6,6),vx:0,vy:-20,life:0,max:.5,size:rand(3,6),color:pick(['#ffb020','#ff6a2a']),gravity:0,drag:1,world:true,rot:0,vr:0})}
 hazards=hazards.filter(h=>!h.dead&&hazardY(h)<H+120)}
function hitsHazard(h){const dx=h.x*W-x*W,dy=hazardY(h)-(balloonY()-5),r=h.r*.85;return (dx/(26+r))**2+(dy/(30+r))**2<1}
function rockPath(r,seed){ctx.beginPath();for(let i=0;i<9;i++){const a=i/9*TAU,rr=r*(.78+.3*hash(seed+i));ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}ctx.closePath()}
function drawRock(h,fill='#9b8fb5',dark='#5f5578'){rockPath(h.r,h.seed);ctx.fillStyle=fill;ctx.fill();ctx.save();ctx.clip();ctx.fillStyle=dark;ctx.beginPath();ctx.arc(h.r*.4,h.r*.4,h.r*.9,0,TAU);ctx.fill();ctx.fillStyle='rgba(0,0,0,.25)';for(let i=0;i<3;i++){ctx.beginPath();ctx.arc((hash(h.seed+i*3)-.5)*h.r,(hash(h.seed+i*5)-.5)*h.r,h.r*(.15+.1*hash(h.seed+i)),0,TAU);ctx.fill()}ctx.fillStyle='rgba(255,255,255,.3)';ctx.beginPath();ctx.arc(-h.r*.35,-h.r*.35,h.r*.3,0,TAU);ctx.fill();ctx.restore();rockPath(h.r,h.seed);ctx.strokeStyle=INK;ctx.lineWidth=3.5;ctx.stroke()}
function solarPanel(px,py,w,h){ctx.fillStyle='#2f6fd0';ctx.fillRect(px,py,w,h);ctx.strokeStyle='#8cc4ff';ctx.lineWidth=1.5;ctx.beginPath();for(let i=1;i<3;i++){ctx.moveTo(px+w*i/3,py);ctx.lineTo(px+w*i/3,py+h)}ctx.moveTo(px,py+h/2);ctx.lineTo(px+w,py+h/2);ctx.stroke();ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.strokeRect(px,py,w,h)}
function drawSatellite(h){const r=h.r;ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-r*1.9,0);ctx.lineTo(r*1.3,0);ctx.stroke();solarPanel(-r*2.2,-r*.5,r*1.3,r);
 ctx.fillStyle='#2f6fd0';ctx.beginPath();ctx.moveTo(r*.8,-r*.5);ctx.lineTo(r*1.7,-r*.5);ctx.lineTo(r*1.45,-r*.1);ctx.lineTo(r*1.75,r*.15);ctx.lineTo(r*1.3,r*.5);ctx.lineTo(r*.8,r*.5);ctx.closePath();ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.stroke();
 const body=new Path2D();body.roundRect(-r*.7,-r*.65,r*1.4,r*1.3,5);ctx.fillStyle='#f2b630';ctx.fill(body);ctx.fillStyle='#c98a12';ctx.fillRect(r*.15,-r*.6,r*.5,r*1.2);ctx.stroke(body);
 ctx.fillStyle='#e6ecf5';ctx.beginPath();ctx.arc(0,-r*.65,r*.45,Math.PI,0);ctx.closePath();ctx.fill();ctx.stroke();
 if(Math.sin(t*12+h.seed)>0){ctx.fillStyle='#ff3b4f';ctx.beginPath();ctx.arc(-r*.35,r*.3,3.5,0,TAU);ctx.fill()}}
function drawJunk(h){const r=h.r;ctx.strokeStyle=INK;ctx.lineWidth=3;
 if(h.seed%2<1){const shard=new Path2D();shard.moveTo(-r,-r*.7);shard.lineTo(r*.9,-r*.8);shard.lineTo(r*.6,-r*.1);shard.lineTo(r,r*.3);shard.lineTo(r*.2,r*.8);shard.lineTo(-r*.9,r*.6);shard.closePath();ctx.fillStyle='#2f6fd0';ctx.fill(shard);ctx.save();ctx.clip(shard);ctx.strokeStyle='#8cc4ff';ctx.lineWidth=1.5;ctx.beginPath();for(let i=-1;i<=1;i++){ctx.moveTo(i*r*.6,-r);ctx.lineTo(i*r*.6,r)}ctx.moveTo(-r,0);ctx.lineTo(r,0);ctx.stroke();ctx.restore();ctx.stroke(shard)}
 else{const gear=new Path2D();for(let i=0;i<24;i++){const a=i/24*TAU,rr=i%3===0?r*.72:r;gear.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}gear.closePath();ctx.fillStyle='#b8c2d6';ctx.fill(gear);ctx.stroke(gear);ctx.fillStyle='#6b7aa6';ctx.beginPath();ctx.arc(0,0,r*.32,0,TAU);ctx.fill();ctx.stroke()}}
function drawMeteor(h){const vy=h.fall+flightSpeed(alt)*speedMult*worldScale;ctx.rotate(Math.atan2(vy,h.vx*W)-Math.PI/2);const r=h.r,g=ctx.createLinearGradient(0,0,0,-r*6);g.addColorStop(0,'rgba(255,210,63,.95)');g.addColorStop(.4,'rgba(255,110,40,.6)');g.addColorStop(1,'rgba(255,60,40,0)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-r*.95,0);ctx.quadraticCurveTo(0,-r*7,r*.95,0);ctx.closePath();ctx.fill();
 ctx.rotate(h.rot);drawRock(h,'#a8402a','#6b1f14');rockPath(h.r*.55,h.seed+3);ctx.strokeStyle='#ffb347';ctx.lineWidth=2;ctx.stroke()}
function drawHazards(){for(const h of hazards){const hy=hazardY(h);if(hy<-90||hy>H+90)continue;ctx.save();ctx.translate(h.x*W,hy);ctx.lineJoin='round';ctx.lineCap='round';if(h.kind==='meteor')drawMeteor(h);else{ctx.rotate(h.rot);if(h.kind==='rock')drawRock(h);else if(h.kind==='sat')drawSatellite(h);else drawJunk(h)}ctx.restore()}}
function drawWarnings(){for(const w of warnings){if(Math.sin(w.time*25)<-.2)continue;ctx.save();ctx.translate(w.x*W,Math.min(H*.3,215));ctx.lineJoin='round';ctx.fillStyle=w.kind==='meteor'?'#ff8a2a':'#ff4d5e';ctx.strokeStyle=INK;ctx.lineWidth=3.5;ctx.beginPath();ctx.moveTo(0,-17);ctx.lineTo(17,13);ctx.lineTo(-17,13);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.font=`20px ${FONT}`;ctx.textAlign='center';ctx.fillText('!',0,10);ctx.restore()}}

// ---- Power-ups ----
const smashing=()=>engineOn()||invuln>0;
function startShowcase(kind){const P=POWERS[kind];showcase={kind,age:0,dur:1.6};mood=kind==='nitro'||kind==='shield'||kind==='energy'?'cool':'star';moodTimer=2.4;announce(`${P.icon} ${kind==='energy'?'ENGINE BOOST':P.name}`,kind==='energy'?'FULL POWER!':'POWER-UP!','power');gameSound.effect('power');
 burst(x*W,balloonY(),26,{type:'star',colors:[P.color,'#fff','#ffd23f'],speed:[80,260],size:[4,8],life:[.6,1.1],drag:1.5});confetti(24);squash=.3;squashV=0}
function applyPower(kind){const P=POWERS[kind],bx=x*W,by=balloonY();powerCount++;
 if(kind==='gas'){energy=Math.min(5,energy+2);if(!boost||boost.kind==='gas')boost={kind:'gas',time:2.5,dur:2.5,mult:1.4};gameSound.effect('boost');if(energy===5)chargedUp()}
 if(kind==='magnet'){magnet=8;gameSound.effect('boost')}
 if(kind==='nitro'){boost={kind:'nitro',time:5,dur:5,mult:1.9};gameSound.effect('nitro')}
 if(kind==='shield'){shield=20;gameSound.effect('shield')}
 if(kind==='energy'){boost={kind:'engine',time:3.5,dur:3.5,mult:1.7};gameSound.effect('nitro')}
 burst(bx,by,24,{colors:[P.color,'#fff'],speed:[150,420],size:[2,5],life:[.3,.6]});rings.push({x:bx,y:by,max:110,life:0,dur:.5,color:P.color,width:7});shake=Math.max(shake,10);flash=.25;flashColor=P.color;squash=-.2}
function activateEngine(){if(state!=='flying'||showcase||energy<5)return;energy=0;startShowcase('energy')}
function breakShield(){shield=0;invuln=1.2;gameSound.effect('shieldbreak');const bx=x*W,by=balloonY();burst(bx,by,22,{type:'shard',colors:['#bff4ff','#44d9ff','#ffffff'],speed:[150,330],size:[5,9],life:[.5,.9],gravity:300});rings.push({x:bx,y:by,max:90,life:0,dur:.45,color:'#bff4ff',width:6});popup(bx,by-60,'SHIELD SAVED YOU!','#44d9ff',24);shake=Math.max(shake,12)}
function smashFx(px,py,colors,text){smashes++;gameSound.effect('smash');burst(px,py,14,{type:'shard',colors,speed:[120,320],size:[5,10],life:[.6,1],gravity:500,world:true});burst(px,py,10,{colors:['#fff','#ffd23f'],speed:[150,380],life:[.2,.45]});rings.push({x:px,y:py,max:60,life:0,dur:.35,color:'#fff',width:5});popup(px,py-30,text,'#ff8a2a',26);shake=Math.max(shake,9)}
function breakLedge(o,z){o.broken=true;const look=obstacleLook(),reach=Math.min(z.len,x*W+40),px=o.side?W-reach*.6:reach*.6;smashFx(px,z.y,[look.body,look.top,look.dark],'SMASH!')}
function smashHazard(h){h.dead=true;const hx=h.x*W,hy=hazardY(h);smashFx(hx,hy,h.kind==='meteor'?['#a8402a','#ffb020']:h.kind==='rock'?['#9b8fb5','#5f5578']:['#2f6fd0','#f2b630','#b8c2d6'],'SMASH +1');coinCount++;flyers.push({x:hx,y:hy,age:0})}

const gapTo=(o,z)=>o.side?(W-z.len-8)-(x*W+28):(x*W-28)-(z.len+8);
function hitsObstacle(z){const left=z.side?W-z.len-8:0,right=z.side?W:z.len+8;const tilt=vx*.16+wind*.12;return [{offset:-5,rx:28,ry:32}].some(body=>{const cx=x*W-Math.sin(tilt)*body.offset,cy=balloonY()+Math.cos(tilt)*body.offset;const nx=Math.max(left,Math.min(cx,right)),ny=Math.max(z.y-26,Math.min(cy,z.y+26));return ((cx-nx)/body.rx)**2+((cy-ny)/body.ry)**2<1})}
// Reward skimming past a spike tip without touching it.
function checkNearMisses(clear){for(const o of obstacles){if(o.passed||o.a>alt)continue;o.passed=true;if(!clear||o.broken||smashing())continue;const z=spike(o);if(gapTo(o,z)<30){nearMisses++;popup(x*W,balloonY()-60,'CLOSE CALL!','#44d9ff',26);shake=Math.max(shake,5);gameSound.effect('close');burst(o.side?W-z.len-8:z.len+8,z.y,10,{colors:['#fff','#44d9ff'],speed:[100,260],life:[.2,.5],world:true});mood='wow';moodTimer=.7}}}
function measureDanger(){let d=0;const by=balloonY();if(!planeEvent&&people.length===0)for(const o of obstacles){if(o.broken)continue;const z=spike(o),dy=by-z.y;if(dy<-40||dy>110)continue;d=Math.max(d,Math.max(0,1-gapTo(o,z)/60)*(1-Math.abs(dy)/110))}
 for(const h of hazards)d=Math.max(d,clamp(1-(Math.hypot((h.x-x)*W,hazardY(h)-by)-h.r-30)/90,0,1));for(const p of people)if(!p.safe)d=Math.max(d,Math.max(0,1-(Math.hypot((p.x-x)*W,p.y-by)-50)/90));return Math.min(1,d)}
function checkProgress(){const zone=region().name;
 if(zone!==lastZone){lastZone=zone;nextMilestone=Math.floor(alt/1000)*1000+1000;announce(zone,'NEW ZONE','zone');gameSound.effect('zone');flash=.4;flashColor='#fff';confetti(36);return}
 for(const k of Object.keys(POWERS))if(!unlockNoted.has(k)&&alt>=POWERS[k].unlock){unlockNoted.add(k);announce(`${POWERS[k].icon} ${POWERS[k].name}`,'NEW POWER-UP UNLOCKED','record');gameSound.effect('zone');confetti(20);return}
 if(!passedBest&&best>0&&alt>best){passedBest=true;announce('NEW BEST!','KEEP GOING','record');gameSound.effect('record');confetti(24);return}
 if(alt>=nextMilestone){announce(`${nextMilestone.toLocaleString()} m`,'ALTITUDE','milestone');gameSound.effect('milestone');nextMilestone+=1000;bump($('.hud-alt'))}}
// A far-away aircraft passes first; its passengers arrive after a warning.
function updateAirTraffic(dt){
 if(!planeEvent&&alt>=nextPlaneTime&&alt<5000){planeEvent={age:0,released:0,lanes:(Math.random()<.5?[.22,.78,.28]:[.78,.22,.72]).map(v=>v+(Math.random()-.5)*.06)};nextPlaneTime=Infinity}
 if(planeEvent){const e=planeEvent;e.age+=dt;
  while(e.released<3&&e.age>=7+e.released*2.5){people.push({x:e.lanes[e.released],y:-45,phase:e.released*2+flightTime,vx:0});e.released++}
  $('#air-warning').hidden=!(e.age>=5&&e.age<13);
  if(e.age>14)planeEvent=null;
 }
 for(const p of people){p.y+=dt*95;p.x+=dt*(wind*.025+Math.sin(t*1.6+p.phase)*.018+p.vx);p.vx*=Math.exp(-2*dt);p.x=Math.max(.09,Math.min(.91,p.x))}
 const hadPeople=people.length>0;people=people.filter(p=>p.y<H+80);if(hadPeople&&!people.length&&!planeEvent)obstacles=obstacles.filter(o=>o.a<alt-200||o.a>alt+650);
}
// Lit 3D mesh: circular fuselage, solid wings and tail, perspective and depth sorting.
function drawPlane(){const e=planeEvent;if(!e||e.age>6)return;const u=Math.min(e.age/6,1);const px=W*(-.12+.55*Math.sin(u*Math.PI*.72)),py=H*(.45-.42*u),scale=1.1-u*.45;const faces=[];
 const project=([x,y,z])=>{const yaw=-.2-u*.7,roll=-.35-u*.65;const xx=x*Math.cos(yaw)+z*Math.sin(yaw),zz=-x*Math.sin(yaw)+z*Math.cos(yaw);const yy=y*.8-zz*.6,depth=y*.6+zz*.8;return {x:px+(xx*Math.cos(roll)-yy*Math.sin(roll))*scale*260/(260+depth),y:py+(xx*Math.sin(roll)+yy*Math.cos(roll))*scale*260/(260+depth),z:depth}};
 const face=(v,color)=>{const ps=v.map(project);faces.push({p:ps,z:ps.reduce((a,p)=>a+p.z,0)/ps.length,color})};
 const ringsOf=[[-45,0],[-33,7],[-20,9],[23,8],[37,3],[43,0]];
 for(let r=0;r<ringsOf.length-1;r++)for(let j=0;j<12;j++){const a=j*Math.PI/6,b=(j+1)*Math.PI/6,[xx,rr]=ringsOf[r],[nx,nr]=ringsOf[r+1];face([[xx,Math.sin(a)*rr,Math.cos(a)*rr],[nx,Math.sin(a)*nr,Math.cos(a)*nr],[nx,Math.sin(b)*nr,Math.cos(b)*nr],[xx,Math.sin(b)*rr,Math.cos(b)*rr]],`hsl(205 24% ${54+24*Math.max(0,-Math.sin(a))}%)`)}
 for(const side of [-1,1]){face([[-12,0,0],[12,0,side*48],[27,0,side*49],[15,0,0]],'#d9e4eb');face([[12,0,side*48],[27,0,side*49],[27,3,side*49],[12,3,side*48]],'#71889b');face([[27,-2,0],[35,-3,side*21],[43,-3,side*22],[40,-2,0]],'#98afbf');face([[-32,-5,side*4],[-22,-8,side*6],[-15,-7,side*6],[-20,-4,side*8]],'#27475a')}
 face([[26,-5,0],[34,-26,0],[42,-26,0],[40,-3,0]],'#ff4d5e');
 if(e.age>3.8){for(let i=0;i<9;i++){ctx.fillStyle=`rgba(255,255,255,${.5-i*.05})`;ctx.beginPath();ctx.arc(px+25+i*8,py+10+i*5,3+i*1.4,0,TAU);ctx.fill()}}
 faces.sort((a,b)=>b.z-a.z).forEach(f=>{ctx.fillStyle=f.color;ctx.beginPath();f.p.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();ctx.fill()});
}
function drawPeople(){
 if(planeEvent&&planeEvent.age>=5.5&&planeEvent.age<13){ctx.save();ctx.font=`26px ${FONT}`;ctx.textAlign='center';ctx.lineJoin='round';ctx.lineWidth=6;ctx.strokeStyle=INK;ctx.fillStyle='#ff4d5e';for(let i=planeEvent.released;i<3;i++){const ay=Math.min(H*.3,215)+Math.abs(Math.sin(t*6+i))*8;ctx.strokeText('▼',planeEvent.lanes[i]*W,ay);ctx.fillText('▼',planeEvent.lanes[i]*W,ay)}ctx.restore()}
 for(const p of people){ctx.save();ctx.translate(p.x*W,p.y);ctx.rotate(Math.sin(t*2+p.phase)*.08);ctx.lineJoin='round';ctx.lineCap='round';
  ctx.strokeStyle=INK;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-21,-12);ctx.lineTo(-5,17);ctx.moveTo(21,-12);ctx.lineTo(5,17);ctx.moveTo(0,-12);ctx.lineTo(0,13);ctx.stroke();
  const canopy=new Path2D();canopy.arc(0,-12,22,Math.PI,0);canopy.quadraticCurveTo(11,-17,0,-12);canopy.quadraticCurveTo(-11,-17,-22,-12);canopy.closePath();
  ctx.fillStyle='#ff4d5e';ctx.fill(canopy);ctx.save();ctx.clip(canopy);ctx.fillStyle='#fff';for(const i of [-2,0,2]){ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(i*11-5.5,-40);ctx.lineTo(i*11+5.5,-40);ctx.closePath();ctx.fill()}ctx.restore();ctx.lineWidth=2.5;ctx.stroke(canopy);
  ctx.lineWidth=3.5;ctx.beginPath();ctx.moveTo(-3,27);ctx.lineTo(-6,36);ctx.moveTo(3,27);ctx.lineTo(6,36);ctx.moveTo(-4,18);ctx.lineTo(-10,12);ctx.moveTo(4,18);ctx.lineTo(10,12);ctx.stroke();
  ctx.fillStyle='#3d7bff';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-6,15,12,14,3);ctx.fill();ctx.stroke();ctx.fillStyle='#ffc9a0';ctx.beginPath();ctx.arc(0,10,5.5,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle=INK;ctx.fillRect(-4,8,8,2.5);ctx.restore()}
}
function hitsPerson(p){const dx=(x-p.x)*W,dy=balloonY()-p.y;return ((dx/48)**2+((dy+18)/48)**2<1)||((dx/36)**2+((dy-20)/49)**2<1)}
// Grassy launch field with a wooden pad, flowers and a waving flag.
function drawGround(){const g=H-50+alt*worldScale;if(g>H+160)return;ctx.lineJoin='round';ctx.strokeStyle=INK;ctx.lineWidth=4;
 ctx.fillStyle='#72d46a';ctx.beginPath();ctx.moveTo(-40,g-8);ctx.quadraticCurveTo(W*.2,g-50,W*.45,g-14);ctx.quadraticCurveTo(W*.75,g-46,W+40,g-12);ctx.lineTo(W+40,H+300);ctx.lineTo(-40,H+300);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#4cb84c';ctx.beginPath();ctx.moveTo(-40,g+14);ctx.quadraticCurveTo(W*.5,g-12,W+40,g+16);ctx.lineTo(W+40,H+300);ctx.lineTo(-40,H+300);ctx.closePath();ctx.fill();ctx.stroke();
 const count=Math.max(8,Math.round(W/50));for(let i=0;i<count;i++){const fx=W*(.04+i*.92/(count-1)),fy=g+16+Math.sin(i*2.7)*5;if(Math.abs(fx-W/2)<50)continue;ctx.fillStyle=INK;ctx.fillRect(fx-1,fy-10,2,10);ctx.fillStyle=PARTY[i%5];ctx.beginPath();for(let k=0;k<5;k++){const a=k/5*TAU+t*.5;ctx.moveTo(fx,fy-12);ctx.arc(fx+Math.cos(a)*4,fy-12+Math.sin(a)*4,3.2,0,TAU)}ctx.fill();ctx.fillStyle='#fff6b0';ctx.beginPath();ctx.arc(fx,fy-12,2.2,0,TAU);ctx.fill()}
 ctx.lineWidth=3.5;ctx.fillStyle='#c98345';ctx.beginPath();ctx.roundRect(W/2-42,g-1,84,13,5);ctx.fill();ctx.stroke();ctx.fillStyle='#8a5326';ctx.beginPath();ctx.roundRect(W/2-5,g-8,10,16,3);ctx.fill();ctx.stroke();
 const fx=W/2+Math.min(W*.32,170),fy=g-14;ctx.beginPath();ctx.moveTo(fx,fy);ctx.lineTo(fx,fy-52);ctx.lineWidth=4;ctx.stroke();ctx.fillStyle='#ff4d5e';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(fx,fy-52);ctx.quadraticCurveTo(fx+14,fy-56+Math.sin(t*6)*4,fx+28,fy-46+Math.sin(t*6+1)*3);ctx.lineTo(fx,fy-36);ctx.closePath();ctx.fill();ctx.stroke()}
function drawRope(){const tied=state==='ready'||state==='menu'||(state==='paused'&&previousState==='ready');ctx.lineCap='round';
 if(tied){const r=rope(),sway=Math.sin(t*2)*4,path=()=>{ctx.beginPath();ctx.moveTo(r.a.x,r.a.y);ctx.quadraticCurveTo(r.a.x+7+sway,r.a.y+35,r.b.x,r.b.y)};
  path();ctx.strokeStyle=INK;ctx.lineWidth=7;ctx.stroke();ctx.strokeStyle='#e0b37a';ctx.lineWidth=3.5;ctx.stroke();ctx.setLineDash([2,6]);ctx.strokeStyle='#8a5f33';ctx.stroke();ctx.setLineDash([]);
  if(state==='ready'){const my=(r.a.y+r.b.y)/2;ctx.setLineDash([7,8]);ctx.lineDashOffset=-t*40;ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(W*.28,my);ctx.lineTo(W*.72,my);ctx.stroke();ctx.setLineDash([]);ctx.lineDashOffset=0;
   const sx=W*(.5+Math.sin(t*2.6)*.2),pulse=(t*1.5)%1;ctx.strokeStyle=`rgba(255,255,255,${1-pulse})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(sx,my,10+pulse*18,0,TAU);ctx.stroke();ctx.fillStyle='#fff';ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.beginPath();ctx.arc(sx,my,9,0,TAU);ctx.fill();ctx.stroke()}}
 if(ropeCut&&ropeCut.age<.8){const bx=W/2,by=H-47+alt*worldScale,k=ropeCut.age/.8,len=ropeCut.length*(1-k*.85),swing=Math.sin(ropeCut.age*14)*(1-k)*26,path=()=>{ctx.beginPath();ctx.moveTo(bx,by);ctx.quadraticCurveTo(bx+swing,by-len*.6,bx+swing*1.6+k*20,by-len+k*len*.4)};
  ctx.globalAlpha=1-k*k;path();ctx.strokeStyle=INK;ctx.lineWidth=7;ctx.stroke();ctx.strokeStyle='#e0b37a';ctx.lineWidth=3.5;ctx.stroke();ctx.globalAlpha=1}}
function drawTicks(){ctx.strokeStyle='rgba(255,255,255,.4)';ctx.lineWidth=2;for(let m=Math.floor(alt/250)*250;m<alt+1200;m+=250){const yy=balloonY()+(alt-m)*worldScale;if(yy>30&&yy<H-35){ctx.beginPath();ctx.moveTo(W-16,yy);ctx.lineTo(W-6,yy);ctx.stroke()}}}
function drawStreaks(){ctx.lineCap='round';for(const s of streaks){const v=Math.hypot(s.vx,s.vy)||1;ctx.strokeStyle=s.color||`rgba(255,255,255,${s.alpha})`;ctx.globalAlpha=s.color?s.alpha:1;ctx.lineWidth=s.width;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.x-s.vx/v*s.len,s.y-s.vy/v*s.len);ctx.stroke()}ctx.globalAlpha=1}
function drawParticles(back){for(const p of particles){if(!!p.back!==back)continue;const k=p.life/p.max;ctx.save();ctx.translate(p.x,p.y);
 if(p.type==='puff'){ctx.globalAlpha=(1-k)*.6;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(0,0,p.size*(1+k*1.4),0,TAU);ctx.fill()}
 else if(p.type==='star'){ctx.globalAlpha=1-k;ctx.rotate(p.rot);ctx.fillStyle=p.color;star(0,0,p.size*(1-k*.5),p.size*.4*(1-k*.5),4);ctx.fill()}
 else if(p.type==='confetti'){ctx.rotate(p.rot);ctx.scale(Math.cos(p.rot*3),1);ctx.globalAlpha=k>.7?(1-k)/.3:1;ctx.fillStyle=p.color;ctx.fillRect(-p.size/2,-p.size/4,p.size,p.size/2)}
 else if(p.type==='shard'){ctx.rotate(p.rot);ctx.globalAlpha=k>.75?(1-k)/.25:1;ctx.fillStyle=p.color;ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(-p.size,-p.size*.4);ctx.lineTo(p.size*.8,-p.size*.6);ctx.lineTo(p.size*.3,p.size*.6);ctx.closePath();ctx.fill();ctx.stroke()}
 else{ctx.globalAlpha=1-k;ctx.strokeStyle=p.color;ctx.lineWidth=p.size;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-p.vx*.05,-p.vy*.05);ctx.stroke()}
 ctx.restore()}}
function drawRings(){for(const r of rings){const k=r.life/r.dur;ctx.globalAlpha=1-k;ctx.strokeStyle=r.color;ctx.lineWidth=r.width*(1-k)+.5;ctx.beginPath();ctx.arc(r.x,r.y,r.max*(1-(1-k)**3),0,TAU);ctx.stroke()}ctx.globalAlpha=1}
function drawPopups(){ctx.textAlign='center';ctx.lineJoin='round';for(const p of popups){const k=p.life/p.max,scale=k<.18?backOut(k/.18):1;ctx.save();ctx.globalAlpha=k>.7?1-(k-.7)/.3:1;ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.scale(scale,scale);ctx.font=`${p.size}px ${FONT}`;ctx.lineWidth=p.size*.3;ctx.strokeStyle=INK;ctx.strokeText(p.text,0,0);ctx.fillStyle=p.color;ctx.fillText(p.text,0,0);ctx.restore()}}
// Pickup celebration: the action freezes, rays spin and the balloon zooms in and dances.
function drawShowcase(){const s=showcase,P=POWERS[s.kind],k=s.age/s.dur,a=Math.min(1,s.age/.2)*(k>.82?(1-k)/.18:1),bx=x*W,by=balloonY();
 ctx.save();ctx.globalAlpha=.6*a;ctx.fillStyle='#120a30';ctx.fillRect(-OX-40,-40,SW+80,H+80);ctx.restore();
 ctx.save();ctx.translate(bx,by);ctx.rotate(s.age*1.6);ctx.globalAlpha=.4*a;ctx.fillStyle=P.color;const R=Math.max(SW,H);for(let i=0;i<16;i++){ctx.rotate(TAU/16);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(R,-R*.09);ctx.lineTo(R,R*.09);ctx.closePath();ctx.fill()}ctx.restore();
 const glow=ctx.createRadialGradient(bx,by,0,bx,by,140);glow.addColorStop(0,`rgba(255,255,255,${.55*a})`);glow.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=glow;ctx.fillRect(bx-140,by-140,280,280);
 const z=1+.75*a*(s.age<.35?backOut(s.age/.35):1);ctx.save();ctx.translate(bx,by);ctx.rotate(Math.sin(s.age*14)*.14*a);ctx.scale(z,z);ctx.translate(-bx,-by-Math.abs(Math.sin(s.age*9))*6*a);drawBalloon();ctx.restore();
 const pop=s.age<.4?backOut(s.age/.4):1;drawPickup(s.kind,bx+Math.sin(s.age*5)*8,by-100*z+Math.sin(s.age*7)*5,26*pop*a+.01)}
// Collected coins fly up into the HUD counter.
function drawFlyers(){if(!flyers.length)return;const c=canvas.getBoundingClientRect(),e=$('#coin-pill .coin-icon').getBoundingClientRect(),tx=e.left+e.width/2-c.left,ty=e.top+e.height/2-c.top;
 for(const f of flyers){const k=Math.min(1,f.age/.55),q=k*k*(3-2*k),sx=f.x+OX,cy=ty+60,px=(1-q)**2*sx+2*(1-q)*q*sx+q*q*tx,py=(1-q)**2*f.y+2*(1-q)*q*cy+q*q*ty;drawCoin(px,py,13*(1-.35*q),t*14,false)}}
function drawSides(){if(OX<4)return;const look=obstacleLook();ctx.fillStyle='rgba(12,6,40,.42)';ctx.fillRect(-40,-40,OX+40,H+80);ctx.fillRect(OX+W,-40,OX+40,H+80);
 for(const ex of [OX,OX+W]){ctx.fillStyle=look.body;ctx.fillRect(ex-7,-40,14,H+80);ctx.fillStyle=look.top;ctx.fillRect(ex-7,-40,5,H+80);ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(ex-7,-40);ctx.lineTo(ex-7,H+40);ctx.moveTo(ex+7,-40);ctx.lineTo(ex+7,H+40);ctx.stroke();ctx.fillStyle='rgba(255,255,255,.4)';const off=(alt*worldScale)%48;for(let y=off-48;y<H+48;y+=48){ctx.beginPath();ctx.arc(ex,y,2.5,0,TAU);ctx.fill()}}}
function drawVignette(){const g=ctx.createRadialGradient(SW/2,H/2,Math.min(SW,H)*.35,SW/2,H/2,Math.max(SW,H)*.75);g.addColorStop(0,'rgba(10,5,40,0)');g.addColorStop(1,'rgba(10,5,40,.28)');ctx.fillStyle=g;ctx.fillRect(0,0,SW,H);
 if(danger>.05){const r=ctx.createRadialGradient(SW/2,H/2,Math.min(SW,H)*.3,SW/2,H/2,Math.max(SW,H)*.7);r.addColorStop(0,'rgba(255,40,70,0)');r.addColorStop(1,`rgba(255,40,70,${danger*.4*(.75+.25*Math.sin(t*14))})`);ctx.fillStyle=r;ctx.fillRect(0,0,SW,H)}
 if(engineOn()){const r=ctx.createRadialGradient(SW/2,H/2,Math.min(SW,H)*.35,SW/2,H/2,Math.max(SW,H)*.75);r.addColorStop(0,'rgba(255,140,40,0)');r.addColorStop(1,'rgba(255,140,40,.3)');ctx.fillStyle=r;ctx.fillRect(0,0,SW,H)}}
function draw(){ctx.save();const amount=calm?shake*.3:shake;if(amount>.4)ctx.translate(rand(-amount,amount),rand(-amount,amount));
 const column=W;W=SW;drawCosmos();drawGround();W=column;drawStreaks();
 ctx.save();ctx.translate(OX,0);
 drawPlane();drawTicks();if(!planeEvent&&people.length===0)obstacles.forEach(drawObstacle);drawHazards();drawPickups();drawRope();drawPeople();drawParticles(true);drawBalloon();drawAuras();
 ctx.save();ctx.translate(-OX,0);drawLeaves();ctx.restore();drawChevrons();drawWarnings();drawParticles(false);drawRings();if(showcase)drawShowcase();drawPopups();
 ctx.restore();drawSides();ctx.restore();
 drawFlyers();drawVignette();if(flash>0){ctx.globalAlpha=Math.min(1,flash);ctx.fillStyle=flashColor;ctx.fillRect(0,0,SW,H);ctx.globalAlpha=1}}
function update(dt){t+=dt;spin+=dt*(.65+Math.abs(wind)*3+Math.abs(vx));if(state!=='flying')return;
 flightTime+=dt;generateCourse();updateWeather(dt);updateAirTraffic(dt);updateHazards(dt);
 const direction=(keys.has('arrowright')||keys.has('d')?1:0)-(keys.has('arrowleft')||keys.has('a')?1:0);let desired=direction*.65;if(target!==null)desired=clamp((target-x)*6,-.85,.85);vx+=(desired+wind-vx)*Math.min(1,dt*4);x+=vx*dt;x=clamp(x,(radius+5)/W,1-(radius+5)/W);
 alt+=dt*flightSpeed(alt)*speedMult;collectPickups(dt);
 const clear=!planeEvent&&people.length===0;
 if(clear)for(const o of obstacles){if(o.broken)continue;const z=spike(o);if(!hitsObstacle(z))continue;if(smashing()){breakLedge(o,z);continue}if(shield>0){breakShield();breakLedge(o,z);continue}finish();return}
 for(const h of hazards){if(h.dead||!hitsHazard(h))continue;if(smashing()){smashHazard(h);continue}if(shield>0){breakShield();smashHazard(h);continue}finish();return}
 for(const p of people){if(p.safe||!hitsPerson(p))continue;if(smashing()){p.safe=true;continue}if(shield>0){breakShield();p.safe=true;p.vx=(p.x<x?-1:1)*.4;continue}finish();return}
 checkNearMisses(clear);checkProgress()}
// Effects run once per frame; dt is slowed during slow motion and showcases, real is wall-clock time.
function updateEffects(dt,real){shake*=Math.exp(-8*real);flash=Math.max(0,flash-real*2.4);
 if(showcase&&(showcase.age+=real)>=showcase.dur){const kind=showcase.kind;showcase=null;applyPower(kind)}
 const pdt=showcase?real:dt;
 squashV+=(-squash*170-squashV*11)*pdt;squash+=squashV*pdt;
 if((nextBlink-=pdt)<=0){blink=.13;nextBlink=rand(2,5)}blink-=pdt;moodTimer-=pdt;
 if(boost&&(boost.time-=dt)<=0)boost=null;if(shield>0&&(shield-=dt)<=0&&state==='flying')popup(x*W,balloonY()-60,'SHIELD OFF','#bff4ff',20);magnet=Math.max(0,magnet-dt);invuln=Math.max(0,invuln-dt);
 speedMult+=((boost?boost.mult:1)-speedMult)*Math.min(1,dt*3);
 danger=state==='flying'&&!smashing()?danger+(measureDanger()-danger)*Math.min(1,dt*10):danger*Math.exp(-6*pdt);
 if(state!=='dead'&&moodTimer<=0)mood=smashing()||shield>0?'cool':danger>.45?'scared':'happy';
 if(ropeCut)ropeCut.age+=dt;if(comboTimer>0&&(comboTimer-=dt)<=0)combo=0;
 if(state==='dead'&&deathTimer>0&&(deathTimer-=real)<=0)showResult();
 const scroll=state==='flying'&&!showcase?flightSpeed(alt)*speedMult*worldScale:0;
 if(state==='flying'&&!showcase){const space=alt>=3000,tilt=vx*.16+wind*.12,fire=engineOn(),gas=boost&&boost.kind==='gas',every=fire?.018:.04;trailClock+=dt;
  while(trailClock>every){trailClock-=every;const bx=x*W-Math.sin(tilt)*(fire?56:36),by=balloonY()+(fire?56:36);
   if(fire)particles.push({type:'puff',back:true,world:true,x:bx+rand(-4,4),y:by,vx:rand(-20,20),vy:rand(60,140),life:0,max:rand(.35,.6),size:rand(5,9),color:pick(['#ffd23f','#ff8a2a','#ff4d5e','#fff6b0']),gravity:0,drag:1,rot:0,vr:0});
   else particles.push({type:space&&!gas?'star':'puff',back:true,world:true,x:bx+rand(-3,3),y:by,vx:rand(-10,10),vy:rand(10,30),life:0,max:space?.7:.9,size:space&&!gas?rand(3,5):rand(4,7),color:gas?pick(['#7ef08f','#4fd36b']):space?pick(['#9fe8ff','#c9a8ff','#fff']):'#fff',gravity:0,drag:1,rot:0,vr:rand(-3,3)})}
  const speed=flightSpeed(alt)*speedMult;streakClock+=dt*((calm?4:9)+Math.min(22,(speed-130)*.2))*speedMult;while(streakClock>1){streakClock--;streaks.push({x:rand(0,SW),y:-60,vx:0,vy:speed*worldScale*rand(2.2,3.4),len:rand(30,80)*speedMult,alpha:rand(.12,.3)*(fire?1.6:1),width:rand(1.5,3),color:fire&&Math.random()<.4?'#ffd23f':null})}
  if(weatherNow&&weatherNow.active&&Math.random()<dt*25)streaks.push({x:weatherNow.dir>0?-60:SW+60,y:rand(0,H),vx:weatherNow.dir*rand(500,800),vy:scroll*.5,len:rand(40,90),alpha:rand(.25,.45),width:rand(2,3.5)});
  if(fire)shake=Math.max(shake,1.5)}
 for(const s of streaks){s.x+=s.vx*dt;s.y+=s.vy*dt}streaks=streaks.filter(s=>s.y<H+100&&s.x>-120&&s.x<SW+120);
 for(const p of particles){p.life+=pdt;const d=Math.max(0,1-p.drag*pdt);p.vx*=d;p.vy*=d;p.vy+=p.gravity*pdt;p.x+=p.vx*pdt;p.y+=p.vy*pdt+(p.world?scroll*dt:0);p.rot+=p.vr*pdt}particles=particles.filter(p=>p.life<p.max);
 for(const r of rings)r.life+=pdt;rings=rings.filter(r=>r.life<r.dur);
 for(const p of popups){p.life+=pdt;p.y+=p.vy*pdt;p.vy*=Math.exp(-3*pdt)}popups=popups.filter(p=>p.life<p.max);
 for(const f of flyers){f.age+=real;if(f.age>=.55){f.done=true;shownCoins++;bump($('#coin-pill'))}}flyers=flyers.filter(f=>!f.done)}
function setText(id,value){if(hudCache[id]!==value){hudCache[id]=value;$(id).textContent=value}}
function setChip(id,frac){const chip=$(id),on=frac>0;if(chip.hidden===on)chip.hidden=!on;if(on)chip.querySelector('b').style.width=(frac*100).toFixed(1)+'%'}
function updateHud(){setText('#coin-count',String(shownCoins));setText('#altitude',Math.floor(alt).toLocaleString());setText('#speed',(state==='flying'||state==='paused'&&previousState==='flying'?Math.round(flightSpeed(alt)*speedMult):0)+' m/s');setText('#zone',region().name);
 shell.classList.toggle('space',alt>=3000);shell.classList.toggle('ready',state==='ready'||(state==='paused'&&previousState==='ready'));shell.classList.toggle('menu',state==='menu');
 setChip('#chip-boost',boost?boost.time/boost.dur:0);if(boost){setText('#chip-boost-icon',boost.kind==='nitro'?'🔥':boost.kind==='engine'?'⚡':'⛽');$('#chip-boost').style.setProperty('--c',POWERS[boost.kind==='engine'?'energy':boost.kind].color)}
 setChip('#chip-shield',shield/20);setChip('#chip-magnet',magnet/8);
 const btn=$('#boost'),visible=(state==='flying'||state==='paused'&&previousState==='flying')&&(alt>=POWERS.energy.unlock||energy>0),key=`${visible}|${energy}|${!!showcase}`;
 if(hudCache.boost!==key){hudCache.boost=key;btn.hidden=!visible;btn.disabled=energy<5||!!showcase;btn.classList.toggle('ready',energy>=5&&!showcase);btn.querySelectorAll('.pips i').forEach((pip,i)=>pip.classList.toggle('on',i<energy))}}
function frame(now){const real=Math.min((now-last)/1000||0,.035);last=now;
 if(state!=='paused'){if(showcase)timeScale=.04;else if(slowTimer>0){slowTimer-=real;timeScale=slowTimer>0?.25:1}else timeScale=1;
  const dt=real*timeScale;let remaining=dt;while(remaining>0){const step=Math.min(remaining,8/(flightSpeed(alt)*speedMult*worldScale));update(step);remaining-=step}updateEffects(dt,real)}
 gameSound.update(state==='menu'?'ready':state,wind,flightSpeed(alt),alt,document.hidden);draw();updateHud();requestAnimationFrame(frame)}
reset('menu');resize();requestAnimationFrame(frame);
