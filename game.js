'use strict';
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
const $=s=>document.querySelector(s);
const FONT="'Lilita One',Impact,'Arial Black',sans-serif",calm=matchMedia('(prefers-reduced-motion: reduce)').matches;
const rand=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)],clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const PARTY=['#ff4d5e','#ffd23f','#44d9ff','#4fd36b','#a273ff','#ffffff'];
let W=420,H=700,dpr=1,state='ready',previousState='ready',alt=0,x=.5,vx=0,t=0,last=0,obstacles=[],particles=[],pointer=null,target=null,sound=false,soundTouched=false,flightTime=0,spin=0,wind=0,weatherNow=null,leaves=[],leafClock=0,coins=[],coinCount=0,shownCoins=0,nextObstacle=450,spawnIndex=0,planeEvent=null,people=[],nextPlaneTime=1200;
// Game feel: camera shake, flashes, slow motion, popups, combos and a springy balloon with a face.
let shake=0,flash=0,flashColor='#fff',timeScale=1,slowTimer=0,deathTimer=0,popups=[],rings=[],flyers=[],streaks=[],trailClock=0,streakClock=0,combo=0,comboTimer=0,bestCombo=0,nearMisses=0,squash=0,squashV=0,blink=0,nextBlink=2,mood='happy',moodTimer=0,danger=0,ropeCut=null,lastZone='',nextMilestone=1000,passedBest=false,best=loadBest();
const keys=new Set(),radius=29,worldScale=.65,hudCache={};
function loadBest(){try{return Number(localStorage.getItem('skybound-best'))||0}catch{return 0}}
function saveBest(value){try{localStorage.setItem('skybound-best',String(value))}catch{}}
function resize(){const r=canvas.getBoundingClientRect();W=r.width;H=r.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
new ResizeObserver(resize).observe(canvas);
function reset(){state='ready';alt=0;x=.5;vx=0;target=null;pointer=null;obstacles=[];particles=[];leaves=[];flightTime=0;spin=0;wind=0;weatherNow=null;leafClock=0;coinCount=0;shownCoins=0;coins=[];nextObstacle=450;spawnIndex=0;planeEvent=null;people=[];nextPlaneTime=1200;keys.clear();
 shake=0;flash=0;timeScale=1;slowTimer=0;deathTimer=0;popups=[];rings=[];flyers=[];streaks=[];combo=0;comboTimer=0;bestCombo=0;nearMisses=0;squash=0;squashV=0;mood='happy';moodTimer=0;danger=0;ropeCut=null;lastZone=region().name;nextMilestone=1000;passedBest=false;
 generateCourse();$('#weather').textContent='CALM AIR';$('#weather').classList.remove('gust');$('#hint').hidden=false;$('#overlay').hidden=true;$('#status').textContent='READY WHEN YOU ARE';$('#air-warning').hidden=true;$('#pause').textContent='Ⅱ';$('#pause').setAttribute('aria-label','Pause game');$('#announce').replaceChildren();showBest()}
function showBest(){$('#best').textContent=best?`🏆 BEST ${best.toLocaleString()} m`:'NO RECORD YET';$('#intro-best').textContent=best?best.toLocaleString()+' m':'—'}
function launch(){if(state!=='ready')return;if(!soundTouched){soundTouched=true;gameSound.enable(true).then(on=>{sound=on;$('#sound').textContent=on?'Sound on':'Sound off';$('#sound').setAttribute('aria-pressed',String(on));$('#sound').setAttribute('aria-label',on?'Disable sound':'Enable sound');if(on)gameSound.effect('launch')})}
 state='flying';$('#hint').hidden=true;$('#status').textContent='COLLECT COINS · KEEP RISING';gameSound.effect('launch');
 const r=rope(),cutY=(r.a.y+r.b.y)/2;ropeCut={age:0,length:r.b.y-cutY};
 burst(W/2,cutY,14,{type:'star',colors:['#fff','#ffd23f'],speed:[80,240],size:[4,7],life:[.3,.6]});
 rings.push({x:W/2,y:cutY,max:60,life:0,dur:.4,color:'#fff',width:5});
 burst(W/2,balloonY()+34,10,{type:'puff',colors:['#fff'],speed:[40,130],size:[8,14],life:[.5,.9],drag:3});
 squash=-.25;squashV=0;shake=7;mood='joy';moodTimer=1;announce('GO!','','go')}
function balloonY(){return H*(.68-Math.min(alt/300,1)*.09)}
function rope(){return {a:{x:W*.5,y:balloonY()+35},b:{x:W*.5,y:H-47}}}
function cross(a,b,c){return (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)}
function intersects(a,b,c,d){return cross(a,b,c)*cross(a,b,d)<=0&&cross(c,d,a)*cross(c,d,b)<=0&&Math.max(a.x,b.x)>=Math.min(c.x,d.x)&&Math.min(a.x,b.x)<=Math.max(c.x,d.x)&&Math.max(a.y,b.y)>=Math.min(c.y,d.y)&&Math.min(a.y,b.y)<=Math.max(c.y,d.y)}
function point(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
canvas.addEventListener('pointerdown',e=>{canvas.focus();canvas.setPointerCapture(e.pointerId);pointer=point(e);if(state==='flying')target=pointer.x/W});
canvas.addEventListener('pointermove',e=>{if(!pointer)return;const p=point(e);if(state==='ready'){const r=rope();if(intersects(pointer,p,r.a,r.b)&&Math.hypot(p.x-pointer.x,p.y-pointer.y)>2)launch()}else if(state==='flying')target=p.x/W;pointer=p});
function release(){pointer=null;target=null}canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
window.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight',' ','a','d','A','D','p','P','Escape'].includes(e.key)){e.preventDefault();keys.add(e.key.toLowerCase());if(e.key===' '){if(state==='ready')launch();else if(state==='dead'&&!$('#overlay').hidden)reset()}if(['p','P','Escape'].includes(e.key))pause()}});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
function show(label,title,text,button,results=false){$('#result-label').textContent=label;$('#result-title').textContent=title;$('#result-text').textContent=text;$('#primary').textContent=button;$('#stats').hidden=!results;$('#record').hidden=true;$('#overlay').hidden=false}
function pause(){if(state==='paused'){state=previousState;$('#overlay').hidden=true;$('#pause').textContent='Ⅱ';$('#pause').setAttribute('aria-label','Pause game')}else if(state==='ready'||state==='flying'){previousState=state;state='paused';release();keys.clear();$('#pause').textContent='▶';$('#pause').setAttribute('aria-label','Resume game');show('PAUSED','Breather','The sky can wait a moment.','RESUME ▶')}gameSound.update(state,wind,flightSpeed(alt),alt,document.hidden)}
$('#pause').onclick=pause;$('#primary').onclick=()=>state==='paused'?pause():reset();$('#sound').onclick=async()=>{soundTouched=true;sound=await gameSound.enable(!sound);$('#sound').textContent=sound?'Sound on':'Sound off';$('#sound').setAttribute('aria-label',sound?'Disable sound':'Enable sound');$('#sound').setAttribute('aria-pressed',String(sound));gameSound.update(state,wind,flightSpeed(alt),alt,document.hidden);if(sound)gameSound.effect('on')};document.addEventListener('visibilitychange',()=>{if(document.hidden&&(state==='flying'||state==='ready'))pause()});

// ---- Effects helpers ----
function burst(px,py,n,{type='spark',colors=['#fff'],speed=[60,200],size=[2,5],life=[.4,.8],gravity=0,drag=2,world=false}={}){for(let i=0;i<n;i++){const a=Math.random()*TAU,s=rand(...speed);particles.push({type,x:px,y:py,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:0,max:rand(...life),size:rand(...size),color:pick(colors),gravity,drag,world,rot:rand(0,TAU),vr:rand(-8,8)})}}
function confetti(n){for(let i=0;i<n;i++)particles.push({type:'confetti',x:rand(0,W),y:rand(-90,-10),vx:rand(-40,40),vy:rand(60,170),gravity:80,drag:.4,life:0,max:rand(2,3),size:rand(7,11),color:pick(PARTY),rot:rand(0,TAU),vr:rand(-7,7)})}
function popup(px,py,text,color,size=24){popups.push({x:clamp(px,70,W-70),y:py,text,color,size,life:0,max:1,vy:-80,rot:rand(-.12,.12)})}
function bump(el){el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump')}
function announce(text,sub,kind){const layer=$('#announce');layer.replaceChildren();const el=document.createElement('div');el.className=`announce ${kind}`;if(sub){const s=document.createElement('small');s.textContent=sub;el.append(s)}const b=document.createElement('strong');b.textContent=text;el.append(b);el.addEventListener('animationend',e=>{if(e.target===el)el.remove()});layer.append(el)}
function countUp(el,value,suffix){const start=performance.now();const tick=now=>{const k=Math.min(1,(now-start)/900);el.textContent=Math.round(value*(1-(1-k)**3)).toLocaleString()+suffix;if(k<1)requestAnimationFrame(tick)};requestAnimationFrame(tick)}
const backOut=k=>1+3.2*(k-1)**3+2.2*(k-1)**2;

function finish(){state='dead';release();mood='dead';gameSound.effect('pop');const bx=x*W,by=balloonY();
 for(let i=0;i<16;i++){const a=Math.random()*TAU,s=rand(160,380);particles.push({type:'shard',x:bx+Math.cos(a)*15,y:by-5+Math.sin(a)*15,vx:Math.cos(a)*s,vy:Math.sin(a)*s-80,life:0,max:rand(.9,1.5),size:rand(6,12),color:i%2?'#ff4d5e':'#ffd23f',gravity:600,drag:1.2,rot:rand(0,TAU),vr:rand(-14,14)})}
 burst(bx,by,26,{type:'confetti',colors:PARTY,speed:[120,420],size:[6,10],life:[.7,1.2],gravity:300,drag:1.5});
 burst(bx,by,18,{colors:['#fff','#ffd23f'],speed:[200,500],size:[2,4],life:[.25,.5]});
 burst(bx,by,8,{type:'puff',colors:['#ffffff','#e9e4ff'],speed:[30,110],size:[10,18],life:[.6,1],drag:3});
 rings.push({x:bx,y:by,max:100,life:0,dur:.5,color:'#fff',width:8},{x:bx,y:by,max:160,life:0,dur:.75,color:'#ffd23f',width:5});
 popup(bx,by-40,'POP!','#ff4d5e',54);shake=22;flash=.9;flashColor='#fff';slowTimer=.45;deathTimer=1.1;$('#status').textContent='OUCH!'}
function showResult(){const a=Math.floor(alt),record=a>best;if(record){best=a;saveBest(a)}
 show(record?'NEW RECORD!':pick(['SO CLOSE!','NICE FLIGHT!','GREAT RUN!']),'POP!',`${region().name} · ${nearMisses} close call${nearMisses===1?'':'s'} · best combo x${bestCombo}`,'PLAY AGAIN ↻',true);
 $('#record').hidden=!record;$('#stat-coins').textContent=coinCount;$('#stat-best').textContent=best.toLocaleString()+' m';countUp($('#stat-alt'),a,' m');showBest();if(record)gameSound.effect('record')}

// ---- Course ----
function spike(o){const yy=balloonY()+(alt-o.a)*worldScale;const len=W*(o.length+(o.moving?Math.sin(t*.8+o.phase)*.065:0));return {y:yy,len,side:o.side}}
function obstacleLook(){return alt<6000?{body:'#6b7aa6',top:'#a3b4e0',dark:'#4a557c'}:alt<16000?{body:'#6a3fd6',top:'#a885ff',dark:'#45238f'}:alt<23000?{body:'#b8432f',top:'#ff8a52',dark:'#7a2418'}:{body:'#2f6fd0',top:'#72b8ff',dark:'#1d4590'}}
// Chunky outlined ledge with a metal spike tip; moving ledges get hazard stripes and a siren.
function drawObstacle(o){const z=spike(o);if(z.y<-70||z.y>H+70)return;const look=obstacleLook(),L=z.len;
 ctx.save();ctx.translate(o.side?W:0,z.y);ctx.scale(o.side?-1:1,1);ctx.lineJoin='round';
 const tip=new Path2D();tip.moveTo(L-16,-20);tip.lineTo(L+9,0);tip.lineTo(L-16,20);tip.closePath();
 ctx.fillStyle=o.moving?'#ff5a6a':'#eef3fb';ctx.fill(tip);ctx.fillStyle=o.moving?'#b3203a':'#9aa6bd';ctx.beginPath();ctx.moveTo(L-16,0);ctx.lineTo(L+9,0);ctx.lineTo(L-16,20);ctx.closePath();ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=3.5;ctx.stroke(tip);
 const body=new Path2D();body.moveTo(-12,-24);body.lineTo(L-20,-24);body.quadraticCurveTo(L-10,-24,L-10,-14);body.lineTo(L-10,14);body.quadraticCurveTo(L-10,24,L-20,24);body.lineTo(-12,24);body.closePath();
 ctx.fillStyle=look.body;ctx.fill(body);ctx.save();ctx.clip(body);ctx.fillStyle=look.top;ctx.fillRect(-12,-24,L,10);ctx.fillStyle=look.dark;ctx.fillRect(-12,13,L,11);
 if(o.moving){ctx.fillStyle='#ffd23f';ctx.fillRect(-12,-8,L,14);ctx.fillStyle=INK;for(let s=-12;s<L;s+=18){ctx.beginPath();ctx.moveTo(s,-8);ctx.lineTo(s+9,-8);ctx.lineTo(s+1,6);ctx.lineTo(s-8,6);ctx.closePath();ctx.fill()}}
 else{ctx.fillStyle='rgba(255,255,255,.22)';for(let s=10;s<L-24;s+=26){ctx.beginPath();ctx.arc(s,0,3.2,0,TAU);ctx.fill()}}
 const g=((t*.7+o.phase)%2.5)/2.5*(L+80)-40;ctx.fillStyle='rgba(255,255,255,.45)';ctx.beginPath();ctx.moveTo(g,-24);ctx.lineTo(g+14,-24);ctx.lineTo(g+2,24);ctx.lineTo(g-12,24);ctx.closePath();ctx.fill();ctx.restore();
 ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.stroke(body);
 if(o.moving){const on=Math.sin(t*10+o.phase)>0;if(on){ctx.fillStyle='rgba(255,60,80,.3)';ctx.beginPath();ctx.arc(L-30,-27,15,0,TAU);ctx.fill()}ctx.fillStyle=on?'#ff3b4f':'#6b1020';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(L-30,-24,7,Math.PI,0);ctx.closePath();ctx.fill();ctx.stroke()}
 ctx.restore()}
// Project a rotating 3D surface onto the 2D canvas, cel-shaded into three tones.
const shape=lat=>({r:29*Math.cos(lat)*(1-.16*Math.sin(lat)),y:33*Math.sin(lat)-5});
const BALLOON=(()=>{const p=new Path2D(),n=40;for(let i=0;i<=n;i++){const v=shape(-Math.PI/2+i/n*Math.PI);i?p.lineTo(v.r,v.y):p.moveTo(v.r,v.y)}for(let i=n;i>=0;i--){const v=shape(-Math.PI/2+i/n*Math.PI);p.lineTo(-v.r,v.y)}p.closePath();return p})();
const GORES=[['#ff7a86','#ff3b52','#c41d3d'],['#ffe680','#ffc21a','#d98a00']];
function drawBalloon(){
 if(state==='dead')return;
 const flying=state==='flying'||(state==='paused'&&previousState==='flying');
 ctx.save();ctx.translate(x*W,balloonY()+Math.sin(t*2)*(state==='ready'?3:1));ctx.rotate(vx*.16+wind*.12);
 if(flying){ctx.strokeStyle=INK;ctx.lineWidth=2.2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,35);ctx.bezierCurveTo(-wind*20-vx*14,46,8,52,Math.sin(t*5)*7-wind*30-vx*24,66);ctx.stroke()}
 const stretch=flying?Math.min(.05,(flightSpeed(alt)-90)/2400):0;
 ctx.save();ctx.scale(1-squash*.6-stretch*.5,1+squash+stretch);
 ctx.save();ctx.clip(BALLOON);
 const rows=14,cols=24,vertex=(lat,lon)=>{const s=shape(lat);return {x:s.r*Math.sin(lon),y:s.y}};
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
  const lat=-Math.PI/2+row/rows*Math.PI,lon=-Math.PI/2+col/cols*Math.PI,ml=lat+Math.PI/rows/2,mo=lon+Math.PI/cols/2;
  const nx=Math.cos(ml)*Math.sin(mo),ny=Math.sin(ml),nz=Math.cos(ml)*Math.cos(mo),light=-nx*.4-ny*.45+nz*.72;
  const gore=Math.floor((((mo+spin)%TAU+TAU)%TAU)/(TAU/10));
  ctx.fillStyle=GORES[gore%2][light>.62?0:light>.28?1:2];
  ctx.beginPath();[vertex(lat,lon),vertex(lat+Math.PI/rows,lon),vertex(lat+Math.PI/rows,lon+Math.PI/cols),vertex(lat,lon+Math.PI/cols)].forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();ctx.fill();ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=1;ctx.stroke()}
 ctx.restore();
 ctx.fillStyle='rgba(255,255,255,.9)';ctx.beginPath();ctx.ellipse(-14,-21,4.5,8.5,.5,0,TAU);ctx.fill();ctx.beginPath();ctx.arc(-7,-31,2.3,0,TAU);ctx.fill();
 drawFace();
 ctx.strokeStyle=INK;ctx.lineWidth=3.5;ctx.lineJoin='round';ctx.stroke(BALLOON);
 ctx.fillStyle='#e8344c';ctx.beginPath();ctx.moveTo(0,26);ctx.lineTo(-6,35);ctx.lineTo(6,35);ctx.closePath();ctx.fill();ctx.lineWidth=2.5;ctx.stroke();
 ctx.restore();ctx.restore()}
// Eyes follow the steering and react: joy after coins, fright near spikes, wow on close calls.
function drawFace(){const lx=clamp(vx*2.2+(state==='ready'?Math.sin(t*.8)*.7:0),-1,1)*3,scared=mood==='scared'||mood==='wow',open=blink>0?.15:1,ly=scared?-1:0;
 for(const s of [-1,1]){ctx.fillStyle='#fff';ctx.strokeStyle=INK;ctx.lineWidth=2.2;ctx.beginPath();ctx.ellipse(s*9+lx*.4,-8,scared?7:6,(scared?9:7.5)*open,0,0,TAU);ctx.fill();ctx.stroke();
  if(open>.5){ctx.fillStyle=INK;ctx.beginPath();ctx.ellipse(s*9+lx,-7+ly,scared?2.6:3.2,scared?3.4:4.2,0,0,TAU);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(s*9+lx+1.2,-9+ly,1.2,0,TAU);ctx.fill()}
  if(mood==='scared'){ctx.lineWidth=2.4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(s*4,-19);ctx.lineTo(s*13,-21);ctx.stroke()}}
 ctx.fillStyle='rgba(255,110,150,.5)';for(const s of [-1,1]){ctx.beginPath();ctx.ellipse(s*16,1,4,2.4,0,0,TAU);ctx.fill()}
 ctx.strokeStyle=INK;ctx.lineWidth=2.3;ctx.lineCap='round';ctx.fillStyle='#7a1030';
 if(scared){ctx.beginPath();ctx.ellipse(lx*.3,6,3.4,mood==='wow'?5:3.8,0,0,TAU);ctx.fill();ctx.stroke()}
 else if(mood==='joy'){ctx.beginPath();ctx.moveTo(-6,2);ctx.quadraticCurveTo(lx*.3,14,6,2);ctx.closePath();ctx.fill();ctx.stroke()}
 else{ctx.beginPath();ctx.arc(lx*.3,1,5,.18*Math.PI,.82*Math.PI);ctx.stroke()}}
function weatherAt(seconds){if(alt>=6000)return {warning:false,active:false,dir:1,force:0};const cycle=Math.floor(seconds/18),phase=seconds%18,dir=cycle%2===0?1:-1;return {warning:phase>=8&&phase<10,active:phase>=10&&phase<16,dir,force:phase>=10&&phase<16?dir*Math.sin((phase-10)/6*Math.PI)*(.19+.13*Math.min(alt/10000,1))*(1+.2*Math.sin(seconds*5)):0}}
// No speed cap or altitude finish line: speed continues increasing with height.
function flightSpeed(height){return 90+1.2*Math.sqrt(Math.max(0,height))}
// Generate just ahead of the player; discard objects below the screen.
function generateCourse(){const horizon=alt+H/worldScale+flightSpeed(alt)*2;
 while(nextObstacle<horizon){const i=spawnIndex++;obstacles.push({a:nextObstacle,side:i%2,length:.25+(Math.sin(i*4.7)+1)*.105,moving:i>5&&i%4===0,phase:i*1.8});coins.push({a:nextObstacle-140,x:.5+Math.sin(i*2.3)*.16,collected:false});nextObstacle+=Math.max(290,flightSpeed(nextObstacle)*1.65)}
 obstacles=obstacles.filter(o=>o.a>alt-H/worldScale-100);coins=coins.filter(c=>!c.collected&&c.a>alt-H/worldScale-100);
}
function updateWeather(dt){const weather=weatherNow=weatherAt(flightTime);wind=weather.force;
 $('#weather').textContent=weather.warning?`GUST INCOMING ${weather.dir>0?'→':'←'}`:weather.active?`STRONG WIND ${weather.dir>0?'→':'←'}`:alt>=6000?'ZERO WIND':'CALM AIR';
 $('#weather').classList.toggle('gust',weather.active||weather.warning);
 if(weather.active){leafClock+=dt;while(leafClock>.075){leafClock-=.075;leaves.push({x:weather.dir>0?-20:W+20,y:Math.random()*H,dir:weather.dir,speed:140+Math.random()*170,angle:Math.random()*6,size:4+Math.random()*5,phase:Math.random()*6})}}else leafClock=0;
 for(const l of leaves){l.x+=l.dir*l.speed*dt;l.y+=(22+Math.sin(t*4+l.phase)*28)*dt;l.angle+=dt*l.dir*5}leaves=leaves.filter(l=>l.x>-50&&l.x<W+50&&l.y<H+30);
}
function drawWeather(){if(Math.abs(wind)>.01){ctx.fillStyle=`rgba(52,88,140,${Math.abs(wind)*.18})`;ctx.fillRect(-40,-40,W+80,H+80)}
 for(const l of leaves){ctx.save();ctx.translate(l.x,l.y);ctx.rotate(l.angle);ctx.scale(1,.45+.4*Math.abs(Math.sin(t*4+l.phase)));ctx.fillStyle=l.size>6?'#ffb340':'#5fcf5a';ctx.strokeStyle=INK;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-l.size,0);ctx.quadraticCurveTo(0,-l.size,l.size,0);ctx.quadraticCurveTo(0,l.size,-l.size,0);ctx.fill();ctx.stroke();ctx.restore()}
 if(state==='flying'&&weatherNow&&weatherNow.warning){const d=weatherNow.dir;ctx.save();ctx.globalAlpha=.55+.45*Math.sin(t*14);ctx.translate(d>0?30:W-30,H*.5);ctx.scale(d,1);ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();for(let i=0;i<3;i++){const ox=i*14-14;ctx.moveTo(ox-6,-14);ctx.lineTo(ox+6,0);ctx.lineTo(ox-6,14)}ctx.strokeStyle=INK;ctx.lineWidth=10;ctx.stroke();ctx.strokeStyle='#ffd23f';ctx.lineWidth=5;ctx.stroke();ctx.restore()}}
