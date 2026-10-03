/* ================= the night comes alive =================
   While the pips sleep there is still something to do:
   - dreams: now and then a sleeping pip dreams; a small drawing floats over it. Tap it to peek
     into the dream. Dreams replay shared moments, can reveal what a pip word means, and from
     chapter 2 they dream about the screen
   - fireflies: tap them to catch them. Ten in the jar light a lantern on the farm, for good
   - stars: the "כוכבים" button lets you join stars into your own constellation. Pips that became
     stars can be part of it. Constellations stay in the sky, also after New Game+ */
const LANTERN_SPOTS=[{x:58,y:66},{x:76,y:84},{x:258,y:140},{x:150,y:150},{x:30,y:118},{x:248,y:40},{x:300,y:176},{x:470,y:150},{x:120,y:182},{x:420,y:190}];
let starMode=false,starSel=null,starCur=[],dreamT=8;
const SKY=(()=>{const r=mulberry(404),L=[];for(let i=0;i<30;i++)L.push({fx:.03+r()*.94,fy:.03+r()*.3,b:.4+r()*.5});return L})();

// ---------- fireflies and lanterns ----------
function catchFlyAt(x,y){
  if(!night)return false;
  let f=null,bd=7;for(const q of flies){const d=Math.hypot(q.x-x,q.y-y);if(d<bd){bd=d;f=q}}
  if(!f)return false;
  burst(f.x,f.y,"spark",6);tone(1400,.08,"sine",0,1.5,.25);tone(1900,.1,"sine",.06,1.2,.18);
  f.x=rand(0,WW);f.y=rand(10,WH); // it flies off and another one shows up somewhere else
  S.jar=(S.jar||0)+1;S.stats.flies=(S.stats.flies||0)+1;goal("flies");
  if(S.jar>=10){S.jar=0;lightLantern()}else toast(`גחלילית בצנצנת: ${S.jar}/10`);
  dirty();return true;
}
function lightLantern(){
  S.lanterns=S.lanterns||0;
  if(S.lanterns>=LANTERN_SPOTS.length){S.sparks+=10;toast("כל הפנסים כבר דולקים. הגחליליות שוחררו ‎+10 ניצוצות",1);return}
  const L=LANTERN_SPOTS[S.lanterns];S.lanterns++;S.sparks+=15;
  SFX.level();burst(L.x,L.y-10,"confetti",20);
  toast(`הצנצנת מלאה! פנס חדש דולק בחווה (${S.lanterns}/${LANTERN_SPOTS.length}) ‎+15 ניצוצות`,1);
  if(S.lanterns===1)moment("lantern",null);
  lookAt(L.x,L.y);
}
function drawLanterns(t){
  for(let i=0;i<(S.lanterns||0)&&i<LANTERN_SPOTS.length;i++){const L=LANTERN_SPOTS[i];if(!zoneOpen(zoneAt(L.x,L.y)?.id||"farm")||!inView(L.x,L.y,20))continue;
    R(L.x,L.y-12,1,12,"#5a3d2b");R(L.x-2,L.y-16,5,4,"#3a2a1e");R(L.x-1,L.y-15,3,2,night?(Math.sin(t*7+i)>.92?"#fff3b0":"#ffd166"):"#b88a3b");R(L.x-2,L.y-17,5,1,"#5a3d2b")}
}
function drawLanternGlow(t){
  for(let i=0;i<(S.lanterns||0)&&i<LANTERN_SPOTS.length;i++){const L=LANTERN_SPOTS[i];if(!inView(L.x,L.y,30))continue;
    const a=.32+.04*Math.sin(t*3+i),g=ctx.createRadialGradient(L.x,L.y-14,1,L.x,L.y-14,30);g.addColorStop(0,`rgba(255,209,102,${a})`);g.addColorStop(1,"rgba(255,209,102,0)");ctx.fillStyle=g;ctx.fillRect(L.x-30,L.y-44,60,60)}
}

