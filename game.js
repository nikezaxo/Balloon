'use strict';
const canvas=document.querySelector('#game');let ctx=canvas.getContext('2d');
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s),shell=$('.game-shell');
const FONT="'Lilita One',Impact,'Arial Black',sans-serif",calm=matchMedia('(prefers-reduced-motion: reduce)').matches;
const rand=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)],clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const PARTY=['#ff4d5e','#ffd23f','#44d9ff','#4fd36b','#a273ff','#ffffff'];
// Power-ups are rare treats. Energy cells charge the boost engine, the only power with a cinematic intro.
const POWERS={
 energy:{name:'ENERGY CELL',ico:'bolt',color:'#ffd23f',desc:'Collect 5 to charge the BOOST engine. Tap BOOST (or press B) for a cinematic rocket boost that smashes through everything.'},
 magnet:{name:'COIN MAGNET',ico:'magnet',color:'#ff4d5e',weight:2,desc:'Pulls nearby coins and energy cells to you for 8 seconds.'},
 shield:{name:'BUBBLE SHIELD',ico:'shield',color:'#44d9ff',weight:1.5,desc:'Absorbs one hit. Lasts up to 20 seconds.'},
 nitro:{name:'TURBO',ico:'flame',color:'#ff8a2a',weight:1,desc:'A 4-second rocket burst with a quick intro that smashes through obstacles.'},
 double:{name:'DOUBLE COINS',ico:'coin',color:'#ffb300',weight:1.5,desc:'Every coin counts double for 15 seconds, on top of your row multiplier.'}};
const PICKUPS=['magnet','shield','nitro','double'];
const DOUBLE_TIME=15;
const MEDALS=[{at:1000,tone:'bronze',name:'BRONZE'},{at:2500,tone:'silver',name:'SILVER'},{at:5000,tone:'gold',name:'GOLD'}];
const LIFE_PRICE=80,MAX_LIVES=9;
// Score: 10 points per metre plus bonuses. A run earns 1, 2 or 3 stars at these score targets.
const STAR_SCORES=[20000,60000,150000],PTS={coin:100,row:500,energy:200,power:300,smash:250,close:500,boss:50000};
const starsFor=v=>STAR_SCORES.filter(s=>v>=s).length;
// Wallet, owned skins, lives and per-stage bests live in the browser's localStorage.
function loadSave(){const fresh={coins:0,gems:0,lives:1,skins:['classic'],skin:'classic',best:{},scores:{},stars:{},lastStage:'sky'};try{const s=JSON.parse(localStorage.getItem('skybound-save'));if(s)return {...fresh,...s,best:{...(s.best||{})},scores:{...(s.scores||{})},stars:{...(s.stars||{})}};const old=Number(localStorage.getItem('skybound-best'))||0;if(old)fresh.best.sky=old}catch{}return fresh}
const save=loadSave();
function persist(){save.updated=Date.now();try{localStorage.setItem('skybound-save',JSON.stringify(save))}catch{}if(typeof online!=='undefined')online.saved()}
let stage=STAGES.find(s=>s.id===save.lastStage)||STAGES[0];
let SW=420,W=420,OX=0,H=700,dpr=1,state='menu',previousState='ready',alt=0,x=.5,vx=0,t=0,last=0,obstacles=[],coins=[],critters=[],particles=[],pointer=null,target=null,sound=false,soundTouched=false,flightTime=0,spin=0,wind=0,weatherNow=null,leaves=[],leafClock=0,coinCount=0,shownCoins=0,banked=0,nextObstacle=450,spawnIndex=0;
// Game feel: camera shake, flashes, slow motion, popups, combos and a springy balloon with a face.
let shake=0,flash=0,flashColor='#fff',timeScale=1,slowTimer=0,deathTimer=0,popups=[],rings=[],flyers=[],streaks=[],trailClock=0,streakClock=0,combo=0,comboTimer=0,bestCombo=0,nearMisses=0,smashes=0,squash=0,squashV=0,blink=0,nextBlink=2,mood='happy',moodTimer=0,danger=0,ropeCut=null,nextMilestone=1000,passedBest=false,medalsHit=0,eventsSeen=new Set(),grow=1,revives=0;
// Power state. The showcase is the freeze-frame celebration when the boost engine fires.
let energy=0,boost=null,speedMult=1,shield=0,magnet=0,doubler=0,invuln=0,showcase=null,powerCount=0,bonus=0,starsHit=0,starFlyers=[],bossKills=0;
const runScore=()=>Math.floor(alt)*10+Math.round(bonus);
let panelKind=null,storeTab='skins',storePick='classic',previews=[],skinPop={},poseSfx={},transition=null,swapFx=0,wantFullscreen=false;
// Coin rows: 10 coins per row along the safe path; every 3 perfect rows in a row add +0.1 to the coin multiplier.
// Rows are spaced far apart so normal flight has few coins; the big haul is the coin rush during a boost.
const ROW_SIZE=10,COIN_STEP=42,COIN_BREAK=1000,RUSH_STEP=30;let rushCursor=0,rushCount=0,coinCursor=330,prevLedge={a:0,c:.5},rowId=0,rowCount=0,rowBreaks=0,rows=new Map(),rowStreak=0,coinMult=1,bestMult=1;
const keys=new Set(),radius=29,worldScale=.65,hudCache={};
// The canvas fills the screen; gameplay happens in a centred column at most 0.6× the screen height wide.
function resize(){const r=canvas.getBoundingClientRect();SW=r.width;H=r.height;W=Math.round(Math.min(SW,Math.max(360,H*.6)));OX=(SW-W)/2;dpr=Math.min(devicePixelRatio||1,2);canvas.width=SW*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);shell.style.setProperty('--pw',W+'px')}
new ResizeObserver(resize).observe(canvas);
const stageBest=()=>save.best[stage.id]||0;
function reset(mode='ready'){state=mode;alt=0;x=.5;vx=0;target=null;pointer=null;obstacles=[];coins=[];critters=[];particles=[];leaves=[];flightTime=0;spin=0;wind=0;weatherNow=null;leafClock=0;coinCount=0;shownCoins=0;banked=0;nextObstacle=450;spawnIndex=0;keys.clear();boss=null;caveWallScale=1;nextBossTime=BOSS_INTERVAL;rewardCoins=[];coinCursor=330;rushCursor=0;rushCount=0;prevLedge={a:0,c:.5};rowId=0;rowCount=0;rowBreaks=0;rows=new Map();rowStreak=0;coinMult=1;bestMult=1;$('#versus').hidden=true;$('#boss-bar').hidden=true;$('#fatality').hidden=true;
 shake=0;flash=0;timeScale=1;slowTimer=0;deathTimer=0;popups=[];rings=[];flyers=[];streaks=[];combo=0;comboTimer=0;bestCombo=0;nearMisses=0;smashes=0;squash=0;squashV=0;mood='happy';moodTimer=0;danger=0;ropeCut=null;nextMilestone=1000;passedBest=false;medalsHit=0;eventsSeen=new Set();grow=1;revives=0;
 energy=0;boost=null;speedMult=1;shield=0;magnet=0;doubler=0;invuln=0;showcase=null;powerCount=0;bonus=0;starsHit=0;starFlyers=[];bossKills=0;$('#results').hidden=true;
 generateCourse();$('#weather').textContent=stage.wind?'CALM AIR':stage.calm;$('#weather').classList.remove('gust');$('#hint').hidden=mode!=='ready';$('#menu').hidden=mode!=='menu';$('#menu').classList.remove('leaving');transition=null;$('#overlay').hidden=true;$('#panel').hidden=true;panelKind=null;$('#pause').innerHTML=icon('pause');$('#pause').setAttribute('aria-label','Pause game');$('#announce').replaceChildren();refreshMeta()}
function refreshMeta(){const b=stageBest();$('#best').innerHTML=b?`${iconHTML('trophy')}BEST ${b.toLocaleString()} m`:'NO RECORD YET';$('#hint-stage').textContent=stage.name;$('#zone').textContent=stage.name;$('#hint-icon').innerHTML=icon(stage.icon);$('#zone-icon').innerHTML=icon(stage.icon);$('#menu-coins').textContent=save.coins.toLocaleString();$('#menu-gems').textContent=(save.gems||0).toLocaleString();$('#menu-lives').textContent=save.lives;if(typeof myLook==='function'){const pf=$('#profile-face'),lk=myLook(),key=lk.avatar+lk.frame;if(pf.dataset.look!==key){pf.dataset.look=key;pf.replaceChildren(avatarEl(lk,44))}}updatePicker()}
// Main menu stage picker: icon, name, best, medals and page dots for the selected stage.
function updatePicker(){const i=STAGES.indexOf(stage),b=stageBest(),show=$('#stage-show');show.style.setProperty('--a',stage.top);show.style.setProperty('--b',stage.bottom);if(show.dataset.stage!==stage.id){show.dataset.stage=stage.id;$('#stage-icon').innerHTML=icon(stage.icon)}$('#stage-name').textContent=stage.name;$('#stage-best').textContent=b?`BEST ${b.toLocaleString()} m`:'NOT PLAYED YET';$('#stage-medals').innerHTML=MEDALS.map(m=>iconHTML('medal',m.tone,b>=m.at?'':'off')).join('');{const st=save.stars[stage.id]||0,hs=save.scores[stage.id]||0;$('#stage-stars').innerHTML=[0,1,2].map(k=>iconHTML('star',k<st?'':'off',k===1?'mid':'')).join('');$('#stage-score').textContent=hs?`HIGH SCORE ${hs.toLocaleString()}`:'NO SCORE YET'}const wins=(save.bossWins||{})[stage.id]||0;$('#stage-boss').innerHTML=`${iconHTML('crown')}BOSS: ${BOSSES[stage.id].name}${wins?` · BEATEN x${wins}`:''}`;
 const dots=$('#stage-dots');if(dots.children.length!==STAGES.length){dots.replaceChildren(...STAGES.map((s,k)=>{const d=el('button');d.setAttribute('aria-label',s.name);d.onclick=()=>setStage(k);return d}))}[...dots.children].forEach((d,k)=>d.classList.toggle('on',k===i))}
function setStage(i){if(state!=='menu')return;const next=STAGES[(i+STAGES.length)%STAGES.length];if(next===stage)return;stage=next;save.lastStage=stage.id;persist();reset('menu');swapFx=1;const show=$('#stage-show');show.classList.remove('pop');void show.offsetWidth;show.classList.add('pop');gameSound.effect('on')}
function bank(){const gain=Math.floor(coinCount)-banked;if(gain>0){save.coins+=gain;banked=coinCount;persist()}}

// ---- Menu, panels, full screen and sound ----
const fsElement=()=>document.fullscreenElement||document.webkitFullscreenElement;
function enterFullscreen(){const el=document.documentElement,request=el.requestFullscreen||el.webkitRequestFullscreen;if(fsElement()||!request)return;try{const p=request.call(el,{navigationUI:'hide'});if(p&&p.then)p.then(()=>{if(screen.orientation&&screen.orientation.lock)screen.orientation.lock('portrait').catch(()=>{})}).catch(()=>{})}catch{}}
function toggleFullscreen(){if(fsElement()){const p=(document.exitFullscreen||document.webkitExitFullscreen).call(document);if(p&&p.catch)p.catch(()=>{})}else enterFullscreen()}
if(!document.documentElement.requestFullscreen&&!document.documentElement.webkitRequestFullscreen)$$('.fs-toggle').forEach(b=>b.hidden=true);
function syncSound(){for(const b of $$('.sound-toggle')){b.innerHTML=icon(sound?'speaker':'mute');b.classList.toggle('on',sound);b.setAttribute('aria-pressed',String(sound));b.setAttribute('aria-label',sound?'Disable sound':'Enable sound')}}
async function toggleSound(){soundTouched=true;sound=await gameSound.enable(!sound);syncSound();if(sound)preloadVoices();if(sound)gameSound.effect('on')}
function ensureSound(){if(soundTouched)return;gameSound.enable(true).then(on=>{if(on&&!soundTouched){preloadVoices();soundTouched=true;sound=true;syncSound();gameSound.effect('on')}})}
// Leave the menu straight into the chosen stage: the menu flies away and an iris opens on the stage.
function startRun(how){if(state!=='menu')return;if(how==='swipe')wantFullscreen=true;else enterFullscreen();ensureSound();const menu=$('#menu');menu.classList.add('leaving');setTimeout(()=>{if(menu.classList.contains('leaving')){menu.hidden=true;menu.classList.remove('leaving')}},280);
 if(sound)preloadVoices();state='ready';launch(true);transition={age:0,dur:1.2};announce(stage.name,"LET'S FLY!",'stage',stage.icon);canvas.focus()}
