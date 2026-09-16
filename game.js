'use strict';
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
const $=s=>document.querySelector(s);let W=420,H=700,dpr=1,state='ready',previousState='ready',alt=0,x=.5,vx=0,t=0,last=0,obstacles=[],particles=[],pointer=null,target=null,sound=false,soundTouched=false,audio=null,flightTime=0,spin=0,wind=0,leaves=[],leafClock=0,coins=[],coinCount=0,nextObstacle=450,spawnIndex=0,planeEvent=null,people=[],nextPlaneTime=1200;
const keys=new Set(),radius=29,worldScale=.65;
function resize(){const r=canvas.getBoundingClientRect();W=r.width;H=r.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
new ResizeObserver(resize).observe(canvas);
function reset(){state='ready';alt=0;x=.5;vx=0;target=null;pointer=null;obstacles=[];particles=[];leaves=[];flightTime=0;spin=0;wind=0;leafClock=0;coinCount=0;coins=[];nextObstacle=450;spawnIndex=0;planeEvent=null;people=[];nextPlaneTime=1200;keys.clear();generateCourse();$('#weather').textContent='CALM AIR';$('#weather').classList.remove('gust');$('#hint').hidden=false;$('#overlay').hidden=true;$('#status').textContent='READY WHEN YOU ARE';$('#air-warning').hidden=true;$('#pause').textContent='Ⅱ';$('#pause').setAttribute('aria-label','Pause game')}
function launch(){if(state!=='ready')return;if(!soundTouched){soundTouched=true;gameSound.enable(true).then(on=>{sound=on;$('#sound').textContent=on?'Sound on':'Sound off';$('#sound').setAttribute('aria-pressed',String(on));$('#sound').setAttribute('aria-label',on?'Disable sound':'Enable sound');if(on)gameSound.effect('launch')})}state='flying';$('#hint').hidden=true;$('#status').textContent='COLLECT COINS · KEEP RISING';gameSound.effect('launch')}
function balloonY(){return H*(.68-Math.min(alt/300,1)*.09)}
function rope(){return {a:{x:W*.5,y:balloonY()+35},b:{x:W*.5,y:H-47}}}
function cross(a,b,c){return (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)}
function intersects(a,b,c,d){return cross(a,b,c)*cross(a,b,d)<=0&&cross(c,d,a)*cross(c,d,b)<=0&&Math.max(a.x,b.x)>=Math.min(c.x,d.x)&&Math.min(a.x,b.x)<=Math.max(c.x,d.x)&&Math.max(a.y,b.y)>=Math.min(c.y,d.y)&&Math.min(a.y,b.y)<=Math.max(c.y,d.y)}
function point(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
canvas.addEventListener('pointerdown',e=>{canvas.focus();canvas.setPointerCapture(e.pointerId);pointer=point(e);if(state==='flying')target=pointer.x/W});
canvas.addEventListener('pointermove',e=>{if(!pointer)return;const p=point(e);if(state==='ready'){const r=rope();if(intersects(pointer,p,r.a,r.b)&&Math.hypot(p.x-pointer.x,p.y-pointer.y)>2)launch()}else if(state==='flying')target=p.x/W;pointer=p});
function release(){pointer=null;target=null}canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
window.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight',' ','a','d','A','D','p','P','Escape'].includes(e.key)){e.preventDefault();keys.add(e.key.toLowerCase());if(e.key===' '){if(state==='ready')launch();else if(state==='dead')reset()}if(['p','P','Escape'].includes(e.key))pause()}});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
function show(label,title,text,button){$('#result-label').textContent=label;$('#result-title').textContent=title;$('#result-text').textContent=text;$('#primary').textContent=button;$('#overlay').hidden=false}
function pause(){if(state==='paused'){state=previousState;$('#overlay').hidden=true;$('#pause').textContent='Ⅱ';$('#pause').setAttribute('aria-label','Pause game')}else if(state==='ready'||state==='flying'){previousState=state;state='paused';release();keys.clear();$('#pause').textContent='▶';$('#pause').setAttribute('aria-label','Resume game');show('TAKE A BREATH','Flight paused','The sky can wait a moment.','Keep flying ↗')}gameSound.update(state,wind,flightSpeed(alt),alt,document.hidden)}
$('#pause').onclick=pause;$('#primary').onclick=()=>state==='paused'?pause():reset();$('#sound').onclick=async()=>{soundTouched=true;sound=await gameSound.enable(!sound);$('#sound').textContent=sound?'Sound on':'Sound off';$('#sound').setAttribute('aria-label',sound?'Disable sound':'Enable sound');$('#sound').setAttribute('aria-pressed',String(sound));gameSound.update(state,wind,flightSpeed(alt),alt,document.hidden);if(sound)gameSound.effect('on')};document.addEventListener('visibilitychange',()=>{if(document.hidden&&(state==='flying'||state==='ready'))pause()});
function finish(){state='dead';release();gameSound.effect('pop');for(let i=0;i<20;i++)particles.push({x:x*W,y:balloonY(),vx:Math.cos(i)*80,vy:Math.sin(i)*90,life:1});show('EVERY FLIGHT IS A FRESH START','A little too close.',`You climbed ${Math.floor(alt).toLocaleString()} m and collected ${coinCount} coins.`,'Try again ↗')}
function cloud(cx,cy,s,alpha){ctx.save();ctx.translate(cx,cy);ctx.scale(s,s);ctx.fillStyle=`rgba(255,255,250,${alpha})`;ctx.beginPath();ctx.moveTo(-55,10);ctx.bezierCurveTo(-65,-7,-45,-20,-28,-14);ctx.bezierCurveTo(-27,-43,14,-43,23,-19);ctx.bezierCurveTo(45,-30,60,-7,53,6);ctx.bezierCurveTo(73,16,44,24,20,22);ctx.lineTo(-40,22);ctx.quadraticCurveTo(-64,22,-55,10);ctx.fill();ctx.restore()}
function spike(o){const yy=balloonY()+(alt-o.a)*worldScale;const len=W*(o.length+(o.moving?Math.sin(t*.8+o.phase)*.065:0));return {y:yy,len,side:o.side}}
function drawObstacle(o){const z=spike(o);if(z.y< -70||z.y>H+70)return;ctx.save();ctx.translate(o.side?W:0,z.y);ctx.scale(o.side?-1:1,1);ctx.fillStyle='#467879';ctx.beginPath();ctx.moveTo(-5,-26);ctx.lineTo(z.len-17,-26);ctx.lineTo(z.len,-13);ctx.lineTo(z.len-12,-2);ctx.lineTo(z.len+8,13);ctx.lineTo(z.len-10,26);ctx.lineTo(-5,26);ctx.closePath();ctx.fill();ctx.fillStyle='#649794';ctx.beginPath();ctx.moveTo(0,-26);ctx.lineTo(z.len-17,-26);ctx.lineTo(z.len,-13);ctx.lineTo(0,-13);ctx.fill();ctx.strokeStyle='#365f64';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(15,10);ctx.lineTo(z.len-27,10);ctx.stroke();ctx.restore()}
// Project a rotating 3D surface onto the 2D game canvas. Depth controls shading.
function drawBalloon(){
 if(state==='dead')return;
 ctx.save();ctx.translate(x*W,balloonY()+Math.sin(t*2)*(state==='ready'?3:1));ctx.rotate(vx*.16+wind*.12);
 const rows=26,cols=48;
 const vertex=(lat,lon)=>{const r=29*Math.cos(lat)*(1-.16*Math.sin(lat));return {x:r*Math.sin(lon),y:33*Math.sin(lat)-5,z:r*Math.cos(lon)}};
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
  const lat=-Math.PI/2+row/rows*Math.PI,lon=-Math.PI/2+col/cols*Math.PI;
  const points=[vertex(lat,lon),vertex(lat+Math.PI/rows,lon),vertex(lat+Math.PI/rows,lon+Math.PI/cols),vertex(lat,lon+Math.PI/cols)];
  const normalX=Math.cos(lat)*Math.sin(lon),normalY=Math.sin(lat),normalZ=Math.cos(lat)*Math.cos(lon);
  const light=Math.max(0,-normalX*.4-normalY*.45+normalZ*.72);
  const panel=Math.cos((lon-spin)*6)>.88;
  ctx.fillStyle=`hsl(${panel?19:10} ${panel?85:78}% ${Math.min(82,39+light*31+(panel?8:0))}%)`;
  ctx.beginPath();points.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();ctx.fill();ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=.5;ctx.stroke();
 }
 // A surface emblem rotates into view and narrows naturally at the silhouette.
 const face=Math.cos(spin);if(face>0){ctx.save();ctx.translate(Math.sin(spin)*26,-6);ctx.scale(face,1);ctx.globalAlpha=Math.min(1,face*3);ctx.fillStyle='#fff2d6';ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(7,1);ctx.lineTo(2,1);ctx.lineTo(2,9);ctx.lineTo(-2,9);ctx.lineTo(-2,1);ctx.lineTo(-7,1);ctx.closePath();ctx.fill();ctx.restore()}
 const gloss=ctx.createRadialGradient(-10,-21,0,-10,-21,13);gloss.addColorStop(0,'#fff6df88');gloss.addColorStop(1,'#fff6df00');ctx.fillStyle=gloss;ctx.beginPath();ctx.ellipse(-10,-21,12,14,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#dc7258';ctx.beginPath();ctx.moveTo(0,27);ctx.lineTo(-5,35);ctx.lineTo(5,35);ctx.closePath();ctx.fill();
 if(state==='flying'||(state==='paused'&&previousState==='flying')){ctx.strokeStyle='#dcc6a3';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,35);ctx.bezierCurveTo(-wind*20,45,8,51,Math.sin(t*4)*7-wind*30,62);ctx.stroke()}ctx.restore();
}
function weatherAt(seconds){if(alt>=6000)return {warning:false,active:false,dir:1,force:0};const cycle=Math.floor(seconds/18),phase=seconds%18,dir=cycle%2===0?1:-1;return {warning:phase>=8&&phase<10,active:phase>=10&&phase<16,dir,force:phase>=10&&phase<16?dir*Math.sin((phase-10)/6*Math.PI)*(.19+.13*Math.min(alt/10000,1))*(1+.2*Math.sin(seconds*5)):0}}
// No speed cap or altitude finish line: speed continues increasing with height.
function flightSpeed(height){return 90+1.2*Math.sqrt(Math.max(0,height))}
// Generate just ahead of the player; discard objects below the screen.
function generateCourse(){const horizon=alt+H/worldScale+flightSpeed(alt)*2;
 while(nextObstacle<horizon){const i=spawnIndex++;obstacles.push({a:nextObstacle,side:i%2,length:.25+(Math.sin(i*4.7)+1)*.105,moving:i>5&&i%4===0,phase:i*1.8});coins.push({a:nextObstacle-140,x:.5+Math.sin(i*2.3)*.16,collected:false});nextObstacle+=Math.max(290,flightSpeed(nextObstacle)*1.65)}
 obstacles=obstacles.filter(o=>o.a>alt-H/worldScale-100);coins=coins.filter(c=>!c.collected&&c.a>alt-H/worldScale-100);
}
function updateWeather(dt){const weather=weatherAt(flightTime);wind=weather.force;
 $('#weather').textContent=weather.warning?`GUST APPROACHING ${weather.dir>0?'→':'←'}`:weather.active?`STRONG WIND ${weather.dir>0?'→':'←'}`:alt>=6000?'ZERO WIND':'CALM AIR';
 $('#weather').classList.toggle('gust',weather.active||weather.warning);
 if(weather.active){leafClock+=dt;while(leafClock>.075){leafClock-=.075;leaves.push({x:weather.dir>0?-20:W+20,y:Math.random()*H,dir:weather.dir,speed:140+Math.random()*170,angle:Math.random()*6,size:4+Math.random()*5,phase:Math.random()*6})}}else leafClock=0;
 for(const l of leaves){l.x+=l.dir*l.speed*dt;l.y+=(22+Math.sin(t*4+l.phase)*28)*dt;l.angle+=dt*l.dir*5}leaves=leaves.filter(l=>l.x>-50&&l.x<W+50&&l.y<H+30);
}
function drawWeather(){if(Math.abs(wind)>.01){ctx.fillStyle=`rgba(52,88,100,${Math.abs(wind)*.2})`;ctx.fillRect(0,0,W,H)}for(const l of leaves){ctx.save();ctx.translate(l.x,l.y);ctx.rotate(l.angle);ctx.scale(1,.45+.4*Math.abs(Math.sin(t*4+l.phase)));ctx.fillStyle=l.size>6?'#b39748':'#668a56';ctx.beginPath();ctx.moveTo(-l.size,0);ctx.quadraticCurveTo(0,-l.size,l.size,0);ctx.quadraticCurveTo(0,l.size,-l.size,0);ctx.fill();ctx.strokeStyle='#e6d69a';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(-l.size,0);ctx.lineTo(l.size,0);ctx.stroke();ctx.restore()}}
function coinY(item){return balloonY()+(alt-item.a)*worldScale}
function drawCoins(){for(const item of coins){if(item.collected)continue;const yy=coinY(item);if(yy<-40||yy>H+40)continue;ctx.save();ctx.translate(item.x*W,yy);ctx.scale(.35+.65*Math.abs(Math.cos(t*2+item.a)),1);ctx.shadowColor='#ffe18a';ctx.shadowBlur=13;ctx.fillStyle='#f3bb39';ctx.strokeStyle='#ba7e1b';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,14,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.strokeStyle='#fff0a5';ctx.beginPath();ctx.arc(0,0,10,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#fff1b2';ctx.font='bold 17px sans-serif';ctx.textAlign='center';ctx.fillText('1',0,6);ctx.restore()}}
function collectCoins(){for(const item of coins){if(item.collected)continue;const dx=item.x*W-x*W,dy=coinY(item)-balloonY();if((dx/43)**2+(dy/48)**2<1){item.collected=true;coinCount++;gameSound.effect('coin');for(let i=0;i<8;i++)particles.push({x:item.x*W,y:coinY(item),vx:Math.cos(i)*65,vy:Math.sin(i)*65,life:.5})}}}
function hitsObstacle(z){const left=z.side?W-z.len-8:0,right=z.side?W:z.len+8;const tilt=vx*.16+wind*.12;return [{offset:-5,rx:28,ry:32}].some(body=>{const cx=x*W-Math.sin(tilt)*body.offset,cy=balloonY()+Math.cos(tilt)*body.offset;const nx=Math.max(left,Math.min(cx,right)),ny=Math.max(z.y-26,Math.min(cy,z.y+26));return ((cx-nx)/body.rx)**2+((cy-ny)/body.ry)**2<1})}
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
 const rings=[[-45,0],[-33,7],[-20,9],[23,8],[37,3],[43,0]];
 for(let r=0;r<rings.length-1;r++)for(let j=0;j<12;j++){const a=j*Math.PI/6,b=(j+1)*Math.PI/6,[xx,rr]=rings[r],[nx,nr]=rings[r+1];face([[xx,Math.sin(a)*rr,Math.cos(a)*rr],[nx,Math.sin(a)*nr,Math.cos(a)*nr],[nx,Math.sin(b)*nr,Math.cos(b)*nr],[xx,Math.sin(b)*rr,Math.cos(b)*rr]],`hsl(205 24% ${54+24*Math.max(0,-Math.sin(a))}%)`)}
 for(const side of [-1,1]){face([[-12,0,0],[12,0,side*48],[27,0,side*49],[15,0,0]],'#d9e4eb');face([[12,0,side*48],[27,0,side*49],[27,3,side*49],[12,3,side*48]],'#71889b');face([[27,-2,0],[35,-3,side*21],[43,-3,side*22],[40,-2,0]],'#98afbf');face([[-32,-5,side*4],[-22,-8,side*6],[-15,-7,side*6],[-20,-4,side*8]],'#27475a')}
 face([[26,-5,0],[34,-26,0],[42,-26,0],[40,-3,0]],'#6195b7');
 if(e.age>5){for(let i=0;i<9;i++){ctx.fillStyle=`rgba(77,86,99,${.26-i*.023})`;ctx.beginPath();ctx.arc(px+25+i*8,py+10+i*5,3+i*1.4,0,Math.PI*2);ctx.fill()}}
 faces.sort((a,b)=>b.z-a.z).forEach(f=>{ctx.fillStyle=f.color;ctx.beginPath();f.p.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();ctx.fill()});
}
function drawPeople(){
 if(planeEvent&&planeEvent.age>=9&&planeEvent.age<19){ctx.save();ctx.fillStyle='#a45540';ctx.font='bold 17px sans-serif';ctx.textAlign='center';for(let i=planeEvent.released;i<3;i++)ctx.fillText('↓',planeEvent.lanes[i]*W,32);ctx.restore()}
 for(const p of people){ctx.save();ctx.translate(p.x*W,p.y);ctx.rotate(Math.sin(t*2+p.phase)*.07);ctx.fillStyle='#efc477';ctx.beginPath();ctx.arc(0,-12,22,Math.PI,0);ctx.quadraticCurveTo(11,-17,0,-12);ctx.quadraticCurveTo(-11,-17,-22,-12);ctx.fill();ctx.strokeStyle='#a57b49';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-21,-12);ctx.lineTo(-5,17);ctx.moveTo(21,-12);ctx.lineTo(5,17);ctx.moveTo(0,-12);ctx.lineTo(0,13);ctx.stroke();ctx.fillStyle='#4b697d';ctx.fillRect(-5,16,10,12);ctx.fillStyle='#dca178';ctx.beginPath();ctx.arc(0,11,5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#41505c';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-3,27);ctx.lineTo(-6,36);ctx.moveTo(3,27);ctx.lineTo(6,36);ctx.moveTo(-4,18);ctx.lineTo(-10,12);ctx.moveTo(4,18);ctx.lineTo(10,12);ctx.stroke();ctx.restore()}
}
function hitsPerson(p){const dx=(x-p.x)*W,dy=balloonY()-p.y;return ((dx/48)**2+((dy+18)/48)**2<1)||((dx/36)**2+((dy-20)/49)**2<1)}
function draw(){drawCosmos();drawPlane();ctx.strokeStyle='#5f929020';ctx.fillStyle='#6a959078';ctx.font='9px sans-serif';for(let m=Math.floor(alt/250)*250;m<alt+1200;m+=250){let yy=balloonY()+(alt-m)*worldScale;if(yy>30&&yy<H-35){ctx.beginPath();ctx.moveTo(W-14,yy);ctx.lineTo(W-6,yy);ctx.stroke()}}
const ground=H-50+alt*worldScale;if(ground<H+100){ctx.fillStyle='#bbd1a5';ctx.beginPath();ctx.moveTo(0,ground+10);ctx.quadraticCurveTo(W*.22,ground-35,W*.52,ground+3);ctx.quadraticCurveTo(W*.8,ground-20,W,ground);ctx.lineTo(W,H+100);ctx.lineTo(0,H+100);ctx.fill();ctx.fillStyle='#8eb58b';ctx.beginPath();ctx.moveTo(0,ground+25);ctx.quadraticCurveTo(W*.55,ground-7,W,ground+26);ctx.lineTo(W,H+100);ctx.lineTo(0,H+100);ctx.fill();ctx.fillStyle='#698e70';ctx.fillRect(W/2-3,ground-4,6,20)}
if(!planeEvent&&people.length===0)obstacles.forEach(drawObstacle);drawCoins();if(state==='ready'||(state==='paused'&&previousState==='ready')){let r=rope();ctx.strokeStyle='#b79b76';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(r.a.x,r.a.y);ctx.quadraticCurveTo(r.a.x+7,r.a.y+35,r.b.x,r.b.y);ctx.stroke();ctx.setLineDash([3,5]);ctx.strokeStyle='#ffffffaa';ctx.beginPath();ctx.moveTo(W*.35,(r.a.y+r.b.y)/2);ctx.lineTo(W*.65,(r.a.y+r.b.y)/2);ctx.stroke();ctx.setLineDash([])}drawPeople();drawBalloon();drawWeather();for(const p of particles){ctx.fillStyle='#e8795c';ctx.fillRect(p.x,p.y,4,7)}}
function update(dt){t+=dt;spin+=dt*(.65+Math.abs(wind)*3+Math.abs(vx));if(state==='flying'){flightTime+=dt;generateCourse();updateWeather(dt);updateAirTraffic(dt);let direction=(keys.has('arrowright')||keys.has('d')?1:0)-(keys.has('arrowleft')||keys.has('a')?1:0);let desired=direction*.65;if(target!==null)desired=Math.max(-.85,Math.min(.85,(target-x)*6));vx+=(desired+wind-vx)*Math.min(1,dt*4);x+=vx*dt;x=Math.max((radius+5)/W,Math.min(1-(radius+5)/W,x));alt+=dt*flightSpeed(alt);collectCoins();for(const o of obstacles){const z=spike(o);if(!planeEvent&&people.length===0&&hitsObstacle(z)){finish();break}}if(state==='flying'&&people.some(hitsPerson))finish();}for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=50*dt;p.life-=dt}particles=particles.filter(p=>p.life>0);$('#coin-count').textContent=coinCount;$('#altitude').textContent=Math.floor(alt).toLocaleString();$('#speed').textContent=(state==='ready'?0:Math.round(flightSpeed(alt)))+' m/s';$('#zone').textContent=region().name;$('.game-shell').classList.toggle('space',alt>=3000)}
function frame(now){const dt=Math.min((now-last)/1000||0,.035);last=now;if(state!=='paused'){let remaining=dt;while(remaining>0){const step=Math.min(remaining,8/(flightSpeed(alt)*worldScale));update(step);remaining-=step}}gameSound.update(state,wind,flightSpeed(alt),alt,document.hidden);draw();requestAnimationFrame(frame)}reset();resize();requestAnimationFrame(frame);
