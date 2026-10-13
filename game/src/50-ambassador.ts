/* ================= ambassador pips =================
   Send one of your pips to a friend as a short code. On the friend's farm (paste the code in
   the farm tab) it arrives as a guest for a day: it walks around, says words in your pips'
   language, the farm's pips greet it, and tapping it shows where it came from (and a gift). */
const GUEST_DAY=86400000;
function pipCode(p){
  const o={n:p.name,h:Math.round(p.hue),s:p.sprout,g:p.g,m:p.mut||null,d:p.ds||0,dm:p.dmod??0,gn:p.gen,f:farmName(),w:Object.values(p.lang||{}).slice(0,4),t:Date.now()};
  return "PIP1:"+btoa(unescape(encodeURIComponent(JSON.stringify(o))));
}
function readCode(code){
  try{const c=String(code||"").trim();if(!c.startsWith("PIP1:"))return null;
    const o=JSON.parse(decodeURIComponent(escape(atob(c.slice(5)))));
    if(!o||typeof o.n!=="string"||typeof o.h!=="number")return null;
    return {n:o.n.slice(0,14),h:clamp(o.h,0,360),s:clamp(o.s|0,0,5),g:o.g&&typeof o.g==="object"?{pattern:o.g.pattern|0,tail:o.g.tail|0,eyes:o.g.eyes|0,body:o.g.body|0}:{pattern:0,tail:0,eyes:0,body:0},
      m:MUTS.includes(o.m)?o.m:null,d:clamp(o.d|0,0,4),dm:clamp(o.dm|0,0,2),gn:o.gn|0,f:String(o.f||"חווה רחוקה").slice(0,30),w:Array.isArray(o.w)?o.w.filter(x=>typeof x==="string").map(x=>x.slice(0,10)).slice(0,4):[],t:+o.t||0};
  }catch(_){return null}
}
function sendAmbassador(p){
  const code=pipCode(p);S.stats.sent=(S.stats.sent||0)+1;dirty();
  const m=$("pmenu");closePlot();m.hidden=false;m.style.left="50%";m.style.top="30%";m.style.transform="translate(-50%,0)";
  m.innerHTML=`<h4>${esc(p.name)} יוצא לביקור</h4><p>שלח את הקוד לחבר. הוא מדביק אותו בלשונית חווה ← אורחים, ו${esc(p.name)} מגיע אליו ליום (הוא נשאר גם אצלך)</p><textarea class="codebox" readonly rows="3">${code}</textarea><button class="btn main" data-amb="copy">להעתיק</button>`;
  const ta=m.querySelector("textarea") as HTMLTextAreaElement;ta.focus();ta.select();
}
function copyCode(){const ta=document.querySelector("#pmenu textarea") as HTMLTextAreaElement;if(!ta)return;ta.select();
  const done=()=>toast("הקוד הועתק",1);
  try{navigator.clipboard.writeText(ta.value).then(done,()=>{document.execCommand("copy");done()})}catch(_){try{document.execCommand("copy");done()}catch(__){}}}
