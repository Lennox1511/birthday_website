export function initialState(){return {phase:'start',lit:false,boy:'open',girl:'cake',dialog:false,litAt:0,bounceAt:0};}
export function releaseCake(s,{time,tap,startedLit}){
 if(s.phase!=='playing'||s.dialog)return;
 if(!s.lit){s.lit=true;s.boy='closed';s.litAt=time;return;}
 if(startedLit&&tap){s.dialog=true;s.bounceAt=time;}
}
export function advance(s,time){if(s.lit&&time-s.litAt>=500)s.girl='boy';}