function coinY(item){return balloonY()+(alt-item.a)*worldScale}
function star(cx,cy,outer,inner,n){ctx.beginPath();for(let i=0;i<n*2;i++){const a=-Math.PI/2+i*Math.PI/n,r=i%2?inner:outer;ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r)}ctx.closePath()}
// Spinning gold coin with a visible rim, star emblem and soft glow.
function drawCoin(cx,cy,r,phase,glow=true){const c=Math.cos(phase),w=Math.max(.14,Math.abs(c));ctx.save();ctx.translate(cx,cy);ctx.lineJoin='round';
 if(glow){ctx.globalAlpha=.3;ctx.fillStyle='#fff3a0';ctx.beginPath();ctx.arc(0,0,r*1.6+Math.sin(t*4+phase)*2,0,TAU);ctx.fill();ctx.globalAlpha=1}
 ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.fillStyle='#c27800';ctx.beginPath();ctx.ellipse((1-w)*r*.35*(c>0?1:-1),0,r*w,r,0,0,TAU);ctx.fill();ctx.stroke();
 ctx.fillStyle='#ffcf2e';ctx.beginPath();ctx.ellipse(0,0,r*w,r,0,0,TAU);ctx.fill();ctx.stroke();
 ctx.strokeStyle='#fff09a';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,r*w*.7,r*.7,0,0,TAU);ctx.stroke();
 ctx.scale(w,1);ctx.fillStyle='#fff6c2';star(0,0,r*.46,r*.2,5);ctx.fill();ctx.strokeStyle='#d99400';ctx.lineWidth=1.5;ctx.stroke();ctx.restore()}
