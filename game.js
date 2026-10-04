'use strict';
const canvas=document.querySelector('#game');let ctx=canvas.getContext('2d');
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s),shell=$('.game-shell');
const FONT="'Lilita One',Impact,'Arial Black',sans-serif",calm=matchMedia('(prefers-reduced-motion: reduce)').matches;
const rand=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)],clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const PARTY=['#ff4d5e','#ffd23f','#44d9ff','#4fd36b','#a273ff','#ffffff'];
// Power-ups are rare treats. Energy cells charge the boost engine, the only power with a cinematic intro.
const POWERS={
 energy:{name:'ENERGY CELL',icon:'⚡',color:'#ffd23f',desc:'Collect 5 to charge the BOOST engine. Tap ⚡ BOOST (or press B) for a cinematic rocket boost that smashes through everything.'},
 magnet:{name:'COIN MAGNET',icon:'🧲',color:'#ff4d5e',weight:2,desc:'Pulls nearby coins and energy cells to you for 8 seconds.'},
 shield:{name:'BUBBLE SHIELD',icon:'🛡️',color:'#44d9ff',weight:1.5,desc:'Absorbs one hit. Lasts up to 20 seconds.'},
 nitro:{name:'NITRO',icon:'🔥',color:'#ff8a2a',weight:1,desc:'A 4-second rocket burst that smashes through obstacles.'}};
const PICKUPS=['magnet','shield','nitro'];
const MEDALS=[{at:1000,icon:'🥉',name:'BRONZE'},{at:2500,icon:'🥈',name:'SILVER'},{at:5000,icon:'🥇',name:'GOLD'}];
const LIFE_PRICE=80,MAX_LIVES=9;
// Wallet, owned skins, lives and per-stage bests live in the browser's localStorage.
function loadSave(){const fresh={coins:0,lives:1,skins:['classic'],skin:'classic',best:{},lastStage:'sky'};try{const s=JSON.parse(localStorage.getItem('skybound-save'));if(s)return {...fresh,...s,best:{...(s.best||{})}};const old=Number(localStorage.getItem('skybound-best'))||0;if(old)fresh.best.sky=old}catch{}return fresh}
const save=loadSave();
function persist(){try{localStorage.setItem('skybound-save',JSON.stringify(save))}catch{}}
let stage=STAGES.find(s=>s.id===save.lastStage)||STAGES[0];
let SW=420,W=420,OX=0,H=700,dpr=1,state='menu',previousState='ready',alt=0,x=.5,vx=0,t=0,last=0,obstacles=[],coins=[],critters=[],particles=[],pointer=null,target=null,sound=false,soundTouched=false,flightTime=0,spin=0,wind=0,weatherNow=null,leaves=[],leafClock=0,coinCount=0,shownCoins=0,banked=0,nextObstacle=450,spawnIndex=0;
// Game feel: camera shake, flashes, slow motion, popups, combos and a springy balloon with a face.
let shake=0,flash=0,flashColor='#fff',timeScale=1,slowTimer=0,deathTimer=0,popups=[],rings=[],flyers=[],streaks=[],trailClock=0,streakClock=0,combo=0,comboTimer=0,bestCombo=0,nearMisses=0,smashes=0,squash=0,squashV=0,blink=0,nextBlink=2,mood='happy',moodTimer=0,danger=0,ropeCut=null,nextMilestone=1000,passedBest=false,medalsHit=0,eventsSeen=new Set(),grow=1,revives=0;
// Power state. The showcase is the freeze-frame celebration when the boost engine fires.
let energy=0,boost=null,speedMult=1,shield=0,magnet=0,invuln=0,showcase=null,powerCount=0;
let panelKind=null,storeTab='skins',previews=[];
const keys=new Set(),radius=29,worldScale=.65,hudCache={};
// The canvas fills the screen; gameplay happens in a centred column at most 0.6× the screen height wide.
function resize(){const r=canvas.getBoundingClientRect();SW=r.width;H=r.height;W=Math.round(Math.min(SW,Math.max(360,H*.6)));OX=(SW-W)/2;dpr=Math.min(devicePixelRatio||1,2);canvas.width=SW*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);shell.style.setProperty('--pw',W+'px')}
new ResizeObserver(resize).observe(canvas);
const stageBest=()=>save.best[stage.id]||0;
function reset(mode='ready'){state=mode;alt=0;x=.5;vx=0;target=null;pointer=null;obstacles=[];coins=[];critters=[];particles=[];leaves=[];flightTime=0;spin=0;wind=0;weatherNow=null;leafClock=0;coinCount=0;shownCoins=0;banked=0;nextObstacle=450;spawnIndex=0;keys.clear();
 shake=0;flash=0;timeScale=1;slowTimer=0;deathTimer=0;popups=[];rings=[];flyers=[];streaks=[];combo=0;comboTimer=0;bestCombo=0;nearMisses=0;smashes=0;squash=0;squashV=0;mood='happy';moodTimer=0;danger=0;ropeCut=null;nextMilestone=1000;passedBest=false;medalsHit=0;eventsSeen=new Set();grow=1;revives=0;
 energy=0;boost=null;speedMult=1;shield=0;magnet=0;invuln=0;showcase=null;powerCount=0;
 generateCourse();$('#weather').textContent=stage.wind?'CALM AIR':stage.calm;$('#weather').classList.remove('gust');$('#hint').hidden=mode!=='ready';$('#menu').hidden=mode!=='menu';$('#overlay').hidden=true;$('#panel').hidden=true;panelKind=null;$('#pause').textContent='Ⅱ';$('#pause').setAttribute('aria-label','Pause game');$('#announce').replaceChildren();refreshMeta()}
function refreshMeta(){const b=stageBest();$('#best').textContent=b?`🏆 BEST ${b.toLocaleString()} m`:'NO RECORD YET';$('#hint-stage').textContent=`${stage.emoji} ${stage.name}`;$('#zone').textContent=`${stage.emoji} ${stage.name}`;$('#menu-coins').textContent=save.coins.toLocaleString();$('#menu-lives').textContent=save.lives}
function bank(){const gain=coinCount-banked;if(gain>0){save.coins+=gain;banked=coinCount;persist()}}

// ---- Menu, panels, full screen and sound ----
const fsElement=()=>document.fullscreenElement||document.webkitFullscreenElement;
function enterFullscreen(){const el=document.documentElement,request=el.requestFullscreen||el.webkitRequestFullscreen;if(fsElement()||!request)return;try{const p=request.call(el,{navigationUI:'hide'});if(p&&p.then)p.then(()=>{if(screen.orientation&&screen.orientation.lock)screen.orientation.lock('portrait').catch(()=>{})}).catch(()=>{})}catch{}}
function toggleFullscreen(){if(fsElement()){const p=(document.exitFullscreen||document.webkitExitFullscreen).call(document);if(p&&p.catch)p.catch(()=>{})}else enterFullscreen()}
if(!document.documentElement.requestFullscreen&&!document.documentElement.webkitRequestFullscreen)$$('.fs-toggle').forEach(b=>b.hidden=true);
function syncSound(){for(const b of $$('.sound-toggle')){b.textContent=sound?'🔊':'🔇';b.classList.toggle('on',sound);b.setAttribute('aria-pressed',String(sound));b.setAttribute('aria-label',sound?'Disable sound':'Enable sound')}}
async function toggleSound(){soundTouched=true;sound=await gameSound.enable(!sound);syncSound();if(sound)gameSound.effect('on')}
function startStage(id){stage=STAGES.find(s=>s.id===id)||STAGES[0];save.lastStage=stage.id;persist();enterFullscreen();if(!soundTouched){soundTouched=true;gameSound.enable(true).then(on=>{sound=on;syncSound();if(on)gameSound.effect('on')})}reset('ready');canvas.focus()}
function openMenu(){bank();reset('menu')}
function el(tag,cls='',text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e}
function openPanel(kind){panelKind=kind;previews=[];const list=$('#panel-list');list.replaceChildren();
 if(kind==='stages'){$('#panel-title').textContent='CHOOSE A STAGE';const grid=el('div','stage-grid');for(const s of STAGES){const b=save.best[s.id]||0,card=el('button','stage-card');card.style.setProperty('--a',s.top);card.style.setProperty('--b',s.bottom);card.append(el('span','emoji',s.emoji),el('h3','',s.name),el('p','',s.blurb),el('span','stage-best',b?`BEST ${b.toLocaleString()} m`:'NOT PLAYED YET'),el('span','medals',MEDALS.map(m=>b>=m.at?m.icon:'').join('')));card.onclick=()=>startStage(s.id);grid.append(card)}list.append(grid)}
 else if(kind==='store')renderStore();
 else{$('#panel-title').textContent='POWER-UPS';for(const p of Object.values(POWERS)){const row=el('div','boost-item'),ico=el('span','ico',p.icon),text=el('div');ico.style.setProperty('--c',p.color);text.append(el('h3','',p.name),el('p','',p.desc));row.append(ico,text);list.append(row)}}
 $('#panel').hidden=false;list.scrollTop=0}
