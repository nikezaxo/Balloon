'use strict';
// Online play through Firebase: Google sign-in, cloud save, worldwide and weekly leaderboards and a weekly
// tournament with coin rewards. It stays off until firebase-config.js holds a project config; until then
// the high score panel shows this device's bests. Firestore layout (see firestore.rules):
//   leaders/{uid}                best score ever      {name, score, stage, skin, at}
//   weekly/{week}/leaders/{uid}  best score that week {name, score, stage, skin, at}; weeks run Monday to Sunday UTC
//   players/{uid}                cloud save           {save, at}
//   profiles/{uid}               public profile       {name, avatar, frame, gold, clanId, clanTag, clanName, best, skin, at,
//                                                     scores, stars, bosses, seasonId, sp, legend, hist, items} (stats for player cards)
//   clans/{id}, clans/{id}/members/{uid}, clans/{id}/requests/{uid}   clans (see clans.js)
//   freerun/{uid}                best Free Run score  {name, score, stage reached, skin, look, at}
//   usernames/{name lower case}  claimed username     {uid, name, at}; one player per name
//   seasons/{S#}/players/{uid}   season points      {name, sp, avatar, frame, gold, clan, at}; seasons are months (see season.js)
const online=(()=>{
 const SDK='https://www.gstatic.com/firebasejs/12.19.0/',TOP=50;
 // Weekly tournament prizes by final rank: [rank, coins, gems]. Gems only go to the top 10.
 const REWARDS=[[1,1000,50],[2,750,30],[3,500,20],[10,300,10],[50,150,0],[Infinity,50,0]];
 let fb=null,user=null,loading=null,status='off',saveTimer=0,reward=null,publishTimer=0;
 // New players are guests (signed out, progress on this device only). intent is 'signup' or 'login' for the
 // sign-in in progress; ready turns on once the account is confirmed and merged, and nothing is written before.
 let intent=null,ready=false;
 const best={all:0,week:0,weekId:'',free:0};
 const boardPath=board=>board==='week'?['weekly',weekId(),'leaders']:board==='free'?['freerun']:['leaders'];
 const configured=()=>typeof FIREBASE_CONFIG==='object'&&!!FIREBASE_CONFIG&&!!FIREBASE_CONFIG.apiKey;
 // ISO week id in UTC, e.g. 2026-W41, and the moment the current week ends (next Monday 00:00 UTC).
 function weekId(d=new Date()){const t=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())),day=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-day);const y=t.getUTCFullYear();return `${y}-W${String(Math.ceil(((t-Date.UTC(y,0,1))/864e5+1)/7)).padStart(2,'0')}`}
 function weekEnd(d=new Date()){const t=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()));t.setUTCDate(t.getUTCDate()+((8-(t.getUTCDay()||7))%7||7));return t}
 function timeLeft(){const ms=Math.max(0,weekEnd()-Date.now()),d=Math.floor(ms/864e5),h=Math.floor(ms/36e5)%24,m=Math.floor(ms/6e4)%60;return d?`${d}d ${h}h`:h?`${h}h ${m}m`:`${m}m`}
 const clean=s=>String(s||'').replace(/[\u0000-\u001f<>]/g,'').replace(/\s+/g,' ').trim().slice(0,16);
 // Guests are "Guest"; members use their username, or their first name and last initial until they pick one.
 function displayName(){if(!user)return 'Guest';if(save.nick)return clean(save.nick)||'Player';const parts=clean(user&&user.displayName).split(' ').filter(Boolean);return parts.length?clean(parts[0]+(parts.length>1?` ${parts[parts.length-1][0]}.`:'')):'Player'}
 function changed(){refreshOnline();if((status==='out'||status==='error')&&typeof seasonCheck==='function')seasonCheck()}
 function start(){if(!configured()||loading)return loading;status='loading';
  loading=(async()=>{try{const [A,U,F]=await Promise.all(['firebase-app','firebase-auth','firebase-firestore'].map(n=>import(SDK+n+'.js')));const app=A.initializeApp(FIREBASE_CONFIG);fb={U,F,auth:U.getAuth(app),db:F.getFirestore(app)};status='out';
   U.onAuthStateChanged(fb.auth,u=>{user=u;ready=false;status=u?'in':'out';best.all=0;best.week=0;best.weekId='';best.free=0;changed();if(u)signedIn().catch(e=>console.warn('Online sync failed',e))});U.getRedirectResult(fb.auth).catch(()=>{})}
   catch(e){status='error';console.warn('Online play unavailable',e)}changed()})();return loading}
 // The popup must open straight from the tap, so nothing is awaited first once the SDK has loaded.
 async function signIn(mode='login'){if(!configured())return;if(!fb)await start();if(!fb)return;intent=mode;const provider=new fb.U.GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});
  try{await fb.U.signInWithPopup(fb.auth,provider)}catch(e){const code=e&&e.code;if(code==='auth/popup-blocked'||code==='auth/operation-not-supported-in-this-environment')await fb.U.signInWithRedirect(fb.auth,provider);else if(code!=='auth/popup-closed-by-user'&&code!=='auth/cancelled-popup-request'){console.warn('Sign-in failed',e);throw e}}}
 // Signing out saves the latest progress to the account, then leaves no trace of it on this device: the game
 // restarts as a fresh guest. Logging in again brings the records and items back.
 async function signOut(){if(!fb)return;if(user&&ready){clearTimeout(saveTimer);await fb.F.setDoc(ref('players',user.uid),{save:JSON.stringify(save),at:fb.F.serverTimestamp()}).catch(e=>console.warn('Last save failed',e))}
  ready=false;await fb.U.signOut(fb.auth);const keep={tut:save.tut==='on'?'done':(save.tut||'done'),swiped:!!save.swiped};try{localStorage.setItem('skybound-save',JSON.stringify(keep))}catch{}location.reload()}
 const ref=(...path)=>fb.F.doc(fb.db,...path);
 async function signedIn(){const {F}=fb,uid=user.uid,mode=intent;intent=null;
  const cloud=await F.getDoc(ref('players',uid));let data=null;if(cloud.exists()){try{data=JSON.parse(cloud.data().save)}catch{}data=data&&typeof data==='object'?data:{}}
  // Signing up with a Google account that already has an account: ask before using it.
  if(mode==='signup'&&data){const scores=Object.values(data.scores||{}).map(Number).filter(v=>isFinite(v)),go=typeof accountChoice==='function'?await accountChoice({name:clean(data.nick)||firstName()||'your account',best:scores.length?Math.max(...scores):0}):true;
   if(!go){await fb.U.signOut(fb.auth);return}}
  if(!user||user.uid!==uid)return;
  // A username claimed by another account on this device does not carry over.
  if(save.nickUid&&save.nickUid!==uid){delete save.nick;delete save.nickKey;delete save.nickUid}
  if(data)mergeSave(data);ready=true;pushSave();
  await loadBests();await verifyClan().catch(e=>console.warn('Clan check failed',e));if(typeof seasonCheck==='function')seasonCheck();seasonPush();
  // Scores made on this device before signing in still count for the all-time board.
  let top=0,topStage=save.lastStage;for(const [id,v] of Object.entries(save.scores||{}))if(v>top){top=v;topStage=id}
  if(top>best.all){best.all=top;await putEntry(['leaders',uid],entry(top,topStage,save.skin)).catch(()=>{})}
  if((save.freeBest||0)>best.free){best.free=save.freeBest;await putEntry(['freerun',uid],entry(save.freeBest,'sky',save.skin)).catch(()=>{})}
  await claimWeekly();publishNow();changed();
  // New accounts, and accounts without a username signing in on purpose, pick a username.
  if(!save.nickKey&&(mode||!data)&&typeof chooseName==='function')chooseName({fresh:true,current:suggestName()})}
 function firstName(){return clean(user&&user.displayName).split(' ')[0]||''}
 function suggestName(){const f=firstName().replace(/[^\p{L}\p{N} _.\-]/gu,'').slice(0,12);return f.length>=2?f:'Pilot'+Math.floor(100+Math.random()*900)}
 // Usernames are unique: usernames/{name in lower case} holds the owner's uid. Taking a new one frees the old one.
 const nameKey=n=>clean(n).toLowerCase();
 async function claimName(raw){const n=clean(raw);if(!user||!fb||!ready)throw new Error('Sign up first to pick a username.');const {F}=fb,uid=user.uid,key=nameKey(n),old=save.nickUid===uid?save.nickKey:'';let checked=true;
  try{await F.runTransaction(fb.db,async tx=>{const d=await tx.get(ref('usernames',key)),od=old&&old!==key?await tx.get(ref('usernames',old)):null;if(d.exists()&&d.data().uid!==uid)throw new Error('taken');
    tx.set(ref('usernames',key),{uid,name:n,at:F.serverTimestamp()});if(od&&od.exists()&&od.data().uid===uid)tx.delete(ref('usernames',old))})}
  catch(e){if(e&&e.message==='taken')throw new Error(`"${n}" is already taken. Please choose another name.`);if(e&&e.code==='permission-denied'){checked=false;console.warn('Username check unavailable (publish firestore.rules)',e)}else throw new Error('Could not save your name right now. Check your connection and try again.')}
  save.nick=n;if(checked){save.nickKey=key;save.nickUid=uid}persist();changed();await publishNow()}
 async function loadBests(){const uid=user.uid,week=weekId(),[a,w,f]=await Promise.all([fb.F.getDoc(ref('leaders',uid)),fb.F.getDoc(ref('weekly',week,'leaders',uid)),fb.F.getDoc(ref('freerun',uid)).catch(()=>null)]);best.all=a.exists()?a.data().score:0;best.week=w.exists()?w.data().score:0;best.weekId=week;best.free=f&&f.exists()?f.data().score:0}
 // Old rules (before profiles) only accept the basic fields, so a rejected entry is retried without the look.
