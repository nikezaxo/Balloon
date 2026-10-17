'use strict';
// Seasons, ranks and tasks.
// A season is a calendar month (UTC); Season 1 is October 2026. Season points (SP) come from runs (score, stars,
// bosses) and tasks and never go down during a season. They place a player in seven tiers of five levels each
// (I lowest, V highest); the very top, STAR LEGEND V, is only for the season's global top 100.
// Reaching each level pays its reward once a season: coins and gems, and at DIAMOND IV and V and STAR LEGEND IV a season
// avatar or frame that shows the season it was won in (S1, S2...). When the season ends every player also gets the
// end-of-season reward of the tier they finished in; STAR LEGEND V's reward and frame are paid then, to the top 100.
const TIERS=[
 {id:'metal',name:'METAL',step:100,c:['#eef2f8','#9aa6bd','#4a5470']},
 {id:'bronze',name:'BRONZE',step:150,c:['#ffd0a0','#c8783a','#6e3a14']},
 {id:'silver',name:'SILVER',step:200,c:['#ffffff','#c4d0e4','#6a7a98']},
 {id:'gold',name:'GOLD',step:300,c:['#fff3a0','#ffc414','#b87a00']},
 {id:'titanium',name:'TITANIUM',step:400,c:['#d8fbff','#5fb8c8','#1f5a6e']},
 {id:'diamond',name:'DIAMOND',step:500,c:['#ffffff','#7fe0ff','#2a7ad8']},
 {id:'legend',name:'STAR LEGEND',step:600,c:['#fff3a0','#c46aff','#3a1580']}];
const LEGEND_TIER=TIERS[6];
const DIVS=['I','II','III','IV','V'],LEGEND_TOP=100;
const DIVISIONS=(()=>{let min=0;const out=[];TIERS.forEach((tier,ti)=>DIVS.forEach((d,di)=>{out.push({ti,di,tier,name:`${tier.name} ${d}`,min});min+=tier.step}));return out})();
// Star Legend starts after DIAMOND V; its top level also needs a place in the global top 100.
const TOP_DIV=DIVISIONS.length-1,LEGEND_MIN=DIVISIONS[30].min,LEGEND_V_MIN=DIVISIONS[TOP_DIV].min;
// What reaching each level pays, by tier and level (I to V). Only DIAMOND and STAR LEGEND give avatars and frames;
// STAR LEGEND V (after: true) is paid when the season ends, to players who finished in the top 100.
const LEVEL_REWARDS=[
 [{},{coins:60},{coins:80},{coins:100},{coins:150,gems:2}],
 [{coins:200,gems:2},{coins:220},{coins:250},{coins:280},{coins:350,gems:4}],
 [{coins:400,gems:4},{coins:450,gems:1},{coins:500,gems:1},{coins:550,gems:1},{coins:650,gems:6}],
 [{coins:750,gems:6},{coins:800,gems:2},{coins:900,gems:2},{coins:1000,gems:2},{coins:1200,gems:10}],
 [{coins:1400,gems:10},{coins:1500,gems:3},{coins:1700,gems:3},{coins:1900,gems:3},{coins:2200,gems:15}],
 [{coins:2500,gems:15},{coins:2800,gems:5},{coins:3200,gems:5},{coins:3600,gems:5,avatar:'fox'},{coins:4000,gems:8,frame:'sDiamond'}],
 [{coins:5000,gems:25},{coins:6000,gems:10},{coins:7000,gems:10},{coins:8000,gems:15,avatar:'legend'},{coins:12000,gems:60,frame:'sLegend',after:true}]];
// End-of-season rewards by final tier (index 6 is Star Legend): coins and gems, and the season skins of DIAMOND
// (Prism) and STAR LEGEND (Starlight), which stack downwards.
const SEASON_REWARDS=[
 {coins:300,gems:3},
 {coins:600,gems:8},
 {coins:1000,gems:15},
 {coins:1500,gems:25},
 {coins:2500,gems:40},
 {coins:4000,gems:60,skin:'prism'},
 {coins:6000,gems:120,skin:'starlight'}];
function seasonOf(d=new Date()){const n=Math.max(1,(d.getUTCFullYear()-2026)*12+d.getUTCMonth()-8);return {n,id:'S'+n,start:Date.UTC(2026,8+n,1),end:Date.UTC(2026,9+n,1)}}
const prevSeason=()=>{const s=seasonOf();return s.n>1?{n:s.n-1,id:'S'+(s.n-1)}:null};
// A player's level from their points; STAR LEGEND V also needs top (a place in the global top 100), without it the
// climb stops at STAR LEGEND IV.
function tierOf(sp,top=false){let i=0;while(i+1<DIVISIONS.length&&sp>=DIVISIONS[i+1].min)i++;if(i===TOP_DIV&&!top)i--;return {...DIVISIONS[i],idx:i,legend:i>=30,next:DIVISIONS[i+1]||null}}
function seasonLeft(){const ms=Math.max(0,seasonOf().end-Date.now()),d=Math.floor(ms/864e5),h=Math.floor(ms/36e5)%24;return d?`${d}d ${h}h`:`${h}h ${Math.floor(ms/6e4)%60}m`}
function dayLeft(){const n=new Date(),ms=Date.UTC(n.getUTCFullYear(),n.getUTCMonth(),n.getUTCDate()+1)-n,h=Math.floor(ms/36e5),m=Math.floor(ms/6e4)%60;return `${h}h ${m}m`}
const todayId=()=>new Date().toISOString().slice(0,10);

