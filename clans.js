'use strict';
// Clans: created with gems, open (anyone can join) or closed (join requests). The leader owns the clan and can
// promote members to admin, demote them, kick anyone and hand over leadership; admins accept or decline join
// requests, kick members and edit the description, badge, colour and open setting. Clan trophies add up the
// best scores members bring when they join plus every personal best they set while in the clan.
// Firestore: clans/{id} {name, key, tag, desc, badge, color, open, owner, memberCount, score, at}
//            clans/{id}/members/{uid} {name, avatar, frame, gold, role, best, at}
//            clans/{id}/requests/{uid} {name, avatar, frame, gold, best, at}
const CLAN_MAX=30,CLAN_BADGES=['shield','crown','skull','flame','bolt','star','heart','trophy','planet','balloon'],CLAN_COLORS=['#ff4d5e','#ff9a1a','#ffd23f','#4fd36b','#44d9ff','#3d7bff','#a273ff','#ff7ad9'];
const ROLE_NAMES={leader:'LEADER',admin:'ADMIN',member:'MEMBER'},ROLE_ORDER={leader:0,admin:1,member:2};
let clanView=null,clanBusy=false,clanForm=null,clanQuery='';
const myBestScore=()=>Math.max(online.best.all||0,...Object.values(save.scores||{}),0);
function api(){const a=online.api;if(!a)throw new Error('Sign in first');return a}
function clanCard(lk){return {name:online.displayName(),avatar:lk.avatar,frame:lk.frame,gold:lk.gold}}
function cleanText(s,n){return String(s||'').replace(/[\u0000-\u001f<>]/g,'').replace(/\s+/g,' ').trim().slice(0,n)}
async function loadClan(id){const {F,db,ref,uid}=api(),c=await F.getDoc(ref('clans',id));if(!c.exists())return null;const members=(await F.getDocs(F.collection(db,'clans',id,'members'))).docs.map(d=>({uid:d.id,...d.data()}));
 members.sort((a,b)=>(ROLE_ORDER[a.role]-ROLE_ORDER[b.role])||((b.best||0)-(a.best||0)));const me=members.find(m=>m.uid===uid);let requests=[];
 if(me&&me.role!=='member')requests=(await F.getDocs(F.collection(db,'clans',id,'requests'))).docs.map(d=>({uid:d.id,...d.data()}));return {id,...c.data(),members,requests,me}}
async function createClan(form){const {F,db,ref,uid}=api(),name=cleanText(form.name,20),tag=cleanText(form.tag,5).toUpperCase().replace(/[^A-Z0-9]/g,'');
 if(name.length<3)throw new Error('The clan name needs at least 3 letters');if(tag.length<2)throw new Error('The tag needs 2 to 5 letters or numbers');if(save.clan)throw new Error('Leave your clan first');if((save.gems||0)<CLAN_PRICE)throw new Error(`You need ${CLAN_PRICE} gems`);
 const taken=await F.getDocs(F.query(F.collection(db,'clans'),F.where('tag','==',tag),F.limit(1)));if(!taken.empty)throw new Error('That tag is taken');
 const id=F.doc(F.collection(db,'clans')).id,best=Math.floor(myBestScore()),b=F.writeBatch(db),lk=myLook();
 b.set(ref('clans',id),{name,key:name.toLowerCase(),tag,desc:cleanText(form.desc,120),badge:CLAN_BADGES.includes(form.badge)?form.badge:'shield',color:CLAN_COLORS.includes(form.color)?form.color:CLAN_COLORS[0],open:!!form.open,owner:uid,memberCount:1,score:best,at:F.serverTimestamp()});
 b.set(ref('clans',id,'members',uid),{...clanCard(lk),role:'leader',best,at:F.serverTimestamp()});await b.commit();
 save.gems-=CLAN_PRICE;save.clan={id,name,tag,role:'leader'};save.clanReq=null;persist();await online.publishNow()}
