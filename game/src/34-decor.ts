/* ================= decorating the farm =================
   Buy decorations with sparks and wood in the farm tab and place them where you like.
   Tap a placed one to move it or put it back in storage. The pips use them: they sit on benches,
   swing on swings, sniff flower beds and watch birds at the bird bath. Lamps light the night. */
const DECOR={
  bench:{n:"ספסל",s:15,w:6,d:"פיפים יושבים לנוח"},
  swing:{n:"נדנדה",s:25,w:8,d:"פיפים מתנדנדים"},
  flowers:{n:"ערוגת פרחים",s:10,w:2,d:"מריחים ושמחים"},
  lamp:{n:"פנס רחוב",s:20,w:4,d:"אור בלילה"},
  birdbath:{n:"אמבטיית ציפורים",s:20,w:3,d:"ציפורים באות לבקר"},
  scarecrow:{n:"דחליל",s:15,w:5,d:"שומר על השדה. הפיפים מנופפים לו"},
  sign:{n:"שלט",s:8,w:3,d:"שלט עם שם החווה"},
  fence:{n:"קטע גדר",s:3,w:2,d:"לסמן שבילים ופינות"}
};
let placing=null; // {k, move?: id}
function decorOk(x,y){
  if(!walkable(x,y))return false;
  if(PLOTS.some(g=>(!g.z||zoneOpen(g.z))&&x>g.x-6&&x<g.x+PW+6&&y>g.y-6&&y<g.y+PH+8))return false;
  if(Object.values(BUILD).some(B=>Math.abs(x-B.x)<14&&y<B.y+10&&y>B.y-20))return false;
  if(Math.hypot(x-BURROW.x,y-BURROW.y)<22||Math.hypot(x-FIRE.x,y-FIRE.y)<16)return false;
  return !(S.decor||[]).some(d=>d.id!==(placing&&placing.move)&&Math.hypot(d.x-x,d.y-y)<9);
}
function startPlacing(k){
  const D=DECOR[k],inv=(S.decorInv||{})[k]||0;
  if(!inv&&(S.sparks<D.s||(S.wood||0)<D.w)){toast(`צריך ${D.s} ניצוצות ו-${D.w} עצים`);return}
  placing={k};endStarMode(false);toast(`הקש במפה במקום שבו לשים ${D.n}`,1);renderDecorShop();
}
function cancelPlacing(){if(!placing)return;placing=null;renderDecorShop()}
function placeDecorAt(x,y){
  const k=placing.k,D=DECOR[k];x=Math.round(x);y=Math.round(y);
  if(!decorOk(x,y)){toast("אי אפשר לשים כאן");tone(200,.08,"square",0,.8,.15);return}
  S.decor=S.decor||[];S.decorInv=S.decorInv||{};
  if(placing.move){const d=S.decor.find(q=>q.id===placing.move);if(d){d.x=x;d.y=y}}
  else{
    if(S.decorInv[k]>0)S.decorInv[k]--;
    else{if(S.sparks<D.s||(S.wood||0)<D.w){toast("נגמרו הניצוצות או העצים");placing=null;renderDecorShop();return}S.sparks-=D.s;S.wood-=D.w}
    S.decor.push({id:uid(),k,x,y});S.stats.decorPlaced=(S.stats.decorPlaced||0)+1;
  }
  SFX.plop();burst(x,y-4,"dust",8);placing=null;renderDecorShop();renderHead();
  if(S.decor.length===1)moment("decor",null,D.n);
  dirty();
}
function decorAt(x,y){return (S.decor||[]).find(d=>Math.abs(d.x-x)<7&&y>d.y-14&&y<d.y+3)}
function openDecor(d){
  const m=popAt(d.x,d.y-14),D=DECOR[d.k];
  m.innerHTML=`<h4>${D.n}</h4><p>${D.d}</p><button class="btn" data-decor="move" data-id="${d.id}">להזיז</button><button class="btn" data-decor="store" data-id="${d.id}">להחזיר למחסן</button>`;
}
function decorAction(a,id){
  const d=(S.decor||[]).find(q=>q.id===id);if(!d)return;
  if(a==="move"){placing={k:d.k,move:d.id};toast("הקש במקום החדש",1)}
  else if(a==="store"){S.decor.splice(S.decor.indexOf(d),1);S.decorInv=S.decorInv||{};S.decorInv[d.k]=(S.decorInv[d.k]||0)+1;toast(`${DECOR[d.k].n} חזר למחסן. אפשר לשים אותו שוב בחינם`);dirty()}
  renderDecorShop();
}
function renderDecorShop(){
  const el=$("decorBox");if(!el)return;S.decorInv=S.decorInv||{};
  el.innerHTML=(placing?`<div class="row" style="margin-bottom:6px"><p class="label" style="flex:1;margin:0">ממקמים: ${DECOR[placing.k].n}. הקש במפה</p><button class="btn" type="button" data-decor-cancel="1">ביטול</button></div>`:"")+
    `<div class="shop">`+Object.entries(DECOR).map(([k,D])=>{const inv=S.decorInv[k]||0,ok=inv||S.sparks>=D.s&&(S.wood||0)>=D.w;
      return`<button class="btn" type="button" data-decor-buy="${k}" ${ok?"":"disabled"}><b>${D.n}</b><span>${inv?`במחסן: ${inv} (בחינם)`:`${D.s} ניצוצות · ${D.w} עצים`}</span></button>`}).join("")+`</div>`;
}
// the pips use the decorations
function decorWander(p,r){
  const list=(S.decor||[]).filter(d=>!["fence","sign"].includes(d.k)&&Math.hypot(d.x-p.x,d.y-p.y)<140&&!S.pips.some(q=>q!==p&&rt(q).decor===d.id));
  const d=pick(list);if(!d)return false;
  r.goal="decor";r.decor=d.id;r.state="walk";setT(p,d.x+(d.k==="bench"?rand(-3,3):0),d.y+(d.k==="swing"?1:3));return true;
}
function useDecor(p){
  const r=rt(p),d=(S.decor||[]).find(q=>q.id===r.decor);r.goal=null;
  if(!d){r.state="idle";r.wait=1;r.decor=null;return}
  r.state="act";p.mood=Math.min(100,p.mood+4);
  if(d.k==="bench"){r.act="sit";r.ct=rand(6,12);if(Math.random()<.4)say(p,pick(["♪","אהה","…"]),2,"snd","content")}
  else if(d.k==="swing"){r.act="swing";r.ct=rand(5,8);r.fx=d.x}
  else if(d.k==="flowers"){r.act="nuzzle";r.ct=2.5}
  else if(d.k==="birdbath"){r.act="spin";r.ct=1.5;if(!bird){bird={sp:Math.random()<.3?"robin":"sparrow",x:d.x,y:d.y-6,t:0,d:Math.random()<.5?-1:1};if(Math.random()<.15)collect(spById(bird.sp),d.x,d.y-6)}}
  else if(d.k==="scarecrow"){r.act="hop";r.ct=1.2;say(p,"👋",1.5,"snd","excited")}
  else{r.act="spin";r.ct=1.5}
}
function drawDecor(t){
  for(const d of S.decor||[]){if(!inView(d.x,d.y,16))continue;drawDecorItem(d.k,d.x,d.y,t,1)}
  if(placing&&mouseW){const[x,y]=[Math.round(mouseW[0]),Math.round(mouseW[1])];CX.globalAlpha=.55;drawDecorItem(placing.k,x,y,t,1);CX.globalAlpha=1;
    if(!decorOk(x,y)){R(x-5,y-1,10,1,"#ff5d73")}}
}
function drawDecorItem(k,x,y,t,a){
  switch(k){
    case"bench":R(x-6,y-4,12,2,"#a87a42");R(x-6,y-7,12,1,"#8a6a45");R(x-5,y-2,1,2,"#5a3d2b");R(x+4,y-2,1,2,"#5a3d2b");R(x-6,y-6,1,2,"#5a3d2b");R(x+5,y-6,1,2,"#5a3d2b");break;
    case"swing":R(x-6,y-14,1,14,"#5a3d2b");R(x+5,y-14,1,14,"#5a3d2b");R(x-6,y-15,12,1,"#5a3d2b");R(x-3,y-14,1,9,"#d9c9a8");R(x+2,y-14,1,9,"#d9c9a8");R(x-3,y-5,6,1,"#a87a42");break;
    case"flowers":R(x-6,y-2,12,2,"#6a4a2a");for(let i=0;i<5;i++){const fx=x-5+i*2.4;R(fx,y-5,1,3,"#3f8f3a");R(fx-1,y-6,2,1,["#ff9db5","#ffd166","#ffffff","#c9a2ff","#ff7a9a"][i])}break;
    case"lamp":R(x,y-16,1,16,"#3a3a44");R(x-2,y-19,5,3,"#3a3a44");R(x-1,y-18,3,2,night?"#fff3b0":"#c9b98a");break;
    case"birdbath":R(x-1,y-6,2,6,"#9a8f80");R(x-5,y-8,10,2,"#9a8f80");R(x-4,y-8,8,1,"#8cc4ea");R(x-3,y-1,6,1,"#857a6c");break;
    case"scarecrow":R(x,y-16,1,16,"#5a3d2b");R(x-6,y-12,13,1,"#5a3d2b");R(x-2,y-11,5,6,"#c9772f");R(x-2,y-16,5,4,"#e8d5b0");R(x-3,y-17,7,1,"#d9a83a");R(x-1,y-15,1,1,"#2a1830");R(x+1,y-15,1,1,"#2a1830");break;
    case"sign":R(x,y-10,1,10,"#5a3d2b");R(x-6,y-14,13,6,"#a87a42");R(x-5,y-12,11,1,"#5a3d2b");R(x-4,y-10,8,1,"#5a3d2b");break;
    case"fence":R(x-6,y-6,1,6,"#8a6a45");R(x+5,y-6,1,6,"#8a6a45");R(x-1,y-6,1,6,"#8a6a45");R(x-6,y-5,12,1,"#a87a42");R(x-6,y-3,12,1,"#a87a42");break;
  }
}
function drawDecorGlow(t){
  for(const d of S.decor||[]){if(d.k!=="lamp"||!inView(d.x,d.y,30))continue;const g=ctx.createRadialGradient(d.x,d.y-18,1,d.x,d.y-18,34);g.addColorStop(0,"rgba(255,240,180,.34)");g.addColorStop(1,"rgba(255,240,180,0)");ctx.fillStyle=g;ctx.fillRect(d.x-34,d.y-52,68,68)}
}
