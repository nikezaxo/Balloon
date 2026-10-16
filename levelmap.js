// The LEVEL path's living world map. The road crosses floating islands joined by bridges, birds and creatures fly past,
// and climbing from level 1 to 100 travels through the six stages in order: the sunny sky over the sea, the jungle,
// the crystal cave, the robo factory, outer space and the deep universe. Each new world starts after a longer bridge
// under its name sign. Only the visible part is drawn, on one canvas that follows the scroll.
const LVL_GAP=110;
const LVL_ZONES=[
 {id:'sky',from:1,to:16,top:'#4aa8f5',bottom:'#c4f3ff',land:{top:'#7fd858',hi:'#b4f08a',cliff:'#b07a48',drip:'#8a5a34'},bridge:'wood'},
 {id:'jungle',from:17,to:33,top:'#2a9f8e',bottom:'#8fe0c8',land:{top:'#3fb24a',hi:'#7ad85e',cliff:'#7a4a26',drip:'#5e3a1e'},bridge:'wood'},
 {id:'cave',from:34,to:50,top:'#1e1236',bottom:'#4a3470',land:{top:'#7d62a0',hi:'#a58ccc',cliff:'#4a3466',drip:'#33244d'},bridge:'crystal'},
 {id:'factory',from:51,to:66,top:'#1c2233',bottom:'#3d4a66',land:{top:'#9aa6bf',hi:'#d0d8e8',cliff:'#56617a',drip:null},bridge:'metal'},
 {id:'space',from:67,to:83,top:'#0a0933',bottom:'#1d1866',land:{top:'#a9a2b8',hi:'#d6d0e2',cliff:'#6e6880',drip:'#4f4a60'},bridge:'beam',beam:'#7fe8ff'},
 {id:'universe',from:84,to:100,top:'#07041f',bottom:'#2b0f56',land:{top:'#8a5cf0',hi:'#c9adff',cliff:'#4a2a9a',drip:'#6a34d0'},bridge:'beam',beam:'#d9b8ff'}];
const lvlZoneOf=L=>LVL_ZONES.find(z=>L>=z.from&&L<=z.to)||LVL_ZONES[LVL_ZONES.length-1];
// Extra road above level L: one gap per world that starts higher up (lvlGapsAbove(0) also leaves room under level 1).
const lvlGapsAbove=L=>LVL_ZONES.filter(z=>z.from>L).length*LVL_GAP;
const lvlRand=seed=>()=>{seed=(seed+0x6D2B79F5)|0;let q=Math.imul(seed^(seed>>>15),1|seed);q=(q+Math.imul(q^(q>>>7),61|q))^q;return ((q^(q>>>14))>>>0)/4294967296};
// A point k (0..1) along the road from level L to L+1 (the same curve the road is drawn with).
function lvlRoadAt(S,L,k){const x0=S.X(L),y0=S.Y(L),x1=S.X(L+1),y1=S.Y(L+1),ym=(y0+y1)/2,u=1-k,a=u*u*u,b=3*u*u*k,c=3*u*k*k,d=k*k*k;return {x:(a+b)*x0+(c+d)*x1,y:a*y0+(b+c)*ym+d*y1}}

let lvlScene=null,lvlSceneOn=false;
function levelScene(map,list,height,yOf){const cv=el('canvas','lvl-scene');map.prepend(cv);lvlScene={cv,map,list,height,yOf,w:0};
 for(const z of LVL_ZONES){const st=STAGES.find(s=>s.id===z.id)||{},a=z.from-1,b=el('div','lvl-zone');
  b.style.left=(a<1?50:(lvlX(a)+lvlX(z.from))/2)+'%';b.style.top=(a<1?yOf(1)+105:(yOf(a)+yOf(z.from))/2)+'px';b.style.setProperty('--zc',z.bottom);
  b.innerHTML=`${iconHTML(st.icon||'star')}<span><b>${st.name||z.id.toUpperCase()}</b><small>LEVELS ${z.from}-${z.to}</small></span>`;map.append(b)}
 if(!lvlSceneOn){lvlSceneOn=true;requestAnimationFrame(lvlSceneLoop)}}
function lvlSceneLoop(){const S=lvlScene;if(!S||!S.cv.isConnected){lvlSceneOn=false;return}
 const main=ctx;try{lvlSceneDraw(S)}catch(e){console.error(e);lvlSceneOn=false;lvlScene=null;return}finally{ctx=main}
 requestAnimationFrame(lvlSceneLoop)}

// Where everything goes, decided once per map width from a fixed seed so the world looks the same every visit.
const LVL_DECOR={sky:['tree','tree','bush','flowers','hut','rock'],jungle:['palm','palm','bush','hibiscus','rock'],cave:['crystal','crystal','shroom','brazier','rock'],
 factory:['lamp','crate','barrel','gearlet'],space:['crater','flag','dish','rocket','crater'],universe:['ucrystal','ustar','orbit']};
