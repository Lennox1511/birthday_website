import{poseAt}from'./motion.js';
export function secretAnchors(state,time){
 const p=poseAt(state,time),dy=Math.round(433+Math.sin(time/1700)*.6)-433;
 return{boy:p.body==='boyOpen'?[174,469]:[143,453],girl:p.girl==='girlCake'?[224,479]:[228,479],wolf:[37,478+dy],eye:[239,423],flower:[23,609],ready:state.lit&&p.complete};
}
export function isSecretSpot(state,time,point){
 const a=secretAnchors(state,time);
 return [[a.boy,14],[a.girl,14],[a.wolf,18],[a.flower,17],...(a.ready?[[a.eye,13]]:[])].some(([p,r])=>Math.hypot(point.x-p[0],point.y-p[1])<=r);
}
export function createSecrets(){
 let current=null,first=null,expires=null,linked=false,linkAt=-Infinity;
 let dwell=null,awake=-1,cooldown=-Infinity,armed=true,wasWolf=false;
 const alpha={boy:0,girl:0,flower:0,eye:0};
 return{
  tick({time,dt,state,light,visible=true}){
   const a=secretAnchors(state,time),blocked=state.phase!=='playing'||state.dialog||!visible;
   const near=(p,r)=>!blocked&&light.held&&light.a>.08&&Math.hypot(light.x-p[0],light.y-p[1])<=r;
   const hits={boy:near(a.boy,14),girl:near(a.girl,14),flower:near(a.flower,17),eye:a.ready&&near(a.eye,13)};
   const id=hits.boy&&!hits.girl?'boy':hits.girl&&!hits.boy?'girl':null;
   if(blocked){current=first=null;expires=null;dwell=null;}
   else if(!linked){
    if(expires!==null&&time>expires){first=null;expires=null;}
    if(id!==current){
     if(current!==null){first=current;expires=time+8000;}
     if(id!==null){
      if(first!==null&&first!==id&&expires!==null&&time<=expires){linked=true;linkAt=time;}
      else{first=id;expires=null;}
     }
     current=id;
    }
   }
   const wolf=near(a.wolf,18);
   if(!blocked){
    if(awake>=0){awake+=Math.min(dt,50);if(awake>=1600){awake=-1;cooldown=time+12000;}}
    if(!armed&&awake<0&&time>=cooldown&&wasWolf&&!wolf)armed=true;
    if(armed&&awake<0&&time>=cooldown){
     if(wolf){if(dwell===null)dwell=time;if(time-dwell>=900){awake=0;armed=false;dwell=null;}}
     else dwell=null;
    }else dwell=null;
   }
   wasWolf=blocked?false:wolf;
   for(const key of Object.keys(alpha)){const target=hits[key]?1:0;alpha[key]=blocked?0:alpha[key]+(target-alpha[key])*(1-Math.exp(-Math.min(dt,50)/100));}
   return{anchors:a,alpha:{...alpha},link:blocked?0:Math.max(0,Math.sin(Math.min(1,(time-linkAt)/600)*Math.PI)),wolf:blocked?-1:awake,linked};
  },
  get status(){return{linked,first,expires,current,awake,cooldown,armed};}
 };
}
export function drawFlower(c,frame){
 const v=frame?.alpha.flower||0,x=23,y=609;
 c.save();c.fillStyle='#142a48';for(const[dx,dy]of[[-2,0],[2,0],[0,-2],[0,2]])c.fillRect(x+dx,y+dy,2,2);
 c.fillStyle='#23374c';c.fillRect(x,y,1,1);
 if(v>.005){c.globalAlpha=v*.72;c.fillStyle='#a0c6dd';for(const[dx,dy]of[[-2,0],[2,0],[0,-2],[0,2]])c.fillRect(x+dx,y+dy,2,2);c.fillStyle='#d5bd83';c.fillRect(x,y,1,1);}c.restore();
}
export function drawSecretGlints(c,frame){
 if(!frame)return;c.save();
 for(const key of['boy','girl']){const[x,y]=frame.anchors[key],v=Math.max(frame.alpha[key]*.34,frame.link*.64);c.globalAlpha=v;c.fillStyle='#b1d5df';c.fillRect(x,y,1,1);c.globalAlpha=v*.45;c.fillRect(x+1,y,1,1);}
 if(frame.anchors.ready){c.globalAlpha=frame.alpha.eye*.48;c.fillStyle='#e8c58a';c.fillRect(239,423,1,1);}c.restore();
}
/** Ear leads; one eye opens in local steps and holds 800 ms. */
export function wolfPose(phase){
 if(phase<0||phase>=1600)return{eye:0,ear:0};
 const eye=phase<250?0:phase<350?1:phase<500?2:phase<1300?3:phase<1450?2:phase<1550?1:0;
 const keys=[[0,0],[50,1],[100,2],[150,3],[230,2],[320,1],[400,0],[460,-1],[530,0],[600,1],[700,0],[1320,1],[1420,0]];
 let ear=0;for(const[t,v]of keys){if(phase<t)break;ear=v;}return{eye,ear};
}
/** Original wolf image retained; cached local eye/ear patches only. */
export function createWolfFrames(){
 let base=null;const frames=new Map();
 return function(c,image,time,phase){
  if(!image)return;
  if(!base){base=document.createElement('canvas');base.width=103;base.height=85;const g=base.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(image,0,0,103,85);}
  const{eye,ear}=wolfPose(phase),key=eye+':'+ear;
  let sprite=frames.get(key);
  if(!sprite){sprite=document.createElement('canvas');sprite.width=103;sprite.height=85;const g=sprite.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(base,0,0);
   if(ear){
    // Narrow tapered ear silhouette; root below row 25 and forehead remain untouched.
    // Copy only the ear's original pixels. Integer displacement decays towards its root.
    for(let row=0;row<25;row++){
     const left=30,right=33+Math.floor(row*.39),width=right-left;
     const shift=Math.round(ear*Math.pow(1-row/24,1.25));
     if(!shift)continue;g.clearRect(left,row,width,1);g.drawImage(base,left,row,width,1,left+shift,row,width,1);
    }
   }
   if(eye){
    // A single almond-shaped opening; old lid provides the lower dark contour.
    g.fillStyle='#3b3040';g.fillRect(28,46,5,1);g.fillRect(29,47,6,2);
    if(eye===1){g.fillStyle='#af8e55';g.fillRect(30,48,4,1);}
    else if(eye===2){g.fillStyle='#c7a25d';g.fillRect(30,47,4,1);g.fillRect(31,48,3,1);g.fillStyle='#392e3c';g.fillRect(32,47,1,2);}
    else{g.fillStyle='#d4ac64';g.fillRect(29,46,3,1);g.fillRect(30,47,4,1);g.fillRect(31,48,3,1);g.fillStyle='#e4c17c';g.fillRect(30,46,1,1);g.fillStyle='#392e3c';g.fillRect(32,46,1,3);}
   }
   frames.set(key,sprite);
  }
  c.drawImage(sprite,1,Math.round(433+Math.sin(time/1700)*.6));
 };
}