// ---- Tasks ----
const DAILY_TASKS=[
 {stat:'runAlt',max:true,goals:[2500,4000,6000],text:g=>`Fly ${g.toLocaleString()} m in one run`,icon:'balloon',r:{coins:80,sp:30}},
 {stat:'coins',goals:[60,120,200],text:g=>`Collect ${g} coins`,icon:'coin',r:{coins:60,sp:25}},
 {stat:'rows',goals:[3,5,8],text:g=>`Complete ${g} perfect coin rows`,icon:'star',r:{coins:70,sp:30}},
 {stat:'boosts',goals:[1,2,3],text:g=>`Fire the engine boost ${g} time${g>1?'s':''}`,icon:'bolt',r:{coins:80,sp:30}},
 {stat:'smashes',goals:[5,10,20],text:g=>`Smash or bonk ${g} things`,icon:'flame',r:{coins:60,sp:25}},
 {stat:'stars',goals:[1,2,3],text:g=>`Earn ${g} star${g>1?'s':''} (beat 3 bosses in a run for each)`,icon:'star',r:{coins:120,sp:45}},
 {stat:'runs',goals:[3,5,8],text:g=>`Play ${g} runs`,icon:'play',r:{coins:50,sp:20}},
 {stat:'close',goals:[3,6,10],text:g=>`Get ${g} close calls`,icon:'shield',r:{coins:60,sp:25}},
 {stat:'powerups',goals:[2,3,5],text:g=>`Collect ${g} power-ups`,icon:'magnet',r:{coins:60,sp:25}},
 {stat:'bosses',goals:[1,2,3],text:g=>g>1?`Defeat ${g} bosses`:'Defeat a boss',icon:'crown',r:{coins:150,sp:50,gems:2}}];
const DAILY_BONUS={coins:100,sp:50,gems:2};
// Box tasks: on Tuesdays, Thursdays and Saturdays (UTC) one extra, harder task pays a box (a Storm Box on Saturdays).
const BOX_TASKS=[
 {stat:'runAlt',max:true,goal:8000,text:'Fly 8,000 m in one run',icon:'balloon'},
 {stat:'bosses',goal:2,text:'Defeat 2 bosses',icon:'crown'},
 {stat:'coins',goal:250,text:'Collect 250 coins',icon:'coin'},
 {stat:'rows',goal:10,text:'Complete 10 perfect coin rows',icon:'star'},
 {stat:'smashes',goal:25,text:'Smash or bonk 25 things',icon:'flame'},
 {stat:'close',goal:12,text:'Get 12 close calls',icon:'shield'},
 {stat:'boosts',goal:3,text:'Fire the engine boost 3 times',icon:'bolt'}];
