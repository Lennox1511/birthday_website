/** Non-blocking original piano audio. play() is called synchronously from cake release. */
export function createMusic(makeAudio=src=>new Audio(src),onEnded=()=>{}){
 const audio=makeAudio('assets/birthday-piano.mp3');audio.preload='auto';audio.loop=false;audio.volume=.7;
 let attempted=false,started=false,ended=false,playing=false,failed=false,pending=false;
 audio.addEventListener('playing',()=>{started=true;playing=true;failed=false;pending=false;});
 audio.addEventListener('pause',()=>{playing=false;});
 audio.addEventListener('ended',()=>{ended=true;playing=false;pending=false;onEnded();});
 audio.addEventListener('error',()=>{failed=true;playing=false;pending=false;});
 function play(reset=false){
  pending=true;ended=false;failed=false;
  const fail=()=>{failed=true;playing=false;pending=false;};
  try{if(reset)audio.currentTime=0;const p=audio.play();if(p&&p.catch)p.catch(fail);}catch{fail();}
 }
 return{
  playOnce(){if(attempted||started||ended)return;attempted=true;play();},
  replay(){if(pending||playing||!(ended||failed))return;play(true);},
  get playing(){return playing;},get failed(){return failed;},get ended(){return ended;},
  // Media time freezes on pause/end; cabinet stays fixed, only vinyl uses this angle.
  get angle(){const t=audio.currentTime||0,d=audio.duration;if(!Number.isFinite(d)||d<2.2)return t*.45;const coast=d-2.2,u=Math.max(0,Math.min(2.2,t-coast));return .45*(Math.min(t,coast)+u-u*u/4.4);}
 };
}
