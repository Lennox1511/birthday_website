import{initialState,releaseCake,advance}from'./state.js';
import{bindInput}from'./input.js';
import{createMusic}from'./music.js';
import{createDialogView}from'./dialog.js';
import{drawReflections}from'./reflections.js';
import{createNight,drawMeteors}from'./night.js';
import{createMotion,poseAt}from'./motion.js';
import{createSecrets,isSecretSpot,drawFlower,drawSecretGlints,createWolfFrames}from'./secrets.js';
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),game=document.querySelector('#game'),start=document.querySelector('#start'),begin=document.querySelector('#begin'),cakeButton=document.querySelector('#cake'),dialog=document.querySelector('#dialog');
const night=createNight(),music=createMusic(undefined,()=>night.musicEnded());
const dialogView=createDialogView({dialog,message:dialog.querySelector('.message'),diamond:dialog.querySelector('.diamond')});
const motion=createMotion(),secrets=createSecrets(),drawWolf=createWolfFrames();let secretFrame=null;
const state=initialState(), light={x:180,y:440,tx:180,ty:440,a:0,held:false}, images={};
const world=document.createElement('canvas');world.width=360;world.height=640;const w=world.getContext('2d');const mask=document.createElement('canvas');mask.width=360;mask.height=640;const m=mask.getContext('2d');let last=0;
const manifest={background:'background.png',boyOpen:'boy-cake-v13.png',boyClosed:'boy-wish-v11.png',girlCake:'girl-cake-v12.png',girlBoy:'girl-watch-v12.png',wolf:'wolf.png',cake:'cake.png',gramophone:'gramophone.png',blanket:'blanket-v12.png'};
for(const c of[ctx,w,m])c.imageSmoothingEnabled=false;
function load(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src='assets/'+src;});}
Promise.all(Object.entries(manifest).map(async([key,path])=>images[key]=await load(path))).then(()=>{begin.disabled=false;document.querySelector('#loading').textContent='';}).catch(()=>{document.querySelector('#loading').textContent='加载失败，请刷新重试';});
function sprite(key,x,y,width,height){const im=images[key];if(!im)return;w.drawImage(im,Math.round(x),Math.round(y),width,height);}
function star(c,x,y,color){c.fillStyle=color;c.fillRect(x-1,y-6,2,12);c.fillRect(x-5,y-1,10,2);c.fillRect(x-2,y-2,4,4);}
function scene(t){w.clearRect(0,0,360,640);if(images.background)w.drawImage(images.background,0,0,360,640);else{w.fillStyle='#0b1230';w.fillRect(0,0,360,640);}motion.grass(w,images.background,t);drawFlower(w,secretFrame);star(w,266,344,'#687181');
 sprite('blanket',-14,468,390,132);
 drawWolf(w,images.wolf,t,secretFrame?.wolf??-1);
 const wag=t%8200; if(images.wolf&&wag<1400){w.save();w.beginPath();w.rect(56,481,48,37);w.clip();w.translate(57,483);w.rotate(Math.sin(wag/170)*.035);sprite('wolf',-56,-50,103,85);w.restore();}
 motion.people(w,images,state,t);
 sprite('gramophone',291,455,67,75);
 // The vinyl is an independent animated layer on top of the replaceable cabinet sprite.
 w.save();w.translate(322,505);w.scale(1,.36);w.rotate(music.angle);w.fillStyle='#121321';w.beginPath();w.arc(0,0,15,0,Math.PI*2);w.fill();w.fillStyle='#937991';w.fillRect(-12,0,9,1);w.fillStyle='#bc766e';w.fillRect(-3,-3,6,6);w.restore();
 const bounce=state.bounceAt&&t-state.bounceAt<600?Math.sin((t-state.bounceAt)/600*Math.PI)*2:0;
 sprite('cake',129,476-bounce,104,94);
 if(state.lit){
  const fx=184,fy=476-bounce;
  // Small candle spill stays below face level; fingertip remains the main light.
  w.save();w.beginPath();w.rect(128,452,106,127);w.clip();
  const glow=w.createRadialGradient(fx,fy,0,fx,fy,30);glow.addColorStop(0,'#ffbb6640');glow.addColorStop(1,'#e8954800');w.fillStyle=glow;w.fillRect(fx-30,fy-30,60,60);
  const top=w.createRadialGradient(181,526,0,181,526,47);top.addColorStop(0,'#ffc66d16');top.addColorStop(1,'#ffc66d00');w.fillStyle=top;w.fillRect(134,479,94,94);w.restore();
 }

}

