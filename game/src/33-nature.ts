/* ================= a world that reacts, and the collection book =================
   Things to tap all over the map, day and night:
   - bugs walk and fly around (which ones depends on the place, the hour and the weather): tap to catch
   - fish shadows swim in the pond and the river: tap to catch
   - the pond: tap the water for ripples; sometimes a frog jumps out
   - chopping a tree sometimes scares a bird out of it
   - sparkling spots in the ground: tap to dig up treasures and fossils
   - big flowers play a note when tapped; play eight in a row and the pips nearby dance
   Everything found goes into the collection book in the album tab. */
type Sp={id:string,n:string,cat:string,r:number,where?:string[],when?:string,col?:string[]};
const SPECIES:Sp[]=[
  // bugs
  {id:"ladybug",n:"פרת משה רבנו",cat:"bug",r:1,where:["farm","meadow"],when:"day",col:["#e8433f","#2a1830"]},
  {id:"butterfly",n:"פרפר",cat:"bug",r:1,where:["farm","meadow"],when:"day",col:["#ffd166","#ff9db5"]},
  {id:"bluefly",n:"פרפר כחול",cat:"bug",r:3,where:["meadow","forest"],when:"day",col:["#8fbfff","#5a7dd6"]},
  {id:"beetle",n:"חיפושית",cat:"bug",r:1,where:["forest","cave"],when:"any",col:["#3e6a8f","#1d3348"]},
  {id:"grasshopper",n:"חרגול",cat:"bug",r:1,where:["meadow","farm"],when:"day",col:["#7cc45a","#3f8f3a"]},
  {id:"bee",n:"דבורה",cat:"bug",r:2,where:["farm","meadow"],when:"day",col:["#ffd166","#2a1830"]},
  {id:"dragonfly",n:"שפירית",cat:"bug",r:2,where:["river","farm"],when:"day",col:["#5df0ff","#2f8fa8"]},
  {id:"snail",n:"חילזון",cat:"bug",r:2,where:["farm","forest","meadow"],when:"rain",col:["#c89c63","#e8d5b0"]},
  {id:"moth",n:"עש לילה",cat:"bug",r:1,where:["farm","forest","meadow"],when:"night",col:["#c9b8a0","#8a7a66"]},
  {id:"cricket",n:"צרצר",cat:"bug",r:2,where:["meadow","farm"],when:"night",col:["#6a4a2a","#3a2a1e"]},
  {id:"glowworm",n:"תולעת זוהרת",cat:"bug",r:3,where:["cave","forest"],when:"night",col:["#7ff0ff","#2f8fa8"]},
  // fish
  {id:"carp",n:"קרפיון",cat:"fish",r:1,where:["pond"],col:["#c9772f"]},
  {id:"goldfish",n:"דג זהב קטן",cat:"fish",r:3,where:["pond"],col:["#ffb347"]},
  {id:"trout",n:"פורל",cat:"fish",r:1,where:["river"],col:["#8a9aa8"]},
  {id:"catfish",n:"שפמנון",cat:"fish",r:2,where:["river"],when:"night",col:["#5a4a3a"]},
  {id:"koi",n:"קוי",cat:"fish",r:4,where:["pond","river"],col:["#ffffff"]},
  // animals
  {id:"frog",n:"צפרדע",cat:"animal",r:1,col:["#5fae58"]},
  {id:"sparrow",n:"דרור",cat:"animal",r:1,col:["#8a6a45"]},
  {id:"robin",n:"אדום חזה",cat:"animal",r:2,col:["#e0782f"]},
  {id:"owl",n:"ינשוף",cat:"animal",r:3,col:["#a88a66"]},
  // treasures dug up
  {id:"button",n:"כפתור ישן",cat:"find",r:1,where:["farm","meadow"]},
  {id:"coin",n:"מטבע עתיק",cat:"find",r:2,where:["farm","meadow","river"]},
  {id:"marble",n:"גולה",cat:"find",r:1,where:["farm","meadow"]},
  {id:"key",n:"מפתח חלוד",cat:"find",r:3,where:["farm","forest"]},
  {id:"glass",n:"זכוכית ים",cat:"find",r:1,where:["river"]},
  {id:"ring",n:"טבעת",cat:"find",r:4,where:["river","meadow"]},
  {id:"pixel",n:"פיקסל שלא שייך לכאן",cat:"find",r:4,where:["farm","forest","meadow","river","cave"]},
  // fossils
  {id:"shell",n:"צדף מאובן",cat:"fossil",r:1,where:["river","meadow"]},
  {id:"leaf",n:"עלה מאובן",cat:"fossil",r:1,where:["forest"]},
  {id:"amber",n:"ענבר",cat:"fossil",r:3,where:["forest"]},
  {id:"trilobite",n:"טרילוביט",cat:"fossil",r:2,where:["cave"]},
  {id:"crystal",n:"גביש עתיק",cat:"fossil",r:1,where:["cave"]},
  {id:"tooth",n:"שן של דינוזאור",cat:"fossil",r:4,where:["cave","meadow"]}
];
const CAT_NAMES={bug:"חרקים",fish:"דגים",animal:"חיות",find:"אוצרות",fossil:"מאובנים"};
const spById=id=>SPECIES.find(s=>s.id===id);
function rollSpecies(cat,place,extra?){
  const when=night?"night":rainy()?"rain":"day";
  const list=SPECIES.filter(s=>s.cat===cat&&(!s.where||s.where.includes(place))&&(!s.when||s.when==="any"||s.when===when||s.when==="day"&&when==="rain")&&(extra?extra(s):true));
  if(!list.length)return null;
  let k=Math.random()*list.reduce((a,s)=>a+1/s.r,0);for(const s of list){if((k-=1/s.r)<=0)return s}return list[0];
}
// add to the book. Returns true when it was new
function collect(sp,x,y){
  if(!sp)return false;S.col=S.col||{};
  const had=S.col[sp.id],isNew=!had;
  S.col[sp.id]={n:(had?had.n:0)+1,t:had?had.t:Date.now()};
  const pay=isNew?(sp.r>=3?15:5):1;S.sparks+=pay;S.stats.collected=(S.stats.collected||0)+1;goal("collect");
  burst(x,y-4,isNew?"confetti":"spark",isNew?14:5);
  if(isNew){SFX.level();toast(`חדש באוסף: ${sp.n}! ‎+${pay} ניצוצות (${Object.keys(S.col).length}/${SPECIES.length})`,1)}
  else{SFX.coin();toast(`${sp.n} (כבר יש לך ${S.col[sp.id].n}) ‎+1`)}
  if(tab==="album")renderAlbum();dirty();return isNew;
}

