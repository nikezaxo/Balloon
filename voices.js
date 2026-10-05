'use strict';
// Character voices, synthesised by speak() in sound.js (no recordings). Every balloon skin has its own
// cartoon voice and something to say for each event; creatures and bosses have voices too.
// S(onset, vowel or glide, seconds, pitch multipliers across the syllable, extras such as gap g or coda end).
const S=(c,v,d,p,o={})=>({c,v,d,p,...o});
const laughs=(v,n,from=1.5)=>Array.from({length:n},(_,k)=>S('h',v.laugh||'a',.1,[from-k*.08,from-.1-k*.08],{g:.06}));
const VOICES={
 classic:{pitch:330,size:1.25,vib:.02,laugh:'a'},
 gumball:{pitch:560,size:1.5,vib:.05,vibRate:11,swing:1.2,laugh:'i'},
 clown:{pitch:430,size:1.35,vib:.03,vibRate:7,swing:1.6,laugh:'a'},
 toy:{pitch:210,size:1.1,texture:'robot',vib:0,laugh:'a'},
 melon:{pitch:390,size:1.3,vib:.06,vibRate:4,laugh:'i'},
 monster:{pitch:105,size:.72,texture:'growl',swing:.8,laugh:'o',volume:.75},
 ninja:{pitch:250,size:1.05,texture:'whisper',rate:1.2,laugh:'e',volume:.9},
 galaxy:{pitch:290,size:1.15,echo:.42,vib:.03,vibRate:3,laugh:'o'},
 gold:{pitch:140,size:.88,vib:.035,vibRate:4.5,swing:.8,echo:.2,laugh:'o'}};
// What every balloon says, unless its own lines below replace it.
const PHRASES={
 launch:()=>[S('w','i',.5,[1.1,1.7,1.5])],
 boost:()=>[S('w','a',.12,[1,1.1]),S('h','u',.42,[1.5,1.95,1.5])],
 hit:()=>Math.random()<.5?[S('h','a',.15,[1.35,1.05])]:[S('h','i',.06,[1.2],{g:0}),S('y','a',.17,[1.45,1.05])],
 oof:()=>[S('','u',.2,[1,.72],{end:'f'})],
 star:()=>[S('y','ei',.34,[1.2,1.65,1.45])],
 fatality:()=>[S('h','i',.09,[1.1]),S('y','a',.45,[1.65,1.2])],
 win:v=>[S('y','e',.3,[1.3,1.75,1.45],{g:.1}),...laughs(v,3)],
 die:()=>[S('w','o',.3,[1.5,1.2]),S('','o',.22,[1.1,.9]),S('','u',.5,[.85,.5])],
 revive:()=>[S('','a',.1,[1]),S('h','a',.32,[1.4,1.65,1.3])]};
// Each skin's own catchphrase when picked in the store, plus a few lines that fit its character.
const SIGNATURE={
 classic:{select:[S('h','ai',.2,[1.2,1.35]),S('y','a',.32,[1.65,1.3])]},
 gumball:{select:[S('h','i',.08,[1.5],{g:.05}),S('h','i',.08,[1.46],{g:.05}),S('h','i',.08,[1.42],{g:.05}),S('','i',.3,[1.7,2])],
  boost:[S('w','i',.45,[1.3,2,1.7])]},
 clown:{select:[S('h','a',.1,[1.2]),S('h','a',.1,[1.5]),S('h','a',.16,[1.9,1.7]),{fx:'honk',d:.5}],
  win:v=>[...laughs(v,4,1.6),{fx:'honk',d:.5}],hit:[{fx:'honk',d:.3}]},
 toy:{select:[S('b','i',.12,[1.6]),S('b','u',.14,[1]),S('b','i',.2,[2])],
  hit:[S('b','o',.1,[1.4]),S('p','u',.12,[1])],die:[S('','a',.2,[1.2]),S('','o',.2,[1]),S('','u',.5,[.8,.4])]},
 melon:{select:[S('w','i',.32,[1.2,1.85]),S('h','i',.1,[1.6]),S('h','i',.12,[1.4])]},
 monster:{select:[S('r','a',.6,[1,1.35,.9],{end:'r'})],hit:[S('g','a',.22,[1.2,.9],{end:'r'})],
  win:[S('r','a',.5,[1,1.4,1],{end:'r',g:.1}),S('h','o',.12,[1.2]),S('h','o',.12,[1.15]),S('h','o',.2,[1.1,.9])],die:[S('','o',.3,[1.2,1]),S('','u',.6,[1,.6])]},
 ninja:{select:[S('h','ai',.12,[1.2]),S('y','a',.24,[1.55,1.1]),{fx:'swish',d:.2}],hit:[{fx:'swish',d:.12},S('h','a',.12,[1.3,1])]},
 galaxy:{select:[S('','u',.42,[1,1.3]),S('w','u',.65,[1.3,1.85,1.5])],boost:[S('w','u',.6,[1,1.9,1.6])]},
 gold:{select:[S('h','o',.15,[1]),S('h','o',.15,[1.06]),S('h','o',.36,[1.28,1.1])],win:v=>[S('h','o',.15,[1]),S('h','o',.15,[1.06]),S('h','o',.36,[1.28,1.1],{g:.12}),...laughs(v,2,1.3)]}};