function drawFlame(c,t){
 const bounce=state.bounceAt&&t-state.bounceAt<600?Math.sin((t-state.bounceAt)/600*Math.PI)*2:0;
 const x=184,y=476-bounce,sway=Math.round(Math.sin(t/310)*1.1+Math.sin(t/557)*.6);
 const extra=state.bounceAt&&t-state.bounceAt<600?1:0;
 // Separate 8-bit teardrop, its bottom pixel is anchored on the existing wick.
 c.save();c.translate(x,y);c.fillStyle='#eca14c';
 c.beginPath();c.moveTo(0,0);c.lineTo(-3,-3);c.lineTo(-4,-7);c.lineTo(-2+sway,-11);c.lineTo(3+sway,-16-extra);c.lineTo(2+sway,-10);c.lineTo(4,-6);c.lineTo(3,-2);c.closePath();c.fill();
 c.fillStyle='#ffd880';c.fillRect(-2,-8,5,6);c.fillRect(sway,-11,2,4);
 c.fillStyle='#fff2cd';c.fillRect(-1,-6,2,6);c.fillRect(0,-8,2,3);c.restore();
}
function frame(t){if(state.phase==='start'){ctx.fillStyle='#050713';ctx.fillRect(0,0,360,640);last=t;requestAnimationFrame(frame);return;}const dt=Math.min(t-last||16,50);last=t;advance(state,t);dialogView.tick(state.dialog,t);
 light.x+=(light.tx-light.x)*(1-Math.exp(-dt/38));light.y+=(light.ty-light.y)*(1-Math.exp(-dt/38));light.a+=((light.held?1:0)-light.a)*(1-Math.exp(-dt/(light.held?90:240)));
 secretFrame=secrets.tick({time:t,dt,state,light,visible:!document.hidden});
 scene(t);ctx.clearRect(0,0,360,640);ctx.drawImage(world,0,0);ctx.fillStyle='rgba(3,8,31,.40)';ctx.fillRect(0,0,360,640);
 if(light.a>.002){
  const flicker=.96+.025*Math.sin(t/217)+.015*Math.sin(t/431+1.6),radius=91*flicker,alpha=light.a;
  m.clearRect(0,0,360,640);m.globalCompositeOperation='source-over';m.drawImage(world,0,0);
  // Warm the revealed local colours before applying the feathered alpha mask.
  m.globalCompositeOperation='soft-light';m.fillStyle='#EDAA57';m.fillRect(0,0,360,640);
  // Modest amber multiply counters the cool/white restored image without over-tinting skin.
  m.globalCompositeOperation='multiply';m.globalAlpha=.16;m.fillStyle='#FFD29D';m.fillRect(0,0,360,640);m.globalAlpha=1;
  m.globalCompositeOperation='source-over';star(m,266,344,'#a4e6ff');
  const pose=poseAt(state,t);
  drawReflections(m,state,t,{boy:pose.body==='boyOpen'?'open':'closed',eyes:pose.eyes==='boyOpen'?'open':'closed',girl:pose.girl==='girlCake'?'cake':'boy'});
  m.globalCompositeOperation='destination-in';
  const reveal=m.createRadialGradient(light.x,light.y,0,light.x,light.y,radius);
  reveal.addColorStop(0,`rgba(0,0,0,${alpha*.78})`);reveal.addColorStop(.3,`rgba(0,0,0,${alpha*.64})`);reveal.addColorStop(.7,`rgba(0,0,0,${alpha*.22})`);reveal.addColorStop(1,'rgba(0,0,0,0)');
  m.fillStyle=reveal;m.fillRect(0,0,360,640);ctx.drawImage(mask,0,0);
  const glow=ctx.createRadialGradient(light.x,light.y,0,light.x,light.y,radius);
  glow.addColorStop(0,`rgba(255,232,174,${alpha*.12*flicker})`);
  glow.addColorStop(.25,`rgba(255,195,107,${alpha*.24*flicker})`);
  glow.addColorStop(.62,`rgba(233,139,66,${alpha*.16*flicker})`);
  glow.addColorStop(1,'rgba(233,139,66,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,360,640);
 }
 drawSecretGlints(ctx,secretFrame);
 drawMeteors(ctx,night.tick(dt,state.dialog,!document.hidden));
 if(state.lit)drawFlame(ctx,t);
 requestAnimationFrame(frame);}
requestAnimationFrame(frame);
begin.addEventListener('click',()=>{if(state.phase!=='start')return;state.phase='transition';start.classList.add('leaving');setTimeout(()=>{start.hidden=true;start.style.display='none';state.phase='playing';cakeButton.disabled=false;},1000);});
function releaseWithMusic(s,event){const wasLit=s.lit;releaseCake(s,event);if(!wasLit&&s.lit)music.playOnce();}
const input=bindInput({surface:game,canvas,dialog,cakeButton,state,light,releaseCake:releaseWithMusic,replayMusic:()=>music.replay(),protectExploration:p=>isSecretSpot(state,performance.now(),{x:p.x,y:p.y-22})&&isSecretSpot(state,performance.now(),light)});
window.addEventListener('blur',()=>input.cancel());
document.addEventListener('visibilitychange',()=>{if(document.hidden)input.cancel();});
window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});document.addEventListener('contextmenu',e=>e.preventDefault());document.addEventListener('gesturestart',e=>e.preventDefault(),{passive:false});