function renderStore(){$('#panel-title').textContent='STORE';const list=$('#panel-list'),scroll=list.scrollTop;list.replaceChildren();const top=el('div','store-top'),tabs=el('div','tabs');
 for(const [id,label] of [['skins','🎈 SKINS'],['lives','❤️ LIVES']]){const b=el('button','tab'+(storeTab===id?' on':''),label);b.onclick=()=>{storeTab=id;renderStore()};tabs.append(b)}
 const wallet=el('div','pill');wallet.append(el('i','coin-icon'),el('b','',save.coins.toLocaleString()));top.append(tabs,wallet);list.append(top);
 if(storeTab==='skins'){const grid=el('div','skin-grid');for(const id of SKIN_ORDER){const s=SKINS[id],owned=save.skins.includes(id),on=save.skin===id,card=el('div','skin-card'+(on?' equipped':'')),cv=document.createElement('canvas');cv.width=160;cv.height=180;cv.dataset.skin=id;const b=el('button','buy'+(on?' on':owned?' own':''),on?'EQUIPPED':owned?'EQUIP':`🪙 ${s.price}`);b.onclick=()=>buySkin(id,b);card.append(cv,el('b','',s.name),b);grid.append(card)}list.append(grid);previews=[...grid.querySelectorAll('canvas')]}
 else{const box=el('div','lives-box');box.append(el('div','hearts','❤️'.repeat(save.lives)+'🤍'.repeat(MAX_LIVES-save.lives)),el('p','',`You have ${save.lives} extra ${save.lives===1?'life':'lives'}. After a pop, tap REVIVE to keep climbing from the same spot.`));
  for(const n of [1,3]){const price=n===1?LIFE_PRICE:LIFE_PRICE*3-40,b=el('button','buy',`BUY ${n} ❤️ · 🪙 ${price}`);b.disabled=save.lives+n>MAX_LIVES;b.onclick=()=>buyLives(n,price,b);box.append(b)}list.append(box);previews=[]}
 list.scrollTop=scroll;refreshMeta()}
function notEnough(b,need){b.classList.remove('nope');void b.offsetWidth;b.classList.add('nope');gameSound.effect('warn');const old=b.textContent;b.textContent=`NEED 🪙 ${need-save.coins}`;setTimeout(()=>{if(b.isConnected)b.textContent=old},1100)}
function buySkin(id,b){const s=SKINS[id];if(!save.skins.includes(id)){if(save.coins<s.price)return notEnough(b,s.price);save.coins-=s.price;save.skins.push(id);gameSound.effect('buy')}else gameSound.effect('on');save.skin=id;persist();renderStore()}
function buyLives(n,price,b){if(save.coins<price)return notEnough(b,price);save.coins-=price;save.lives=Math.min(MAX_LIVES,save.lives+n);persist();gameSound.effect('buy');renderStore()}
function renderPreviews(){const main=ctx,now=performance.now()/1000;for(const cv of previews){const c=cv.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,cv.width,cv.height);c.setTransform(2.1,0,0,2.1,80,102);ctx=c;drawBalloonBody(SKINS[cv.dataset.skin],now*.9,'happy',0)}ctx=main}
$('#play').onclick=()=>openPanel('stages');$('#open-store').onclick=()=>openPanel('store');$('#open-boosts').onclick=()=>openPanel('boosts');$('#panel-close').onclick=()=>{$('#panel').hidden=true;panelKind=null;previews=[];refreshMeta()};
$$('.sound-toggle').forEach(b=>b.onclick=toggleSound);$$('.fs-toggle').forEach(b=>b.onclick=toggleFullscreen);$('#boost').onclick=activateEngine;$('#revive').onclick=revive;

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
window.addEventListener('keydown',e=>{if(!GAME_KEYS.includes(e.key))return;if(!$('#panel').hidden){if(e.key==='Escape')$('#panel-close').click();return}e.preventDefault();const k=e.key.toLowerCase();keys.add(k);
 if(e.key===' '){if(state==='menu')startStage(stage.id);else if(state==='ready')launch();else if(state==='dead'&&!$('#overlay').hidden)reset('ready')}
 if(['arrowup','w','b','shift'].includes(k))activateEngine();
 if(k==='p'||k==='escape')pause()});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
function show(label,title,text,primary,secondary,results=false){$('#result-label').textContent=label;$('#result-title').textContent=title;$('#result-text').textContent=text;$('#primary').textContent=primary;$('#secondary').textContent=secondary;$('#stats').hidden=!results;$('#record').hidden=true;$('#revive').hidden=true;$('#overlay').hidden=false}
function pause(){if(state==='paused'){state=previousState;$('#overlay').hidden=true;$('#pause').textContent='Ⅱ';$('#pause').setAttribute('aria-label','Pause game')}else if(state==='ready'||state==='flying'){previousState=state;state='paused';release();keys.clear();$('#pause').textContent='▶';$('#pause').setAttribute('aria-label','Resume game');show('PAUSED','Breather','The sky can wait a moment.','RESUME ▶','MENU')}gameSound.update(state,wind,flightSpeed(alt),alt,document.hidden)}
$('#pause').onclick=pause;$('#primary').onclick=()=>state==='paused'?pause():reset('ready');$('#secondary').onclick=openMenu;
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(state==='flying'||state==='ready'))pause()});

// ---- Effects helpers ----
function burst(px,py,n,{type='spark',colors=['#fff'],speed=[60,200],size=[2,5],life=[.4,.8],gravity=0,drag=2,world=false}={}){for(let i=0;i<n;i++){const a=Math.random()*TAU,s=rand(...speed);particles.push({type,x:px,y:py,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:0,max:rand(...life),size:rand(...size),color:pick(colors),gravity,drag,world,rot:rand(0,TAU),vr:rand(-8,8)})}}
function confetti(n){for(let i=0;i<n;i++)particles.push({type:'confetti',x:rand(0,W),y:rand(-90,-10),vx:rand(-40,40),vy:rand(60,170),gravity:80,drag:.4,life:0,max:rand(2,3),size:rand(7,11),color:pick(PARTY),rot:rand(0,TAU),vr:rand(-7,7)})}
function popup(px,py,text,color,size=24){popups.push({x:clamp(px,80,W-80),y:py,text,color,size,life:0,max:1,vy:-80,rot:rand(-.12,.12)})}
function bump(node){node.classList.remove('bump');void node.offsetWidth;node.classList.add('bump')}
function announce(text,sub,kind){const layer=$('#announce');layer.replaceChildren();const node=el('div',`announce ${kind}`);if(sub)node.append(el('small','',sub));node.append(el('strong','',text));node.addEventListener('animationend',e=>{if(e.target===node)node.remove()});layer.append(node)}
function countUp(node,value,suffix){const start=performance.now();const tick=now=>{const k=Math.min(1,(now-start)/900);node.textContent=Math.round(value*(1-(1-k)**3)).toLocaleString()+suffix;if(k<1)requestAnimationFrame(tick)};requestAnimationFrame(tick)}
const backOut=k=>1+3.2*(k-1)**3+2.2*(k-1)**2;

