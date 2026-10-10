'use strict';
// Beginner tutorial and the settings screen.
// New players are asked once whether they want the tutorial. While it is on, the HUD shows its full labels
// (altitude, stage, wind, speed, boss timer) and a coach bubble walks through the basics during flight; the
// steps carry over between runs until the last one. SKIP TUTORIAL (or Settings) turns it off at any time,
// and Settings can replay it. Players who already played skip the question.
// Steps with a hand point at what to do; steps marked freeze stop the game until the player does it.
// "at" gives where the hand points, in play-column pixels.
const colPos=sel=>{const e=$(sel),c=$('.play-col').getBoundingClientRect();if(!e||e.hidden)return null;const r=e.getBoundingClientRect();return {x:r.left-c.left+r.width/2,y:r.top-c.top+r.height/2}};
const TUT_STEPS=[
 {id:'rope',text:'SWIPE ACROSS THE ROPE TO FLY!',hand:'swipe',menu:true,at:()=>{const r=rope();return {x:W/2,y:r.a.y+(r.b.y-r.a.y)*.4}},done:()=>state==='flying'},
 {id:'drag',text:'DRAG ANYWHERE TO MOVE THE BALLOON',hand:'drag',freeze:true,ready:()=>flightTime>1.6,at:()=>({x:x*W,y:balloonY()+70}),done:T=>T.moved},
 {id:'dodge',text:'DODGE THE SPIKY LEDGES AND THE CREATURES',done:T=>T.time>4.5},
 {id:'coins',text:'GRAB COINS! A FULL ROW RAISES YOUR COIN MULTIPLIER',done:T=>(T.time>4&&Math.floor(coinCount)>=T.coins0+6)||T.time>9},
 {id:'boost',text:'YOUR BOOST IS FULL. TAP IT NOW!',hand:'tap',freeze:true,start:()=>{if(energy<5){energy=5;chargedUp()}},at:()=>colPos('#boost'),done:()=>!!showcase||(!!boost&&boost.kind==='engine')},
 {id:'powers',text:'POWER-UPS GIVE YOU A SHIELD, A MAGNET, TURBO OR DOUBLE COINS',done:T=>T.time>5},
 {id:'boss',text:'A BOSS IS COMING! DODGE ITS ATTACKS UNTIL IT GETS TIRED',ready:()=>!!boss||nextBossTime-flightTime<10,done:()=>!!boss&&['tired','fatality','done'].includes(boss.phase)},
 {id:'fatality',text:'IT IS TIRED! TAP FATALITY TO FINISH IT',hand:'tap',freeze:true,ready:()=>!!boss&&boss.phase==='tired'&&!$('#fatality').hidden,at:()=>colPos('#fatality'),done:()=>!boss||boss.phase!=='tired'},
 {id:'stars',text:'BEAT 3 BOSSES IN ONE RUN FOR A STAR, 6 FOR TWO AND 12 FOR THREE',done:T=>T.time>6}];
let tut=null;
function startTutorial(){save.tut='on';save.tutStep=0;tut=null;persist();refreshMeta()}
function endTutorial(skipped){if(save.tut==='done')return;save.tut='done';tut=null;persist();$('#coach').hidden=true;$('#tut-hand').hidden=true;shell.classList.remove('tut-rope');refreshMeta();
 if(state==='flying'){if(skipped)popup(x*W,balloonY()-110,'TUTORIAL SKIPPED','#ffffff',22);else{announce('TUTORIAL COMPLETE!','NICE FLYING','record','trophy');gameSound.effect('record');confetti(30)}}}
const tutStep=()=>tutorialOn()?TUT_STEPS[save.tutStep||0]:null;
function tutShow(step){if(!tut||tut.id!==step.id)tut={id:step.id,time:0,coins0:Math.floor(coinCount),moved:false,shown:false};
 if(!tut.shown){tut.shown=true;if(step.start)step.start();$('#coach-text').textContent=step.text;const c=$('#coach');c.hidden=false;c.classList.remove('in');void c.offsetWidth;c.classList.add('in');gameSound.effect('boop')}}