const CRITTER_VOICES={
 bird:{v:{pitch:880,size:1.8,texture:'rasp',volume:.55},s:[S('k','a',.15,[1.25,.85]),S('','a',.13,[1.1,.7])]},
 bat:{v:{pitch:1350,size:2.1,volume:.45},s:[S('','i',.09,[1.4,1.9],{g:.04}),S('','i',.08,[1.7,1.2])]},
 monkey:{v:{pitch:470,size:1.3,vib:.04,volume:.6},s:[S('','u',.1,[1,1.2]),S('h','u',.1,[1.1,1.3]),S('h','a',.26,[1.5,1.95,1.4])]},
 drone:{v:{pitch:190,size:1,texture:'robot',volume:.55},s:[S('','a',.14,[1.25]),S('','o',.28,[1,.65]),{fx:'zap',d:.1}]}};
const BOSS_VOICES={
 sky:{pitch:92,size:.68,echo:.38,volume:.8},
 jungle:{pitch:84,size:.64,texture:'growl',volume:.75},
 cave:{pitch:430,size:1.45,texture:'rasp',volume:.6},
 factory:{pitch:78,size:.78,texture:'robot',volume:.75},
 space:{pitch:150,size:.9,texture:'robot',echo:.32,volume:.75},
 universe:{pitch:66,size:.6,texture:'growl',echo:.4,volume:.8}};
const BOSS_LINES={
 taunt:[S('m','a',.17,[1]),S('h','a',.15,[1.12]),S('h','a',.38,[1.32,.9])],
 tired:[S('h','a',.22,[1,.9],{vol:.6,g:.12}),S('h','a',.26,[.95,.8],{vol:.6})],
 defeat:[S('n','o',.8,[1.45,1.25,.6])]};
// Important lines (picking, winning, popping) always play; small ones wait until the balloon stops talking.
let voiceBusy=0,critterBusy=0;
function sayVoice(event,{skin=save.skin,force=false,delay=0}={}){const v=VOICES[skin]||VOICES.classic,line=(SIGNATURE[skin]||{})[event]||PHRASES[event],now=performance.now()/1000;if(!line||(!force&&now+delay<voiceBusy))return 0;
 const d=gameSound.speak(typeof line==='function'?line(v):line,v,delay);if(d)voiceBusy=now+d;return d}
function critterVoice(kind){const cv=CRITTER_VOICES[kind],now=performance.now()/1000;if(!cv||now<critterBusy)return;critterBusy=now+.15;gameSound.speak(cv.s,{...cv.v,pitch:cv.v.pitch*(.9+Math.random()*.2)})}
function bossVoice(line,delay=0){return gameSound.speak(BOSS_LINES[line],BOSS_VOICES[stage.id]||BOSS_VOICES.sky,delay)}
