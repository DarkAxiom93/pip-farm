/* needs */
const needEls=new Map();
function needCount(){let n=0;for(const p of S.pips)if(rt(p).need)n++;return n}
function giveNeed(p){
  const r=rt(p),w:[string,number][]=[["food",p.food<60?4:1],["pet",p.mood<75?3:1.5],["play",Date.now()<breakUntil?8:2],["talk",1.2]];
  let tot=w.reduce((a,x)=>a+x[1],0),k=Math.random()*tot,type="pet";
  for(const [t,v] of w){if((k-=v)<=0){type=t;break}}
  r.need={type,left:45,max:45};
  const el=document.createElement("div");el.className="need";el.title={food:"רעב",pet:"רוצה ליטוף",play:"רוצה לשחק",talk:"רוצה לדבר איתך"}[type];
  el.innerHTML=type==="talk"?'<span class="ni talk">…</span>':`<span class="ni ${type}"></span>`;
  $("bubbles").appendChild(el);needEls.set(p.id,el);
  SFX.q(p.pitch);
  notify(`${p.name} צריך אותך`,{food:"הוא רעב",pet:"הוא רוצה ליטוף",play:"הוא רוצה לשחק",talk:"הוא רוצה לדבר איתך"}[type]);
}
function dropNeed(p){const r=rt(p);r.need=null;const el=needEls.get(p.id);if(el){el.remove();needEls.delete(p.id)}}
function fulfill(p){
  const r=rt(p);if(!r.need)return;
  const type=r.need.type;dropNeed(p);
  p.mood=Math.min(100,p.mood+15);bond(p,5,"need");award(p,8,type==="talk"?"talk":"pet");S.stats.needs++;
  SFX.happy(p.pitch);burst(p.x,p.y-10,"spark",8);
  setTimeout(()=>{if(byId(p.id)&&!langSpeak(p,NEED_CONCEPT[type],.8))chatter(p,"excited")},350);
  if(["idle","walk","chat","eat"].includes(r.state)){r.state="celebrate";r.ct=.9}
}
function playWith(p){const r=rt(p);r.state="act";r.act="dance";r.ct=2;burst(p.x,p.y-8,"confetti",10);SFX.mood(p.pitch,"excited",.4)}

/* trust, memory, absence, statue */
const MEM={hide:["שיחקתם מחבואים",1],shared:["נזכרתם ביחד ברגע משותף",1],pet:["ליטפת אותו",1],fed:["האכלת אותו",1],need:["נתת לו מה שביקש",1],talk:["דיברת אליו יפה",1],calm:["הפרדת אותו מריב",1],task:["סיימתם משימה ביחד",1],hurt:["פגעת בו",0],ignored:["התעלמת ממנו",0],poke:["הצקת לו",0],missed:["היית רחוק הרבה זמן",0],born:["נולד מהורה ש",2],lost:["ההורה שלו הפך לכוכב",2],thanked:["הודית לו על ציור",1]};
function bond(p,d,k){
  p.trust=clamp((p.trust??30)+d,-100,100);
  if(k){p.mem=p.mem||[];const last=p.mem[p.mem.length-1];if(last&&last.k===k&&Date.now()-last.t<60000)last.t=Date.now();else{p.mem.push({k,t:Date.now()});if(p.mem.length>6)p.mem.shift()}}
  if(sel===p.id)renderMemSoon();dirty();
}
function trustWord(t){return t>=60?"אוהב אותך":t>=25?"סומך עליך":t>=-10?"מהסס":"חושש ממך"}
function avgTrust(list?){list=list||S.pips;return list.length?list.reduce((a,p)=>a+(p.trust??30),0)/list.length:0}
function ago(t){const m=Math.round((Date.now()-t)/60000);if(m<1)return"עכשיו";if(m<60)return`לפני ${m} דק'`;const h=Math.round(m/60);if(h<24)return`לפני ${h} שע'`;return`לפני ${Math.round(h/24)} ימים`}
let memT=null;function renderMemSoon(){clearTimeout(memT);memT=setTimeout(()=>{const p=sel&&byId(sel);const el=$("memList");if(p&&el)el.innerHTML=memHtml(p);const ml=$("momList");if(p&&ml)ml.innerHTML=momentsHtml(momentsOf(p),4)},300)}
function memHtml(p){
  const list=(p.mem||[]).slice().reverse().slice(0,4);
  if(!list.length)return`<li><span>עוד לא קרה ביניכם משהו מיוחד</span></li>`;
  return list.map(m=>{const d=MEM[m.k]||[m.k,1];const txt=m.k==="born"?`נולד מהורה ש${trustWord(m.v)}`:d[0];return`<li class="${d[1]===0?"bad":""}"><span>${txt}</span><small>${ago(m.t)}</small></li>`}).join("");
}
// chalk drawings left on the ground while you were away
const DOODLES={
  heart:["01101100","11111110","11111110","01111100","00111000","00010000"],
  sad:["0111110","1000001","1010101","1000001","1011101","1100011","0111110"],
  keeper:["0011100","0111110","0001000","0011100","0101010","0001000","0010100","0100010"],
  sun:["1001001","0100010","0011100","1111111","0011100","0100010","1001001"],
  rain:["0011100","0111110","1111111","0000000","0101010","1010100"],
  question:["011110","100001","000110","001000","000000","001000"],
  screen:["11111111","10000001","10011001","10111101","10011001","10000001","11111111","00011000"],
  door:["0111110","0100010","0100010","0100110","0100010","0100010","0100010"]};
