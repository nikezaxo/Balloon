'use strict';
// Balloon skins sold in the store. Gores are the vertical panels (light, mid and dark tones);
// dots are decorations placed on the sphere, so they turn with the balloon.
const SKINS={
 classic:{name:'Classic',price:0,gores:[['#ff7a86','#ff3b52','#c41d3d'],['#ffe680','#ffc21a','#d98a00']]},
 gumball:{name:'Gumball',price:150,gores:[['#ffc6e6','#ff7ac0','#d94a98']],dots:'sprinkles',gloss:true},
 clown:{name:'Funny Clown',price:200,gores:[['#ff8a8a','#ff4d5e','#c41d3d'],['#ffffff','#eceaf6','#b9b6cf'],['#8fd8ff','#3d9bff','#1f5fc4'],['#fff08a','#ffd23f','#d99400']],face:'goofy',extras:['hair','nose']},
 toy:{name:'Toy Robot',price:250,gores:[['#9cd8ff','#3d8bff','#2350b8'],['#d4dbe8','#9aa6bd','#6b7690']],face:'robot',dots:'rivets',extras:['antenna']},
 melon:{name:'Watermelon',price:300,gores:[['#8be38f','#3fbf55','#23863a'],['#c5f7a8','#8fdc6e','#55a83e']],dots:'seeds'},
 monster:{name:'Monster',price:400,gores:[['#c4ff8a','#7ad83f','#3f8f1d']],face:'monster',dots:'spots',extras:['horns']},
 ninja:{name:'Ninja',price:500,gores:[['#5a5a78','#34344c','#1a1a2c']],face:'ninja',extras:['headband']},
 galaxy:{name:'Galaxy',price:700,gores:[['#8a6cff','#5232c4','#24125e'],['#4d7bff','#2846b8','#101d5c']],dots:'stars'},
 gold:{name:'Golden King',price:1000,gores:[['#fff6b8','#ffd23f','#c98a00']],dots:'sparkle',extras:['crown'],gloss:true}};
const SKIN_ORDER=Object.keys(SKINS);
const DOTS=Array.from({length:28},(_,i)=>({lat:(hash(i*3.1)-.5)*2.3,lon:hash(i*7.7)*TAU,s:.7+hash(i*1.3)*.6,ang:hash(i*5.3)*TAU,c:i}));
const DOT_COLORS={sprinkles:['#ffffff','#4fd3ff','#ffe066','#7cf08a','#b48cff'],seeds:['#1b1240'],spots:['#4fa82a','#8fe04f'],stars:['#ffffff','#ffe680'],rivets:['#eef3fb'],sparkle:['#ffffff']};
// Decorations inside the balloon clip, in balloon coordinates (centre 0,-5; radius about 29).
function skinDots(skin,turn){if(!skin.dots)return;const colors=DOT_COLORS[skin.dots];
 for(const d of DOTS){const lon=d.lon+turn,c=Math.cos(lon);if(c<.08)continue;const s=shape(d.lat),px=s.r*Math.sin(lon),py=s.y,k=d.s;ctx.save();ctx.translate(px,py);ctx.scale(Math.max(.2,c),1);ctx.fillStyle=colors[d.c%colors.length];
  if(skin.dots==='sprinkles'){ctx.rotate(d.ang);ctx.beginPath();ctx.roundRect(-3.5*k,-1.3*k,7*k,2.6*k,1.3*k);ctx.fill()}
  else if(skin.dots==='seeds'){ctx.rotate(d.ang*.3);ctx.beginPath();ctx.ellipse(0,0,1.6*k,2.8*k,0,0,TAU);ctx.fill()}
  else if(skin.dots==='spots'){ctx.beginPath();ctx.arc(0,0,3.6*k,0,TAU);ctx.fill()}
  else if(skin.dots==='rivets'){if(d.c%2){ctx.beginPath();ctx.arc(0,0,1.9,0,TAU);ctx.fill();ctx.strokeStyle='rgba(27,18,64,.6)';ctx.lineWidth=1;ctx.stroke()}}
  else{const tw=skin.dots==='sparkle'?.5+.5*Math.sin(t*4+d.c):1;star(0,0,3.6*k*tw,1.3*k*tw,4);ctx.fill()}
  ctx.restore()}
 if(skin.extras&&skin.extras.includes('headband')){ctx.fillStyle='#ff3b52';ctx.fillRect(-40,-27,80,8);ctx.fillStyle='rgba(255,255,255,.3)';ctx.fillRect(-40,-27,80,2)}}
// Accessories drawn on top of the outline.
function skinExtras(skin){if(!skin.extras)return;ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.lineJoin='round';ctx.lineCap='round';
 for(const e of skin.extras){
  if(e==='nose'){ctx.fillStyle='#ff3b3b';ctx.beginPath();ctx.arc(0,-1,4.8,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle='rgba(255,255,255,.8)';ctx.beginPath();ctx.arc(-1.5,-2.5,1.4,0,TAU);ctx.fill()}
  if(e==='hair')for(const s of [-1,1])['#ff4d5e','#ffd23f','#44d9ff'].forEach((c,i)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(s*(25+i*3),-24+i*7,6.5,0,TAU);ctx.fill();ctx.stroke()});
  if(e==='antenna'){ctx.beginPath();ctx.moveTo(0,-37);ctx.lineTo(0,-50);ctx.stroke();ctx.fillStyle=Math.sin(t*6)>0?'#ff3b4f':'#ffd23f';ctx.beginPath();ctx.arc(0,-52,4,0,TAU);ctx.fill();ctx.stroke()}
  if(e==='horns')for(const s of [-1,1]){ctx.fillStyle='#fff3d6';ctx.beginPath();ctx.moveTo(s*9,-33);ctx.quadraticCurveTo(s*20,-44,s*15,-54);ctx.quadraticCurveTo(s*24,-44,s*18,-30);ctx.closePath();ctx.fill();ctx.stroke()}
  if(e==='headband')for(const k of [0,1]){ctx.fillStyle='#ff3b52';ctx.beginPath();ctx.moveTo(27,-23);ctx.quadraticCurveTo(38,-26+k*6+Math.sin(t*8+k)*3,46,-18+k*8+Math.sin(t*8+k)*4);ctx.lineTo(44,-14+k*8);ctx.quadraticCurveTo(36,-20+k*6,27,-19);ctx.closePath();ctx.fill();ctx.stroke()}
  if(e==='crown'){ctx.fillStyle='#ffd23f';ctx.beginPath();ctx.moveTo(-13,-34);ctx.lineTo(-15,-50);ctx.lineTo(-7,-42);ctx.lineTo(0,-54);ctx.lineTo(7,-42);ctx.lineTo(15,-50);ctx.lineTo(13,-34);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#ff4d5e';ctx.beginPath();ctx.arc(0,-40,2.6,0,TAU);ctx.fill();ctx.fillStyle='#44d9ff';ctx.beginPath();ctx.arc(-8,-38,2,0,TAU);ctx.arc(8,-38,2,0,TAU);ctx.fill()}}}