function finish(){state='dead';release();mood='dead';boost=null;shield=0;magnet=0;showcase=null;gameSound.effect('pop');const bx=x*W,by=balloonY(),gores=(SKINS[save.skin]||SKINS.classic).gores;
 for(let i=0;i<16;i++){const a=Math.random()*TAU,s=rand(160,380);particles.push({type:'shard',x:bx+Math.cos(a)*15,y:by-5+Math.sin(a)*15,vx:Math.cos(a)*s,vy:Math.sin(a)*s-80,life:0,max:rand(.9,1.5),size:rand(6,12),color:gores[i%gores.length][1],gravity:600,drag:1.2,rot:rand(0,TAU),vr:rand(-14,14)})}
 burst(bx,by,26,{type:'confetti',colors:PARTY,speed:[120,420],size:[6,10],life:[.7,1.2],gravity:300,drag:1.5});
 burst(bx,by,18,{colors:['#fff','#ffd23f'],speed:[200,500],size:[2,4],life:[.25,.5]});
 burst(bx,by,8,{type:'puff',colors:['#ffffff','#e9e4ff'],speed:[30,110],size:[10,18],life:[.6,1],drag:3});
 rings.push({x:bx,y:by,max:100,life:0,dur:.5,color:'#fff',width:8},{x:bx,y:by,max:160,life:0,dur:.75,color:'#ffd23f',width:5});
 popup(bx,by-40,'POP!','#ff4d5e',54);shake=22;flash=.9;flashColor='#fff';slowTimer=.45;deathTimer=1.1}
function showResult(){bank();const a=Math.floor(alt),record=a>stageBest();if(record){save.best[stage.id]=a;persist()}const medals=MEDALS.filter(m=>a>=m.at).map(m=>m.icon).join('');
 show(record?'NEW RECORD!':pick(['SO CLOSE!','NICE FLIGHT!','GREAT RUN!']),'POP!',`${stage.emoji} ${stage.name}${medals?' · '+medals:''} · ${smashes} smash${smashes===1?'':'es'} · ${nearMisses} close call${nearMisses===1?'':'s'} · best combo x${bestCombo} · wallet 🪙 ${save.coins.toLocaleString()}`,'PLAY AGAIN ↻','MENU',true);
 $('#record').hidden=!record;$('#stat-coins').textContent=coinCount;$('#stat-best').textContent=stageBest().toLocaleString()+' m';countUp($('#stat-alt'),a,' m');
 if(save.lives>0){$('#revive').hidden=false;$("#revive").textContent=`❤️ REVIVE (${save.lives})`}refreshMeta();if(record)gameSound.effect('record')}
// Spend a life: clear the danger nearby, re-inflate the balloon and carry on from the same altitude.
function revive(){if(state!=='dead'||save.lives<=0)return;save.lives--;persist();revives++;state='flying';$('#overlay').hidden=true;deathTimer=0;slowTimer=0;timeScale=1;
 const by=balloonY();for(const o of obstacles)if(Math.abs(spike(o).y-by)<280)o.broken=true;for(const h of critters){const p=critterPos(h);if(Math.abs(p.y-by)<320)knock(h,p)}
 if(stage.walls)x=.5;vx=0;grow=0;invuln=3;mood='star';moodTimer=1.8;
 announce('REVIVED!',`❤️ ${save.lives} ${save.lives===1?'LIFE':'LIVES'} LEFT`,'record');gameSound.effect('power');burst(x*W,by,18,{type:'heart',colors:['#ff4d5e','#ff7a9a','#ffffff'],speed:[90,260],size:[6,10],life:[.6,1.1],drag:1.5});rings.push({x:x*W,y:by,max:120,life:0,dur:.6,color:'#ff7a9a',width:7});refreshMeta()}

// ---- Course ----
function spike(o){const yy=balloonY()+(alt-o.a)*worldScale;const len=W*(o.length*(stage.reach||1)+(o.moving?Math.sin(t*.8+o.phase)*.065:0));return {y:yy,len,side:o.side}}
function drawObstacle(o){if(o.broken)return;const z=spike(o);if(z.y<-80||z.y>H+80)return;ctx.save();ctx.translate(o.side?W:0,z.y);ctx.scale(o.side?-1:1,1);ctx.lineJoin='round';ctx.lineCap='round';stage.ledge(o,z.len,stage.look);ctx.restore()}
// Project a rotating 3D surface onto the 2D canvas, cel-shaded into three tones.
const shape=lat=>({r:29*Math.cos(lat)*(1-.16*Math.sin(lat)),y:33*Math.sin(lat)-5});
const BALLOON=(()=>{const p=new Path2D(),n=40;for(let i=0;i<=n;i++){const v=shape(-Math.PI/2+i/n*Math.PI);i?p.lineTo(v.r,v.y):p.moveTo(v.r,v.y)}for(let i=n;i>=0;i--){const v=shape(-Math.PI/2+i/n*Math.PI);p.lineTo(-v.r,v.y)}p.closePath();return p})();
const engineOn=()=>!!boost;
function drawBalloon(){
 if(state==='dead')return;
 const flying=state==='flying'||(state==='paused'&&previousState==='flying'),waiting=state==='ready'||state==='menu';
 ctx.save();ctx.translate(x*W,balloonY()+Math.sin(t*2)*(waiting?3:1));ctx.rotate(vx*.16+wind*.12);if(grow<1){const g=Math.max(.01,backOut(grow));ctx.scale(g,g)}
 if(invuln>0&&Math.sin(t*40)>0)ctx.globalAlpha=.45;
 if(engineOn()){const len=(boost.kind==='nitro'?44:52)*(1+Math.random()*.35),g=ctx.createLinearGradient(0,50,0,50+len);g.addColorStop(0,'#fff6b0');g.addColorStop(.35,'#ffb020');g.addColorStop(1,'rgba(255,60,40,0)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-9,50);ctx.quadraticCurveTo(0,50+len*1.25,9,50);ctx.closePath();ctx.fill();
  ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.lineJoin='round';ctx.fillStyle='#c4cee0';rr(-10,33,20,15,4);ctx.fillStyle='#ff4d5e';ctx.fillRect(-8.5,38,17,4);ctx.fillStyle='#5f6b85';ctx.beginPath();ctx.moveTo(-7,48);ctx.lineTo(7,48);ctx.lineTo(10,54);ctx.lineTo(-10,54);ctx.closePath();ctx.fill();ctx.stroke()}
 else if(flying){ctx.strokeStyle=INK;ctx.lineWidth=2.2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,35);ctx.bezierCurveTo(-wind*20-vx*14,46,8,52,Math.sin(t*5)*7-wind*30-vx*24,66);ctx.stroke()}
 const stretch=flying?Math.min(.08,(flightSpeed(alt)*speedMult-130)/2000):0;
 ctx.save();ctx.scale(1-squash*.6-stretch*.5,1+squash+stretch);drawBalloonBody(SKINS[save.skin]||SKINS.classic,spin,mood,blink);ctx.restore();ctx.restore()}
// The balloon itself at the origin: shaded gores, skin decorations, face, outline and accessories.
function drawBalloonBody(skin,turn,face,blinking){const gores=skin.gores;
 ctx.save();ctx.clip(BALLOON);
 const rows=14,cols=24,vertex=(lat,lon)=>{const s=shape(lat);return {x:s.r*Math.sin(lon),y:s.y}};
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
  const lat=-Math.PI/2+row/rows*Math.PI,lon=-Math.PI/2+col/cols*Math.PI,ml=lat+Math.PI/rows/2,mo=lon+Math.PI/cols/2;
  const nx=Math.cos(ml)*Math.sin(mo),ny=Math.sin(ml),nz=Math.cos(ml)*Math.cos(mo),light=-nx*.4-ny*.45+nz*.72;
  const gore=Math.floor((((mo+turn)%TAU+TAU)%TAU)/(TAU/(gores.length>2?gores.length*2:10)));
  ctx.fillStyle=gores[gore%gores.length][light>.62?0:light>.28?1:2];
  ctx.beginPath();[vertex(lat,lon),vertex(lat+Math.PI/rows,lon),vertex(lat+Math.PI/rows,lon+Math.PI/cols),vertex(lat,lon+Math.PI/cols)].forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();ctx.fill();ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=1;ctx.stroke()}
 skinDots(skin,turn);ctx.restore();
 ctx.fillStyle='rgba(255,255,255,.9)';ctx.beginPath();ctx.ellipse(-14,-21,skin.gloss?6:4.5,skin.gloss?11:8.5,.5,0,TAU);ctx.fill();ctx.beginPath();ctx.arc(-7,-31,2.3,0,TAU);ctx.fill();
 drawFace(face,skin,blinking);
 ctx.strokeStyle=INK;ctx.lineWidth=3.5;ctx.lineJoin='round';ctx.stroke(BALLOON);
 ctx.fillStyle=gores[0][2];ctx.beginPath();ctx.moveTo(0,26);ctx.lineTo(-6,35);ctx.lineTo(6,35);ctx.closePath();ctx.fill();ctx.lineWidth=2.5;ctx.stroke();
 skinExtras(skin)}
