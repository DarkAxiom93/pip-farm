/* ================= build mode =================
   The "בנייה" button opens a toolbar over the map:
   - move: drag fields, the three buildings, the fire pit and decorations wherever you like
   - new field: tap anywhere open to add another field
   - brushes: paint a dirt path, stepping stones, flowers or sand on the ground; grass erases
   Everything is saved with the farm. Pips keep living around you while you build. */
const DEF_PLOTS=PLOTS.map(p=>Object.assign({},p)),DEF_BUILD=Object.fromEntries(Object.entries(BUILD).map(([k,B]:any)=>[k,{x:B.x,y:B.y}])),DEF_FIRE={x:FIRE.x,y:FIRE.y};
const BRUSH={path:{n:"שביל",c:["#8a6a45","#9c7a52","#7d5f3d"]},stone:{n:"אבנים",c:["#9a8f80","#857a6c","#b3a998"]},flowers:{n:"פרחים",c:["#ffd166","#ff9db5","#ffffff","#c9a2ff"]},sand:{n:"חול",c:["#d9c08a","#e6cf9a","#c9ad74"]}};
const CELL=4;
let buildMode=false,buildTool="move",bDrag=null;
function newPlotCost(){return 40+20*Math.max(0,PLOTS.length-9)}
// layout: positions that differ from the start, kept in the save
function applyLayout(L){
  PLOTS.length=0;DEF_PLOTS.forEach(p=>PLOTS.push(Object.assign({},p)));
  for(const k in DEF_BUILD){BUILD[k].x=DEF_BUILD[k].x;BUILD[k].y=DEF_BUILD[k].y}
  FIRE.x=DEF_FIRE.x;FIRE.y=DEF_FIRE.y;
  if(!L)return;
  (L.plots||[]).forEach((p,i)=>{if(!p)return;if(i<PLOTS.length)Object.assign(PLOTS[i],{x:p.x,y:p.y,z:p.z||undefined});else PLOTS.push({x:p.x,y:p.y,z:p.z||undefined})});
  for(const k in L.build||{})if(BUILD[k])Object.assign(BUILD[k],L.build[k]);
  if(L.fire)Object.assign(FIRE,L.fire);
}
function saveLayout(){S.layout={plots:PLOTS.map(p=>({x:p.x,y:p.y,z:p.z||undefined})),build:Object.fromEntries(Object.entries(BUILD).map(([k,B]:any)=>[k,{x:B.x,y:B.y}])),fire:{x:FIRE.x,y:FIRE.y}};dirty()}

// ---------- painting ----------
const paintCv=document.createElement("canvas");paintCv.width=WW*2;paintCv.height=WH*2;let paintDirty=true;
function redrawPaint(){
  const g=paintCv.getContext("2d");g.clearRect(0,0,WW*2,WH*2);
  for(const key in S.paint||{}){const[cx,cy]=key.split(",").map(Number),b=BRUSH[S.paint[key]];if(!b)continue;
    const x=cx*CELL*2,y=cy*CELL*2;let h=cx*73856093^cy*19349663;const rnd=()=>{h=(h*1103515245+12345)&0x7fffffff;return h/0x7fffffff};
    if(S.paint[key]==="flowers"){for(let i=0;i<4;i++){g.fillStyle=pick(b.c);const fx=x+Math.floor(rnd()*7),fy=y+Math.floor(rnd()*7);g.fillRect(fx,fy,1,1);g.fillStyle="#2f5a29";g.fillRect(fx,fy+1,1,1)}continue}
    if(S.paint[key]==="stone"){g.fillStyle="rgba(0,0,0,.18)";g.fillRect(x+1,y+2,6,5);g.fillStyle=b.c[0];g.fillRect(x+1,y+1,6,5);g.fillStyle=b.c[2];g.fillRect(x+2,y+1,3,1);g.fillStyle=b.c[1];g.fillRect(x+1,y+5,6,1);continue}
    // path and sand: soft-edged ground that blends with its neighbours
    for(let yy=0;yy<8;yy++)for(let xx=0;xx<8;xx++){
      const nx=xx<2?-1:xx>5?1:0,ny=yy<2?-1:yy>5?1:0,same=(dx,dy)=>S.paint[(cx+dx)+","+(cy+dy)]===S.paint[key];
      if((nx||ny)&&!(same(nx,0)&&same(0,ny)&&same(nx,ny))&&rnd()<.45)continue;
      g.fillStyle=b.c[Math.floor(rnd()*3)];g.fillRect(x+xx,y+yy,1,1)}
  }
  paintDirty=false;
}
// the brush is round, about 3 cells wide
function paintAt(x,y){for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(dx*dx+dy*dy<=1||buildTool!=="flowers")paintCell(x+dx*CELL,y+dy*CELL)}
function paintCell(x,y){
  const cx=Math.floor(x/CELL),cy=Math.floor(y/CELL),key=cx+","+cy;S.paint=S.paint||{};
  if(!walkable(x,y)&&buildTool!=="grass")return;
  if(buildTool==="grass"){if(S.paint[key]){delete S.paint[key];paintDirty=true}return}
  if(S.paint[key]!==buildTool){if(!S.paint[key]&&Object.keys(S.paint).length>=4000){toast("הגעת למקסימום של ציור על האדמה");return}S.paint[key]=buildTool;paintDirty=true}
}
function drawPaint(){if(paintDirty)redrawPaint();ctx.drawImage(paintCv,0,0,WW,WH)}

