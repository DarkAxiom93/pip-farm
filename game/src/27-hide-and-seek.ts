/* ================= hide and seek =================
   The keeper asks the pips to play. Up to 5 of them run off and hide in bushes that pop up around the
   farm (some bushes are empty), in trees, or in the burrow. They count out loud, then the keeper has
   60 seconds to find them by tapping where they hide. Hidden pips give themselves away: a giggle,
   a bush that rustles, a sprout that peeks out for a moment. */
let hide=null; // {phase:"hide"|"seek", t, spots:[{x,y,k,pip,tree,found}], found, total, start}
const HIDE_TIME=60;
function hideBlocked(){
  if(hide)return "כבר משחקים";
  if(night)return "בלילה הפיפים ישנים. מחר";
  if(focusing())return "בזמן ריכוז לא משחקים";
  if(choir)return "הם באמצע מקהלה";
  if(cardOn)return "קודם לסגור את הכרטיס";
  if(hideCandidates().length<2)return "צריך לפחות 2 פיפים ערים ופנויים";
  return null;
}
function hideCandidates(){return S.pips.filter(p=>{const r=rt(p);return ["idle","walk","celebrate","stare","chat","eat"].includes(r.state)&&!r.job&&(!r.goal||r.goal==="wander")&&!p.question&&inView(p.x,p.y,40)})}
function startHide(){
  const why=hideBlocked();if(why){toast(why);return}
  audio();
  const cand=hideCandidates().sort((a,b)=>(b.id===sel?1:0)-(a.id===sel?1:0)||(b.trust??30)-(a.trust??30));
  const hiders=cand.slice(0,5),cx=cam.x+CW/cam.z/2,cy=cam.y+CH/cam.z/2,spots=[];
  // spots: bushes that appear for the game (a few stay empty), plus trees and the burrow close to the view
  const far=(x,y)=>spots.every(s=>Math.hypot(s.x-x,s.y-y)>22);
  for(let i=0;i<80&&spots.length<hiders.length+3;i++){
    const x=cx+rand(-CW/cam.z/2+14,CW/cam.z/2-14),y=cy+rand(-CH/cam.z/2+26,CH/cam.z/2-10);
    if(!walkable(x,y)||!far(x,y)||PLOTS.some(g=>x>g.x-6&&x<g.x+PW+6&&y>g.y-8&&y<g.y+PH+8))continue;
    spots.push({x:Math.round(x),y:Math.round(y),k:"bush",pip:null,found:false});
  }
  TREES.forEach((tr,i)=>{if(zoneOpen(tr.z)&&treeUp(i)&&inView(tr.x,tr.y,-10)&&far(tr.x,tr.y))spots.push({x:tr.x,y:tr.y,k:"tree",tree:i,pip:null,found:false})});
  if(inView(BURROW.x,BURROW.y,-10))spots.push({x:BURROW.x,y:BURROW.y+2,k:"burrow",pip:null,found:false});
  if(spots.length<hiders.length){toast("אין כאן מספיק מקומות להתחבא. תזיז את המפה למקום פתוח");return}
  const free=spots.slice().sort(()=>Math.random()-.5);
  hiders.forEach((p,i)=>{const s=free[i];s.pip=p.id;const r=rt(p);dropNeed(p);r.goal="hide";r.state="walk";r.spot=s;setT(p,s.x,s.y);say(p,pick(["!","הי!","♪"]),1.2,"snd","excited")});
  hide={phase:"hide",t:7,spots,found:0,total:hiders.length,start:0,tell:3,count:0};
  toast(`${hiders.length} פיפים רצים להתחבא. סופרים עד 10…`,1);
  $("hHide").classList.add("on");
}
function hideTick(dt){
  if(!hide)return;
  hide.t-=dt;
  if(hide.phase==="hide"){
    // counting out loud: one note per number
    const n=Math.min(10,Math.floor((7-hide.t)/.65)+1);
    if(n>hide.count){hide.count=n;tone(420+n*38,.09,"triangle",0,1.05,.3)}
    if(hide.t<=0){
      for(const s of hide.spots){if(!s.pip)continue;const p=byId(s.pip);if(!p){s.found=true;continue}const r=rt(p);p.x=s.x;p.y=s.y;r.state="hidden";r.goal=null;clearBubble(p.id)}
      hide.total=hide.spots.filter(s=>s.pip&&!s.found).length;
      hide.phase="seek";hide.t=HIDE_TIME;hide.start=performance.now();
      SFX.level();toast(`מוכנים! מצא את ${hide.total} הפיפים. יש לך ${HIDE_TIME} שניות`,1);
    }
    return;
  }
  // seek: now and then a hidden pip gives itself away
  hide.tell-=dt;
  if(hide.tell<=0){
    hide.tell=rand(4,8);
    const left=hide.spots.filter(s=>s.pip&&!s.found);const s=pick(left);
    if(s){s.wiggle=1;s.peek=.8;if(s.k==="tree")treeShake[s.tree]=1;
      const p=byId(s.pip);if(p)giggle(p,s.x)}
  }
  for(const s of hide.spots){if(s.wiggle)s.wiggle=Math.max(0,s.wiggle-dt*1.5);if(s.peek)s.peek=Math.max(0,s.peek-dt)}
  if(hide.t<=0)endHide(false);
}
// a giggle that comes from the left or the right of the screen, where the pip is
function giggle(p,x){
  if(!AC||!S.sound)return;
  const pan=AC.createStereoPanner?AC.createStereoPanner():null;
  const rel=clamp((x-(cam.x+CW/cam.z/2))/(CW/cam.z/2),-1,1);
  for(let i=0;i<4;i++){
    const t=AC.currentTime+i*.075,o=AC.createOscillator(),g=AC.createGain();
    o.type="triangle";o.frequency.setValueAtTime(p.pitch*1.3*(1+i*.06),t);o.frequency.exponentialRampToValueAtTime(p.pitch*1.6,t+.06);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.3,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+.07);
    o.connect(g);if(pan){pan.pan.value=rel;g.connect(pan)}else g.connect(master);o.start(t);o.stop(t+.1);
  }
  if(pan)pan.connect(master);
}
// tapping during the search. Returns true when the tap was used by the game
function hideTap(x,y){
  if(!hide||hide.phase!=="seek")return false;
  let best=null,bd=99;
  for(const s of hide.spots){if(s.found)continue;const r=s.k==="tree"?11:9,d=Math.hypot(x-s.x,y-(s.y-4));if(d<r&&d<bd){best=s;bd=d}}
  if(!best)return false;
  if(!best.pip){best.found=true;best.empty=1;tone(300,.08,"sawtooth",0,.6,.12);burst(best.x,best.y-4,"dust",5);toast("ריק. רק עלים");return true}
  const p=byId(best.pip);best.found=true;hide.found++;
  if(p){const r=rt(p);r.state="celebrate";r.ct=1.4;r.spot=null;p.y=best.y+3;burst(p.x,p.y-8,"confetti",14);SFX.happy(p.pitch);
    say(p,pick(["מצאת!","!!","הההה"]),2,"word","excited");award(p,4,null);bond(p,3,"hide");p.mood=Math.min(100,p.mood+10)}
  S.sparks+=3;
  if(hide.found>=hide.total)endHide(true);else toast(`מצאת את ${p?p.name:"פיפ"}! נשארו ${hide.total-hide.found}`);
  renderHead();dirty();return true;
}
function endHide(won){
  const h=hide;if(!h)return;hide=null;$("hHide").classList.remove("on");
  const secs=Math.round((performance.now()-h.start)/1000);
  for(const s of h.spots){if(!s.pip||s.found)continue;const p=byId(s.pip);if(!p)continue;const r=rt(p);r.state="celebrate";r.ct=1.6;r.spot=null;p.y=s.y+3;burst(p.x,p.y-8,"dust",8);say(p,pick(["הה!","כאן!","♪♪"]),2,"snd","excited")}
  S.stats.hides=(S.stats.hides||0)+1;
  if(won){
    const bonus=Math.max(5,Math.round(30-secs/2));S.sparks+=bonus;
    const best=S.stats.hideBest||0,record=!best||secs<best;if(record)S.stats.hideBest=secs;
    SFX.level();toast(`מצאת את כולם ב-${secs} שניות! ‎+${bonus} ניצוצות${record&&best?" · שיא חדש!":""}`,1);
    moment("hide",h.spots.filter(s=>s.pip).map(s=>byId(s.pip)),secs);
  }else{
    const left=h.spots.filter(s=>s.pip&&!s.found).length;
    toast(`הזמן נגמר. ${left} פיפים ניצחו אותך הפעם`,1);SFX.mood(600,"curious",.4);
  }
  renderHead();dirty();
}
function drawHide(t){
  if(!hide)return;
  for(const s of hide.spots){
    if(!inView(s.x,s.y,16))continue;
    if(s.k==="bush"&&!(s.found&&!s.empty)){
      const w=s.wiggle?Math.round(Math.sin(t*50)*s.wiggle*2):0,a=s.empty?.35:1;
      if(s.empty){CX.globalAlpha=a}
      R(s.x-7+w,s.y-6,14,6,"#2f6b2a");R(s.x-5+w,s.y-9,10,4,"#3d8a35");R(s.x-3+w,s.y-11,6,3,"#4fa045");R(s.x-4+w,s.y-8,1,1,"#ff7a9a");R(s.x+3+w,s.y-6,1,1,"#ff7a9a");
      CX.globalAlpha=1;
    }
    // a peeking sprout gives the pip away
    if(s.peek&&s.pip&&!s.found){const p=byId(s.pip);if(p){const top=s.k==="tree"?s.y-8:s.k==="burrow"?s.y-6:s.y-12;R(s.x,top-2,1,2,"#3f8f3a");R(s.x-1,top-3,3,1,`hsl(${p.hue},80%,62%)`)}}
  }
}
// timer on top of everything, in screen space
function drawHideHud(){
  if(!hide||hide.phase!=="seek")return;
  const left=Math.max(0,Math.ceil(hide.t)),txt=`נמצאו ${hide.found} מתוך ${hide.total} · ${left} שניות`;
  CX.save();CX.setTransform(1,0,0,1,0,0);(CX as any).direction="rtl";CX.font="bold 12px Fredoka,sans-serif";CX.textAlign="center";CX.textBaseline="middle";
  const w=Math.ceil(CX.measureText(txt).width)+16;
  CX.fillStyle="rgba(0,0,0,.5)";CX.fillRect(Math.round(CW/2-w/2),30,w,18);
  CX.fillStyle=left<=10?"#ff8f8f":"#fff7d6";CX.fillText(txt,CW/2,39);CX.restore();
}