function openMenu(){bank();reset('menu')}
function el(tag,cls='',text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e}
function openPanel(kind){panelKind=kind;previews=[];storePick=save.skin;const list=$('#panel-list');list.replaceChildren();
 if(kind==='store')renderStore();
 else if(kind==='ranks')renderRanks();
 else if(kind==='profile')renderProfile();
 else if(kind==='clan')renderClan();
 else{$('#panel-title').textContent='POWER-UPS';{const row=el('div','boost-item'),ico=el('span','ico'),text=el('div');ico.innerHTML=icon('skull');ico.style.setProperty('--c','#ff4d5e');text.append(el('h3','','BOSS FIGHTS'),el('p','',`Every ${BOSS_INTERVAL/60} minutes of flying the stage boss arrives. Dodge its weapons until it runs out of stamina, then tap FATALITY. Each balloon skin has its own fatality.`));row.append(ico,text);list.append(row)}for(const p of Object.values(POWERS)){const row=el('div','boost-item'),ico=el('span','ico'),text=el('div');ico.innerHTML=icon(p.ico);ico.style.setProperty('--c',p.color);text.append(el('h3','',p.name),el('p','',p.desc));row.append(ico,text);list.append(row)}}
 $('#panel').hidden=false;list.scrollTop=0}
function renderStore(){$('#panel-title').textContent='STORE';const list=$('#panel-list'),scroll=list.scrollTop;list.replaceChildren();const top=el('div','store-top'),tabs=el('div','tabs');
 for(const [id,label,ic] of [['skins','SKINS','balloon'],['lives','LIVES','heart']]){const b=el('button','tab'+(storeTab===id?' on':''));b.innerHTML=iconHTML(ic)+label;b.onclick=()=>{storeTab=id;renderStore()};tabs.append(b)}
 const wallet=el('div','pill');wallet.innerHTML=iconHTML('coin');wallet.append(el('b','',save.coins.toLocaleString()));const gw=el('div','pill gem-pill');gw.innerHTML=iconHTML('gem');gw.append(el('b','',(save.gems||0).toLocaleString()));const wl=el('div','wallets');wl.append(wallet,gw);top.append(tabs,wl);list.append(top);
 if(storeTab==='skins'){const id=storePick,sk=SKINS[id],rar=RARITY[sk.rarity]||RARITY.common,owned=save.skins.includes(id),on=save.skin===id,feat=el('div','skin-feature'),card=el('div','feat-card'),cv=document.createElement('canvas'),info=el('div','feat-info');
  card.style.setProperty('--ca',rar.a);card.style.setProperty('--cb',rar.b);cv.width=360;cv.height=420;cv.dataset.skin=id;cv.dataset.feature='1';card.append(el('span','rarity-tag',rar.name),cv,el('b','card-name',sk.name));if(on)card.append(el('span','in-use','IN USE'));card.onclick=()=>{skinPop[id]=performance.now()/1000;gameSound.effect('on')};
  const b=el('button','buy big'+(on?' on':owned?' own':''));if(on||owned)b.textContent=on?'EQUIPPED':'EQUIP';else b.innerHTML=sk.gems?iconHTML('gem')+sk.gems:iconHTML('coin')+sk.price;if(!owned&&sk.gems)b.classList.add('gem');b.onclick=()=>buySkin(id,b);
  const tag=el('span','rarity-chip',rar.name);tag.style.setProperty('--ca',rar.a);tag.style.setProperty('--cb',rar.b);
  info.append(tag,el('h3','',sk.name),el('p','',sk.about),el('small','pose-name',`POSE: ${(SKIN_POSES[id]||{}).name||'WAVE'}`),el('small','fatal-name',`FATALITY: ${(FATALITIES[id]||FATALITIES.classic).name}`),b,el('small','feat-hint','Tap the card to replay the pose'));
  feat.append(card,info);list.append(feat);
  const fan=el('div','card-fan');SKIN_ORDER.forEach((sid,k)=>{const s2=SKINS[sid],r2=RARITY[s2.rarity]||RARITY.common,own=save.skins.includes(sid),mini=el('button','mini-card'+(sid===id?' picked':'')+(save.skin===sid?' equipped':'')),mc=document.createElement('canvas');mini.style.setProperty('--ca',r2.a);mini.style.setProperty('--cb',r2.b);mini.style.setProperty('--tilt',`${(k%2?3:-3)*(sid===id?0:1)}deg`);mini.setAttribute('aria-label',s2.name);mc.width=140;mc.height=150;mc.dataset.skin=sid;
   const badge=el('span','mini-badge'+(own?' own':''));if(save.skin===sid)badge.innerHTML=iconHTML('crown');else if(own)badge.textContent='✓';else badge.innerHTML=s2.gems?iconHTML('gem')+s2.gems:iconHTML('coin')+s2.price;mini.append(mc,el('b','',s2.name),badge);
   mini.onclick=()=>{if(storePick===sid){skinPop[sid]=performance.now()/1000;return}storePick=sid;skinPop[sid]=performance.now()/1000;gameSound.effect('boop');renderStore();const fc=$('.feat-card');if(fc)fc.classList.add('flip')};fan.append(mini)});
  list.append(fan);previews=[...list.querySelectorAll('canvas')]}
 else{const box=el('div','lives-box'),hearts=el('div','hearts');hearts.innerHTML=Array.from({length:MAX_LIVES},(_,k)=>iconHTML('heart','',k<save.lives?'':'off')).join('');box.append(hearts,el('p','',`You have ${save.lives} extra ${save.lives===1?'life':'lives'}. After a pop, tap REVIVE to keep climbing from the same spot.`));
  for(const n of [1,3]){const price=n===1?LIFE_PRICE:LIFE_PRICE*3-40,b=el('button','buy');b.innerHTML=`BUY ${n} ${iconHTML('heart')} · ${iconHTML('coin')}${price}`;b.disabled=save.lives+n>MAX_LIVES;b.onclick=()=>buyLives(n,price,b);box.append(b)}list.append(box);previews=[]}
 list.scrollTop=scroll;refreshMeta()}
function notEnough(b,need,gem=false){b.classList.remove('nope');void b.offsetWidth;b.classList.add('nope');gameSound.effect('warn');const old=b.innerHTML;b.innerHTML=gem?`NEED ${iconHTML('gem')}${need-(save.gems||0)}`:`NEED ${iconHTML('coin')}${need-save.coins}`;setTimeout(()=>{if(b.isConnected)b.innerHTML=old},1100)}
function buySkin(id,b){const s=SKINS[id];if(!save.skins.includes(id)){if(s.gems){if((save.gems||0)<s.gems)return notEnough(b,s.gems,true);save.gems-=s.gems}else{if(save.coins<s.price)return notEnough(b,s.price);save.coins-=s.price}save.skins.push(id);gameSound.effect('buy')}else gameSound.effect('on');save.skin=id;storePick=id;skinPop[id]=performance.now()/1000;persist();if(sound)preloadVoices();renderStore();const card=$('.feat-card');if(card)card.classList.add('chosen')}
function buyLives(n,price,b){if(save.coins<price)return notEnough(b,price);save.coins-=price;save.lives=Math.min(MAX_LIVES,save.lives+n);persist();gameSound.effect('buy');renderStore()}
// Store previews: every skin moves in its own style with its own effect; picking one adds a burst.
function placeBalloon(a,pop){const b=1+Math.sin(pop*Math.PI)*.28;ctx.translate(a.x||0,a.y||0);ctx.rotate(a.rot||0);ctx.scale((a.sx||1)*b,(a.sy||1)*b)}
function renderPreviews(){const main=ctx,now=performance.now()/1000;for(const cv of previews){const id=cv.dataset.skin,c=cv.getContext('2d'),big=!!cv.dataset.feature;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,cv.width,cv.height);if(big)c.setTransform(2.5,0,0,2.5,180,238);else c.setTransform(1.55,0,0,1.55,70,84);ctx=c;
  let p=skinPop[id]?(now-skinPop[id])/POSE_TIME:1;if(!big)p=1;
  if(big&&p<1){const P=SKIN_POSES[id];let fired=poseSfx[id];if(!fired||fired.start!==skinPop[id]){fired=poseSfx[id]={start:skinPop[id],done:new Set()};sayVoice('select',{skin:id,force:true})}if(P)for(const [at,kind] of P.sfx||[])if(p>=at&&!fired.done.has(at+kind)){fired.done.add(at+kind);gameSound.effect(kind)}}
  drawSkinShow(id,now,big?p:1,big?0:(skinPop[id]?Math.max(0,1-(now-skinPop[id])/.9):0))}ctx=main}
// A skin on a store card: its idle style and effect, or its selection pose while one is playing.
function drawSkinShow(id,now,p,pop){const skin=SKINS[id]||SKINS.classic,fx=SKIN_FX[id]||SKIN_FX.classic,P=p<1&&SKIN_POSES[id]?SKIN_POSES[id].fn(p,now):null,a=P||fx.anim(now);
 ctx.save();if(P){if(P.back)P.back()}else skinFx(fx.fx,now,'back');ctx.restore();
 if(!P&&fx.afterimage)for(const [lag,alpha] of [[.09,.16],[.045,.3]]){ctx.save();ctx.globalAlpha=alpha;placeBalloon(fx.anim(now-lag),0);drawBalloonBody(skin,(now-lag)*.9,'happy',0);ctx.restore()}
 if(!P||P.alpha!==0){ctx.save();if(P&&P.alpha!==undefined)ctx.globalAlpha=P.alpha;placeBalloon(a,pop);drawBalloonBody(P&&P.noCrown?{...skin,extras:[]}:skin,now*.9*(a.turn||1)+(P&&P.spin||0),P?P.face||'joy':pop>0?'star':'happy',0);if(id==='gold')goldSweep(now);ctx.restore()}
 ctx.save();if(P){if(P.front)P.front()}else skinFx(fx.fx,now,'front');ctx.restore();if(pop>0)chosenFx(pop)}
$('#play').onclick=()=>startRun('click');$('#prev-stage').onclick=()=>setStage(STAGES.indexOf(stage)-1);$('#next-stage').onclick=()=>setStage(STAGES.indexOf(stage)+1);$('#open-store').onclick=()=>openPanel('store');$('#open-boosts').onclick=()=>openPanel('boosts');$('#weekly-banner').onclick=()=>{ranksTab=online.configured()?'week':'mine';openPanel('ranks')};$('#account').onclick=()=>{if(online.user)openPanel('profile');else online.signIn().catch(()=>{})};$('#open-profile').onclick=()=>openPanel('profile');$('#open-clan').onclick=()=>{clanForm=null;openPanel('clan')};$('#pc-close').onclick=()=>{$('#profile-card').hidden=true};$('#panel-close').onclick=()=>{$('#panel').hidden=true;panelKind=null;previews=[];refreshMeta()};
{let sx=null;const show=$('#stage-show');show.addEventListener('pointerdown',e=>{sx=e.clientX});show.addEventListener('pointerup',e=>{if(sx!==null&&Math.abs(e.clientX-sx)>35)setStage(STAGES.indexOf(stage)+(e.clientX<sx?1:-1));sx=null})}
$$('.sound-toggle').forEach(b=>b.onclick=toggleSound);$$('.fs-toggle').forEach(b=>b.onclick=toggleFullscreen);$('#boost').onclick=activateEngine;$('#fatality').onclick=startFatality;$('#revive').onclick=revive;