// ---------- moving things ----------
function grabAt(x,y){
  for(let i=PLOTS.length-1;i>=0;i--){const g=PLOTS[i];if(g.z&&!zoneOpen(g.z))continue;if(x>=g.x-2&&x<=g.x+PW+2&&y>=g.y-2&&y<=g.y+PH+4)return{k:"plot",i,ox:x-g.x,oy:y-g.y}}
  {const bk=hitBuilding(x,y);if(bk)return{k:"build",id:bk,ox:x-BUILD[bk].x,oy:y-BUILD[bk].y}}
  if(Math.hypot(x-FIRE.x,y-(FIRE.y-3))<=9)return{k:"fire",ox:x-FIRE.x,oy:y-FIRE.y};
  {const d=decorAt(x,y);if(d)return{k:"decor",id:d.id,ox:x-d.x,oy:y-d.y}}
  return null;
}
function boxOf(o){
  if(o.k==="plot"){const g=PLOTS[o.i];return{x:g.x,y:g.y,w:PW,h:PH}}
  if(o.k==="build"){const B=BUILD[o.id];return{x:B.x-11,y:B.y-16,w:22,h:18}}
  if(o.k==="fire")return{x:FIRE.x-8,y:FIRE.y-8,w:16,h:11};
  if(o.k==="decor"){const d=S.decor.find(q=>q.id===o.id);return d?{x:d.x-7,y:d.y-14,w:14,h:16}:null}
  if(o.k==="newplot")return{x:o.x,y:o.y,w:PW,h:PH};
}
function overlaps(a,b,m){return a.x<b.x+b.w+m&&a.x+a.w+m>b.x&&a.y<b.y+b.h+m&&a.y+a.h+m>b.y}
function placeOk(o,box){
  // inside an open part of the map, on walkable ground, clear of other things
  for(const[px,py] of[[box.x,box.y],[box.x+box.w,box.y],[box.x,box.y+box.h],[box.x+box.w,box.y+box.h],[box.x+box.w/2,box.y+box.h/2]])if(!walkable(px,py))return false;
  const others=[];
  PLOTS.forEach((g,i)=>{if(!(o.k==="plot"&&o.i===i)&&!(g.z&&!zoneOpen(g.z)))others.push({x:g.x,y:g.y,w:PW,h:PH})});
  for(const k in BUILD)if(!(o.k==="build"&&o.id===k))others.push({x:BUILD[k].x-11,y:BUILD[k].y-16,w:22,h:18});
  if(o.k!=="fire")others.push({x:FIRE.x-8,y:FIRE.y-8,w:16,h:11});
  others.push({x:BURROW.x-24,y:BURROW.y-16,w:48,h:20});
  if(o.k==="plot"||o.k==="newplot"||o.k==="build")for(const d of S.decor||[])others.push({x:d.x-6,y:d.y-12,w:12,h:13});
  return !others.some(b=>overlaps(box,b,2));
}
function moveTo(o,x,y){
  x=Math.round(x/2)*2;y=Math.round(y/2)*2;
  if(o.k==="plot"){const g=PLOTS[o.i];g.x=x;g.y=y}
  else if(o.k==="build"){BUILD[o.id].x=x;BUILD[o.id].y=y}
  else if(o.k==="fire"){FIRE.x=x;FIRE.y=y}
  else if(o.k==="decor"){const d=S.decor.find(q=>q.id===o.id);if(d){d.x=x;d.y=y}}
  else if(o.k==="newplot"){o.x=x;o.y=y}
}
function posOf(o){
  if(o.k==="plot")return{x:PLOTS[o.i].x,y:PLOTS[o.i].y};
  if(o.k==="build")return{x:BUILD[o.id].x,y:BUILD[o.id].y};
  if(o.k==="fire")return{x:FIRE.x,y:FIRE.y};
  if(o.k==="decor"){const d=S.decor.find(q=>q.id===o.id);return{x:d.x,y:d.y}}
  return{x:o.x,y:o.y};
}