// ---------- dreams ----------
function dreamTick(dt){
  if(!night)return;dreamT-=dt;if(dreamT>0)return;dreamT=rand(12,25);
  const ps=S.pips.filter(p=>{const r=rt(p);return r.state==="sleep"&&!r.dream&&inView(p.x,p.y,-10)});
  const p=pick(ps);if(!p)return;
  const ms=momentsOf(p),st=S.story;
  let icon=ms.length&&Math.random()<.5?MOMENTS[pick(ms).k].i:pick(["sun","heart","rain","question"]);
  if(st&&st.ch>=2&&!st.ending&&Math.random()<.3)icon=pick(["screen","keeper"]);
  rt(p).dream={icon,until:performance.now()+11000};
  say(p," ",11,"memo dream","sleepy");
  const b=bubbleEls.get(p.id);if(b){b.textContent="";b.appendChild(doodleCanvas(icon,2))}
}
function dreamCount(){const today=dayKey(Date.now());if(!S.dreams||S.dreams.day!==today)S.dreams={day:today,n:0,word:false};return S.dreams}
function peekDream(p){
  const r=rt(p);if(!r.dream||performance.now()>r.dream.until)return false;
  const icon=r.dream.icon;r.dream=null;clearBubble(p.id);
  const dc=dreamCount(),lines=[];let reward=dc.n<6;
  dc.n++;S.stats.dreams=(S.stats.dreams||0)+1;goal("dream");
  // a word the keeper has not understood yet, shown next to what it means
  const unknown=Object.entries(p.lang||{}).filter(([c,w]:any)=>S.lex[w]&&!S.lex[w].ok&&CONCEPTS[c]);
  if(unknown.length&&!dc.word){
    const [c,w]:any=pick(unknown);dc.word=true;S.lex[w].ok=true;S.stats.decoded++;goal("decode");renderLangCount();
    lines.push(`~בחלום, ${p.name} אומר "${w}" ומצביע על ${CONCEPTS[c]}.`,`> פענחת בחלום: "${w}" זה ${CONCEPTS[c]}`);
  }else if(icon==="screen"||icon==="keeper"){
    lines.push(`~${p.name} חולם על מלבן מואר באמצע השמיים.`,"~מישהו מסתכל מתוכו. הוא לא מפחד.","> dream.log: 'הפנים מאחורי הזכוכית חייכו'");
  }else{
    const m=pick(momentsOf(p).filter(m=>MOMENTS[m.k].i===icon));
    if(m)lines.push(`~${p.name} חולם על ${momentText(m).replace(/^היום שבו /,"היום ש")}.`,"~בחלום הכל קצת יותר גדול, ואתה שם.");
    else lines.push(`~${p.name} חולם ש${pick(["הוא עף מעל החווה","כל השדה מלא בתותים","הוא גדול כמו עץ","הגשם עשוי מסוכריות","הוא מדבר את השפה שלך"])}.`,"~הוא מחייך מתוך שינה.");
  }
  if(reward){S.sparks+=2;bond(p,2,"dream")}
  card({title:`החלום של ${p.name}`,lines});
  burst(p.x,p.y-12,"spark",6);tone(880,.3,"sine",0,1.5,.2);dirty();
  return true;
}

