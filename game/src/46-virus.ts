/* ================= the virus =================
   A rare event once the farm is digital: a glitch takes over one field and spreads to the
   next one every so often. Infected fields freeze (nothing grows, nobody works there).
   Tap an infected field and send a pip to clean it. Pips with an antenna are much faster,
   and they leave the field vaccinated for a day. Clean everything for a reward. */
const VIRUS_SPREAD=30,VIRUS_CLEAN=[7,3]; // seconds: spread, clean time (normal pip, antenna pip)
const virusOn=()=>digi()>=.45||(S.net||0)>=10;
const infected=i=>!!(S.virus&&S.virus.plots.includes(i));
let virusT=0;
function virusTick(dt){
  if(!S)return;
  const v=S.virus;
  if(!v){
    if(!virusOn()||night||hide||fire||cardOn)return;
    if(!S.virusNext){S.virusNext=Date.now()+rand(20,40)*60000;return}
    if(Date.now()<S.virusNext)return;
    const owned=S.plots.map((pl,i)=>i).filter(i=>S.plots[i].owned&&!vaccinated(i)&&(!PLOTS[i].z||zoneOpen(PLOTS[i].z)));
    if(owned.length<2){S.virusNext=Date.now()+600000;return}
    startVirus(pick(owned));return;
  }
  // frozen fields don't grow
  for(const i of v.plots){const c=S.plots[i]&&S.plots[i].crop;if(c&&cropFrac(c)<1)c.planted+=dt*1000}
  virusT-=dt;if(virusT>0)return;virusT=1;
  if(Date.now()>=v.next){v.next=Date.now()+VIRUS_SPREAD*1000*(res("antivirus")?2:1);
    const free=S.plots.map((pl,i)=>i).filter(i=>S.plots[i].owned&&!v.plots.includes(i)&&!vaccinated(i)&&(!PLOTS[i].z||zoneOpen(PLOTS[i].z)));
    if(free.length){const src=PLOTS[pick(v.plots)];free.sort((a,b)=>Math.hypot(PLOTS[a].x-src.x,PLOTS[a].y-src.y)-Math.hypot(PLOTS[b].x-src.x,PLOTS[b].y-src.y));
      v.plots.push(free[0]);tone(140,.3,"sawtooth",0,.7,.08);toast("הווירוס התפשט לעוד שדה!");dirty()}}
}
function vaccinated(i){return S.vacc&&S.vacc[i]&&S.vacc[i]>Date.now()}
function startVirus(i){
  S.virus={plots:[i],next:Date.now()+VIRUS_SPREAD*1000,start:Date.now(),cleaned:0};S.virusNext=0;
  S.stats.viruses=(S.stats.viruses||0)+1;
  card({title:"וירוס!",lines:["~משהו זר נכנס לשדה. הכל שם קפא.","~הפיפים מסתכלים עליו ולא מבינים מה זה.","> sys: 'זוהה קוד לא מוכר. מתפשט.'","~הקש על השדה ושלח פיפ לנקות. פיפים עם אנטנה מהירים פי שניים."]});
  // stop work there
  for(const j of jobs.slice())if(j.plot===i){const p=byId(j.pip);if(p){const r=rt(p);r.job=null;r.state="idle";r.goal=null}jobs.splice(jobs.indexOf(j),1);S.plots[i].pending=false}
  lookAt(PLOTS[i].x+PW/2,PLOTS[i].y+PH/2);dirty();
}
// the keeper sends a pip: antenna pips first, then whoever is closest and free
function sendCleaner(i){
  const g=PLOTS[i],busy=new Set(S.pips.filter(p=>rt(p).goal==="clean").map(p=>rt(p).clean));
  if(busy.has(i)){toast("פיפ כבר בדרך לשם");return}
  const free=S.pips.filter(p=>{const r=rt(p);return ["idle","walk","celebrate","chat","stare"].includes(r.state)&&!r.job&&r.goal!=="clean"});
  if(!free.length){toast("כל הפיפים עסוקים. נסה עוד רגע");return}
  free.sort((a,b)=>(pipMod(b)===2?1:0)-(pipMod(a)===2?1:0)||Math.hypot(a.x-g.x,a.y-g.y)-Math.hypot(b.x-g.x,b.y-g.y));
  const p=free[0],r=rt(p);r.goal="clean";r.clean=i;r.state="walk";setT(p,g.x+PW/2+rand(-8,8),g.y+PH+5);
  say(p,pipMod(p)===2?"📡!":"!",1.4,"snd","excited");
}
function cleanArrive(p,r){
  const i=r.clean;r.goal=null;
  if(!infected(i)){r.state="idle";r.wait=1;return}
  r.state="clean";r.workT=r.workMax=VIRUS_CLEAN[pipMod(p)===2?1:0];r.dir=1;
}
function cleanDone(p,r){
  const i=r.clean,v=S.virus;r.clean=null;r.state="celebrate";r.ct=1.2;
  if(!v||!infected(i))return;
  v.plots.splice(v.plots.indexOf(i),1);v.cleaned++;
  const g=PLOTS[i];burst(g.x+PW/2,g.y+PH/2,"spark",16);tone(880,.08,"square",0,1,.12);tone(1320,.12,"square",.08,1,.12);
  if(pipMod(p)===2){S.vacc=S.vacc||{};S.vacc[i]=Date.now()+86400000}
  bond(p,2,"clean");award(p,10,null);
  if(!v.plots.length){S.virus=null;S.virusNext=Date.now()+rand(40,80)*60000;S.stats.virusWins=(S.stats.virusWins||0)+1;
    const pay=10+v.cleaned*5;S.sparks+=pay;SFX.level();toast(`הווירוס נוקה! ‎+${pay} ניצוצות`,1);
    S.pips.filter(q=>inView(q.x,q.y,0)).slice(0,10).forEach(q=>{const rq=rt(q);if(rq.state==="idle"||rq.state==="walk"){rq.state="celebrate";rq.ct=1.4}})}
  else toast(`שדה נוקה. נשארו ${v.plots.length}`);
  renderHead();dirty();
}
function virusPopup(i){
  const n=S.pips.filter(p=>pipMod(p)===2).length;
  return `<h4>שדה נגוע</h4><p>הכל קפא כאן. צריך לנקות</p><button class="btn main" data-act="clean">לשלוח פיפ לנקות</button><p>${n?`יש לך ${n} פיפים עם אנטנה. הם מנקים מהר ומחסנים את השדה ליום`:"פיפים עם אנטנה מנקים מהר פי שניים"}</p>`;
}
function drawVirus(t){
  if(S.virus)for(const i of S.virus.plots){const g=PLOTS[i];if(!inView(g.x+PW/2,g.y+PH/2,PW))continue;
    ctx.globalAlpha=.55;R(g.x,g.y,PW,PH,"#2a0f2e");ctx.globalAlpha=1;
    const k=Math.floor(t*10);
    for(let n=0;n<14;n++){const h=(n*73+k*31+i*17)%997,x=g.x+(h%(PW-3)),y=g.y+((h>>3)%(PH-2));R(x,y,1+(h%3),1,(h&1)?"#ff4fd8":"#7dffbf")}
    if(k%7===0)R(g.x-2,g.y+((k*13)%PH),PW+4,1,"rgba(255,79,216,.6)");
    R(g.x-1,g.y-1,PW+2,.5,"#ff4fd8");R(g.x-1,g.y+PH+.5,PW+2,.5,"#ff4fd8");R(g.x-1,g.y-1,.5,PH+2,"#ff4fd8");R(g.x+PW+.5,g.y-1,.5,PH+2,"#ff4fd8");
  }
  if(S.vacc)for(const k in S.vacc){const i=+k;if(!vaccinated(i)||infected(i))continue;const g=PLOTS[i];if(!g||!inView(g.x,g.y,PW))continue;
    R(g.x+PW-4,g.y+1,3,3,"#c9a2ff");R(g.x+PW-3.5,g.y+1.5,2,2,"#2f1f4a");R(g.x+PW-3,g.y+2,1,1,"#c9a2ff")}
}
