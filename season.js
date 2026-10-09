'use strict';
// Seasons, ranks and tasks.
// A season is a calendar month (UTC); Season 1 is October 2026. Season points (SP) come from runs (score, stars,
// bosses) and tasks and never go down during a season. They place a player in six tiers of five divisions each
// (V lowest, I highest). Star Legend is for players past Diamond I who are also in the season's global top 1,000.
// Reaching each division pays a small reward; when the season ends every player gets the rewards of the tier
// they finished in, including the special frames, avatars and skins of that tier and every tier below it.
const TIERS=[
 {id:'metal',name:'METAL',step:100,c:['#eef2f8','#9aa6bd','#4a5470']},
 {id:'bronze',name:'BRONZE',step:150,c:['#ffd0a0','#c8783a','#6e3a14']},
 {id:'silver',name:'SILVER',step:200,c:['#ffffff','#c4d0e4','#6a7a98']},
 {id:'gold',name:'GOLD',step:300,c:['#fff3a0','#ffc414','#b87a00']},
 {id:'titanium',name:'TITANIUM',step:400,c:['#d8fbff','#5fb8c8','#1f5a6e']},
 {id:'diamond',name:'DIAMOND',step:500,c:['#ffffff','#7fe0ff','#2a7ad8']}];
const LEGEND_TIER={id:'legend',name:'STAR LEGEND',c:['#fff3a0','#c46aff','#3a1580']};
const DIVS=['V','IV','III','II','I'],LEGEND_EXTRA=500,LEGEND_TOP=1000;
const DIVISIONS=(()=>{let min=0;const out=[];TIERS.forEach((tier,ti)=>DIVS.forEach((d,di)=>{out.push({ti,di,tier,name:`${tier.name} ${d}`,min});min+=tier.step}));return out})();
const LEGEND_MIN=DIVISIONS[DIVISIONS.length-1].min+LEGEND_EXTRA;
// Reaching a division: coins by tier, and gems on each promotion to a new tier.
const REACH_COINS=[25,40,60,90,120,160],PROMO_GEMS=[0,3,5,8,12,20],LEGEND_REACH={coins:500,gems:30};
// End-of-season rewards by final tier (index 6 is Star Legend). Items are season-only and stack downwards.
const SEASON_REWARDS=[
 {coins:200,gems:3},
 {coins:400,gems:8,frame:'sBronze'},
 {coins:700,gems:15,frame:'sSilver'},
 {coins:1000,gems:25,frame:'sGold',avatar:'eagle'},
 {coins:1500,gems:40,frame:'sTitan',avatar:'pilot'},
 {coins:2500,gems:60,frame:'sDiamond',avatar:'fox',skin:'prism'},
 {coins:4000,gems:120,frame:'legend',avatar:'legend',skin:'starlight'}];
function seasonOf(d=new Date()){const n=Math.max(1,(d.getUTCFullYear()-2026)*12+d.getUTCMonth()-8);return {n,id:'S'+n,start:Date.UTC(2026,8+n,1),end:Date.UTC(2026,9+n,1)}}
const prevSeason=()=>{const s=seasonOf();return s.n>1?{n:s.n-1,id:'S'+(s.n-1)}:null};
function tierOf(sp,legend=false){if(legend&&sp>=LEGEND_MIN)return {legend:true,ti:6,tier:LEGEND_TIER,name:'STAR LEGEND',idx:DIVISIONS.length,min:LEGEND_MIN,next:null};
 let i=0;while(i+1<DIVISIONS.length&&sp>=DIVISIONS[i+1].min)i++;const next=DIVISIONS[i+1]||{name:'STAR LEGEND',min:LEGEND_MIN,legend:true};return {...DIVISIONS[i],idx:i,next}}
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
 const t=save.tasks||(save.tasks={});if(t.day!==todayId()){t.day=todayId();t.daily=dailyFor(t.day);t.bonus=false}
 if(t.season!==save.season.id){t.season=save.season.id;t.st={};t.sc=[]}return save.season}