function launch(quiet){if(state!=='ready')return;
 state='flying';$('#hint').hidden=true;gameSound.effect('launch');sayVoice('launch',{force:true,delay:.05});
 const r=rope(),cutY=(r.a.y+r.b.y)/2;ropeCut={age:0,length:r.b.y-cutY};
 burst(W/2,cutY,14,{type:'star',colors:['#fff','#ffd23f'],speed:[80,240],size:[4,7],life:[.3,.6]});
 rings.push({x:W/2,y:cutY,max:60,life:0,dur:.4,color:'#fff',width:5});
 burst(W/2,balloonY()+34,10,{type:'puff',colors:['#fff'],speed:[40,130],size:[8,14],life:[.5,.9],drag:3});
 squash=-.25;squashV=0;shake=7;mood='joy';moodTimer=1;if(!quiet)announce('GO!','','go')}
function balloonY(){return H*(.68-Math.min(alt/300,1)*.09)}
function rope(){return {a:{x:W*.5,y:balloonY()+35},b:{x:W*.5,y:H-47}}}
function cross(a,b,c){return (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)}
function intersects(a,b,c,d){return cross(a,b,c)*cross(a,b,d)<=0&&cross(c,d,a)*cross(c,d,b)<=0&&Math.max(a.x,b.x)>=Math.min(c.x,d.x)&&Math.min(a.x,b.x)<=Math.max(c.x,d.x)&&Math.max(a.y,b.y)>=Math.min(c.y,d.y)&&Math.min(a.y,b.y)<=Math.max(c.y,d.y)}
function point(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left-OX,y:e.clientY-r.top}}
canvas.addEventListener('pointerdown',e=>{canvas.focus();canvas.setPointerCapture(e.pointerId);pointer=point(e);if(state==='flying')target=pointer.x/W});
canvas.addEventListener('pointermove',e=>{if(!pointer)return;const p=point(e);if(state==='ready'||state==='menu'){const r=rope();if(intersects(pointer,p,r.a,r.b)&&Math.hypot(p.x-pointer.x,p.y-pointer.y)>2){if(state==='menu')startRun('swipe');else launch()}}else if(state==='flying')target=p.x/W;pointer=p});
// Full screen and audio need a user activation, which a finished tap or swipe (pointerup) provides.
function release(){pointer=null;target=null}canvas.addEventListener('pointerup',()=>{release();if(wantFullscreen){wantFullscreen=false;enterFullscreen()}ensureSound()});canvas.addEventListener('pointercancel',release);
const GAME_KEYS=['ArrowLeft','ArrowRight','ArrowUp',' ','a','d','w','b','f','A','D','W','B','F','p','P','Escape','Shift','Enter'];
window.addEventListener('keydown',e=>{if(!GAME_KEYS.includes(e.key))return;if(!$('#profile-card').hidden){if(e.key==='Escape')$('#pc-close').click();return}if(!$('#panel').hidden){if(e.key==='Escape')$('#panel-close').click();return}e.preventDefault();const k=e.key.toLowerCase();keys.add(k);
 if(state==='menu'&&(k==='arrowleft'||k==='a'))setStage(STAGES.indexOf(stage)-1);if(state==='menu'&&(k==='arrowright'||k==='d'))setStage(STAGES.indexOf(stage)+1);
 if((k==='f'||k==='enter'||k===' ')&&boss&&boss.phase==='tired')startFatality();
 if(e.key===' '){if(state==='menu')startRun('key');else if(state==='ready')launch();else if(state==='dead'&&!$('#results').hidden)reset('ready')}
 if(['arrowup','w','b','shift'].includes(k))activateEngine();
 if(k==='p'||k==='escape')pause()});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
function show(label,title,text,primary,secondary){$('#result-label').textContent=label;$('#result-title').textContent=title;$('#result-text').textContent=text;$('#primary').textContent=primary;$('#secondary').textContent=secondary;$('#overlay').hidden=false}
function pause(){if(state!=='paused'&&boss&&boss.freeze)return;if(state==='paused'){state=previousState;$('#overlay').hidden=true;$('#pause').innerHTML=icon('pause');$('#pause').setAttribute('aria-label','Pause game')}else if(state==='ready'||state==='flying'){previousState=state;state='paused';release();keys.clear();$('#pause').innerHTML=icon('play');$('#pause').setAttribute('aria-label','Resume game');show('PAUSED','Breather','The sky can wait a moment.','RESUME ▶','MENU')}gameSound.update(state,wind,flightSpeed(alt),alt,document.hidden)}
$('#pause').onclick=pause;$('#primary').onclick=()=>state==='paused'?pause():reset('ready');$('#secondary').onclick=openMenu;$('#res-again').onclick=()=>reset('ready');$('#res-menu').onclick=openMenu;$('#res-store').onclick=()=>openPanel('store');
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(state==='flying'||state==='ready'))pause()});

// ---- Effects helpers ----
function burst(px,py,n,{type='spark',colors=['#fff'],speed=[60,200],size=[2,5],life=[.4,.8],gravity=0,drag=2,world=false}={}){for(let i=0;i<n;i++){const a=Math.random()*TAU,s=rand(...speed);particles.push({type,x:px,y:py,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:0,max:rand(...life),size:rand(...size),color:pick(colors),gravity,drag,world,rot:rand(0,TAU),vr:rand(-8,8)})}}
function confetti(n){for(let i=0;i<n;i++)particles.push({type:'confetti',x:rand(0,W),y:rand(-90,-10),vx:rand(-40,40),vy:rand(60,170),gravity:80,drag:.4,life:0,max:rand(2,3),size:rand(7,11),color:pick(PARTY),rot:rand(0,TAU),vr:rand(-7,7)})}
function popup(px,py,text,color,size=24){for(const q of popups)if(q.life<.35&&Math.abs(q.y-py)<size*1.1)py=q.y-size*1.15;popups.push({x:clamp(px,80,W-80),y:py,text,color,size,life:0,max:1,vy:-80,rot:rand(-.12,.12)})}
function bump(node){node.classList.remove('bump');void node.offsetWidth;node.classList.add('bump')}
function announce(text,sub,kind,ic,tone){const layer=$('#announce');layer.replaceChildren();const node=el('div',`announce ${kind}`);if(ic&&kind==='stage'){const big=el('span','big-ico');big.innerHTML=icon(ic,tone);node.append(big)}if(sub)node.append(el('small','',sub));const strong=el('strong','',text);if(ic&&kind!=='stage')strong.insertAdjacentHTML('afterbegin',iconHTML(ic,tone));node.append(strong);node.addEventListener('animationend',e=>{if(e.target===node)node.remove()});layer.append(node)}
function countUp(node,value,suffix){const start=performance.now();const tick=now=>{const k=Math.min(1,(now-start)/900);node.textContent=Math.round(value*(1-(1-k)**3)).toLocaleString()+suffix;if(k<1)requestAnimationFrame(tick)};requestAnimationFrame(tick)}
const backOut=k=>1+3.2*(k-1)**3+2.2*(k-1)**2;

function finish(){state='dead';release();mood='dead';boost=null;shield=0;magnet=0;showcase=null;gameSound.effect('pop');sayVoice('die',{force:true,delay:.12});const bx=x*W,by=balloonY(),gores=(SKINS[save.skin]||SKINS.classic).gores;
 for(let i=0;i<16;i++){const a=Math.random()*TAU,s=rand(160,380);particles.push({type:'shard',x:bx+Math.cos(a)*15,y:by-5+Math.sin(a)*15,vx:Math.cos(a)*s,vy:Math.sin(a)*s-80,life:0,max:rand(.9,1.5),size:rand(6,12),color:gores[i%gores.length][1],gravity:600,drag:1.2,rot:rand(0,TAU),vr:rand(-14,14)})}
 burst(bx,by,26,{type:'confetti',colors:PARTY,speed:[120,420],size:[6,10],life:[.7,1.2],gravity:300,drag:1.5});
 burst(bx,by,18,{colors:['#fff','#ffd23f'],speed:[200,500],size:[2,4],life:[.25,.5]});
 burst(bx,by,8,{type:'puff',colors:['#ffffff','#e9e4ff'],speed:[30,110],size:[10,18],life:[.6,1],drag:3});
 rings.push({x:bx,y:by,max:100,life:0,dur:.5,color:'#fff',width:8},{x:bx,y:by,max:160,life:0,dur:.75,color:'#ffd23f',width:5});
 popup(bx,by-40,'POP!','#ff4d5e',54);shake=22;flash=.9;flashColor='#fff';slowTimer=.45;deathTimer=1.1}
// Angry Birds 2 style results: the score counts up, stars pop in as it passes each target, and the
// balloons you own celebrate on a grass island.
let results=null,resFx=[];
const RES_TITLES=['SO CLOSE!','NICE FLIGHT!','GREAT FLIGHT!','SUPERSTAR!'];
function showResult(){bank();const a=Math.floor(alt),record=a>stageBest();if(record)save.best[stage.id]=a;
 const sc=runScore(),stars=starsFor(sc),high=sc>(save.scores[stage.id]||0);if(high)save.scores[stage.id]=sc;save.stars[stage.id]=Math.max(save.stars[stage.id]||0,stars);persist();
 const R=$('#results');R.hidden=false;R.classList.remove('play');void R.offsetWidth;R.classList.add('play');R.dataset.stars=stars;
 $('#res-title').textContent=RES_TITLES[stars];$$('.res-star').forEach(n=>{n.classList.remove('on');n.innerHTML=icon('star','off')});$('#res-score').textContent='0';$('#res-new').hidden=true;$('#res-next').innerHTML=stars<3?`NEXT ${iconHTML('star')} AT ${STAR_SCORES[stars].toLocaleString()}`:`ALL STARS! ${iconHTML('star')}${iconHTML('star')}${iconHTML('star')}`;
 $('#res-stage-icon').innerHTML=icon(stage.icon);$('#res-alt').textContent=a.toLocaleString()+' m';$('#res-medals').innerHTML=MEDALS.filter(m=>a>=m.at).map(m=>iconHTML('medal',m.tone)).join('');$('#res-coins').textContent=Math.floor(coinCount).toLocaleString();
 $('#res-extra').textContent=bossKills?`${bossKills} BOSS${bossKills>1?'ES':''}`:`x${bestMult.toFixed(1)}`;$('#res-extra').previousElementSibling.innerHTML=icon(bossKills?'crown':'coin');
 if(save.lives>0){$('#revive').hidden=false;$('#revive').innerHTML=`${iconHTML('heart')}REVIVE (${save.lives})`}else $('#revive').hidden=true;
 results={score:sc,stars,high,record,age:0,shown:-1,lit:0,done:false,tick:0,confetti:0,rank:undefined};resFx=[];refreshMeta();resultsOnline()}
function resStarPop(k){const n=$(`.res-star[data-k="${k}"]`);n.innerHTML=icon('star');n.classList.add('on');gameSound.effect('star',k);
 const fx=$('#res-fx').getBoundingClientRect(),r=n.getBoundingClientRect(),cx=r.left+r.width/2-fx.left,cy=r.top+r.height/2-fx.top;
 for(let i=0;i<22;i++){const a=rand(0,TAU),sp=rand(120,420);resFx.push({type:i%3?'spark':'star',x:cx,y:cy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,g:i%3?0:500,life:0,max:rand(.4,.9),size:i%3?rand(2,4):rand(6,11),color:pick(['#fff','#ffd23f','#fff6b0']),rot:rand(0,TAU),vr:rand(-8,8)})}
 resFx.push({type:'ring',x:cx,y:cy,life:0,max:.45,size:r.width*.9})}
function updateResults(real){const r=results;r.age+=real;const k=clamp((r.age-.6)/1.9,0,1),v=Math.round(r.score*(1-(1-k)**2));
 if(v!==r.shown){r.shown=v;$('#res-score').textContent=v.toLocaleString();if(k<1&&(r.tick-=real)<=0){r.tick=.07;gameSound.effect('tick')}}
 while(r.lit<r.stars&&v>=STAR_SCORES[r.lit])resStarPop(r.lit++);
 if(k>=1&&!r.done){r.done=true;if(r.high){$('#res-new').hidden=false;gameSound.effect('stamp')}else if(r.stars===3)gameSound.effect('record')}
 const rate=[0,6,14,30][r.stars]*(r.lit>=r.stars?1:.3);r.confetti+=real*rate;const fx=$('#res-fx'),w=fx.clientWidth;while(r.confetti>1){r.confetti--;resFx.push({type:'confetti',x:rand(0,w),y:-20,vx:rand(-30,30),vy:rand(90,190),g:30,life:0,max:rand(3,5),size:rand(7,12),color:pick(PARTY),rot:rand(0,TAU),vr:rand(-6,6)})}
 for(const p of resFx){p.life+=real;if(p.vx!==undefined){p.vy+=(p.g||0)*real;p.x+=p.vx*real;p.y+=p.vy*real;if(p.type!=='confetti'){p.vx*=Math.exp(-2*real);p.vy*=Math.exp(-2*real)}p.rot+=p.vr*real}}resFx=resFx.filter(p=>p.life<p.max)}
