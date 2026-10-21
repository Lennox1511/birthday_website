// Normalized, image-free pixel constellations for the island fireworks.
// Every point can be multiplied by the same burst radius; emphasis is a
// relative brightness/size hint for small details such as eyes and candlelight.
(function () {
  'use strict';

  const TAU = Math.PI * 2;
  const GRID = 0.04;

  function constellation(id, label, colors, draw) {
    const pixels = new Map();

    function add(x, y, color, emphasis = 1) {
      x = Math.round(x / GRID) * GRID;
      y = Math.round(y / GRID) * GRID;
      const key = `${x.toFixed(2)},${y.toFixed(2)}`;
      const old = pixels.get(key);
      if (!old || emphasis >= old.emphasis) {
        pixels.set(key, { x: +x.toFixed(2), y: +y.toFixed(2), color, emphasis });
      }
    }

    function stroke(path, color, emphasis = 1, spacing = 0.066) {
      if (!path.length) return;
      let remaining = spacing;
      const put = (x, y, t) => add(x, y, typeof color === 'function' ? color(t, x, y) : color, emphasis);
      put(path[0][0], path[0][1], 0);
      for (let i = 1; i < path.length; i += 1) {
        let [x, y] = path[i - 1];
        const [endX, endY] = path[i];
        let distance = Math.hypot(endX - x, endY - y);
        while (distance >= remaining && distance > 0.00001) {
          const ratio = remaining / distance;
          x += (endX - x) * ratio;
          y += (endY - y) * ratio;
          put(x, y, (i - 1 + ratio) / (path.length - 1));
          distance = Math.hypot(endX - x, endY - y);
          remaining = spacing;
        }
        remaining -= distance;
      }
      const end = path[path.length - 1];
      put(end[0], end[1], 1);
    }

    function curve(fn, color, emphasis = 1, spacing = 0.066, from = 0, to = TAU) {
      const path = Array.from({ length: 301 }, (_, i) => fn(from + (to - from) * i / 300));
      stroke(path, color, emphasis, spacing);
    }

    function quadratic(from, control, to) {
      return Array.from({ length: 41 }, (_, i) => {
        const t = i / 40;
        return [(1 - t) ** 2 * from[0] + 2 * (1 - t) * t * control[0] + t ** 2 * to[0],
          (1 - t) ** 2 * from[1] + 2 * (1 - t) * t * control[1] + t ** 2 * to[1]];
      });
    }

    function twinkle(x, y, color, radius = 0.075, emphasis = 1.25) {
      add(x, y, color, emphasis);
      add(x - radius, y, color, 0.8);
      add(x + radius, y, color, 0.8);
      add(x, y - radius, color, 0.8);
      add(x, y + radius, color, 0.8);
    }

    draw({ add, stroke, curve, quadratic, twinkle });
    return { id, label, colors, points: [...pixels.values()] };
  }

  const cat = constellation('cat', '小猫', ['#b9a7ff', '#78dcff', '#ffe58b', '#ffb6d6'], ({ stroke, quadratic, add }) => {
    const outline = [[-0.71, -0.24], [-0.78, -0.91], [-0.34, -0.64],
      ...quadratic([-0.34, -0.64], [0, -0.77], [0.34, -0.64]),
      [0.78, -0.91], [0.71, -0.24],
      ...quadratic([0.71, -0.24], [0.91, 0.53], [0.32, 0.76]),
      ...quadratic([0.32, 0.76], [0, 0.9], [-0.32, 0.76]),
      ...quadratic([-0.32, 0.76], [-0.91, 0.53], [-0.71, -0.24])];
    stroke(outline, (t, x) => x < 0 ? '#b9a7ff' : '#78dcff', 1.05, 0.062);
    stroke([[-0.64, -0.58], [-0.64, -0.73], [-0.47, -0.62]], '#ffb6d6', 0.95, 0.07);
    stroke([[0.64, -0.58], [0.64, -0.73], [0.47, -0.62]], '#ffb6d6', 0.95, 0.07);
    [-1, 1].forEach(side => {
      const x = side * 0.29;
      stroke([[x - 0.12, 0.02], [x, -0.07], [x + 0.12, 0.02], [x, 0.11], [x - 0.12, 0.02]], '#ffe58b', 1.35, 0.068);
      add(x, 0.02, '#fff5c7', 1.5);
      stroke([[side * 0.49, 0.22], [side * 0.98, 0.12]], '#d4c8ff', 0.8, 0.09);
      stroke([[side * 0.5, 0.35], [side * 0.98, 0.39]], '#78dcff', 0.8, 0.09);
    });
    stroke([[-0.09, 0.23], [0.09, 0.23], [0, 0.32], [-0.09, 0.23]], '#ffb6d6', 1.4, 0.07);
    stroke([[0, 0.32], [0, 0.42], [-0.12, 0.5], [-0.22, 0.44]], '#ffb6d6', 1.1, 0.07);
    stroke([[0, 0.42], [0.12, 0.5], [0.22, 0.44]], '#ffb6d6', 1.1, 0.07);
  });

  const star = constellation('star', '星星', ['#ffe58b', '#ffd05c', '#fff6cc', '#89e3ff'], ({ stroke, twinkle }) => {
    function starPath(scale) {
      const points = Array.from({ length: 10 }, (_, i) => {
        const angle = -Math.PI / 2 + i * Math.PI / 5;
        const radius = (i % 2 === 0 ? 0.96 : 0.42) * scale;
        return [Math.cos(angle) * radius, Math.sin(angle) * radius];
      });
      return [...points, points[0]];
    }
    stroke(starPath(1), '#ffe58b', 1.2, 0.065);
    stroke(starPath(0.68), '#ffd05c', 0.9, 0.075);
    twinkle(0, 0.02, '#fff6cc', 0.11, 1.5);
    twinkle(-0.22, 0.21, '#89e3ff', 0.055, 1.1);
    twinkle(0.24, 0.22, '#fff6cc', 0.055, 1.1);
    twinkle(0, -0.32, '#fff6cc', 0.055, 1.1);
  });

  const heart = constellation('heart', '爱心', ['#ff8bbd', '#ffb5d7', '#ffe7ed', '#ffd88a'], ({ curve, twinkle, add }) => {
    const heartPoint = (t, scale) => [scale * 0.057 * 16 * Math.sin(t) ** 3,
      scale * (-0.052 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) - 0.1)];
    curve(t => heartPoint(t, 1), '#ff8bbd', 1.15, 0.063);
    curve(t => heartPoint(t, 0.73), '#ffb5d7', 0.95, 0.071);
    twinkle(-0.34, -0.24, '#ffe7ed', 0.08, 1.35);
    twinkle(0.36, -0.18, '#ffd88a', 0.065, 1.25);
    twinkle(0, 0.36, '#ffe7ed', 0.06, 1.2);
    add(-0.12, 0.07, '#ffd88a', 1.2);
    add(0.14, 0.13, '#ffd88a', 1.2);
  });

  const flower = constellation('flower', '花朵', ['#e4a3ff', '#ffaddb', '#ffe58b', '#fff5c7'], ({ curve, stroke, quadratic, add }) => {
    const petalColor = t => Math.cos(5 * (t + Math.PI / 2)) > 0.3 ? '#ffaddb' : '#e4a3ff';
    curve(t => {
      const radius = 0.65 + 0.25 * Math.cos(5 * (t + Math.PI / 2));
      return [Math.cos(t) * radius, Math.sin(t) * radius];
    }, t => petalColor(t * TAU), 1.08, 0.063);
    for (let petal = 0; petal < 5; petal += 1) {
      const angle = -Math.PI / 2 + petal * TAU / 5;
      const start = [Math.cos(angle - 0.3) * 0.23, Math.sin(angle - 0.3) * 0.23];
      const tip = [Math.cos(angle) * 0.68, Math.sin(angle) * 0.68];
      const end = [Math.cos(angle + 0.3) * 0.23, Math.sin(angle + 0.3) * 0.23];
      stroke([...quadratic(start, [Math.cos(angle - 0.24) * 0.67, Math.sin(angle - 0.24) * 0.67], tip),
        ...quadratic(tip, [Math.cos(angle + 0.24) * 0.67, Math.sin(angle + 0.24) * 0.67], end)], '#ffaddb', 0.7, 0.082);
    }
    curve(t => [Math.cos(t) * 0.21, Math.sin(t) * 0.21], '#ffe58b', 1.4, 0.06);
    add(0, 0, '#fff5c7', 1.55);
    [[-0.08, -0.04], [0.08, -0.04], [0, 0.09]].forEach(([x, y]) => add(x, y, '#ffe58b', 1.2));
  });

  const saturn = constellation('saturn', '土星', ['#7dd8ff', '#b4a7ff', '#ffe29a', '#ffbd70'], ({ curve, stroke, add }) => {
    const tilt = -0.34;
    function ringPoint(t, scale = 1) {
      const x = Math.cos(t) * 0.98 * scale;
      const y = Math.sin(t) * 0.22 * scale;
      return [x * Math.cos(tilt) - y * Math.sin(tilt), x * Math.sin(tilt) + y * Math.cos(tilt)];
    }
    // The hidden back arc stops at the planet; the bright foreground arc
    // crosses its face, giving the constellation a readable tilted ring.
    [1, 0.86].forEach(scale => {
      const back = Array.from({ length: 181 }, (_, i) => ringPoint(Math.PI + Math.PI * i / 180, scale));
      let visible = [];
      back.forEach(point => {
        if ((point[0] / 0.55) ** 2 + (point[1] / 0.6) ** 2 > 1.04) {
          visible.push(point);
        } else if (visible.length) {
          stroke(visible, '#ffbd70', 0.7, 0.075);
          visible = [];
        }
      });
      stroke(visible, '#ffbd70', 0.7, 0.075);
    });
    curve(t => [Math.cos(t) * 0.55, Math.sin(t) * 0.6], '#7dd8ff', 1.12, 0.059);
    [-0.26, 0.02, 0.3].forEach((latitude, band) => {
      const width = 0.53 * Math.sqrt(1 - (latitude / 0.6) ** 2);
      curve(t => [t * width, latitude + 0.07 * (1 - t * t)], band === 1 ? '#b4a7ff' : '#7dd8ff', 0.65, 0.082, -1, 1);
    });
    [1, 0.86].forEach(scale => curve(t => ringPoint(t, scale), '#ffe29a', 1.17, 0.065, 0, Math.PI));
    add(-0.29, -0.37, '#d3f2ff', 1.3);
    add(-0.17, -0.43, '#d3f2ff', 1.1);
  });

  const soft = { pink:'#ffc1d9', rose:'#ffadd0', gold:'#ffe5ad', cream:'#fff1dc', mint:'#bcebd7', blue:'#bce4fa', lilac:'#d8c6ff' };
  function cute(id,label,paint) {
    return constellation(id,label,[soft.pink,soft.gold,soft.mint,soft.blue,soft.lilac], api => {
      const {stroke,curve,add,quadratic,twinkle}=api;
      const oval=(x,y,rx,ry,c=soft.pink,e=1)=>curve(t=>[x+rx*Math.cos(t),y+ry*Math.sin(t)],c,e,.052);
      const arc=(x,y,rx,ry,a,b,c=soft.pink)=>curve(t=>[x+rx*Math.cos(t),y+ry*Math.sin(t)],c,1,.052,a,b);
      const line=(p,c=soft.pink)=>stroke(p,c,1,.052);
      const face=(x=0,y=.08,s=1)=>{
        oval(x-.22*s,y-.08*s,.026*s,.04*s,soft.cream,1.4);oval(x+.22*s,y-.08*s,.026*s,.04*s,soft.cream,1.4);
        arc(x,y+.02*s,.09*s,.075*s,0,Math.PI,soft.cream);
        oval(x-.34*s,y+.05*s,.06*s,.023*s,soft.rose,.85);oval(x+.34*s,y+.05*s,.06*s,.023*s,soft.rose,.85);
      };
      const heart=(x,y,s,c=soft.pink)=>curve(t=>[x+s*16*Math.sin(t)**3/17,y-s*(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/17],c,1,.052);
      const star=(x,y,s,c=soft.gold)=>line(Array.from({length:11},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,r=(i%2?.46:1)*s;return [x+r*Math.cos(a),y+r*Math.sin(a)];}),c);
      const box=(x,y,w,h,c=soft.pink)=>{const r=.08;line([[x+r,y],[x+w-r,y]],c);line([[x+r,y+h],[x+w-r,y+h]],c);line([[x,y+r],[x,y+h-r]],c);line([[x+w,y+r],[x+w,y+h-r]],c);arc(x+r,y+r,r,r,Math.PI,Math.PI*1.5,c);arc(x+w-r,y+r,r,r,Math.PI*1.5,Math.PI*2,c);arc(x+w-r,y+h-r,r,r,0,Math.PI/2,c);arc(x+r,y+h-r,r,r,Math.PI/2,Math.PI,c);};
      paint({oval,arc,line,curve,face,heart,star,box,add,quadratic});
      twinkle(-.84,-.68,soft.gold,.055,.9);twinkle(.84,.66,soft.lilac,.055,.9);
    });
  }
  const extra = [
    cute('rabbit','棉花兔兔',({oval,face})=>{oval(-.3,-.5,.17,.4,soft.cream);oval(.3,-.5,.17,.4,soft.cream);oval(-.3,-.56,.07,.23);oval(.3,-.56,.07,.23);oval(0,.22,.61,.51,soft.cream);face(0,.21,.9);}),
    cute('bear','抱抱小熊',({oval,face,heart})=>{oval(-.5,-.42,.23,.22,soft.gold);oval(.5,-.42,.23,.22,soft.gold);oval(-.5,-.42,.1,.1);oval(.5,-.42,.1,.1);oval(0,.03,.62,.59,soft.gold);oval(0,.2,.24,.18,soft.cream);face(0,.04,.8);heart(0,.76,.12);}),
    cute('paw','粉粉猫爪',({oval,heart})=>{oval(-.57,-.25,.16,.22);oval(-.21,-.52,.16,.22);oval(.21,-.52,.16,.22);oval(.57,-.25,.16,.22);oval(0,.34,.46,.35,soft.lilac);heart(0,.34,.21,soft.cream);}),
    cute('butterfly','梦幻蝴蝶',({oval,arc,line})=>{[-1,1].forEach(s=>{oval(s*.42,-.25,.36,.41,soft.lilac);oval(s*.34,.36,.27,.28);oval(s*.42,-.25,.18,.23,soft.blue);arc(s*.17,-.64,.17,.15,Math.PI,Math.PI*2,soft.gold);});oval(0,.02,.07,.41,soft.gold);line([[0,-.4],[0,.43]],soft.cream);}),
    cute('bird','啾啾小鸟',({oval,arc,line,face})=>{oval(0,.12,.6,.54,soft.blue);arc(-.17,.2,.28,.2,0,Math.PI,soft.mint);line([[.52,-.04],[.86,.1],[.54,.22]],soft.gold);face(-.1,-.13,.65);line([[-.54,.31],[-.85,.1],[-.8,.48],[-.54,.44]],soft.blue);}),
    cute('fish','泡泡小鱼',({oval,line,face})=>{oval(-.15,0,.57,.41,soft.mint);line([[.37,-.13],[.84,-.48],[.75,0],[.84,.48],[.37,.13]],soft.blue);line([[-.25,-.37],[.03,-.64],[.2,-.36]],soft.gold);face(-.28,0,.6);oval(-.79,-.55,.07,.07,soft.blue);oval(-.58,-.77,.045,.045,soft.blue);}),
    cute('jellyfish','水母宝宝',({arc,curve,face})=>{arc(0,-.08,.64,.6,Math.PI,Math.PI*2,soft.lilac);curve(t=>[t,.02+.055*Math.cos(t*15)],soft.pink,1,.052,-.64,.64);for(let i=-2;i<=2;i++)curve(t=>[i*.22+Math.sin(t*7+i)*.05,.12+t*.65],i%2?soft.blue:soft.pink,1,.052,0,1);face(0,-.24,.75);}),
    cute('whale','云海鲸鲸',({oval,line,arc,face})=>{oval(-.17,.13,.59,.45,soft.blue);line([[.36,.03],[.68,-.22],[.89,-.08],[.74,.15],[.87,.36],[.6,.38],[.36,.24]],soft.blue);arc(-.26,.21,.4,.24,0,Math.PI,soft.cream);face(-.29,-.04,.65);line([[-.25,-.34],[-.25,-.65]],soft.mint);arc(-.25,-.68,.21,.11,Math.PI,Math.PI*2,soft.mint);}),
    cute('moon','晚安月亮',({arc,face,star,line})=>{arc(0,0,.76,.78,.65,Math.PI*2-.65,soft.gold);arc(.34,0,.5,.62,Math.PI*.5,Math.PI*1.5,soft.gold);line([[.6,-.47],[.34,-.62]],soft.gold);line([[.34,.62],[.6,.47]],soft.gold);face(-.33,.05,.55);star(.53,-.35,.16,soft.lilac);star(.58,.3,.11,soft.blue);}),
    cute('cloud','软绵云朵',({curve,face,heart})=>{curve(t=>[.8*Math.cos(t),.06+(.38+.08*Math.sin(5*t))*Math.sin(t)],soft.blue,1,.052);face(0,.06,.85);heart(-.32,.68,.12);heart(.3,.69,.12,soft.lilac);}),
    cute('rainbow','糖果彩虹',({arc,oval})=>{[soft.pink,soft.gold,soft.mint,soft.blue,soft.lilac].forEach((c,i)=>arc(0,.36,.8-i*.115,.8-i*.115,Math.PI,Math.PI*2,c));oval(-.6,.38,.25,.16,soft.cream);oval(.6,.38,.25,.16,soft.cream);}),
    cute('sun','暖暖太阳',({oval,line,face})=>{oval(0,0,.48,.48,soft.gold);oval(0,0,.37,.37,soft.cream);for(let i=0;i<12;i++){let t=i*Math.PI/6;line([[.64*Math.cos(t),.64*Math.sin(t)],[.85*Math.cos(t),.85*Math.sin(t)]],i%2?soft.pink:soft.gold);}face(0,0,.75);}),
    cute('snowflake','晶莹雪花',({line,oval})=>{for(let i=0;i<6;i++){let t=i*Math.PI/3,p=r=>[r*Math.cos(t),r*Math.sin(t)];line([p(0),p(.85)],soft.blue);for(let r of [.37,.63]){let a=p(r);for(let s of [-1,1])line([a,[a[0]+.19*Math.cos(t+s*2.1),a[1]+.19*Math.sin(t+s*2.1)]],soft.lilac);}}oval(0,0,.14,.14,soft.cream);}),
    cute('cherry','双子樱桃',({oval,curve,face})=>{oval(-.33,.35,.29,.32,soft.rose);oval(.33,.35,.29,.32);curve(t=>[-.33+.35*t,.03-.7*Math.sin(t*Math.PI/2)],soft.mint,1,.052,0,1);curve(t=>[.33-.31*t,.03-.7*Math.sin(t*Math.PI/2)],soft.mint,1,.052,0,1);oval(.23,-.61,.24,.09,soft.mint);face(-.33,.31,.35);face(.33,.31,.35);}),
    cute('strawberry','草莓甜甜',({curve,line,oval,face})=>{curve(t=>[.62*Math.cos(t)*(1+.21*Math.sin(t)),.04+.65*Math.sin(t)],soft.pink,1,.052);line([[-.54,-.44],[-.26,-.51],[-.26,-.74],[0,-.55],[.24,-.73],[.26,-.48],[.53,-.42]],soft.mint);for(let [x,y] of [[-.3,-.1],[.3,-.1],[-.39,.2],[.39,.2],[-.19,.42],[.19,.42],[0,.55]])oval(x,y,.018,.03,soft.gold);face(0,.1,.55);}),
    cute('peach','蜜桃心情',({curve,line,face,oval})=>{curve(t=>[.67*Math.cos(t),.07+.61*Math.sin(t)-.12*Math.cos(2*t)],soft.pink,1,.052);curve(t=>[.035*Math.sin(t*4),-.51+t*1.07],soft.rose,.8,.052,0,1);oval(.24,-.64,.25,.1,soft.mint);line([[0,-.53],[.02,-.81]],soft.gold);face(0,.11,.65);}),
    cute('cupcake','生日纸杯糕',({box,line,curve,face,oval})=>{line([[-.5,.05],[-.39,.68],[.39,.68],[.5,.05]],soft.gold);curve(t=>[t,-.06-.15*Math.cos(t*7)],soft.pink,1,.052,-.62,.62);curve(t=>[.56*Math.cos(t),-.12+.41*Math.sin(t)],soft.pink,1,.052,Math.PI,Math.PI*2);box(-.05,-.71,.1,.22,soft.mint);oval(0,-.82,.05,.08,soft.gold);face(0,.31,.6);}),
    cute('candy','甜甜糖果',({oval,line,heart})=>{oval(0,0,.42,.37);[-1,1].forEach(s=>{line([[s*.38,-.15],[s*.79,-.39],[s*.7,0],[s*.79,.39],[s*.38,.15]],soft.lilac);line([[s*.45,0],[s*.68,0]],soft.blue);});heart(0,0,.21,soft.cream);}),
    cute('bow','蝴蝶结',({curve,oval,line})=>{[-1,1].forEach(s=>{curve(t=>[s*(.39+.33*Math.cos(t)),.29*Math.sin(t)],soft.pink,1,.052);oval(s*.42,0,.19,.16,soft.lilac);line([[s*.13,.18],[s*.35,.74],[s*.55,.62],[s*.38,.12]]);});oval(0,0,.15,.17,soft.gold);}),
    cute('balloon','心愿气球',({oval,line,curve,face})=>{oval(0,-.2,.53,.6);line([[-.08,.4],[0,.53],[.08,.4]],soft.gold);curve(t=>[.075*Math.sin(t*5),.52+t*.38],soft.lilac,1,.052,0,1);face(0,-.18,.8);}),
    cute('gift','惊喜礼物',({box,line,oval,heart})=>{box(-.6,-.23,1.2,.9,soft.lilac);box(-.66,-.38,1.32,.2);line([[-.09,-.38],[-.09,.67]],soft.gold);line([[.09,-.38],[.09,.67]],soft.gold);oval(-.24,-.59,.25,.16);oval(.24,-.59,.25,.16);heart(0,.26,.19,soft.cream);})
  ];
  const original=[cat,star,heart,flower,saturn];
  const paletteMap={'#b9a7ff':soft.lilac,'#78dcff':soft.blue,'#ffe58b':soft.gold,'#ffb6d6':soft.pink,'#ffd05c':soft.gold,'#fff6cc':soft.cream,'#89e3ff':soft.blue,'#ff8bbd':soft.pink,'#ffb5d7':soft.rose,'#ffe7ed':soft.cream,'#ffd88a':soft.gold,'#e4a3ff':soft.lilac,'#ffaddb':soft.pink,'#fff5c7':soft.cream,'#7dd8ff':soft.blue,'#b4a7ff':soft.lilac,'#ffe29a':soft.gold,'#ffbd70':soft.gold,'#d4c8ff':soft.lilac,'#d3f2ff':soft.cream};
  original.forEach(shape=>{shape.colors=shape.colors.map(c=>paletteMap[c]||soft.cream);shape.points=shape.points.map(p=>({...p,color:paletteMap[p.color]||soft.cream}));});
  // Give the familiar star and heart the same smiling, blushing expression.
  [star,heart].forEach(shape=>{const expression=cute('expression','',({face})=>face(0,.02,.65));shape.points.push(...expression.points.filter(p=>Math.abs(p.x)<.5&&Math.abs(p.y)<.3));});
  window.ISLAND_FIREWORK_SHAPES = [...original,...extra];
})();