async function joinClan(c){const {F,db,ref,uid}=api();if(save.clan)throw new Error('Leave your clan first');const best=Math.floor(myBestScore()),lk=myLook();
 if(c.open){if((c.memberCount||0)>=CLAN_MAX)throw new Error('This clan is full');const b=F.writeBatch(db);b.set(ref('clans',c.id,'members',uid),{...clanCard(lk),role:'member',best,at:F.serverTimestamp()});b.update(ref('clans',c.id),{memberCount:F.increment(1),score:F.increment(best)});await b.commit();
  save.clan={id:c.id,name:c.name,tag:c.tag,role:'member'};save.clanReq=null;persist();await online.publishNow();return 'joined'}
 if(save.clanReq&&save.clanReq.id!==c.id)await F.deleteDoc(ref('clans',save.clanReq.id,'requests',uid)).catch(()=>{});
 await F.setDoc(ref('clans',c.id,'requests',uid),{...clanCard(lk),best,at:F.serverTimestamp()});save.clanReq={id:c.id,name:c.name,tag:c.tag};persist();return 'requested'}
async function cancelRequest(){const {F,ref,uid}=api();if(save.clanReq)await F.deleteDoc(ref('clans',save.clanReq.id,'requests',uid)).catch(()=>{});save.clanReq=null;persist()}
async function acceptRequest(c,r){const {F,db,ref}=api();if(c.members.length>=CLAN_MAX)throw new Error('The clan is full');const b=F.writeBatch(db);
 b.set(ref('clans',c.id,'members',r.uid),{name:r.name,avatar:r.avatar,frame:r.frame,gold:!!r.gold,role:'member',best:Math.floor(r.best||0),at:F.serverTimestamp()});b.delete(ref('clans',c.id,'requests',r.uid));b.update(ref('clans',c.id),{memberCount:F.increment(1),score:F.increment(Math.floor(r.best||0))});await b.commit()}
async function declineRequest(c,r){const {F,ref}=api();await F.deleteDoc(ref('clans',c.id,'requests',r.uid))}
async function kickMember(c,m){const {F,db,ref}=api(),b=F.writeBatch(db);b.delete(ref('clans',c.id,'members',m.uid));b.update(ref('clans',c.id),{memberCount:F.increment(-1)});await b.commit()}
async function setRole(c,m,role){const {F,ref}=api();await F.updateDoc(ref('clans',c.id,'members',m.uid),{role})}
async function makeLeader(c,m){const {F,db,ref,uid}=api(),b=F.writeBatch(db);b.update(ref('clans',c.id),{owner:m.uid});b.update(ref('clans',c.id,'members',m.uid),{role:'leader'});b.update(ref('clans',c.id,'members',uid),{role:'admin'});await b.commit();save.clan.role='admin';persist()}
async function saveSettings(c,s){const {F,ref}=api();await F.updateDoc(ref('clans',c.id),{desc:cleanText(s.desc,120),badge:CLAN_BADGES.includes(s.badge)?s.badge:c.badge,color:CLAN_COLORS.includes(s.color)?s.color:c.color,open:!!s.open})}
// Leaving: a leader with members hands the clan to an admin (or the member with the best score) first;
// a leader alone disbands it.
async function leaveClan(c){const {F,db,ref,uid}=api(),b=F.writeBatch(db),others=c.members.filter(m=>m.uid!==uid);
 if(c.owner===uid&&others.length){const heir=others.find(m=>m.role==='admin')||others[0];b.update(ref('clans',c.id),{owner:heir.uid,memberCount:F.increment(-1)});b.update(ref('clans',c.id,'members',heir.uid),{role:'leader'});b.delete(ref('clans',c.id,'members',uid))}
 else if(c.owner===uid){b.delete(ref('clans',c.id,'members',uid));b.delete(ref('clans',c.id))}
 else{b.delete(ref('clans',c.id,'members',uid));b.update(ref('clans',c.id),{memberCount:F.increment(-1)})}
 await b.commit();save.clan=null;persist();await online.publishNow()}
// A new personal best raises the member card and adds the improvement to the clan's trophies.
async function clanBest(score){if(!save.clan||!online.api)return;const {F,db,ref,uid}=online.api,m=await F.getDoc(ref('clans',save.clan.id,'members',uid));if(!m.exists())return;const old=m.data().best||0,s=Math.floor(score);if(s<=old)return;
 const b=F.writeBatch(db);b.update(ref('clans',save.clan.id,'members',uid),{best:s});b.update(ref('clans',save.clan.id),{score:F.increment(s-old)});await b.commit()}