// ---------- constellations ----------
function skyStars(){
  const L=SKY.map((s,i)=>({key:"b"+i,fx:s.fx,fy:s.fy,b:s.b,mem:null}));
  for(const st of S.stars){const{fx,fy}=starPos(st);L.push({key:"s:"+st.id,fx,fy,b:1,mem:st})}
  return L;
}
function toggleStarMode(){
  if(!night&&!starMode){toast("הכוכבים יוצאים רק בלילה");return}
  if(!starMode){starMode=true;starSel=null;starCur=[];$("hStars").classList.add("on");toast("לחץ על כוכב ואז על עוד כוכב כדי לחבר אותם. כשסיימת, לחץ שוב על ✦ כוכבים",1);return}
  endStarMode(true);
}
function endStarMode(save){
  starMode=false;starSel=null;$("hStars").classList.remove("on");
  if(save&&starCur.length>=2){
    S.constellations=S.constellations||[];const who=pick(S.pips);
    S.constellations.push({lines:starCur,name:`הקבוצה של ${who?who.name:"פיפי"}`,t:Date.now()});if(S.constellations.length>12)S.constellations.shift();
    S.sparks+=10;SFX.level();toast(`קבוצת כוכבים חדשה: "${S.constellations[S.constellations.length-1].name}" ‎+10 ניצוצות`,1);
    if(S.constellations.length===1)moment("stars",null);dirty();
  }else if(save&&starCur.length)toast("קבוצת כוכבים צריכה לפחות שני קווים");
  starCur=[];
}
function starTap(e){
  const b=cv.getBoundingClientRect(),sx=(e.clientX-b.left)/b.width*CW,sy=(e.clientY-b.top)/b.height*CH;
  let hit=null,bd=11;for(const s of skyStars()){const d=Math.hypot(s.fx*CW-sx,s.fy*CH-sy);if(d<bd){bd=d;hit=s}}
  if(!hit){return}
  if(starSel&&starSel!==hit.key&&!starCur.some(l=>l[0]===starSel&&l[1]===hit.key||l[1]===starSel&&l[0]===hit.key)){
    if(starCur.length<12){starCur.push([starSel,hit.key]);tone(700+starCur.length*60,.12,"sine",0,1.2,.25)}
  }else tone(1100,.06,"sine",0,1,.2);
  starSel=hit.key;
}
function drawSky(t){
  if(!night)return;
  const all=skyStars(),pos={};for(const s of all)pos[s.key]=s;
  ctx.save();ctx.setTransform(1,0,0,1,0,0);
  // the pips' constellations
  const line=(l,col)=>{const a=pos[l[0]],b=pos[l[1]];if(!a||!b)return;ctx.beginPath();ctx.moveTo(a.fx*CW+1,a.fy*CH+1);ctx.lineTo(b.fx*CW+1,b.fy*CH+1);ctx.strokeStyle=col;ctx.lineWidth=1;ctx.stroke()};
  for(const c of S.constellations||[])c.lines.forEach(l=>line(l,"rgba(200,220,255,.28)"));
  starCur.forEach(l=>line(l,"rgba(255,240,170,.8)"));
  for(const s of SKY){const x=Math.round(s.fx*CW),y=Math.round(s.fy*CH),tw=s.b*(.6+.4*Math.sin(t*1.3+s.fx*50));ctx.fillStyle=`rgba(230,235,255,${tw})`;const sz=starMode||s.b>.75?2:1;ctx.fillRect(x,y,sz,sz)}
  if(starMode){
    const sel=starSel&&pos[starSel];if(sel){ctx.strokeStyle="rgba(255,240,170,.9)";ctx.strokeRect(Math.round(sel.fx*CW)-3,Math.round(sel.fy*CH)-3,8,8)}
    ctx.fillStyle="rgba(0,0,0,.5)";ctx.fillRect(CW/2-80,CH-26,160,16);(ctx as any).direction="rtl";ctx.font="bold 11px Fredoka,sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle="#fff7d6";
    ctx.fillText(`מחברים כוכבים · ${starCur.length} קווים`,CW/2,CH-18);
  }
  ctx.restore();
}
function nightTick(dt){
  dreamTick(dt);
  // the top bar shows hide and seek by day and the stars by night
  const hs=$("hStars"),hh=$("hHide");if(hs.hidden!==(!night&&!starMode))hs.hidden=!night&&!starMode;if(hh.hidden!==(night&&!hide))hh.hidden=night&&!hide;
  if(starMode&&!night)endStarMode(true);
}