function renderResults(){const main=ctx,fx=$('#res-fx'),w=fx.clientWidth,h=fx.clientHeight;if(fx.width!==Math.round(w*dpr)||fx.height!==Math.round(h*dpr)){fx.width=Math.round(w*dpr);fx.height=Math.round(h*dpr)}
 ctx=fx.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 for(const p of resFx){const k=p.life/p.max;ctx.save();ctx.translate(p.x,p.y);
  if(p.type==='ring'){ctx.globalAlpha=1-k;ctx.strokeStyle='#fff';ctx.lineWidth=8*(1-k)+1;ctx.beginPath();ctx.arc(0,0,p.size*(.5+k),0,TAU);ctx.stroke()}
  else if(p.type==='confetti'){ctx.rotate(p.rot);ctx.scale(Math.cos(p.rot*2.5),1);ctx.globalAlpha=k>.85?(1-k)/.15:1;ctx.fillStyle=p.color;ctx.fillRect(-p.size/2,-p.size/4,p.size,p.size/2)}
  else if(p.type==='star'){ctx.rotate(p.rot);ctx.globalAlpha=1-k*k;ctx.fillStyle=p.color;ctx.strokeStyle=INK;ctx.lineWidth=1.5;star(0,0,p.size,p.size*.45,5);ctx.fill();ctx.stroke()}
  else{ctx.globalAlpha=1-k;ctx.strokeStyle=p.color;ctx.lineWidth=p.size;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-p.vx*.04,-p.vy*.04);ctx.stroke()}
  ctx.restore()}
 drawCrew();ctx=main}
// The equipped balloon stands in front and celebrates by how many stars the run earned; the other
// balloons you own stand behind it, each moving in its own style. All are tied to pegs in the grass.
function drawCrew(){const cv=$('#res-crew'),w=cv.clientWidth,h=cv.clientHeight;if(!w)return;if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(h*dpr)){cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr)}
 const c=cv.getContext('2d');ctx=c;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);const now=performance.now()/1000,gy=h-24,n=results?results.stars:1,rx=Math.min(w*.46,190);
 ctx.lineJoin='round';ctx.lineCap='round';ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(w/2,gy+12,rx*1.02,18,0,0,TAU);ctx.fill();
 ctx.fillStyle='#8a5326';ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(w/2,gy+6,rx*.96,15,0,0,Math.PI);ctx.fill();ctx.stroke();
 const g=ctx.createLinearGradient(0,gy-14,0,gy+14);g.addColorStop(0,'#9be85a');g.addColorStop(1,'#3f9b2a');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(w/2,gy,rx,15,0,0,TAU);ctx.fill();ctx.stroke();
 ctx.fillStyle='#c4ff8a';ctx.beginPath();ctx.ellipse(w/2-rx*.25,gy-6,rx*.45,4,0,0,TAU);ctx.fill();
 for(let i=0;i<7;i++){const fx=w/2+(hash(i*4.1)-.5)*rx*1.7,fy=gy+(hash(i*2.7)-.5)*14;if(i%2){ctx.fillStyle='#fff';for(let k=0;k<5;k++){const a=k*TAU/5;ctx.beginPath();ctx.arc(fx+Math.cos(a)*3,fy+Math.sin(a)*2,2,0,TAU);ctx.fill()}ctx.fillStyle='#ffd23f';ctx.beginPath();ctx.arc(fx,fy,1.8,0,TAU);ctx.fill()}else{ctx.strokeStyle='#2f7a1f';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(fx-4,fy+2);ctx.lineTo(fx-2,fy-5);ctx.moveTo(fx,fy+2);ctx.lineTo(fx+1,fy-7);ctx.moveTo(fx+4,fy+2);ctx.lineTo(fx+5,fy-4);ctx.stroke()}}
 const others=save.skins.filter(id=>id!==save.skin&&SKINS[id]).slice(-4),spots=[[-.62,.78],[.62,.78],[-.33,.88],[.33,.88]],crew=others.map((id,k)=>({id,ox:spots[k][0],sc:spots[k][1],main:false}));crew.sort((a,b)=>a.sc-b.sc);crew.push({id:save.skin,ox:0,sc:1.12,main:true});
 for(const m of crew){const skin=SKINS[m.id]||SKINS.classic,fx=SKIN_FX[m.id]||SKIN_FX.classic,s=now+hash(m.ox*9)*5,bx=w/2+m.ox*rx,sc=m.sc*Math.min(1,h/165);let a=fx.anim(s),face=n>=2?'joy':'happy',lift=0;
  if(m.main){const j=Math.abs(Math.sin(now*(n===3?4.2:3)));if(n===3){lift=j*26;a={...a,rot:Math.sin(now*4.2)*.15};face='star'}else if(n===2){lift=j*12}else if(n===1)lift=j*4;else{a={...a,rot:Math.sin(now*1.3)*.06,y:4};face='scared'}}
  lift=Math.min(lift,Math.max(0,(gy-6)/sc-118));const by=gy-62*sc-lift*sc;
  ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(bx+(a.x||0)*sc,by+(a.y||0)*sc+35*sc);ctx.quadraticCurveTo(bx+8*sc,by+50*sc+lift*.4,bx+2,gy-2);ctx.stroke();ctx.fillStyle='#8a5326';ctx.fillRect(bx-1,gy-6,5,9);
  ctx.save();ctx.translate(bx,by);ctx.scale(sc,sc);placeBalloon(a,0);drawBalloonBody(skin,s*.9*(a.turn||1),face,0);ctx.restore()}}
// Spend a life: clear the danger nearby, re-inflate the balloon and carry on from the same altitude.
function revive(){if(state!=='dead'||save.lives<=0)return;save.lives--;persist();revives++;state='flying';$('#overlay').hidden=true;$('#results').hidden=true;$('#panel').hidden=true;panelKind=null;previews=[];deathTimer=0;slowTimer=0;timeScale=1;
 const by=balloonY();if(boss){boss.shots=[];boss.timers=[];boss.cool=Math.max(boss.cool,1.6)}for(const o of obstacles)if(Math.abs(spike(o).y-by)<280)o.broken=true;for(const h of critters){const p=critterPos(h);if(Math.abs(p.y-by)<320)knock(h,p)}
 if(stage.walls)x=.5;vx=0;grow=0;invuln=3;mood='star';moodTimer=1.8;
 announce('REVIVED!',`${save.lives} ${save.lives===1?'LIFE':'LIVES'} LEFT`,'record','heart');gameSound.effect('power');sayVoice('revive',{force:true,delay:.2});burst(x*W,by,18,{type:'heart',colors:['#ff4d5e','#ff7a9a','#ffffff'],speed:[90,260],size:[6,10],life:[.6,1.1],drag:1.5});rings.push({x:x*W,y:by,max:120,life:0,dur:.6,color:'#ff7a9a',width:7});refreshMeta()}

// ---- Course ----
function spike(o){const yy=balloonY()+(alt-o.a)*worldScale;const len=W*(o.length*(stage.reach||1)+(o.moving?Math.sin(t*.8+o.phase)*.065:0))*(o.leaving===undefined?1:Math.max(0,1-o.leaving/.6));return {y:yy,len,side:o.side}}
function drawObstacle(o){if(o.broken)return;const z=spike(o);if(z.y<-80||z.y>H+80)return;ctx.save();ctx.translate(o.side?W:0,z.y);ctx.scale(o.side?-1:1,1);ctx.lineJoin='round';ctx.lineCap='round';stage.ledge(o,z.len,stage.look);ctx.restore()}
// Project a rotating 3D surface onto the 2D canvas, cel-shaded into three tones.
const shape=lat=>({r:29*Math.cos(lat)*(1-.16*Math.sin(lat)),y:33*Math.sin(lat)-5});
const BALLOON=(()=>{const p=new Path2D(),n=40;for(let i=0;i<=n;i++){const v=shape(-Math.PI/2+i/n*Math.PI);i?p.lineTo(v.r,v.y):p.moveTo(v.r,v.y)}for(let i=n;i>=0;i--){const v=shape(-Math.PI/2+i/n*Math.PI);p.lineTo(-v.r,v.y)}p.closePath();return p})();
const engineOn=()=>!!boost;
function drawBalloon(){
 if(state==='dead')return;
 const flying=state==='flying'||(state==='paused'&&previousState==='flying'),waiting=state==='ready'||state==='menu';
 ctx.save();ctx.translate(x*W,balloonY()+Math.sin(t*2)*(waiting?3:1));if(boss&&boss.fatal&&boss.fatal.balloon)ctx.translate(boss.fatal.balloon.dx,boss.fatal.balloon.dy);ctx.rotate(vx*.16+wind*.12);if(grow<1){const g=Math.max(.01,backOut(grow));ctx.scale(g,g)}
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
 if(skin.face==='robot'){const mad=m==='angry';ctx.fillStyle=INK;ctx.beginPath();ctx.roundRect(-17,-16,34,15,5);ctx.fill();if(mad){ctx.strokeStyle=INK;ctx.lineWidth=4;for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(s*17,-21);ctx.lineTo(s*4,-16);ctx.stroke()}}ctx.fillStyle=scared||mad?'#ff5a6a':'#5ff0ff';for(const s of [-1,1]){ctx.beginPath();ctx.roundRect(s*8-4+lx*.5,-12+(1-open)*4,8,Math.max(1.5,8*open),2);ctx.fill()}ctx.lineWidth=2.4;ctx.beginPath();if(m==='joy')ctx.arc(0,1,6,.15*Math.PI,.85*Math.PI);else if(scared){ctx.moveTo(-6,6);ctx.lineTo(-3,4);ctx.lineTo(0,6);ctx.lineTo(3,4);ctx.lineTo(6,6)}else{ctx.moveTo(-5,5);ctx.lineTo(5,5)}ctx.stroke();return}
 if(skin.face==='ninja'){ctx.fillStyle=INK;ctx.beginPath();ctx.roundRect(-25,-17,50,16,7);ctx.fill()}
 if(skin.face==='monster'){ctx.fillStyle='#fff';ctx.lineWidth=2.2;ctx.beginPath();ctx.ellipse(lx*.4,-9,10,(scared?12:10)*open,0,0,TAU);ctx.fill();ctx.stroke();if(open>.5){ctx.fillStyle='#7a1030';ctx.beginPath();ctx.arc(lx,-8+ly,4.5,0,TAU);ctx.fill();ctx.fillStyle=INK;ctx.beginPath();ctx.arc(lx,-8+ly,2.4,0,TAU);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(lx+1.5,-10+ly,1.3,0,TAU);ctx.fill()}}
 else for(const s of [-1,1]){const big=skin.face==='goofy'&&s<0?1.3:1,ew=(skin.face==='ninja'?6.5:scared?7:6)*big,eh=(skin.face==='ninja'?4.5:scared?9:7.5)*open*big;ctx.fillStyle='#fff';ctx.lineWidth=2.2;ctx.beginPath();ctx.ellipse(s*9+lx*.4,-8,ew,eh,0,0,TAU);ctx.fill();ctx.stroke();
  if(open>.5){ctx.fillStyle=INK;ctx.beginPath();ctx.ellipse(s*9+lx,-7+ly,(scared?2.6:3.2)*big,Math.min(eh*.6,(scared?3.4:4.2)*big),0,0,TAU);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(s*9+lx+1.2,-9+ly,1.2,0,TAU);ctx.fill()}
  if(m==='scared'){ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(s*4,-19);ctx.lineTo(s*13,-21);ctx.stroke()}}
 if(m==='angry'){ctx.strokeStyle=INK;ctx.lineWidth=4.5;ctx.lineCap='round';if(skin.face==='monster'){ctx.beginPath();ctx.moveTo(-13,-24);ctx.lineTo(0,-17);ctx.lineTo(13,-24);ctx.stroke()}else for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(s*17,-20);ctx.lineTo(s*3,-14);ctx.stroke()}
  ctx.fillStyle='#fff';ctx.lineWidth=2.2;ctx.beginPath();ctx.roundRect(-8,2,16,8,3.5);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-8,6);ctx.lineTo(8,6);ctx.moveTo(-3,2);ctx.lineTo(-3,10);ctx.moveTo(3,2);ctx.lineTo(3,10);ctx.stroke();return}
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
function generateCourse(){if(boss)return;const horizon=alt+H/worldScale+flightSpeed(alt)*2.5;
 while(nextObstacle<horizon){const i=spawnIndex++,a=nextObstacle,o={a,side:i%2,length:.25+(Math.sin(i*4.7)+1)*.105,moving:i>5&&i%4===0,phase:i*1.8,root:i%3===0};obstacles.push(o);
  // The safe path runs through the middle of the open space beside each ledge.
  const reach=o.length*(stage.reach||1)+(o.moving?.065:0)+.03;let c=o.side?(1-reach)/2:(1+reach)/2;if(stage.walls)c=clamp(c,caveWall(a,0)+.12,1-caveWall(a,1)-.12);
  layCoins(prevLedge,{a,c});prevLedge={a,c};
  const gap=Math.max(300,flightSpeed(a)*1.65);nextObstacle+=gap+(i>=3?spawnCritters(i,a,i%2,gap):0)}
 const floor=alt-H/worldScale-100;obstacles=obstacles.filter(o=>o.a>floor);coins=coins.filter(c=>!c.collected&&c.a>floor)}