// Eyes follow the steering and react: joy after coins, fright near danger, sunglasses when powered up.
function drawFace(m,skin,blinking){const lx=clamp(vx*2.2+(state==='ready'||state==='menu'?Math.sin(t*.8)*.7:0),-1,1)*3;
 if(skin.face!=='robot'){ctx.fillStyle='rgba(255,110,150,.5)';for(const s of [-1,1]){ctx.beginPath();ctx.ellipse(s*16,1,4,2.4,0,0,TAU);ctx.fill()}}
 ctx.strokeStyle=INK;ctx.lineCap='round';ctx.lineJoin='round';
 if(m==='cool'){ctx.fillStyle=INK;ctx.beginPath();ctx.moveTo(-18,-14);ctx.lineTo(18,-14);ctx.lineTo(16,-6);ctx.quadraticCurveTo(10,1,3,-5);ctx.lineTo(-3,-5);ctx.quadraticCurveTo(-10,1,-16,-6);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-14,-11);ctx.lineTo(-9,-11);ctx.moveTo(5,-11);ctx.lineTo(10,-11);ctx.stroke();ctx.strokeStyle=INK;ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(-5,3);ctx.quadraticCurveTo(1,9,8,1);ctx.stroke();return}
 if(m==='star'){for(const s of [-1,1]){ctx.fillStyle='#ffd23f';star(s*9,-8,8.5,3.8,5);ctx.fill();ctx.lineWidth=2;ctx.stroke()}ctx.fillStyle='#7a1030';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(-8,2);ctx.quadraticCurveTo(0,17,8,2);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#ff7a9a';ctx.beginPath();ctx.ellipse(0,8.5,3.5,2,0,0,TAU);ctx.fill();return}
 const scared=m==='scared'||m==='wow',open=blinking>0?.15:1,ly=scared?-1:0;
 if(skin.face==='robot'){ctx.fillStyle=INK;ctx.beginPath();ctx.roundRect(-17,-16,34,15,5);ctx.fill();ctx.fillStyle=scared?'#ff5a6a':'#5ff0ff';for(const s of [-1,1]){ctx.beginPath();ctx.roundRect(s*8-4+lx*.5,-12+(1-open)*4,8,Math.max(1.5,8*open),2);ctx.fill()}ctx.lineWidth=2.4;ctx.beginPath();if(m==='joy')ctx.arc(0,1,6,.15*Math.PI,.85*Math.PI);else if(scared){ctx.moveTo(-6,6);ctx.lineTo(-3,4);ctx.lineTo(0,6);ctx.lineTo(3,4);ctx.lineTo(6,6)}else{ctx.moveTo(-5,5);ctx.lineTo(5,5)}ctx.stroke();return}
 if(skin.face==='ninja'){ctx.fillStyle=INK;ctx.beginPath();ctx.roundRect(-25,-17,50,16,7);ctx.fill()}
 if(skin.face==='monster'){ctx.fillStyle='#fff';ctx.lineWidth=2.2;ctx.beginPath();ctx.ellipse(lx*.4,-9,10,(scared?12:10)*open,0,0,TAU);ctx.fill();ctx.stroke();if(open>.5){ctx.fillStyle='#7a1030';ctx.beginPath();ctx.arc(lx,-8+ly,4.5,0,TAU);ctx.fill();ctx.fillStyle=INK;ctx.beginPath();ctx.arc(lx,-8+ly,2.4,0,TAU);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(lx+1.5,-10+ly,1.3,0,TAU);ctx.fill()}}
 else for(const s of [-1,1]){const big=skin.face==='goofy'&&s<0?1.3:1,ew=(skin.face==='ninja'?6.5:scared?7:6)*big,eh=(skin.face==='ninja'?4.5:scared?9:7.5)*open*big;ctx.fillStyle='#fff';ctx.lineWidth=2.2;ctx.beginPath();ctx.ellipse(s*9+lx*.4,-8,ew,eh,0,0,TAU);ctx.fill();ctx.stroke();
  if(open>.5){ctx.fillStyle=INK;ctx.beginPath();ctx.ellipse(s*9+lx,-7+ly,(scared?2.6:3.2)*big,Math.min(eh*.6,(scared?3.4:4.2)*big),0,0,TAU);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(s*9+lx+1.2,-9+ly,1.2,0,TAU);ctx.fill()}
  if(m==='scared'){ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(s*4,-19);ctx.lineTo(s*13,-21);ctx.stroke()}}
 ctx.lineWidth=2.3;ctx.fillStyle='#7a1030';
 if(scared){ctx.beginPath();ctx.ellipse(lx*.3,6,3.4,m==='wow'?5:3.8,0,0,TAU);ctx.fill();ctx.stroke()}
 else if(m==='joy'){ctx.beginPath();ctx.moveTo(-6,2);ctx.quadraticCurveTo(lx*.3,14,6,2);ctx.closePath();ctx.fill();ctx.stroke()}
 else{ctx.beginPath();ctx.arc(lx*.3,1,5,.18*Math.PI,.82*Math.PI);ctx.stroke()}
 if(skin.face==='goofy'&&!scared){ctx.fillStyle='#ff7a9a';ctx.beginPath();ctx.ellipse(2+lx*.3,7.5,3.2,4,.2,0,TAU);ctx.fill();ctx.stroke()}
 if(skin.face==='monster'&&!scared){ctx.fillStyle='#fff';ctx.lineWidth=1.5;for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(s*4+lx*.3,3.5);ctx.lineTo(s*2.5+lx*.3,8);ctx.lineTo(s*1+lx*.3,3.8);ctx.closePath();ctx.fill();ctx.stroke()}}}