const BOX_DAYS={2:'sky',4:'sky',6:'storm'},DAY_NAMES=['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
function boxTaskFor(day){const box=BOX_DAYS[new Date(day+'T00:00:00Z').getUTCDay()];if(!box)return null;let seed=7;for(const ch of day)seed=(seed*33+ch.charCodeAt(0))>>>0;return {k:seed%BOX_TASKS.length,box,p:0,c:false}}
function nextBoxDay(){const d=new Date();for(let i=1;i<=7;i++){const n=new Date(d.getTime()+i*864e5);if(BOX_DAYS[n.getUTCDay()])return i===1?'TOMORROW':DAY_NAMES[n.getUTCDay()]}return ''}
const SEASON_TASKS=[
 {id:'runs',stat:'runs',goal:50,text:'Play 50 runs',icon:'play',r:{sp:200,coins:300}},
 {id:'meters',stat:'meters',goal:150000,text:'Fly 150,000 m in total',icon:'balloon',r:{sp:250,coins:400}},
 {id:'coins',stat:'coins',goal:3000,text:'Collect 3,000 coins',icon:'coin',r:{sp:200,coins:300,gems:3}},
 {id:'rows',stat:'rows',goal:100,text:'Complete 100 perfect coin rows',icon:'star',r:{sp:250,gems:3}},
 {id:'boosts',stat:'boosts',goal:30,text:'Fire the engine boost 30 times',icon:'bolt',r:{sp:200,coins:300}},
 {id:'stars',stat:'stars',goal:20,text:'Earn 20 stars',icon:'star',r:{sp:250,gems:4}},
 {id:'bosses',stat:'bosses',goal:30,text:'Defeat 30 bosses',icon:'crown',r:{sp:300,gems:5}},
 {id:'far',stat:'runAlt',max:true,goal:10000,text:'Fly 10,000 m in one run',icon:'trophy',r:{sp:300,gems:5}},
 {id:'daily',stat:'dailyDone',goal:20,text:'Complete 20 daily tasks',icon:'heart',r:{sp:300,coins:500,gems:5}},
 {id:'smash',stat:'smashes',goal:300,text:'Smash or bonk 300 things',icon:'flame',r:{sp:200,coins:300}}];
// Three daily tasks, the same for everyone on a given UTC day.
function dailyFor(day){let seed=0;for(const ch of day)seed=(seed*31+ch.charCodeAt(0))>>>0;const rnd=()=>(seed=(seed*1103515245+12345)>>>0)/4294967296;
 const picks=[];while(picks.length<3){const k=Math.floor(rnd()*DAILY_TASKS.length);if(!picks.some(p=>p.k===k)&&!(k===9&&rnd()<.3))picks.push({k,g:Math.floor(rnd()*DAILY_TASKS[k].goals.length),p:0,c:false})}return picks}
function dailyReward(t){const d=DAILY_TASKS[t.k],m=1+t.g*.5;return {coins:Math.round(d.r.coins*m),sp:Math.round(d.r.sp*m),gems:d.r.gems||0}}
// Season state lives in save.season and task state in save.tasks; both reset when their period changes.
function seasonState(){const now=seasonOf();if(!save.season||!save.season.id)save.season={id:now.id,sp:0,reached:-1,legend:false};
 const t=save.tasks||(save.tasks={});if(t.day!==todayId()){t.day=todayId();t.daily=dailyFor(t.day);t.bonus=false;t.boxTask=boxTaskFor(t.day)}if(!('boxTask' in t))t.boxTask=boxTaskFor(t.day)
 if(t.season!==save.season.id){t.season=save.season.id;t.st={};t.sc=[]}return save.season}
let seasonToast=[];
function trackTask(stat,amount=1){if(!amount)return;seasonState();if(typeof lifeStat==='function')lifeStat(stat,amount);const t=save.tasks,max=stat==='runAlt';
 for(const d of t.daily){const def=DAILY_TASKS[d.k];if(def.stat!==stat||d.c)continue;const goal=def.goals[d.g],was=d.p;d.p=max?Math.max(d.p,amount):d.p+amount;if(was<goal&&d.p>=goal){seasonToast.push(`TASK DONE: ${def.text(goal).toUpperCase()}`);if(seasonRun)seasonRun.done++}}
 const bt=t.boxTask;if(bt&&!bt.c&&BOX_TASKS[bt.k].stat===stat){const goal=BOX_TASKS[bt.k].goal,w=bt.p;bt.p=max?Math.max(bt.p,amount):bt.p+amount;if(w<goal&&bt.p>=goal){seasonToast.push('BOX TASK DONE! CLAIM YOUR BOX');if(seasonRun)seasonRun.done++}}
 const was=t.st[stat]||0;t.st[stat]=max?Math.max(was,amount):was+amount;for(const s of SEASON_TASKS)if(s.stat===stat&&was<s.goal&&t.st[stat]>=s.goal&&!t.sc.includes(s.id)){seasonToast.push(`SEASON TASK DONE: ${s.text.toUpperCase()}`);if(seasonRun)seasonRun.done++}
 // Task notices show in flight only during the tutorial; otherwise the results screen reports them.
 if(state==='flying'&&seasonToast.length){if(typeof tipsOn==='function'&&tipsOn()){for(const msg of seasonToast)popup(x*W,balloonY()-120,msg,'#7ef08f',18);gameSound.effect('milestone')}seasonToast=[]}}
const tasksReady=()=>{seasonState();const t=save.tasks;return t.daily.filter(d=>!d.c&&d.p>=DAILY_TASKS[d.k].goals[d.g]).length+SEASON_TASKS.filter(s=>!t.sc.includes(s.id)&&(t.st[s.stat]||0)>=s.goal).length+(!t.bonus&&t.daily.every(d=>d.c)?1:0)+(t.boxTask&&!t.boxTask.c&&t.boxTask.p>=BOX_TASKS[t.boxTask.k].goal?1:0)+(typeof levelClaimable==='function'?levelClaimable():0)};
// Rewards: coins, gems and season points; season points can promote you, and each new level pays out.
let rankUps=[];
// Season avatars and frames: owned for good, and the first season each was won in is kept (cos.sn) to show as S1, S2...
function seasonItem(kind,id,n){const c=myCos(),key=kind+':'+id;c.sn=c.sn||{};if(!c.sn[key])c.sn[key]=n;if(c.own.includes(id))return null;c.own.push(id);return kind==='a'?AVATARS[id].name+' avatar':FRAMES[id].name+' frame'}
// Pays a level's reward (coins, gems and any season item) and returns the names of the items won.
function payLevel(rw,n){if(rw.coins)save.coins+=rw.coins;if(rw.gems)save.gems=(save.gems||0)+rw.gems;return [rw.avatar&&seasonItem('a',rw.avatar,n),rw.frame&&seasonItem('f',rw.frame,n)].filter(Boolean)}
function grant(r){if(r.coins)save.coins+=r.coins;if(r.gems)save.gems=(save.gems||0)+r.gems;if(r.sp)addSP(r.sp);persist();refreshMeta()}
function addSP(n){const s=seasonState(),sn=+s.id.slice(1);s.sp+=Math.max(0,Math.round(n));const r=tierOf(s.sp);
 while(s.reached<r.idx){s.reached++;if(s.reached===0)continue;const d=DIVISIONS[s.reached],rw=LEVEL_REWARDS[d.ti][d.di];rankUps.push({name:d.name,coins:rw.coins||0,gems:rw.gems||0,items:payLevel(rw,sn),ti:d.ti})}
 // Season items of levels reached before those levels paid them.
 for(let i=1;i<=s.reached;i++){const d=DIVISIONS[i],rw=LEVEL_REWARDS[d.ti][d.di];if(rw.after||!(rw.avatar||rw.frame))continue;const items=payLevel({avatar:rw.avatar,frame:rw.frame},sn);if(items.length)rankUps.push({name:d.name,coins:0,gems:0,items,ti:d.ti})}
 if(typeof online!=='undefined')online.seasonSync&&online.seasonSync();refreshSeasonUi()}
// Season points for a finished run: score, stars and bosses. Called with the run's totals so far (revives add only the rest).
function runSP(score,stars,bosses){return Math.min(150,Math.round(score/1000))+stars*15+bosses*25}
// What this run has already paid into tasks and season points, so a revive only adds what is new.
let seasonRun=null;
function seasonNewRun(){seasonRun={sp:0,stars:0,meters:0,coins:0,counted:false,done:0}}
function seasonRunEnd(score,stars,meters,coins,bosses){const r=seasonRun||(seasonNewRun(),seasonRun),s=seasonState(),before=tierOf(s.sp,s.legend).name;
 if(!r.counted){r.counted=true;trackTask('runs',1)}
 trackTask('meters',Math.max(0,meters-r.meters));trackTask('runAlt',meters);r.meters=Math.max(r.meters,meters);
 trackTask('coins',Math.max(0,coins-r.coins));r.coins=Math.max(r.coins,coins);
 trackTask('stars',Math.max(0,stars-r.stars));r.stars=Math.max(r.stars,stars);
 const total=runSP(score,stars,bosses),gain=Math.max(0,total-r.sp);r.sp=Math.max(r.sp,total);if(gain)addSP(gain);
 const tasks=r.done;seasonToast=[];persist();
 const box=$('#res-season'),now=tierOf(s.sp,s.legend);box.replaceChildren(emblemEl(now,30));box.append(el('b','',`+${gain} SP`));
 if(now.name!==before)box.append(el('span','res-chip up',`RANK UP: ${now.name}!`));else box.append(el('small','',now.name));
 if(tasks)box.append(el('span','res-chip',`${tasks} TASK${tasks>1?'S':''} DONE!`));box.hidden=false}
// When a new season starts: final rank (Star Legend checked online), rewards and items, history, then reset.
let seasonChecking=false,seasonReward=null;
let seasonTries=0;
// A finished season waits in save.season (or save.seasonPending, when a cloud save brings back one that another
// device never closed). A possible Star Legend waits for online play to find their final rank (a few tries, then
// they get Diamond). Seasons without any points pay nothing.
async function seasonCheck(){const now=seasonOf();if(seasonChecking)return;const old=save.seasonPending||(save.season&&save.season.id!==now.id?save.season:null);if(!old)return;
 const on=typeof online!=='undefined'&&online.configured(),maybeLegend=old.sp>=LEGEND_V_MIN&&on;if(maybeLegend&&!['in','out','error'].includes(online.status)&&seasonTries<5){seasonTries++;return}
 seasonChecking=true;
 try{let legend=false;if(maybeLegend&&online.user){const r=await online.seasonRank(old.id,old.sp).catch(()=>null);if(r===null&&++seasonTries<5)return;legend=!!r&&r<=LEGEND_TOP}
  if(old===save.seasonPending)delete save.seasonPending;else{save.season={id:now.id,sp:0,reached:-1,legend:false};seasonState()}
  if(old.sp>0&&!(save.seasonHistory||[]).some(h=>h.id===old.id)){const fin=tierOf(old.sp,legend),reward=SEASON_REWARDS[fin.ti],items=[];let coins=reward.coins,gems=reward.gems;
   for(let i=0;i<=fin.ti;i++){const rw=SEASON_REWARDS[i];if(rw.skin&&!save.skins.includes(rw.skin)){save.skins.push(rw.skin);items.push(SKINS[rw.skin].name+' skin')}}
   // STAR LEGEND V (the top 100) gets its level reward and the Star Legend frame now.
   if(fin.idx===TOP_DIV){const rw=LEVEL_REWARDS[6][4];coins+=rw.coins;gems+=rw.gems;items.push(...payLevel({avatar:rw.avatar,frame:rw.frame},+old.id.slice(1)))}
   save.coins+=coins;save.gems=(save.gems||0)+gems;save.seasonHistory=[...(save.seasonHistory||[]),{id:old.id,sp:old.sp,rank:fin.name,ti:fin.ti}].slice(-12);
   seasonReward={season:old.id,rank:fin.name,ti:fin.ti,coins,gems,items};gameSound.effect('record');if(state==='menu'&&$('#panel').hidden)openPanel('season')}
  persist();refreshMeta();refreshSeasonUi()}finally{seasonChecking=false}
 if(save.seasonPending||save.season.id!==seasonOf().id)seasonCheck()}

// ---- Emblems ----
// A shield in the tier colours with the tier's symbol; gold and up get wings, titanium and up a laurel.
function emblemSVG(r,anim=false){const tc=(r.tier||TIERS[0]).c,ti=r.ti===undefined?0:r.ti,u='em'+(++iconSeq);
 const sym=[`<path d="M33 20 L24 36 H31 L28 46 L40 29 H33 Z" fill="#fff" stroke="#1b1240" stroke-width="2"/>`,
  `<path d="M32 21 L35.5 29 L44 29.5 L37.5 35 L39.5 43 L32 38.5 L24.5 43 L26.5 35 L20 29.5 L28.5 29 Z" fill="#ffe0b8" stroke="#1b1240" stroke-width="2"/>`,
  `<path d="M26 22 L28.4 27.5 L34 28 L29.8 31.6 L31 37 L26 34 L21 37 L22.2 31.6 L18 28 L23.6 27.5 Z M38 30 L40.4 35.5 L46 36 L41.8 39.6 L43 45 L38 42 L33 45 L34.2 39.6 L30 36 L35.6 35.5 Z" fill="#fff" stroke="#1b1240" stroke-width="2"/>`,
  `<path d="M21 42 L19 25 L26.5 31 L32 21 L37.5 31 L45 25 L43 42 Z" fill="#fff6c8" stroke="#1b1240" stroke-width="2"/>`,
  `<path d="M32 19 L43 25 V37 L32 44 L21 37 V25 Z" fill="#e8fbff" stroke="#1b1240" stroke-width="2"/><path d="M32 25 L37 28 V34 L32 37 L27 34 V28 Z" fill="#5fb8c8" stroke="#1b1240" stroke-width="1.6"/>`,
  `<path d="M24 22 H40 L46 29 L32 46 L18 29 Z" fill="#e8fbff" stroke="#1b1240" stroke-width="2"/><path d="M18 29 H46 M24 22 L28 29 L32 46 L36 29 L40 22" fill="none" stroke="#1b1240" stroke-width="1.4"/>`,
  `<path d="M32 15 L36.5 26 L48 26.5 L39 33.5 L42 45 L32 38.5 L22 45 L25 33.5 L16 26.5 L27.5 26 Z" fill="#fff3a0" stroke="#1b1240" stroke-width="2.2"/>`][ti];
 const wings=ti>=3?`<path d="M14 26 C4 24 2 32 6 38 C9 34 12 34 15 36 Z M50 26 C60 24 62 32 58 38 C55 34 52 34 49 36 Z" fill="${tc[1]}" stroke="#1b1240" stroke-width="2.4" stroke-linejoin="round"/>`:'';
 const laurel=ti>=4?[0,1,2].map(k=>`<ellipse cx="${16-k*1.5}" cy="${44+k*5}" rx="2.6" ry="5" transform="rotate(${-30-k*15} ${16-k*1.5} ${44+k*5})" fill="#7ef08f" stroke="#1b1240" stroke-width="1.4"/><ellipse cx="${48+k*1.5}" cy="${44+k*5}" rx="2.6" ry="5" transform="rotate(${30+k*15} ${48+k*1.5} ${44+k*5})" fill="#7ef08f" stroke="#1b1240" stroke-width="1.4"/>`).join(''):'';
 const rays=ti===6?`<g class="${anim?'em-rays':''}" style="transform-origin:32px 34px">${[...Array(12)].map((_,k)=>`<path d="M32 34 L30 2 L34 2 Z" fill="#ffe680" opacity=".55" transform="rotate(${k*30} 32 34)"/>`).join('')}</g>`:'';
 return `<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tc[0]}"/><stop offset=".55" stop-color="${tc[1]}"/><stop offset="1" stop-color="${tc[2]}"/></linearGradient></defs>${rays}${wings}${laurel}<path d="M32 6 L52 13 V31 C52 45 43 54 32 59 C21 54 12 45 12 31 V13 Z" fill="url(#${u})" stroke="#1b1240" stroke-width="3.5" stroke-linejoin="round"/><path d="M32 11 L47 16.5 V31" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2.5" stroke-linecap="round"/>${sym}</svg>`}
function emblemEl(r,size=40,anim=false){const e=el('span','emblem'+(r.legend?' legend':''));e.style.width=e.style.height=size+'px';e.innerHTML=emblemSVG(r,anim);return e}
function rankLabel(r){const b=el('span','rank-label t-'+(r.tier||TIERS[0]).id);b.textContent=r.name;return b}

// ---- Menu buttons ----
function refreshSeasonUi(){const btn=$('#open-season');if(!btn)return;const s=seasonState(),r=tierOf(s.sp,s.legend),key=r.name+s.sp;
 if(btn.dataset.key!==key){btn.dataset.key=key;$('#season-emblem').replaceChildren(emblemEl(r,34,true));$('#season-rank').textContent='SEASON';btn.title=`${r.name} · ${s.sp.toLocaleString()} SP`}
 const n=tasksReady(),dot=$('#tasks-dot');dot.hidden=!n;dot.textContent=n}

// ---- Tasks panel ----
let tasksTab='daily';
function taskRow(ic,text,p,goal,reward,claimed,onClaim){const row=el('div','task-row'+(claimed?' done':'')),ico=el('span','task-ico');ico.innerHTML=icon(ic);const mid=el('div','task-mid');mid.append(el('b','',text));
 const bar=el('i','task-bar'),fill=el('s');fill.style.width=Math.min(100,p/goal*100)+'%';bar.append(fill);mid.append(bar,el('small','',`${Math.min(p,goal).toLocaleString()} / ${goal.toLocaleString()}`));
 const rw=el('div','task-reward');if(reward.coins)rw.insertAdjacentHTML('beforeend',`<span>${iconHTML('coin')}${reward.coins}</span>`);if(reward.gems)rw.insertAdjacentHTML('beforeend',`<span>${iconHTML('gem')}${reward.gems}</span>`);if(reward.sp)rw.insertAdjacentHTML('beforeend',`<span class="sp">+${reward.sp} SP</span>`);if(reward.box)rw.insertAdjacentHTML('beforeend',`<span class="box">${iconHTML('box')}${BOXES[reward.box].name}</span>`);
 const end=el('div','task-end');end.append(rw);if(claimed)end.append(el('span','task-claimed','DONE ✓'));else if(p>=goal){const b=el('button','mini-btn go','CLAIM');b.onclick=()=>{onClaim();gameSound.effect('buy');confetti(16);renderTasks()};end.append(b)}
 row.append(ico,mid,end);return row}
function renderTasks(){seasonState();const list=$('#panel-list'),t=save.tasks,scroll=list.scrollTop;$('#panel-title').textContent='TASKS';list.replaceChildren();
 // Three big tabs, like the store's: DAILY, SEASON and LEVEL (the level path).
 const tabs=el('div','store-tabs task-tabs');for(const [id,label,ic] of [['daily','DAILY','star'],['season','SEASON','trophy'],['level','LEVEL','crown']]){const b=el('button','store-tab '+id+(tasksTab===id?' on':''));b.innerHTML=`<span class="st-ico">${icon(ic)}</span><b>${label}</b>`;if(id==='level'&&typeof levelClaimable==='function'&&levelClaimable())b.append(el('span','tab-dot',String(levelClaimable())));b.onclick=()=>{if(tasksTab!==id){tasksTab=id;delete list.dataset.lvlOpened;list.scrollTop=0;renderTasks()}};tabs.append(b)}list.append(tabs);
 if(tasksTab==='level'){if(typeof renderLevelPath==='function')renderLevelPath(list);list.scrollTop=list.dataset.lvlOpened?scroll:list.scrollTop;refreshSeasonUi();return}
 if(tasksTab==='daily'){list.append(el('p','rank-note',`New tasks in ${dayLeft()}`));
  const bt=t.boxTask;if(bt){const def=BOX_TASKS[bt.k],row=taskRow('box',`BOX TASK: ${def.text}`,bt.p,def.goal,{box:bt.box},bt.c,()=>{bt.c=true;persist();setTimeout(()=>openBox(bt.box,'gift'),250)});row.classList.add('box-task');list.append(row)}
  else{const row=el('div','task-row box-task soon'),ico=el('span','task-ico');ico.innerHTML=icon('box');const mid=el('div','task-mid');mid.append(el('b','','BOX TASKS'),el('small','',`Tuesday, Thursday and Saturday. Next one: ${nextBoxDay()}`));row.append(ico,mid);list.append(row)}for(const d of t.daily){const def=DAILY_TASKS[d.k],goal=def.goals[d.g],r=dailyReward(d);list.append(taskRow(def.icon,def.text(goal),d.p,goal,r,d.c,()=>{d.c=true;grant(r);trackTask('dailyDone',1)}))}
  const all=t.daily.every(d=>d.c),bonus=taskRow('gem','Finish all 3 daily tasks',t.daily.filter(d=>d.c).length,3,DAILY_BONUS,t.bonus,()=>{t.bonus=true;grant(DAILY_BONUS)});bonus.classList.add('bonus');list.append(bonus)}
 else{list.append(el('p','rank-note',`Season ${seasonOf().n} ends in ${seasonLeft()}`));for(const s of SEASON_TASKS)list.append(taskRow(s.icon,s.text,t.st[s.stat]||0,s.goal,s.r,t.sc.includes(s.id),()=>{t.sc.push(s.id);grant(s.r)}))}
 list.scrollTop=scroll;refreshSeasonUi()}

// ---- Season panel ----
let seasonTab='now',seasonReq=0;
function renderSeason(){const list=$('#panel-list'),s=seasonState(),sn=seasonOf(),prev=prevSeason();$('#panel-title').textContent='SEASON';list.replaceChildren();
 if(seasonReward){const r=seasonReward,b=el('div','reward-banner season-reward');b.append(emblemEl({tier:r.ti===6?LEGEND_TIER:TIERS[r.ti],ti:r.ti,legend:r.ti===6},54,true));const d=el('div');d.append(el('b','',`SEASON ${r.season.slice(1)} FINISHED: ${r.rank}`),el('span','',`Rewards: +${r.coins.toLocaleString()} coins, +${r.gems} gems${r.items.length?', '+r.items.join(', '):''}`));b.append(d);list.append(b);seasonReward=null;confetti(40)}
 while(rankUps.length){const u=rankUps.shift(),b=el('div','reward-banner'),got=[u.coins&&`+${u.coins.toLocaleString()} coins`,u.gems&&`+${u.gems} gems`,...(u.items||[])].filter(Boolean);b.append(emblemEl({tier:TIERS[u.ti],ti:u.ti,legend:u.ti===6},40));const d=el('div');d.append(el('b','',`RANK UP: ${u.name}!`),el('span','',u.note||got.join(', ')));b.append(d);list.append(b)}
 const tabs=el('div','tabs rank-tabs');for(const [id,label] of [['now',`SEASON ${sn.n}`],['prev',prev?`SEASON ${prev.n}`:'LAST SEASON'],['rewards','REWARDS']]){const b=el('button','tab'+(seasonTab===id?' on':''));b.textContent=label;b.onclick=()=>{seasonTab=id;renderSeason()};tabs.append(b)}list.append(tabs);
 if(seasonTab==='rewards')return renderSeasonRewards(list,s);
 if(seasonTab==='now'){const r=tierOf(s.sp,s.legend),card=el('div','season-card');card.style.setProperty('--tc',(r.tier||TIERS[0]).c[1]);card.append(emblemEl(r,84,true));const info=el('div','season-info');info.append(rankLabel(r),el('b','season-sp',`${s.sp.toLocaleString()} SP`));
  if(r.next){const span=r.next.min-r.min,left=r.next.min-s.sp,bar=el('i','task-bar'),fill=el('s');fill.style.width=Math.min(100,(s.sp-r.min)/span*100)+'%';bar.append(fill);
   info.append(bar,el('small','',r.next!==DIVISIONS[TOP_DIV]?`${left.toLocaleString()} SP to ${r.next.name}`:left>0?`${left.toLocaleString()} SP more, then reach the global top ${LEGEND_TOP} for STAR LEGEND V`:`Reach the global top ${LEGEND_TOP} for STAR LEGEND V`))}
  else info.append(el('small','',`You are in the top ${LEGEND_TOP}! Stay there until the season ends to win the Star Legend frame.`));
  info.append(el('small','',`Season ${sn.n} ends in ${seasonLeft()}`));card.append(info);list.append(card);
  list.append(el('p','rank-note','Earn SP from every run (score, stars and bosses) and from tasks. Every new level pays a reward: see REWARDS.'))}
 else{const h=(save.seasonHistory||[]).find(x=>prev&&x.id===prev.id);const card=el('div','season-card');if(h){const r={tier:h.ti===6?LEGEND_TIER:TIERS[h.ti],ti:h.ti,legend:h.ti===6,name:h.rank};card.append(emblemEl(r,70));const info=el('div','season-info');info.append(rankLabel(r),el('b','season-sp',`${h.sp.toLocaleString()} SP`),el('small','',`Your final rank in season ${h.id.slice(1)}`));card.append(info)}else card.append(el('p','rank-note',prev?'You did not play last season.':'This is the first season. Check back next month!'));list.append(card)}
 const id=seasonTab==='now'?sn.id:prev&&prev.id;if(!id)return;const box=el('div','rank-list');list.append(el('small','clan-label','GLOBAL RANKING'),box);
 if(typeof online==='undefined'||!online.configured()){box.append(el('p','rank-note','The global ranking needs online play.'));return}
 if(!online.user)list.append(el('p','rank-note','Sign in to join the global season ranking.'),googleButton());
 box.append(el('p','rank-note','Loading…'));const req=++seasonReq;
 Promise.resolve(online.start()).then(()=>online.seasonTop(id)).then(rows=>{if(req!==seasonReq||panelKind!=='season')return;box.replaceChildren();if(!rows.length){box.append(el('p','rank-note','No one has ranked yet. Be the first!'));return}const uid=online.user&&online.user.uid;
  rows.forEach((e,i)=>{const r=tierOf(e.sp||0,i<LEGEND_TOP),row=el('div','rank-row'+(e.uid===uid?' me':'')+(i<3?' top':'')),pos=el('span','rank-pos');if(i<3)pos.innerHTML=icon('medal',['gold','silver','bronze'][i]);else pos.textContent=i+1;row.dataset.uid=e.uid;
   const lk=e.uid===uid?{...myLook(),name:online.displayName(),clan:save.clan&&save.clan.tag}:e;row.append(pos,avatarEl(lk,32),nameEl(lk.name||e.name,lk.gold,lk.clan),emblemEl(r,26),el('b','rank-score',(e.sp||0).toLocaleString()));row.title=r.name;row.onclick=()=>showProfile(e.uid,{name:e.name,avatar:e.avatar,frame:e.frame,gold:e.gold,clanTag:e.clan,seasonId:id,sp:e.sp||0});box.append(row)});
  online.looks(rows.map(e=>e.uid).filter(u=>u!==uid)).then(map=>{for(const row of box.querySelectorAll('.rank-row[data-uid]')){const p=map[row.dataset.uid];if(!p)continue;row.querySelector('canvas').replaceWith(avatarEl(p,32));row.querySelector('.rank-name').replaceWith(nameEl(p.name,p.gold,p.clanTag))}}).catch(()=>{});
  if(uid&&seasonTab==='now'&&!rows.some(e=>e.uid===uid))online.seasonRank(id,s.sp).then(rank=>{if(!rank||req!==seasonReq)return;const r=tierOf(s.sp,rank<=LEGEND_TOP),row=el('div','rank-row me'),lk=myLook();row.append(el('span','rank-pos',`#${rank}`),avatarEl(lk,32),nameEl(online.displayName(),lk.gold,save.clan&&save.clan.tag),emblemEl(r,26),el('b','rank-score',s.sp.toLocaleString()));box.append(row)}).catch(()=>{})})
  .catch(e=>{console.warn(e);if(req===seasonReq)box.replaceChildren(el('p','rank-note','Could not load the ranking right now.'))})}
// REWARDS: one row per tier with its end-of-season reward; tap a tier to open its five levels and what each pays.
let seasonOpen=null;
function renderSeasonRewards(list,s){const cur=tierOf(s.sp,s.legend),sn=seasonOf().n,open=seasonOpen===null?cur.ti:seasonOpen;
 list.append(el('p','rank-note',`Tap a tier to see its five levels. Each level pays its reward once a season when you reach it. Only DIAMOND and STAR LEGEND give avatars and frames, marked S${sn} for this season. STAR LEGEND V is only for the top ${LEGEND_TOP}: its reward and frame come when the season ends.`));
 const item=(rw,size)=>avatarEl(rw.avatar?{avatar:rw.avatar+'~'+sn,frame:'basic'}:{avatar:'sunny',frame:rw.frame+'~'+sn},size);
 TIERS.forEach((tier,ti)=>{const rw=SEASON_REWARDS[ti],r={tier,ti,legend:ti===6,name:tier.name},isOpen=open===ti,row=el('button','tier-row'+(cur.ti===ti?' me':'')+(isOpen?' open':''));
  const mid=el('div','tier-mid');mid.append(rankLabel(r),el('small','',`FROM ${DIVISIONS[ti*5].min.toLocaleString()} SP · SEASON END:`));const chips=el('div','task-reward');chips.insertAdjacentHTML('beforeend',`<span>${iconHTML('coin')}${rw.coins.toLocaleString()}</span><span>${iconHTML('gem')}${rw.gems}</span>`);if(rw.skin)chips.append(el('span','tier-skin',SKINS[rw.skin].name.toUpperCase()+' SKIN'));mid.append(chips);
  const items=el('div','tier-items');for(const lr of LEVEL_REWARDS[ti])if(lr.avatar||lr.frame)items.append(item(lr,34));
  row.append(emblemEl(r,46,ti===6),mid,items,el('span','tier-arrow',isOpen?'▲':'▼'));row.onclick=()=>{const y=list.scrollTop;seasonOpen=isOpen?-1:ti;gameSound.effect('boop');renderSeason();list.scrollTop=y};list.append(row);
  if(!isOpen)return;const box=el('div','tier-levels');
  for(let di=0;di<5;di++){const idx=ti*5+di,d=DIVISIONS[idx],lr=LEVEL_REWARDS[ti][di],top=idx===TOP_DIV,got=top?cur.idx===TOP_DIV:idx===0||s.reached>=idx,line=el('div','tl-line'+(got?' got':'')+(cur.idx===idx?' now':'')+(top?' top':''));
   const m=el('div','tl-mid');m.append(el('b','',d.name),el('small','',top?`${d.min.toLocaleString()} SP + GLOBAL TOP ${LEGEND_TOP} · PAID AFTER THE SEASON`:idx===0?'WHERE EVERYONE STARTS':`${d.min.toLocaleString()} SP`));
   const pay=el('div','task-reward');if(lr.coins)pay.insertAdjacentHTML('beforeend',`<span>${iconHTML('coin')}${lr.coins.toLocaleString()}</span>`);if(lr.gems)pay.insertAdjacentHTML('beforeend',`<span>${iconHTML('gem')}${lr.gems}</span>`);if(lr.avatar||lr.frame){const it=el('span','tl-item');it.append(item(lr,30),el('small','',lr.avatar?'AVATAR':'FRAME'));pay.append(it)}m.append(pay);
   line.append(emblemEl({...d,legend:ti===6},30),m,el('span','tl-check',got?'✓':cur.idx===idx?'•':''));box.append(line)}
  list.append(box)})}

// STAR LEGEND V while the season runs: its points and a place in the global top 100 (checked after each sync). Its
// reward and frame are paid when the season ends, to players still in the top 100.
function seasonLegend(on,id){const s=seasonState();if(s.id!==id||s.legend===on)return;s.legend=on;if(on){rankUps.push({name:'STAR LEGEND V',coins:0,gems:0,items:[],ti:6,note:`You are in the global top ${LEGEND_TOP}! Stay there until the season ends to win the Star Legend frame.`});gameSound.effect('record')}persist();refreshMeta();refreshSeasonUi()}
// Cloud save merge (online.js): season points and task progress take the best of both devices.
function mergeSeason(cloud){const num=v=>typeof v==='number'&&isFinite(v)?Math.max(0,Math.floor(v)):0,sn=id=>typeof id==='string'&&/^S\d{1,4}$/.test(id)?+id.slice(1):0,s=seasonState(),cs=cloud.season;
 const closed=id=>(save.seasonHistory||[]).some(h=>h.id===id)||(Array.isArray(cloud.seasonHistory)&&cloud.seasonHistory.some(h=>h&&h.id===id));
 if(cs&&typeof cs==='object'&&sn(cs.id)){const copy={id:cs.id,sp:num(cs.sp),reached:Math.min(DIVISIONS.length-1,Math.max(-1,num(cs.reached+1)-1)),legend:!!cs.legend};
  if(sn(cs.id)>sn(s.id))save.season=copy;
  // A season the other device never closed: take it over if this one has nothing yet, otherwise close it separately.
  else if(sn(cs.id)<sn(s.id)&&copy.sp>0&&!closed(cs.id)){if(!s.sp&&s.reached<0)save.season=copy;else if(!save.seasonPending||sn(save.seasonPending.id)<sn(cs.id))save.seasonPending=copy}
  else if(cs.id===s.id){s.sp=Math.max(s.sp,num(cs.sp));s.reached=Math.min(DIVISIONS.length-1,Math.max(s.reached,num(cs.reached+1)-1))}}
 if(Array.isArray(cloud.seasonHistory)){const all=new Map((save.seasonHistory||[]).map(h=>[h.id,h]));for(const h of cloud.seasonHistory)if(h&&sn(h.id)&&!all.has(h.id))all.set(h.id,{id:h.id,sp:num(h.sp),rank:String(h.rank||'').slice(0,16),ti:Math.min(6,num(h.ti))});save.seasonHistory=[...all.values()].sort((a,b)=>sn(a.id)-sn(b.id)).slice(-12)}
 const ct=cloud.tasks,t=save.tasks;seasonState();if(ct&&typeof ct==='object'){
  if(ct.day===t.day&&Array.isArray(ct.daily))t.daily.forEach((d,i)=>{const o=ct.daily[i];if(o&&o.k===d.k){d.p=Math.max(d.p,num(o.p));d.c=d.c||!!o.c}});if(ct.day===t.day)t.bonus=t.bonus||!!ct.bonus;
  if(ct.season===t.season&&ct.st&&typeof ct.st==='object'){for(const [k,v] of Object.entries(ct.st))if(/^[a-zA-Z]{1,12}$/.test(k))t.st[k]=Math.max(t.st[k]||0,num(v));if(Array.isArray(ct.sc))t.sc=[...new Set([...t.sc,...ct.sc.filter(id=>SEASON_TASKS.some(q=>q.id===id))])]}}
 refreshSeasonUi()}

seasonState();refreshSeasonUi();seasonCheck();setInterval(()=>{seasonCheck();if(state==='menu')refreshSeasonUi()},60000);
