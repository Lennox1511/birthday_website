/** Tiny material highlights, drawn into the existing light mask (no input events).
 * Source-image anchors stay tied to the existing pose, cake bounce and wolf breathing.
 */
export function drawReflections(c,state,time,visual=state){
 c.save();c.globalCompositeOperation='source-over';
 const dab=(color,alpha,x,y,w=1,h=1)=>{c.fillStyle=color;c.globalAlpha=alpha;c.fillRect(x,y,w,h);};
 // Lens/frame edges only: no white lens fill or change to eye expression.
 if((visual.eyes??visual.boy)==='open'){dab('#edbf75',.38,120,408,2);dab('#edbf75',.32,148,411,2);}
 else{dab('#edbf75',.38,119,408,2);dab('#edbf75',.32,145,408,2);}
 // Blue bead glints now use the narrow candle-sensing regions in secrets.js.
 // Existing forehead star, aligned with the unchanged breathing displacement.
 const wolfDy=Math.round(433+Math.sin(time/1700)*.6)-433;
 dab('#aed6ef',.30,39,469+wolfDy,1,3);dab('#aed6ef',.22,38,470+wolfDy,3);
 const bounce=state.bounceAt&&time-state.bounceAt<600?Math.sin((time-state.bounceAt)/600*Math.PI)*2:0;
 const dy=Math.round(476-bounce)-476;
 // Sparse cream, chestnut and nut facets follow the existing cake sprite.
 for(const[x,y]of[[142,523],[152,514],[206,529],[220,520]])dab('#f0cf9b',.23,x,y+dy,2);
 for(const[x,y]of[[176,515],[198,505]])dab('#b67a49',.27,x,y+dy,2);
 for(const[x,y]of[[211,510],[162,539],[207,552]])dab('#c99b63',.18,x,y+dy);
 c.restore();
}
