'use strict';
// Online play through Firebase: Google sign-in, cloud save, worldwide and weekly leaderboards and a weekly
// tournament with coin rewards. It stays off until firebase-config.js holds a project config; until then
// the high score panel shows this device's bests. Firestore layout (see firestore.rules):
//   leaders/{uid}                best score ever      {name, score, stage, skin, at}
//   weekly/{week}/leaders/{uid}  best score that week {name, score, stage, skin, at}; weeks run Monday to Sunday UTC
//   players/{uid}                cloud save           {save, at}
//   profiles/{uid}               public profile       {name, avatar, frame, gold, clanId, clanTag, clanName, best, skin, at}
//   clans/{id}, clans/{id}/members/{uid}, clans/{id}/requests/{uid}   clans (see clans.js)
const online=(()=>{
 const SDK='https://www.gstatic.com/firebasejs/12.19.0/',TOP=50;
 // Weekly tournament prizes by final rank: [rank, coins, gems]. Gems only go to the top 10.
 const REWARDS=[[1,1000,50],[2,750,30],[3,500,20],[10,300,10],[50,150,0],[Infinity,50,0]];
 let fb=null,user=null,loading=null,status='off',saveTimer=0,reward=null,publishTimer=0;
 const best={all:0,week:0,weekId:''};
 const configured=()=>typeof FIREBASE_CONFIG==='object'&&!!FIREBASE_CONFIG&&!!FIREBASE_CONFIG.apiKey;
 // ISO week id in UTC, e.g. 2026-W41, and the moment the current week ends (next Monday 00:00 UTC).
 function weekId(d=new Date()){const t=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())),day=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-day);const y=t.getUTCFullYear();return `${y}-W${String(Math.ceil(((t-Date.UTC(y,0,1))/864e5+1)/7)).padStart(2,'0')}`}
 function weekEnd(d=new Date()){const t=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()));t.setUTCDate(t.getUTCDate()+((8-(t.getUTCDay()||7))%7||7));return t}
 function timeLeft(){const ms=Math.max(0,weekEnd()-Date.now()),d=Math.floor(ms/864e5),h=Math.floor(ms/36e5)%24,m=Math.floor(ms/6e4)%60;return d?`${d}d ${h}h`:h?`${h}h ${m}m`:`${m}m`}
 const clean=s=>String(s||'').replace(/[\u0000-\u001f<>]/g,'').replace(/\s+/g,' ').trim().slice(0,16);
 // First name and last initial unless the player picked a nickname.
 function displayName(){if(save.nick)return clean(save.nick)||'Player';const parts=clean(user&&user.displayName).split(' ').filter(Boolean);return parts.length?clean(parts[0]+(parts.length>1?` ${parts[parts.length-1][0]}.`:'')):'Player'}
 function changed(){refreshOnline()}
 function start(){if(!configured()||loading)return loading;status='loading';
  loading=(async()=>{try{const [A,U,F]=await Promise.all(['firebase-app','firebase-auth','firebase-firestore'].map(n=>import(SDK+n+'.js')));const app=A.initializeApp(FIREBASE_CONFIG);fb={U,F,auth:U.getAuth(app),db:F.getFirestore(app)};status='out';
   U.onAuthStateChanged(fb.auth,u=>{user=u;status=u?'in':'out';best.all=0;best.week=0;best.weekId='';changed();if(u)signedIn().catch(e=>console.warn('Online sync failed',e))});U.getRedirectResult(fb.auth).catch(()=>{})}
   catch(e){status='error';console.warn('Online play unavailable',e)}changed()})();return loading}
 // The popup must open straight from the tap, so nothing is awaited first once the SDK has loaded.
 async function signIn(){if(!configured())return;if(!fb)await start();if(!fb)return;const provider=new fb.U.GoogleAuthProvider();
  try{await fb.U.signInWithPopup(fb.auth,provider)}catch(e){const code=e&&e.code;if(code==='auth/popup-blocked'||code==='auth/operation-not-supported-in-this-environment')await fb.U.signInWithRedirect(fb.auth,provider);else if(code!=='auth/popup-closed-by-user'&&code!=='auth/cancelled-popup-request'){console.warn('Sign-in failed',e);throw e}}}
 async function signOut(){if(fb)await fb.U.signOut(fb.auth)}
 const ref=(...path)=>fb.F.doc(fb.db,...path);
 async function signedIn(){const {F}=fb,uid=user.uid;
  const cloud=await F.getDoc(ref('players',uid));if(cloud.exists()){try{mergeSave(JSON.parse(cloud.data().save))}catch{}}pushSave();
  await loadBests();await verifyClan().catch(e=>console.warn('Clan check failed',e));
  // Scores made on this device before signing in still count for the all-time board.
  let top=0,topStage=save.lastStage;for(const [id,v] of Object.entries(save.scores||{}))if(v>top){top=v;topStage=id}
  if(top>best.all){best.all=top;await putEntry(['leaders',uid],entry(top,topStage,save.skin)).catch(()=>{})}
  await claimWeekly();publishNow();changed()}
 async function loadBests(){const uid=user.uid,week=weekId(),[a,w]=await Promise.all([fb.F.getDoc(ref('leaders',uid)),fb.F.getDoc(ref('weekly',week,'leaders',uid))]);best.all=a.exists()?a.data().score:0;best.week=w.exists()?w.data().score:0;best.weekId=week}
 // Old rules (before profiles) only accept the basic fields, so a rejected entry is retried without the look.
