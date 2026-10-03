/* ================= the evening campfire =================
   A fire pit stands by the burrow. In the evening (17:00 until the pips go to sleep) tap it to light
   the fire, and once an evening it lights by itself if you are around. The pips sit around it and one
   of them tells a story in sounds and little drawings: a moment you shared, or a legend of the farm.
   Tap the fire to throw a piece of wood in: the flames jump and the pips cheer. */
const FIRE={x:62,y:98};
let fire=null; // {phase:"gather"|"tell"|"glow", t, sit:[ids], teller, scenes:[], si, logs}
function eveningNow(){const d=new Date(),h=d.getHours()+d.getMinutes()/60;return h>=17&&!night}
function canFire(){return !fire&&eveningNow()&&!focusing()&&!choir&&!hide&&S.pips.length>=2}
function fireTick(dt){
  if(!fire){
    const today=dayKey(Date.now());
    if(S.fireDay!==today&&canFire()&&Date.now()-lastActive<60000&&new Date().getHours()>=18)lightFire(false);
    return;
  }
  fire.t+=dt;
  if(night&&fire.phase!=="glow"){endFire();return}
  if(fire.phase==="gather"&&fire.t>8){fire.phase="tell";fire.t=0;fire.si=-1}
  if(fire.phase==="tell"){
    const step=Math.floor(fire.t/3.2);
    if(step!==fire.si&&step<fire.scenes.length){fire.si=step;tellScene(fire.scenes[step],step)}
    if(fire.t>fire.scenes.length*3.2+2){fire.phase="glow";fire.t=0;afterStory()}
  }
  if(fire.phase==="glow"&&fire.t>40)endFire();
  if(fire.logs>0)fire.logs=Math.max(0,fire.logs-dt*.4);
}
function lightFire(manual){
  if(!canFire()){if(manual)toast(night?"הפיפים כבר ישנים. מחר בערב":!eveningNow()?"מדליקים מדורה רק בערב, מ-17:00":"עכשיו זה לא זמן טוב למדורה");return}
  S.fireDay=dayKey(Date.now());
  const ps=S.pips.filter(p=>["idle","walk","celebrate","stare","chat","eat"].includes(rt(p).state)&&!rt(p).job).sort((a,b)=>Math.hypot(a.x-FIRE.x,a.y-FIRE.y)-Math.hypot(b.x-FIRE.x,b.y-FIRE.y)).slice(0,10);
  if(ps.length<2){if(manual)toast("הפיפים עסוקים. נסה עוד מעט");return}
  const n=ps.length;
  ps.forEach((p,i)=>{const a=Math.PI*2*i/n,r=rt(p);dropNeed(p);r.goal="fire";r.state="walk";setT(p,FIRE.x+Math.cos(a)*(18+n),FIRE.y+Math.sin(a)*(10+n*.5)+3)});
  const teller=ps.find(p=>p.founder)||ps.slice().sort((a,b)=>(b.trust??30)-(a.trust??30))[0];
  fire={phase:"gather",t:0,sit:ps.map(p=>p.id),teller:teller.id,scenes:storyScenes(teller),si:-1,logs:0};
  tone(180,.4,"sawtooth",0,.6,.12);burst(FIRE.x,FIRE.y-4,"spark",12);
  toast(manual?"המדורה דולקת. הפיפים מתאספים":"ערב. הפיפים הדליקו מדורה ומתאספים סביבה",1);lookAt(FIRE.x,FIRE.y);dirty();
}
// what the teller tells: three little drawings, and a line for the keeper
function storyScenes(p){
  const ms=momentsOf(p).concat((S.moments||[]).filter(m=>!m.who.includes(p.id))),st=S.story;
  if(ms.length&&Math.random()<.75){const m=pick(ms.slice(-12));return[{i:MOMENTS[m.k].i,m},{i:"heart"},{i:"sun"}]}
  if(st&&st.ch>=2&&!st.ending)return[{i:"screen",legend:"על המלבן המואר שמעל העולם, ועל מי שמסתכל מתוכו"},{i:"keeper"},{i:"question"}];
  return pick([[{i:"sun",legend:"על הפיפ הראשון, שהיה לבד בשדה ריק"},{i:"question"},{i:"heart"}],[{i:"rain",legend:"על הסערה הגדולה מלפני שנים"},{i:"door"},{i:"sun"}],[{i:"keeper",legend:"על השומר, שמגיע מלמעלה"},{i:"heart"},{i:"heart"}]]);
}
function tellScene(sc,k){
  const p=byId(fire.teller);if(!p)return;
  say(p," ",3,"memo","content");const b=bubbleEls.get(p.id);if(b){b.textContent="";b.appendChild(doodleCanvas(sc.i,3))}
  SFX.babble(p.pitch,3+k);
  if(k===0)toast(`${p.name} מספר ${sc.m?`על ${momentText(sc.m).replace(/^היום שבו /,"היום ש")}`:sc.legend}`,1);
  // the listeners react
  fire.sit.map(byId).filter(q=>q&&q!==p).slice(0,6).forEach((q,i)=>setTimeout(()=>{if(!fire)return;const r=rt(q);if(r.state==="act"&&r.act==="sit"&&Math.random()<.5)say(q,pick(k===2?["♪","!","אהה"]:["?","!","…"]),1.2,"snd",k===2?"excited":"curious")},400+i*250));
}
function afterStory(){
  const ps=fire.sit.map(byId).filter(Boolean);
  ps.forEach(p=>{p.mood=Math.min(100,p.mood+8);bond(p,2,"fire")});
  S.stats.fires=(S.stats.fires||0)+1;goal("campfire");
  if(S.stats.fires===1)moment("fire",ps);
  toast("הסיפור נגמר. הפיפים נשארים עוד קצת ליד האש. אפשר לזרוק עוד עץ",1);dirty();
}
function endFire(){
  if(!fire)return;
  fire.sit.map(byId).filter(Boolean).forEach(p=>{const r=rt(p);if(r.goal==="fire"||r.act==="sit"&&r.fire){r.state="idle";r.act=null;r.goal=null;r.fire=false;r.wait=rand(1,3)}});
  fire=null;
}
function fireArrive(p){const r=rt(p);r.goal=null;if(!fire){r.state="idle";r.wait=1;return}r.state="act";r.act="sit";r.fire=true;r.ct=999;r.dir=p.x<FIRE.x?1:-1}
function fireTap(x,y){
  if(Math.hypot(x-FIRE.x,y-(FIRE.y-3))>7)return false;
  if(!fire){lightFire(true);return true}
  if((S.wood||0)<=0){toast("אין עצים. כרות עץ כדי לזרוק למדורה");return true}
  S.wood--;fire.logs=Math.min(3,fire.logs+1);burst(FIRE.x,FIRE.y-8,"spark",16);tone(160,.25,"sawtooth",0,.5,.1);
  fire.sit.map(byId).filter(Boolean).slice(0,6).forEach((p,i)=>setTimeout(()=>{if(fire)say(p,pick(["!!","♪","יאיי"]),1,"snd","excited")},i*100));
  if(fire.phase==="glow")fire.t=Math.max(0,fire.t-12); // more wood, the evening lasts longer
  renderHead();dirty();return true;
}
function drawFire(t){
  if(!inView(FIRE.x,FIRE.y,20))return;
  const x=FIRE.x,y=FIRE.y;
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;R(x+Math.round(Math.cos(a)*6)-1,y+Math.round(Math.sin(a)*3)-1,2,2,"#857a6c")}
  R(x-4,y-1,8,1,"#5a3d2b");R(x-3,y-2,6,1,"#6a4a2a");
  if(!fire){if(eveningNow()&&Math.sin(t*3)>.6)R(x,y-3,1,1,"#ffd166");return}
  const big=1+(fire.logs||0)*.35;
  for(let i=0;i<7;i++){const h=Math.round((4+Math.random()*5)*big),fx=x-3+i;R(fx,y-1-h,1,h,i%2?"#ff9a3c":"#ffd166");if(Math.random()<.4)R(fx,y-2-h,1,1,"#fff3b0")}
  if(Math.random()<.25)parts.push({x:x+rand(-2,2),y:y-8,vx:rand(-4,4),vy:-18,life:.9,kind:"c",c:pick(["#ffd166","#ff9a3c"])});
}
function drawFireGlow(t){
  if(!fire||!inView(FIRE.x,FIRE.y,40))return;
  const a=.35+.06*Math.sin(t*9)+.05*(fire.logs||0),g=ctx.createRadialGradient(FIRE.x,FIRE.y-5,1,FIRE.x,FIRE.y-5,44);
  g.addColorStop(0,`rgba(255,170,80,${a})`);g.addColorStop(1,"rgba(255,170,80,0)");ctx.fillStyle=g;ctx.fillRect(FIRE.x-44,FIRE.y-49,88,88);
}