function lvlLayout(S){const w=S.w,H=S.height,r=lvlRand(1016),rng=(a,b)=>a+r()*(b-a),pick=a=>a[Math.floor(r()*a.length)],dir=()=>r()<.5?-1:1,X=L=>lvlX(L)/100*w,Y=S.yOf;S.X=X;S.Y=Y;
 const Z={};for(const z of LVL_ZONES)Z[z.id]={z,y0:z.to>=MAX_LEVEL?0:(Y(z.to)+Y(z.to+1))/2,y1:z.from<=1?H:(Y(z.from)+Y(z.from-1))/2};
 const g=S.cv.getContext('2d').createLinearGradient(0,0,0,H);for(const z of [...LVL_ZONES].reverse()){const s=Z[z.id];g.addColorStop(Math.min(1,(s.y0+90)/H),z.top);g.addColorStop(Math.max(0,(s.y1-90)/H),z.bottom)}S.grad=g;
 const islands=[],back=[],fly=[];
 for(let L=1;L<=MAX_LEVEL;){const z=lvlZoneOf(L);let b=Math.min(L+1+Math.floor(r()*3),z.to);if(b===z.to-1)b=z.to;islands.push({a:L,b,z});L=b+1}
 for(const isl of islands){const bl=isl.blobs=[];isl.decor=[];
  // Island ends shrink back from their bridges so the bridge shows between them.
  for(let L=isl.a;L<=isl.b;L++){const lo=L===isl.a&&L>1,hi=L===isl.b&&L<MAX_LEVEL;bl.push(lo||hi?[X(L),Y(L)+(hi&&!lo?10:lo&&!hi?-10:0),rng(32,36)]:[X(L),Y(L),rng(44,52)]);
   if(L<isl.b)for(const k of [.25,.5,.75]){const p=lvlRoadAt(S,L,k);bl.push([p.x+rng(-8,8),p.y,rng(38,46)])}}
  // Something on each level's free side (its reward card covers the other side); none beside START.
  for(let L=Math.max(2,isl.a);L<=isl.b;L++){const side=X(L)>w/2?1:-1,off=L%10===0?(L>=60?48:42):37;bl.push([X(L)+side*(off-6),Y(L)+6,rng(30,36)]);isl.decor.push({k:pick(LVL_DECOR[isl.z.id]),L,x:X(L)+side*off,y:Y(L)+rng(0,12),s:rng(.85,1.1),side,ph:r()*TAU,c:pick(['#5ff0ff','#ff6ad5','#b07aff','#7dffb0','#ffd23f'])})}
  isl.drips=bl.filter((_,i)=>i%2===0).map(([x,y,rr])=>[x,y,rr,rng(-.25,.25),rng(1,1.7)]);
  isl.y0=Math.min(...bl.map(b=>b[1]-b[2]))-50;isl.y1=Math.max(...bl.map(b=>b[1]+b[2]))+90;
  if(isl.b<MAX_LEVEL)isl.up={L:isl.b,z:isl.z,y0:Y(isl.b+1)-20,y1:Y(isl.b)+20}}
 islands[0].beach=true;S.ocean=Y(islands[0].b)-80;
 const along=(s,n,f)=>{for(let i=0;i<n;i++)f(s.y0+(i+r())/n*(s.y1-s.y0),i)},sky=Z.sky,jun=Z.jungle,cav=Z.cave,fac=Z.factory,spa=Z.space,uni=Z.universe,high={y0:sky.y0,y1:S.ocean-60};
 // Sunny sky over the sea: clouds, hot-air balloons, a rainbow, flocks of birds and a sailing boat.
 back.push({k:'sea',y:(S.ocean+H)/2,r:(H-S.ocean)/2+20,top:S.ocean,isles:[0,1,2,3].map(i=>({x:(i+.2+r()*.6)*w/4,s:rng(.6,1.2)}))});
 back.push({k:'boat',x:rng(0,w),y:H-34,r:30,v:rng(6,10)});
 along(high,14,y=>back.push({k:'cloud',x:rng(0,w),y,r:45,s:rng(.35,.7),a:rng(.55,.9),v:rng(3,9)}));
 back.push({k:'rainbow',x:rng(w*.3,w*.7),y:Y(9)-10,cy:Y(9)+40,r:110});
 along(high,4,(y,i)=>back.push({k:'hotair',x:rng(20,w-20),y,r:30,s:rng(6,9),i}));
 along({y0:sky.y0,y1:H-40},7,y=>fly.push({k:'birds',y,r:34,v:rng(16,28)*dir(),ph:r()*1000,n:3+Math.floor(r()*3),gull:r()<.4}));
 // Jungle: leafy edges with vines, a waterfall, parrots and butterflies.
 along(jun,26,(y,i)=>back.push({k:'leaves',x:i%2?w+8:-8,y,r:44,s:rng(24,36),dark:r()<.5}));
 along(jun,8,(y,i)=>back.push({k:'vine',x:i%2?rng(w-34,w-10):rng(10,34),y,r:70,len:rng(50,100),ph:r()*TAU}));
 back.push({k:'falls',x:r()<.5?0:w,y:Y(25),r:160});
 along(jun,6,y=>back.push({k:'cloud',x:rng(0,w),y,r:40,s:rng(.3,.5),a:rng(.3,.5),v:rng(2,6)}));
 along(jun,5,y=>fly.push({k:'parrot',y,r:26,v:rng(22,34)*dir(),ph:r()*1000}));
 along(jun,8,y=>fly.push({k:'butterfly',x:rng(20,w-20),y,r:24,ph:r()*TAU,c:pick(['#ff6ad5','#ffd23f','#5ff0ff','#ff8a2a'])}));
 // Crystal cave: jagged rock walls with glowing crystals, floating spores and bats.
 const wall=side=>{const pts=[];for(let y=cav.y0-40;y<=cav.y1+40;y+=34){const e=Math.max(0,Math.min(1,(y-cav.y0+40)/180,(cav.y1+40-y)/180));pts.push([y,e*rng(14,44)])}return {k:'wall',side,pts,y:(cav.y0+cav.y1)/2,r:(cav.y1-cav.y0)/2+60}};
 back.push(wall(-1),wall(1));
 along({y0:cav.y0+120,y1:cav.y1-120},14,(y,i)=>back.push({k:'wallgem',x:i%2?w-rng(6,16):rng(6,16),y,r:34,side:i%2?1:-1,s:rng(7,11),c:pick(['#5ff0ff','#ff6ad5','#b07aff','#7dffb0'])}));
 along(cav,28,y=>back.push({k:'spore',x:rng(14,w-14),y,r:60,ph:r()*TAU,c:pick(['#7dffb0','#5ff0ff','#ff9af0'])}));
 along(cav,6,y=>fly.push({k:'bat',y,r:22,v:rng(20,34)*dir(),ph:r()*1000}));
 // Robo factory: riveted pillars with warning lights, turning gears, pipes letting off steam and patrol drones.
 back.push({k:'pillars',y:(fac.y0+fac.y1)/2,r:(fac.y1-fac.y0)/2+30,y0:fac.y0-30,y1:fac.y1+30});
 along(fac,4,y=>back.push({k:'pipe',y,r:40,c:pick(['#d05a3a','#3a8ad0','#6aa84a']),ph:r()*TAU,j:rng(40,w-40)}));
 along(fac,8,(y,i)=>back.push({k:'gear',x:i%2?w+4:-4,y,r:50,rad:rng(26,40),dir:i%2?1:-1,c:r()<.5?'#8a96ae':'#b8c2d6'}));
 along(fac,5,y=>fly.push({k:'drone',y,r:26,v:rng(18,28)*dir(),ph:r()*1000}));
 // Outer space and the deep universe: twinkling stars, planets, satellites, UFOs, an astronaut, nebulas, galaxies and comets.
 const stars=(s,n,cols)=>{for(let i=0;i<n;i++)back.push({k:'star',x:rng(0,w),y:rng(s.y0,s.y1),r:4,s:rng(.6,1.8),ph:r()*TAU,c:pick(cols)})};
 stars(spa,80,['#ffffff','#cfe3ff','#fff3b0']);stars(uni,100,['#ffffff','#ffb3f0','#b3d1ff','#fff3b0']);
 back.push({k:'planet',x:w*rng(.12,.28),y:Y(71),r:60,rad:30,o:{base:['#bfe9ff','#3f8be0','#1d3f8a'],spots:EARTH_SPOTS,rot:0},spin:.15});
 back.push({k:'planet',x:w*rng(.72,.88),y:Y(79),r:40,rad:20,o:{base:['#ffd0a0','#e06a3a','#7a2a1a'],bands:true,rot:0},spin:.2});
 back.push({k:'planet',x:w*rng(.7,.86),y:Y(68)+30,r:40,rad:16,o:{base:['#f4f4f8','#b8b8c8','#6a6a80'],spots:spotsFor(5,6,['#8a8aa0'],.12,.25),rot:0},spin:.05});
 along(spa,2,y=>back.push({k:'satellite',x:rng(40,w-40),y,r:34,ph:r()*TAU}));
 along(spa,3,y=>fly.push({k:'ufo',y,r:30,v:rng(20,30)*dir(),ph:r()*1000}));
 fly.push({k:'astro',x:rng(50,w-50),y:Y(75)+44,r:34,ph:r()*TAU});
 along({y0:spa.y0,y1:uni.y1},5,y=>fly.push({k:'shoot',y,r:70,ph:r()*9}));
 along(uni,6,y=>back.push({k:'nebula',x:rng(0,w),y,r:120,rad:rng(70,110),c:pick(['#a03fff','#ff4fd8','#3f8bff','#3fe0ff'])}));
 along(uni,3,y=>back.push({k:'galaxy',x:rng(50,w-50),y,r:70,rad:rng(40,58),rot:r()*TAU,c:pick(['#ffb3f0','#b3d1ff','#fff3b0'])}));
 back.push({k:'planet',x:w*rng(.15,.3),y:Y(90),r:70,rad:26,o:{base:['#e0c8ff','#8a5cf0','#3a1a7a'],ring:'#ffd23f',bands:true,rot:0},spin:.1});
 back.push({k:'halo',x:X(MAX_LEVEL),y:Y(MAX_LEVEL),r:160});
 along(uni,3,y=>fly.push({k:'comet',y,r:44,v:rng(40,60)*dir(),ph:r()*1000}));
 Object.assign(S,{islands,back,fly})}