const plain=e=>({name:e.name,score:e.score,stage:e.stage,skin:e.skin,at:e.at});
const putEntry=(path,e)=>fb.F.setDoc(ref(...path),e).catch(err=>fb.F.setDoc(ref(...path),plain(e)).catch(()=>{throw err}));
// Leaderboard entries carry the player's look so boards can show avatars, frames, gold names and clan tags.
const entry=(score,stageId,skin)=>{const lk=myLook();return {name:displayName(),score:Math.floor(score),stage:String(stageId).slice(0,12),skin:String(skin).slice(0,12),avatar:lk.avatar,frame:lk.frame,gold:lk.gold,clan:save.clan?save.clan.tag:'',at:fb.F.serverTimestamp()}};
 // Cloud save: unlocks and records merge (union and best of both); coins, lives and skin come from the newer save.
 function mergeSave(cloud){if(!cloud||typeof cloud!=='object')return;const num=(v,lo,hi)=>typeof v==='number'&&isFinite(v)?Math.min(hi,Math.max(lo,Math.floor(v))):null;
  if((cloud.updated||0)>(save.updated||0)){const c=num(cloud.coins,0,1e9),l=num(cloud.lives,0,MAX_LIVES),g=num(cloud.gems,0,1e6);if(c!==null)save.coins=c;if(g!==null)save.gems=g;if(l!==null)save.lives=l;if(SKINS[cloud.skin])save.skin=cloud.skin;save.updated=cloud.updated}
  save.skins=[...new Set([...(save.skins||[]),...(Array.isArray(cloud.skins)?cloud.skins:[])])].filter(id=>SKINS[id]);if(!save.skins.includes(save.skin))save.skin='classic';
  for(const k of ['best','scores','stars','bossWins']){save[k]=save[k]||{};for(const [id,v] of Object.entries(cloud[k]||{})){const n=num(v,0,1e9);if(n!==null&&STAGES.some(s=>s.id===id))save[k][id]=Math.max(save[k][id]||0,n)}}
  const cc=cloud.cos;if(cc&&typeof cc==='object'){const c=myCos();c.own=[...new Set([...c.own,...(Array.isArray(cc.own)?cc.own:[])])].filter(id=>AVATARS[id]||FRAMES[id]);c.goldOwned=c.goldOwned||!!cc.goldOwned;if((cloud.updated||0)>=(save.updated||0)){if(AVATARS[cc.avatar])c.avatar=cc.avatar;if(FRAMES[cc.frame])c.frame=cc.frame;c.gold=!!cc.gold}}
  if((cloud.updated||0)>(save.updated||0)){if(cloud.clan&&typeof cloud.clan==='object')save.clan=cloud.clan;if(cloud.clanReq&&typeof cloud.clanReq==='object')save.clanReq=cloud.clanReq}
  save.weeklyClaimed=[...new Set([...(save.weeklyClaimed||[]),...(Array.isArray(cloud.weeklyClaimed)?cloud.weeklyClaimed:[])])].slice(-12);if(!save.nick&&cloud.nick)save.nick=clean(cloud.nick);
  try{localStorage.setItem('skybound-save',JSON.stringify(save))}catch{}refreshMeta()}
 function saved(){if(!user)return;clearTimeout(saveTimer);saveTimer=setTimeout(pushSave,3000)}
 function pushSave(){if(!user||!fb)return;fb.F.setDoc(ref('players',user.uid),{save:JSON.stringify(save),at:fb.F.serverTimestamp()}).catch(()=>{})}
 // Post a finished run; resolves to the player's world and weekly ranks.
 async function submit(score,stageId,skin){if(!user||!fb)return null;const uid=user.uid,week=weekId(),jobs=[];if(best.weekId!==week){best.week=0;best.weekId=week}
  if(score>best.all){best.all=score;jobs.push(putEntry(['leaders',uid],entry(score,stageId,skin)))}
  if(score>best.week){best.week=score;jobs.push(putEntry(['weekly',week,'leaders',uid],entry(score,stageId,skin)))}
  await Promise.all(jobs.map(j=>j.catch(e=>console.warn('Score not saved',e))));if(jobs.length){publish();if(typeof clanBest==='function')clanBest(best.all).catch(()=>{})}
  const [all,wk]=await Promise.all([rankOf(['leaders'],best.all),rankOf(['weekly',week,'leaders'],best.week)]);return {all,week:wk,allBest:best.all,weekBest:best.week}}
 async function rankOf(path,score){if(!score)return null;try{const snap=await fb.F.getCountFromServer(fb.F.query(fb.F.collection(fb.db,...path),fb.F.where('score','>',score)));return snap.data().count+1}catch{return null}}
 async function top(board){if(!fb)return [];const path=board==='week'?['weekly',weekId(),'leaders']:['leaders'],snap=await fb.F.getDocs(fb.F.query(fb.F.collection(fb.db,...path),fb.F.orderBy('score','desc'),fb.F.limit(TOP)));return snap.docs.map(d=>({uid:d.id,...d.data()}))}
 // Weekly tournament: the first time a player signs in after a week ends, they get coins for their final rank.
 async function claimWeekly(){const last=weekId(new Date(Date.now()-7*864e5));save.weeklyClaimed=save.weeklyClaimed||[];if(save.weeklyClaimed.includes(last))return;
  const me=await fb.F.getDoc(ref('weekly',last,'leaders',user.uid));let rank=null;if(me.exists())rank=await rankOf(['weekly',last,'leaders'],me.data().score);
  save.weeklyClaimed.push(last);if(rank){const [,coins,gems]=REWARDS.find(([r])=>rank<=r);save.coins+=coins;save.gems=(save.gems||0)+gems;reward={rank,coins,gems,week:last};gameSound.effect('buy')}persist();refreshMeta()}
 async function rename(nick){const n=clean(nick);if(!n)return;save.nick=n;persist();await publishNow()}
 // Public profile: written after sign-in and whenever the name, look or clan changes; leaderboard entries
 // and the clan member card are refreshed with the same look.
 function publish(){if(!user||!fb)return;clearTimeout(publishTimer);publishTimer=setTimeout(publishNow,800)}
 async function publishNow(){if(!user||!fb)return;clearTimeout(publishTimer);const uid=user.uid,lk=myLook(),cl=save.clan,jobs=[];
  jobs.push(fb.F.setDoc(ref('profiles',uid),{name:displayName(),avatar:lk.avatar,frame:lk.frame,gold:lk.gold,clanId:cl?cl.id:'',clanTag:cl?cl.tag:'',clanName:cl?cl.name:'',best:Math.floor(best.all||0),skin:String(save.skin).slice(0,12),at:fb.F.serverTimestamp()}));
  if(best.all)jobs.push(putEntry(['leaders',uid],entry(best.all,save.lastStage,save.skin)));if(best.week&&best.weekId===weekId())jobs.push(putEntry(['weekly',best.weekId,'leaders',uid],entry(best.week,save.lastStage,save.skin)));
  if(cl)jobs.push(fb.F.updateDoc(ref('clans',cl.id,'members',uid),{name:displayName(),avatar:lk.avatar,frame:lk.frame,gold:lk.gold}));
  await Promise.all(jobs.map(j=>j.catch(e=>console.warn('Profile not saved',e))))}
 async function getProfile(uid){if(!fb)return null;const d=await fb.F.getDoc(ref('profiles',uid));return d.exists()?{uid,...d.data()}:null}
 // Clan membership lives in clans/{id}/members/{uid}; save.clan is this device's copy, checked on sign-in
 // (a kicked player is cleared, an accepted request becomes membership).
 async function verifyClan(){const uid=user.uid;let changedClan=false;
  if(save.clan){const [m,c]=await Promise.all([fb.F.getDoc(ref('clans',save.clan.id,'members',uid)),fb.F.getDoc(ref('clans',save.clan.id))]);if(!m.exists()||!c.exists()){save.clan=null}else{const d=c.data();save.clan={id:save.clan.id,name:d.name,tag:d.tag,role:m.data().role}}changedClan=true}
  if(save.clanReq&&!save.clan){const id=save.clanReq.id,[m,r,c]=await Promise.all([fb.F.getDoc(ref('clans',id,'members',uid)),fb.F.getDoc(ref('clans',id,'requests',uid)),fb.F.getDoc(ref('clans',id))]);if(m.exists()&&c.exists()){const d=c.data();save.clan={id,name:d.name,tag:d.tag,role:m.data().role};save.clanReq=null}else if(!r.exists()||!c.exists())save.clanReq=null;changedClan=true}
  if(changedClan){persist();refreshMeta()}}
 return {configured,start,signIn,signOut,submit,top,saved,rename,timeLeft,weekId,displayName,REWARDS,publish,publishNow,getProfile,verifyClan,get api(){return fb&&user?{F:fb.F,db:fb.db,ref,uid:user.uid}:null},get status(){return status},get user(){return user},get best(){return best},get reward(){return reward},takeReward(){const r=reward;reward=null;return r}};
})();

