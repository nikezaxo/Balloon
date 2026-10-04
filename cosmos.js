'use strict';
const TAU=Math.PI*2,INK='#1b1240';
// Fictional altitude bands for a continuous arcade journey, not physical distances.
const ZONES=[
 {from:0,name:'THE ATMOSPHERE',top:'#3fa9ff',bottom:'#c4f3ff'},
 {from:3000,name:'OUTER ATMOSPHERE',top:'#1a2f8f',bottom:'#4f9dff'},
 {from:6000,name:'THE STARFIELD',top:'#0b0a36',bottom:'#25206e'},
 {from:10000,name:'THE PLANETS',top:'#160b45',bottom:'#4a2275'},
 {from:16000,name:'PASSING THE SUN',top:'#3a0d3d',bottom:'#b04a2a'},
 {from:23000,name:'THE UNIVERSE',top:'#08052a',bottom:'#35166a'}];
function region(){let zone=ZONES[0];for(const z of ZONES)if(alt>=z.from)zone=z;return zone}
function mixColor(a,b,k){const p=parseInt(a.slice(1),16),q=parseInt(b.slice(1),16),ch=s=>Math.round(((p>>s)&255)*(1-k)+((q>>s)&255)*k);return `rgb(${ch(16)},${ch(8)},${ch(0)})`}
// The sky blends into the next zone's colours over the last 900 m of each band.
function skyColors(){const i=ZONES.indexOf(region()),z=ZONES[i],n=ZONES[i+1];if(!n)return [z.top,z.bottom];const k=Math.max(0,Math.min(1,(alt-(n.from-900))/900));return [mixColor(z.top,n.top,k),mixColor(z.bottom,n.bottom,k)]}
const hash=n=>{const v=Math.sin(n)*43758.5453;return v-Math.floor(v)};
const STARS=Array.from({length:130},(_,i)=>({x:hash(i*12.9898+1),y:hash(i*78.233+2),size:hash(i*3.7+3),phase:hash(i*5.1+4)*TAU}));
function orb(cx,cy,r,light,mid,dark){const g=ctx.createRadialGradient(cx-r*.35,cy-r*.4,r*.03,cx,cy,r);g.addColorStop(0,light);g.addColorStop(.5,mid);g.addColorStop(1,dark);ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.fill()}
function outline(cx,cy,r,width=3){ctx.strokeStyle=INK;ctx.lineWidth=width;ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.stroke()}
// Two-tone cartoon cloud: a shaded underside peeks out below the white puffs.
const PUFFS=[[-38,4,19],[-15,-11,25],[15,-8,23],[38,5,17],[0,6,22]];
function cloud(cx,cy,s,alpha){ctx.save();ctx.translate(cx,cy);ctx.scale(s,s);ctx.globalAlpha=alpha;ctx.fillStyle='#b5d6f5';for(const [px,py,r] of PUFFS){ctx.beginPath();ctx.arc(px,py+7,r,0,TAU);ctx.fill()}ctx.fillStyle='#fff';for(const [px,py,r] of PUFFS){ctx.beginPath();ctx.arc(px,py,r,0,TAU);ctx.fill()}ctx.restore()}
function sunburst(cx,cy,r,rays,color,alpha,speed=.15){ctx.save();ctx.translate(cx,cy);ctx.rotate(t*speed);ctx.globalAlpha=alpha;ctx.fillStyle=color;for(let i=0;i<rays;i++){ctx.rotate(TAU/rays);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(r,-r*.13);ctx.lineTo(r,r*.13);ctx.closePath();ctx.fill()}ctx.restore()}
function mountains(){const layers=[{y:H*.84+alt*.1,c:'#a6d3f5',snow:true,h:.2,o:1},{y:H*.9+alt*.2,c:'#7fb8ea',snow:false,h:.14,o:7}];
 for(const l of layers){if(l.y-H*l.h>H+20)continue;ctx.fillStyle=l.c;ctx.beginPath();ctx.moveTo(-40,H+300);ctx.lineTo(-40,l.y);const peaks=[];for(let i=0;i<=7;i++){const px=-40+i*(W+80)/7,ph=H*l.h*(.55+.45*hash(i+l.o));peaks.push([px,l.y-ph]);ctx.lineTo(px-(W+80)/14,l.y);ctx.lineTo(px,l.y-ph)}ctx.lineTo(W+40,l.y);ctx.lineTo(W+40,H+300);ctx.closePath();ctx.fill();
  if(l.snow){ctx.fillStyle='#f3fbff';for(const [px,py] of peaks){ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px-11,py+14);ctx.lineTo(px-3,py+10);ctx.lineTo(px+4,py+15);ctx.lineTo(px+11,py+14);ctx.closePath();ctx.fill()}}}}