const plain=e=>({name:e.name,score:e.score,stage:e.stage,skin:e.skin,at:e.at});
const putEntry=(path,e)=>fb.F.setDoc(ref(...path),e).catch(err=>fb.F.setDoc(ref(...path),plain(e)).catch(()=>{throw err}));
// Leaderboard entries carry the player's look so boards can show avatars, frames, gold names and clan tags.
const entry=(score,stageId,skin)=>{const lk=myLook();return {name:displayName(),score:Math.floor(score),stage:String(stageId).slice(0,12),skin:String(skin).slice(0,12),avatar:lk.avatar,frame:lk.frame,gold:lk.gold,clan:save.clan?save.clan.tag:'',at:fb.F.serverTimestamp()}};
 // Cloud save: unlocks and records merge (union and best of both); coins, lives and skin come from the newer save.
 function mergeSave(cloud){if(!cloud||typeof cloud!=='object')return;const newer=(cloud.updated||0)>(save.updated||0),num=(v,lo,hi)=>typeof v==='number'&&isFinite(v)?Math.min(hi,Math.max(lo,Math.floor(v))):null;
  if((cloud.updated||0)>(save.updated||0)){const c=num(cloud.coins,0,1e9),l=num(cloud.lives,0,MAX_LIVES),g=num(cloud.gems,0,1e6);if(c!==null)save.coins=c;if(g!==null)save.gems=g;if(l!==null)save.lives=l;if(SKINS[cloud.skin])save.skin=cloud.skin;save.updated=cloud.updated}
  save.skins=[...new Set([...(save.skins||[]),...(Array.isArray(cloud.skins)?cloud.skins:[])])].filter(id=>SKINS[id]);if(!save.skins.includes(save.skin))save.skin='classic';
  for(const k of ['best','scores','stars','bossWins']){save[k]=save[k]||{};for(const [id,v] of Object.entries(cloud[k]||{})){const n=num(v,0,1e9);if(n!==null&&STAGES.some(s=>s.id===id))save[k][id]=Math.max(save[k][id]||0,n)}}
  const cc=cloud.cos;if(cc&&typeof cc==='object'){const c=myCos();c.own=[...new Set([...c.own,...(Array.isArray(cc.own)?cc.own:[])])].filter(id=>AVATARS[id]||FRAMES[id]);c.goldOwned=c.goldOwned||!!cc.goldOwned;if((cloud.updated||0)>=(save.updated||0)){if(AVATARS[cc.avatar])c.avatar=cc.avatar;if(FRAMES[cc.frame])c.frame=cc.frame;c.gold=!!cc.gold}}
  if((cloud.updated||0)>(save.updated||0)){if(cloud.clan&&typeof cloud.clan==='object')save.clan=cloud.clan;if(cloud.clanReq&&typeof cloud.clanReq==='object')save.clanReq=cloud.clanReq}
  // Free Run records keep the best of both; cleared campaign stages add up.
  for(const k of ['freeBest','freeAlt']){const n=num(cloud[k],0,1e9);if(n!==null)save[k]=Math.max(save[k]||0,n)}
  if(cloud.cleared&&typeof cloud.cleared==='object'){save.cleared=save.cleared||{};for(const id of Object.keys(cloud.cleared))if(STAGES.some(st=>st.id===id)&&cloud.cleared[id])save.cleared[id]=true}
  // Skin cards keep the most of each; unopened boxes come from the newer save, like coins.
  if(cloud.cards&&typeof cloud.cards==='object'){save.cards={...(save.cards||{})};for(const [id,v] of Object.entries(cloud.cards)){const n=num(v,0,1000);if(n!==null&&SKINS[id])save.cards[id]=Math.max(save.cards[id]||0,n)}}
  if(newer&&cloud.boxes&&typeof cloud.boxes==='object'){const b={};for(const k of ['sky','storm','legend']){const n=num(cloud.boxes[k],0,999);if(n)b[k]=n}save.boxes=b}
  save.weeklyClaimed=[...new Set([...(save.weeklyClaimed||[]),...(Array.isArray(cloud.weeklyClaimed)?cloud.weeklyClaimed:[])])].slice(-12);if(!save.nick&&cloud.nick)save.nick=clean(cloud.nick);if(!save.nickKey&&typeof cloud.nickKey==='string'&&user&&cloud.nickUid===user.uid){save.nickKey=cloud.nickKey;save.nickUid=cloud.nickUid;save.nick=clean(cloud.nick)}
  if(typeof mergeSeason==='function')try{mergeSeason(cloud)}catch(e){console.warn('Season merge failed',e)}
  try{localStorage.setItem('skybound-save',JSON.stringify(save))}catch{}refreshMeta()}
 function saved(){if(!user||!ready)return;clearTimeout(saveTimer);saveTimer=setTimeout(pushSave,3000)}
 function pushSave(){if(!user||!fb||!ready)return;fb.F.setDoc(ref('players',user.uid),{save:JSON.stringify(save),at:fb.F.serverTimestamp()}).catch(()=>{})}
 // Post a finished run; resolves to the player's world and weekly ranks.
 // Campaign runs go on the all-time and weekly boards; Free Run runs on the Free Run board.
 async function submit(score,stageId,skin,mode='campaign'){if(!user||!fb||!ready)return null;const uid=user.uid,week=weekId(),jobs=[];
  if(mode==='free'){if(score>best.free){best.free=score;await putEntry(['freerun',uid],entry(score,stageId,skin)).catch(e=>console.warn('Score not saved',e));publish()}return {free:await rankOf(['freerun'],best.free),freeBest:best.free}}if(best.weekId!==week){best.week=0;best.weekId=week}
  if(score>best.all){best.all=score;jobs.push(putEntry(['leaders',uid],entry(score,stageId,skin)))}
  if(score>best.week){best.week=score;jobs.push(putEntry(['weekly',week,'leaders',uid],entry(score,stageId,skin)))}
  await Promise.all(jobs.map(j=>j.catch(e=>console.warn('Score not saved',e))));publish();if(jobs.length&&typeof clanBest==='function')clanBest(best.all).catch(()=>{})
  const [all,wk]=await Promise.all([rankOf(['leaders'],best.all),rankOf(['weekly',week,'leaders'],best.week)]);return {all,week:wk,allBest:best.all,weekBest:best.week}}
 async function rankOf(path,score){if(!score)return null;try{const snap=await fb.F.getCountFromServer(fb.F.query(fb.F.collection(fb.db,...path),fb.F.where('score','>',score)));return snap.data().count+1}catch{return null}}
 async function top(board){if(!fb)return [];const path=boardPath(board),snap=await fb.F.getDocs(fb.F.query(fb.F.collection(fb.db,...path),fb.F.orderBy('score','desc'),fb.F.limit(TOP)));return snap.docs.map(d=>({uid:d.id,...d.data()}))}
 // Weekly tournament: the first time a player signs in after a week ends, they get coins for their final rank.
 async function claimWeekly(){const last=weekId(new Date(Date.now()-7*864e5));save.weeklyClaimed=save.weeklyClaimed||[];if(save.weeklyClaimed.includes(last))return;
  const me=await fb.F.getDoc(ref('weekly',last,'leaders',user.uid));let rank=null;if(me.exists())rank=await rankOf(['weekly',last,'leaders'],me.data().score);
  save.weeklyClaimed.push(last);if(rank){const [,coins,gems]=REWARDS.find(([r])=>rank<=r);save.coins+=coins;save.gems=(save.gems||0)+gems;reward={rank,coins,gems,week:last};gameSound.effect('buy')}persist();refreshMeta()}
 // A guest's place if they signed up: how many players are ahead of this score on a board.
 async function rankFor(board,score){if(!score)return null;await start();if(!fb)return null;return rankOf(boardPath(board),score)}
 // Public profile: written after sign-in and whenever the name, look or clan changes; leaderboard entries
 // and the clan member card are refreshed with the same look.
 function publish(){if(!user||!fb)return;clearTimeout(publishTimer);publishTimer=setTimeout(publishNow,800)}
 async function publishNow(){if(!user||!fb||!ready)return;clearTimeout(publishTimer);const uid=user.uid,lk=myLook(),cl=save.clan,jobs=[];
  // Older rules only accept the basic profile, so a rejected profile is retried without the stats.
  const basic={name:displayName(),avatar:lk.avatar,frame:lk.frame,gold:lk.gold,clanId:cl?cl.id:'',clanTag:cl?cl.tag:'',clanName:cl?cl.name:'',best:Math.floor(best.all||0),skin:String(save.skin).slice(0,12),at:fb.F.serverTimestamp()};
  jobs.push(fb.F.setDoc(ref('profiles',uid),{...basic,...profileStats()}).catch(err=>fb.F.setDoc(ref('profiles',uid),basic).catch(()=>{throw err})));
  if(best.all)jobs.push(putEntry(['leaders',uid],entry(best.all,save.lastStage,save.skin)));if(best.week&&best.weekId===weekId())jobs.push(putEntry(['weekly',best.weekId,'leaders',uid],entry(best.week,save.lastStage,save.skin)));
  if(cl)jobs.push(fb.F.updateDoc(ref('clans',cl.id,'members',uid),{name:displayName(),avatar:lk.avatar,frame:lk.frame,gold:lk.gold}));
  jobs.push(seasonPush());await Promise.all(jobs.map(j=>j.catch(e=>console.warn('Profile not saved',e))))}
 // Season ranking: each player's season points with their look; a count query finds a player's place.
 let seasonTimer=0,seasonSent='';
 // New season points refresh the profile too (publishNow then pushes the season entry).
 function seasonSync(){if(!user||!fb)return;clearTimeout(seasonTimer);seasonTimer=setTimeout(publishNow,1500)}
 // Writes the season entry only when the points, name or look changed since the last write; a player past
 // Diamond I also checks whether they are in the top 1,000 (Star Legend).
 async function seasonPush(){if(!user||!fb||!ready||typeof seasonState!=='function')return;const s=seasonState(),lk=myLook(),doc={name:displayName(),sp:Math.floor(s.sp),avatar:lk.avatar,frame:lk.frame,gold:lk.gold,clan:save.clan?save.clan.tag:''},key=s.id+JSON.stringify(doc);if(!s.sp)return;
  if(seasonSent!==key)try{await fb.F.setDoc(ref('seasons',s.id,'players',user.uid),{...doc,at:fb.F.serverTimestamp()});seasonSent=key}
  catch(e){console.warn('Season points not saved',e);return}
  if(s.sp>=LEGEND_MIN){const r=await seasonRank(s.id,s.sp);if(r!==null)seasonLegend(r<=LEGEND_TOP,s.id)}else if(s.legend)seasonLegend(false,s.id)}
 async function seasonTop(id){if(!fb)return [];const snap=await fb.F.getDocs(fb.F.query(fb.F.collection(fb.db,'seasons',id,'players'),fb.F.orderBy('sp','desc'),fb.F.limit(TOP)));return snap.docs.map(d=>({uid:d.id,...d.data()}))}
 async function seasonRank(id,sp){if(!fb||!sp)return null;try{const snap=await fb.F.getCountFromServer(fb.F.query(fb.F.collection(fb.db,'seasons',id,'players'),fb.F.where('sp','>',sp)));return snap.data().count+1}catch{return null}}
 // Public stats for player cards: stage high scores and stars, bosses beaten, this season's points and rank,
 // past season finishes (id:tier:points) and how many season reward items the player owns.
 function profileStats(){const per=(o,max)=>{const m={};for(const s of STAGES){const v=Math.floor(Number((o||{})[s.id])||0);if(v>0)m[s.id]=Math.min(max,v)}return m},s=typeof seasonState==='function'?seasonState():null;
  return {scores:per(save.scores,1e8),stars:per(save.stars,3),bosses:Math.min(1e6,Object.values(save.bossWins||{}).reduce((a,v)=>a+(Math.floor(v)||0),0)),seasonId:s?s.id:'S1',sp:s?Math.min(1e7,Math.floor(s.sp)):0,legend:!!(s&&s.legend),
   hist:(save.seasonHistory||[]).slice(-8).map(h=>`${h.id}:${h.ti}:${h.sp}`).join(',').slice(0,200),free:Math.min(1e8,Math.floor(save.freeBest||0)),items:Math.min(100,save.skins.filter(id=>SKINS[id]&&SKINS[id].season).length+myCos().own.filter(id=>(AVATARS[id]||FRAMES[id]||{}).season).length)}}
 // The signed-in player's own card, straight from this device.
 function myCard(){const cl=save.clan;return {name:displayName(),...myLook(),clanTag:cl?cl.tag:'',clanName:cl?cl.name:'',best:Math.max(best.all||0,...Object.values(save.scores||{})),skin:save.skin,...profileStats()}}
 // Current looks for a list of players, read from their public profiles (30 per query, cached for a minute).
 const lookCache=new Map();
 async function looks(uids){if(!fb)return {};const now=Date.now(),need=[...new Set(uids)].filter(u=>u&&(!lookCache.has(u)||now-lookCache.get(u).t>60000));
  for(let i=0;i<need.length;i+=30){const part=need.slice(i,i+30);try{const snap=await fb.F.getDocs(fb.F.query(fb.F.collection(fb.db,'profiles'),fb.F.where(fb.F.documentId(),'in',part)));for(const d of snap.docs)lookCache.set(d.id,{t:now,...d.data()})}catch(e){console.warn('Profiles unavailable',e)}for(const u of part)if(!lookCache.has(u))lookCache.set(u,{t:now,none:true})}
  const out={};for(const u of uids){const v=lookCache.get(u);if(v&&!v.none)out[u]=v}return out}
 async function getProfile(uid){if(!fb)return null;const d=await fb.F.getDoc(ref('profiles',uid));return d.exists()?{uid,...d.data()}:null}
 // Clan membership lives in clans/{id}/members/{uid}; save.clan is this device's copy, checked on sign-in
 // (a kicked player is cleared, an accepted request becomes membership).
 async function verifyClan(){const uid=user.uid;let changedClan=false;
  if(save.clan){const [m,c]=await Promise.all([fb.F.getDoc(ref('clans',save.clan.id,'members',uid)),fb.F.getDoc(ref('clans',save.clan.id))]);if(!m.exists()||!c.exists()){save.clan=null}else{const d=c.data();save.clan={id:save.clan.id,name:d.name,tag:d.tag,role:m.data().role}}changedClan=true}
  if(save.clanReq&&!save.clan){const id=save.clanReq.id,[m,r,c]=await Promise.all([fb.F.getDoc(ref('clans',id,'members',uid)),fb.F.getDoc(ref('clans',id,'requests',uid)),fb.F.getDoc(ref('clans',id))]);if(m.exists()&&c.exists()){const d=c.data();save.clan={id,name:d.name,tag:d.tag,role:m.data().role};save.clanReq=null}else if(!r.exists()||!c.exists())save.clanReq=null;changedClan=true}
  if(changedClan){persist();refreshMeta()}}
 return {configured,start,signIn,signOut,submit,top,saved,claimName,rankFor,get ready(){return ready},seasonSync,seasonTop,seasonRank,myCard,timeLeft,weekId,displayName,REWARDS,publish,publishNow,getProfile,looks,verifyClan,get api(){return fb&&user?{F:fb.F,db:fb.db,ref,uid:user.uid}:null},get status(){return status},get user(){return user},get best(){return best},get reward(){return reward},takeReward(){const r=reward;reward=null;return r}};
})();