let seasonToast=[];
function trackTask(stat,amount=1){if(!amount)return;seasonState();const t=save.tasks,max=stat==='runAlt';
 for(const d of t.daily){const def=DAILY_TASKS[d.k];if(def.stat!==stat||d.c)continue;const goal=def.goals[d.g],was=d.p;d.p=max?Math.max(d.p,amount):d.p+amount;if(was<goal&&d.p>=goal){seasonToast.push(`TASK DONE: ${def.text(goal).toUpperCase()}`);if(seasonRun)seasonRun.done++}}
 const was=t.st[stat]||0;t.st[stat]=max?Math.max(was,amount):was+amount;for(const s of SEASON_TASKS)if(s.stat===stat&&was<s.goal&&t.st[stat]>=s.goal&&!t.sc.includes(s.id)){seasonToast.push(`SEASON TASK DONE: ${s.text.toUpperCase()}`);if(seasonRun)seasonRun.done++}
 if(state==='flying'&&seasonToast.length){for(const msg of seasonToast)popup(x*W,balloonY()-120,msg,'#7ef08f',18);seasonToast=[];gameSound.effect('milestone')}}
const tasksReady=()=>{seasonState();const t=save.tasks;return t.daily.filter(d=>!d.c&&d.p>=DAILY_TASKS[d.k].goals[d.g]).length+SEASON_TASKS.filter(s=>!t.sc.includes(s.id)&&(t.st[s.stat]||0)>=s.goal).length+(!t.bonus&&t.daily.every(d=>d.c)?1:0)};
// Rewards: coins, gems and season points; season points can promote you, and each new division pays out.
let rankUps=[];
function grant(r){if(r.coins)save.coins+=r.coins;if(r.gems)save.gems=(save.gems||0)+r.gems;if(r.sp)addSP(r.sp);persist();refreshMeta()}
function addSP(n){const s=seasonState();s.sp+=Math.max(0,Math.round(n));const r=tierOf(s.sp);while(s.reached<r.idx){s.reached++;const d=DIVISIONS[s.reached];if(s.reached===0)continue;const promo=d.di===0;const coins=REACH_COINS[d.ti],gems=promo?PROMO_GEMS[d.ti]:0;save.coins+=coins;save.gems=(save.gems||0)+gems;rankUps.push({name:d.name,coins,gems,promo,ti:d.ti})}
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
 const on=typeof online!=='undefined'&&online.configured(),maybeLegend=old.sp>=LEGEND_MIN&&on;if(maybeLegend&&!['in','out','error'].includes(online.status)&&seasonTries<5){seasonTries++;return}
 seasonChecking=true;
 try{let legend=false;if(maybeLegend&&online.user){const r=await online.seasonRank(old.id,old.sp).catch(()=>null);if(r===null&&++seasonTries<5)return;legend=!!r&&r<=LEGEND_TOP}
  if(old===save.seasonPending)delete save.seasonPending;else{save.season={id:now.id,sp:0,reached:-1,legend:false};seasonState()}
  if(old.sp>0&&!(save.seasonHistory||[]).some(h=>h.id===old.id)){const fin=tierOf(old.sp,legend),reward=SEASON_REWARDS[fin.ti],c=myCos(),items=[];
   for(let i=0;i<=fin.ti;i++){const rw=SEASON_REWARDS[i];if(rw.frame&&!c.own.includes(rw.frame)){c.own.push(rw.frame);items.push(FRAMES[rw.frame].name+' frame')}if(rw.avatar&&!c.own.includes(rw.avatar)){c.own.push(rw.avatar);items.push(AVATARS[rw.avatar].name+' avatar')}if(rw.skin&&!save.skins.includes(rw.skin)){save.skins.push(rw.skin);items.push(SKINS[rw.skin].name+' skin')}}
   save.coins+=reward.coins;save.gems=(save.gems||0)+reward.gems;save.seasonHistory=[...(save.seasonHistory||[]),{id:old.id,sp:old.sp,rank:fin.name,ti:fin.ti}].slice(-12);
   seasonReward={season:old.id,rank:fin.name,ti:fin.ti,coins:reward.coins,gems:reward.gems,items};gameSound.effect('record');if(state==='menu'&&$('#panel').hidden)openPanel('season')}
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
 if(btn.dataset.key!==key){btn.dataset.key=key;$('#season-emblem').replaceChildren(emblemEl(r,34,true));$('#season-rank').textContent=r.name;$('#season-sp').textContent=`${s.sp.toLocaleString()} SP`}
 const n=tasksReady(),dot=$('#tasks-dot');dot.hidden=!n;dot.textContent=n;const t=save.tasks;$('#tasks-sub').textContent=`${t.daily.filter(d=>d.c).length}/3 TODAY`}

// ---- Tasks panel ----
let tasksTab='daily';
function taskRow(ic,text,p,goal,reward,claimed,onClaim){const row=el('div','task-row'+(claimed?' done':'')),ico=el('span','task-ico');ico.innerHTML=icon(ic);const mid=el('div','task-mid');mid.append(el('b','',text));
 const bar=el('i','task-bar'),fill=el('s');fill.style.width=Math.min(100,p/goal*100)+'%';bar.append(fill);mid.append(bar,el('small','',`${Math.min(p,goal).toLocaleString()} / ${goal.toLocaleString()}`));
 const rw=el('div','task-reward');if(reward.coins)rw.insertAdjacentHTML('beforeend',`<span>${iconHTML('coin')}${reward.coins}</span>`);if(reward.gems)rw.insertAdjacentHTML('beforeend',`<span>${iconHTML('gem')}${reward.gems}</span>`);if(reward.sp)rw.insertAdjacentHTML('beforeend',`<span class="sp">+${reward.sp} SP</span>`);
 const end=el('div','task-end');end.append(rw);if(claimed)end.append(el('span','task-claimed','DONE ✓'));else if(p>=goal){const b=el('button','mini-btn go','CLAIM');b.onclick=()=>{onClaim();gameSound.effect('buy');confetti(16);renderTasks()};end.append(b)}
 row.append(ico,mid,end);return row}
function renderTasks(){seasonState();const list=$('#panel-list'),t=save.tasks,scroll=list.scrollTop;$('#panel-title').textContent='TASKS';list.replaceChildren();
 const tabs=el('div','tabs rank-tabs');for(const [id,label,ic] of [['daily','DAILY','star'],['season','SEASON','trophy']]){const b=el('button','tab'+(tasksTab===id?' on':''));b.innerHTML=iconHTML(ic)+label;b.onclick=()=>{tasksTab=id;renderTasks()};tabs.append(b)}list.append(tabs);
 if(tasksTab==='daily'){list.append(el('p','rank-note',`New tasks in ${dayLeft()}`));for(const d of t.daily){const def=DAILY_TASKS[d.k],goal=def.goals[d.g],r=dailyReward(d);list.append(taskRow(def.icon,def.text(goal),d.p,goal,r,d.c,()=>{d.c=true;grant(r);trackTask('dailyDone',1)}))}
  const all=t.daily.every(d=>d.c),bonus=taskRow('gem','Finish all 3 daily tasks',t.daily.filter(d=>d.c).length,3,DAILY_BONUS,t.bonus,()=>{t.bonus=true;grant(DAILY_BONUS)});bonus.classList.add('bonus');list.append(bonus)}
 else{list.append(el('p','rank-note',`Season ${seasonOf().n} ends in ${seasonLeft()}`));for(const s of SEASON_TASKS)list.append(taskRow(s.icon,s.text,t.st[s.stat]||0,s.goal,s.r,t.sc.includes(s.id),()=>{t.sc.push(s.id);grant(s.r)}))}
 list.scrollTop=scroll;refreshSeasonUi()}

// ---- Season panel ----
let seasonTab='now',seasonReq=0;
function renderSeason(){const list=$('#panel-list'),s=seasonState(),sn=seasonOf(),prev=prevSeason();$('#panel-title').textContent='SEASON';list.replaceChildren();
 if(seasonReward){const r=seasonReward,b=el('div','reward-banner season-reward');b.append(emblemEl({tier:r.ti===6?LEGEND_TIER:TIERS[r.ti],ti:r.ti,legend:r.ti===6},54,true));const d=el('div');d.append(el('b','',`SEASON ${r.season.slice(1)} FINISHED: ${r.rank}`),el('span','',`Rewards: +${r.coins} coins, +${r.gems} gems${r.items.length?', '+r.items.join(', '):''}`));b.append(d);list.append(b);seasonReward=null;confetti(40)}
 while(rankUps.length){const u=rankUps.shift(),b=el('div','reward-banner');b.append(emblemEl({tier:TIERS[u.ti],ti:u.ti},40));const d=el('div');d.append(el('b','',`RANK UP: ${u.name}!`),el('span','',`+${u.coins} coins${u.gems?` and +${u.gems} gems`:''}`));b.append(d);list.append(b)}
 const tabs=el('div','tabs rank-tabs');for(const [id,label] of [['now',`SEASON ${sn.n}`],['prev',prev?`SEASON ${prev.n}`:'LAST SEASON'],['rewards','REWARDS']]){const b=el('button','tab'+(seasonTab===id?' on':''));b.textContent=label;b.onclick=()=>{seasonTab=id;renderSeason()};tabs.append(b)}list.append(tabs);
 if(seasonTab==='rewards')return renderSeasonRewards(list,s);
 if(seasonTab==='now'){const r=tierOf(s.sp,s.legend),card=el('div','season-card');card.style.setProperty('--tc',(r.tier||TIERS[0]).c[1]);card.append(emblemEl(r,84,true));const info=el('div','season-info');info.append(rankLabel(r),el('b','season-sp',`${s.sp.toLocaleString()} SP`));
  if(r.next){const span=r.next.min-r.min,bar=el('i','task-bar'),fill=el('s');fill.style.width=Math.min(100,(s.sp-r.min)/span*100)+'%';bar.append(fill);info.append(bar,el('small','',r.next.legend?`${(r.next.min-s.sp).toLocaleString()} SP more, then reach the top ${LEGEND_TOP.toLocaleString()} for STAR LEGEND`:`${(r.next.min-s.sp).toLocaleString()} SP to ${r.next.name}`))}
  info.append(el('small','',`Season ${sn.n} ends in ${seasonLeft()}`));card.append(info);list.append(card);
  list.append(el('p','rank-note','Earn SP from every run (score, stars and bosses) and from tasks. Each new rank pays coins; each new tier also pays gems.'))}
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
function renderSeasonRewards(list,s){const cur=tierOf(s.sp,s.legend);list.append(el('p','rank-note','When the season ends you get the rewards of the tier you finished in, plus the special items of every tier below it.'));
 [...TIERS,LEGEND_TIER].forEach((tier,ti)=>{const rw=SEASON_REWARDS[ti],row=el('div','tier-row'+(cur.ti===ti?' me':'')),r={tier,ti,legend:ti===6,name:tier.name},need=ti===6?`${LEGEND_MIN.toLocaleString()} SP + TOP ${LEGEND_TOP.toLocaleString()}`:`${DIVISIONS[ti*5].min.toLocaleString()} SP`;
  const mid=el('div','tier-mid');mid.append(rankLabel(r),el('small','',`FROM ${need}`));const chips=el('div','task-reward');chips.insertAdjacentHTML('beforeend',`<span>${iconHTML('coin')}${rw.coins}</span><span>${iconHTML('gem')}${rw.gems}</span>`);mid.append(chips);
  const items=el('div','tier-items');if(rw.frame)items.append(avatarEl({avatar:rw.avatar||'sunny',frame:rw.frame},44));if(rw.skin){const sk=el('span','tier-skin');sk.textContent=SKINS[rw.skin].name;items.append(sk)}
  row.append(emblemEl(r,46,ti===6),mid,items);list.append(row)})}

// Star Legend while the season runs: past Diamond I and in the global top 1,000 (checked after each sync).
function seasonLegend(on,id){const s=seasonState();if(s.id!==id||s.legend===on)return;s.legend=on;if(on&&!s.legendPaid){s.legendPaid=true;save.coins+=LEGEND_REACH.coins;save.gems=(save.gems||0)+LEGEND_REACH.gems;rankUps.push({name:'STAR LEGEND',coins:LEGEND_REACH.coins,gems:LEGEND_REACH.gems,promo:true,ti:6});gameSound.effect('record')}persist();refreshMeta()}
// Cloud save merge (online.js): season points and task progress take the best of both devices.
function mergeSeason(cloud){const num=v=>typeof v==='number'&&isFinite(v)?Math.max(0,Math.floor(v)):0,sn=id=>typeof id==='string'&&/^S\d{1,4}$/.test(id)?+id.slice(1):0,s=seasonState(),cs=cloud.season;
 const closed=id=>(save.seasonHistory||[]).some(h=>h.id===id)||(Array.isArray(cloud.seasonHistory)&&cloud.seasonHistory.some(h=>h&&h.id===id));
 if(cs&&typeof cs==='object'&&sn(cs.id)){const copy={id:cs.id,sp:num(cs.sp),reached:Math.min(DIVISIONS.length-1,Math.max(-1,num(cs.reached+1)-1)),legend:!!cs.legend,legendPaid:!!cs.legendPaid};
  if(sn(cs.id)>sn(s.id))save.season=copy;
  // A season the other device never closed: take it over if this one has nothing yet, otherwise close it separately.
  else if(sn(cs.id)<sn(s.id)&&copy.sp>0&&!closed(cs.id)){if(!s.sp&&s.reached<0)save.season=copy;else if(!save.seasonPending||sn(save.seasonPending.id)<sn(cs.id))save.seasonPending=copy}
  else if(cs.id===s.id){s.sp=Math.max(s.sp,num(cs.sp));s.reached=Math.min(DIVISIONS.length-1,Math.max(s.reached,num(cs.reached+1)-1));s.legendPaid=s.legendPaid||!!cs.legendPaid}}
 if(Array.isArray(cloud.seasonHistory)){const all=new Map((save.seasonHistory||[]).map(h=>[h.id,h]));for(const h of cloud.seasonHistory)if(h&&sn(h.id)&&!all.has(h.id))all.set(h.id,{id:h.id,sp:num(h.sp),rank:String(h.rank||'').slice(0,16),ti:Math.min(6,num(h.ti))});save.seasonHistory=[...all.values()].sort((a,b)=>sn(a.id)-sn(b.id)).slice(-12)}
 const ct=cloud.tasks,t=save.tasks;seasonState();if(ct&&typeof ct==='object'){
  if(ct.day===t.day&&Array.isArray(ct.daily))t.daily.forEach((d,i)=>{const o=ct.daily[i];if(o&&o.k===d.k){d.p=Math.max(d.p,num(o.p));d.c=d.c||!!o.c}});if(ct.day===t.day)t.bonus=t.bonus||!!ct.bonus;
  if(ct.season===t.season&&ct.st&&typeof ct.st==='object'){for(const [k,v] of Object.entries(ct.st))if(/^[a-zA-Z]{1,12}$/.test(k))t.st[k]=Math.max(t.st[k]||0,num(v));if(Array.isArray(ct.sc))t.sc=[...new Set([...t.sc,...ct.sc.filter(id=>SEASON_TASKS.some(q=>q.id===id))])]}}
 refreshSeasonUi()}

seasonState();refreshSeasonUi();seasonCheck();setInterval(()=>{seasonCheck();if(state==='menu')refreshSeasonUi()},60000);