// Shield bubble and magnet ring around the balloon.
function drawAuras(){const bx=x*W,by=balloonY()-4;
 if(magnet>0){ctx.save();ctx.translate(bx,by);ctx.rotate(t*2);ctx.setLineDash([8,10]);ctx.strokeStyle=`rgba(255,77,94,${magnet<2?.3+.3*Math.sin(t*20):.7})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,66,0,TAU);ctx.stroke();ctx.restore()}
 if(shield>0&&!(shield<3&&Math.sin(t*18)<0)){const r=50+Math.sin(t*4)*2,g=ctx.createRadialGradient(bx,by,r*.55,bx,by,r);g.addColorStop(0,'rgba(68,217,255,0)');g.addColorStop(.85,'rgba(68,217,255,.35)');g.addColorStop(1,'rgba(190,245,255,.85)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(bx,by,r,0,TAU);ctx.fill();ctx.strokeStyle='#bff4ff';ctx.lineWidth=3;ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.arc(bx,by,r-9,-2.6,-1.8);ctx.stroke()}}
function weatherAt(seconds){if(!stage.wind)return {warning:false,active:false,dir:1,force:0};const cycle=Math.floor(seconds/18),phase=seconds%18,dir=cycle%2===0?1:-1;return {warning:phase>=8&&phase<10,active:phase>=10&&phase<16,dir,force:phase>=10&&phase<16?dir*Math.sin((phase-10)/6*Math.PI)*(.17+.1*Math.min(alt/8000,1))*(1+.2*Math.sin(seconds*5)):0}}
// No speed cap or finish line: speed starts brisk and keeps increasing with height.
function flightSpeed(height){return (130+1.4*Math.sqrt(Math.max(0,height)))*stage.speed}
function weightedPick(kinds){let total=0;for(const k of kinds)total+=POWERS[k].weight;let r=Math.random()*total;for(const k of kinds){r-=POWERS[k].weight;if(r<=0)return k}return kinds[0]}
// Generate just ahead of the player; discard objects below the screen.
function generateCourse(){const horizon=alt+H/worldScale+flightSpeed(alt)*2.5;
 while(nextObstacle<horizon){const i=spawnIndex++,a=nextObstacle,slot=a-140,cx=.5+Math.sin(i*2.3)*.16,dir=i%2?1:-1;
  obstacles.push({a,side:i%2,length:.25+(Math.sin(i*4.7)+1)*.105,moving:i>5&&i%4===0,phase:i*1.8,root:i%3===0});
  let middle='coin';if(i>=6&&i%11===6)middle=weightedPick(PICKUPS);else if(i%3===1)middle='energy';
  coins.push({a:slot-55,x:cx-.045*dir,kind:'coin'},{a:slot,x:cx,kind:middle},{a:slot+55,x:cx+.045*dir,kind:'coin'});
  if(i>=3)spawnCritters(i,slot,cx);
  nextObstacle+=Math.max(300,flightSpeed(a)*1.65)}
 const floor=alt-H/worldScale-100;obstacles=obstacles.filter(o=>o.a>floor);coins=coins.filter(c=>!c.collected&&c.a>floor)}
// Creatures: bird flocks (sky), swinging monkeys (jungle, cave), bats (cave) and patrol drones (factory).
function spawnCritters(i,slot,cx){const opp=cx>.5?cx-.3:cx+.3,r=Math.random(),add=o=>critters.push({kx:0,ky:0,kvx:0,kvy:0,spin:0,knocked:false,dormant:false,phase:rand(0,TAU),vx:0,...o});
 const flock=(kind,count,spacing,speed,size)=>{const side=Math.random()<.5?0:1;for(let j=0;j<count;j++){const row=Math.ceil(j/2),sgn=j%2?1:-1;add({kind,a:slot+(j?sgn*row*spacing:0),ox:row*.075,side,vx:(side?-1:1)*speed,r:size,dormant:true,lead:j===0})}};
 if(stage.critters==='birds'&&i%6===4)flock('bird',5,36,.24,13);
 else if(stage.critters==='monkeys'&&r<.3)add({kind:'monkey',a:slot,x:opp,r:15});
 else if(stage.critters==='cave'){if(r<.15)add({kind:'monkey',a:slot,x:opp,r:15});else if(r<.32)flock('bat',3,42,.2,12)}
 else if(stage.critters==='drones'&&r<.28)add({kind:'drone',a:slot,x:opp,vx:(Math.random()<.5?-1:1)*.1,r:16})}
function critterPos(h){const base=balloonY()+(alt-h.a)*worldScale;
 if(h.kind==='monkey'){const ang=Math.sin(t*2.2+h.phase)*.55,len=150,pivotX=h.x*W,pivotY=base-len,hx=pivotX+Math.sin(ang)*len+h.kx,hy=pivotY+Math.cos(ang)*len+h.ky;return {x:hx+Math.sin(ang)*24,y:hy+Math.cos(ang)*24,hx,hy,ang,pivotX,pivotY}}
 const wob=h.kind==='bat'?Math.sin(t*6+h.phase)*10:Math.sin(t*3+h.phase)*5;return {x:h.x*W+h.kx,y:base+wob+h.ky}}
function knock(h,p){if(h.knocked)return;h.knocked=true;h.kvx=(p.x<x*W?-1:1)*rand(260,400);h.kvy=-rand(160,280)}
function updateCritters(dt){for(const h of critters){if(h.dormant){if(critterPos(h).y>-60){h.dormant=false;h.x=h.side?1.3+h.ox:-.3-h.ox}continue}
  if(h.knocked){h.kx+=h.kvx*dt;h.ky+=h.kvy*dt;h.kvy+=700*dt;h.spin+=dt*12;continue}
  if(h.kind==='bird'||h.kind==='bat')h.x+=h.vx*dt;
  if(h.kind==='drone'){h.x+=h.vx*dt;if(h.x<.15||h.x>.85){h.vx*=-1;h.x=clamp(h.x,.15,.85)}}}
 critters=critters.filter(h=>{const p=critterPos(h);if(p.y>H+140)return false;if(h.knocked&&(p.y>H+80||p.x<-140||p.x>W+140))return false;return h.dormant||!(h.vx&&(h.kind==='bird'||h.kind==='bat')&&(h.x<-.7||h.x>1.7))})}
function drawCritters(){for(const h of critters){if(h.dormant)continue;const p=critterPos(h);if(p.y<-80||p.y>H+80)continue;if(h.kind==='bird')drawBird(h,p.x,p.y);else if(h.kind==='bat')drawBat(h,p.x,p.y);else if(h.kind==='monkey')drawMonkey(h,p);else drawDrone(h,p.x,p.y)}}
function drawCritterWarnings(){for(const h of critters){if(h.dormant||h.knocked||!h.lead)continue;const p=critterPos(h);if(p.x>-10&&p.x<W+10||p.y<60||p.y>H-60)continue;const left=p.x<0;ctx.save();ctx.globalAlpha=.6+.4*Math.sin(t*16);ctx.translate(left?22:W-22,p.y);ctx.scale(left?-1:1,1);ctx.fillStyle='#ff4d5e';ctx.strokeStyle=INK;ctx.lineWidth=3.5;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-6,-14);ctx.lineTo(-6,14);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}}
const hitsCritter=h=>{if(h.dormant||h.knocked)return false;const p=critterPos(h);return Math.hypot(p.x-x*W,p.y-(balloonY()-5))<h.r+24};
function updateWeather(dt){const weather=weatherNow=weatherAt(flightTime);wind=weather.force;if(!stage.wind)return;
 $('#weather').textContent=weather.warning?`GUST INCOMING ${weather.dir>0?'→':'←'}`:weather.active?`STRONG WIND ${weather.dir>0?'→':'←'}`:'CALM AIR';
 $('#weather').classList.toggle('gust',weather.active||weather.warning);
 if(weather.active){leafClock+=dt;while(leafClock>.075){leafClock-=.075;leaves.push({x:weather.dir>0?-20:SW+20,y:Math.random()*H,dir:weather.dir,speed:140+Math.random()*170,angle:Math.random()*6,size:4+Math.random()*5,phase:Math.random()*6})}}else leafClock=0;
 for(const l of leaves){l.x+=l.dir*l.speed*dt;l.y+=(22+Math.sin(t*4+l.phase)*28)*dt;l.angle+=dt*l.dir*5}leaves=leaves.filter(l=>l.x>-50&&l.x<SW+50&&l.y<H+30)}
function drawLeaves(){if(Math.abs(wind)>.01){ctx.fillStyle=`rgba(52,88,140,${Math.abs(wind)*.18})`;ctx.fillRect(-40,-40,SW+80,H+80)}const colors=stage.leaves||['#ffb340','#5fcf5a'];
 for(const l of leaves){ctx.save();ctx.translate(l.x,l.y);ctx.rotate(l.angle);ctx.scale(1,.45+.4*Math.abs(Math.sin(t*4+l.phase)));ctx.fillStyle=l.size>6?colors[0]:colors[1];ctx.strokeStyle=INK;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-l.size,0);ctx.quadraticCurveTo(0,-l.size,l.size,0);ctx.quadraticCurveTo(0,l.size,-l.size,0);ctx.fill();ctx.stroke();ctx.restore()}}
function drawChevrons(){if(state!=='flying'||!weatherNow||!weatherNow.warning)return;const d=weatherNow.dir;ctx.save();ctx.globalAlpha=.55+.45*Math.sin(t*14);ctx.translate(d>0?30:W-30,H*.5);ctx.scale(d,1);ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();for(let i=0;i<3;i++){const ox=i*14-14;ctx.moveTo(ox-6,-14);ctx.lineTo(ox+6,0);ctx.lineTo(ox-6,14)}ctx.strokeStyle=INK;ctx.lineWidth=10;ctx.stroke();ctx.strokeStyle='#ffd23f';ctx.lineWidth=5;ctx.stroke();ctx.restore()}
function coinY(item){return balloonY()+(alt-item.a)*worldScale}
// Spinning gold coin with a visible rim, star emblem and soft glow.
function drawCoin(cx,cy,r,phase,glowOn=true){const c=Math.cos(phase),w=Math.max(.14,Math.abs(c));ctx.save();ctx.translate(cx,cy);ctx.lineJoin='round';
 if(glowOn){ctx.globalAlpha=.3;ctx.fillStyle='#fff3a0';ctx.beginPath();ctx.arc(0,0,Math.max(0,r*1.6+Math.sin(t*4+phase)*2),0,TAU);ctx.fill();ctx.globalAlpha=1}
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
 else{const P=POWERS[item.kind];applyPower(item.kind);popup(x*W,balloonY()-70,`${P.icon} ${P.name}!`,P.color,28);squashV+=4;mood='joy';moodTimer=.8}}}
function chargedUp(){gameSound.effect('charged');announce('BOOST READY!','TAP ⚡ BOOST · B','record');bump($('#boost'))}

// ---- Power-ups ----
const smashing=()=>engineOn()||invuln>0;
// The engine boost is the one power with a cinematic intro: the action freezes and the balloon celebrates.
function activateEngine(){if(state!=='flying'||showcase||energy<5)return;energy=0;showcase={kind:'energy',age:0,dur:1.6};mood='cool';moodTimer=2.4;announce('⚡ ENGINE BOOST','FULL POWER!','power');gameSound.effect('power');
 burst(x*W,balloonY(),26,{type:'star',colors:['#ffd23f','#fff','#ff8a2a'],speed:[80,260],size:[4,8],life:[.6,1.1],drag:1.5});confetti(24);squash=.3;squashV=0}
function applyPower(kind){const P=POWERS[kind],bx=x*W,by=balloonY();powerCount++;
 if(kind==='magnet'){magnet=8;gameSound.effect('boost')}
 if(kind==='nitro'){boost={kind:'nitro',time:4,dur:4,mult:1.8};gameSound.effect('nitro')}
 if(kind==='shield'){shield=20;gameSound.effect('shield')}
 if(kind==='energy'){boost={kind:'engine',time:3.5,dur:3.5,mult:1.75};gameSound.effect('nitro')}
 burst(bx,by,24,{colors:[P.color,'#fff'],speed:[150,420],size:[2,5],life:[.3,.6]});rings.push({x:bx,y:by,max:110,life:0,dur:.5,color:P.color,width:7});shake=Math.max(shake,kind==='energy'?12:6);flash=kind==='energy'?.3:.12;flashColor=P.color;squash=-.2}
function breakShield(){shield=0;invuln=1.2;gameSound.effect('shieldbreak');const bx=x*W,by=balloonY();burst(bx,by,22,{type:'shard',colors:['#bff4ff','#44d9ff','#ffffff'],speed:[150,330],size:[5,9],life:[.5,.9],gravity:300});rings.push({x:bx,y:by,max:90,life:0,dur:.45,color:'#bff4ff',width:6});popup(bx,by-60,'SHIELD SAVED YOU!','#44d9ff',24);shake=Math.max(shake,12)}
function smashFx(px,py,colors,text){smashes++;gameSound.effect('smash');burst(px,py,14,{type:'shard',colors,speed:[120,320],size:[5,10],life:[.6,1],gravity:500,world:true});burst(px,py,10,{colors:['#fff','#ffd23f'],speed:[150,380],life:[.2,.45]});rings.push({x:px,y:py,max:60,life:0,dur:.35,color:'#fff',width:5});popup(px,py-30,text,'#ff8a2a',26);shake=Math.max(shake,9)}
function breakLedge(o,z){o.broken=true;const reach=Math.min(z.len,x*W+40),px=o.side?W-reach*.6:reach*.6;smashFx(px,z.y,[stage.look.body,stage.look.top,stage.look.dark],'SMASH!')}
function bonkCritter(h){const p=critterPos(h);knock(h,p);coinCount++;flyers.push({x:p.x,y:p.y,age:0});if(h.kind==='drone')smashFx(p.x,p.y,['#c4cee0','#5f6b85','#ffd23f'],'SMASH +1');else{gameSound.effect('boop');burst(p.x,p.y,10,{type:'star',colors:['#fff','#ffd23f'],speed:[80,220],size:[4,7],life:[.3,.6]});popup(p.x,p.y-30,'BOOP +1','#ffd23f',24);shake=Math.max(shake,5)}}

const gapTo=(o,z)=>o.side?(W-z.len-8)-(x*W+28):(x*W-28)-(z.len+8);
function hitsObstacle(z){const left=z.side?W-z.len-8:0,right=z.side?W:z.len+8;const tilt=vx*.16+wind*.12;const cx=x*W+Math.sin(tilt)*5,cy=balloonY()-Math.cos(tilt)*5;const nx=Math.max(left,Math.min(cx,right)),ny=Math.max(z.y-26,Math.min(cy,z.y+26));return ((cx-nx)/28)**2+((cy-ny)/32)**2<1}
// Cave walls: sample the wall profile at three heights along the balloon.
function wallHit(){const bx=x*W;for(const [dy,rx] of [[-26,18],[-5,27],[18,20]]){const a=alt-dy/worldScale,left=caveWall(a,0)*W,right=W-caveWall(a,1)*W;if(bx-rx<left)return {side:-1,limit:(left+rx+3)/W};if(bx+rx>right)return {side:1,limit:(right-rx-3)/W}}return null}
// Reward skimming past a spike tip without touching it.
function checkNearMisses(){for(const o of obstacles){if(o.passed||o.a>alt)continue;o.passed=true;if(o.broken||smashing())continue;const z=spike(o);if(gapTo(o,z)<30){nearMisses++;popup(x*W,balloonY()-60,'CLOSE CALL!','#44d9ff',26);shake=Math.max(shake,5);gameSound.effect('close');burst(o.side?W-z.len-8:z.len+8,z.y,10,{colors:['#fff','#44d9ff'],speed:[100,260],life:[.2,.5],world:true});mood='wow';moodTimer=.7}}}
function measureDanger(){let d=0;const by=balloonY();for(const o of obstacles){if(o.broken)continue;const z=spike(o),dy=by-z.y;if(dy<-40||dy>110)continue;d=Math.max(d,Math.max(0,1-gapTo(o,z)/60)*(1-Math.abs(dy)/110))}
 for(const h of critters){if(h.dormant||h.knocked)continue;const p=critterPos(h);d=Math.max(d,clamp(1-(Math.hypot(p.x-x*W,p.y-by)-h.r-30)/90,0,1))}
 if(stage.walls){const l=caveWall(alt,0)*W,r=W-caveWall(alt,1)*W;d=Math.max(d,clamp(1-(Math.min(x*W-l,r-x*W)-28)/40,0,1))}return Math.min(1,d)}
function checkProgress(){
 if(medalsHit<MEDALS.length&&alt>=MEDALS[medalsHit].at){const m=MEDALS[medalsHit++];if(stageBest()<m.at){announce(`${m.icon} ${m.name} MEDAL`,'NEW MEDAL!','record');gameSound.effect('record');confetti(30);nextMilestone=Math.max(nextMilestone,Math.floor(alt/1000)*1000+1000);return}}
 if(stage.id==='space')for(const ev of spaceEvents())if(!eventsSeen.has(ev.key)){eventsSeen.add(ev.key);announce(ev.e.label,'LOOK!','milestone');gameSound.effect('zone');return}
 if(!passedBest&&stageBest()>0&&alt>stageBest()){passedBest=true;announce('NEW BEST!','KEEP GOING','record');gameSound.effect('record');confetti(24);return}
 if(alt>=nextMilestone){announce(`${nextMilestone.toLocaleString()} m`,'ALTITUDE','milestone');gameSound.effect('milestone');nextMilestone+=1000;bump($('.hud-alt'))}}
function drawRope(){const tied=state==='ready'||state==='menu'||(state==='paused'&&previousState==='ready');ctx.lineCap='round';
 if(tied){const r=rope(),sway=Math.sin(t*2)*4,path=()=>{ctx.beginPath();ctx.moveTo(r.a.x,r.a.y);ctx.quadraticCurveTo(r.a.x+7+sway,r.a.y+35,r.b.x,r.b.y)};
  path();ctx.strokeStyle=INK;ctx.lineWidth=7;ctx.stroke();ctx.strokeStyle='#e0b37a';ctx.lineWidth=3.5;ctx.stroke();ctx.setLineDash([2,6]);ctx.strokeStyle='#8a5f33';ctx.stroke();ctx.setLineDash([]);
  if(state==='ready'){const my=(r.a.y+r.b.y)/2;ctx.setLineDash([7,8]);ctx.lineDashOffset=-t*40;ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(W*.28,my);ctx.lineTo(W*.72,my);ctx.stroke();ctx.setLineDash([]);ctx.lineDashOffset=0;
   const sx=W*(.5+Math.sin(t*2.6)*.2),pulse=(t*1.5)%1;ctx.strokeStyle=`rgba(255,255,255,${1-pulse})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(sx,my,10+pulse*18,0,TAU);ctx.stroke();ctx.fillStyle='#fff';ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.beginPath();ctx.arc(sx,my,9,0,TAU);ctx.fill();ctx.stroke()}}
 if(ropeCut&&ropeCut.age<.8){const bx=W/2,by=H-47+alt*worldScale,k=ropeCut.age/.8,len=ropeCut.length*(1-k*.85),swing=Math.sin(ropeCut.age*14)*(1-k)*26,path=()=>{ctx.beginPath();ctx.moveTo(bx,by);ctx.quadraticCurveTo(bx+swing,by-len*.6,bx+swing*1.6+k*20,by-len+k*len*.4)};
  ctx.globalAlpha=1-k*k;path();ctx.strokeStyle=INK;ctx.lineWidth=7;ctx.stroke();ctx.strokeStyle='#e0b37a';ctx.lineWidth=3.5;ctx.stroke();ctx.globalAlpha=1}}
