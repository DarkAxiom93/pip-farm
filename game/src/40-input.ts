/* ================= input on canvas ================= */
function toWorld(e){const b=cv.getBoundingClientRect();return[cam.x+(e.clientX-b.left)/b.width*CW/cam.z,cam.y+(e.clientY-b.top)/b.height*CH/cam.z]}
const ptrs=new Map();let drag=null,pinch=null,mouseW=null;
function hitPip(x,y){
  const m=2/cam.z*2,ord=S.pips.filter(p=>inView(p.x,p.y,20)).sort((a,b)=>b.y-a.y);
  for(const p of ord){const bw=7+Math.floor(Math.min(level(p),10)*.4);if(Math.abs(x-p.x)<bw/2+3+m&&y>p.y-bw-6-m&&y<p.y+3+m)return p}
  return null;
}
function callPips(x,y){
  if(S.story&&S.story.ending==="together"&&S.story.avatar){S.story.avatar.tx=x;S.story.avatar.ty=y}
  tone(880,.12,"sine",0,1.3,.35);tone(1180,.22,"sine",.14,.85,.35);
  for(let i=0;i<14;i++){const a=i/14*6.28;parts.push({x,y,vx:Math.cos(a)*30,vy:Math.sin(a)*18,life:.5,kind:"c",c:"#fff7d6"})}
  const near=S.pips.filter(p=>{const r=rt(p);return["idle","walk","chat","eat","celebrate"].includes(r.state)&&!r.job&&r.goal!=="job"&&Math.hypot(p.x-x,p.y-y)<170}).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y)).slice(0,12);
  near.forEach((p,i)=>{const r=rt(p),a=i/Math.max(1,near.length)*6.28,rr=8+near.length;let tx=x+Math.cos(a)*rr,ty=y+Math.sin(a)*rr*.6;if(!walkable(tx,ty)){tx=x;ty=y}r.goal="greet";r.state="walk";r.wid&&wildClaims.delete(r.wid);r.wid=null;setT(p,tx,ty);setTimeout(()=>{if(byId(p.id))say(p,pick(["♪!","פיפ!","!"]),1.2,"snd","excited")},rand(100,900))});
  if(!near.length)toast("אין פיפים פנויים קרוב לכאן");
  quest("call");
}
function liftPip(p){const r=rt(p);if(r.job){r.goal=null}r.state="held";r.goal=null;SFX.mood(p.pitch*1.3,"scared",.3);say(p,pick(["!?","וויי!","איק!"]),1.2,"snd","scared")}
function dropPip(p){
  const r=rt(p);
  if(inPond(p.x,p.y)||inRiver(p.x,p.y)){for(let i=0;i<12;i++)parts.push({x:p.x,y:p.y-2,vx:rand(-20,20),vy:rand(-30,-10),life:.7,kind:"drop"});SFX.water();say(p,"!!",1.4,"snd","scared");p.mood=Math.max(0,p.mood-3);
    let tx=p.x,ty=p.y;for(let i=0;i<40&&!walkable(tx,ty);i++){tx=p.x+rand(-40,40);ty=p.y+rand(-30,30)}r.state="walk";r.goal="wander";setT(p,tx,ty);return}
  if(!walkable(p.x,p.y)){p.x=clamp(p.x,8,WW-8);p.y=clamp(p.y,18,WH-4)}
  r.state="act";r.act="hop";r.ct=.5;tone(220,.08,"sine",0,.6,.3);
}
let cuddleT=0;
function cuddleTick(p,dt){
  cuddleT-=dt;if(cuddleT>0)return;cuddleT=.35;
  burst(p.x,p.y-10,"heart",1);const h=parts[parts.length-1];h.vx=rand(-6,6);h.vy=-14;
  SFX.purr(p.pitch);p.mood=Math.min(100,p.mood+2);p.trust=clamp((p.trust??30)+.4,-100,100);
  const r=rt(p);r.cud=(r.cud||0)+.35;
  if(r.cud>=1.4&&!r.cudDone){r.cudDone=true;award(p,4,"pet");bond(p,3,"pet");if(r.need&&(r.need.type==="pet"||r.need.type==="play"))fulfill(p);langSpeak(p,"love",.5);quest("cuddle")}
}
cv.addEventListener("pointerdown",e=>{
  audio();camVel=null;try{cv.setPointerCapture(e.pointerId)}catch(_){}
  ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size===1&&buildDown(e)){drag=null;return}
  if(ptrs.size===1){
    const[wx,wy]=toWorld(e),pp=hitPip(wx,wy);
    drag={sx:e.clientX,sy:e.clientY,cx:cam.x,cy:cam.y,moved:false,pip:pp?pp.id:null,held:false,hold:false,wx,wy};
    const d=drag;
    d.timer=setTimeout(()=>{if(drag!==d||d.moved)return;d.hold=true;
      if(d.pip){const p=byId(d.pip);if(p){const r=rt(p);if(["sleep","split","pass","choir"].includes(r.state))return;r.state="cuddle";r.cud=0;r.cudDone=false;cuddleT=0;closePlot()}}
      else callPips(d.wx,d.wy)},520);
  }
  else if(ptrs.size===2){const[a,b]=[...ptrs.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y)||1,z:cam.z};if(drag)clearTimeout(drag.timer);drag=null}
});
cv.addEventListener("pointermove",e=>{
  mouseW=toWorld(e);
  if(bDrag&&buildMove(e))return;
  if(!ptrs.has(e.pointerId))return;ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  const b=cv.getBoundingClientRect();
  if(pinch&&ptrs.size===2){const[p1,p2]=[...ptrs.values()];zoomAt(pinch.z*Math.hypot(p1.x-p2.x,p1.y-p2.y)/pinch.d,((p1.x+p2.x)/2-b.left)/b.width,((p1.y+p2.y)/2-b.top)/b.height);camGoal=null;return}
  if(drag){const dx=e.clientX-drag.sx,dy=e.clientY-drag.sy;
    if(drag.hold&&drag.pip){const p=byId(drag.pip);if(p&&Math.hypot(dx,dy)>14&&rt(p).state==="cuddle"){drag.held=true;drag.moved=true;liftPip(p)}}
    if(!drag.moved&&Math.hypot(dx,dy)>7){drag.moved=true;clearTimeout(drag.timer);closePlot();camGoal=null;
      if(drag.pip){const p=byId(drag.pip);const r=p&&rt(p);if(p&&!["sleep","split","pass","choir","argue"].includes(r.state)){drag.held=true;liftPip(p)}}}
    if(drag.held){const p=byId(drag.pip);if(p){const[wx,wy]=toWorld(e);p.x=clamp(wx,4,WW-4);p.y=clamp(wy+5,16,WH-2);const r=rt(p);r.anim+=.05}}
    else if(drag.moved){cam.x=drag.cx-dx/b.width*CW/cam.z;cam.y=drag.cy-dy/b.height*CH/cam.z;clampCam();
      const now=performance.now();if(drag.lt){const d=(now-drag.lt)/1000;if(d>0){drag.vx=(cam.x-drag.lcx)/d;drag.vy=(cam.y-drag.lcy)/d}}drag.lt=now;drag.lcx=cam.x;drag.lcy=cam.y}}
});
cv.addEventListener("pointerup",e=>{
  if(!ptrs.has(e.pointerId))return;ptrs.delete(e.pointerId);
  if(bDrag&&buildUp(e))return;
  if(pinch){if(ptrs.size<2)pinch=null;drag=null;return}
  if(drag){clearTimeout(drag.timer);
    const p=drag.pip&&byId(drag.pip);
    if(drag.held&&p){dropPip(p);quest("carry")}
    else if(drag.hold&&p){const r=rt(p);if(r.state==="cuddle"){r.state="celebrate";r.ct=.6}}
    else if(!drag.moved&&!drag.hold)tapAt(e);
    else if(drag.moved&&!drag.held&&drag.lt&&performance.now()-drag.lt<80){const v={x:drag.vx||0,y:drag.vy||0},sp=Math.hypot(v.x,v.y),mx=400;if(sp>20)camVel=sp>mx?{x:v.x/sp*mx,y:v.y/sp*mx}:v}}
  drag=null;
});
cv.addEventListener("pointercancel",e=>{ptrs.delete(e.pointerId);if(drag){clearTimeout(drag.timer);const p=drag.pip&&byId(drag.pip);if(p&&["held","cuddle"].includes(rt(p).state)){rt(p).state="idle";rt(p).wait=1}}drag=null;pinch=null});
cv.addEventListener("wheel",e=>{e.preventDefault();const b=cv.getBoundingClientRect();zoomAt(cam.z*(e.deltaY<0?1.25:.8),(e.clientX-b.left)/b.width,(e.clientY-b.top)/b.height);camGoal=null},{passive:false});
$("zIn").addEventListener("click",()=>{zoomAt(cam.z*1.5,.5,.5)});
$("zOut").addEventListener("click",()=>{zoomAt(cam.z/1.5,.5,.5)});
// when pips overlap, the one that is waiting for you wins: a dream, then a memory, then a word with "?"
function tapPriority(p){const r=rt(p),now=performance.now();return r.dream&&now<r.dream.until?3:r.recall&&now<r.recall.until?2:r.said&&now<r.said.until&&r.state!=="sleep"?1:0}
function tapAt(e){
  if(starMode){starTap(e);return}
  if(placing){const[wx,wy]=toWorld(e);placeDecorAt(wx,wy);return}
  if(night&&S.stars.length){const b=cv.getBoundingClientRect(),sx=(e.clientX-b.left)/b.width*CW,sy=(e.clientY-b.top)/b.height*CH;
    const st=S.stars.find(q=>{const{fx,fy}=starPos(q);return Math.hypot(fx*CW-sx,fy*CH-sy)<9});
    if(st){openStar(st);return}}
  const[x,y]=toWorld(e),m=2/cam.z*2;
  if(hideTap(x,y))return; // during hide and seek the search comes first
  if(S.story&&S.story.glitch&&Math.hypot(x-S.story.glitch.x,y-(S.story.glitch.y-6))<11){takeGlitch();return}
  if(fireTap(x,y))return; // the fire sits in a ring of pips, so it is checked before them
  // a pip that is remembering something is tapped first, even in a crowd
  const ord=S.pips.filter(p=>inView(p.x,p.y,20)&&rt(p).state!=="hidden").sort((a,b)=>tapPriority(b)-tapPriority(a)||b.y-a.y);
  for(const p of ord){
    const bw=7+Math.floor(Math.min(level(p),10)*.4);
    if(Math.abs(x-p.x)<bw/2+3+m&&y>p.y-bw-6-m&&y<p.y+3+m){tapPip(p);return}
  }
  if(catchFlyAt(x,y))return; // pips first, then the fireflies around them
  if(natureTap(x,y))return;
  {const d=decorAt(x,y);if(d){openDecor(d);return}}
  for(let i=0;i<PLOTS.length;i++){const g=PLOTS[i];if(g.z&&!zoneOpen(g.z))continue;if(x>=g.x-2&&x<=g.x+PW+2&&y>=g.y-2&&y<=g.y+PH+4){openPlot(i);return}}
  if(S.visitor&&Math.abs(x-S.visitor.x)<8&&y>S.visitor.y-22&&y<S.visitor.y+3){openVisitor();return}
  if(S.meteor&&S.meteor.landed&&!S.meteor.taken&&Math.hypot(x-S.meteor.x,y-S.meteor.y+3)<10){takeMeteor();return}
  {const ti=hitTree(x,y);if(ti>=0){chop(ti);return}}
  {const w=S.wild.find(q=>Math.abs(q.x-x)<5&&Math.abs(q.y-2-y)<5);if(w){pickWild(w,null);toast("אספת אוכל לסל");refresh();return}}
  {const bk=hitBuilding(x,y);if(bk&&zoneOpen("farm")){openBuilding(bk);return}}
  for(const d of S.drawings)if(Math.abs(x-(d.x-4))<10&&Math.abs(y-(d.y-6))<10){openDrawing(d);return}
  if(S.statue&&Math.abs(x-STATUE.x)<9&&y>STATUE.y-38&&y<STATUE.y+2){openStatue();return}
  const z=zoneAt(x,y);if(z&&!zoneOpen(z.id)){openZone(z);return}
  if(waterTap(x,y))return;
  closePlot();
}
/* minimap and zone locks */
const mini=$("mini"),mctx=mini.getContext("2d");
function drawMini(){
  const k=128/WW;mctx.setTransform(1,0,0,1,0,0);mctx.imageSmoothingEnabled=true;mctx.drawImage(bg,0,0,128,67);
  for(const z of ZONES)if(!zoneOpen(z.id)){mctx.fillStyle="rgba(16,18,26,.7)";mctx.fillRect(z.x*k,z.y*k,z.w*k,z.h*k)}
  for(const p of S.pips){mctx.fillStyle=p.id===sel?"#ff5d73":"#ffd166";mctx.fillRect(Math.round(p.x*k),Math.round(p.y*k)-1,1,1)}
  mctx.strokeStyle="#fff";mctx.lineWidth=1;mctx.strokeRect(cam.x*k+.5,cam.y*k+.5,CW/cam.z*k-1,CH/cam.z*k-1);
}
mini.addEventListener("pointerdown",e=>{audio();const b=mini.getBoundingClientRect();lookAt((e.clientX-b.left)/b.width*WW,(e.clientY-b.top)/b.height*WH)});
const zlocks=new Map();
function syncLocks(){
  for(const z of ZONES){
    let el=zlocks.get(z.id);
    if(zoneOpen(z.id)){if(el){el.remove();zlocks.delete(z.id)}continue}
    if(!el){el=document.createElement("button");el.type="button";el.className="zlock";el.innerHTML=`${z.name}<small>${z.cost} ✦</small>`;el.onclick=()=>{audio();openZone(z)};$("bubbles").appendChild(el);zlocks.set(z.id,el)}
    const[l,t]=scr(z.x+z.w/2,z.y+z.h/2);el.style.left=l+"%";el.style.top=t+"%";el.hidden=l<-5||l>105||t<-5||t>105;
  }
}
function popAt(wx,wy){openPlotIdx=-1;const m=$("pmenu"),[l,t]=scr(wx,wy);m.hidden=false;m.style.left=clamp(l,22,78)+"%";const below=t<38;m.style.top=clamp(t,4,96)+"%";m.style.transform=below?"translate(-50%,8%)":"translate(-50%,-104%)";return m}
function openDrawing(d){
  const m=popAt(d.x-4,d.y-12),artist=byId(d.by);
  m.innerHTML=`<h4>ציור של ${esc(d.name)}</h4><p>${DOODLE_TXT[d.k]}</p><p>צויר כשלא היית כאן ${d.away} שעות</p>${artist?`<button class="btn main" data-thank="${d.t}">להודות ל${esc(d.name)}</button>`:""}`;
}
function openStar(st){
  const{fx,fy}=starPos(st),m=$("pmenu");openPlotIdx=-1;m.hidden=false;m.style.left=clamp(fx*100,22,78)+"%";m.style.top=(fy*100+4)+"%";m.style.transform="translate(-50%,0)";
  m.innerHTML=`<h4>הכוכב של ${esc(st.name)}</h4><p>חי ${st.days} ימים · דור ${st.gen}${st.mut?" · "+traitLabel("mut:"+st.mut):""}</p><p>${st.trust>=60?"הוא אהב אותך":st.trust>=25?"הוא סמך עליך":"הוא לא תמיד היה בטוח בך"}</p><p>הפך לכוכב ${ago(st.died)}</p>`;
}
function openStatue(){
  const st=S.statue,m=popAt(STATUE.x,STATUE.y-36),a=avgTrust();
  m.innerHTML=st.done?`<h4>הפסל שלך</h4><p>${st.by.length} פיפים בנו אותו. הוא ${statueStyle()==="gold"?"מוזהב, כי הם אוהבים אותך":statueStyle()==="stone"?"מאבן. הם עוד מחליטים מה הם חושבים עליך":"כהה וסדוק, כי הם חוששים ממך"}</p><p>מנחות שהביאו: ${st.offer||0}</p><p>אמון ממוצע: ${Math.round(a)}</p>`
    :`<h4>משהו בבנייה…</h4><p>${Math.round(st.p)}% מוכן. רק פיפים שסומכים עליך (אמון מעל 40) עוזרים לבנות</p>`;
}
function openZone(z){
  openPlotIdx=-1;const m=$("pmenu"),[l,t]=scr(z.x+z.w/2,z.y+z.h/2);
  m.hidden=false;m.style.left=clamp(l,22,78)+"%";m.style.top=clamp(t,10,70)+"%";m.style.transform="translate(-50%,0)";
  m.innerHTML=`<h4>${z.name}</h4><p>${z.desc}</p><p>מקום לעוד 16 פיפים</p><button class="btn main" data-zone="${z.id}" ${S.sparks<z.cost?"disabled":""}>לפתוח · ${z.cost} ניצוצות</button>`;
}
function tapPip(p){
  closePlot();
  const r=rt(p),now=performance.now();
  r.taps=(r.taps||[]).filter(x=>now-x<2500);r.taps.push(now);
  if(r.taps.length>=6){r.taps=[];bond(p,-4,"poke");r.state="act";r.act="hide";r.ct=1.6;r.fx=p.x+1;say(p,"!!",1.4,"snd","scared");if(sel!==p.id)select(p.id);return}
  if((p.trust??30)<-20&&Math.random()<.5&&r.state!=="sleep"){r.state="act";r.act="hide";r.ct=1.6;r.fx=p.x+1;say(p,pick(["!?","איק!"]),1.4,"snd","scared");if(sel!==p.id)select(p.id);return}
  if(peekDream(p)){if(sel!==p.id)select(p.id);return}
  if(r.said&&performance.now()<r.said.until&&r.state!=="sleep"){if(sel!==p.id)select(p.id);if(openWordGuess(p))return}
  if(shareRecall(p)){if(sel!==p.id)select(p.id);return}
  if(r.state==="argue"){calm(p);if(sel!==p.id)select(p.id);return}
  if(r.state==="choir"){SFX.happy(p.pitch*2);burst(p.x,p.y-12,"heart",1);if(sel!==p.id)select(p.id);return}
  if(r.need){
    const t=r.need.type;
    if(sel!==p.id)select(p.id);
    if(t==="pet"){pet(p);fulfill(p);return}
    if(t==="play"){playWith(p);fulfill(p);return}
    if(t==="food"){if(S.basket>0){feed(p);fulfill(p)}else{toast("הסל ריק. תקטוף משהו מהשדה");SFX.mood(p.pitch,"sad",.3)}return}
    if(t==="talk"){setTab("pip");$("chatInput").focus({preventScroll:true});SFX.chirp(p.pitch);return}
  }
  if(sel===p.id){pet(p);return}
  select(p.id);
  langSpeak(p,"keeper",.25);
  if(r.state!=="sleep")SFX.chirp(p.pitch);
  if(p.question&&tab==="pip")$("chatInput").focus({preventScroll:true});
}
function pet(p){
  const r=rt(p);
  burst(p.x,p.y-10,"heart",1);parts[parts.length-1].vx=0;parts[parts.length-1].vy=-14;
  SFX.purr(p.pitch);p.mood=Math.min(100,p.mood+5);quest("pet");
  if(r.petCd<=0){award(p,3,"pet");r.petCd=2;goal("pet");langSpeak(p,"love",.3);bond(p,2,"pet");moment("pet",p);if(stormy()&&!S.weather.calmed){S.weather.calmed=1;moment("storm",p,null,false)}}
  if(r.state==="sleep"){say(p,"זזז…",1.5,"snd","sleepy")}
  else if(r.state==="idle"){r.state="celebrate";r.ct=.6}
  refresh();
}
function feed(p){
  S.basket--;p.food=Math.min(100,p.food+30);p.mood=Math.min(100,p.mood+6);award(p,4,"pet");bond(p,3,"fed");quest("feed");goal("feed");
  const r=rt(p);if(["idle","walk","chat"].includes(r.state)){r.state="eat";r.ct=1.4}
  SFX.crunch();if(!langSpeak(p,"food",.5))say(p,pick(["נום נום","ממממ ♪","קראנץ"]),1.6,"snd","happy");
  if(sel===p.id)renderHead();refresh();dirty();
}
function select(id,go?){sel=id;if(go){const p=byId(id);if(p&&!inView(p.x,p.y,-20))lookAt(p.x,p.y)}renderHead();renderChat();renderFarm();setTab("pip")}