const DOODLE_TXT={screen:"מלבן עם עין בתוכו. ככה הם מציירים את המסך",door:"דלת. הם רוצים לצאת",heart:"לב. הוא התגעגע אליך",sad:"פרצוף עצוב. היה לו בודד",keeper:"ציור שלך, השומר",sun:"שמש. הוא חיכה שתחזור",rain:"ענן גשם. היה לו עצוב",question:"סימן שאלה. הוא תהה לאן נעלמת"};
function makeDrawings(hrs){
  const n=Math.min(10,Math.floor(hrs/6));if(!n)return 0;
  for(let i=0;i<n;i++){
    const a=pick(S.pips);if(!a)break;
    const k=hrs>48?pick(["sad","keeper","rain","question"]):(a.trust??30)>50?pick(["heart","keeper","sun","heart"]):pick(["keeper","question","sad"]);
    let x=a.x,y=a.y;for(let j=0;j<20;j++){const tx=a.x+rand(-50,50),ty=a.y+rand(-40,40);if(walkable(tx,ty)&&!PLOTS.some(g=>tx>g.x-10&&tx<g.x+PW+4&&ty>g.y-8&&ty<g.y+PH+6)){x=tx;y=ty;break}}
    S.drawings.push({x:Math.round(x),y:Math.round(y),k,by:a.id,name:a.name,t:Date.now(),away:Math.round(hrs)});
  }
  while(S.drawings.length>14)S.drawings.shift();
  return n;
}
function drawDoodles(t){
  S.drawings=S.drawings.filter(d=>Date.now()-d.t<36*3600*1000);
  for(const d of S.drawings){if(!inView(d.x,d.y,12))continue;const bm=DOODLES[d.k]||DOODLES.heart,h=bm.length,w=bm[0].length;
    for(let j=0;j<h;j++)for(let i=0;i<w;i++)if(bm[j][i]==="1")R(d.x-w+i*2,d.y-h*2+j*2,2,2,"rgba(245,240,225,.62)")}
}
function welcome(mins){
  const cx=cam.x+CW/cam.z/2,cy=cam.y+CH/cam.z/2;
  const fans=S.pips.filter(p=>(p.trust??30)>50&&rt(p).state!=="sleep").sort((a,b)=>b.trust-a.trust).slice(0,10);
  fans.forEach((p,i)=>{const r=rt(p);const a=i/Math.max(1,fans.length)*6.28;let x=cx+Math.cos(a)*18,y=cy+Math.sin(a)*12;if(!walkable(x,y)){x=p.x;y=p.y}r.state="walk";r.goal="greet";setT(p,x,y)});
  if(fans.length&&mins>=10)setTimeout(()=>toast(`${fans.length} פיפים רצים לקבל אותך`),1200);
}
// the statue of the keeper
const STATUE={x:193,y:90};
function statueStyle(){const a=avgTrust();return a>=60?"gold":a>=0?"stone":"dark"}