function receiveGuest(code){
  const o=readCode(code);if(!o){toast("הקוד לא נראה כמו פיפ. בדוק שהעתקת את כולו");return false}
  S.guests=(S.guests||[]).filter(g=>g.until>Date.now());
  if(S.guests.some(g=>g.n===o.n&&g.f===o.f&&g.t===o.t)){toast(`${o.n} כבר אצלך`);return false}
  if(S.guests.length>=3){toast("יש כבר 3 אורחים. חכה שאחד יחזור הביתה");return false}
  const x=6,y=rand(70,110);
  const gst={...o,id:"g"+uid(),x,y,tx:rand(80,220),ty:rand(60,150),until:Date.now()+GUEST_DAY,gift:false};
  S.guests.push(gst);S.stats.guests=(S.stats.guests||0)+1;
  toast(`${o.n} הגיע לביקור מ${o.f}!`,1);SFX.happy(700);lookAt(120,100);
  // the farm's pips come to say hi
  S.pips.filter(p=>["idle","walk"].includes(rt(p).state)&&!rt(p).job).slice(0,4).forEach((p,i)=>{const r=rt(p);r.goal="greet";r.state="walk";setT(p,gst.tx+rand(-14,14),gst.ty+rand(-6,6))});
  moment("guest",null,o.n);renderGuests();dirty();return true;
}
// guests wander and talk
let guestT=0;
function guestTick(dt){
  if(!S.guests||!S.guests.length)return;
  for(let i=S.guests.length-1;i>=0;i--){const g=S.guests[i];
    if(Date.now()>g.until){S.guests.splice(i,1);toast(`${g.n} חזר הביתה ל${g.f}`);renderGuests();dirty();continue}
    const dx=g.tx-g.x,dy=g.ty-g.y,d=Math.hypot(dx,dy);
    if(d<1){g.wait=(g.wait||0)-dt;if(g.wait<=0){g.wait=rand(2,6);for(let k=0;k<8;k++){const x=clamp(g.x+rand(-60,60),10,WW-10),y=clamp(g.y+rand(-40,40),20,WH-10);if(walkable(x,y)&&!night){g.tx=x;g.ty=y;break}}}}
    else{const s=Math.min(d,(night?0:12)*dt);g.x+=dx/d*s;g.y+=dy/d*s;g.dir=dx>0?1:-1}
    g.anim=(g.anim||0)+dt;
  }
  guestT-=dt;if(guestT<=0){guestT=rand(10,25);const g=pick(S.guests);if(g&&!night&&inView(g.x,g.y,0))guestSay(g,g.w&&g.w.length&&Math.random()<.7?pick(g.w):pick(["פיפ?","♪","הי!","בלופ"]))}
}
let guestBubble=null;
function guestSay(g,text){guestBubble={id:g.id,text,until:performance.now()+2600}}
function drawGuests(t){
  for(const g of S.guests||[]){if(!inView(g.x,g.y,20))continue;
    const p={id:g.id,name:g.n,hue:g.h,sprout:g.s,g:g.g,mut:g.m,xp:60,mood:80,food:80,c:{work:0,talk:0,pet:0,task:0},born:g.t||1,ds:g.d,dmod:g.dm,diet:[1,0,0]};
    drawPip(p,t,false,{state:night?"sleep":g.tx!==g.x?"walk":"idle",dir:g.dir||1,anim:g.anim||0,blink:2,talk:guestBubble&&guestBubble.id===g.id?.2:0,ct:0},g.x,g.y);
    // a little suitcase so you know it's a visitor
    R(g.x+5,g.y-4,3,3,"#a87a42");R(g.x+5.5,g.y-5,2,1,"#5a3d2b");R(g.x+6,g.y-3,1,.5,"#ffd166");
    if(guestBubble&&guestBubble.id===g.id&&performance.now()<guestBubble.until){
      CX.font="5px system-ui";const w=Math.max(10,CX.measureText(guestBubble.text).width+4);
      R(g.x-w/2,g.y-21,w,7,"rgba(245,237,220,.95)");R(g.x-1,g.y-14,2,1,"rgba(245,237,220,.95)");
      CX.fillStyle="#2a1830";CX.textAlign="center";CX.direction="rtl";CX.fillText(guestBubble.text,g.x,g.y-15.6)}
  }
}
function guestAt(x,y){return (S.guests||[]).find(g=>Math.abs(g.x-x)<7&&y>g.y-14&&y<g.y+3)}
function openGuest(g){
  const m=popAt(g.x,g.y-14),left=Math.max(1,Math.round((g.until-Date.now())/3600000));
  let gift="";if(!g.gift){g.gift=true;S.sparks+=10;gift=`<p>הוא הביא לך מתנה: ‎+10 ניצוצות</p>`;renderHead();dirty()}
  m.innerHTML=`<h4>${esc(g.n)} · אורח</h4><p>הגיע מ${esc(g.f)}. דור ${g.gn||1}${g.d?` · שלב דיגיטלי ${g.d}`:""}</p>${g.w&&g.w.length?`<p>אומר: ${g.w.map(esc).join(", ")}</p>`:""}${gift}<p>נשאר עוד בערך ${left} שעות</p>`;
  guestSay(g,pick(["הי!","♪",...(g.w||[])]));
}
function renderGuests(){
  const el=$("guestBox");if(!el)return;const gs=(S.guests||[]).filter(g=>g.until>Date.now());
  el.innerHTML=`<p class="albtop" style="margin:0 0 6px">קיבלת קוד של פיפ מחבר? הדבק אותו כאן והוא יגיע לביקור של יום. כדי לשלוח פיפ משלך: בחר אותו ← "לשלוח לביקור"</p>
    <div class="row" style="gap:6px"><input id="guestCode" placeholder="PIP1:..." aria-label="קוד של פיפ" style="flex:1;min-width:0"><button class="btn main" type="button" id="guestGo">לקבל</button></div>`+
    (gs.length?`<ul class="mem" style="margin-top:6px">${gs.map(g=>`<li><span>🧳 ${esc(g.n)} מ${esc(g.f)}</span><small>עוד ${Math.max(1,Math.round((g.until-Date.now())/3600000))} שעות</small></li>`).join("")}</ul>`:"");
}
