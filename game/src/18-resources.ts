/* wood, food, buildings */
function basketMax(){return 40+2*Math.min(S.pips.length,40)+(S.builds&&S.builds.storage&&S.builds.storage.done?60:0)+(S.items&&S.items.sack?20:0)}
let fullWarn=0;
function addFood(n){const m=basketMax();if(S.basket+n>m&&Date.now()-fullWarn>120000){fullWarn=Date.now();toast(S.builds.storage&&S.builds.storage.done?"הסל מלא":"הסל מלא. בנו מחסן כדי לאגור יותר אוכל")}S.basket=Math.min(m,S.basket+n)}
function treeUp(i){const t=S.treeCut[i];return t==null||Date.now()-t>360000}
let woodWarn=0;
function needWood(){if(Date.now()-woodWarn>300000){woodWarn=Date.now();toast("הפיפים צריכים עצים כדי לבנות. הקש על עצים כדי לכרות אותם")}}
function chop(i){
  const tr=TREES[i];if(!treeUp(i))return;
  if(S.treeCut[i]!=null)delete S.treeCut[i];
  treeHp[i]=(treeHp[i]??3)-1;treeShake[i]=.45;maybeBird(tr);S.stats.chops=(S.stats.chops||0)+1;goal("chop");
  tone(150,.07,"square",0,.6,.25);tone(90,.1,"triangle",.03,.8,.3);
  for(let k=0;k<5;k++)parts.push({x:tr.x+rand(-2,2),y:tr.y-4,vx:rand(-18,18),vy:rand(-26,-8),life:.7,kind:"c",c:"#c89c63"});
  if(treeHp[i]<=0){
    S.treeCut[i]=Date.now();delete treeHp[i];S.wood=(S.wood||0)+3;
    tone(200,.35,"sawtooth",0,.3,.12);for(let k=0;k<14;k++)parts.push({x:tr.x+rand(-tr.s,tr.s),y:tr.y-6-tr.s+rand(-tr.s,tr.s),vx:rand(-14,14),vy:rand(-10,6),life:1.1,kind:"c",c:curSeason==="autumn"?"#e0782f":"#4f9446"});
    let msg="+3 עצים";if(Math.random()<.3){addFood(1);msg+=" ונפל תפוח לסל"}
    toast(msg);quest("wood");
    S.pips.filter(p=>rt(p).state==="idle"&&Math.hypot(p.x-tr.x,p.y-tr.y)<50).slice(0,3).forEach(p=>{rt(p).state="celebrate";rt(p).ct=.8});
    dirty();refresh();
  }
}
function drawTrees(t){
  TREES.forEach((tr,i)=>{
    if(!zoneOpen(tr.z)||!inView(tr.x,tr.y,20))return;
    const up=treeUp(i),cut=S.treeCut[i];
    if(!up){const g=(Date.now()-cut)/360000;R(tr.x-2,tr.y-2,5,2,"#8a6a45");R(tr.x-1,tr.y-3,3,1,"#c89c63");if(g>.5){R(tr.x,tr.y-6,1,4,"#3f8f3a");R(tr.x-1,tr.y-6,3,1,"#6fcf5a")}return}
    const sh=treeShake[i]>0?Math.round(Math.sin(t*60)*treeShake[i]*3):0;
    const cy=tr.y-6-tr.s;
    softShadow(tr.x+1,tr.y,tr.s*.8,1.8,.22);
    treeArt(R,tr.x,cy,tr.s,treePal(curSeason==="autumn"?"autumn":curSeason==="winter"?"winter":"summer"),i*131+7,sh,tr.y);
    if(curSeason==="winter")for(let dy=-tr.s;dy<-tr.s/2;dy++){const hw=Math.round(tr.s*Math.sqrt(1-(dy/(tr.s+.5))**2));R(tr.x-hw+sh,cy+dy,hw*2,1,"#eef3fa")}
    if(curSeason==="spring"){R(tr.x-2+sh,cy-2,1,1,"#ffc7d8");R(tr.x+2+sh,cy+1,1,1,"#ffc7d8");R(tr.x+sh,cy-tr.s+2,1,1,"#ffffff")}
    if(treeHp[i]!=null&&treeHp[i]<3){R(tr.x-1,tr.y-4,1,1,"#e9d3a0")}
  });
  for(const k in treeShake)treeShake[k]=Math.max(0,treeShake[k]-.03);
}
function hitTree(x,y){return TREES.findIndex((tr,i)=>zoneOpen(tr.z)&&treeUp(i)&&Math.abs(x-tr.x)<=tr.s+1&&y>=tr.y-6-tr.s*2-1&&y<=tr.y+1)}
// wild food that pips have to find
let wildT=20;const wildClaims=new Set();
function spawnWild(dt){
  wildT-=dt;if(wildT>0)return;wildT=rand(35,60);
  const cap=6+unlockedCount()*2;if(S.wild.length>=cap||(curSeason==="winter"&&Math.random()<.5))return;
  const zs=ZONES.filter(z=>zoneOpen(z.id)&&z.id!=="cave"),z=Math.random()<.5&&zoneOpen("forest")?ZONES.find(q=>q.id==="forest"):pick(zs);
  for(let i=0;i<20;i++){const x=rand(z.x+8,z.x+z.w-8),y=rand(z.y+18,z.y+z.h-6);if(walkable(x,y)&&!PLOTS.some(g=>x>g.x-4&&x<g.x+PW+4&&y>g.y-4&&y<g.y+PH+6)){S.wild.push({id:uid(),x:Math.round(x),y:Math.round(y),k:z.id==="forest"?pick(["mushroom","berry","mushroom"]):pick(["apple","mushroom","berry"])});return}}
}
function drawWild(t){
  for(const w of S.wild){if(!inView(w.x,w.y,8))continue;
    if(w.k==="mushroom"){R(w.x-1,w.y-2,2,2,"#f3e6d0");R(w.x-2,w.y-4,4,2,"#e8433f");R(w.x-1,w.y-4,1,1,"#ffffff")}
    else if(w.k==="apple"){R(w.x-1,w.y-3,3,3,"#e8433f");R(w.x,w.y-4,1,1,"#5a3d2b");R(w.x+1,w.y-5,1,1,"#6fcf5a");R(w.x-1,w.y-3,1,1,"#ff9d9d")}
    else{R(w.x-2,w.y-2,1,1,"#7a3fb8");R(w.x,w.y-3,1,1,"#7a3fb8");R(w.x+1,w.y-1,1,1,"#9b5fd8");R(w.x-1,w.y-1,1,1,"#9b5fd8");R(w.x,w.y-4,1,1,"#4f9446")}
    if(Math.sin(t*3+w.x)>.95)R(w.x+2,w.y-5,1,1,"#ffffff")}
}
function startForage(p){
  const r=rt(p);let best=null,bd=150;
  for(const w of S.wild){if(wildClaims.has(w.id))continue;const d=Math.hypot(w.x-p.x,w.y-p.y);if(d<bd){bd=d;best=w}}
  if(!best)return false;
  wildClaims.add(best.id);r.wid=best.id;r.goal="forage";r.state="walk";setT(p,best.x+1,best.y+1);return true;
}
function pickWild(w,p){
  S.wild.splice(S.wild.indexOf(w),1);wildClaims.delete(w.id);
  addFood(1);SFX.crunch();burst(w.x,w.y-3,"spark",4);if(!p)goal("forage");
  if(p){if(p.food<40)p.food=Math.min(100,p.food+20);award(p,3,null);if(!langSpeak(p,"food",.25))say(p,pick(["נום!","♪","מצאתי!"]),1.4,"snd","happy")}
  dirty();
}
// buildings by the fields
function buildActive(){return Object.keys(BUILD).find(k=>S.builds[k]&&!S.builds[k].done)||(S.craftQ.length&&S.builds.workshop&&S.builds.workshop.done?"craft":null)}
function startConstruct(p){
  const k=buildActive();if(!k)return false;
  const b=BUILD[k==="craft"?"workshop":k],r=rt(p);
  if(S.pips.filter(q=>rt(q).site).length>=4)return false;
  r.site=k;r.goal="site";r.state="walk";setT(p,b.x+rand(-8,8),b.y+4);return true;
}
function finishConstruct(p){
  const r=rt(p),k=r.site;r.site=null;r.state="idle";r.wait=rand(1,3);
  if(k==="craft"){
    const it=S.craftQ.shift();if(!it)return;S.items[it]=true;SFX.level();burst(BUILD.workshop.x,BUILD.workshop.y-10,"spark",14);
    toast(`בית המלאכה סיים: ${ITEMS[it].n}! ${ITEMS[it].d}`,1);award(p,8,"work");dirty();return;
  }
  const b=S.builds[k];if(!b||b.done)return;
  b.p+=dom(p)==="work"?15:10;award(p,4,null);burst(p.x,p.y-4,"dust",6);
  if(b.p>=100){b.p=100;b.done=true;moment("build",null,BUILD[k].n,false);SFX.level();burst(BUILD[k].x,BUILD[k].y-10,"confetti",26);toast(`הפיפים סיימו לבנות ${BUILD[k].n}! ${BUILD[k].d}`,1);quest("build")}
  dirty();
}
function drawBuildings(t){
  for(const k in BUILD){const B=BUILD[k],st=S.builds[k],x=B.x,y=B.y;if(!inView(x,y,24))continue;
    if(!st){for(let i=-10;i<10;i+=3){R(x+i,y,2,1,"rgba(255,255,255,.3)");R(x+i,y-12,2,1,"rgba(255,255,255,.18)")}R(x-1,y-7,3,3,"rgba(255,255,255,.3)");continue}
    if(!st.done){const h=Math.round(st.p/100*12);R(x-10,y-14,1,14,"#8a6a45");R(x+9,y-14,1,14,"#8a6a45");R(x-10,y-14,20,1,"#8a6a45");R(x-9,y-h,18,h,"rgba(168,122,66,.85)");continue}
    if(k==="storage"){R(x-9,y-10,18,10,"#a87a42");for(let i=-9;i<9;i+=3)R(x+i,y-10,1,10,"#8a6a45");for(let j=0;j<5;j++)R(x-10+j,y-11-j,20-j*2,1,"#7a4a2a");R(x-2,y-6,4,6,"#4a2e1a");R(x+5,y-3,3,3,"#c89c63");R(x-8,y-3,3,3,"#c89c63")}
    else if(k==="well"){R(x-5,y-5,10,5,"#857a6c");R(x-4,y-5,8,1,"#9a8f80");R(x-3,y-4,6,2,"#3e7db1");R(x-5,y-13,1,8,"#8a6a45");R(x+4,y-13,1,8,"#8a6a45");R(x-7,y-14,14,2,"#7a4a2a");R(x,y-12,1,4,"#c8c0b0");R(x-1,y-8,3,2,"#a87a42")}
    else{R(x-10,y-11,20,11,"#c89c63");for(let j=0;j<6;j++)R(x-11+j,y-12-j,22-j*2,1,"#8a4a3a");R(x+5,y-19,3,6,"#6b6257");R(x-3,y-7,5,7,"#4a2e1a");R(x-8,y-8,4,3,"#ffd166");R(x+4,y-8,4,3,"#ffd166");
      if(S.craftQ.length&&Math.random()<.15)parts.push({x:x+6,y:y-20,vx:rand(-2,2),vy:-8,life:1.6,kind:"c",c:"rgba(220,220,220,.7)"})}
    if(S.items&&S.items.lamp){R(x+11,y-9,1,9,"#5a3d2b");R(x+10,y-11,3,2,night?"#ffd166":"#b88a3b")}
  }
}
function openBuilding(k){
  const B=BUILD[k],st=S.builds[k],m=popAt(B.x,B.y-14);
  if(!st)m.innerHTML=`<h4>${B.n}</h4><p>${B.d}</p><button class="btn main" data-build="${k}" ${(S.wood||0)<B.cost?"disabled":""}>לבנות · ${B.cost} עצים</button>${(S.wood||0)<B.cost?`<p>יש לך ${S.wood||0} עצים. כרות עוד עצים</p>`:""}`;
  else if(!st.done)m.innerHTML=`<h4>${B.n} בבנייה</h4><p>${Math.round(st.p)}% מוכן. הפיפים עובדים על זה</p>`;
  else if(k==="workshop")m.innerHTML=`<h4>בית מלאכה</h4>${S.craftQ.length?`<p>בהכנה: ${S.craftQ.map(i=>ITEMS[i].n).join(", ")}</p>`:""}`+Object.entries(ITEMS).map(([i,it])=>S.items[i]?`<p>✓ ${it.n}</p>`:S.craftQ.includes(i)?"":`<button class="btn" data-craft="${i}" ${(S.wood||0)<it.cost?"disabled":""}>${it.n} · ${it.cost} עצים<small>${it.d}</small></button>`).join("");
  else m.innerHTML=`<h4>${B.n}</h4><p>${B.d}</p><p>בנוי ופועל</p>`;
}
function hitBuilding(x,y){return Object.keys(BUILD).find(k=>Math.abs(x-BUILD[k].x)<11&&y>BUILD[k].y-16&&y<BUILD[k].y+3)}

