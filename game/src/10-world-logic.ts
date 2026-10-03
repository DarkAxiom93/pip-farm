/* ================= world logic ================= */
function growMul(){return (S&&S.builds&&S.builds.well&&S.builds.well.done?.9:1)*(S&&S.streak&&S.streak.days>=7?.8:1)*(curSeason==="winter"?1.4:curSeason==="summer"?.85:1)}
function cropFrac(c){return (Date.now()-c.planted)/(CROPS[c.type].grow*1000*(c.water?.7:1)*growMul())}
function cropLeft(c){return CROPS[c.type].grow*(c.water?.7:1)*growMul()-(Date.now()-c.planted)/1000}
function inPond(x,y){return ((x-POND.x)/(POND.rx+5))**2+((y-POND.y)/(POND.ry+5))**2<1}
function wanderTarget(p){
  const tt=tribeOf(p);if(tt&&Math.random()<.5){const c=TCAMPS[tt.camp];for(let i=0;i<8;i++){const x=c.x+rand(-26,26),y=c.y+rand(-18,10);if(walkable(x,y))return[x,y]}}
  const far=Math.random()<.12,zs=ZONES.filter(z=>zoneOpen(z.id));
  for(let i=0;i<25;i++){let x,y;if(far){const z=pick(zs);x=rand(z.x+8,z.x+z.w-8);y=rand(z.y+16,z.y+z.h-4)}else{x=p.x+rand(-80,80);y=p.y+rand(-60,60)}if(walkable(x,y))return[x,y]}
  return[rand(90,240),rand(64,86)];
}
function setT(p,x,y){const r=rt(p);r.tx=x;r.ty=y;if(Math.abs(x-p.x)>1)r.dir=x>p.x?1:-1}
function byId(id){return S.pips.find(p=>p.id===id)}