async function findClans(q){const {F,db}=api(),k=cleanText(q,20).toLowerCase(),col=F.collection(db,'clans'),snap=await F.getDocs(k?F.query(col,F.orderBy('key'),F.startAt(k),F.endAt(k+''),F.limit(20)):F.query(col,F.orderBy('score','desc'),F.limit(30)));return snap.docs.map(d=>({id:d.id,...d.data()}))}

// ---- Clan panel ----
function clanBadgeEl(c,size=44){const b=el('span','clan-badge');b.style.setProperty('--cc',c.color||CLAN_COLORS[0]);b.style.width=b.style.height=size+'px';b.innerHTML=icon(c.badge||'shield');return b}
function clanAct(btn,fn,after){btn.onclick=async()=>{if(clanBusy)return;clanBusy=true;btn.disabled=true;try{const r=await fn();gameSound.effect('buy');if(after)after(r);else renderClan()}catch(e){if(e&&e.message==='Cancelled')return;console.warn(e);gameSound.effect('warn');toastClan(e&&e.message&&!/permission|PERMISSION/.test(e.message)?e.message:'That did not work. Try again.')}finally{clanBusy=false;btn.disabled=false}}}
function toastClan(text){const n=$('#panel-list .clan-toast');if(n)n.remove();const t=el('p','clan-toast',text);$('#panel-list').prepend(t);setTimeout(()=>t.remove(),2600)}
function renderClan(){const list=$('#panel-list');$('#panel-title').textContent='CLAN';list.replaceChildren();
 if(!online.configured()){list.append(el('p','rank-note','Clans need online play.'));return}
 if(!online.user){list.append(el('p','rank-note','Sign in with Google to create or join a clan.'),googleButton());return}
 if(clanForm)return renderClanForm(list);
 if(save.clan){list.append(el('p','rank-note','Loading your clan…'));loadClan(save.clan.id).then(c=>{if(panelKind!=='clan')return;if(!c||!c.me){save.clan=null;persist();online.publish();return renderClan()}clanView=c;save.clan.role=c.me.role;save.clan.name=c.name;save.clan.tag=c.tag;renderClanHome(c)}).catch(e=>{console.warn(e);list.replaceChildren(el('p','rank-note','Could not load your clan right now.'))});return}
 if(save.clanReq){const p=el('div','week-info');p.innerHTML=iconHTML('shield');const d=el('div');d.append(el('b','',`REQUEST SENT TO [${save.clanReq.tag}]`),el('span','',`${save.clanReq.name} will let you in soon.`));const cancel=el('button','mini-btn','CANCEL');clanAct(cancel,cancelRequest);p.append(d,cancel);list.append(p)}
 const make=el('button','btn green clan-create');make.innerHTML=`${iconHTML('shield')}CREATE A CLAN · ${iconHTML('gem')}${CLAN_PRICE}`;make.onclick=()=>{if((save.gems||0)<CLAN_PRICE){toastClan(`You need ${CLAN_PRICE} gems to create a clan. Gems come from the weekly top 10.`);gameSound.effect('warn');return}clanForm={name:'',tag:'',desc:'',badge:'shield',color:CLAN_COLORS[0],open:true};renderClan()};list.append(make);
 const search=el('div','clan-search'),inp=el('input');inp.placeholder='Search clans by name';inp.maxLength=20;inp.value=clanQuery;const go=el('button','mini-btn','SEARCH');go.onclick=()=>{clanQuery=inp.value;renderClan()};inp.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')go.click()};search.append(inp,go);list.append(search);
 const box=el('div','rank-list');box.append(el('p','rank-note','Loading clans…'));list.append(box);
 findClans(clanQuery).then(rows=>{if(panelKind!=='clan')return;box.replaceChildren();if(!rows.length){box.append(el('p','rank-note',clanQuery?'No clans found.':'No clans yet. Create the first one!'));return}
  rows.forEach((c,i)=>{const row=el('div','rank-row clan-row'),info=el('div','clan-row-info');info.append(nameEl(c.name,false,c.tag),el('small','',`${c.memberCount||0}/${CLAN_MAX} MEMBERS · ${(c.score||0).toLocaleString()} TROPHIES · ${c.open?'OPEN':'REQUEST'}`));
   const btn=el('button','mini-btn'+(c.open?' go':''),save.clanReq&&save.clanReq.id===c.id?'SENT':c.open?'JOIN':'REQUEST');if((c.memberCount||0)>=CLAN_MAX){btn.textContent='FULL';btn.disabled=true}else clanAct(btn,()=>joinClan(c));
   if(!clanQuery){const pos=el('span','rank-pos',String(i+1));row.append(pos)}row.append(clanBadgeEl(c,34),info,btn);box.append(row)})}).catch(e=>{console.warn(e);box.replaceChildren(el('p','rank-note','Could not load clans right now.'))})}
