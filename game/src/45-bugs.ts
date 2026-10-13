/* ================= bug hunting =================
   Once the farm starts turning digital, little glitch bugs show up in the fields.
   They scurry in jerky pixel-hops and steal bits from the basket. Tap one to catch it
   (you get the bits back, and it goes into the collection book). Pips with legs chase them. */
SPECIES.push(
  {id:"bytebug",n:"באג בייט",cat:"glitch",r:1,col:["#5dffb0","#1f5a40"]},
  {id:"pointer",n:"חיפושית מצביע",cat:"glitch",r:2,col:["#ffcf4a","#5a4a1a"]},
  {id:"nullmoth",n:"עש ריק",cat:"glitch",r:2,col:["#e8e8f0","#6a6a80"]},
  {id:"loopworm",n:"תולעת לולאה",cat:"glitch",r:3,col:["#c9a2ff","#5e4a80"]},
  {id:"panic",n:"באג קרנל",cat:"glitch",r:4,col:["#ff5d73","#5a1f2a"]}
);
(CAT_NAMES as any).glitch="באגים דיגיטליים";
let bugs=[],bugT=30;
const bugsOn=()=>digi()>0||(S.stats.compiles||0)>0;
function bugTick(dt){
  if(!S||!bugsOn())return;
  bugT-=dt;
  if(bugT<=0){bugT=rand(50,110)/(1+digi());
    if(bugs.length<4&&!night&&!hide){
      const plots=PLOTS.map((g,i)=>({g,pl:S.plots[i]})).filter(o=>o.pl&&o.pl.owned&&(!o.g.z||zoneOpen(o.g.z)));
      const o=pick(plots);
      if(o){const sp=rollSpecies("glitch","farm");
        bugs.push({sp,x:o.g.x+rand(4,PW-4),y:o.g.y+rand(4,PH-2),t:0,hop:0,steal:rand(5,9),loot:0,life:rand(50,80)});
        if(!S.stats.bugsSeen){S.stats.bugsSeen=1;toast("משהו קטן מתרוצץ בשדה וגונב ביטים! הקש עליו כדי לתפוס",1)}}}
  }
  for(let i=bugs.length-1;i>=0;i--){const b=bugs[i];b.t+=dt;b.life-=dt;b.hop-=dt;
    if(b.hop<=0){b.hop=rand(.25,.7);const a=rand(0,7);b.x=clamp(b.x+Math.cos(a)*rand(2,6),4,WW-4);b.y=clamp(b.y+Math.sin(a)*rand(1,4),10,WH-4)}
    b.steal-=dt;
    if(b.steal<=0){b.steal=rand(7,11)*(res("bugtrap")?2:1);binFix();const sum=S.bin[0]+S.bin[1]+S.bin[2];
      if(sum>0&&b.loot<6){const k=S.bin.findIndex(v=>v>0);S.bin[k]--;S.basket--;b.loot++;
        parts.push({x:b.x,y:b.y-4,vx:0,vy:-14,life:.8,kind:"px",c:"#5dffb0"});renderHead();dirty()}}
    if(b.life<=0){bugs.splice(i,1);if(b.loot&&inView(b.x,b.y,0))toast(`באג ברח עם ${b.loot} ביטים`)}
  }
}
function catchBug(b,by?){
  bugs.splice(bugs.indexOf(b),1);
  const back=b.loot+1;addBits(0,back);
  S.stats.bugs=(S.stats.bugs||0)+1;
  collect(b.sp,b.x,b.y);tone(1400,.05,"square",0,.6,.15);tone(700,.08,"square",.05,1,.12);
  if(by){say(by,pick(["!!","תפסתי","הא!"]),1.4,"snd","excited");bond(by,1,"bug")}
  toast(`תפסת ${b.sp.n}! ‎+${back} ביטים חזרו לסל`);renderHead();dirty();
}
function bugTap(x,y){
  for(const b of bugs)if(Math.hypot(b.x-x,b.y-y)<7){catchBug(b);return true}
  return false;
}
// pips with legs chase bugs
function chaseBug(p,r){
  if(pipMod(p)!==0||!bugs.length||night)return false;
  let best=null,bd=90;for(const b of bugs){const d=Math.hypot(b.x-p.x,b.y-p.y);if(d<bd&&!S.pips.some(q=>q!==p&&rt(q).bug===b)){bd=d;best=b}}
  if(!best)return false;r.goal="bug";r.bug=best;r.state="walk";setT(p,best.x,best.y);say(p,"!",1,"snd","excited");return true;
}
function bugArrive(p,r){
  const b=r.bug;r.goal=null;r.bug=null;
  if(b&&bugs.includes(b)){if(Math.hypot(b.x-p.x,b.y-p.y)<10){catchBug(b,p);r.state="celebrate";r.ct=1;return}
    if(Math.random()<.7){r.goal="bug";r.bug=b;r.state="walk";setT(p,b.x,b.y);return}}
  r.state="idle";r.wait=rand(1,2);
}
function drawBugs(t){
  for(const b of bugs){if(!inView(b.x,b.y,10))continue;const c=b.sp.col,leg=Math.floor(t*12)%2;
    softShadow(b.x,b.y+.5,2,.6,.25);
    if(b.sp.id==="nullmoth"){const f=Math.floor(t*14)%2;R(b.x-2.5,b.y-2-f,2,1.5,c[0]);R(b.x+.5,b.y-2-f,2,1.5,c[0]);R(b.x-.5,b.y-2,1,2,c[1])}
    else if(b.sp.id==="loopworm"){for(let i=0;i<4;i++){const a=t*4+i*1.6;R(b.x+Math.cos(a)*1.6-.5,b.y-1.5+Math.sin(a)*.8,1,1,i?c[0]:c[1])}}
    else{R(b.x-1.5,b.y-2,3,2,c[0]);R(b.x-1.5,b.y-2,3,.5,"rgba(255,255,255,.45)");R(b.x+1,b.y-1.5,1,1,c[1]);
      R(b.x-1.5+leg*.5,b.y,.5,.5,c[1]);R(b.x+leg*.5,b.y,.5,.5,c[1]);R(b.x+1.5-leg*.5,b.y,.5,.5,c[1])}
    if(b.loot)R(b.x-.5,b.y-3.5,1,1,"#5dffb0");
    if(Math.sin(t*9+b.x)>.8)R(b.x-2.5,b.y-1.5,5,.5,c[0]+"88"); // glitch line
  }
}
