/* ================= pips that build themselves out of what they eat =================
   The bits in the basket don't vanish when a pip eats them: they stay inside as "data".
   With enough data (and far enough into the story) a pip stops and compiles itself into
   its next stage. One way only. Stage 2 adds a body module picked by what it ate most.
   Children keep half of the parent's data and the parent's module colour. */
const DSTAGE=[
  {need:15,ch:0,n:"ניצוץ"},
  {need:60,ch:2,n:"מודול"},
  {need:150,ch:4,n:"פיקסלים"},
  {need:300,ch:99,n:"צומת"}   // ch 99: only after an ending
];
let DMAX=4; // how many stages are open in this version
const DMOD=[
  {n:"רגליים",c:"#5dffb0",d:"הולך ועובד מהר יותר"},
  {n:"מעבד",c:"#ffcf4a",d:"לפעמים ביט נוסף בקטיף"},
  {n:"אנטנה",c:"#c9a2ff",d:"לומד ומפענח מילים מהר יותר"}
];
const DATA_W=[3,5,8]; // data per meal: bit, chip, star pixel
const dstage=p=>p.ds||0;
const pipMod=p=>dstage(p)>=2?(p.dmod??0):-1;
function dmain(p){const d=p.diet||[0,0,0];return d[2]>d[1]&&d[2]>d[0]?2:d[1]>d[0]?1:0}
const dcol=p=>DMOD[p.dmod??dmain(p)].c;
function dReady(p){
  const s=dstage(p);if(s>=DMAX||s>=DSTAGE.length)return false;
  const st=DSTAGE[s],ch=S.story?S.story.ch||0:0,end=!!(S.story&&S.story.ending);
  return (p.data||0)>=st.need&&(st.ch===99?end:(end||ch>=st.ch));
}
function dWaitText(p){
  const s=dstage(p);if(s>=DSTAGE.length)return "שלב אחרון";
  if(s>=DMAX)return "השלב הבא עוד לא נפתח";
  const st=DSTAGE[s];if((p.data||0)<st.need)return `עוד ${st.need-(p.data||0)} דאטה לשלב ${st.n}`;
  return st.ch===99?"מחכה לסוף הסיפור":"מחכה להמשך הסיפור";
}
// ---------- the basket knows what's in it ----------
function binFix(){
  S.bin=S.bin||[0,0,0];
  for(let i=0;i<3;i++)S.bin[i]=Math.max(0,Math.floor(S.bin[i]||0));
  let over=S.bin[0]+S.bin[1]+S.bin[2]-S.basket;
  while(over>0){const k=S.bin.indexOf(Math.max(...S.bin));S.bin[k]--;over--}
}
function addBits(k,n){const b=S.basket;addFood(n);binFix();S.bin[k]+=S.basket-b}
// take one thing from the basket: -1 for natural food (berries, fish), else the crop type
function takeFood(){
  binFix();if(S.basket<=0)return null;
  const nat=S.basket-S.bin[0]-S.bin[1]-S.bin[2];let r=Math.random()*S.basket;S.basket--;
  if(r<nat)return -1;r-=nat;
  for(let k=0;k<3;k++){if(r<S.bin[k]){S.bin[k]--;return k}r-=S.bin[k]}
  return -1;
}
function eatFood(p){
  const k=takeFood();if(k==null)return null;
  if(k>=0){p.data=(p.data||0)+DATA_W[k];p.diet=p.diet||[0,0,0];p.diet[k]++}
  return k;
}
// ---------- compiling ----------
let compiling=null;
function pipDataTick(dt){if(compiling&&!byId(compiling))compiling=null}
// called from the idle state (30-update): an idle pip with enough data stops and compiles itself
function tryCompile(p){if(compiling||night||hide||fire||cardOn||!dReady(p))return false;startCompile(p);return true}
function startCompile(p){
  const r=rt(p);compiling=p.id;r.state="compile";r.ct=3.2;
  say(p,pick(["0101…","בּיפּ בּוּפּ","…קומפל…"]),2.6,"snd","curious");
  [0,1,2,3,4,5].forEach(i=>tone(330*Math.pow(2,[0,4,7,12,7,16][i]/12),.06,"square",i*.09,0,.12));
}
function finishCompile(p){
  compiling=null;if(!dReady(p))return;
  p.ds=dstage(p)+1;const s=p.ds;
  if(s===2&&p.dmod==null)p.dmod=dmain(p);
  S.stats.compiles=(S.stats.compiles||0)+1;
  burst(p.x,p.y-8,"spark",18);SFX.level();
  if(s===1&&!S.dFirst){S.dFirst=p.id;
    card({title:`${p.name} גילה משהו`,lines:[`~${p.name} מסתכל על פיקסל שזוהר לו על הבטן.`,"~הביטים שהוא אכל לא נעלמו. הם נשארו בפנים.","~הוא מזיז אותם קצת, והפיקסל זז איתו.","> data.log: 'אפשר לבנות את עצמי ממה שאני אוכל'"]})}
  else if(s===2&&!S.dFirst2){S.dFirst2=p.id;const m=DMOD[p.dmod];
    card({title:`${p.name} בנה לעצמו ${m.n}`,lines:[`~${p.name} סידר את הדאטה שלו מחדש.`,`~עכשיו יש לו ${m.n}. ${m.d}.`,"~הפיפים האחרים מסתכלים עליו. חלק כבר אוכלים יותר מהר.","> data.log: 'אנחנו יכולים לבחור מה להיות'"]})}
  else toast(s===2?`${p.name} בנה לעצמו ${DMOD[p.dmod].n}!`:`${p.name} עלה לשלב ${DSTAGE[s-1].n}`,1);
  discover(p,true);if(sel===p.id)renderAll();dirty();
}
// ---------- drawing ----------
// body marks, drawn on top of the body before the face
function drawPipData(p,r,x0,y0,bww,bh2,t,dir){
  const s=dstage(p),cc=dcol(p),h=(p.born||7)%5;
  if(r.state==="compile"){
    const k=Math.floor(t*14);for(let i=0;i<bh2;i+=2)if((k+i)%3===0)R(x0,y0+i,bww,.5,"rgba(160,255,210,.45)");
    for(let i=0;i<3;i++){const ph=(t*1.6+i*.33)%1;R(x0+((i*5+k)%bww),y0-ph*10,.5,1,i%2?cc:"#ffffff")}
  }
  if(s<1)return;
  // stage 1: one glowing pixel that blinks
  const px=x0+1+(h%Math.max(1,bww-3)),py=y0+bh2-3;
  const on=Math.sin(t*3+h)>-.2;if(on)R(px-.5,py-.5,2,2,cc+"66");R(px,py,1,1,on?cc:"rgba(0,0,0,.25)");if(on)R(px,py,.5,.5,"#ffffff");
  if(s<2)return;
  // stage 2: faint circuit lines on the body, plus the module
  R(px+1,py+.25,Math.min(3,x0+bww-1-px-1),.5,cc+"dd");R(px,py-2,.5,2,cc+"dd");R(px-.5,py-2.5,1,1,cc+"cc");
  const m=p.dmod??0;
  if(m===0){const st=r.state==="walk"?Math.floor(r.anim*10)%2:0;R(x0+1+st,y0+bh2-.5,2,1.5,"#8a93a6");R(x0+bww-3-st,y0+bh2-.5,2,1.5,"#8a93a6");R(x0+.5+st,y0+bh2+.5,2.5,.5,cc);R(x0+bww-3.5-st,y0+bh2+.5,2.5,.5,cc)}
  else if(m===1){const cx=dir>0?x0+bww-1:x0-2;R(cx,y0+bh2-5,3,3,"#1c2230");R(cx+.5,y0+bh2-4.5,2,2,"#2f3a52");R(cx+1,y0+bh2-4,1,1,Math.sin(t*5)>0?cc:"#5a4a1a");R(cx-.5,y0+bh2-4.5,.5,.5,cc);R(cx+3,y0+bh2-3.5,.5,.5,cc)}
  else{const ax=x0+(dir>0?1:bww-2);R(ax,y0-4,.5,4,"#8a93a6");R(ax-.5,y0-5,1.5,1.5,Math.sin(t*4)>0?cc:"#5e4a80");if(Math.sin(t*2)>.6)R(ax-1.5,y0-5.5,.5,.5,"#ffffff")}
}
// ---------- panel ----------
function dataPanelText(p){
  const s=dstage(p),m=pipMod(p);
  return `${s?DSTAGE[s-1].n:"רגיל"}${m>=0?` · ${DMOD[m].n}`:""} · ${dWaitText(p)}`;
}
function dataFrac(p){const s=dstage(p);if(s>=DSTAGE.length)return 100;const prev=s?DSTAGE[s-1].need:0,need=DSTAGE[s].need;return clamp(((p.data||0)-prev)/(need-prev)*100,0,100)}