/* plot menu */
let openPlotIdx=-1;
function openPlot(i){
  audio();openPlotIdx=i;
  const m=$("pmenu"),g=PLOTS[i],pl=S.plots[i];
  m.hidden=false;
  const[sl,st]=scr(g.x+PW/2,g.y),[,sb]=scr(0,g.y+PH+4);m.style.left=clamp(sl,22,78)+"%";const below=st<38;m.style.top=(below?sb:st)+"%";m.style.transform=below?"translate(-50%,0)":"translate(-50%,-104%)";
  let h="";
  if(!pl.owned){const cost=PLOT_COST[i];h=`<h4>חלקה חדשה</h4><p>עוד מקום לגדל ירקות</p><button class="btn main" data-act="buy" ${S.sparks<cost?"disabled":""}>לקנות · ${cost} ניצוצות</button>`}
  else if(pl.pending)h=`<h4>פיפ בדרך</h4><p>הוא יגיע עוד רגע</p>`;
  else if(!pl.crop){
    h=`<h4>מה לשתול?</h4>`+CROPS.map((c,k)=>S.seeds[k]?`<button class="btn" data-act="plant" data-seed="${k}">${c.name}<small>${fmtT(c.grow)}</small></button>`:"").join("");
    const sp=sel&&byId(sel);if(sp)h+=`<p>${esc(sp.name)} ינסה לקחת את זה</p>`;
  }else{
    const c=CROPS[pl.crop.type],f=cropFrac(pl.crop);
    if(f>=1)h=`<h4>${c.name} בשל</h4><button class="btn main" data-act="harvest">לקטוף · ‎+${c.spark}</button>`;
    else h=`<h4>${c.name}</h4><p id="pmLeft">בשל בעוד ${fmtT(cropLeft(pl.crop))}</p>`+(pl.crop.water?`<p>הושקה, גדל מהר יותר</p>`:`<button class="btn" data-act="water">להשקות<small>‎-30%</small></button>`);
  }
  m.innerHTML=h;
}
function closePlot(){$("pmenu").hidden=true;openPlotIdx=-1}
$("pmenu").addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b||b.disabled)return;
  if(b.dataset.decor){decorAction(b.dataset.decor,b.dataset.id);closePlot();return}
  if(b.dataset.wguess){guessWord(b.dataset.w,b.dataset.wguess,b.dataset.p&&byId(b.dataset.p));closePlot();return}
  if(b.dataset.build){const k=b.dataset.build,B=BUILD[k];if((S.wood||0)>=B.cost&&!S.builds[k]){S.wood-=B.cost;S.builds[k]={p:0,done:false};SFX.coin();toast(`התחילו לבנות ${B.n}. הפיפים יבנו אותו`,1);dirty()}closePlot();refresh();return}
  if(b.dataset.craft){const i=b.dataset.craft,it=ITEMS[i];if((S.wood||0)>=it.cost&&!S.items[i]&&!S.craftQ.includes(i)){S.wood-=it.cost;S.craftQ.push(i);SFX.coin();toast(`הוזמן בבית המלאכה: ${it.n}`);dirty()}openBuilding("workshop");refresh();return}
  if(b.dataset.visit){visitGift();closePlot();return}
  if(b.dataset.thank){const d=S.drawings.find(x=>String(x.t)===b.dataset.thank);if(d){const a=byId(d.by);S.drawings.splice(S.drawings.indexOf(d),1);if(a){bond(a,4,"thanked");a.mood=Math.min(100,a.mood+12);select(a.id,true);const r=rt(a);r.state="celebrate";r.ct=1.4;burst(a.x,a.y-10,"heart",1);SFX.happy(a.pitch);toast(`${a.name} שמח שראית את הציור`)}dirty()}closePlot();return}
  if(b.dataset.zone){const z=ZONES.find(q=>q.id===b.dataset.zone);if(z&&S.sparks>=z.cost){S.sparks-=z.cost;S.zones[z.id]=true;quest("zone");SFX.level();burst(z.x+z.w/2,z.y+z.h/2,"confetti",40);toast(`נפתח: ${z.name}! הפיפים יוצאים לחקור`);lookAt(z.x+z.w/2,z.y+z.h/2);syncLocks();renderFarm();dirty()}closePlot();refresh();return}
  const i=openPlotIdx,pl=S.plots[i],a=b.dataset.act;
  if(a==="buy"){const cost=PLOT_COST[i];if(S.sparks>=cost){S.sparks-=cost;pl.owned=true;SFX.coin();burst(PLOTS[i].x+24,PLOTS[i].y+15,"spark",16);toast("חלקה חדשה בחווה");dirty()}}
  else if(a==="plant"){S.lastSeed=+b.dataset.seed;queueJob("plant",i,+b.dataset.seed)}
  else if(a==="water")queueJob("water",i);
  else if(a==="harvest")queueJob("harvest",i);
  closePlot();refresh();
});
document.addEventListener("pointerdown",(e:any)=>{if(!$("pmenu").hidden&&!e.target.closest("#pmenu")&&e.target!==cv)closePlot()});