function drawTicks(){ctx.strokeStyle='rgba(255,255,255,.4)';ctx.lineWidth=2;for(let m=Math.floor(alt/250)*250;m<alt+1200;m+=250){const yy=balloonY()+(alt-m)*worldScale;if(yy>30&&yy<H-35){ctx.beginPath();ctx.moveTo(W-16,yy);ctx.lineTo(W-6,yy);ctx.stroke()}}}
function drawStreaks(){ctx.lineCap='round';for(const s of streaks){const v=Math.hypot(s.vx,s.vy)||1;ctx.strokeStyle=s.color||`rgba(255,255,255,${s.alpha})`;ctx.globalAlpha=s.color?s.alpha:1;ctx.lineWidth=s.width;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.x-s.vx/v*s.len,s.y-s.vy/v*s.len);ctx.stroke()}ctx.globalAlpha=1}
function heart(s){ctx.beginPath();ctx.moveTo(0,s*.35);ctx.bezierCurveTo(-s*1.1,-s*.35,-s*.45,-s*1.05,0,-s*.45);ctx.bezierCurveTo(s*.45,-s*1.05,s*1.1,-s*.35,0,s*.35);ctx.closePath()}
function drawParticles(back){for(const p of particles){if(!!p.back!==back)continue;const k=p.life/p.max;ctx.save();ctx.translate(p.x,p.y);
 if(p.type==='puff'){ctx.globalAlpha=(1-k)*.6;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(0,0,p.size*(1+k*1.4),0,TAU);ctx.fill()}
 else if(p.type==='star'){ctx.globalAlpha=1-k;ctx.rotate(p.rot);ctx.fillStyle=p.color;star(0,0,p.size*(1-k*.5),p.size*.4*(1-k*.5),4);ctx.fill()}
 else if(p.type==='heart'){ctx.globalAlpha=1-k*k;ctx.rotate(p.rot*.2);ctx.fillStyle=p.color;heart(p.size);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1.5;ctx.stroke()}
 else if(p.type==='confetti'){ctx.rotate(p.rot);ctx.scale(Math.cos(p.rot*3),1);ctx.globalAlpha=k>.7?(1-k)/.3:1;ctx.fillStyle=p.color;ctx.fillRect(-p.size/2,-p.size/4,p.size,p.size/2)}
 else if(p.type==='shard'){ctx.rotate(p.rot);ctx.globalAlpha=k>.75?(1-k)/.25:1;ctx.fillStyle=p.color;ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(-p.size,-p.size*.4);ctx.lineTo(p.size*.8,-p.size*.6);ctx.lineTo(p.size*.3,p.size*.6);ctx.closePath();ctx.fill();ctx.stroke()}
 else{ctx.globalAlpha=1-k;ctx.strokeStyle=p.color;ctx.lineWidth=p.size;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-p.vx*.05,-p.vy*.05);ctx.stroke()}
 ctx.restore()}}