// ---------- bugs ----------
let critters=[],critT=2,fishes=[],ripples=[],frog=null,bird=null;
function placeOf(x,y){if(inPond(x,y))return"pond";if(inRiver(x,y))return"river";const z=zoneAt(x,y);return z?z.id:"farm"}
function natureTick(dt){
  critT-=dt;
  if(critT<=0){critT=rand(5,10);
    const vx=cam.x,vy=cam.y,vw=CW/cam.z,vh=CH/cam.z;
    critters=critters.filter(c=>inView(c.x,c.y,40)&&c.life>0);
    if(critters.length<3){for(let i=0;i<8;i++){const x=vx+rand(10,vw-10),y=vy+rand(20,vh-10);if(!walkable(x,y))continue;const sp=rollSpecies("bug",placeOf(x,y));if(!sp)break;
      critters.push({sp,x,y,vx:0,vy:0,t:rand(0,9),life:rand(30,60),fly:["butterfly","bluefly","bee","dragonfly","moth"].includes(sp.id)});break}}
    fishes=fishes.filter(f=>inView(f.x,f.y,30)&&f.life>0);
    if(fishes.length<2&&Math.random()<.6){
      const spots=[];if(inView(POND.x,POND.y,0))spots.push(["pond",POND.x+rand(-12,12),POND.y+rand(-5,5)]);
      const ry=vy+rand(20,vh-10),rx=riverX(ry);if(zoneOpen("river")&&inView(rx,ry,0)&&!onBridge(ry))spots.push(["river",rx+rand(-5,5),ry]);
      const s=pick(spots);if(s){const sp=rollSpecies("fish",s[0]);if(sp)fishes.push({sp,place:s[0],x:s[1],y:s[2],a:rand(0,7),life:rand(20,35)})}
    }
  }
  critters=critters.filter(c=>c.x>2&&c.x<WW-2&&c.y>8&&c.y<WH-2);
  const life=dt;dt=Math.min(dt,.1); // movement uses a normal frame step even if a long time passed
  for(const c of critters){c.life-=life;c.t+=dt;
    if(c.fly){c.x+=Math.cos(c.t*1.3)*dt*10;c.y+=Math.sin(c.t*2.1)*dt*6}
    else if(c.sp.id==="snail"){c.x+=dt*1.2}
    else if(c.sp.id==="grasshopper"||c.sp.id==="cricket"){if(Math.random()<dt*.5){c.vx=rand(-30,30);c.vy=rand(-20,20)}c.x+=c.vx*dt;c.y+=c.vy*dt;c.vx*=.9;c.vy*=.9}
    else{if(Math.random()<dt*.6){c.vx=rand(-6,6);c.vy=rand(-4,4)}c.x+=c.vx*dt;c.y+=c.vy*dt}}
  for(const f of fishes){f.life-=dt;f.a+=dt*.8;
    if(f.place==="pond"){f.x=POND.x+Math.cos(f.a)*12;f.y=POND.y+Math.sin(f.a*1.3)*5}else{f.y+=Math.sin(f.a)*dt*4;f.x=riverX(f.y)+Math.sin(f.a*.7)*5}}
  for(let i=ripples.length-1;i>=0;i--){ripples[i].t+=dt;if(ripples[i].t>1.4)ripples.splice(i,1)}
  if(frog){frog.t+=dt;if(frog.t>2.2)frog=null}
  if(bird){bird.t+=dt;bird.x+=dt*60*bird.d;bird.y-=dt*40;if(bird.t>2.5)bird=null}
  digTick(dt);
}
function drawNature(t){
  for(const f of fishes){if(!inView(f.x,f.y,8))continue;const a=.35+.15*Math.sin(t*2+f.a);CX.globalAlpha=a;R(f.x-3,f.y,6,2,"#1d3348");R(f.x+(Math.cos(f.a)>0?-4:3),f.y,1,2,"#1d3348");CX.globalAlpha=1}
  for(const r of ripples){const k=r.t/1.4;CX.globalAlpha=1-k;CX.strokeStyle="#cfe9ff";CX.lineWidth=.6;CX.beginPath();CX.ellipse(r.x,r.y,2+k*9,1+k*4,0,0,7);CX.stroke();CX.globalAlpha=1}
  if(frog){const k=frog.t/2.2,h=Math.sin(Math.min(1,k*2)*Math.PI)*8,x=frog.x+k*14,y=frog.y-h;R(x-2,y-2,5,3,"#5fae58");R(x-2,y-3,1,1,"#2a1830");R(x+2,y-3,1,1,"#2a1830");R(x-3,y,1,1,"#4f8644");R(x+3,y,1,1,"#4f8644")}
  if(bird){const w=Math.floor(t*14)%2;const c=spById(bird.sp).col[0];R(bird.x-1,bird.y,3,2,c);R(bird.x-3,bird.y-w,2,1,c);R(bird.x+2,bird.y-w,2,1,c)}
  for(const c of critters){if(!inView(c.x,c.y,6))continue;const[a,b]=c.sp.col,x=Math.round(c.x),y=Math.round(c.y),w=Math.floor(t*12+c.t)%2;
    switch(c.sp.id){
      case"butterfly":case"bluefly":case"moth":R(x-2,y-1-w,2,2,a);R(x+1,y-1-w,2,2,a);R(x,y-1,1,2,b);break;
      case"bee":R(x-1,y,3,2,a);R(x,y,1,2,b);R(x-1,y-1-w,1,1,"#e8f4ff");R(x+1,y-1-w,1,1,"#e8f4ff");break;
      case"dragonfly":R(x-2,y,5,1,a);R(x-1,y-1-w,1,1,"#e8f4ff");R(x+1,y-1-w,1,1,"#e8f4ff");break;
      case"snail":R(x-1,y-2,3,2,a);R(x,y-1,1,1,b);R(x-2,y,4,1,b);break;
      case"glowworm":R(x-1,y,3,1,a);if(night){CX.globalAlpha=.3;R(x-2,y-1,5,3,a);CX.globalAlpha=1}break;
      default:R(x-1,y-1,3,2,a);R(x,y-1,1,1,b);if(c.sp.id==="ladybug"){R(x-1,y,1,1,b)}
    }}
  drawDigs(t);drawFlowers(t);
}
// a tap on the world: returns true when nature used it
function natureTap(x,y){
  for(const c of critters)if(Math.hypot(c.x-x,c.y-y)<6){critters.splice(critters.indexOf(c),1);collect(c.sp,c.x,c.y);tone(1200,.06,"triangle",0,1.4,.2);return true}
  for(const f of fishes)if(Math.hypot(f.x-x,f.y-y)<6){fishes.splice(fishes.indexOf(f),1);ripples.push({x:f.x,y:f.y,t:0});SFX.water();collect(f.sp,f.x,f.y);return true}
  if(digTap(x,y))return true;
  if(flowerTap(x,y))return true;
  return false;
}
// tapping water, checked last so it never steals a tap from something else
function waterTap(x,y){
  if(inPond(x,y)){ripples.push({x,y,t:0});SFX.plop();
    if(!frog&&Math.random()<.3){frog={x:POND.x+10,y:POND.y-3,t:0};tone(220,.12,"square",.1,.7,.25);tone(200,.14,"square",.25,.7,.25);setTimeout(()=>collect(spById("frog"),POND.x+14,POND.y-6),500)}
    return true}
  if(inRiver(x,y)){ripples.push({x,y,t:0});SFX.water();return true}
  return false;
}
// chopping a tree can scare out a bird
function maybeBird(tr){
  if(bird||Math.random()>.08)return;
  const sp=night?spById("owl"):Math.random()<.3?spById("robin"):spById("sparrow");
  bird={sp:sp.id,x:tr.x,y:tr.y-10,t:0,d:Math.random()<.5?-1:1};tone(1800,.08,"sine",0,1.3,.2);tone(2200,.08,"sine",.1,1.2,.18);
  setTimeout(()=>collect(sp,tr.x,tr.y-10),400);
}