// Lay coins along the path from one ledge to the next: rows of 10, then a short break that sometimes
// holds an energy cell or a power-up.
function layCoins(p0,p1){while(coinCursor<p1.a){const k=clamp((coinCursor-p0.a)/(p1.a-p0.a),0,1),e=k*k*(3-2*k);let cx=p0.c+(p1.c-p0.c)*e;if(stage.walls)cx=clamp(cx,caveWall(coinCursor,0)+.1,1-caveWall(coinCursor,1)-.1);
  if(rowCount<ROW_SIZE){if(rowCount===0){rowId++;rows.set(rowId,{total:0,got:0,closed:false,broken:false})}const r=rows.get(rowId);coins.push({a:coinCursor,x:cx,kind:'coin',row:rowId});r.total++;rowCount++;coinCursor+=COIN_STEP;if(rowCount===ROW_SIZE)r.closed=true}
  else{rowCount=0;rowBreaks++;const kind=rowBreaks%8===5?weightedPick(PICKUPS):rowBreaks%2===0?'energy':null;if(kind)coins.push({a:coinCursor+60,x:cx,kind});coinCursor+=COIN_BREAK}}}
// Coin rush: while the engine boost or turbo fires, a wavy river of coins pours in ahead of the balloon
// (two lanes for the engine boost) and the balloon pulls nearby coins in like a magnet.
function coinRush(){if(!boost||boss){rushCursor=0;return}const top=alt+H/worldScale+40;if(rushCursor<alt){rushCursor=alt+H/worldScale*.55;rushCount=0;popup(x*W,balloonY()-130,'COIN RUSH!','#ffd23f',34)}
 while(rushCursor<top){rushCursor+=RUSH_STEP;const wave=.5+Math.sin(rushCursor/240)*.28;coins.push({a:rushCursor,x:wave,kind:'coin',rush:true});if(boost.kind==='engine')coins.push({a:rushCursor+RUSH_STEP/2,x:clamp(wave+(Math.sin(rushCursor/90)>0?.16:-.16),.1,.9),kind:'coin',rush:true})}}