function drawCoins(){for(const item of coins){if(item.collected)continue;const yy=coinY(item);if(yy<-40||yy>H+40)continue;drawCoin(item.x*W,yy+Math.sin(t*3+item.a)*3,14,t*2.5+item.a)}}
function collectCoins(){for(const item of coins){if(item.collected)continue;const cx=item.x*W,cy=coinY(item),dx=cx-x*W,dy=cy-balloonY();if((dx/43)**2+(dy/48)**2<1){item.collected=true;coinCount++;combo=comboTimer>0?combo+1:1;comboTimer=2.6;bestCombo=Math.max(bestCombo,combo);gameSound.effect('coin',combo);
 burst(cx,cy,12,{colors:['#ffd23f','#fff3a0','#fff'],speed:[80,240],size:[2,4],life:[.3,.6],world:true});burst(cx,cy,4,{type:'star',colors:['#fff6b0'],speed:[40,120],size:[5,8],life:[.5,.8],world:true});
 rings.push({x:cx,y:cy,max:40,life:0,dur:.35,color:'#ffe680',width:4});popup(cx,cy-24,combo>=3?`COMBO x${combo}!`:'+1',combo>=3?'#ff9a3c':'#ffd23f',combo>=3?28:24);
 flyers.push({x:cx,y:cy,age:0});squashV+=3;mood='joy';moodTimer=.6;if(combo>=3)shake=Math.max(shake,3)}}}