const jobs=[];
function autoWork(p){
  const r=rt(p);
  for(let i=0;i<S.plots.length;i++){
    const pl=S.plots[i];if(!pl.owned||pl.pending)continue;
    let type=null;
    if(pl.crop&&cropFrac(pl.crop)>=1)type="harvest";
    else if(!pl.crop&&S.pips.length>=3)type="plant";
    else if(pl.crop&&!pl.crop.water&&Math.random()<.3)type="water";
    if(!type)continue;
    pl.pending=true;const j={type,plot:i,seed:S.seeds[S.lastSeed||0]?S.lastSeed||0:0,prefer:null,pip:p.id,auto:true};
    jobs.push(j);r.job=j;r.state="walk";r.goal="job";const g=PLOTS[i];setT(p,g.x+8+ri(0,30),g.y+PH+6);
    return true;
  }
  return false;
}
function queueJob(type,plot,seed?){
  if(S.plots[plot].pending)return;
  S.plots[plot].pending=true;
  jobs.push({type,plot,seed,prefer:sel,pip:null});
  toast(type==="plant"?"מחפש פיפ פנוי לשתילה…":type==="water"?"מחפש פיפ להשקיה…":"מחפש פיפ לקטיף…");
}
function assignJobs(){
  S.plots.forEach((pl,i)=>{if(pl.pending&&!jobs.some(j=>j.plot===i))pl.pending=false});
  for(const j of jobs){
    if(j.pip)continue;
    const busy=new Set(jobs.filter(x=>x.pip).map(x=>x.pip));
    const free=S.pips.filter(p=>{const r=rt(p);return !busy.has(p.id)&&["idle","walk","sleep","chat"].includes(r.state)&&!r.job});
    if(!free.length)continue;
    const pl=PLOTS[j.plot];
    let p=free.find(q=>q.id===j.prefer);
    if(!p){const awake=free.filter(q=>rt(q).state!=="sleep"&&q.energy>12);const pool=awake.length?awake:free;p=pool.sort((a,b)=>Math.hypot(a.x-pl.x,a.y-pl.y)-Math.hypot(b.x-pl.x,b.y-pl.y))[0]}
    const r=rt(p);j.pip=p.id;r.job=j;r.state="walk";r.goal="job";r.nap=false;
    setT(p,pl.x+8+ri(0,30),pl.y+PH+6);
    say(p,pick(["פיפ!","♪","טיק!"]),1.4,"snd","happy");
  }
}
function startWork(p){
  const r=rt(p),j=r.job;
  if(!j){r.state="idle";r.wait=1;return}
  r.state="work";
  if(j.type!=="water")langSpeak(p,"work",.18);
  const base={plant:3,water:2,harvest:3}[j.type];
  r.workMax=r.workT=base*(dom(p)==="work"?.65:1)*(p.food<15?1.4:1)*(S.items&&S.items.hoe?.7:1);
}
function finishJob(p){
  const r=rt(p),j=r.job,pl=S.plots[j.plot],g=PLOTS[j.plot];
  jobs.splice(jobs.indexOf(j),1);r.job=null;pl.pending=false;
  p.energy=Math.max(0,p.energy-6);
  if(j.type==="plant"&&!pl.crop){pl.crop={type:j.seed,planted:Date.now(),water:!!(S.builds.well&&S.builds.well.done)};SFX.plop();quest("plant");burst(g.x+24,g.y+15,"dust",8);award(p,10,j.auto?null:"work")}
  else if(j.type==="water"&&pl.crop&&!pl.crop.water){pl.crop.water=true;SFX.water();burst(g.x+24,g.y+15,"drop",12);award(p,6,j.auto?null:"work");langSpeak(p,"water",.3)}
  else if(j.type==="harvest"&&pl.crop&&cropFrac(pl.crop)>=1){
    const c=CROPS[pl.crop.type];pl.crop=null;S.sparks+=c.spark;addFood(c.yld+(curSeason==="autumn"?1:0));S.stats.harvests++;quest("harvest");goal("harvest");if([1,25,100,500].includes(S.stats.harvests))moment("harvest",null,S.stats.harvests,false);
    SFX.coin();burst(g.x+24,g.y+12,"spark",14);award(p,22,j.auto?null:"work");
    if(c.star){S.pips.forEach(q=>q.mood=Math.min(100,q.mood+20));toast("פרח כוכב! כל הפיפים שמחים")}
    if(!j.auto)toast(`${p.name} קטף ${c.name}: ‎+${c.spark} ניצוצות, ‎+${c.yld} לסל`);
    r.state="celebrate";r.ct=.9;renderAll();dirty();return;
  }
  r.state="idle";r.wait=rand(.5,1.5);renderAll();dirty();
}
function award(p,pts,kind){
  const before=level(p);
  p.xp+=pts;p.growth+=pts;if(kind)p.c[kind]=(p.c[kind]||0)+1;
  const after=level(p);
  if(after>before){
    SFX.level();burst(p.x,p.y-12,"spark",10);
    const st=stageOf(after),was=stageOf(before);
    toast(st!==was?`${p.name} התפתח ל${st}!`:`${p.name} עלה לרמה ${after}`);
    chatter(p,"excited",Math.random()<.4);
  }
  dirty();
}
function doSplit(p){
  const c=newPip(p);
  c.x=clamp(p.x+7,6,WW-6);p.x=clamp(p.x-4,6,WW-6);
  p.growth=0;c.growth=0;p.food=Math.max(0,p.food-18);c.food=p.food;
  if(c.mut==="tiny")c.pitch=Math.min(1300,c.pitch*1.25);
  S.pips.push(c);S.stats.splits++;goal("split");if(S.stats.splits===1)moment("split",[p,c],c.name);else if([10,50,100].includes(S.stats.splits))moment("split10",null,S.stats.splits,false);quest("split");if(S.meteorBoost>0)S.meteorBoost--;
  setTimeout(()=>{if(byId(c.id))discover(c,true)},1400);
  rt(p).state="celebrate";rt(p).ct=1.3;const rc=rt(c);rc.state="celebrate";rc.ct=1.3;
  SFX.split(p.pitch);burst(p.x+2,p.y-8,"confetti",26);
  toast(`${p.name} התפצל! נולד ${c.name}`);
  setTimeout(()=>say(c,pick(["פי?","?!","פיפ!"]),1.8,"snd","curious"),900);
  renderAll();dirty();
}