function closeCoinRow(){const r=rows.get(rowId);if(r&&!r.closed){r.closed=true;if(r.total&&r.got===r.total&&!r.broken)rowComplete()}rowCount=0}
function rowComplete(){rowStreak++;bonus+=PTS.row;if(rowStreak%3===0){coinMult=Math.round((1+.1*rowStreak/3)*10)/10;bestMult=Math.max(bestMult,coinMult);announce(`x${coinMult.toFixed(1)} COINS`,'3 PERFECT ROWS!','record','coin');gameSound.effect('charged');confetti(18);bump($('#mult'))}else{popup(x*W,balloonY()-84,`PERFECT ROW ${rowStreak%3}/3 +${PTS.row}`,'#ffd23f',24);gameSound.effect('milestone')}rings.push({x:x*W,y:balloonY(),max:80,life:0,dur:.45,color:'#ffd23f',width:6})}
function missRow(id){const r=rows.get(id);if(!r||r.broken)return;r.broken=true;if(rowStreak>0||coinMult>1)popup(x*W,balloonY()-84,coinMult>1?'MULTIPLIER LOST!':'ROW MISSED','#ff7a86',22);rowStreak=0;coinMult=1}
// Creatures: bird flocks (sky), swinging monkeys (jungle, cave), bats (cave) and patrol drones (factory).
// Each one gets the gap above ledge a to itself, widened by the returned extra distance. Monkeys hang
// above that ledge, on its side, where the balloon never needs to be; flyers cross mid-gap.
function spawnCritters(i,a,side,gap){const r=Math.random(),add=o=>critters.push({kx:0,ky:0,kvx:0,kvy:0,spin:0,knocked:false,dormant:false,phase:rand(0,TAU),vx:0,...o});
 const flock=(kind,count,speed,size,extra)=>{const from=Math.random()<.5?0:1,mid=a+(gap+extra)/2;for(let j=0;j<count;j++){const row=Math.ceil(j/2),sgn=j%2?1:-1;add({kind,a:mid+(j?sgn*row*18:0),ox:row*.09,side:from,vx:(from?-1:1)*speed,r:size,dormant:true,lead:j===0})}return extra};
 const monkey=()=>{add({kind:'monkey',a:a+125,x:side?.82:.18,r:15});return 140};
 if(stage.critters==='birds'&&i%6===4)return flock('bird',3,.16,10,300);
 if(stage.critters==='monkeys'&&r<.3)return monkey();
 if(stage.critters==='cave'){if(r<.15)return monkey();if(r<.32)return flock('bat',3,.16,10,280)}
 if(stage.critters==='drones'&&r<.28){add({kind:'drone',a:a+(gap+220)/2,x:rand(.3,.7),vx:(Math.random()<.5?-1:1)*.1,r:16});return 220}
 return 0}
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
 if(kind==='double'){ctx.font=`${Math.round(s*1.5)}px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.lineWidth=s*.42;ctx.strokeText('x2',0,s*.1);ctx.fillStyle='#fff6b0';ctx.fillText('x2',0,s*.1);return}
 if(kind==='magnet'){const r=s*.55,path=()=>{ctx.beginPath();ctx.moveTo(r,-s*.75);ctx.lineTo(r,0);ctx.arc(0,0,r,0,Math.PI);ctx.lineTo(-r,-s*.75)};ctx.lineCap='butt';path();ctx.lineWidth=s*.5+5;ctx.stroke();path();ctx.lineWidth=s*.5;ctx.strokeStyle='#fff';ctx.stroke();ctx.strokeStyle='#ff4d5e';for(const sx of [-r,r]){ctx.beginPath();ctx.moveTo(sx,-s*.75);ctx.lineTo(sx,-s*.42);ctx.stroke()}return}
 if(kind==='nitro'){ctx.moveTo(0,-s);ctx.bezierCurveTo(s*.9,-s*.2,s*.75,s*.9,0,s*.9);ctx.bezierCurveTo(-s*.75,s*.9,-s*.9,-s*.2,0,-s);ctx.fillStyle='#ffd23f';ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(0,-s*.2);ctx.bezierCurveTo(s*.4,s*.2,s*.35,s*.7,0,s*.7);ctx.bezierCurveTo(-s*.35,s*.7,-s*.4,s*.2,0,-s*.2);ctx.fillStyle='#fff';ctx.fill();return}
 if(kind==='shield'){ctx.moveTo(0,-s);ctx.lineTo(s*.8,-s*.65);ctx.lineTo(s*.7,s*.2);ctx.quadraticCurveTo(s*.5,s*.75,0,s);ctx.quadraticCurveTo(-s*.5,s*.75,-s*.7,s*.2);ctx.lineTo(-s*.8,-s*.65);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#44d9ff';ctx.beginPath();ctx.moveTo(0,-s*.65);ctx.lineTo(s*.5,-s*.42);ctx.lineTo(s*.42,s*.15);ctx.quadraticCurveTo(s*.3,s*.5,0,s*.68);ctx.closePath();ctx.fill();return}
 ctx.moveTo(s*.15,-s);ctx.lineTo(-s*.55,s*.12);ctx.lineTo(-s*.02,s*.12);ctx.lineTo(-s*.18,s);ctx.lineTo(s*.58,-s*.18);ctx.lineTo(s*.04,-s*.18);ctx.closePath();ctx.fillStyle='#fff6b0';ctx.fill();ctx.stroke()}
function drawPickups(){for(const item of coins){if(item.collected)continue;const yy=coinY(item),cx=item.x*W;if(yy<-50||yy>H+50)continue;const bob=Math.sin(t*3+item.a)*3;
 if(item.kind==='coin')drawCoin(cx,yy+bob,14,t*2.5+item.a);
 else if(item.kind==='energy')drawPickup('energy',cx,yy+bob,12);
 else{drawPickup(item.kind,cx,yy+bob,19*(1+.07*Math.sin(t*6)));const a=t*3;ctx.fillStyle='#fff';star(cx+Math.cos(a)*30,yy+bob+Math.sin(a)*30,5,2,4);ctx.fill()}}}
function collectPickups(dt){for(const item of coins){if(item.collected)continue;let cx=item.x*W,cy=coinY(item);
 if(item.row&&cy>balloonY()+46){item.collected=true;missRow(item.row);continue}
 if((magnet>0||(engineOn()&&item.rush))&&(item.kind==='coin'||item.kind==='energy')){const dx=x*W-cx,dy=balloonY()-cy;if(Math.hypot(dx,dy)<220){const k=Math.min(1,dt*6);item.x+=dx/W*k;item.a-=dy/worldScale*k;cx=item.x*W;cy=coinY(item)}}
 const dx=cx-x*W,dy=cy-balloonY();if((dx/43)**2+(dy/48)**2>=1)continue;item.collected=true;
 if(item.kind==='coin'){const r=rows.get(item.row),worth=coinMult*(doubler>0?2:1);coinCount+=worth;bonus+=PTS.coin*worth;combo=comboTimer>0?combo+1:1;comboTimer=2.6;bestCombo=Math.max(bestCombo,combo);gameSound.effect('coin',r?r.got+1:item.rush?1+(rushCount++%12):1);
  burst(cx,cy,12,{colors:['#ffd23f','#fff3a0','#fff'],speed:[80,240],size:[2,4],life:[.3,.6],world:true});burst(cx,cy,4,{type:'star',colors:['#fff6b0'],speed:[40,120],size:[5,8],life:[.5,.8],world:true});
  rings.push({x:cx,y:cy,max:40,life:0,dur:.35,color:'#ffe680',width:4});if(!item.rush||rushCount%8===0)popup(cx,cy-24,item.rush?`COIN RUSH x${rushCount}`:worth>1?`+${+worth.toFixed(1)}`:'+1',worth>1?'#ff9a3c':'#ffd23f',22);
  flyers.push({x:cx,y:cy,age:0,value:worth});squashV+=3;if(moodTimer<=0||mood==='happy'){mood='joy';moodTimer=.6}
  if(r){r.got++;if(r.closed&&!r.broken&&r.got===r.total)rowComplete()}}
 else if(item.kind==='energy'){const was=energy;bonus+=PTS.energy;if(was<4)announcer('energy');energy=Math.min(5,energy+1);gameSound.effect('energy');burst(cx,cy,10,{type:'star',colors:['#ffd23f','#fff'],speed:[60,180],size:[3,6],life:[.3,.6],world:true});popup(cx,cy-22,energy===was?'FULL!':`ENERGY ${energy}/5`,'#ffd23f',22);if(energy===5&&was<5)chargedUp()}
 else if(item.kind==='nitro'){bonus+=PTS.power;startTurbo()}
 else{const P=POWERS[item.kind];bonus+=PTS.power;announcer(item.kind);applyPower(item.kind);popup(x*W,balloonY()-70,`${P.name}!`,P.color,28);squashV+=4;mood='joy';moodTimer=.8}}}
function chargedUp(){gameSound.effect('charged');announcer('ready');announce('BOOST READY!','TAP BOOST · B','record','bolt');bump($('#boost'))}

// ---- Power-ups ----
const smashing=()=>engineOn()||invuln>0;
// The engine boost is the one power with a cinematic intro: the action freezes and the balloon celebrates.
// Turbo pickup: a quick mini intro in slow motion (no full freeze), then the rocket fires.
function startTurbo(){announcer('turbo');showcase={kind:'nitro',age:0,dur:.7,mini:true};invuln=Math.max(invuln,1);mood='cool';moodTimer=1.6;popup(x*W,balloonY()-78,'TURBO!','#ff8a2a',40);gameSound.effect('boost');squash=.25;squashV=0;burst(x*W,balloonY(),16,{type:'star',colors:['#ff8a2a','#ffd23f','#fff'],speed:[120,300],size:[4,7],life:[.4,.7],drag:1.5})}
function activateEngine(){if(state!=='flying'||showcase||energy<5)return;energy=0;announcer('engine');showcase={kind:'energy',age:0,dur:1.15};mood='cool';moodTimer=2;announce('ENGINE BOOST','FULL POWER!','power','bolt');gameSound.effect('power');
 burst(x*W,balloonY(),26,{type:'star',colors:['#ffd23f','#fff','#ff8a2a'],speed:[80,260],size:[4,8],life:[.6,1.1],drag:1.5});confetti(24);squash=.3;squashV=0}
function applyPower(kind){const P=POWERS[kind],bx=x*W,by=balloonY();powerCount++;
 if(kind==='magnet'){magnet=8;gameSound.effect('boost')}
 if(kind==='nitro'){boost={kind:'nitro',time:4,dur:4,mult:1.8};gameSound.effect('nitro')}
 if(kind==='shield'){shield=20;gameSound.effect('shield')}
 if(kind==='double'){doubler=DOUBLE_TIME;gameSound.effect('charged');bump($('#coin-pill'))}
 if(kind==='energy'){boost={kind:'engine',time:3.5,dur:3.5,mult:1.75};gameSound.effect('nitro')}
 burst(bx,by,24,{colors:[P.color,'#fff'],speed:[150,420],size:[2,5],life:[.3,.6]});rings.push({x:bx,y:by,max:110,life:0,dur:.5,color:P.color,width:7});shake=Math.max(shake,kind==='energy'?12:6);flash=kind==='energy'?.3:.12;flashColor=P.color;squash=-.2}
function breakShield(){shield=0;invuln=1.2;gameSound.effect('shieldbreak');sayVoice('oof',{force:true});const bx=x*W,by=balloonY();burst(bx,by,22,{type:'shard',colors:['#bff4ff','#44d9ff','#ffffff'],speed:[150,330],size:[5,9],life:[.5,.9],gravity:300});rings.push({x:bx,y:by,max:90,life:0,dur:.45,color:'#bff4ff',width:6});popup(bx,by-60,'SHIELD SAVED YOU!','#44d9ff',24);shake=Math.max(shake,12)}
function smashFx(px,py,colors,text){smashes++;bonus+=PTS.smash;gameSound.effect('smash');burst(px,py,14,{type:'shard',colors,speed:[120,320],size:[5,10],life:[.6,1],gravity:500,world:true});burst(px,py,10,{colors:['#fff','#ffd23f'],speed:[150,380],life:[.2,.45]});rings.push({x:px,y:py,max:60,life:0,dur:.35,color:'#fff',width:5});popup(px,py-30,text,'#ff8a2a',26);shake=Math.max(shake,9)}
function breakLedge(o,z){o.broken=true;sayVoice('hit');const reach=Math.min(z.len,x*W+40),px=o.side?W-reach*.6:reach*.6;smashFx(px,z.y,[stage.look.body,stage.look.top,stage.look.dark],'SMASH!')}
function bonkCritter(h){const p=critterPos(h);knock(h,p);critterVoice(h.kind);sayVoice('hit',{delay:.1});coinCount++;flyers.push({x:p.x,y:p.y,age:0});if(h.kind==='drone')smashFx(p.x,p.y,['#c4cee0','#5f6b85','#ffd23f'],'SMASH +1');else{bonus+=PTS.smash;gameSound.effect('boop');burst(p.x,p.y,10,{type:'star',colors:['#fff','#ffd23f'],speed:[80,220],size:[4,7],life:[.3,.6]});popup(p.x,p.y-30,'BOOP +1','#ffd23f',24);shake=Math.max(shake,5)}}

const gapTo=(o,z)=>o.side?(W-z.len-8)-(x*W+28):(x*W-28)-(z.len+8);
function hitsObstacle(z){const left=z.side?W-z.len-8:0,right=z.side?W:z.len+8;const tilt=vx*.16+wind*.12;const cx=x*W+Math.sin(tilt)*5,cy=balloonY()-Math.cos(tilt)*5;const nx=Math.max(left,Math.min(cx,right)),ny=Math.max(z.y-26,Math.min(cy,z.y+26));return ((cx-nx)/28)**2+((cy-ny)/32)**2<1}
// Cave walls: sample the wall profile at three heights along the balloon.
function wallHit(){const bx=x*W;for(const [dy,rx] of [[-26,18],[-5,27],[18,20]]){const a=alt-dy/worldScale,left=caveWall(a,0)*W,right=W-caveWall(a,1)*W;if(bx-rx<left)return {side:-1,limit:(left+rx+3)/W};if(bx+rx>right)return {side:1,limit:(right-rx-3)/W}}return null}
// Reward skimming past a spike tip without touching it.
function checkNearMisses(){for(const o of obstacles){if(o.passed||o.a>alt)continue;o.passed=true;if(o.broken||smashing())continue;const z=spike(o);if(gapTo(o,z)<30){nearMisses++;bonus+=PTS.close;popup(x*W,balloonY()-60,`CLOSE CALL! +${PTS.close}`,'#44d9ff',26);shake=Math.max(shake,5);gameSound.effect('close');burst(o.side?W-z.len-8:z.len+8,z.y,10,{colors:['#fff','#44d9ff'],speed:[100,260],life:[.2,.5],world:true});mood='wow';moodTimer=.7}}}
function measureDanger(){let d=0;const by=balloonY();for(const o of obstacles){if(o.broken)continue;const z=spike(o),dy=by-z.y;if(dy<-40||dy>110)continue;d=Math.max(d,Math.max(0,1-gapTo(o,z)/60)*(1-Math.abs(dy)/110))}
 for(const h of critters){if(h.dormant||h.knocked)continue;const p=critterPos(h);d=Math.max(d,clamp(1-(Math.hypot(p.x-x*W,p.y-by)-h.r-30)/90,0,1))}
 if(stage.walls){const l=caveWall(alt,0)*W,r=W-caveWall(alt,1)*W;d=Math.max(d,clamp(1-(Math.min(x*W-l,r-x*W)-28)/40,0,1))}return Math.min(1,d)}
// Passing a star target mid-flight sends a star from the balloon into the HUD star meter.
function checkStars(){if(starsHit>=STAR_SCORES.length||runScore()<STAR_SCORES[starsHit])return;const k=starsHit++;sayVoice('star');starFlyers.push({x:x*W,y:balloonY()-20,age:0,k});popup(x*W,balloonY()-96,`${k+1} STAR${k?'S':''}!`,'#ffd23f',32);gameSound.effect('star',k);rings.push({x:x*W,y:balloonY(),max:90,life:0,dur:.5,color:'#ffd23f',width:6})}
function checkProgress(){if(boss)return;
 if(medalsHit<MEDALS.length&&alt>=MEDALS[medalsHit].at){const m=MEDALS[medalsHit++];if(stageBest()<m.at){announce(`${m.name} MEDAL`,'NEW MEDAL!','record','medal',m.tone);gameSound.effect('record');confetti(30);nextMilestone=Math.max(nextMilestone,Math.floor(alt/1000)*1000+1000);return}}
 if(stage.id==='space')for(const ev of spaceEvents())if(!eventsSeen.has(ev.key)){eventsSeen.add(ev.key);announce(ev.e.label,'LOOK!','milestone');gameSound.effect('zone');return}
 if(!passedBest&&stageBest()>0&&alt>stageBest()){passedBest=true;announce('NEW BEST!','KEEP GOING','record','trophy');gameSound.effect('record');confetti(24);return}
 if(alt>=nextMilestone){announce(`${nextMilestone.toLocaleString()} m`,'ALTITUDE','milestone');gameSound.effect('milestone');nextMilestone+=1000;bump($('.hud-alt'))}}
function drawRope(){const tied=state==='ready'||state==='menu'||(state==='paused'&&previousState==='ready');ctx.lineCap='round';
 if(tied){const r=rope(),sway=Math.sin(t*2)*4,path=()=>{ctx.beginPath();ctx.moveTo(r.a.x,r.a.y);ctx.quadraticCurveTo(r.a.x+7+sway,r.a.y+35,r.b.x,r.b.y)};
  path();ctx.strokeStyle=INK;ctx.lineWidth=7;ctx.stroke();ctx.strokeStyle='#e0b37a';ctx.lineWidth=3.5;ctx.stroke();ctx.setLineDash([2,6]);ctx.strokeStyle='#8a5f33';ctx.stroke();ctx.setLineDash([]);
  if(state==='ready'||state==='menu'){const my=(r.a.y+r.b.y)/2;ctx.setLineDash([7,8]);ctx.lineDashOffset=-t*40;ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(W*.28,my);ctx.lineTo(W*.72,my);ctx.stroke();ctx.setLineDash([]);ctx.lineDashOffset=0;
   const sx=W*(.5+Math.sin(t*2.6)*.2),pulse=(t*1.5)%1;ctx.strokeStyle=`rgba(255,255,255,${1-pulse})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(sx,my,10+pulse*18,0,TAU);ctx.stroke();ctx.fillStyle='#fff';ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.beginPath();ctx.arc(sx,my,9,0,TAU);ctx.fill();ctx.stroke()}}
 if(ropeCut&&ropeCut.age<.8){const bx=W/2,by=H-47+alt*worldScale,k=ropeCut.age/.8,len=ropeCut.length*(1-k*.85),swing=Math.sin(ropeCut.age*14)*(1-k)*26,path=()=>{ctx.beginPath();ctx.moveTo(bx,by);ctx.quadraticCurveTo(bx+swing,by-len*.6,bx+swing*1.6+k*20,by-len+k*len*.4)};
  ctx.globalAlpha=1-k*k;path();ctx.strokeStyle=INK;ctx.lineWidth=7;ctx.stroke();ctx.strokeStyle='#e0b37a';ctx.lineWidth=3.5;ctx.stroke();ctx.globalAlpha=1}}