function lvlSceneDraw(S){const {cv,map,list}=S,w=map.clientWidth;if(!w)return;if(w!==S.w){S.w=w;lvlLayout(S)}
 const vh=Math.min(list.clientHeight,S.height),view=list.getBoundingClientRect().top+list.clientTop-map.getBoundingClientRect().top-map.clientTop;
 if(view>S.height||view+vh<0)return;
 const top=Math.round(Math.max(0,Math.min(S.height-vh,view))),d=Math.min(2,window.devicePixelRatio||1),cw=Math.round(w*d),ch=Math.round(vh*d);
 if(cv.width!==cw||cv.height!==ch){cv.width=cw;cv.height=ch;cv.style.width=w+'px';cv.style.height=vh+'px'}
 cv.style.top=top+'px';ctx=cv.getContext('2d');ctx.setTransform(d,0,0,d,0,-top*d);ctx.globalAlpha=1;ctx.lineCap='round';ctx.lineJoin='round';
 const now=matchMedia('(prefers-reduced-motion: reduce)').matches?0:performance.now()/1000,y0=top-30,y1=top+vh+30,vis=(y,r)=>y+r>=y0&&y-r<=y1;S.v0=y0;S.v1=y1;
 ctx.fillStyle=S.grad;ctx.fillRect(0,top,w,vh);
 for(const it of S.back)if(vis(it.y,it.r))LVL_ART[it.k](it,now,S);
 // From the top of the world down, so each island's hanging rock tucks behind the island below it, with the bridge between.
 for(let i=S.islands.length-1;i>=0;i--){const isl=S.islands[i],br=isl.up;if(br&&br.y1>=y0&&br.y0<=y1)lvlBridge(S,br,now);
  if(isl.y1>=y0&&isl.y0<=y1){lvlIsland(isl,now);for(const it of isl.decor)LVL_ART[it.k](it,now,S)}}
 for(const it of S.fly)if(vis(it.y,it.r))LVL_ART[it.k](it,now,S)}

// Islands: a floating rock (or a sandy beach in the sea for the first one), a cliff edge and a grassy top.
const lvlDisc=(x,y,r)=>{ctx.beginPath();ctx.arc(x,y,Math.max(.5,r),0,TAU);ctx.fill()};
const lvlCone=([x,y,r,lean,len])=>{ctx.beginPath();ctx.moveTo(x-r*.72,y+12);ctx.lineTo(x+r*.72,y+12);ctx.lineTo(x+lean*r,y+12+r*len);ctx.closePath()};
function lvlIsland(isl,now){const st=isl.z.land,bl=isl.blobs;
 if(isl.beach){ctx.fillStyle='rgba(255,255,255,.55)';const f=3*Math.sin(now*1.6);for(const [x,y,r] of bl)lvlDisc(x,y+5,r+15+f);
  ctx.fillStyle=INK;for(const [x,y,r] of bl)lvlDisc(x,y+4,r+10.5);ctx.fillStyle='#ffe2a0';for(const [x,y,r] of bl)lvlDisc(x,y+4,r+8);ctx.fillStyle='#4fb83a';for(const [x,y,r] of bl)lvlDisc(x,y+1,r+1)}
 else{if(st.drip){ctx.fillStyle=INK;ctx.strokeStyle=INK;ctx.lineWidth=6;for(const c of isl.drips){lvlCone(c);ctx.fill();ctx.stroke()}ctx.fillStyle=st.drip;for(const c of isl.drips){lvlCone(c);ctx.fill()}
   if(isl.z.id==='universe')for(const [x,y,r,lean,len] of isl.drips)glow(x+lean*r,y+12+r*len,16,'#c9adff',.5+.3*Math.sin(now*2+x))}
  else for(const [x,y] of isl.drips.filter((_,i)=>i%2===0)){const f=1+.25*Math.sin(now*20+x);ctx.fillStyle='#ffb020';ctx.beginPath();ctx.moveTo(x-6,y+32);ctx.quadraticCurveTo(x,y+32+22*f,x+6,y+32);ctx.fill();ctx.fillStyle=INK;ctx.fillRect(x-9,y+18,18,15);ctx.fillStyle='#8a96ae';ctx.fillRect(x-6.5,y+20.5,13,10)}
  ctx.fillStyle=INK;for(const [x,y,r] of bl)lvlDisc(x,y+14,r+3);ctx.fillStyle=st.cliff;for(const [x,y,r] of bl)lvlDisc(x,y+14,r);
  ctx.fillStyle=INK;for(const [x,y,r] of bl)lvlDisc(x,y,r+3)}
 ctx.fillStyle=st.top;for(const [x,y,r] of bl)lvlDisc(x,y,r);
 ctx.globalAlpha=.5;ctx.fillStyle=st.hi;for(const [x,y,r] of bl)lvlDisc(x-r*.12,y-r*.2,r*.6);ctx.globalAlpha=1}