function hitsObstacle(z){const left=z.side?W-z.len-8:0,right=z.side?W:z.len+8;const tilt=vx*.16+wind*.12;return [{offset:-5,rx:28,ry:32}].some(body=>{const cx=x*W-Math.sin(tilt)*body.offset,cy=balloonY()+Math.cos(tilt)*body.offset;const nx=Math.max(left,Math.min(cx,right)),ny=Math.max(z.y-26,Math.min(cy,z.y+26));return ((cx-nx)/body.rx)**2+((cy-ny)/body.ry)**2<1})}
const gapTo=(o,z)=>o.side?(W-z.len-8)-(x*W+28):(x*W-28)-(z.len+8);
// Reward skimming past a spike tip without touching it.
function checkNearMisses(clear){for(const o of obstacles){if(o.passed||o.a>alt)continue;o.passed=true;if(!clear)continue;const z=spike(o);if(gapTo(o,z)<30){nearMisses++;popup(x*W,balloonY()-60,'CLOSE CALL!','#44d9ff',26);shake=Math.max(shake,5);gameSound.effect('close');burst(o.side?W-z.len-8:z.len+8,z.y,10,{colors:['#fff','#44d9ff'],speed:[100,260],life:[.2,.5],world:true});mood='wow';moodTimer=.7}}}
function measureDanger(){let d=0;const by=balloonY();if(!planeEvent&&people.length===0)for(const o of obstacles){const z=spike(o),dy=by-z.y;if(dy<-40||dy>110)continue;d=Math.max(d,Math.max(0,1-gapTo(o,z)/60)*(1-Math.abs(dy)/110))}for(const p of people)d=Math.max(d,Math.max(0,1-(Math.hypot((p.x-x)*W,p.y-by)-50)/90));return Math.min(1,d)}
function checkProgress(){const zone=region().name;
 if(zone!==lastZone){lastZone=zone;nextMilestone=Math.floor(alt/1000)*1000+1000;announce(zone,'NEW ZONE','zone');gameSound.effect('zone');flash=.4;flashColor='#fff';confetti(36);return}
 if(!passedBest&&best>0&&alt>best){passedBest=true;announce('NEW BEST!','KEEP GOING','record');gameSound.effect('record');confetti(24);return}
 if(alt>=nextMilestone){announce(`${nextMilestone.toLocaleString()} m`,'ALTITUDE','milestone');gameSound.effect('milestone');nextMilestone+=1000;bump($('.hud-alt'))}}