function drawTicks(){ctx.strokeStyle='rgba(255,255,255,.4)';ctx.lineWidth=2;for(let m=Math.floor(alt/250)*250;m<alt+1200;m+=250){const yy=balloonY()+(alt-m)*worldScale;if(yy>30&&yy<H-35){ctx.beginPath();ctx.moveTo(W-16,yy);ctx.lineTo(W-6,yy);ctx.stroke()}}}
function drawStreaks(){ctx.lineCap='round';for(const s of streaks){const v=Math.hypot(s.vx,s.vy)||1;ctx.strokeStyle=s.color||`rgba(255,255,255,${s.alpha})`;ctx.globalAlpha=s.color?s.alpha:1;ctx.lineWidth=s.width;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.x-s.vx/v*s.len,s.y-s.vy/v*s.len);ctx.stroke()}ctx.globalAlpha=1}
function heart(s){ctx.beginPath();ctx.moveTo(0,s*.35);ctx.bezierCurveTo(-s*1.1,-s*.35,-s*.45,-s*1.05,0,-s*.45);ctx.bezierCurveTo(s*.45,-s*1.05,s*1.1,-s*.35,0,s*.35);ctx.closePath()}
function drawParticles(back){for(const p of particles){if(!!p.back!==back)continue;const k=p.life/p.max;ctx.save();ctx.translate(p.x,p.y);
 if(p.type==='puff'){ctx.globalAlpha=(1-k)*.6;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(0,0,p.size*(1+k*1.4),0,TAU);ctx.fill()}
 else if(p.type==='star'){ctx.globalAlpha=1-k;ctx.rotate(p.rot);ctx.fillStyle=p.color;star(0,0,p.size*(1-k*.5),p.size*.4*(1-k*.5),4);ctx.fill()}
 else if(p.type==='bubble'){ctx.globalAlpha=k>.8?(1-k)/.2:1;ctx.fillStyle='rgba(255,230,245,.3)';ctx.strokeStyle=p.color;ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(0,0,p.size,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-p.size*.35,-p.size*.35,p.size*.28,0,TAU);ctx.fill()}
 else if(p.type==='seed'){ctx.globalAlpha=1-k;ctx.rotate(p.rot);ctx.fillStyle=p.color;ctx.beginPath();ctx.ellipse(0,0,p.size*.45,p.size*.75,0,0,TAU);ctx.fill()}
 else if(p.type==='slime'){ctx.globalAlpha=1-k;ctx.fillStyle=p.color;ctx.strokeStyle=INK;ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(0,0,p.size*.7,p.size*(1+k),0,0,TAU);ctx.fill();ctx.stroke()}
 else if(p.type==='heart'){ctx.globalAlpha=1-k*k;ctx.rotate(p.rot*.2);ctx.fillStyle=p.color;heart(p.size);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1.5;ctx.stroke()}
 else if(p.type==='confetti'){ctx.rotate(p.rot);ctx.scale(Math.cos(p.rot*3),1);ctx.globalAlpha=k>.7?(1-k)/.3:1;ctx.fillStyle=p.color;ctx.fillRect(-p.size/2,-p.size/4,p.size,p.size/2)}
 else if(p.type==='shard'){ctx.rotate(p.rot);ctx.globalAlpha=k>.75?(1-k)/.25:1;ctx.fillStyle=p.color;ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(-p.size,-p.size*.4);ctx.lineTo(p.size*.8,-p.size*.6);ctx.lineTo(p.size*.3,p.size*.6);ctx.closePath();ctx.fill();ctx.stroke()}
 else{ctx.globalAlpha=1-k;ctx.strokeStyle=p.color;ctx.lineWidth=p.size;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-p.vx*.05,-p.vy*.05);ctx.stroke()}
 ctx.restore()}}
function drawRings(){for(const r of rings){const k=r.life/r.dur;ctx.globalAlpha=1-k;ctx.strokeStyle=r.color;ctx.lineWidth=r.width*(1-k)+.5;ctx.beginPath();ctx.arc(r.x,r.y,r.max*(1-(1-k)**3),0,TAU);ctx.stroke()}ctx.globalAlpha=1}
function drawPopups(){ctx.textAlign='center';ctx.lineJoin='round';for(const p of popups){const k=p.life/p.max,scale=k<.18?backOut(k/.18):1;ctx.save();ctx.globalAlpha=k>.7?1-(k-.7)/.3:1;ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.scale(scale,scale);ctx.font=`${p.size}px ${FONT}`;ctx.lineWidth=p.size*.3;ctx.strokeStyle=INK;ctx.strokeText(p.text,0,0);ctx.fillStyle=p.color;ctx.fillText(p.text,0,0);ctx.restore()}}
// Engine boost celebration: the action freezes, rays spin and the balloon zooms in and dances.
function drawShowcase(){const s=showcase,P=POWERS[s.kind],k=s.age/s.dur,a=Math.min(1,s.age/(s.mini?.12:.2))*(k>.82?(1-k)/.18:1)*(s.mini?.6:1),bx=x*W,by=balloonY();
 ctx.save();ctx.globalAlpha=(s.mini?.35:.6)*a;ctx.fillStyle='#120a30';ctx.fillRect(-OX-40,-40,SW+80,H+80);ctx.restore();
 ctx.save();ctx.translate(bx,by);ctx.rotate(s.age*1.6);ctx.globalAlpha=.4*a;ctx.fillStyle=P.color;const R=Math.max(SW,H);for(let i=0;i<16;i++){ctx.rotate(TAU/16);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(R,-R*.09);ctx.lineTo(R,R*.09);ctx.closePath();ctx.fill()}ctx.restore();
 const halo=ctx.createRadialGradient(bx,by,0,bx,by,140);halo.addColorStop(0,`rgba(255,255,255,${.55*a})`);halo.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=halo;ctx.fillRect(bx-140,by-140,280,280);
 const z=1+(s.mini?.6:.75)*a*(s.age<.3?backOut(s.age/.3):1);ctx.save();ctx.translate(bx,by);ctx.rotate(Math.sin(s.age*14)*.14*a);ctx.scale(z,z);ctx.translate(-bx,-by-Math.abs(Math.sin(s.age*9))*6*a);drawBalloon();ctx.restore();
 const pop=s.age<.4?backOut(s.age/.4):1;drawPickup(s.kind,bx+Math.sin(s.age*5)*8,by-100*z+Math.sin(s.age*7)*5,Math.max(.01,26*pop*a))}
// Collected coins fly up into the HUD counter.
function drawFlyers(){if(!flyers.length)return;const c=canvas.getBoundingClientRect(),e=$('#coin-pill .coin-icon').getBoundingClientRect(),tx=e.left+e.width/2-c.left,ty=e.top+e.height/2-c.top;
 for(const f of flyers){if(f.age<0)continue;const k=Math.min(1,f.age/.55),q=k*k*(3-2*k),sx=f.x+OX,cy=ty+60,px=(1-q)**2*sx+2*(1-q)*q*sx+q*q*tx,py=(1-q)**2*f.y+2*(1-q)*q*cy+q*q*ty;drawCoin(px,py,13*(1-.35*q),t*14,false)}}
function drawStarFlyers(){if(!starFlyers.length)return;const c=canvas.getBoundingClientRect();ctx.lineJoin='round';
 for(const f of starFlyers){const e=$$('#star-meter .ico')[f.k].getBoundingClientRect(),tx=e.left+e.width/2-c.left,ty=e.top+e.height/2-c.top,k=Math.min(1,f.age/.8),q=k<.25?0:((k-.25)/.75)**2,pop=k<.25?backOut(k/.25):1,sx=f.x+OX,sy=f.y-40*Math.min(1,k*4),px=sx+(tx-sx)*q,py=sy+(ty-sy)*q-Math.sin(q*Math.PI)*60,r=(26-16*q)*pop;
  ctx.save();ctx.translate(px,py);ctx.rotate(f.age*9);ctx.globalAlpha=.35;ctx.fillStyle='#fff6b0';ctx.beginPath();ctx.arc(0,0,Math.max(0,r*1.5),0,TAU);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle='#ffd23f';ctx.strokeStyle=INK;ctx.lineWidth=3;star(0,0,Math.max(.1,r),Math.max(.05,r*.48),5);ctx.fill();ctx.stroke();ctx.restore()}}
function drawSides(){if(OX<4)return;const look=stage.look;ctx.fillStyle='rgba(12,6,40,.42)';ctx.fillRect(-40,-40,OX+40,H+80);ctx.fillRect(OX+W,-40,OX+40,H+80);
 for(const ex of [OX,OX+W]){ctx.fillStyle=look.body;ctx.fillRect(ex-7,-40,14,H+80);ctx.fillStyle=look.top;ctx.fillRect(ex-7,-40,5,H+80);ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(ex-7,-40);ctx.lineTo(ex-7,H+40);ctx.moveTo(ex+7,-40);ctx.lineTo(ex+7,H+40);ctx.stroke();ctx.fillStyle='rgba(255,255,255,.4)';const off=(alt*worldScale)%48;for(let y=off-48;y<H+48;y+=48){ctx.beginPath();ctx.arc(ex,y,2.5,0,TAU);ctx.fill()}}}
function drawVignette(){const g=ctx.createRadialGradient(SW/2,H/2,Math.min(SW,H)*.35,SW/2,H/2,Math.max(SW,H)*.75);g.addColorStop(0,'rgba(10,5,40,0)');g.addColorStop(1,'rgba(10,5,40,.28)');ctx.fillStyle=g;ctx.fillRect(0,0,SW,H);
 if(danger>.05){const r=ctx.createRadialGradient(SW/2,H/2,Math.min(SW,H)*.3,SW/2,H/2,Math.max(SW,H)*.7);r.addColorStop(0,'rgba(255,40,70,0)');r.addColorStop(1,`rgba(255,40,70,${danger*.4*(.75+.25*Math.sin(t*14))})`);ctx.fillStyle=r;ctx.fillRect(0,0,SW,H)}
 if(engineOn()){const r=ctx.createRadialGradient(SW/2,H/2,Math.min(SW,H)*.35,SW/2,H/2,Math.max(SW,H)*.75);r.addColorStop(0,'rgba(255,140,40,0)');r.addColorStop(1,'rgba(255,140,40,.3)');ctx.fillStyle=r;ctx.fillRect(0,0,SW,H)}}
// Iris wipe in the stage colours that opens from the balloon when a run starts from the menu.
function drawIris(){const k=Math.min(1,transition.age/transition.dur),q=clamp((k-.12)/.7,0,1),ease=q<.5?2*q*q:1-(2-2*q)**2/2,cx=OX+x*W,cy=balloonY(),R=Math.hypot(Math.max(cx,SW-cx),Math.max(cy,H-cy))*1.05*ease+1;if(q>=1)return;ctx.save();ctx.fillStyle=stage.bottom;ctx.beginPath();ctx.rect(0,0,SW,H);ctx.arc(cx,cy,Math.max(1,R),0,TAU,true);ctx.fill('evenodd');ctx.lineWidth=14*(1-k)+2;ctx.strokeStyle='#fff';ctx.beginPath();ctx.arc(cx,cy,Math.max(1,R),0,TAU);ctx.stroke();ctx.lineWidth=6*(1-k)+1;ctx.strokeStyle=stage.top;ctx.beginPath();ctx.arc(cx,cy,Math.max(1,R+10),0,TAU);ctx.stroke();ctx.restore()}
function draw(){ctx.save();const amount=calm?shake*.3:shake;if(amount>.4)ctx.translate(rand(-amount,amount),rand(-amount,amount));
 if(transition){const k=Math.min(1,transition.age/transition.dur),z=1+.35*(1-k)**3,cx=OX+x*W,cy=balloonY();ctx.translate(cx,cy);ctx.scale(z,z);ctx.translate(-cx,-cy)}
 const column=W;W=SW;stage.bg();stage.ground();W=column;drawStreaks();
 ctx.save();ctx.translate(OX,0);
 drawTicks();obstacles.forEach(drawObstacle);drawCritters();drawPickups();if(stage.walls)drawCaveWalls();drawRope();if(stage.dark)caveDark(x*W,balloonY(),engineOn());
 drawBossLayer();drawParticles(true);drawBalloon();drawAuras();drawBossFx();
 ctx.save();ctx.translate(-OX,0);drawLeaves();ctx.restore();drawChevrons();drawCritterWarnings();drawParticles(false);drawRewardCoins();drawRings();if(showcase)drawShowcase();drawPopups();
 ctx.restore();drawSides();ctx.restore();
 drawFlyers();drawStarFlyers();drawVignette();if(transition)drawIris();if(swapFx>0){ctx.globalAlpha=swapFx*.55;ctx.fillStyle=stage.top;ctx.fillRect(0,0,SW,H);ctx.globalAlpha=1}if(flash>0){ctx.globalAlpha=Math.min(1,flash);ctx.fillStyle=flashColor;ctx.fillRect(0,0,SW,H);ctx.globalAlpha=1}}
