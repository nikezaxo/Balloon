'use strict';
// Beginner tutorial and the settings screen.
// New players are asked once whether they want the tutorial. While it is on, the HUD shows its full labels
// (altitude, stage, wind, speed, boss timer) and a coach bubble walks through the basics during flight; the
// steps carry over between runs until the last one. SKIP TUTORIAL (or Settings) turns it off at any time,
// and Settings can replay it. Players who already played skip the question.
const TUT_STEPS=[
 {text:'DRAG ANYWHERE TO MOVE THE BALLOON',done:T=>(T.dragged&&T.time>2.5)||T.time>8},
 {text:'DODGE THE SPIKY LEDGES AND THE CREATURES',done:T=>T.time>5},
 {text:'GRAB COINS! A FULL ROW RAISES YOUR COIN MULTIPLIER',done:T=>(T.time>4&&Math.floor(coinCount)>=T.coins0+6)||T.time>9},
 {text:'YELLOW ENERGY FILLS THE BOOST. TAP BOOST WHEN IT IS FULL!',done:T=>T.boosted||T.time>9},
 {text:'POWER-UPS GIVE YOU A SHIELD, A MAGNET, TURBO OR DOUBLE COINS',done:T=>T.time>6},
 {text:'A BOSS IS COMING! DODGE ITS ATTACKS UNTIL IT GETS TIRED',ready:()=>!!boss||nextBossTime-flightTime<12,done:()=>!!boss&&['tired','fatality','done'].includes(boss.phase)},
 {text:'IT IS TIRED! TAP FATALITY TO FINISH IT',done:()=>!boss||['fatality','done'].includes(boss.phase)},
 {text:'BEAT 3 BOSSES IN ONE RUN FOR A STAR, 6 FOR TWO AND 12 FOR THREE',done:T=>T.time>7}];
let tut=null;
function startTutorial(){save.tut='on';save.tutStep=0;tut=null;persist();refreshMeta()}
function endTutorial(skipped){if(save.tut==='done')return;save.tut='done';tut=null;persist();$('#coach').hidden=true;refreshMeta();if(!skipped&&state==='flying'){announce('TUTORIAL COMPLETE!','NICE FLYING','record','trophy');gameSound.effect('record');confetti(30)}}
// Runs every frame while flying: shows the current tip and moves on when its goal is met.
function tutorialTick(dt){if(!tutorialOn())return;const i=save.tutStep||0,step=TUT_STEPS[i];if(!step){endTutorial(false);return}
 if(!tut||tut.i!==i)tut={i,time:0,coins0:Math.floor(coinCount),dragged:false,boosted:false,shown:false};
 if(step.ready&&!tut.shown&&!step.ready()){$('#coach').hidden=true;return}
 if(!tut.shown){tut.shown=true;$('#coach-text').textContent=step.text;const c=$('#coach');c.hidden=false;c.classList.remove('in');void c.offsetWidth;c.classList.add('in');gameSound.effect('boop')}
 tut.time+=dt;if(drag||keys.size)tut.dragged=true;if(boost&&boost.kind==='engine')tut.boosted=true;
 if(step.done(tut)){save.tutStep=i+1;persist();tut=null;if(save.tutStep>=TUT_STEPS.length)endTutorial(false)}}
// Hide the coach whenever the balloon is not flying (menu, results, pause) or the tutorial is off.
function tutorialHud(){const c=$('#coach');if(!c.hidden&&(state!=='flying'||!tutorialOn()))c.hidden=true}
$('#coach-skip').onclick=()=>{endTutorial(true);gameSound.effect('on')};
// First visit: ask about the tutorial, unless this player has played before.
function welcomeCheck(){if(save.tut)return;const played=Object.keys(save.best||{}).length||Object.keys(save.scores||{}).length||(save.skins||[]).length>1;
 if(played){save.tut='done';persist();return}$('#welcome').hidden=false}
$('#tut-yes').onclick=()=>{$('#welcome').hidden=true;startTutorial();gameSound.effect('on')};
$('#tut-no').onclick=()=>{$('#welcome').hidden=true;save.tut='done';persist();refreshMeta();gameSound.effect('on')};

// ---- Settings ----
function renderSettings(){const list=$('#panel-list');$('#panel-title').textContent='SETTINGS';list.replaceChildren();
 const row=(ic,title,sub,...ctrls)=>{const r=el('div','set-row'),i=el('span','set-ico');if(typeof ic==='string')i.innerHTML=icon(ic);else i.append(ic);const tx=el('div','set-text');tx.append(el('b','',title));if(sub)tx.append(el('small','',sub));r.append(i,tx,...ctrls);list.append(r);return r};
 const btn=(label,cls,fn)=>{const b=el('button','mini-btn'+(cls?' '+cls:''),label);b.onclick=fn;return b};
 row(sound?'speaker':'mute','SOUND',sound?'Music, effects and voices are on':'Sound is off',btn(sound?'ON':'OFF',sound?'go':'',async()=>{await toggleSound();renderSettings()}));
 if(document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen)row('fullscreen','FULL SCREEN','Hide the browser bars',btn(fsElement()?'EXIT':'GO','',()=>{toggleFullscreen();setTimeout(renderSettings,400)}));
 if(online.configured()){if(online.user)row(avatarEl(myLook(),34),online.displayName(),'Signed in: progress and scores are saved',btn('SIGN OUT','',()=>online.signOut().then(renderSettings)));
  else{const r=row(el('span','set-g'),'ACCOUNT','Sign in to save your progress and join the rankings');r.querySelector('.set-g').innerHTML=GOOGLE_G;r.append(googleButton('Sign in'))}}
 row('bolt','HOW TO PLAY','Power-ups, the boost and boss fights',btn('OPEN','',()=>openPanel('boosts')));
 row('star','TUTORIAL',tutorialOn()?'On: tips show while you fly':'Learn the basics again',btn(tutorialOn()?'TURN OFF':'REPLAY','',()=>{if(tutorialOn())endTutorial(true);else startTutorial();renderSettings()}))}

setTimeout(welcomeCheck,600);