// Bridges between islands: wooden planks, a crystal walkway in the cave, a steel girder in the factory and light beams in space.
function lvlBridge(S,br,now){const z=br.z,pts=[];for(let i=0;i<=30;i++)pts.push(lvlRoadAt(S,br.L,i/30));
 let len=0;for(let i=1;i<pts.length;i++)len+=Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y);
 const at=k=>pts[Math.round(k*30)],nrm=k=>{const i=Math.round(k*30),a=pts[Math.max(0,i-1)],b=pts[Math.min(30,i+1)],dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1;return [-dy/l,dx/l]};
 const side=(o,col,lw)=>{ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.beginPath();for(let i=0;i<=30;i++){const [nx,ny]=nrm(i/30);ctx.lineTo(pts[i].x+nx*o,pts[i].y+ny*o)}ctx.stroke()},n=Math.max(6,Math.round(len/12));
 if(z.bridge==='beam'){ctx.save();ctx.globalAlpha=.22;side(0,z.beam,34);ctx.globalAlpha=.4;side(0,z.beam,20);ctx.restore();for(let j=0;j<6;j++){const p=at((now*.35+j/6)%1);glow(p.x,p.y,10,'#ffffff',.8)}return}
 if(z.bridge==='metal'){for(let i=0;i<=n;i++){const k=i/n,p=at(k),[nx,ny]=nrm(k);ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(p.x-nx*15,p.y-ny*15);ctx.lineTo(p.x+nx*15,p.y+ny*15);ctx.stroke()}
  for(const o of [-15,15]){side(o,INK,7);side(o,'#8a96ae',4)}return}
 const crystal=z.bridge==='crystal';for(const o of [-17,17])side(o,crystal?'#5ff0ff':'#7a4a20',2.5);
 for(let i=0;i<=n;i++){const k=i/n,p=at(k),[nx,ny]=nrm(k);ctx.strokeStyle=INK;ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(p.x-nx*16,p.y-ny*16);ctx.lineTo(p.x+nx*16,p.y+ny*16);ctx.stroke();ctx.strokeStyle=crystal?'#b79cff':'#c08a4a';ctx.lineWidth=4.5;ctx.stroke()}
 if(crystal)for(let j=0;j<3;j++){const p=at((now*.25+j/3)%1);glow(p.x,p.y,14,'#5ff0ff',.6)}}