// ---- High score screens ----
const GOOGLE_G='<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
let ranksTab='week',ranksReq=0;
function googleButton(label='SIGN UP',mode='signup'){const b=el('button','google-btn');b.innerHTML=`<span class="g">${GOOGLE_G}</span>`;b.append(el('span','',label));b.onclick=()=>online.signIn(mode).catch(()=>{b.classList.add('nope')});return b}
// Menu account button, weekly banner and the results screen's rank line follow the online state.
function refreshOnline(full=true){const on=online.configured();
 if(full&&panelKind==='profile')renderProfile();if(full&&panelKind==='clan')renderClan();if(full&&panelKind==='settings')renderSettings();
 $('#weekly-title').textContent='RANKS';const left=$('#weekly-left');left.textContent=on?online.timeLeft():'';left.hidden=!on;
 if(full&&panelKind==='ranks')renderRanks();if(full&&!$('#results').hidden)resultsOnline();if(online.reward&&state==='menu'&&$('#panel').hidden)openPanel('ranks')}
function resultsOnline(rank){const box=$('#res-online');box.replaceChildren();if(!online.configured())return;
 if(!online.user){const sc=results&&results.score;box.append(googleButton('SIGN UP TO POST YOUR SCORE','signup'));const fr=runMode==='free';if(sc)online.rankFor(fr?'free':'week',sc).then(r=>{if(!r||online.user||!box.isConnected)return;const s=el('span','res-rank');s.innerHTML=iconHTML(fr?'rocket':'trophy');s.append(el('b','',`#${r.toLocaleString()}`),el('small','',fr?'FREE RUN IF YOU SIGN UP':'THIS WEEK IF YOU SIGN UP'));box.prepend(s)}).catch(()=>{});return}
 if(rank===undefined&&results&&results.rank===undefined){postResult(results.score);return}
 if(rank===undefined)rank=results&&results.rank;if(rank===null||rank===undefined){box.append(el('span','res-rank wait','POSTING SCORE…'));return}
 box.append(avatarEl(myLook(),30));const add=(ic,label,v)=>{const s=el('span','res-rank');s.innerHTML=iconHTML(ic);s.append(el('b','',v?`#${v.toLocaleString()}`:'—'),el('small','',label));box.append(s)};if(rank.freeBest!==undefined)add('rocket','FREE RUN',rank.free);else{add('planet','WORLD',rank.all);add('trophy','THIS WEEK',rank.week)}}