// ---------- digging ----------
let digT=20;
function digTick(dt){
  digT-=dt;if(digT>0)return;digT=rand(180,360);
  S.digs=S.digs||[];if(S.digs.length>=3)return;
  for(let i=0;i<30;i++){const z=pick(ZONES.filter(q=>zoneOpen(q.id))),x=rand(z.x+10,z.x+z.w-10),y=rand(z.y+20,z.y+z.h-8);
    if(!walkable(x,y)||PLOTS.some(g=>x>g.x-6&&x<g.x+PW+6&&y>g.y-8&&y<g.y+PH+8)||Math.hypot(x-BURROW.x,y-BURROW.y)<20)continue;
    S.digs.push({x:Math.round(x),y:Math.round(y),z:z.id});dirty();break}
}
function drawDigs(t){for(const d of S.digs||[]){if(!inView(d.x,d.y,8))continue;R(d.x-2,d.y-1,5,2,"#6a4a2a");if(Math.sin(t*5+d.x)>.3)R(d.x-1+Math.round(Math.sin(t*3+d.y)*2),d.y-4,1,1,"#fff7b0");if(Math.sin(t*4+d.y)>.6)R(d.x+2,d.y-3,1,1,"#ffffff")}}
function digTap(x,y){
  const d=(S.digs||[]).find(q=>Math.hypot(q.x-x,q.y-1-y)<7);if(!d)return false;
  S.digs.splice(S.digs.indexOf(d),1);burst(d.x,d.y-2,"dust",10);tone(140,.08,"square",0,.6,.25);tone(110,.1,"square",.1,.6,.25);
  const fossil=Math.random()<(d.z==="cave"?.6:.35),st=S.story;
  const sp=rollSpecies(fossil?"fossil":"find",d.z,s=>s.id!=="pixel"||!!(st&&st.ch>=3))||rollSpecies("find",d.z)||spById("button");
  setTimeout(()=>{collect(sp,d.x,d.y);if(sp.id==="pixel")setTimeout(()=>toast("הפיקסל מהבהב. הפיפים מסתכלים עליו בשקט",1),1500)},300);
  S.stats.digs=(S.stats.digs||0)+1;goal("dig");dirty();return true;
}

