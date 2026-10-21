/** One gesture owner. No compatibility click handlers participate in gameplay. */
export function bindInput({surface,canvas,dialog,cakeButton,state,light,releaseCake,replayMusic=()=>{},protectExploration=()=>false,now=()=>performance.now()}) {
 let active=null;
 const position=e=>{const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*360/r.width,y:(e.clientY-r.top)*640/r.height};};
 const inCake=p=>p.x>=129&&p.x<=233&&p.y>=473&&p.y<=570;
 const inRecord=p=>p.x>=303&&p.x<=359&&p.y>=450&&p.y<=536;
 const render=()=>{dialog.hidden=!state.dialog;};
 const cancel=e=>{if(e&&active&&e.pointerId!==active.id)return;active=null;light.held=false;};
 function down(e){
  if(state.phase!=='playing'||active||e.button>0||e.isPrimary===false)return;
  e.preventDefault();const p=position(e);
  const onDialog=state.dialog&&dialog.contains(e.target);
  active={id:e.pointerId,kind:state.dialog?(onDialog?'dismiss':'blocked'):'scene',x:e.clientX,y:e.clientY,time:now(),distance:0,startedLit:state.lit,startedCake:inCake(p),startedRecord:inRecord(p)};
  if(active.kind==='scene'){light.x=light.tx=p.x;light.y=light.ty=p.y-22;light.held=true;}
  surface.setPointerCapture(e.pointerId);
 }
 function move(e){if(!active||e.pointerId!==active.id)return;e.preventDefault();const p=position(e);active.distance=Math.max(active.distance,Math.hypot(e.clientX-active.x,e.clientY-active.y));if(active.kind==='scene'){light.tx=p.x;light.ty=p.y-22;}}
 function up(e){
  if(!active||e.pointerId!==active.id)return;e.preventDefault();const gesture=active,p=position(e),time=now();cancel();
  if(gesture.kind==='dismiss'){state.dialog=false;render();return;}
  if(gesture.kind!=='scene')return;
  if(protectExploration(p)){render();return;}
  const distance=Math.max(gesture.distance,Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y));
  if(inCake(p))releaseCake(state,{time,tap:gesture.startedCake&&distance<=14&&time-gesture.time<=650,startedLit:gesture.startedLit});
  else if(state.lit&&gesture.startedRecord&&inRecord(p)&&distance<=14&&time-gesture.time<=650)replayMusic();
  render();
 }
 surface.addEventListener('pointerdown',down);
 surface.addEventListener('pointermove',move);
 surface.addEventListener('pointerup',up);
 surface.addEventListener('pointercancel',cancel);
 // Capture can transfer from a child. Its bubbling lost event is not cancellation.
 surface.addEventListener('lostpointercapture',e=>{if(e.target===surface&&!surface.hasPointerCapture(e.pointerId))cancel(e);});
 // Ignore all compatibility/synthesized clicks. Enter/Space handled separately.
 surface.addEventListener('click',e=>{if(state.phase==='playing'){e.preventDefault();e.stopPropagation();}},true);
 cakeButton.addEventListener('keydown',e=>{if(e.repeat||!['Enter',' '].includes(e.key)||state.dialog)return;e.preventDefault();releaseCake(state,{time:now(),tap:true,startedLit:state.lit});render();});
 dialog.addEventListener('keydown',e=>{if(['Enter',' ','Escape'].includes(e.key)){e.preventDefault();state.dialog=false;render();}});
 return{cancel,render};
}