// A far-away aircraft passes first; its passengers arrive after a warning.
function updateAirTraffic(dt){
 if(!planeEvent&&alt>=nextPlaneTime&&alt<5000){planeEvent={age:0,released:0,lanes:(Math.random()<.5?[.22,.78,.28]:[.78,.22,.72]).map(v=>v+(Math.random()-.5)*.06)};nextPlaneTime=Infinity}
 if(planeEvent){const e=planeEvent;e.age+=dt;
  while(e.released<3&&e.age>=11+e.released*3.5){people.push({x:e.lanes[e.released],y:-45,phase:e.released*2+flightTime});e.released++}
  $('#air-warning').hidden=!(e.age>=8&&e.age<19);
  if(e.age>20)planeEvent=null;
 }
 for(const p of people){p.y+=dt*(65);p.x+=dt*(wind*.025+Math.sin(t*1.6+p.phase)*.018);p.x=Math.max(.09,Math.min(.91,p.x))}
 const hadPeople=people.length>0;people=people.filter(p=>p.y<H+80);if(hadPeople&&!people.length&&!planeEvent)obstacles=obstacles.filter(o=>o.a<alt-200||o.a>alt+650);
}
// Lit 3D mesh: circular fuselage, solid wings and tail, perspective and depth sorting.
function drawPlane(){const e=planeEvent;if(!e||e.age>8)return;const u=Math.min(e.age/8,1);const px=W*(-.12+.55*Math.sin(u*Math.PI*.72)),py=H*(.45-.42*u),scale=1.1-u*.45;const faces=[];
 const project=([x,y,z])=>{const yaw=-.2-u*.7,roll=-.35-u*.65;const xx=x*Math.cos(yaw)+z*Math.sin(yaw),zz=-x*Math.sin(yaw)+z*Math.cos(yaw);const yy=y*.8-zz*.6,depth=y*.6+zz*.8;return {x:px+(xx*Math.cos(roll)-yy*Math.sin(roll))*scale*260/(260+depth),y:py+(xx*Math.sin(roll)+yy*Math.cos(roll))*scale*260/(260+depth),z:depth}};
 const face=(v,color)=>{const ps=v.map(project);faces.push({p:ps,z:ps.reduce((a,p)=>a+p.z,0)/ps.length,color})};
 const ringsOf=[[-45,0],[-33,7],[-20,9],[23,8],[37,3],[43,0]];
 for(let r=0;r<ringsOf.length-1;r++)for(let j=0;j<12;j++){const a=j*Math.PI/6,b=(j+1)*Math.PI/6,[xx,rr]=ringsOf[r],[nx,nr]=ringsOf[r+1];face([[xx,Math.sin(a)*rr,Math.cos(a)*rr],[nx,Math.sin(a)*nr,Math.cos(a)*nr],[nx,Math.sin(b)*nr,Math.cos(b)*nr],[xx,Math.sin(b)*rr,Math.cos(b)*rr]],`hsl(205 24% ${54+24*Math.max(0,-Math.sin(a))}%)`)}
 for(const side of [-1,1]){face([[-12,0,0],[12,0,side*48],[27,0,side*49],[15,0,0]],'#d9e4eb');face([[12,0,side*48],[27,0,side*49],[27,3,side*49],[12,3,side*48]],'#71889b');face([[27,-2,0],[35,-3,side*21],[43,-3,side*22],[40,-2,0]],'#98afbf');face([[-32,-5,side*4],[-22,-8,side*6],[-15,-7,side*6],[-20,-4,side*8]],'#27475a')}
 face([[26,-5,0],[34,-26,0],[42,-26,0],[40,-3,0]],'#ff4d5e');
 if(e.age>5){for(let i=0;i<9;i++){ctx.fillStyle=`rgba(255,255,255,${.5-i*.05})`;ctx.beginPath();ctx.arc(px+25+i*8,py+10+i*5,3+i*1.4,0,TAU);ctx.fill()}}
 faces.sort((a,b)=>b.z-a.z).forEach(f=>{ctx.fillStyle=f.color;ctx.beginPath();f.p.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();ctx.fill()});
}
function drawPeople(){
 if(planeEvent&&planeEvent.age>=9&&planeEvent.age<19){ctx.save();ctx.font=`26px ${FONT}`;ctx.textAlign='center';ctx.lineJoin='round';ctx.lineWidth=6;ctx.strokeStyle=INK;ctx.fillStyle='#ff4d5e';for(let i=planeEvent.released;i<3;i++){const ay=36+Math.abs(Math.sin(t*6+i))*8;ctx.strokeText('▼',planeEvent.lanes[i]*W,ay);ctx.fillText('▼',planeEvent.lanes[i]*W,ay)}ctx.restore()}
 for(const p of people){ctx.save();ctx.translate(p.x*W,p.y);ctx.rotate(Math.sin(t*2+p.phase)*.08);ctx.lineJoin='round';ctx.lineCap='round';
  ctx.strokeStyle=INK;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-21,-12);ctx.lineTo(-5,17);ctx.moveTo(21,-12);ctx.lineTo(5,17);ctx.moveTo(0,-12);ctx.lineTo(0,13);ctx.stroke();
  const canopy=new Path2D();canopy.arc(0,-12,22,Math.PI,0);canopy.quadraticCurveTo(11,-17,0,-12);canopy.quadraticCurveTo(-11,-17,-22,-12);canopy.closePath();
  ctx.fillStyle='#ff4d5e';ctx.fill(canopy);ctx.save();ctx.clip(canopy);ctx.fillStyle='#fff';for(const i of [-2,0,2]){ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(i*11-5.5,-40);ctx.lineTo(i*11+5.5,-40);ctx.closePath();ctx.fill()}ctx.restore();ctx.lineWidth=2.5;ctx.stroke(canopy);
  ctx.lineWidth=3.5;ctx.beginPath();ctx.moveTo(-3,27);ctx.lineTo(-6,36);ctx.moveTo(3,27);ctx.lineTo(6,36);ctx.moveTo(-4,18);ctx.lineTo(-10,12);ctx.moveTo(4,18);ctx.lineTo(10,12);ctx.stroke();
  ctx.fillStyle='#3d7bff';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-6,15,12,14,3);ctx.fill();ctx.stroke();ctx.fillStyle='#ffc9a0';ctx.beginPath();ctx.arc(0,10,5.5,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle=INK;ctx.fillRect(-4,8,8,2.5);ctx.restore()}
}
function hitsPerson(p){const dx=(x-p.x)*W,dy=balloonY()-p.y;return ((dx/48)**2+((dy+18)/48)**2<1)||((dx/36)**2+((dy-20)/49)**2<1)}
// Grassy launch field with a wooden pad, flowers and a waving flag.
function drawGround(){const g=H-50+alt*worldScale;if(g>H+160)return;ctx.lineJoin='round';ctx.strokeStyle=INK;ctx.lineWidth=4;
 ctx.fillStyle='#72d46a';ctx.beginPath();ctx.moveTo(-40,g-8);ctx.quadraticCurveTo(W*.2,g-50,W*.45,g-14);ctx.quadraticCurveTo(W*.75,g-46,W+40,g-12);ctx.lineTo(W+40,H+300);ctx.lineTo(-40,H+300);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#4cb84c';ctx.beginPath();ctx.moveTo(-40,g+14);ctx.quadraticCurveTo(W*.5,g-12,W+40,g+16);ctx.lineTo(W+40,H+300);ctx.lineTo(-40,H+300);ctx.closePath();ctx.fill();ctx.stroke();
 for(let i=0;i<8;i++){const fx=W*(.07+i*.125),fy=g+16+Math.sin(i*2.7)*5;if(Math.abs(fx-W/2)<50)continue;ctx.fillStyle=INK;ctx.fillRect(fx-1,fy-10,2,10);ctx.fillStyle=PARTY[i%5];ctx.beginPath();for(let k=0;k<5;k++){const a=k/5*TAU+t*.5;ctx.moveTo(fx,fy-12);ctx.arc(fx+Math.cos(a)*4,fy-12+Math.sin(a)*4,3.2,0,TAU)}ctx.fill();ctx.fillStyle='#fff6b0';ctx.beginPath();ctx.arc(fx,fy-12,2.2,0,TAU);ctx.fill()}
 ctx.lineWidth=3.5;ctx.fillStyle='#c98345';ctx.beginPath();ctx.roundRect(W/2-42,g-1,84,13,5);ctx.fill();ctx.stroke();ctx.fillStyle='#8a5326';ctx.beginPath();ctx.roundRect(W/2-5,g-8,10,16,3);ctx.fill();ctx.stroke();
 const fx=W*.82,fy=g-14;ctx.beginPath();ctx.moveTo(fx,fy);ctx.lineTo(fx,fy-52);ctx.lineWidth=4;ctx.stroke();ctx.fillStyle='#ff4d5e';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(fx,fy-52);ctx.quadraticCurveTo(fx+14,fy-56+Math.sin(t*6)*4,fx+28,fy-46+Math.sin(t*6+1)*3);ctx.lineTo(fx,fy-36);ctx.closePath();ctx.fill();ctx.stroke()}