function drawRings(){for(const r of rings){const k=r.life/r.dur;ctx.globalAlpha=1-k;ctx.strokeStyle=r.color;ctx.lineWidth=r.width*(1-k)+.5;ctx.beginPath();ctx.arc(r.x,r.y,r.max*(1-(1-k)**3),0,TAU);ctx.stroke()}ctx.globalAlpha=1}
function drawPopups(){ctx.textAlign='center';ctx.lineJoin='round';for(const p of popups){const k=p.life/p.max,scale=k<.18?backOut(k/.18):1;ctx.save();ctx.globalAlpha=k>.7?1-(k-.7)/.3:1;ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.scale(scale,scale);ctx.font=`${p.size}px ${FONT}`;ctx.lineWidth=p.size*.3;ctx.strokeStyle=INK;ctx.strokeText(p.text,0,0);ctx.fillStyle=p.color;ctx.fillText(p.text,0,0);ctx.restore()}}
// Engine boost celebration: the action freezes, rays spin and the balloon zooms in and dances.
function drawShowcase(){const s=showcase,P=POWERS[s.kind],k=s.age/s.dur,a=Math.min(1,s.age/.2)*(k>.82?(1-k)/.18:1),bx=x*W,by=balloonY();
 ctx.save();ctx.globalAlpha=.6*a;ctx.fillStyle='#120a30';ctx.fillRect(-OX-40,-40,SW+80,H+80);ctx.restore();
 ctx.save();ctx.translate(bx,by);ctx.rotate(s.age*1.6);ctx.globalAlpha=.4*a;ctx.fillStyle=P.color;const R=Math.max(SW,H);for(let i=0;i<16;i++){ctx.rotate(TAU/16);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(R,-R*.09);ctx.lineTo(R,R*.09);ctx.closePath();ctx.fill()}ctx.restore();
 const halo=ctx.createRadialGradient(bx,by,0,bx,by,140);halo.addColorStop(0,`rgba(255,255,255,${.55*a})`);halo.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=halo;ctx.fillRect(bx-140,by-140,280,280);
 const z=1+.75*a*(s.age<.35?backOut(s.age/.35):1);ctx.save();ctx.translate(bx,by);ctx.rotate(Math.sin(s.age*14)*.14*a);ctx.scale(z,z);ctx.translate(-bx,-by-Math.abs(Math.sin(s.age*9))*6*a);drawBalloon();ctx.restore();
 const pop=s.age<.4?backOut(s.age/.4):1;drawPickup(s.kind,bx+Math.sin(s.age*5)*8,by-100*z+Math.sin(s.age*7)*5,Math.max(.01,26*pop*a))}
// Collected coins fly up into the HUD counter.
function drawFlyers(){if(!flyers.length)return;const c=canvas.getBoundingClientRect(),e=$('#coin-pill .coin-icon').getBoundingClientRect(),tx=e.left+e.width/2-c.left,ty=e.top+e.height/2-c.top;
 for(const f of flyers){const k=Math.min(1,f.age/.55),q=k*k*(3-2*k),sx=f.x+OX,cy=ty+60,px=(1-q)**2*sx+2*(1-q)*q*sx+q*q*tx,py=(1-q)**2*f.y+2*(1-q)*q*cy+q*q*ty;drawCoin(px,py,13*(1-.35*q),t*14,false)}}
