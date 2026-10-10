/* seasons */
const SEASON_NAME={spring:"אביב",summer:"קיץ",autumn:"סתיו",winter:"חורף"};
let curSeason="autumn";
function calcSeason(){if(S.fastSeasons)return["spring","summer","autumn","winter"][Math.floor((Date.now()-S.born)/86400000)%4];const m=new Date().getMonth();return m===11||m<=1?"winter":m<=4?"spring":m<=7?"summer":"autumn"}
function weatherLabel(){const w=S.weather.k==="rain"&&curSeason==="winter"?"שלג":S.weather.k==="storm"&&curSeason==="winter"?"סופת שלג":WNAME[S.weather.k];return SEASON_NAME[curSeason]+" · "+w}
const SEASON_MSG={spring:"אביב הגיע: הפיפים מתפצלים מהר יותר",summer:"קיץ: הביטים גדלים מהר",autumn:"סתיו: כל קטיף נותן ביט נוסף",winter:"חורף: הביטים גדלים לאט, אבל יורד שלג"};
let seasonT=0;
const sparts=Array.from({length:46},()=>({x:Math.random()*512,y:Math.random()*336,v:Math.random(),c:0}));
const flies2=Array.from({length:7},()=>({x:Math.random()*256,y:20+Math.random()*140,a:Math.random()*9,h:Math.floor(Math.random()*4)}));
let snowLayer=null,springLayer=null;
function buildLayers(){
  snowLayer=document.createElement("canvas");snowLayer.width=WW;snowLayer.height=WH;const g=snowLayer.getContext("2d"),r=mulberry(23);
  for(let i=0;i<1600;i++){const x=r()*WW,y=r()*WH;if(Math.abs(x-riverX(y))<16)continue;const w=2+Math.floor(r()*7);g.fillStyle=r()<.6?"rgba(245,248,255,.75)":"rgba(220,232,250,.6)";g.fillRect(Math.round(x),Math.round(y),w,1+Math.floor(r()*2))}
  springLayer=document.createElement("canvas");springLayer.width=WW;springLayer.height=WH;const h=springLayer.getContext("2d"),q=mulberry(31),cols=["#ff9db5","#ffffff","#ffd166","#c9a2ff"];
  for(let i=0;i<700;i++){const x=q()*WW,y=q()*WH;if(Math.abs(x-riverX(y))<16)continue;h.fillStyle=cols[Math.floor(q()*4)];h.fillRect(Math.round(x),Math.round(y),1,1)}
}
function seasonTick(dt){
  seasonT-=dt;if(seasonT>0)return;seasonT=5;
  const ns=calcSeason();
  if(ns!==curSeason){const first=!S.lastSeason;curSeason=ns;if(S.lastSeason!==ns){S.lastSeason=ns;if(!first||true)toast(SEASON_MSG[ns],1)}$("hWeather").textContent=weatherLabel();dirty()}
  if(curSeason!=="winter"&&S.snowmen.length)S.snowmen=[];
  if(curSeason==="winter"&&S.snowmen.length<3&&Math.random()<.03){for(let i=0;i<10;i++){const x=rand(20,240),y=rand(30,160);if(walkable(x,y)&&!PLOTS.some(g=>x>g.x-6&&x<g.x+PW+6&&y>g.y-14&&y<g.y+PH+8)){S.snowmen.push({x:Math.round(x),y:Math.round(y)});toast("הפיפים בנו איש שלג");break}}}
  holidayTick();eventTick();
}
function drawSeasonGround(t){
  if(!snowLayer)buildLayers();
  if(curSeason==="winter"){ctx.drawImage(snowLayer,0,0);for(let dy=-POND.ry+2;dy<=POND.ry-2;dy++){const hw=Math.round((POND.rx-2)*Math.sqrt(1-(dy/(POND.ry-1))**2));R(POND.x-hw,POND.y+dy,hw*2,1,dy<0?"#cfe6f5":"#b9d7ee")}R(POND.x-10,POND.y-3,8,1,"#ffffff");
    for(const m of S.snowmen){if(!inView(m.x,m.y,10))continue;R(m.x-3,m.y-5,6,5,"#f5f8ff");R(m.x-2,m.y-9,4,4,"#ffffff");R(m.x-1,m.y-8,1,1,"#2a1830");R(m.x+1,m.y-8,1,1,"#2a1830");R(m.x,m.y-7,2,1,"#ffb347");R(m.x-2,m.y-11,4,2,"#2a1830");R(m.x-3,m.y-5,6,1,"#ff5d73")}}
  else if(curSeason==="spring")ctx.drawImage(springLayer,0,0);
  else if(curSeason==="autumn"){ctx.fillStyle="rgba(210,120,40,.13)";ctx.fillRect(0,0,WW,WH)}
  if(curSeason==="summer"){for(const f of flies2){f.a+=.03;f.x+=Math.cos(f.a)*.4;f.y+=Math.sin(f.a*1.3)*.3;if(f.x<0)f.x=250;if(f.x>256)f.x=4;const w=Math.floor(t*10+f.a)%2;const c=["#ffd166","#ff9db5","#8fbfff","#ffffff"][f.h];R(f.x-1-w,f.y,1+w,2,c);R(f.x+1,f.y,1+w,2,c);R(f.x,f.y,1,2,"#2a1830")}}
}
function drawSeasonSky(){
  if(curSeason==="summer"||(curSeason==="winter"&&rainy()))return;
  const col=curSeason==="autumn"?["#e0782f","#c4512a","#d9a83a"]:curSeason==="winter"?["#ffffff","#e8f0ff"]:["#ff9db5","#ffd0de"];
  const n=curSeason==="winter"?46:curSeason==="autumn"?22:18;
  for(let i=0;i<n;i++){const q=sparts[i];q.y+=curSeason==="winter"?.5+q.v*.4:.35+q.v*.3;q.x+=Math.sin((q.y+i*20)/30)*.4;if(q.y>CH){q.y=-4;q.x=Math.random()*CW}
    ctx.fillStyle=col[i%col.length];const sz=curSeason==="winter"?(q.v>.6?2:1):2;ctx.fillRect(Math.round(q.x),Math.round(q.y),sz,curSeason==="autumn"?1:sz)}
}