// ---------- the toolbar ----------
function toggleBuild(on?){
  buildMode=on??!buildMode;bDrag=null;
  $("buildBar").hidden=!buildMode;$("hBuild").classList.toggle("on",buildMode);
  if(buildMode){cancelPlacing();closePlot();endStarMode(false);renderBuildBar();toast("מצב בנייה: גרור דברים כדי להזיז אותם, או בחר מברשת",1)}
  else{saveLayout();toast("החווה נשמרה")}
}
function renderBuildBar(){
  const tools:[string,string][]=[["move","✋ הזזה"],["plot",`🟫 שדה חדש · ${newPlotCost()}`],["path","שביל"],["stone","אבנים"],["flowers","פרחים"],["sand","חול"],["grass","🌱 מחיקה"]];
  $("buildBar").innerHTML=tools.map(([k,n])=>`<button type="button" class="chip${buildTool===k?" on":""}" data-tool="${k}">${n}</button>`).join("")+`<button type="button" class="chip done" data-tool="done">✓ סיום</button>`;
}
// pointer handlers called from the canvas listeners; they return true when build mode used the event
function buildDown(e){
  if(!buildMode)return false;
  const[x,y]=toWorld(e);
  if(buildTool==="move"){const o=grabAt(x,y);if(!o)return false;const p=posOf(o);bDrag={o,from:p,ok:true};tone(520,.06,"triangle",0,1.2,.15);return true}
  if(buildTool==="plot"){
    const cost=newPlotCost();if(S.sparks<cost){toast(`שדה חדש עולה ${cost} ניצוצות`);return true}
    bDrag={o:{k:"newplot",x:Math.round((x-PW/2)/2)*2,y:Math.round((y-PH/2)/2)*2},from:null,ok:true};return true}
  // brushes: paint while dragging
  bDrag={paint:true};paintAt(x,y);return true;
}
function buildMove(e){
  if(!buildMode||!bDrag)return false;
  const[x,y]=toWorld(e);
  if(bDrag.paint){paintAt(x,y);return true}
  const o=bDrag.o;moveTo(o,x-(o.ox??PW/2),y-(o.oy??PH/2));bDrag.ok=placeOk(o,boxOf(o));return true;
}
function buildUp(e){
  if(!buildMode||!bDrag)return false;
  const d=bDrag;bDrag=null;
  if(d.paint){dirty();return true}
  const o=d.o;
  if(o.k==="newplot"){
    if(!placeOk(o,boxOf(o))){toast("אי אפשר לשים שדה כאן");return true}
    const cost=newPlotCost();if(S.sparks<cost)return true;S.sparks-=cost;
    const z=zoneAt(o.x+PW/2,o.y+PH/2);PLOTS.push({x:o.x,y:o.y,z:z&&z.id!=="farm"?z.id:undefined});S.plots.push({owned:true,crop:null});
    SFX.coin();burst(o.x+PW/2,o.y+PH/2,"dust",14);toast("שדה חדש בחווה");S.stats.plotsBuilt=(S.stats.plotsBuilt||0)+1;
    saveLayout();renderBuildBar();renderHead();return true;
  }
  if(!d.ok||!placeOk(o,boxOf(o))){moveTo(o,d.from.x,d.from.y);toast("אי אפשר לשים כאן. זה חזר למקום");tone(200,.08,"square",0,.8,.15);return true}
  if(o.k==="plot"){const g=PLOTS[o.i],z=zoneAt(g.x+PW/2,g.y+PH/2);g.z=z&&z.id!=="farm"?z.id:undefined}
  SFX.plop();saveLayout();return true;
}
function drawBuildOverlay(t){
  if(!buildMode)return;
  // a light grid in view
  CX.fillStyle="rgba(255,255,255,.06)";
  const x0=Math.floor(cam.x/8)*8,y0=Math.floor(cam.y/8)*8;
  for(let x=x0;x<cam.x+CW/cam.z;x+=8)CX.fillRect(x,cam.y,.5,CH/cam.z);
  for(let y=y0;y<cam.y+CH/cam.z;y+=8)CX.fillRect(cam.x,y,CW/cam.z,.5);
  // outline what can be moved
  const mark=(b,c)=>{CX.strokeStyle=c;CX.lineWidth=.5;CX.strokeRect(b.x-1,b.y-1,b.w+2,b.h+2)};
  if(buildTool==="move"){
    PLOTS.forEach((g,i)=>{if(!(g.z&&!zoneOpen(g.z)))mark({x:g.x,y:g.y,w:PW,h:PH},"rgba(255,247,214,.35)")});
    for(const k in BUILD)mark(boxOf({k:"build",id:k}),"rgba(255,247,214,.35)");
    mark(boxOf({k:"fire"}),"rgba(255,247,214,.35)");
  }
  if(bDrag&&bDrag.o){const b=boxOf(bDrag.o);if(b){CX.fillStyle=bDrag.ok?"rgba(134,212,127,.22)":"rgba(255,93,115,.3)";CX.fillRect(b.x,b.y,b.w,b.h);mark(b,bDrag.ok?"#86d47f":"#ff5d73")}
    if(bDrag.o.k==="newplot"){const g=bDrag.o;R(g.x,g.y,PW,PH,"rgba(107,74,50,.6)")}}
  // brush preview under the mouse
  if(buildTool!=="move"&&buildTool!=="plot"&&mouseW){const cx=Math.floor(mouseW[0]/CELL)*CELL,cy=Math.floor(mouseW[1]/CELL)*CELL;CX.strokeStyle="rgba(255,247,214,.8)";CX.lineWidth=.5;CX.strokeRect(cx,cy,CELL,CELL)}
}
