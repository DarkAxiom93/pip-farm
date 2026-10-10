/* ================= world ================= */
function zoneOpen(id){return id==="farm"||!!(S&&S.zones&&S.zones[id])}
function zoneAt(x,y){return ZONES.find(z=>x>=z.x&&x<z.x+z.w&&y>=z.y&&y<z.y+z.h)}
function riverX(y){return 548+Math.sin(y/38)*12}
function onBridge(y){return y>=148&&y<=168}
function inRiver(x,y){return Math.abs(x-riverX(y))<14&&!onBridge(y)}
function walkable(x,y){const z=zoneAt(x,y);return !!z&&zoneOpen(z.id)&&!inPond(x,y)&&!inRiver(x,y)&&x>4&&x<WW-4&&y>14&&y<WH-3}
function unlockedCount(){return ZONES.filter(z=>z.id!=="farm"&&zoneOpen(z.id)).length}
function cap(){return 48+16*unlockedCount()}
const NODES=[
 {z:"forest",k:"berry",x:290,y:44},{z:"forest",k:"berry",x:345,y:98},{z:"forest",k:"berry",x:398,y:50},{z:"forest",k:"berry",x:432,y:134},{z:"forest",k:"berry",x:300,y:142},{z:"forest",k:"berry",x:372,y:150},
 ...[40,104,214,286].map(y=>({z:"river",k:"fish",x:riverX(y)-19,y})),...[70,250].map(y=>({z:"river",k:"fish",x:riverX(y)+19,y})),
 {z:"cave",k:"crystal",x:40,y:224},{z:"cave",k:"crystal",x:92,y:300},{z:"cave",k:"crystal",x:172,y:252},{z:"cave",k:"crystal",x:222,y:312},{z:"cave",k:"crystal",x:208,y:206}];
const NODE_T={berry:{work:3,cd:90},fish:{work:5,cd:70},crystal:{work:5,cd:140}};
const claims=new Set();
const TREES=(()=>{const r=mulberry(77),L=[{x:90,y:24,s:5,z:"farm"},{x:247,y:22,s:5,z:"farm"},{x:8,y:74,s:6,z:"farm"},
  {x:272,y:318,s:7,z:"meadow"},{x:338,y:326,s:6,z:"meadow"},{x:446,y:318,s:7,z:"meadow"},{x:452,y:246,s:6,z:"meadow"},
  {x:606,y:40,s:7,z:"river"},{x:618,y:300,s:7,z:"river"},{x:598,y:204,s:6,z:"river"}];
  for(let i=0;i<120&&L.filter(t=>t.z==="forest").length<18;i++){const x=268+r()*188,y=18+r()*146;if(NODES.some(n=>Math.hypot(n.x-x,n.y-y)<18)||L.some(t=>Math.hypot(t.x-x,t.y-y)<17))continue;L.push({x:Math.round(x),y:Math.round(y),s:6+Math.floor(r()*3),z:"forest"})}
  return L})();
const treeHp={},treeShake={};
const BUILD={storage:{n:"מחסן",d:"מקום לעוד 60 ביטים בסל",cost:20,x:125,y:26},well:{n:"באר",d:"משקה כל שתילה חדשה, והביטים בשדה גדלים מהר יותר",cost:15,x:165,y:26},workshop:{n:"בית מלאכה",d:"הפיפים מכינים בו כלים מעץ",cost:25,x:205,y:26}};
const ITEMS={hoe:{n:"מעדרים",d:"עבודה בשדה מהירה יותר",cost:8},rod:{n:"חכות",d:"כל דג נותן ביט נוסף",cost:6},lamp:{n:"פנסים",d:"עובדים גם בלילה, ויש אור בחווה",cost:10},sack:{n:"סלים קלועים",d:"עוד 20 מקום בסל",cost:5}};
function nodeReady(i){return Date.now()>=((S.nodeCd||{})[i]||0)}