function update(dt){t+=dt;spin+=dt*(.65+Math.abs(wind)*3+Math.abs(vx));if(state!=='flying')return;
 flightTime+=dt;generateCourse();coinRush();updateWeather(dt);updateCritters(dt);if(boss&&boss.wind)wind+=boss.wind.dir*.32;if(!boss&&flightTime>=nextBossTime)startBoss();
 const direction=(keys.has('arrowright')||keys.has('d')?1:0)-(keys.has('arrowleft')||keys.has('a')?1:0);let desired=direction*.65;if(target!==null)desired=clamp((target-x)*6,-.85,.85);vx+=(desired+wind-vx)*Math.min(1,dt*4);x+=vx*dt;x=clamp(x,(radius+5)/W,1-(radius+5)/W);
 alt+=dt*flightSpeed(alt)*speedMult*bossPace();collectPickups(dt);
 if(stage.walls){const hit=wallHit();if(hit){if(boss){x=hit.limit;vx=-hit.side*.4}else if(smashing()||shield>0){if(shield>0&&!smashing())breakShield();x=hit.limit;vx=-hit.side*.5;burst(x*W+hit.side*28,balloonY(),8,{colors:['#fff','#ffd23f'],speed:[80,220],life:[.2,.4]});shake=Math.max(shake,4)}else{finish();return}}}
 for(const o of obstacles){if(o.broken||o.leaving!==undefined)continue;const z=spike(o);if(!hitsObstacle(z))continue;if(smashing()){breakLedge(o,z);continue}if(shield>0){breakShield();breakLedge(o,z);continue}finish();return}
 for(const h of critters){if(!hitsCritter(h))continue;if(smashing()){bonkCritter(h);continue}if(shield>0){breakShield();bonkCritter(h);continue}finish();return}
 checkNearMisses();checkProgress();checkStars()}
// Effects run once per frame; dt is slowed during slow motion and the boost intro, real is wall-clock time.
function updateEffects(dt,real){shake*=Math.exp(-8*real);flash=Math.max(0,flash-real*2.4);swapFx=Math.max(0,swapFx-real*3);if(transition&&(transition.age+=real)>=transition.dur)transition=null;if(grow<1)grow=Math.min(1,grow+real*2.2);
 if(showcase&&(showcase.age+=real)>=showcase.dur){const kind=showcase.kind;showcase=null;applyPower(kind)}
 updateBoss(dt,real);updateRewardCoins(real);const frozen=!!(boss&&boss.freeze),pdt=showcase||frozen?real:dt;
 squashV+=(-squash*170-squashV*11)*pdt;squash+=squashV*pdt;
 if((nextBlink-=pdt)<=0){blink=.13;nextBlink=rand(2,5)}blink-=pdt;moodTimer-=pdt;
 if(boost&&(boost.time-=dt)<=0)boost=null;if(shield>0&&(shield-=dt)<=0&&state==='flying')popup(x*W,balloonY()-60,'SHIELD OFF','#bff4ff',20);magnet=Math.max(0,magnet-dt);if(doubler>0&&(doubler-=dt)<=0&&state==='flying')popup(x*W,balloonY()-60,'DOUBLE COINS OVER','#ffd23f',20);invuln=Math.max(0,invuln-dt);
 speedMult+=((boost?boost.mult:1)-speedMult)*Math.min(1,dt*3);
 danger=state==='flying'&&!smashing()?danger+(measureDanger()-danger)*Math.min(1,dt*10):danger*Math.exp(-6*pdt);
 if(state!=='dead'&&moodTimer<=0)mood=smashing()||shield>0?'cool':danger>.45?'scared':'happy';
 if(ropeCut)ropeCut.age+=dt;if(comboTimer>0&&(comboTimer-=dt)<=0)combo=0;
 if(state==='dead'&&deathTimer>0&&(deathTimer-=real)<=0)showResult();
 const scroll=state==='flying'&&!showcase&&!frozen?flightSpeed(alt)*speedMult*worldScale*bossPace():0;
 if(state==='flying'&&!showcase){const starry=stage.id==='space'||stage.id==='universe',tilt=vx*.16+wind*.12,fire=engineOn(),every=fire?.018:.04;trailClock+=dt;
  while(trailClock>every){trailClock-=every;const bx=x*W-Math.sin(tilt)*(fire?56:36),by=balloonY()+(fire?56:36);
   if(fire)particles.push({type:'puff',back:true,world:true,x:bx+rand(-4,4),y:by,vx:rand(-20,20),vy:rand(60,140),life:0,max:rand(.35,.6),size:rand(5,9),color:pick(['#ffd23f','#ff8a2a','#ff4d5e','#fff6b0']),gravity:0,drag:1,rot:0,vr:0});
   else{const tr=(SKIN_FX[save.skin]||{}).trail;if(tr)particles.push({type:tr.type,back:true,world:true,x:bx+rand(-4,4),y:by,vx:rand(-16,16),vy:tr.type==='slime'?rand(40,80):rand(10,30),life:0,max:tr.type==='bubble'?1.1:.8,size:tr.type==='spark'?rand(1.5,3):tr.type==='confetti'?rand(5,8):rand(3,6),color:pick(tr.colors),gravity:tr.type==='slime'?120:0,drag:1,rot:rand(0,TAU),vr:rand(-6,6)});
    else particles.push({type:starry?'star':'puff',back:true,world:true,x:bx+rand(-3,3),y:by,vx:rand(-10,10),vy:rand(10,30),life:0,max:starry?.7:.9,size:starry?rand(3,5):rand(4,7),color:starry?pick(['#9fe8ff','#c9a8ff','#fff']):stage.dark?'#c9a8ff':'#fff',gravity:0,drag:1,rot:0,vr:rand(-3,3)})}}
  const speed=flightSpeed(alt)*speedMult;streakClock+=dt*((calm?4:9)+Math.min(22,(speed-130)*.2))*speedMult*bossPace();while(streakClock>1){streakClock--;streaks.push({x:rand(0,SW),y:-60,vx:0,vy:speed*worldScale*rand(2.2,3.4),len:rand(30,80)*speedMult,alpha:rand(.12,.3)*(fire?1.6:1),width:rand(1.5,3),color:fire&&Math.random()<.4?'#ffd23f':null})}
  if(weatherNow&&weatherNow.active&&Math.random()<dt*25)streaks.push({x:weatherNow.dir>0?-60:SW+60,y:rand(0,H),vx:weatherNow.dir*rand(500,800),vy:scroll*.5,len:rand(40,90),alpha:rand(.25,.45),width:rand(2,3.5)});
  if(fire)shake=Math.max(shake,1.5)}
 for(const s of streaks){s.x+=s.vx*dt;s.y+=s.vy*dt}streaks=streaks.filter(s=>s.y<H+100&&s.x>-120&&s.x<SW+120);
 for(const p of particles){p.life+=pdt;const d=Math.max(0,1-p.drag*pdt);p.vx*=d;p.vy*=d;p.vy+=p.gravity*pdt;p.x+=p.vx*pdt;p.y+=p.vy*pdt+(p.world?scroll*dt:0);p.rot+=p.vr*pdt}particles=particles.filter(p=>p.life<p.max);
 for(const r of rings)r.life+=pdt;rings=rings.filter(r=>r.life<r.dur);
 for(const p of popups){p.life+=pdt;p.y+=p.vy*pdt;p.vy*=Math.exp(-3*pdt)}popups=popups.filter(p=>p.life<p.max);
 for(const f of flyers){f.age+=real;if(f.age>=.55){f.done=true;shownCoins+=f.value||1;bump($('#coin-pill'))}}flyers=flyers.filter(f=>!f.done);
 for(const f of starFlyers){f.age+=real;if(f.age>=.8){f.done=true;bump($$('#star-meter .ico')[f.k]);gameSound.effect('milestone')}}starFlyers=starFlyers.filter(f=>!f.done)}
function setText(id,value){if(hudCache[id]!==value){hudCache[id]=value;$(id).textContent=value}}
function setChip(id,frac){const chip=$(id),on=frac>0;if(chip.hidden===on)chip.hidden=!on;if(on)chip.querySelector('i b').style.width=(frac*100).toFixed(1)+'%'}
function updateHud(){setText('#coin-count',String(Math.floor(shownCoins)));setText('#mult-val',`x${coinMult.toFixed(1)}`);$('#mult').classList.toggle('hot',coinMult>1);$$('#mult .row-pips i').forEach((pip,k)=>pip.classList.toggle('on',k<rowStreak%3));setText('#boss-timer',state==='flying'&&!boss?`BOSS ${Math.floor(Math.max(0,nextBossTime-flightTime)/60)}:${String(Math.floor(Math.max(0,nextBossTime-flightTime)%60)).padStart(2,'0')}`:'');setText('#altitude',Math.floor(alt).toLocaleString());{const sc=runScore(),lit=starsHit-starFlyers.length,lo=STAR_SCORES[starsHit-1]||0,hi=STAR_SCORES[starsHit];setText('#score',sc.toLocaleString());if(hudCache.stars!==lit){hudCache.stars=lit;$$('#star-meter .ico').forEach((n,k)=>n.classList.toggle('on',k<lit))}const fill=hi?Math.min(1,(sc-lo)/(hi-lo)):1,fw=(fill*100).toFixed(1)+'%';if(hudCache.starFill!==fw){hudCache.starFill=fw;$('#star-fill').style.width=fw}}setText('#speed',(state==='flying'||state==='paused'&&previousState==='flying'?Math.round(flightSpeed(alt)*speedMult):0)+' m/s');
 shell.classList.toggle('ready',state==='ready'||(state==='paused'&&previousState==='ready'));shell.classList.toggle('in-menu',state==='menu');
 setChip('#chip-boost',boost?boost.time/boost.dur:0);if(boost){const ic=boost.kind==='nitro'?'flame':'bolt';if(hudCache.boostIcon!==ic){hudCache.boostIcon=ic;$('#chip-boost-icon').innerHTML=icon(ic)}$('#chip-boost').style.setProperty('--c',POWERS[boost.kind==='engine'?'energy':'nitro'].color)}
 setChip('#chip-shield',shield/20);setChip('#chip-magnet',magnet/8);setChip('#chip-double',Math.max(0,doubler)/DOUBLE_TIME);$('#coin-pill').classList.toggle('doubled',doubler>0);
 const bp=boss?boss.phase:'',fighting=state!=='menu'&&['enter','fight','tired','fatality'].includes(bp),bar=$('#boss-bar');shell.classList.toggle('boss-fight',!!boss&&bp!=='done');if(bar.hidden===fighting)bar.hidden=!fighting;if(fighting){setText('#boss-name',bp==='tired'||bp==='fatality'?`${boss.def.name} · TIRED!`:boss.def.name);$('#boss-fill').style.width=Math.max(0,boss.stamina)+'%';bar.classList.toggle('tired',bp==='tired')}
 const fat=bp==='tired'&&state==='flying';if($('#fatality').hidden===fat)$('#fatality').hidden=!fat;
 const btn=$('#boost'),visible=(state==='flying'||state==='paused'&&previousState==='flying')&&!['versus','tired','fatality'].includes(bp),key=`${visible}|${energy}|${!!showcase}`;
 if(hudCache.boost!==key){hudCache.boost=key;btn.hidden=!visible;btn.disabled=energy<5||!!showcase;btn.classList.toggle('ready',energy>=5&&!showcase);btn.querySelectorAll('.pips i').forEach((pip,i)=>pip.classList.toggle('on',i<energy))}}
function frame(now){const real=Math.min((now-last)/1000||0,.035);last=now;
 if(state!=='paused'){if(boss&&boss.freeze)timeScale=0;else if(showcase)timeScale=showcase.mini?.3:.04;else if(slowTimer>0){slowTimer-=real;timeScale=slowTimer>0?.25:1}else timeScale=1;
  const dt=real*timeScale;let remaining=dt;while(remaining>0){const step=Math.min(remaining,8/(flightSpeed(alt)*speedMult*worldScale));update(step);remaining-=step}updateEffects(dt,real)}
 gameSound.update(state==='menu'?'ready':state,wind,flightSpeed(alt),alt,document.hidden);draw();updateHud();if(previews.length&&!$('#panel').hidden)renderPreviews();if(typeof renderLiveAvatars==='function')renderLiveAvatars();if(results&&!$('#results').hidden){updateResults(real);renderResults()}if(boss&&boss.phase==='versus')renderVersus();requestAnimationFrame(frame)}
applyIcons();syncSound();reset('menu');resize();requestAnimationFrame(frame);