function drawRope(){const ready=state==='ready'||(state==='paused'&&previousState==='ready');ctx.lineCap='round';
 if(ready){const r=rope(),sway=Math.sin(t*2)*4,path=()=>{ctx.beginPath();ctx.moveTo(r.a.x,r.a.y);ctx.quadraticCurveTo(r.a.x+7+sway,r.a.y+35,r.b.x,r.b.y)};
  path();ctx.strokeStyle=INK;ctx.lineWidth=7;ctx.stroke();ctx.strokeStyle='#e0b37a';ctx.lineWidth=3.5;ctx.stroke();ctx.setLineDash([2,6]);ctx.strokeStyle='#8a5f33';ctx.stroke();ctx.setLineDash([]);
  const my=(r.a.y+r.b.y)/2;ctx.setLineDash([7,8]);ctx.lineDashOffset=-t*40;ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(W*.28,my);ctx.lineTo(W*.72,my);ctx.stroke();ctx.setLineDash([]);ctx.lineDashOffset=0;
  const sx=W*(.5+Math.sin(t*2.6)*.2),pulse=(t*1.5)%1;ctx.strokeStyle=`rgba(255,255,255,${1-pulse})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(sx,my,10+pulse*18,0,TAU);ctx.stroke();ctx.fillStyle='#fff';ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.beginPath();ctx.arc(sx,my,9,0,TAU);ctx.fill();ctx.stroke()}
 if(ropeCut&&ropeCut.age<.8){const bx=W/2,by=H-47+alt*worldScale,k=ropeCut.age/.8,len=ropeCut.length*(1-k*.85),swing=Math.sin(ropeCut.age*14)*(1-k)*26,path=()=>{ctx.beginPath();ctx.moveTo(bx,by);ctx.quadraticCurveTo(bx+swing,by-len*.6,bx+swing*1.6+k*20,by-len+k*len*.4)};
  ctx.globalAlpha=1-k*k;path();ctx.strokeStyle=INK;ctx.lineWidth=7;ctx.stroke();ctx.strokeStyle='#e0b37a';ctx.lineWidth=3.5;ctx.stroke();ctx.globalAlpha=1}}
function drawTicks(){ctx.strokeStyle='rgba(255,255,255,.4)';ctx.lineWidth=2;for(let m=Math.floor(alt/250)*250;m<alt+1200;m+=250){const yy=balloonY()+(alt-m)*worldScale;if(yy>30&&yy<H-35){ctx.beginPath();ctx.moveTo(W-16,yy);ctx.lineTo(W-6,yy);ctx.stroke()}}}
function drawStreaks(){ctx.lineCap='round';for(const s of streaks){const v=Math.hypot(s.vx,s.vy)||1;ctx.strokeStyle=`rgba(255,255,255,${s.alpha})`;ctx.lineWidth=s.width;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.x-s.vx/v*s.len,s.y-s.vy/v*s.len);ctx.stroke()}}
function drawParticles(back){for(const p of particles){if(!!p.back!==back)continue;const k=p.life/p.max;ctx.save();ctx.translate(p.x,p.y);
 if(p.type==='puff'){ctx.globalAlpha=(1-k)*.6;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(0,0,p.size*(1+k*1.4),0,TAU);ctx.fill()}
 else if(p.type==='star'){ctx.globalAlpha=1-k;ctx.rotate(p.rot);ctx.fillStyle=p.color;star(0,0,p.size*(1-k*.5),p.size*.4*(1-k*.5),4);ctx.fill()}
 else if(p.type==='confetti'){ctx.rotate(p.rot);ctx.scale(Math.cos(p.rot*3),1);ctx.globalAlpha=k>.7?(1-k)/.3:1;ctx.fillStyle=p.color;ctx.fillRect(-p.size/2,-p.size/4,p.size,p.size/2)}
 else if(p.type==='shard'){ctx.rotate(p.rot);ctx.globalAlpha=k>.75?(1-k)/.25:1;ctx.fillStyle=p.color;ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(-p.size,-p.size*.4);ctx.lineTo(p.size*.8,-p.size*.6);ctx.lineTo(p.size*.3,p.size*.6);ctx.closePath();ctx.fill();ctx.stroke()}
 else{ctx.globalAlpha=1-k;ctx.strokeStyle=p.color;ctx.lineWidth=p.size;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-p.vx*.05,-p.vy*.05);ctx.stroke()}
 ctx.restore()}}
function drawRings(){for(const r of rings){const k=r.life/r.dur;ctx.globalAlpha=1-k;ctx.strokeStyle=r.color;ctx.lineWidth=r.width*(1-k)+.5;ctx.beginPath();ctx.arc(r.x,r.y,r.max*(1-(1-k)**3),0,TAU);ctx.stroke()}ctx.globalAlpha=1}
function drawPopups(){ctx.textAlign='center';ctx.lineJoin='round';for(const p of popups){const k=p.life/p.max,scale=k<.18?backOut(k/.18):1;ctx.save();ctx.globalAlpha=k>.7?1-(k-.7)/.3:1;ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.scale(scale,scale);ctx.font=`${p.size}px ${FONT}`;ctx.lineWidth=p.size*.3;ctx.strokeStyle=INK;ctx.strokeText(p.text,0,0);ctx.fillStyle=p.color;ctx.fillText(p.text,0,0);ctx.restore()}}
// Collected coins fly up into the HUD counter.
function drawFlyers(){if(!flyers.length)return;const c=canvas.getBoundingClientRect(),e=$('#coin-pill .coin-icon').getBoundingClientRect(),tx=e.left+e.width/2-c.left,ty=e.top+e.height/2-c.top;
 for(const f of flyers){const k=Math.min(1,f.age/.55),q=k*k*(3-2*k),cx=f.x,cy=ty+60,px=(1-q)**2*f.x+2*(1-q)*q*cx+q*q*tx,py=(1-q)**2*f.y+2*(1-q)*q*cy+q*q*ty;drawCoin(px,py,13*(1-.35*q),t*14,false)}}
function drawVignette(){const g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.max(W,H)*.75);g.addColorStop(0,'rgba(10,5,40,0)');g.addColorStop(1,'rgba(10,5,40,.28)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 if(danger>.05){const r=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.3,W/2,H/2,Math.max(W,H)*.7);r.addColorStop(0,'rgba(255,40,70,0)');r.addColorStop(1,`rgba(255,40,70,${danger*.4*(.75+.25*Math.sin(t*14))})`);ctx.fillStyle=r;ctx.fillRect(0,0,W,H)}}
function draw(){ctx.save();const amount=calm?shake*.3:shake;if(amount>.4)ctx.translate(rand(-amount,amount),rand(-amount,amount));
 drawCosmos();drawStreaks();drawPlane();drawGround();drawTicks();if(!planeEvent&&people.length===0)obstacles.forEach(drawObstacle);drawCoins();drawRope();drawPeople();drawParticles(true);drawBalloon();drawWeather();drawParticles(false);drawRings();drawPopups();
 ctx.restore();drawFlyers();drawVignette();if(flash>0){ctx.globalAlpha=Math.min(1,flash);ctx.fillStyle=flashColor;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1}}
function update(dt){t+=dt;spin+=dt*(.65+Math.abs(wind)*3+Math.abs(vx));if(state!=='flying')return;
 flightTime+=dt;generateCourse();updateWeather(dt);updateAirTraffic(dt);
 const direction=(keys.has('arrowright')||keys.has('d')?1:0)-(keys.has('arrowleft')||keys.has('a')?1:0);let desired=direction*.65;if(target!==null)desired=clamp((target-x)*6,-.85,.85);vx+=(desired+wind-vx)*Math.min(1,dt*4);x+=vx*dt;x=clamp(x,(radius+5)/W,1-(radius+5)/W);
 alt+=dt*flightSpeed(alt);collectCoins();
 const clear=!planeEvent&&people.length===0;if(clear)for(const o of obstacles){if(hitsObstacle(spike(o))){finish();return}}
 if(people.some(hitsPerson)){finish();return}
 checkNearMisses(clear);checkProgress()}
// Effects run once per frame; dt is slowed during slow motion, real is wall-clock time.
function updateEffects(dt,real){shake*=Math.exp(-8*real);flash=Math.max(0,flash-real*2.4);
 squashV+=(-squash*170-squashV*11)*dt;squash+=squashV*dt;
 if((nextBlink-=dt)<=0){blink=.13;nextBlink=rand(2,5)}blink-=dt;moodTimer-=dt;
 danger=state==='flying'?danger+(measureDanger()-danger)*Math.min(1,dt*10):danger*Math.exp(-6*dt);
 if(state!=='dead'&&moodTimer<=0)mood=danger>.45?'scared':'happy';
 if(ropeCut)ropeCut.age+=dt;if(comboTimer>0&&(comboTimer-=dt)<=0)combo=0;
 if(state==='dead'&&deathTimer>0&&(deathTimer-=real)<=0)showResult();
 const scroll=state==='flying'?flightSpeed(alt)*worldScale:0;
 if(state==='flying'){const space=alt>=3000,tilt=vx*.16+wind*.12;trailClock+=dt;while(trailClock>.04){trailClock-=.04;particles.push({type:space?'star':'puff',back:true,world:true,x:x*W-Math.sin(tilt)*36+rand(-3,3),y:balloonY()+36,vx:rand(-10,10),vy:rand(10,30),life:0,max:space?.7:.9,size:space?rand(3,5):rand(4,7),color:space?pick(['#9fe8ff','#c9a8ff','#fff']):'#fff',gravity:0,drag:1,rot:0,vr:rand(-3,3)})}
  const speed=flightSpeed(alt);streakClock+=dt*((calm?4:9)+Math.min(22,(speed-90)*.2));while(streakClock>1){streakClock--;streaks.push({x:rand(0,W),y:-60,vx:0,vy:speed*worldScale*rand(2.2,3.4),len:rand(30,80),alpha:rand(.12,.3),width:rand(1.5,3)})}
  if(weatherNow&&weatherNow.active&&Math.random()<dt*25)streaks.push({x:weatherNow.dir>0?-60:W+60,y:rand(0,H),vx:weatherNow.dir*rand(500,800),vy:scroll*.5,len:rand(40,90),alpha:rand(.25,.45),width:rand(2,3.5)})}
 for(const s of streaks){s.x+=s.vx*dt;s.y+=s.vy*dt}streaks=streaks.filter(s=>s.y<H+100&&s.x>-120&&s.x<W+120);
 for(const p of particles){p.life+=dt;const d=Math.max(0,1-p.drag*dt);p.vx*=d;p.vy*=d;p.vy+=p.gravity*dt;p.x+=p.vx*dt;p.y+=p.vy*dt+(p.world?scroll*dt:0);p.rot+=p.vr*dt}particles=particles.filter(p=>p.life<p.max);
 for(const r of rings)r.life+=dt;rings=rings.filter(r=>r.life<r.dur);
 for(const p of popups){p.life+=dt;p.y+=p.vy*dt;p.vy*=Math.exp(-3*dt)}popups=popups.filter(p=>p.life<p.max);
 for(const f of flyers){f.age+=real;if(f.age>=.55){f.done=true;shownCoins++;bump($('#coin-pill'))}}flyers=flyers.filter(f=>!f.done)}
function setText(id,value){if(hudCache[id]!==value){hudCache[id]=value;$(id).textContent=value}}
function updateHud(){setText('#coin-count',String(shownCoins));setText('#altitude',Math.floor(alt).toLocaleString());setText('#speed',(state==='ready'?0:Math.round(flightSpeed(alt)))+' m/s');setText('#zone',region().name);const shell=$('.game-shell');shell.classList.toggle('space',alt>=3000);shell.classList.toggle('ready',state==='ready'||(state==='paused'&&previousState==='ready'))}
function frame(now){const real=Math.min((now-last)/1000||0,.035);last=now;
 if(state!=='paused'){if(slowTimer>0){slowTimer-=real;timeScale=slowTimer>0?.25:1}const dt=real*timeScale;let remaining=dt;while(remaining>0){const step=Math.min(remaining,8/(flightSpeed(alt)*worldScale));update(step);remaining-=step}updateEffects(dt,real)}
 gameSound.update(state,wind,flightSpeed(alt),alt,document.hidden);draw();updateHud();requestAnimationFrame(frame)}
reset();resize();requestAnimationFrame(frame);