function renderClanForm(list){const f=clanForm,form=el('div','clan-form');const field=(label,key,max,ph)=>{const w=el('label','clan-field');w.append(el('small','',label));const i=el('input');i.maxLength=max;i.placeholder=ph;i.value=f[key];i.oninput=()=>{f[key]=key==='tag'?i.value.toUpperCase().replace(/[^A-Z0-9]/g,''):i.value;if(key==='tag')i.value=f.tag};i.onkeydown=e=>e.stopPropagation();w.append(i);return w};
 form.append(el('h3','','NEW CLAN'),field('NAME','name',20,'Sky Pirates'),field('TAG (2-5 LETTERS)','tag',5,'SKY'),field('DESCRIPTION','desc',120,'Friendly flyers, all welcome!'));
 const badges=el('div','clan-pick');CLAN_BADGES.forEach(b=>{const x=el('button','pick'+(f.badge===b?' on':''));x.innerHTML=icon(b);x.onclick=()=>{f.badge=b;renderClan()};badges.append(x)});
 const colors=el('div','clan-pick');CLAN_COLORS.forEach(c=>{const x=el('button','pick color'+(f.color===c?' on':''));x.style.background=c;x.onclick=()=>{f.color=c;renderClan()};colors.append(x)});
 const open=el('button','mini-btn'+(f.open?' go':''),f.open?'OPEN: ANYONE CAN JOIN':'CLOSED: JOIN BY REQUEST');open.onclick=()=>{f.open=!f.open;renderClan()};
 const preview=el('div','clan-banner');preview.style.setProperty('--cc',f.color);preview.append(clanBadgeEl(f,52),nameEl(f.name||'Clan name',false,f.tag||'TAG','clan-title'));
 const row=el('div','card-buttons'),cancel=el('button','btn blue','CANCEL'),ok=el('button','btn green');ok.innerHTML=`CREATE · ${iconHTML('gem')}${CLAN_PRICE}`;cancel.onclick=()=>{clanForm=null;renderClan()};clanAct(ok,()=>createClan(f),()=>{clanForm=null;confetti(30);renderClan()});row.append(cancel,ok);
 form.append(el('small','clan-label','BADGE'),badges,el('small','clan-label','COLOUR'),colors,open,preview,row);list.append(form)}