function stars(opacity){for(const s of STARS){const sx=s.x*W,sy=(s.y*(H+20)+alt*.025*(.5+s.size))%(H+20)-10,tw=.55+.45*Math.sin(t*2.2+s.phase);ctx.globalAlpha=opacity*tw;ctx.fillStyle=s.phase>5.3?'#ffd9a8':'#eef3ff';
  if(s.size>.93){const r=4+tw*3;ctx.beginPath();ctx.moveTo(sx,sy-r);ctx.quadraticCurveTo(sx,sy,sx+r,sy);ctx.quadraticCurveTo(sx,sy,sx,sy+r);ctx.quadraticCurveTo(sx,sy,sx-r,sy);ctx.quadraticCurveTo(sx,sy,sx,sy-r);ctx.fill()}
  else{ctx.beginPath();ctx.arc(sx,sy,s.size>.6?1.4:.8,0,TAU);ctx.fill()}}ctx.globalAlpha=1}
function shootingStar(){const cycle=Math.floor(t/3.2),k=(t%3.2)/.7;if(k>1)return;const sx=W*(.1+.6*hash(cycle)),sy=H*(.08+.4*hash(cycle+.5)),hx=sx+k*W*.45,hy=sy+k*W*.22;const g=ctx.createLinearGradient(hx-70,hy-34,hx,hy);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(1,`rgba(255,255,255,${1-k})`);ctx.strokeStyle=g;ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(hx-70,hy-34);ctx.lineTo(hx,hy);ctx.stroke()}
function planet(cx,cy,r,colors,ring){
 if(ring){ctx.save();ctx.translate(cx,cy);ctx.rotate(-.3);ctx.strokeStyle=INK;ctx.lineWidth=r*.22;ctx.beginPath();ctx.ellipse(0,0,r*1.65,r*.4,0,Math.PI,TAU);ctx.stroke();ctx.strokeStyle=ring;ctx.lineWidth=r*.14;ctx.stroke();ctx.restore()}
 orb(cx,cy,r,...colors);ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.clip();ctx.fillStyle='rgba(255,255,255,.13)';for(let i=-2;i<=2;i++)ctx.fillRect(cx-r,cy+i*r*.38-r*.07,r*2,r*.14);ctx.fillStyle='rgba(20,0,40,.25)';ctx.beginPath();ctx.arc(cx+r*.45,cy+r*.35,r*1.05,0,TAU);ctx.fill();ctx.restore();outline(cx,cy,r);
 if(ring){ctx.save();ctx.translate(cx,cy);ctx.rotate(-.3);ctx.strokeStyle=INK;ctx.lineWidth=r*.22;ctx.beginPath();ctx.ellipse(0,0,r*1.65,r*.4,0,0,Math.PI);ctx.stroke();ctx.strokeStyle=ring;ctx.lineWidth=r*.14;ctx.stroke();ctx.restore()}}