// ---------- singing flowers ----------
const FLOWERS:{x:number,y:number,c:string,b?:number}[]=[{x:18,y:60,c:"#ff9db5"},{x:44,y:108,c:"#ffd166"},{x:262,y:118,c:"#c9a2ff"},{x:222,y:150,c:"#ffffff"},{x:66,y:150,c:"#ff7a9a"},{x:300,y:250,c:"#ffd166"},{x:380,y:300,c:"#ff9db5"},{x:440,y:260,c:"#8fbfff"}];
const FLOWER_NOTES=[0,2,4,7,9,12,14,16];
let flowerHits=[];
function drawFlowers(t){
  FLOWERS.forEach((f,i)=>{const z=zoneAt(f.x,f.y);if(!z||!zoneOpen(z.id)||!inView(f.x,f.y,10))return;const b=f.b>0?Math.round(Math.sin(f.b*20)*2):0;
    R(f.x,f.y-5,1,5,"#3f8f3a");R(f.x-2,f.y-3,2,1,"#4f9446");R(f.x-1+b,f.y-8,3,3,f.c);R(f.x-2+b,f.y-7,5,1,f.c);R(f.x+b,f.y-7,1,1,"#ffd166");if(f.b>0)f.b=Math.max(0,f.b-.02)});
}
function flowerTap(x,y){
  const i=FLOWERS.findIndex(f=>{const z=zoneAt(f.x,f.y);return z&&zoneOpen(z.id)&&Math.hypot(f.x-x,f.y-6-y)<6});if(i<0)return false;
  const f=FLOWERS[i];f.b=.5;
  if(AC&&S.sound){const hz=392*Math.pow(2,FLOWER_NOTES[i]/12);tone(hz,.5,"triangle",0,1,.35);tone(hz*2,.3,"sine",0,1,.12)}
  burst(f.x,f.y-8,"spark",3);
  const now=performance.now();flowerHits=flowerHits.filter(h=>now-h<10000);flowerHits.push(now);
  if(flowerHits.length>=8){flowerHits=[];
    S.pips.filter(p=>Math.hypot(p.x-f.x,p.y-f.y)<90&&["idle","walk"].includes(rt(p).state)).slice(0,10).forEach((p,k)=>setTimeout(()=>{const r=rt(p);r.state="act";r.act="dance";r.ct=2.2;burst(p.x,p.y-8,"confetti",6)},k*120));
    toast("השיר של הפרחים! הפיפים רוקדים",1);goal("flowers");S.stats.songs=(S.stats.songs||0)+1;
    if(!critters.some(c=>c.sp.id==="bee")&&!night)critters.push({sp:spById("bee"),x:f.x+6,y:f.y-12,vx:0,vy:0,t:0,life:40,fly:true});dirty()}
  return true;
}
function collectionHtml(){
  S.col=S.col||{};const got=Object.keys(S.col).length;
  let h=`<h3>ספר האוסף<small>${got}/${SPECIES.length}</small></h3><p class="albtop">חרקים ודגים תופסים בהקשה. חיות מופיעות ליד הבריכה וכשכורתים עצים. אוצרות ומאובנים מוצאים בנקודות הנוצצות באדמה. מה שמופיע תלוי במקום, בשעה ובמזג האוויר</p>`;
  for(const cat of Object.keys(CAT_NAMES)){const list=SPECIES.filter(s=>s.cat===cat);
    h+=`<p class="label" style="margin-top:8px">${CAT_NAMES[cat]} · ${list.filter(s=>S.col[s.id]).length}/${list.length}</p><div class="colgrid">`+
      list.map(s=>{const c=S.col[s.id];return`<div class="colitem${c?"":" none"}"><b>${c?esc(s.n):"???"}</b><small>${c?`× ${c.n}`:s.r>=3?"נדיר":""}</small></div>`}).join("")+`</div>`}
  return h;
}