function postResult(score){if(!online.user)return;results.rank=null;resultsOnline(null);const mine=results;online.submit(score,stage.id,save.skin,runMode).then(r=>{if(results===mine){results.rank=r||{all:null,week:null};resultsOnline(results.rank)}})}
function renderRanks(){const list=$('#panel-list'),on=online.configured();$('#panel-title').textContent='HIGH SCORES';list.replaceChildren();
 const r=online.takeReward&&online.takeReward();if(r){const b=el('div','reward-banner');b.innerHTML=iconHTML('trophy');b.prepend(avatarEl(myLook(),40));b.append(el('div','',''));b.lastChild.append(el('b','',`LAST WEEK YOU PLACED #${r.rank}!`),el('span','',`Tournament reward: +${r.coins} coins${r.gems?` and +${r.gems} gems`:''}`));list.append(b);confetti(30)}
 if(!on)ranksTab='mine';
 const tabs=el('div','tabs rank-tabs');for(const [id,label,ic] of [['week','WEEKLY','trophy'],['all','ALL TIME','planet'],['free','FREE RUN','rocket'],['mine','MY BESTS','star']]){if(!on&&id!=='mine')continue;const b=el('button','tab'+(ranksTab===id?' on':''));b.innerHTML=iconHTML(ic)+label;b.onclick=()=>{ranksTab=id;renderRanks()};tabs.append(b)}list.append(tabs);
 if(ranksTab==='mine'){const box=el('div','rank-list'),lk=myLook(),me=el('div','rank-row me mine-head');me.append(avatarEl(lk,40),nameEl(online.displayName(),lk.gold,save.clan&&save.clan.tag),el('b','rank-score',Math.max(0,...Object.values(save.scores||{})).toLocaleString()));me.onclick=()=>openPanel('profile');box.append(me);for(const s of STAGES){const st=save.stars[s.id]||0,row=el('div','rank-row stage-row'),ico=el('span','ico');ico.innerHTML=icon(s.icon);const trio=el('span','star-trio');trio.innerHTML=[0,1,2].map(k=>iconHTML('star',k<st?'':'off',k===1?'mid':'')).join('');row.append(ico,el('b','rank-name',s.name),trio,el('b','rank-score',(save.scores[s.id]||0).toLocaleString()));box.append(row)}{const row=el('div','rank-row stage-row'),ico=el('span','ico');ico.innerHTML=icon('rocket');row.append(ico,el('b','rank-name','FREE RUN'),el('b','rank-score',(save.freeBest||0).toLocaleString()));box.append(row)}list.append(box);
  if(!on)list.append(el('p','rank-note','Worldwide and weekly leaderboards with Google sign-in switch on once the game is connected to Firebase (see README).'));return}
 if(ranksTab==='free')list.append(el('p','rank-note','FREE RUN: one endless run through all six stages. Ranked by highest score.'));
 if(ranksTab==='week'){const info=el('div','week-info');info.innerHTML=iconHTML('trophy');info.append(el('div',''));info.lastChild.append(el('b','',`ENDS IN ${online.timeLeft()}`),el('span','',`TOP 10 WIN GEMS! 1st: 50 gems + 1000 coins · 2nd: 30 + 750 · 3rd: 20 + 500 · 4th-10th: 10 + 300 · everyone: 50 coins`));list.append(info)}
 const box=el('div','rank-list');box.append(el('p','rank-note',online.status==='error'?'Could not reach the leaderboard. Check your connection.':'Loading…'));list.append(box);
 // Members see themselves; guests can look at everything and see where their best would place, then sign up.
 const foot=el('div','rank-foot');if(online.user){const me=el('div','me'),lk=myLook();me.append(avatarEl(lk,32),nameEl(online.displayName(),lk.gold,save.clan&&save.clan.tag,''));foot.append(me,el('small','','Change your username in Settings.'))}
 else{const mine=ranksTab==='free'?(save.freeBest||0):Math.max(0,...Object.values(save.scores||{})),note=el('small','',mine?`You are playing as a guest. Your best is ${mine.toLocaleString()}.`:'You are playing as a guest.'),acts=el('div','set-acts');acts.append(googleButton('SIGN UP','signup'),googleButton('LOG IN','login'));
  foot.append(note,acts,el('small','','Sign up to post your scores, save your progress in the cloud and win weekly prizes.'));const tab=ranksTab;if(mine&&tab!=='mine')online.rankFor(tab,mine).then(r=>{if(r&&note.isConnected)note.textContent=`You are playing as a guest. Your best of ${mine.toLocaleString()} would be #${r.toLocaleString()} ${tab==='week'?'this week':tab==='free'?'in Free Run':'worldwide'}.`}).catch(()=>{})}
 list.append(foot);
 const req=++ranksReq,board=ranksTab;
 Promise.resolve(online.start()).then(()=>online.top(board)).then(rows=>{if(req!==ranksReq||panelKind!=='ranks')return;box.replaceChildren();if(!rows.length){box.append(el('p','rank-note',board==='week'?'No scores yet this week. Be the first!':'No scores yet. Be the first!'));return}
  const uid=online.user&&online.user.uid;rows.forEach((e,i)=>{const row=el('div','rank-row'+(e.uid===uid?' me':'')+(i<3?' top':'')),pos=el('span','rank-pos');if(i<3)pos.innerHTML=icon('medal',['gold','silver','bronze'][i]);else pos.textContent=i+1;const st=STAGES.find(s=>s.id===e.stage),si=el('span','ico');si.innerHTML=st?icon(st.icon):'';const lk=e.uid===uid?{...myLook(),name:online.displayName(),clan:save.clan&&save.clan.tag}:e;row.dataset.uid=e.uid;row.append(pos,avatarEl(lk,32),nameEl(lk.name||e.name,lk.gold,lk.clan),si,el('b','rank-score',(e.score||0).toLocaleString()));row.onclick=()=>showProfile(e.uid,{name:e.name,avatar:e.avatar,frame:e.frame,gold:e.gold,clanTag:e.clan,best:e.score,skin:e.skin});box.append(row)});
  // Swap in each player's current avatar, frame, gold name and clan tag from their profile.
  online.looks(rows.map(e=>e.uid).filter(u=>u!==uid)).then(map=>{if(req!==ranksReq)return;for(const row of box.querySelectorAll('.rank-row[data-uid]')){const p=map[row.dataset.uid];if(!p)continue;const cv=row.querySelector('canvas'),nm=row.querySelector('.rank-name');if(cv)cv.replaceWith(avatarEl(p,32));if(nm)nm.replaceWith(nameEl(p.name,p.gold,p.clanTag))}}).catch(()=>{});
  const myBest=board==='week'?online.best.week:online.best.all;if(uid&&myBest&&!rows.some(e=>e.uid===uid)){const row=el('div','rank-row me'),pos=el('span','rank-pos','…'),lk=myLook();row.append(pos,avatarEl(lk,32),nameEl(online.displayName(),lk.gold,save.clan&&save.clan.tag),el('span','ico'),el('b','rank-score',myBest.toLocaleString()));box.append(row)}})
  .catch(e=>{if(req!==ranksReq)return;console.warn(e);box.replaceChildren(el('p','rank-note','Could not load the leaderboard right now.'))})}
online.start();refreshOnline();setInterval(()=>{if(state==='menu')refreshOnline(false)},30000);
