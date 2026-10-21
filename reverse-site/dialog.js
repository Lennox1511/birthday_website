export const BLESSING='生日快乐，我的异色';
export function createDialogView({dialog,message,diamond,clock=()=>performance.now()}){
 let visible=false,openedAt=0,previousCount=-1;
 return{
  tick(wanted,time=clock()){
   if(wanted&&!visible){openedAt=time;previousCount=-1;dialog.hidden=false;dialog.classList.remove('appearing');void dialog.offsetWidth;dialog.classList.add('appearing');message.textContent='';diamond.hidden=true;}
   if(!wanted&&visible){dialog.hidden=true;dialog.classList.remove('appearing');message.textContent='';diamond.hidden=true;}
   visible=wanted;if(!wanted)return;
   const count=Math.min(BLESSING.length,Math.max(0,Math.floor((time-openedAt-300)/100)+1));
   if(count!==previousCount){message.textContent=BLESSING.slice(0,count);previousCount=count;}
   diamond.hidden=count<BLESSING.length;
  }
 };
}