function renderClanHome(c){const list=$('#panel-list'),uid=online.user.uid,me=c.me,isLeader=c.owner===uid,isAdmin=me.role!=='member';list.replaceChildren();
 const ban=el('div','clan-banner');ban.style.setProperty('--cc',c.color);const t=el('div','clan-banner-text');t.append(nameEl(c.name,false,c.tag,'clan-title'),el('small','',`${c.members.length}/${CLAN_MAX} MEMBERS · ${(c.score||0).toLocaleString()} TROPHIES · ${c.open?'OPEN':'BY REQUEST'}`));if(c.desc)t.append(el('p','clan-desc',c.desc));ban.append(clanBadgeEl(c,56),t);list.append(ban);
 if(isAdmin&&c.requests.length){list.append(el('small','clan-label',`JOIN REQUESTS (${c.requests.length})`));const rb=el('div','rank-list');for(const r of c.requests){const row=el('div','rank-row'),yes=el('button','mini-btn go','ACCEPT'),no=el('button','mini-btn','DECLINE');clanAct(yes,()=>acceptRequest(c,r));clanAct(no,()=>declineRequest(c,r));row.append(avatarEl(r,30),nameEl(r.name,r.gold,''),el('b','rank-score',(r.best||0).toLocaleString()),yes,no);rb.append(row)}list.append(rb)}
 list.append(el('small','clan-label','MEMBERS'));const mb=el('div','rank-list');
 for(const m of c.members){const row=el('div','rank-row'+(m.uid===uid?' me':'')),role=el('span','role-tag '+m.role,ROLE_NAMES[m.role]||'MEMBER');row.append(avatarEl(m,30),nameEl(m.name,m.gold,''),role,el('b','rank-score',(m.best||0).toLocaleString()));
  if(m.uid!==uid){const acts=el('div','member-acts');if(isLeader){const pr=el('button','mini-btn',m.role==='admin'?'DEMOTE':'PROMOTE');clanAct(pr,()=>setRole(c,m,m.role==='admin'?'member':'admin'));const lead=el('button','mini-btn','MAKE LEADER');clanAct(lead,()=>{if(!confirm(`Make ${m.name} the clan leader? You will become an admin.`))throw new Error('Cancelled');return makeLeader(c,m)});acts.append(pr,lead)}
   if(isLeader||(me.role==='admin'&&m.role==='member')){const k=el('button','mini-btn warn','KICK');clanAct(k,()=>{if(!confirm(`Kick ${m.name} from the clan?`))throw new Error('Cancelled');return kickMember(c,m)});acts.append(k)}if(acts.children.length)row.append(acts)}
  row.onclick=e=>{if(e.target.closest('button'))return;showProfile(m.uid,{name:m.name,avatar:m.avatar,frame:m.frame,gold:m.gold,best:m.best})};mb.append(row)}
 list.append(mb);
 if(isAdmin){const s={desc:c.desc||'',badge:c.badge,color:c.color,open:c.open},box=el('div','clan-form');box.append(el('h3','','CLAN SETTINGS'));const w=el('label','clan-field');w.append(el('small','','DESCRIPTION'));const d=el('input');d.maxLength=120;d.value=s.desc;d.oninput=()=>s.desc=d.value;d.onkeydown=e=>e.stopPropagation();w.append(d);box.append(w);
  const badges=el('div','clan-pick');CLAN_BADGES.forEach(b=>{const x=el('button','pick'+(s.badge===b?' on':''));x.innerHTML=icon(b);x.onclick=()=>{s.badge=b;badges.querySelectorAll('.pick').forEach(p=>p.classList.toggle('on',p===x))};badges.append(x)});
  const colors=el('div','clan-pick');CLAN_COLORS.forEach(cc=>{const x=el('button','pick color'+(s.color===cc?' on':''));x.style.background=cc;x.onclick=()=>{s.color=cc;colors.querySelectorAll('.pick').forEach(p=>p.classList.toggle('on',p===x))};colors.append(x)});
  const open=el('button','mini-btn'+(s.open?' go':''),s.open?'OPEN: ANYONE CAN JOIN':'CLOSED: JOIN BY REQUEST');open.onclick=()=>{s.open=!s.open;open.textContent=s.open?'OPEN: ANYONE CAN JOIN':'CLOSED: JOIN BY REQUEST';open.classList.toggle('go',s.open)};
  const sv=el('button','btn green','SAVE SETTINGS');clanAct(sv,()=>saveSettings(c,s));box.append(el('small','clan-label','BADGE'),badges,el('small','clan-label','COLOUR'),colors,open,sv);list.append(box)}
 const leave=el('button','btn blue clan-leave',isLeader&&c.members.length===1?'DISBAND CLAN':'LEAVE CLAN');clanAct(leave,()=>{if(!confirm(isLeader&&c.members.length===1?'Disband your clan? This cannot be undone.':isLeader?'Leave the clan? Leadership passes to an admin or your best member.':'Leave the clan?'))throw new Error('Cancelled');return leaveClan(c)});list.append(leave)}
// Another player's public profile, opened by tapping them on a leaderboard or in a clan.
// Player card: avatar, name and clan, this season's rank, past season finishes, totals, and each stage's best score
// and stars. Profiles are public, so it works signed out; while a player has no profile (or an old one) the data
// from the board they were tapped on fills in.
function showProfile(uid,fallback){if(!online.configured())return;const card=$('#profile-card');card.hidden=false;const body=card.querySelector('.pc-body');body.scrollTop=0;
 if(online.user&&uid===online.user.uid){playerCard(body,online.myCard());return}
 body.replaceChildren(el('p','rank-note','Loading…'));
 Promise.resolve(online.start()).then(()=>online.getProfile(uid)).then(p=>{if(!p&&!fallback){body.replaceChildren(el('p','rank-note','This player has no profile yet.'));return}playerCard(body,{...fallback,...p},!p||!p.scores)})
  .catch(()=>{if(fallback)playerCard(body,fallback,true);else body.replaceChildren(el('p','rank-note','Could not load this profile.'))})}