// ---- High score screens ----
const GOOGLE_G='<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
let ranksTab='week',ranksReq=0;
function googleButton(label='Sign in with Google'){const b=el('button','google-btn');b.innerHTML=`<span class="g">${GOOGLE_G}</span>`;b.append(el('span','',label));b.onclick=()=>online.signIn().catch(()=>{b.classList.add('nope')});return b}
// Menu account button, weekly banner and the results screen's rank line follow the online state.
function refreshOnline(full=true){const on=online.configured(),acc=$('#account'),u=online.user;acc.hidden=!on;
 if(on){acc.replaceChildren();if(u){acc.append(avatarEl(myLook(),40));acc.classList.add('signed');acc.setAttribute('aria-label','Profile: '+online.displayName())}else{acc.innerHTML=GOOGLE_G;acc.classList.remove('signed');acc.setAttribute('aria-label','Sign in with Google')}}
 if(full&&panelKind==='profile')renderProfile();if(full&&panelKind==='clan')renderClan();
 $('#weekly-title').textContent=on?'WEEKLY TOURNAMENT':'HIGH SCORES';$('#weekly-left').textContent=on?`${online.timeLeft()} LEFT`:'YOUR BESTS';
 if(full&&panelKind==='ranks')renderRanks();if(full&&!$('#results').hidden)resultsOnline();if(online.reward&&state==='menu'&&$('#panel').hidden)openPanel('ranks')}
