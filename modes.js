'use strict';
// The MAP screen: pick CAMPAIGN (stages unlock one by one by reaching each stage's goal altitude) or FREE RUN (one endless
// run through every stage, with its own leaderboard). The choice is saved in save.mode.
let mapTab=null;
const closePanel=()=>{$('#panel').hidden=true;panelKind=null;previews=[]};
function renderMap(){const list=$('#panel-list'),tab=mapTab||(save.mode==='free'?'free':'campaign');$('#panel-title').textContent='MAP';list.replaceChildren();
 const tabs=el('div','tabs rank-tabs');for(const [id,label,ic] of [['campaign','CAMPAIGN','map'],['free','FREE RUN','rocket']]){const b=el('button','tab'+(tab===id?' on':''));b.innerHTML=iconHTML(ic)+label;b.onclick=()=>{mapTab=id;renderMap()};tabs.append(b)}list.append(tabs);
 if(tab==='campaign'){list.append(el('p','rank-note',"Reach each stage's GOAL altitude to unlock the next one. Every goal is higher than the last. Beat 3, 6 and 12 bosses in one run for up to 3 stars."));
  const path=el('div','map-path');
  STAGES.forEach((s,i)=>{const open=stageUnlocked(i),cleared=stageCleared(s.id),cur=open&&save.mode!=='free'&&stage===s,st=save.stars[s.id]||0,hs=save.scores[s.id]||0,card=el('button','map-stage'+(open?'':' locked')+(cur?' on':''));
   card.style.setProperty('--a',s.top);card.style.setProperty('--b',s.bottom);const ico=el('span','map-ico');ico.innerHTML=icon(open?s.icon:'lock');const mid=el('div','map-mid');mid.append(el('b','',`${i+1}. ${s.name}`));
   if(open){const trio=el('span','star-trio');trio.innerHTML=[0,1,2].map(k=>iconHTML('star',k<st?'':'off',k===1?'mid':'')).join('');mid.append(trio,el('small','',hs?`BEST ${hs.toLocaleString()}`:'NOT PLAYED YET'));
    // Goal bar: the best altitude towards this stage's goal.
    const goal=stageGoal(s.id),ba=save.best[s.id]||0,g=el('div','map-goal'+(cleared?' done':'')),bar=el('i'),fill=el('s');fill.style.width=Math.min(100,ba/goal*100)+'%';bar.append(fill);g.append(el('small','',cleared?`GOAL ${goal.toLocaleString()} m ✓`:`GOAL ${goal.toLocaleString()} m · ${ba.toLocaleString()} m`),bar);mid.append(g)}
   else mid.append(el('small','',`${unlockText(i)} TO UNLOCK`));
   card.append(ico,mid,el('span','map-tag'+(cleared?' done':''),cur?'PLAYING':cleared?'CLEARED':open?'PLAY':'LOCKED'));
   card.onclick=()=>{if(!open){card.classList.remove('nope');void card.offsetWidth;card.classList.add('nope');gameSound.effect('warn');return}save.mode='campaign';persist();closePanel();if(stage!==s)setStage(i);else reset('menu');gameSound.effect('on')};path.append(card)});
  list.append(path)}
 else{const best=save.freeBest||0,card=el('div','free-card'),tx=el('div','free-text');card.innerHTML=`<span class="free-ico">${icon('rocket')}</span>`;
  tx.append(el('b','','FREE RUN'),el('p','','One endless run through all six stages. Beat each boss to fly on to the next stage. After Deep Universe it starts again, tougher.'),el('small','free-best',best?`YOUR BEST ${best.toLocaleString()}`:'NO FREE RUN YET'));card.append(tx);list.append(card);
  const rank=el('p','rank-note','Free Run has its own world ranking, by highest score.');list.append(rank);
  if(best&&online.configured())online.rankFor('free',best).then(r=>{if(r&&rank.isConnected)rank.textContent=`Your best is #${r.toLocaleString()} in the world${online.user?'':' (sign up to post it)'}.`}).catch(()=>{});
  const go=el('button','btn green map-go',save.mode==='free'?'SELECTED: CUT THE ROPE!':'PLAY FREE RUN');go.onclick=()=>{save.mode='free';persist();closePanel();reset('menu');gameSound.effect('on')};
  const lb=el('button','mini-btn','FREE RUN RANKING');lb.onclick=()=>{ranksTab='free';openPanel('ranks')};const row=el('div','map-actions');row.append(go,lb);list.append(row)}}
