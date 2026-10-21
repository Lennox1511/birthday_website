/** A one-shot ending, then rare single meteors. Time advances only while visible. */
export function createNight(random=Math.random){
 let firstEnd=false,phase='idle',clock=0,next=Infinity,meteors=[];
 const spawn=i=>({x:[201,222,187][i],y:[27,103,144][i],dx:[60,59,51][i],dy:[26,25,22][i],age:0,duration:950});
 return{
  musicEnded(){if(!firstEnd){firstEnd=true;phase='waiting';}},
  tick(dt,dialog,visible=true){
   if(!visible)return meteors;
   // Pause the sky while text is open, preserving queued or active meteors.
   if(dialog)return [];
   if(phase==='waiting'){phase='first';clock=0;next=0;}
   clock+=Math.min(Math.max(dt,0),100);
   meteors=meteors.filter(m=>(m.age+=Math.min(Math.max(dt,0),100))<m.duration);
   if(phase==='first'){
    if(next<3&&clock>=next*1800){meteors.push(spawn(next));next++;}
    if(clock>=5000){phase='rare';next=clock+45000+random()*45000;}
   }else if(phase==='rare'&&clock>=next&&meteors.length===0){
    const m=spawn(Math.floor(random()*3));m.x+=Math.round(random()*16-8);meteors.push(m);next=clock+45000+random()*45000;
   }
   return meteors;
  },
  get phase(){return phase;}
 };
}
export function drawMeteors(c,meteors){
 c.save();
 for(const m of meteors){
  const p=m.age/m.duration,fade=Math.sin(p*Math.PI),x=m.x+m.dx*p,y=m.y+m.dy*p;
  // Integer pixels, short tapering tail; all sky paths stay clear of moon and bridge.
  for(let i=9;i>=0;i--){c.globalAlpha=fade*(1-i/11)*.75;c.fillStyle=i<2?'#e4eff6':'#9ebed8';c.fillRect(Math.round(x-i*2),Math.round(y-i*m.dy/m.dx*2),i<2?2:1,1);}
  // Subtle horizontal water glints, away from the hidden star.
  c.fillStyle='#b3cfe2';for(let j=0;j<3;j++){c.globalAlpha=fade*(.13-j*.025);c.fillRect(Math.round(x-6+j*3),310+j*5,9-j*2,1);}
 }
 c.restore();
}
/** Discrete pixel offsets with long rests. No extra timer or input handlers. */
export function breeze(t,period,offset=0,amplitude=1){const p=(t+offset)%period;return p<2200?Math.round(Math.sin(p/2200*Math.PI*2)*Math.sin(p/2200*Math.PI)*amplitude):0;}