// Drawing for everything in the world (background, decorations and flyers); flyers cross the map and wrap around.
const lvlAcross=(it,now,S,pad=80)=>wrap(it.ph+now*it.v,S.w+pad*2)-pad;
function lvlInk(fn,lw=2.5){ctx.strokeStyle=INK;ctx.lineWidth=lw;fn();ctx.fill();ctx.stroke()}
function lvlBird(x,y,f,gull){ctx.beginPath();ctx.moveTo(x-11,y-6*f);ctx.quadraticCurveTo(x-5,y-6*f-4,x,y);ctx.quadraticCurveTo(x+5,y-6*f-4,x+11,y-6*f);if(gull){ctx.strokeStyle=INK;ctx.lineWidth=4.5;ctx.stroke();ctx.strokeStyle='#fff';ctx.lineWidth=2.2;ctx.stroke()}else{ctx.strokeStyle='#2b2f55';ctx.lineWidth=2.4;ctx.stroke()}}
const LVL_ART={
 sea(it,now,S){const w=S.w,H=S.height,top=it.top,g=ctx.createLinearGradient(0,top,0,H);g.addColorStop(0,'#86dcff');g.addColorStop(.3,'#3fb2ec');g.addColorStop(1,'#1a7fc8');
  ctx.fillStyle='#4f9fc6';for(const s of it.isles){ctx.beginPath();ctx.ellipse(s.x,top+1,44*s.s,13*s.s,0,Math.PI,TAU);ctx.fill()}
  ctx.fillStyle=g;ctx.fillRect(0,top,w,H-top);ctx.fillStyle='rgba(255,255,255,.7)';ctx.fillRect(0,top,w,2);
  ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=2;const rows=Math.max(4,Math.floor((H-top)/26));
  for(let i=0;i<rows;i++){const yy=top+16+i*(H-top-12)/rows,off=wrap(now*12*(i%2?1:-1)+i*37,60);for(let xx=off-60;xx<w+60;xx+=60){ctx.beginPath();ctx.moveTo(xx,yy);ctx.quadraticCurveTo(xx+7,yy-4,xx+14,yy);ctx.stroke()}}},
 boat(it,now,S){const x=wrap(it.x+now*it.v,S.w+120)-60,y=it.y+Math.sin(now*1.8)*2;ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(now*1.4)*.06);
  lvlInk(()=>{ctx.fillStyle='#b07a48';ctx.beginPath();ctx.moveTo(-18,0);ctx.lineTo(18,0);ctx.lineTo(12,9);ctx.lineTo(-12,9);ctx.closePath()});
  ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-30);ctx.stroke();lvlInk(()=>{ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(2,-28);ctx.lineTo(16,-4);ctx.lineTo(2,-4);ctx.closePath()},2);
  lvlInk(()=>{ctx.fillStyle='#ff4d5e';ctx.beginPath();ctx.moveTo(-2,-26);ctx.lineTo(-14,-5);ctx.lineTo(-2,-5);ctx.closePath()},2);ctx.restore()},
 cloud(it,now,S){cloud(wrap(it.x+now*it.v,S.w+160)-80,it.y,it.s,it.a)},
 rainbow(it){rainbow(it.x,it.cy,it.r,.45)},
 hotair(it,now){miniBalloon(it.x+Math.sin(now*.3+it.i)*10,it.y,it.s,it.i)},
 birds(it,now,S){const x=lvlAcross(it,now,S,100),s=Math.sign(it.v);for(let j=0;j<it.n;j++){const k=Math.ceil(j/2);lvlBird(x-s*k*15,it.y+(j%2?-1:1)*k*8,Math.sin(now*10+j*.9+it.ph),it.gull)}},
 leaves(it,now){leafBlob(it.x+Math.sin(now*.8+it.y)*2,it.y,it.s,it.dark?'#1f7a3a':'#2a8f45',it.dark?'#2f9a4a':'#4fc45a')},
 vine(it,now){const sw=Math.sin(now*1.1+it.ph)*6,top=it.y-it.len/2;ctx.strokeStyle='#2a7a35';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(it.x,top);ctx.quadraticCurveTo(it.x+sw,top+it.len*.6,it.x+sw*1.4,top+it.len);ctx.stroke();
  ctx.fillStyle='#4fc45a';for(let i=1;i<=4;i++){const k=i/5,lx=it.x+sw*1.4*k*k,ly=top+it.len*k;ctx.beginPath();ctx.ellipse(lx+(i%2?5:-5),ly,5,2.6,i%2?.5:-.5,0,TAU);ctx.fill()}},
 falls(it,now,S){const y=it.y;ctx.save();if(it.x>0){ctx.translate(S.w,0);ctx.scale(-1,1)}
  lvlInk(()=>{ctx.fillStyle='#7a5a3a';ctx.beginPath();ctx.moveTo(-4,y-124);ctx.lineTo(44,y-122);ctx.quadraticCurveTo(60,y-104,50,y-84);ctx.lineTo(42,y+130);ctx.lineTo(-4,y+140);ctx.closePath()},3);
  ctx.fillStyle='#3fb24a';ctx.beginPath();ctx.ellipse(22,y-122,30,8,0,0,TAU);ctx.fill();
  ctx.fillStyle='#bff4ff';ctx.fillRect(34,y-108,20,226);ctx.strokeStyle='#fff';ctx.lineWidth=2.5;for(let i=0;i<9;i++){const yy=y-108+wrap(now*90+i*26,226);ctx.beginPath();ctx.moveTo(39,yy);ctx.lineTo(39,Math.min(y+118,yy+14));ctx.moveTo(49,yy+9);ctx.lineTo(49,Math.min(y+118,yy+22));ctx.stroke()}
  ctx.fillStyle='rgba(255,255,255,.8)';for(let i=0;i<4;i++)lvlDisc(30+i*9,y+120,8+2*Math.sin(now*3+i));ctx.restore()},
 wall(it,now,S){const xo=v=>it.side<0?v:S.w-v,p=it.pts;ctx.fillStyle='#24163c';ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(xo(-4),p[0][0]);for(const [y,v] of p)ctx.lineTo(xo(v),y);ctx.lineTo(xo(-4),p[p.length-1][0]);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle='#5a4180';ctx.beginPath();for(const [y,v] of p)ctx.lineTo(xo(Math.max(0,v-5)),y);ctx.stroke()},
 wallgem(it){ctx.save();ctx.translate(it.x,it.y);ctx.rotate(it.side<0?Math.PI/2:-Math.PI/2);crystalCluster(0,0,it.s,it.c);ctx.restore()},
 spore(it,now){const k=wrap(now*.12+it.ph,1),y=it.y+30-k*60;ctx.save();ctx.globalAlpha=Math.sin(k*Math.PI)*.85;glow(it.x+Math.sin(now+it.ph)*6,y,9,it.c,.7);ctx.fillStyle='#fff';lvlDisc(it.x+Math.sin(now+it.ph)*6,y,1.6);ctx.restore()},
 pillars(it,now,S){const a=Math.max(it.y0,S.v0),b=Math.min(it.y1,S.v1);if(a>b)return;for(const x0 of [0,S.w-14]){ctx.fillStyle='#56617a';ctx.fillRect(x0,a,14,b-a);ctx.fillStyle=INK;ctx.fillRect(x0===0?13:x0,a,2,b-a);
   for(let y=Math.ceil(a/40)*40;y<b;y+=40){ctx.fillStyle='#8a96ae';lvlDisc(x0+7,y,2.2);if(y%280===0){for(let s=0;s<3;s++){ctx.fillStyle=s%2?INK:'#ffd23f';ctx.fillRect(x0,y+8+s*6,14,6)}}
    if(y%200===0){ctx.fillStyle=Math.sin(now*4+y)>0?'#ff4d5e':'#6a2030';lvlDisc(x0+7,y+20,3.4)}}}},
 pipe(it,now,S){ctx.strokeStyle=INK;ctx.lineWidth=16;ctx.beginPath();ctx.moveTo(-10,it.y);ctx.lineTo(S.w+10,it.y);ctx.stroke();ctx.strokeStyle=it.c;ctx.lineWidth=11;ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-10,it.y-2.5);ctx.lineTo(S.w+10,it.y-2.5);ctx.stroke();
  for(let x=20;x<S.w;x+=70){ctx.fillStyle=INK;ctx.fillRect(x-5,it.y-10,10,20);ctx.fillStyle='#b8c2d6';ctx.fillRect(x-3.5,it.y-8.5,7,17)}
  for(let i=0;i<3;i++){const k=wrap(now*.5+i/3+it.ph,1);ctx.save();ctx.globalAlpha=(1-k)*.7;ctx.fillStyle='#fff';lvlDisc(it.j+k*10,it.y-10-k*34,4+k*8);ctx.restore()}},
 gear(it,now){gear(it.x,it.y,it.rad,now*.6*it.dir,it.c,'#4f5a73',12)},
 drone(it,now,S){const x=lvlAcross(it,now,S,60),y=it.y+Math.sin(now*2+it.ph)*6;ctx.save();ctx.translate(x,y);ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-14,-6);ctx.lineTo(14,-6);ctx.stroke();
  ctx.fillStyle='rgba(220,230,255,.75)';for(const s of [-1,1]){ctx.beginPath();ctx.ellipse(s*14,-8,9*Math.abs(Math.sin(now*40+s)),2,0,0,TAU);ctx.fill()}
  lvlInk(()=>{ctx.fillStyle='#5f6b85';ctx.beginPath();ctx.roundRect(-9,-7,18,12,5)},2);ctx.fillStyle=Math.sin(now*6+it.ph)>0?'#ff4d5e':'#ffd23f';lvlDisc(0,-1,2.6);ctx.restore()},
 star(it,now){ctx.save();ctx.globalAlpha=.35+.65*Math.abs(Math.sin(now*1.3+it.ph));ctx.fillStyle=it.c;if(it.s>1.4){star(it.x,it.y,it.s*2.4,it.s*.6,4);ctx.fill()}else lvlDisc(it.x,it.y,it.s);ctx.restore()},
 planet(it,now){it.o.rot=now*it.spin;sphere(it.x,it.y,it.rad,it.o)},
 satellite(it,now){ctx.save();ctx.translate(it.x+Math.sin(now*.2+it.ph)*20,it.y+Math.cos(now*.25+it.ph)*8);ctx.rotate(Math.sin(now*.3+it.ph)*.4);
  for(const s of [-1,1]){lvlInk(()=>{ctx.fillStyle='#2f6fd0';ctx.beginPath();ctx.rect(s*8+(s<0?-22:0),-6,22,12)},2);ctx.strokeStyle='#8cc4ff';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(s*8+(s<0?-11:11),-6);ctx.lineTo(s*8+(s<0?-11:11),6);ctx.stroke()}
  lvlInk(()=>{ctx.fillStyle='#ffd23f';ctx.beginPath();ctx.rect(-8,-8,16,16)},2);ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(0,-16);ctx.stroke();ctx.fillStyle=Math.sin(now*5)>0?'#ff4d5e':'#fff';lvlDisc(0,-17,2.4);ctx.restore()},
 ufo(it,now,S){const x=lvlAcross(it,now,S,70),y=it.y+Math.sin(now*1.7+it.ph)*8;ctx.save();ctx.translate(x,y);
  if(Math.sin(now*.7+it.ph)>.6){ctx.fillStyle='rgba(127,232,255,.22)';ctx.beginPath();ctx.moveTo(-6,4);ctx.lineTo(6,4);ctx.lineTo(18,48);ctx.lineTo(-18,48);ctx.closePath();ctx.fill()}
  lvlInk(()=>{ctx.fillStyle='rgba(160,240,255,.85)';ctx.beginPath();ctx.ellipse(0,-5,9,8,0,Math.PI,TAU)},2);lvlInk(()=>{ctx.fillStyle='#b8c2d6';ctx.beginPath();ctx.ellipse(0,0,20,6,0,0,TAU)},2);
  for(let i=0;i<4;i++){ctx.fillStyle=(Math.floor(now*6)+i)%2?'#ffd23f':'#ff4d5e';lvlDisc(-12+i*8,1,1.8)}ctx.restore()},
 astro(it,now){ctx.save();ctx.translate(it.x+Math.sin(now*.3+it.ph)*24,it.y+Math.sin(now*.5)*10);ctx.rotate(now*.25);
  lvlInk(()=>{ctx.fillStyle='#d8dde8';ctx.beginPath();ctx.roundRect(-12,-6,8,16,3)},2);lvlInk(()=>{ctx.fillStyle='#fff';ctx.beginPath();ctx.roundRect(-6,-4,13,15,5)},2);
  for(const [x0,y0,x1,y1] of [[-4,9,-6,17],[4,9,6,17],[-5,0,-11,6],[6,0,12,-5]]){ctx.strokeStyle=INK;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();ctx.strokeStyle='#fff';ctx.lineWidth=3.5;ctx.stroke()}
  lvlInk(()=>{ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,-10,8,0,TAU)},2);lvlInk(()=>{ctx.fillStyle='#3f8be0';ctx.beginPath();ctx.ellipse(1.5,-10,5.5,4,0,0,TAU)},1.5);ctx.fillStyle='rgba(255,255,255,.8)';lvlDisc(0,-11.5,1.5);ctx.restore()},
 shoot(it,now,S){const c=Math.floor((now+it.ph)/7),p=((now+it.ph)%7)/1.1;if(p>1)return;const x0=hash(c*3.1+it.y)*S.w,dx=hash(c*7.7)>.5?1:-1,x=x0+dx*p*160,y=it.y-40+p*70;
  ctx.save();ctx.globalAlpha=Math.sin(p*Math.PI);const g=ctx.createLinearGradient(x,y,x-dx*60,y-26);g.addColorStop(0,'#fff');g.addColorStop(1,'rgba(255,255,255,0)');ctx.strokeStyle=g;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-dx*60,y-26);ctx.stroke();ctx.restore()},
 nebula(it){glow(it.x,it.y,it.rad,it.c,.3);glow(it.x+it.rad*.4,it.y-it.rad*.2,it.rad*.6,it.c,.25)},
 galaxy(it,now){ctx.save();ctx.translate(it.x,it.y);ctx.rotate(it.rot+now*.05);ctx.scale(1,.5);glow(0,0,it.rad*.5,'#fff3b0',.7);
  for(let arm=0;arm<2;arm++)for(let i=1;i<40;i++){const a=i*.2+arm*Math.PI,d=i/40*it.rad;ctx.globalAlpha=(1-i/40)*.85;ctx.fillStyle=it.c;lvlDisc(Math.cos(a)*d,Math.sin(a)*d,1.8-i/40)}ctx.restore()},
 halo(it,now){glow(it.x,it.y,110,'#ffd23f',.45);sunburst(it.x,it.y,150,16,'#ffe46b',.18,.1)},
 comet(it,now,S){const x=lvlAcross(it,now,S,90),s=Math.sign(it.v),y=it.y+Math.sin(now*.4+it.ph)*10,g=ctx.createLinearGradient(x,y,x-s*70,y-8);g.addColorStop(0,'rgba(190,230,255,.9)');g.addColorStop(1,'rgba(160,120,255,0)');
  ctx.strokeStyle=g;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-s*70,y-8);ctx.stroke();glow(x,y,14,'#bfe6ff',.9);ctx.fillStyle='#fff';lvlDisc(x,y,3.5)},
 parrot(it,now,S){parrot(lvlAcross(it,now,S,60),it.y+Math.sin(now*3+it.ph)*5,Math.sign(it.v),.9)},
 butterfly(it,now){const x=it.x+Math.sin(now*.6+it.ph)*30,y=it.y+Math.sin(now*1.3+it.ph)*14,f=Math.abs(Math.sin(now*12+it.ph));ctx.save();ctx.translate(x,y);ctx.fillStyle=it.c;ctx.strokeStyle=INK;ctx.lineWidth=1.2;
  for(const s of [-1,1]){ctx.beginPath();ctx.ellipse(s*4*f,-2,4.5*f+.5,5,s*.4,0,TAU);ctx.fill();ctx.stroke();ctx.beginPath();ctx.ellipse(s*3*f,3,3*f+.4,3.4,-s*.4,0,TAU);ctx.fill();ctx.stroke()}ctx.fillStyle=INK;ctx.fillRect(-.8,-4,1.6,9);ctx.restore()},
 bat(it,now,S){const x=lvlAcross(it,now,S,60),y=it.y+Math.sin(now*4+it.ph)*8,f=Math.sin(now*14+it.ph);ctx.save();ctx.translate(x,y);ctx.fillStyle='#2a1a3a';ctx.strokeStyle=INK;ctx.lineWidth=1.5;
  for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(s*6,-4-5*f);ctx.lineTo(s*15,-3-7*f);ctx.lineTo(s*12,2);ctx.lineTo(s*8,0);ctx.lineTo(s*5,3);ctx.closePath();ctx.fill();ctx.stroke()}
  ctx.beginPath();ctx.ellipse(0,0,4.5,5.5,0,0,TAU);ctx.fill();ctx.fillStyle='#ffd23f';lvlDisc(-1.8,-1,1.1);lvlDisc(1.8,-1,1.1);ctx.restore()},
 // decorations standing on the islands
 tree(it,now){ctx.save();ctx.translate(it.x,it.y);ctx.scale(it.s,it.s);ctx.rotate(Math.sin(now*1.2+it.ph)*.03);lvlInk(()=>{ctx.fillStyle='#8a5a34';ctx.beginPath();ctx.rect(-3,-14,6,14)},2);
  const c=[[0,-24,10],[-7,-17,8],[7,-17,8]];ctx.fillStyle=INK;for(const [x,y,r] of c)lvlDisc(x,y,r+2.2);ctx.fillStyle='#3fae4a';for(const [x,y,r] of c)lvlDisc(x,y,r);ctx.fillStyle='#7fd858';lvlDisc(-3,-27,4);ctx.fillStyle='#ff4d5e';lvlDisc(5,-20,1.8);lvlDisc(-6,-15,1.8);ctx.restore()},
 bush(it){const c=[[-6,-5,6],[5,-6,7],[0,-10,6]];ctx.fillStyle=INK;for(const [x,y,r] of c)lvlDisc(it.x+x,it.y+y,r+2);ctx.fillStyle='#3a9a46';for(const [x,y,r] of c)lvlDisc(it.x+x,it.y+y,r);ctx.fillStyle='#6fd35a';lvlDisc(it.x-2,it.y-12,2.5)},
 flowers(it){for(const [dx,h,c] of [[-7,9,'#ff6ad5'],[0,13,'#ffd23f'],[7,8,'#ff8a2a']]){const x=it.x+dx,y=it.y-h;ctx.strokeStyle='#2f8a3a';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(x,it.y);ctx.lineTo(x,y);ctx.stroke();ctx.fillStyle=c;for(let i=0;i<5;i++)lvlDisc(x+Math.cos(i*1.257)*2.6,y+Math.sin(i*1.257)*2.6,2);ctx.fillStyle='#fff3a0';lvlDisc(x,y,1.4)}},
 hut(it){ctx.save();ctx.translate(it.x,it.y);ctx.scale(it.s,it.s);lvlInk(()=>{ctx.fillStyle='#f2dfb4';ctx.beginPath();ctx.rect(-9,-12,18,12)},2);lvlInk(()=>{ctx.fillStyle='#e0503a';ctx.beginPath();ctx.moveTo(-12,-11);ctx.lineTo(0,-22);ctx.lineTo(12,-11);ctx.closePath()},2);
  ctx.fillStyle='#8a5a34';ctx.fillRect(-2.5,-7,5,7);ctx.fillStyle='#7fd0ff';ctx.fillRect(3.5,-9,3.5,3.5);ctx.restore()},
 rock(it){const col={jungle:'#8a8f7a',cave:'#6a5a8a'}[lvlZoneOf(it.L).id]||'#9aa0b4';lvlInk(()=>{ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(it.x,it.y-4,8,6,0,0,TAU)},2);ctx.fillStyle='rgba(255,255,255,.45)';lvlDisc(it.x-3,it.y-6,2)},
 palm(it){ctx.save();ctx.translate(it.x,it.y);ctx.scale(.3*it.s,.3*it.s);palm(0,0,it.side*.45);ctx.restore()},
 hibiscus(it){ctx.fillStyle='#2f9a3f';ctx.beginPath();ctx.ellipse(it.x-6,it.y-4,6,3,-.5,0,TAU);ctx.fill();ctx.beginPath();ctx.ellipse(it.x+6,it.y-4,6,3,.5,0,TAU);ctx.fill();ctx.fillStyle='#ff3a5e';ctx.strokeStyle=INK;ctx.lineWidth=1.4;
  for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(it.x+Math.cos(i*1.257-1.57)*4.5,it.y-10+Math.sin(i*1.257-1.57)*4.5,3.8,2.6,i*1.257-1.57,0,TAU);ctx.fill();ctx.stroke()}ctx.fillStyle='#ffd23f';lvlDisc(it.x,it.y-10,1.8)},
 crystal(it){crystalCluster(it.x,it.y,7*it.s,it.c)},
 shroom(it,now){glow(it.x,it.y-12,18,'#5ff0ff',.35+.15*Math.sin(now*2+it.ph));lvlInk(()=>{ctx.fillStyle='#e8f4ff';ctx.beginPath();ctx.rect(-2.5+it.x,it.y-10,5,10)},1.6);
  lvlInk(()=>{ctx.fillStyle='#3fd8e8';ctx.beginPath();ctx.ellipse(it.x,it.y-11,9,6,0,Math.PI,TAU);ctx.closePath()},1.8);ctx.fillStyle='#fff';lvlDisc(it.x-3,it.y-14,1.4);lvlDisc(it.x+3,it.y-13,1.2)},
 brazier(it,now){glow(it.x,it.y-20,22,'#ffb347',.45+.15*Math.sin(now*12+it.ph));ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(it.x,it.y);ctx.lineTo(it.x,it.y-12);ctx.stroke();lvlInk(()=>{ctx.fillStyle='#6b4a2e';ctx.beginPath();ctx.moveTo(it.x-7,it.y-15);ctx.lineTo(it.x+7,it.y-15);ctx.lineTo(it.x+4,it.y-10);ctx.lineTo(it.x-4,it.y-10);ctx.closePath()},2);
  const f=1+.2*Math.sin(now*18+it.ph);ctx.fillStyle='#ffb020';ctx.beginPath();ctx.moveTo(it.x-5,it.y-15);ctx.quadraticCurveTo(it.x,it.y-15-14*f,it.x+5,it.y-15);ctx.fill();ctx.fillStyle='#fff6b0';ctx.beginPath();ctx.moveTo(it.x-2.5,it.y-15);ctx.quadraticCurveTo(it.x,it.y-15-7*f,it.x+2.5,it.y-15);ctx.fill()},
 lamp(it,now){const on=Math.sin(now*1.5+it.ph)>-.8;if(on)glow(it.x,it.y-24,20,'#fff3a0',.5);ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(it.x,it.y);ctx.lineTo(it.x,it.y-22);ctx.stroke();lvlInk(()=>{ctx.fillStyle=on?'#fff3a0':'#8a8f9a';ctx.beginPath();ctx.arc(it.x,it.y-24,4.5,0,TAU)},2)},
 crate(it){ctx.save();ctx.translate(it.x,it.y);lvlInk(()=>{ctx.fillStyle='#c08a4a';ctx.beginPath();ctx.rect(-7,-14,14,14)},2);ctx.strokeStyle=INK;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-7,-14);ctx.lineTo(7,0);ctx.moveTo(7,-14);ctx.lineTo(-7,0);ctx.stroke();ctx.restore()},
 barrel(it){ctx.save();ctx.translate(it.x,it.y);lvlInk(()=>{ctx.fillStyle='#ffd23f';ctx.beginPath();ctx.roundRect(-6,-16,12,16,3)},2);ctx.fillStyle=INK;for(const y of [-12,-6])ctx.fillRect(-6,y,12,2.5);ctx.restore()},
 gearlet(it,now){ctx.fillStyle=INK;ctx.fillRect(it.x-1.5,it.y-10,3,10);gear(it.x,it.y-14,9,now*1.5*it.side,'#c4cee0','#4f5a73',9)},
 crater(it){ctx.fillStyle='#7e778e';ctx.beginPath();ctx.ellipse(it.x,it.y-3,9*it.s,4,0,0,TAU);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(it.x,it.y-3,9*it.s,4,0,.1,Math.PI-.1);ctx.stroke()},
 flag(it,now){ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(it.x,it.y);ctx.lineTo(it.x,it.y-26);ctx.stroke();const wv=Math.sin(now*3+it.ph)*2;lvlInk(()=>{ctx.fillStyle='#ff4d5e';ctx.beginPath();ctx.moveTo(it.x,it.y-26);ctx.quadraticCurveTo(it.x+7,it.y-27+wv,it.x+14,it.y-24);ctx.lineTo(it.x+14,it.y-16);ctx.quadraticCurveTo(it.x+7,it.y-19+wv,it.x,it.y-17);ctx.closePath()},1.6)},
 dish(it,now){ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(it.x,it.y);ctx.lineTo(it.x,it.y-10);ctx.stroke();ctx.save();ctx.translate(it.x,it.y-12);ctx.rotate(-.5+Math.sin(now*.5+it.ph)*.3);lvlInk(()=>{ctx.fillStyle='#e8ecf4';ctx.beginPath();ctx.ellipse(0,0,10,5,0,0,Math.PI);ctx.closePath()},2);
  ctx.strokeStyle=INK;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,1);ctx.lineTo(0,-8);ctx.stroke();ctx.fillStyle=Math.sin(now*4+it.ph)>0?'#ff4d5e':'#fff';lvlDisc(0,-9,2);ctx.restore()},
 rocket(it){ctx.save();ctx.translate(it.x,it.y);for(const s of [-1,1])lvlInk(()=>{ctx.fillStyle='#ff4d5e';ctx.beginPath();ctx.moveTo(s*4,-8);ctx.lineTo(s*9,0);ctx.lineTo(s*4,0);ctx.closePath()},1.6);
  lvlInk(()=>{ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(-4.5,0);ctx.lineTo(-4.5,-16);ctx.quadraticCurveTo(0,-28,4.5,-16);ctx.lineTo(4.5,0);ctx.closePath()},2);lvlInk(()=>{ctx.fillStyle='#44d9ff';ctx.beginPath();ctx.arc(0,-14,2.4,0,TAU)},1.2);ctx.restore()},
 ucrystal(it){crystalCluster(it.x,it.y,7*it.s,it.side>0?'#ffd23f':'#d9b8ff')},
 ustar(it,now){const y=it.y-16+Math.sin(now*1.5+it.ph)*3;glow(it.x,y,16,'#ffe46b',.6);ctx.save();ctx.translate(it.x,y);ctx.rotate(now*.6+it.ph);ctx.fillStyle='#ffe46b';ctx.strokeStyle=INK;ctx.lineWidth=1.8;star(0,0,8,3.5,5);ctx.fill();ctx.stroke();ctx.restore()},
 orbit(it,now){const y=it.y-18+Math.sin(now*1.2+it.ph)*3;sphere(it.x,y,6,{base:['#ffd0f4','#ff6ad5','#7a1a6a'],ring:'#7fe8ff',rot:now})}};
