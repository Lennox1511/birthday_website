import{breeze}from'./night.js';
/** Conservative local-frame staging: retain every original final pose pixel.
 * Full arm interpolation is intentionally avoided: these are flattened sprites.
 */
export function poseAt(state,time){
 const age=state.lit?Math.max(0,time-state.litAt):-1;
 return{body:age>=600?'boyClosed':'boyOpen',eyes:age>=900?'boyClosed':'boyOpen',girlHead:age>=750?'girlBoy':'girlCake',girl:age>=1200?'girlBoy':'girlCake',complete:age>=1200};
}
export function createMotion(){
 const cache=new Map();
 function scaled(key,im,width,height){
  if(!im)return null;if(cache.has(key))return cache.get(key);
  const c=document.createElement('canvas');c.width=width;c.height=height;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(im,0,0,width,height);cache.set(key,c);return c;
 }
 function bent(key,source,patches,amount){
  if(!amount)return source;const id=key+':wind:'+amount;if(cache.has(id))return cache.get(id);
  const c=document.createElement('canvas');c.width=source.width;c.height=source.height;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(source,0,0);
  for(const[x,y,width,height]of patches){
   // Move only an isolated, transparent-edge hair tip; integer scanlines preserve pixels.
   g.clearRect(x-2,y,width+4,height);
   g.drawImage(source,x-2,y,width+4,height,x-2,y,width+4,height);
   g.clearRect(x,y,width,height);
   for(let row=0;row<height;row++){const dx=Math.round(Math.sin(row/(height-1)*Math.PI)*amount);g.drawImage(source,x,y+row,width,1,x+dx,y+row,width,1);}
  }
  cache.set(id,c);return c;
 }
 return{
  people(c,images,state,t){
   if(!images.boyOpen||!images.boyClosed||!images.girlCake||!images.girlBoy)return;
   const p=poseAt(state,t),boyWind=breeze(t,9700,1800,1),girlWind=breeze(t,8100,700,2);
   const boy=key=>{const s=scaled(key,images[key],113,151);return bent(key,s,[[27,28,9,12]],boyWind);};
   const girl=key=>{const s=scaled(key,images[key],113,139);return bent(key,s,[[104,76,8,16]],girlWind);};
   // Compose on transparent local canvases, never overlay two silhouettes in the world.
   const join=(key,body,head,cut)=>{
    if(body===head)return body;if(cache.has(key))return cache.get(key);
    const merged=document.createElement('canvas');merged.width=body.width;merged.height=body.height;
    const g=merged.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(body,0,0);g.clearRect(0,0,body.width,cut);
    g.drawImage(head,0,0,head.width,cut,0,0,head.width,cut);cache.set(key,merged);return merged;
   };
   c.drawImage(join('boy:'+p.body+':'+p.eyes+':'+boyWind,boy(p.body),boy(p.eyes),65),79,363);
   c.drawImage(join('girl:'+p.girl+':'+p.girlHead+':'+girlWind,girl(p.girl),girl(p.girlHead),84),188,383);
  },
  grass(c,background,t){
   if(!background)return;const bg=scaled('grass-source',background,360,640);
   const patches=[[74,612,7,13,0],[122,620,6,11,2300],[277,610,7,13,4400],[323,605,6,12,6200]];
   for(const[x,y,width,height,offset]of patches){const amount=breeze(t,11000,offset,1);if(!amount)continue;
    // Sample existing blades only, pinned at their roots; patch boundary never moves.
    for(let row=0;row<height;row++){const dx=Math.round(Math.sin(row/(height-1)*Math.PI)*amount);c.drawImage(bg,x-dx,y+row,width,1,x,y+row,width,1);}
   }
  }
 };
}