function tutNext(){save.tutStep=(save.tutStep||0)+1;persist();tut=null;$('#coach').hidden=true;$('#tut-hand').hidden=true;if(save.tutStep>=TUT_STEPS.length)endTutorial(false)}
// The game is held still while a freeze step is showing.
function tutorialFrozen(){const step=tutStep();return !!(step&&step.freeze&&state==='flying'&&tut&&tut.id===step.id&&tut.shown)}
// While flying (game time): timed steps advance; a step waits for its moment before it shows.
function tutorialTick(dt){const step=tutStep();if(!step||step.menu)return;if(step.ready&&!(tut&&tut.id===step.id&&tut.shown)&&!step.ready())return;tutShow(step);tut.time+=dt;if(!step.freeze&&step.done(tut))tutNext()}
// Every frame (real time): menu and freeze steps, the hand, and hiding the coach outside its moments.
function tutorialFrame(){const step=tutStep(),hand=$('#tut-hand'),coach=$('#coach'),menuStep=!!step&&step.menu&&(state==='menu'||state==='ready')&&$('#panel').hidden&&$('#welcome').hidden;
 shell.classList.toggle('tut-rope',menuStep);
 if(!step||(state!=='flying'&&!menuStep)){if(!coach.hidden)coach.hidden=true;if(!hand.hidden)hand.hidden=true;return}
 if(menuStep)tutShow(step);else if(step.menu&&state==='flying'){tutNext();return}
 if(step.freeze&&tut&&tut.id===step.id&&tut.shown&&state==='flying'&&step.done(tut)){tutNext();return}
 const active=tut&&tut.id===step.id&&tut.shown,p=active&&step.hand?step.at():null;hand.hidden=!p;if(p){hand.className='tut-hand '+step.hand;hand.style.left=p.x+'px';hand.style.top=p.y+'px'}
 if(!active&&!coach.hidden)coach.hidden=true}
// Moving the finger (or the arrow keys) finishes the drag step even though the game is held still.
{let from=null;canvas.addEventListener('pointerdown',e=>{from={x:e.clientX,y:e.clientY}});canvas.addEventListener('pointermove',e=>{if(from&&tut&&tut.id==='drag'&&Math.hypot(e.clientX-from.x,e.clientY-from.y)>24)tut.moved=true});canvas.addEventListener('pointerup',()=>{from=null});
 window.addEventListener('keydown',e=>{if(tut&&tut.id==='drag'&&/^Arrow|^[wasdWASD]$/.test(e.key))tut.moved=true;
  // Escape leaves the tutorial whenever a tip is showing (instead of pausing).
  if(e.key==='Escape'&&tutorialOn()&&!$('#coach').hidden&&$('#ask').hidden&&$('#panel').hidden){e.preventDefault();e.stopImmediatePropagation();endTutorial(true)}},true)}
$('#coach-skip').onclick=()=>{endTutorial(true);gameSound.effect('on')};
// First visit: ask about the tutorial, unless this player has played before.
function welcomeCheck(){if(save.tut)return;const played=Object.keys(save.best||{}).length||Object.keys(save.scores||{}).length||(save.skins||[]).length>1;
 if(played){save.tut='done';persist();return}$('#welcome').hidden=false}
$('#tut-yes').onclick=()=>{$('#welcome').hidden=true;startTutorial();gameSound.effect('on')};
$('#tut-no').onclick=()=>{$('#welcome').hidden=true;save.tut='done';persist();refreshMeta();gameSound.effect('on')};