/* holidays, from the Hebrew calendar */
function hebParts(d){try{const o:any={};new Intl.DateTimeFormat("en-u-ca-hebrew",{month:"long",day:"numeric",year:"numeric"}).formatToParts(d).forEach(p=>o[p.type]=p.value);return{m:o.month,d:+o.day,y:+o.year}}catch(_){return null}}
let holCache=null,holAt=0;
function holiday(){
  if(Date.now()-holAt<60000)return holCache;holAt=Date.now();
  const now=new Date(),h=hebParts(now);let r=null;
  if(h){
    if(h.m==="Tishri"&&(h.d===1||h.d===2))r={k:"rosh",n:"ראש השנה",g:"שנה טובה! הפיפים מצאו תפוחים ודבש"};
    else if(h.m==="Tishri"&&h.d>=15&&h.d<=21)r={k:"sukkot",n:"סוכות",g:"חג סוכות שמח! הפיפים בנו סוכה ליד המאורה"};
    else if(h.m==="Tishri"&&h.d===22)r={k:"simchat",n:"שמחת תורה",g:"שמחת תורה! הפיפים רוקדים בהקפות"};
    else if(h.m==="Shevat"&&h.d===15)r={k:"tubishvat",n:"ט״ו בשבט",g:"ט״ו בשבט: העצים פורחים בחווה"};
    else if((h.m==="Adar"||h.m==="Adar II")&&(h.d===14||h.d===15))r={k:"purim",n:"פורים",g:"פורים שמח! הפיפים התחפשו"};
    else if(h.m==="Nisan"&&h.d>=15&&h.d<=21)r={k:"pesach",n:"פסח",g:"חג פסח שמח! ניקיון אביב בחווה"};
    else if(h.m==="Sivan"&&h.d===6)r={k:"shavuot",n:"שבועות",g:"חג שבועות שמח! זרי פרחים לכל הפיפים"};
    else for(let k=0;k<8;k++){const hp=hebParts(new Date((now as any)-k*86400000));if(hp&&hp.m==="Kislev"&&hp.d===25){r={k:"hanukkah",n:"חנוכה",day:k+1,g:`חנוכה שמח! הנר ה-${k+1} דולק`};break}}
  }
  if(!r&&now.getMonth()===0&&now.getDate()===1)r={k:"newyear",n:"שנה חדשה",g:"שנה אזרחית חדשה! זיקוקים בלילה"};
  const fd=Math.floor((Date.now()-S.born)/86400000);
  if(!r&&fd>0&&fd%30===0)r={k:"bday",n:"יום הולדת לחווה",g:`החווה בת ${fd} ימים! עוגה ליד המאורה`};
  if(r)r.key=r.k+":"+(h?h.y:now.getFullYear())+(r.k==="bday"?":"+fd:"");
  holCache=r;return r;
}
function holidayTick(){
  const h=holiday(),chip=$("hHoliday");
  chip.hidden=!h;if(h)chip.textContent=h.n+(h.day?" · נר "+h.day:"");
  if(!h||S.hol[h.key])return;
  S.hol[h.key]=Date.now();S.sparks+=15;if(h.k==="rosh")S.basket+=6;
  toast(h.g+" ‎+15 ניצוצות",1);SFX.level();
  if(h.k==="simchat"||h.k==="bday"||h.k==="purim")setTimeout(()=>{const ok=S.pips.filter(p=>["idle","walk"].includes(rt(p).state)).slice(0,18);ok.forEach(p=>{const r=rt(p);r.state="act";r.act="dance";r.ct=6});startChoir(false)},2500);
  dirty();
}
function drawHoliday(t){
  const h=holiday();if(!h)return;const x=70,y=46;
  if(h.k==="sukkot"){R(x-9,y-14,1,14,"#8a6a45");R(x+8,y-14,1,14,"#8a6a45");R(x-9,y-14,18,1,"#8a6a45");for(let i=0;i<18;i+=2)R(x-9+i,y-16+(i%4?0:1),2,2,i%6?"#4f9446":"#6fcf5a");R(x-8,y-12,16,9,"rgba(240,220,170,.35)");R(x-5,y-10,1,1,"#ff5d73");R(x+3,y-9,1,1,"#ffd166")}
  else if(h.k==="hanukkah"){R(x-9,y-1,18,1,"#d9a83a");R(x,y-8,1,8,"#d9a83a");for(let i=0;i<8;i++){const cx=x-8+i*2+(i>=4?2:0);R(cx,y-5,1,4,"#d9a83a");if(i<h.day){R(cx,y-7,1,2,"#fff7c2");if(Math.sin(t*9+i)>-.2)R(cx,y-8,1,1,"#ffb347")}}R(x,y-11,1,2,"#fff7c2");R(x,y-12,1,1,"#ffb347")}
  else if(h.k==="rosh"){R(x-4,y-4,4,4,"#e8433f");R(x-3,y-5,1,1,"#3f8f3a");R(x+2,y-5,4,5,"#ffd166");R(x+2,y-6,4,1,"#c89c63")}
  else if(h.k==="simchat"){for(let i=0;i<3;i++){const fx=x-8+i*8;R(fx,y-12,1,12,"#8a6a45");R(fx+1,y-12,4,3,["#8fbfff","#ffffff","#ffd166"][i]);R(fx,y-14,2,2,"#e8433f")}}
  else if(h.k==="tubishvat"){for(const[tx,ty] of [[10,12],[64,10],[250,150],[232,164]])for(let i=0;i<9;i++)R(tx-6+((i*5)%12),ty-14+((i*7)%10),1,1,"#ffc7d8")}
  else if(h.k==="bday"){R(x-5,y-5,10,5,"#ff9db5");R(x-5,y-6,10,1,"#fff7d6");for(let i=0;i<3;i++){R(x-3+i*3,y-9,1,3,"#8fbfff");if(Math.sin(t*9+i)>-.3)R(x-3+i*3,y-10,1,1,"#ffb347")}}
  else if(h.k==="pesach"){for(let i=0;i<3;i++){R(x-6+i*4,y-3-i,4,3,"#e9d3a0");R(x-5+i*4,y-2-i,1,1,"#c89c63")}}
  if(h.k==="newyear"&&night&&Math.random()<.04){const fx=cam.x+rand(20,CW/cam.z-20),fy=cam.y+rand(10,CH/cam.z/2);for(let i=0;i<18;i++){const a=i/18*6.28;parts.push({x:fx,y:fy,vx:Math.cos(a)*24,vy:Math.sin(a)*24-6,life:1,kind:"c",c:pick(["#ffd166","#ff7aa2","#8fbfff","#86d47f"])})}}
}
function holidayLook(p,x0,y0,bww,ey){
  const h=holCache;if(!h)return;
  if(h.k==="purim"){const mc=["#c9a2ff","#ff7aa2","#8fbfff","#ffd166"][p.id.charCodeAt(0)%4];R(x0,ey,bww,1,mc)}
  else if(h.k==="shavuot"){const f=["#ff9db5","#ffffff","#ffd166"];for(let i=0;i<bww-2;i++)R(x0+1+i,y0-1,1,1,i%2?"#6fcf5a":f[i%3])}
  else if(h.k==="bday"&&p.id.charCodeAt(1)%2){R(x0+2,y0-4,3,3,"#8fbfff");R(x0+3,y0-5,1,1,"#ffd166")}
}