function playerCard(body,p,partial){body.replaceChildren();const head=el('div','pc-head'),who=el('div','pc-who');head.append(avatarEl(p,92,'big'));who.append(nameEl(p.name,p.gold,p.clanTag,'profile-name'));
 if(p.clanName)who.append(el('small','profile-clan',`CLAN: ${p.clanName}`));who.append(el('small','',`FLIES: ${((SKINS[p.skin]||{}).name||'Classic').toUpperCase()}`));head.append(who);body.append(head);
 if(typeof tierOf==='function'){const sn=seasonOf(),r=p.seasonId===sn.id&&p.sp>0?tierOf(p.sp,p.legend):null,box=el('div','pc-season'),t=el('div','pc-season-text');
  box.append(emblemEl(r||{tier:TIERS[0],ti:0},50,!!(r&&r.legend)));t.append(el('small','',`SEASON ${sn.n} RANK`));if(r)t.append(rankLabel(r),el('b','pc-sp',`${p.sp.toLocaleString()} SP`));else t.append(el('b','pc-sp','NOT RANKED YET'));box.append(t);if(!r)box.classList.add('none');body.append(box);
  // Past seasons: "S1:6:8400" = season 1, finished in tier 6 (Star Legend) with 8,400 SP.
  const hist=String(p.hist||'').split(',').map(x=>x.split(':')).filter(a=>a.length===3&&/^S\d{1,4}$/.test(a[0])).map(([id,ti,sp])=>({id,ti:Math.min(6,Math.max(0,Math.floor(+ti)||0)),sp:Math.max(0,Math.floor(+sp)||0)}));
  const past=el('div','pc-past'),row=el('div','pc-past-row');past.append(el('small','clan-label','SEASON REWARDS'));
  for(const h of hist.slice(-6)){const tier=h.ti===6?LEGEND_TIER:TIERS[h.ti],c=el('div','pc-past-item');c.append(emblemEl({tier,ti:h.ti,legend:h.ti===6},34),el('small','',`S${h.id.slice(1)}`));c.title=`Season ${h.id.slice(1)}: ${tier.name}, ${h.sp.toLocaleString()} SP`;row.append(c)}
  const items=el('span','pc-items');items.innerHTML=`${iconHTML('trophy')}${p.items||0} SEASON ITEM${p.items===1?'':'S'}`;row.append(items);if(!hist.length)row.prepend(el('small','pc-none','No finished seasons yet'));past.append(row);body.append(past)}
 const scores=p.scores||{},stars=p.stars||{},vals=Object.values(scores).map(v=>Math.max(0,+v||0)),best=Math.max(p.best||0,0,...vals),total=Math.max(best,vals.reduce((a,v)=>a+v,0)),starSum=Object.values(stars).reduce((a,v)=>a+Math.min(3,Math.max(0,+v||0)),0);
 const grid=el('div','pc-stats');for(const [label,val] of [['TOTAL SCORE',total.toLocaleString()],['BEST SCORE',best.toLocaleString()],['STARS',`${starSum}/${STAGES.length*3}`],['BOSSES BEATEN',(p.bosses||0).toLocaleString()]]){const c=el('div','pc-stat');c.append(el('b','',val),el('small','',label));grid.append(c)}body.append(grid);
 if(partial)body.append(el('p','rank-note','Stage scores, stars and seasons show once this player plays the newest version.'));
 const list=el('div','pc-stages');list.append(el('small','clan-label','HIGHEST SCORE IN EACH STAGE'));for(const s of STAGES){const sc=Math.max(0,+scores[s.id]||0),st=Math.min(3,+stars[s.id]||0),row=el('div','pc-stage'+(sc?'':' none')),ico=el('span','ico'),trio=el('span','star-trio');ico.innerHTML=icon(s.icon);trio.innerHTML=[0,1,2].map(k=>iconHTML('star',k<st?'':'off',k===1?'mid':'')).join('');row.append(ico,el('b','pc-stage-name',s.name),trio,el('b','rank-score',sc?sc.toLocaleString():'NOT PLAYED'));list.append(row)}body.append(list);
}
