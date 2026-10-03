/* ================= shared moments =================
   Big things that happen between the keeper and the pips are kept as "moments".
   Now and then a pip that was there remembers one: it stops, a small drawing of the moment
   appears in its bubble, and the narrator says what it is remembering. If the keeper taps it
   while it remembers, they remember together: trust grows and the pip draws the moment on the ground.
   Moments also come back on their anniversaries (a week, a month, a year). */
const MOMENTS={
  pet:{i:"heart",x:m=>`הפעם הראשונה שליטפת את ${m.n}`},
  split:{i:"sun",x:m=>`ההתפצלות הראשונה בחווה. ${m.v} נולד`},
  split10:{i:"sun",x:m=>`היום שבו החווה הגיעה ל-${m.v} התפצלויות`},
  harvest:{i:"sun",x:m=>m.v>1?`הקטיף ה-${m.v} שלכם`:"הקטיף הראשון שלכם"},
  storm:{i:"rain",x:m=>`הסערה, כשליטפת את ${m.n} עד שנרגע`},
  word:{i:"question",x:m=>`היום שבו הבנת את המילה "${m.v}"`},
  choir:{i:"heart",x:()=>"המקהלה הראשונה, כשכולם שרו ביחד"},
  focus:{i:"keeper",x:m=>`${m.v} דקות שעבדתם ביחד בשקט`},
  streak:{i:"sun",x:m=>`${m.v} ימים ברצף שחזרת אליהם`},
  build:{i:"door",x:m=>`היום שבו סיימתם לבנות ${m.v}`},
  visitor:{i:"keeper",x:m=>`האורח ${m.v} שבא מרחוק`},
  calm:{i:"heart",x:m=>`כשהפרדת את ${m.n} מריב`},
  farewell:{i:"sad",x:m=>`היום שבו ${m.v} הפך לכוכב`},
  late:{i:"keeper",x:()=>"הלילה שבו נשארת ער איתם"},
  wave:{i:"keeper",x:()=>"הפעם שנופפת להם מאחורי המסך"},
  gate:{i:"door",x:()=>"היום שבו השער נפתח"},
  together:{i:"keeper",x:()=>"היום שבו נכנסת אליהם"}
};
// add a moment. who: one pip, a list of pips, or null for whoever is around (up to 12)
function moment(k,who,v?,once=true){
  if(!S||!MOMENTS[k])return null;
  S.moments=S.moments||[];
  if(once&&S.moments.some(m=>m.k===k&&!m.old))return null;
  const list=(who==null?S.pips.slice(0,12):Array.isArray(who)?who:[who]).filter(Boolean);
  if(!list.length)return null;
  const m={id:uid(),k,t:Date.now(),who:list.map(p=>p.id),n:list[0].name,v:v??null,shared:0,last:0};
  S.moments.push(m);
  if(S.moments.length>60){const i=S.moments.findIndex(x=>x.k!=="farewell"&&x.shared===0);S.moments.splice(i>=0?i:0,1)}
  if(sel&&m.who.includes(sel))renderMemSoon();
  dirty();return m;
}
function momentText(m){const d=MOMENTS[m.k];return (m.old?"בהפעלה הקודמת: ":"")+(d?d.x(m):m.k)}
function momentsOf(p){return (S.moments||[]).filter(m=>m.who.includes(p.id))}
// a pip remembers
let recallT=rand(150,300),annivT=20;
function recallTick(dt){
  recallT-=dt;annivT-=dt;
  if(annivT<=0){annivT=300;anniversaries()}
  if(recallT>0)return;recallT=rand(180,420);
  if(!S.moments||!S.moments.length||focusing()||cardOn||Date.now()-lastActive>180000)return;
  const now=Date.now(),cand=[];
  for(const m of S.moments){
    if(now-m.t<15*60000||now-m.last<3600000)continue;
    const ps=m.who.map(byId).filter(p=>p&&["idle","walk"].includes(rt(p).state)&&!rt(p).need&&inView(p.x,p.y,-10));
    if(ps.length)cand.push([m,pick(ps),1+Math.min(5,(now-m.t)/86400000)]);
  }
  if(!cand.length)return;
  let k=Math.random()*cand.reduce((a,c)=>a+c[2],0),c=cand[0];for(const x of cand){if((k-=x[2])<=0){c=x;break}}
  remember(c[1],c[0]);
}
function remember(p,m){
  const r=rt(p);m.last=Date.now();
  r.state="stare";r.ct=6;r.recall={id:m.id,until:performance.now()+12000};
  say(p," ",8,"memo","content");
  const b=bubbleEls.get(p.id);if(b){b.textContent="";b.appendChild(doodleCanvas(MOMENTS[m.k].i))}
  SFX.q(p.pitch*.8);
  toast(`${p.name} נזכר: ${momentText(m)} (${ago(m.t)}). הקש עליו כדי להיזכר איתו`,1);
  dirty();
}
// tapping a pip while it remembers: you remember together
function shareRecall(p){
  const r=rt(p);if(!r.recall||performance.now()>r.recall.until)return false;
  const m=(S.moments||[]).find(x=>x.id===r.recall.id);r.recall=null;if(!m)return false;
  m.shared++;bond(p,4,"shared");p.mood=Math.min(100,p.mood+8);
  r.state="celebrate";r.ct=1.4;burst(p.x,p.y-10,"heart",3);SFX.happy(p.pitch);
  if(!langSpeak(p,"keeper",.7))say(p,pick(["♪","כן!","זוכר"]),2,"word","excited");
  if(S.drawings.length<20)S.drawings.push({x:Math.round(p.x+6),y:Math.round(p.y+8),k:MOMENTS[m.k].i,by:p.id,name:p.name,t:Date.now(),away:0});
  toast(`נזכרתם ביחד: ${momentText(m)}. ${p.name} צייר את זה על האדמה`,1);
  quest("remember");renderMemSoon();dirty();
  return true;
}
// a week, a month, a year after a moment
function anniversaries(){
  if(!S.moments)return;const now=Date.now(),today=dayKey(now);
  for(const m of S.moments){
    if(m.old)continue;
    const days=Math.round((new Date(today).getTime()-new Date(dayKey(m.t)).getTime())/86400000);
    const lbl=days===7?"שבוע":days===30?"חודש":days===365?"שנה":null;
    if(!lbl||m.anniv===days)continue;
    m.anniv=days;
    const ps=m.who.map(byId).filter(Boolean);
    ps.slice(0,6).forEach((p,i)=>setTimeout(()=>{const r=rt(p);if(r.state!=="sleep"){r.state="celebrate";r.ct=1.4;burst(p.x,p.y-10,"confetti",8)}},i*250));
    toast(`היום לפני ${lbl}: ${momentText(m)}`,1);dirty();return;
  }
}
// a small canvas with the moment's drawing, for the bubble and the lists
function doodleCanvas(k,scale=3){
  const bm=DOODLES[k]||DOODLES.heart,h=bm.length,w=bm[0].length,c=document.createElement("canvas");
  c.width=w*scale;c.height=h*scale;c.className="doodle";const g=c.getContext("2d");g.fillStyle="#2a1830";
  bm.forEach((row,y)=>[...row].forEach((v,x)=>{if(v==="1")g.fillRect(x*scale,y*scale,scale,scale)}));
  return c;
}
function momentsHtml(list,max){
  if(!list.length)return`<li><span>עוד אין רגעים משותפים. הם יגיעו</span></li>`;
  return list.slice().reverse().slice(0,max).map(m=>`<li data-moment="${m.id}"><span>✦ ${esc(momentText(m))}</span><small>${ago(m.t)}${m.shared?` · נזכרתם ${m.shared}×`:""}</small></li>`).join("");
}