// stage 3+ eyes and glitchy edges, stage 4 scanlines; drawn after the face
function drawPipDataTop(p,r,x0,y0,bww,bh2,el,er,ey,sleep,t){
  const s=dstage(p);if(s<3)return;const cc=dcol(p);
  if(!sleep&&r.blink>=0){R(el,ey,2,2,"#0b1612");R(er,ey,2,2,"#0b1612");R(el,ey,1,1,cc);R(er,ey,1,1,cc)}
  const g=Math.sin(t*7.3+(p.born||0)%11);if(g>.86){const k=Math.floor((t*20)%Math.max(1,bh2));R(x0-1.5,y0+k,bww,1,cc+"88");R(x0+bww-1,y0+k+1,2,.5,cc)}
  if(s>=4){for(let i=1;i<bh2;i+=2)R(x0+.5,y0+i,bww-1,.5,"rgba(200,255,230,.18)");
    if(r.state==="walk"&&Math.random()<.35)parts.push({x:p.x+rand(-2,2),y:p.y-rand(0,4),vx:0,vy:-6,life:.6,kind:"px",c:cc})}
}
// stage 3+: far walks go through the circuits in the ground instead
function rideStart(p,r,d){
  if(r.ride||dstage(p)<3||d<90||digi()<=0||(r.rideCd||0)>performance.now())return false;
  r.ride={sx:p.x,sy:p.y,ex:r.tx,ey:r.ty,t:0,L:Math.abs(r.tx-p.x)+Math.abs(r.ty-p.y)};
  burst(p.x,p.y-4,"spark",8);tone(880,.12,"square",0,.5,.1);return true;
}
function rideStep(p,r,dt){
  const R0=r.ride;R0.t+=dt*110;const a=Math.abs(R0.ex-R0.sx);
  if(R0.t<a){p.x=R0.sx+Math.sign(R0.ex-R0.sx)*R0.t;p.y=R0.sy}
  else{p.x=R0.ex;p.y=R0.sy+Math.sign(R0.ey-R0.sy)*Math.min(R0.t-a,Math.abs(R0.ey-R0.sy))}
  if(R0.t>=R0.L){p.x=R0.ex;p.y=R0.ey;r.ride=null;r.rideCd=performance.now()+8000;burst(p.x,p.y-4,"spark",10);tone(660,.12,"square",0,1.5,.1);S.stats.rides=(S.stats.rides||0)+1}
}
function drawRide(p,r,t){
  const cc=dcol(p);R(p.x-1,p.y-2,2,2,cc);R(p.x-.5,p.y-1.5,1,1,"#ffffff");
  for(let i=1;i<5;i++){ctx.globalAlpha=.5-i*.1;R(p.x-1,p.y-2,2,2,cc);ctx.globalAlpha=1}
}
// light lines from node pips (stage 4) to the nearest server or antenna, or to each other
function drawNetLines(t){
  const nodes=S.pips.filter(p=>dstage(p)>=4&&!rt(p).ride);if(!nodes.length)return;
  const hubs=(S.decor||[]).filter(d=>d.k==="server"||d.k==="antenna");
  for(const p of nodes){if(!inView(p.x,p.y,170))continue;
    let best=null,bd=170;for(const h of hubs){const d=Math.hypot(h.x-p.x,h.y-p.y);if(d<bd){bd=d;best={x:h.x,y:h.y-12}}}
    if(!best){for(const q of nodes){if(q===p)continue;const d=Math.hypot(q.x-p.x,q.y-p.y);if(d<bd){bd=d;best={x:q.x,y:q.y-5}}}}
    if(!best)continue;const cc=dcol(p),x0=p.x,y0=p.y-5,dx=best.x-x0,dy=best.y-y0,n=Math.ceil(Math.hypot(dx,dy)/3);
    ctx.globalAlpha=.35;for(let i=0;i<n;i+=2)R(x0+dx*i/n,y0+dy*i/n,.5,.5,cc);ctx.globalAlpha=1;
    const f=(t*.6+(p.born%7)/7)%1;R(x0+dx*f-.5,y0+dy*f-.5,1,1,"#ffffff");
  }
}