// ---- Account dialogs (called by online.js) ----
// Signing up with a Google account that already has a Skybound account: cancel, or sign in with that account.
async function accountChoice(info){const r=await askDialog({ribbon:'ACCOUNT FOUND',title:'You already have an account',text:`This Google account is already linked to ${info.name}${info.best?` (best ${info.best.toLocaleString()})`:''}. Sign in with that account? Skins and best scores from this device will be added to it.`,buttons:[{label:'SIGN IN',cls:'green',value:true},{label:'CANCEL',cls:'blue',value:false}]});return r.value}
// Picking a username: names are unique, so a taken one asks for another.
async function chooseName({fresh=false,current=''}={}){const r=await askDialog({ribbon:'USERNAME',title:fresh?'Pick your username':'Change your username',text:'Other players see this name in the rankings, clans and on your player card. 2 to 16 letters or numbers.',input:{value:current,placeholder:'Your name'},
  buttons:[{label:'SAVE',cls:'green',value:'save',check:true},{label:fresh?'LATER':'CANCEL',cls:'blue',value:'cancel'}],validate:async t=>{const e=nameProblem(t);if(e)return e;await online.claimName(t);return null}});
 if(r.value==='save'){gameSound.effect('buy');refreshMeta();if(panelKind==='settings')renderSettings();if(panelKind==='ranks')renderRanks();if(panelKind==='profile')renderProfile();if(panelKind==='season')renderSeason();return true}return false}
function nameProblem(t){if(t.length<2)return 'Use at least 2 letters.';if(t.length>16)return 'Use 16 letters or fewer.';if(!/^[\p{L}\p{N}][\p{L}\p{N} _.\-]*$/u.test(t))return 'Use letters, numbers, spaces, dots, dashes or underscores.';if(/^guest$/i.test(t))return 'Pick a name other than Guest.';return null}

// ---- Settings ----
function renderSettings(){const list=$('#panel-list');$('#panel-title').textContent='SETTINGS';list.replaceChildren();
 const row=(ic,title,sub,...ctrls)=>{const r=el('div','set-row'),i=el('span','set-ico');if(typeof ic==='string')i.innerHTML=icon(ic);else i.append(ic);const tx=el('div','set-text');tx.append(el('b','',title));if(sub)tx.append(el('small','',sub));r.append(i,tx,...ctrls);list.append(r);return r};
 const btn=(label,cls,fn)=>{const b=el('button','mini-btn'+(cls?' '+cls:''),label);b.onclick=fn;return b};
 row(sound?'speaker':'mute','SOUND',sound?'Music, effects and voices are on':'Sound is off',btn(sound?'ON':'OFF',sound?'go':'',async()=>{await toggleSound();renderSettings()}));
 if(document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen)row('fullscreen','FULL SCREEN','Hide the browser bars',btn(fsElement()?'EXIT':'GO','',()=>{toggleFullscreen();setTimeout(renderSettings,400)}));
 if(online.configured()){if(online.user){row(avatarEl(myLook(),34),'ACCOUNT','Signed in with Google. Your progress is saved in the cloud.',btn('SIGN OUT','',()=>online.signOut().then(renderSettings)));
   row('crown','USERNAME',online.displayName(),btn('CHANGE','',()=>chooseName({current:save.nick||online.displayName()})))}
  else{const r=row(avatarEl(myLook(),34),'GUEST','You are playing as a guest. Sign up to save your progress in the cloud and join the rankings.'),acts=el('div','set-acts');acts.append(googleButton('SIGN UP','signup'),googleButton('LOG IN','login'));r.classList.add('guest');r.append(acts)}}
 row('bolt','HOW TO PLAY','Power-ups, the boost and boss fights',btn('OPEN','',()=>openPanel('boosts')));
 row('star','TUTORIAL',tutorialOn()?'On: tips show while you fly':'Learn the basics again',btn(tutorialOn()?'TURN OFF':'REPLAY','',()=>{if(tutorialOn())endTutorial(true);else startTutorial();renderSettings()}))}

setTimeout(welcomeCheck,600);