function drawCosmos(){const [top,bottom]=skyColors(),sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,top);sky.addColorStop(1,bottom);ctx.fillStyle=sky;ctx.fillRect(-40,-40,W+80,H+80);
 if(alt>=2500)stars(Math.min(1,(alt-2500)/2500));
 if(alt<4500){const fade=Math.max(0,1-alt/4500),sx=W*.78,sy=H*.2+alt*.03;sunburst(sx,sy,120,14,'#fff7c2',.28*fade);ctx.globalAlpha=fade;orb(sx,sy,32,'#fffde8','#fff0a0','#ffcf4a');ctx.globalAlpha=1}
 if(alt<1500)mountains();
 if(alt>=3000&&alt<7500){const k=Math.min(1,(alt-3000)/1200)*Math.max(0,Math.min(1,(7500-alt)/1500)),cy=H*1.45+(alt-3000)*.05,r=W*1.25;ctx.save();ctx.globalAlpha=k;ctx.shadowColor='#5fd2ff';ctx.shadowBlur=40;const g=ctx.createRadialGradient(W*.4,cy-r*.9,r*.2,W*.5,cy,r);g.addColorStop(0,'#5fb4ff');g.addColorStop(1,'#163f9e');ctx.fillStyle=g;ctx.beginPath();ctx.arc(W*.5,cy,r,0,TAU);ctx.fill();ctx.shadowBlur=0;ctx.beginPath();ctx.arc(W*.5,cy,r,0,TAU);ctx.clip();ctx.fillStyle='#4fc06a';for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(W*(.1+i*.22),cy-r+30+hash(i)*40,40+hash(i+2)*50,18+hash(i+3)*14,hash(i+4),0,TAU);ctx.fill()}ctx.restore();ctx.save();ctx.globalAlpha=k;ctx.strokeStyle='#9eeaff';ctx.lineWidth=6;ctx.beginPath();ctx.arc(W*.5,cy,r+4,0,TAU);ctx.stroke();ctx.restore()}
 if(alt<6500){const fade=alt<3000?1:Math.max(0,1-(alt-3000)/3500);
  for(let i=0;i<6;i++){const cy=((i*161+alt*.12+40)%(H+200))-100,cx=((W*hash(i*9.1)+t*6)%(W+160))-80;cloud(cx,cy,.45+hash(i)*.2,.5*fade)}
  for(let i=0;i<5;i++){const cy=((i*197+alt*.3+120)%(H+240))-120,cx=((W*hash(i*4.3+1)+t*14)%(W+220))-110;cloud(cx,cy,.85+hash(i+5)*.35,.92*fade)}}
 if(alt>=6000)shootingStar();
 if(alt>=10000&&alt<16000){const p=(alt-10000)/6000;planet(W*.76,H*(.14+p*.32),46,['#e2c6ff','#9a5fd6','#3b2266'],'#ffd6a3');planet(W*.17,H*(.5+p*.18),22,['#ffd0a0','#e0684e','#5a2440']);ctx.fillStyle='rgba(60,10,30,.35)';for(const [dx,dy,r] of [[-7,-5,4],[6,6,3],[5,-9,2.4]]){ctx.beginPath();ctx.arc(W*.17+dx,H*(.5+p*.18)+dy,r,0,TAU);ctx.fill()}planet(W*.42,H*(.08+p*.5),9,['#ffffff','#b9c8e8','#5d6b8f'])}
 if(alt>=16000&&alt<23000){const p=(alt-16000)/7000,cx=W*.82,cy=H*(.1+p*.7),r=80;const glow=ctx.createRadialGradient(cx,cy,30,cx,cy,260);glow.addColorStop(0,'#ffdf8577');glow.addColorStop(1,'#ff912000');ctx.fillStyle=glow;ctx.fillRect(-40,-40,W+80,H+80);sunburst(cx,cy,260,18,'#ffe28a',.22,.1);sunburst(cx,cy,190,18,'#fff2b8',.18,-.14);orb(cx,cy,r,'#fff8c4','#ffc24d','#ea6727');ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.clip();ctx.strokeStyle='rgba(255,255,255,.25)';ctx.lineWidth=6;for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(cx,cy,r*(.35+i*.22),t*.6+i*2,t*.6+i*2+1.6);ctx.stroke()}ctx.restore();outline(cx,cy,r,4)}
 if(alt>=23000){for(let i=0;i<3;i++){const cx=W*(.15+i*.35),cy=((i*H*.31+alt*.006)%(H+200))-100,g=ctx.createRadialGradient(cx,cy,0,cx,cy,190);g.addColorStop(0,i%2?'#a03cff55':'#2a9bff55');g.addColorStop(1,'#15204700');ctx.fillStyle=g;ctx.fillRect(-40,-40,W+80,H+80)}ctx.save();ctx.translate(W*.64,H*.28);ctx.rotate(-.5);const core=ctx.createRadialGradient(0,0,0,0,0,26);core.addColorStop(0,'#fff6ff');core.addColorStop(1,'#c9a8ff00');ctx.fillStyle=core;ctx.beginPath();ctx.ellipse(0,0,30,12,0,0,TAU);ctx.fill();for(let i=0;i<90;i++){const arm=i%2?Math.PI:0,a=i*.18+arm+t*.03,r=4+i*.55;ctx.fillStyle=`rgba(${i%3?'231,219,255':'160,220,255'},${.85-i*.008})`;ctx.beginPath();ctx.ellipse(Math.cos(a)*r,Math.sin(a)*r*.38,1.6,1.2,0,0,TAU);ctx.fill()}ctx.restore()}
}