function resultsOnline(rank){const box=$('#res-online');box.replaceChildren();if(!online.configured())return;
 if(!online.user){box.append(googleButton('Sign in to post your score'));return}
 if(rank===undefined&&results&&results.rank===undefined){postResult(results.score);return}
 if(rank===undefined)rank=results&&results.rank;if(rank===null||rank===undefined){box.append(el('span','res-rank wait','POSTING SCORE…'));return}
 const add=(ic,label,v)=>{const s=el('span','res-rank');s.innerHTML=iconHTML(ic);s.append(el('b','',v?`#${v.toLocaleString()}`:'—'),el('small','',label));box.append(s)};add('planet','WORLD',rank.all);add('trophy','THIS WEEK',rank.week)}
function postResult(score){if(!online.user)return;results.rank=null;resultsOnline(null);const mine=results;online.submit(score,stage.id,save.skin).then(r=>{if(results===mine){results.rank=r||{all:null,week:null};resultsOnline(results.rank)}})}
function renderRanks(){const list=$('#panel-list'),on=online.configured();$('#panel-title').textContent='HIGH SCORES';list.replaceChildren();
 const r=online.takeReward&&online.takeReward();if(r){const b=el('div','reward-banner');b.innerHTML=iconHTML('trophy');b.append(el('div','',''));b.lastChild.append(el('b','',`LAST WEEK YOU PLACED #${r.rank}!`),el('span','',`Tournament reward: +${r.coins} coins${r.gems?` and +${r.gems} gems`:''}`));list.append(b);confetti(30)}
 if(!on)ranksTab='mine';
 const tabs=el('div','tabs rank-tabs');for(const [id,label,ic] of [['week','WEEKLY','trophy'],['all','ALL TIME','planet'],['mine','MY BESTS','star']]){if(!on&&id!=='mine')continue;const b=el('button','tab'+(ranksTab===id?' on':''));b.innerHTML=iconHTML(ic)+label;b.onclick=()=>{ranksTab=id;renderRanks()};tabs.append(b)}list.append(tabs);
 if(ranksTab==='mine'){const box=el('div','rank-list');for(const s of STAGES){const st=save.stars[s.id]||0,row=el('div','rank-row stage-row'),ico=el('span','ico');ico.innerHTML=icon(s.icon);const trio=el('span','star-trio');trio.innerHTML=[0,1,2].map(k=>iconHTML('star',k<st?'':'off',k===1?'mid':'')).join('');row.append(ico,el('b','rank-name',s.name),trio,el('b','rank-score',(save.scores[s.id]||0).toLocaleString()));box.append(row)}list.append(box);
  if(!on)list.append(el('p','rank-note','Worldwide and weekly leaderboards with Google sign-in switch on once the game is connected to Firebase (see README).'));return}
 if(ranksTab==='week'){const info=el('div','week-info');info.innerHTML=iconHTML('trophy');info.append(el('div',''));info.lastChild.append(el('b','',`ENDS IN ${online.timeLeft()}`),el('span','',`TOP 10 WIN GEMS! 1st: 50 gems + 1000 coins · 2nd: 30 + 750 · 3rd: 20 + 500 · 4th-10th: 10 + 300 · everyone: 50 coins`));list.append(info)}
 const box=el('div','rank-list');box.append(el('p','rank-note',online.status==='error'?'Could not reach the leaderboard. Check your connection.':'Loading…'));list.append(box);
 const foot=el('div','rank-foot');if(online.user){const me=el('div','me'),lk=myLook();me.append(avatarEl(lk,32),nameEl(online.displayName(),lk.gold,save.clan&&save.clan.tag,''));const edit=el('button','mini-btn','RENAME');edit.onclick=()=>{const n=prompt('Leaderboard name (up to 16 letters)',online.displayName());if(n!==null)online.rename(n).then(()=>renderRanks())};const out=el('button','mini-btn','SIGN OUT');out.onclick=()=>online.signOut();me.append(edit,out);foot.append(me,el('small','','Your first name and last initial show on the leaderboard unless you rename yourself.'))}else foot.append(googleButton(),el('small','','Sign in to post your scores, save your progress and join the weekly tournament.'));list.append(foot);
 const req=++ranksReq,board=ranksTab;
 Promise.resolve(online.start()).then(()=>online.top(board)).then(rows=>{if(req!==ranksReq||panelKind!=='ranks')return;box.replaceChildren();if(!rows.length){box.append(el('p','rank-note',board==='week'?'No scores yet this week. Be the first!':'No scores yet. Be the first!'));return}
  const uid=online.user&&online.user.uid;rows.forEach((e,i)=>{const row=el('div','rank-row'+(e.uid===uid?' me':'')+(i<3?' top':'')),pos=el('span','rank-pos');if(i<3)pos.innerHTML=icon('medal',['gold','silver','bronze'][i]);else pos.textContent=i+1;const st=STAGES.find(s=>s.id===e.stage),si=el('span','ico');si.innerHTML=st?icon(st.icon):'';row.append(pos,avatarEl(e,32),nameEl(e.name,e.gold,e.clan),si,el('b','rank-score',(e.score||0).toLocaleString()));row.onclick=()=>showProfile(e.uid);box.append(row)});
  const myBest=board==='week'?online.best.week:online.best.all;if(uid&&myBest&&!rows.some(e=>e.uid===uid)){const row=el('div','rank-row me'),pos=el('span','rank-pos','…'),lk=myLook();row.append(pos,avatarEl(lk,32),nameEl(online.displayName(),lk.gold,save.clan&&save.clan.tag),el('span','ico'),el('b','rank-score',myBest.toLocaleString()));box.append(row)}})
  .catch(e=>{if(req!==ranksReq)return;console.warn(e);box.replaceChildren(el('p','rank-note','Could not load the leaderboard right now.'))})}
online.start();refreshOnline();setInterval(()=>{if(state==='menu')refreshOnline(false)},30000);