function drawSides(){if(OX<4)return;const look=stage.look;ctx.fillStyle='rgba(12,6,40,.42)';ctx.fillRect(-40,-40,OX+40,H+80);ctx.fillRect(OX+W,-40,OX+40,H+80);
 for(const ex of [OX,OX+W]){ctx.fillStyle=look.body;ctx.fillRect(ex-7,-40,14,H+80);ctx.fillStyle=look.top;ctx.fillRect(ex-7,-40,5,H+80);ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(ex-7,-40);ctx.lineTo(ex-7,H+40);ctx.moveTo(ex+7,-40);ctx.lineTo(ex+7,H+40);ctx.stroke();ctx.fillStyle='rgba(255,255,255,.4)';const off=(alt*worldScale)%48;for(let y=off-48;y<H+48;y+=48){ctx.beginPath();ctx.arc(ex,y,2.5,0,TAU);ctx.fill()}}}
function drawVignette(){const g=ctx.createRadialGradient(SW/2,H/2,Math.min(SW,H)*.35,SW/2,H/2,Math.max(SW,H)*.75);g.addColorStop(0,'rgba(10,5,40,0)');g.addColorStop(1,'rgba(10,5,40,.28)');ctx.fillStyle=g;ctx.fillRect(0,0,SW,H);
 if(danger>.05){const r=ctx.createRadialGradient(SW/2,H/2,Math.min(SW,H)*.3,SW/2,H/2,Math.max(SW,H)*.7);r.addColorStop(0,'rgba(255,40,70,0)');r.addColorStop(1,`rgba(255,40,70,${danger*.4*(.75+.25*Math.sin(t*14))})`);ctx.fillStyle=r;ctx.fillRect(0,0,SW,H)}
 if(engineOn()){const r=ctx.createRadialGradient(SW/2,H/2,Math.min(SW,H)*.35,SW/2,H/2,Math.max(SW,H)*.75);r.addColorStop(0,'rgba(255,140,40,0)');r.addColorStop(1,'rgba(255,140,40,.3)');ctx.fillStyle=r;ctx.fillRect(0,0,SW,H)}}
function draw(){ctx.save();const amount=calm?shake*.3:shake;if(amount>.4)ctx.translate(rand(-amount,amount),rand(-amount,amount));
 const column=W;W=SW;stage.bg();stage.ground();W=column;drawStreaks();
 ctx.save();ctx.translate(OX,0);
 drawTicks();obstacles.forEach(drawObstacle);drawCritters();drawPickups();if(stage.walls)drawCaveWalls();drawRope();if(stage.dark)caveDark(x*W,balloonY(),engineOn());
 drawParticles(true);drawBalloon();drawAuras();
 ctx.save();ctx.translate(-OX,0);drawLeaves();ctx.restore();drawChevrons();drawCritterWarnings();drawParticles(false);drawRings();if(showcase)drawShowcase();drawPopups();
 ctx.restore();drawSides();ctx.restore();
 drawFlyers();drawVignette();if(flash>0){ctx.globalAlpha=Math.min(1,flash);ctx.fillStyle=flashColor;ctx.fillRect(0,0,SW,H);ctx.globalAlpha=1}}
function update(dt){t+=dt;spin+=dt*(.65+Math.abs(wind)*3+Math.abs(vx));if(state!=='flying')return;
 flightTime+=dt;generateCourse();updateWeather(dt);updateCritters(dt);
 const direction=(keys.has('arrowright')||keys.has('d')?1:0)-(keys.has('arrowleft')||keys.has('a')?1:0);let desired=direction*.65;if(target!==null)desired=clamp((target-x)*6,-.85,.85);vx+=(desired+wind-vx)*Math.min(1,dt*4);x+=vx*dt;x=clamp(x,(radius+5)/W,1-(radius+5)/W);
 alt+=dt*flightSpeed(alt)*speedMult;collectPickups(dt);
 if(stage.walls){const hit=wallHit();if(hit){if(smashing()||shield>0){if(shield>0&&!smashing())breakShield();x=hit.limit;vx=-hit.side*.5;burst(x*W+hit.side*28,balloonY(),8,{colors:['#fff','#ffd23f'],speed:[80,220],life:[.2,.4]});shake=Math.max(shake,4)}else{finish();return}}}
 for(const o of obstacles){if(o.broken)continue;const z=spike(o);if(!hitsObstacle(z))continue;if(smashing()){breakLedge(o,z);continue}if(shield>0){breakShield();breakLedge(o,z);continue}finish();return}
 for(const h of critters){if(!hitsCritter(h))continue;if(smashing()){bonkCritter(h);continue}if(shield>0){breakShield();bonkCritter(h);continue}finish();return}
 checkNearMisses();checkProgress()}
// Effects run once per frame; dt is slowed during slow motion and the boost intro, real is wall-clock time.
function updateEffects(dt,real){shake*=Math.exp(-8*real);flash=Math.max(0,flash-real*2.4);if(grow<1)grow=Math.min(1,grow+real*2.2);
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
 if(state==='flying'&&!showcase){const starry=stage.id==='space'||stage.id==='universe',tilt=vx*.16+wind*.12,fire=engineOn(),every=fire?.018:.04;trailClock+=dt;
  while(trailClock>every){trailClock-=every;const bx=x*W-Math.sin(tilt)*(fire?56:36),by=balloonY()+(fire?56:36);
   if(fire)particles.push({type:'puff',back:true,world:true,x:bx+rand(-4,4),y:by,vx:rand(-20,20),vy:rand(60,140),life:0,max:rand(.35,.6),size:rand(5,9),color:pick(['#ffd23f','#ff8a2a','#ff4d5e','#fff6b0']),gravity:0,drag:1,rot:0,vr:0});
   else particles.push({type:starry?'star':'puff',back:true,world:true,x:bx+rand(-3,3),y:by,vx:rand(-10,10),vy:rand(10,30),life:0,max:starry?.7:.9,size:starry?rand(3,5):rand(4,7),color:starry?pick(['#9fe8ff','#c9a8ff','#fff']):stage.dark?'#c9a8ff':'#fff',gravity:0,drag:1,rot:0,vr:rand(-3,3)})}
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
function updateHud(){setText('#coin-count',String(shownCoins));setText('#altitude',Math.floor(alt).toLocaleString());setText('#speed',(state==='flying'||state==='paused'&&previousState==='flying'?Math.round(flightSpeed(alt)*speedMult):0)+' m/s');
 shell.classList.toggle('ready',state==='ready'||(state==='paused'&&previousState==='ready'));shell.classList.toggle('menu',state==='menu');
 setChip('#chip-boost',boost?boost.time/boost.dur:0);if(boost){setText('#chip-boost-icon',boost.kind==='nitro'?'🔥':'⚡');$('#chip-boost').style.setProperty('--c',POWERS[boost.kind==='engine'?'energy':'nitro'].color)}
 setChip('#chip-shield',shield/20);setChip('#chip-magnet',magnet/8);
 const btn=$('#boost'),visible=state==='flying'||state==='paused'&&previousState==='flying',key=`${visible}|${energy}|${!!showcase}`;
 if(hudCache.boost!==key){hudCache.boost=key;btn.hidden=!visible;btn.disabled=energy<5||!!showcase;btn.classList.toggle('ready',energy>=5&&!showcase);btn.querySelectorAll('.pips i').forEach((pip,i)=>pip.classList.toggle('on',i<energy))}}
function frame(now){const real=Math.min((now-last)/1000||0,.035);last=now;
 if(state!=='paused'){if(showcase)timeScale=.04;else if(slowTimer>0){slowTimer-=real;timeScale=slowTimer>0?.25:1}else timeScale=1;
  const dt=real*timeScale;let remaining=dt;while(remaining>0){const step=Math.min(remaining,8/(flightSpeed(alt)*speedMult*worldScale));update(step);remaining-=step}updateEffects(dt,real)}
 gameSound.update(state==='menu'?'ready':state,wind,flightSpeed(alt),alt,document.hidden);draw();updateHud();if(previews.length&&!$('#panel').hidden)renderPreviews();requestAnimationFrame(frame)}
reset('menu');resize();requestAnimationFrame(frame);
