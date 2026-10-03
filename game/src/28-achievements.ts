/* ================= achievements and daily goals =================
   Achievements: long-term milestones, checked every few seconds. Each one pays sparks once and stays
   unlocked for good (also across New Game+).
   Daily goals: three small goals picked for the day (the same three all day). Each pays sparks, and
   finishing all three also counts as a day in the streak. */
const ACH=[
  {id:"pips10",n:"משפחה",d:"10 פיפים בחווה",r:10,v:()=>S.pips.length,g:10},
  {id:"pips50",n:"כפר",d:"50 פיפים בחווה",r:30,v:()=>S.pips.length,g:50},
  {id:"pips100",n:"עיר פיפים",d:"100 פיפים בחווה",r:60,v:()=>S.pips.length,g:100},
  {id:"gen5",n:"דור חמישי",d:"פיפ מהדור החמישי",r:20,v:()=>Math.max(0,...S.pips.map(p=>p.gen)),g:5},
  {id:"harv50",n:"חקלאי",d:"50 קטיפים",r:15,v:()=>S.stats.harvests||0,g:50},
  {id:"harv250",n:"חקלאי ותיק",d:"250 קטיפים",r:40,v:()=>S.stats.harvests||0,g:250},
  {id:"chop100",n:"חוטב עצים",d:"לכרות 100 פעמים",r:20,v:()=>S.stats.chops||0,g:100},
  {id:"build3",n:"בונים",d:"לבנות את שלושת המבנים",r:30,v:()=>Object.values(S.builds||{}).filter((b:any)=>b.done).length,g:3},
  {id:"zones",n:"סייר",d:"לפתוח את כל האזורים במפה",r:40,v:()=>ZONES.filter(z=>zoneOpen(z.id)).length,g:ZONES.length},
  {id:"decode5",n:"מתורגמן",d:"לפענח 5 מילים פיפיות",r:20,v:()=>S.stats.decoded||0,g:5},
  {id:"words20",n:"מילון",d:"20 מילים בשפת הפיפים",r:25,v:()=>Object.keys(S.lex||{}).length,g:20},
  {id:"choir10",n:"מנצח",d:"10 מקהלות",r:20,v:()=>S.stats.choirs||0,g:10},
  {id:"mut",n:"משהו מיוחד",d:"פיפ עם מוטציה",r:15,v:()=>Object.keys(S.album).filter(k=>k.startsWith("mut:")).length,g:1},
  {id:"albhalf",n:"אספן",d:"חצי אלבום",r:25,v:()=>Object.keys(S.album).length,g:()=>Math.ceil(albumTotal()/2)},
  {id:"albfull",n:"אלבום מלא",d:"כל הגנים והמוטציות",r:100,v:()=>Object.keys(S.album).length,g:()=>albumTotal()},
  {id:"trust90",n:"חבר אמת",d:"פיפ שאוהב אותך מאוד (אמון 90)",r:20,v:()=>Math.max(0,...S.pips.map(p=>p.trust??30)),g:90},
  {id:"streak7",n:"שבוע ביחד",d:"רצף של 7 ימים",r:30,v:()=>S.streak.best||0,g:7},
  {id:"streak30",n:"חודש ביחד",d:"רצף של 30 ימים",r:100,v:()=>S.streak.best||0,g:30},
  {id:"focus300",n:"שקט",d:"5 שעות של זמן ריכוז",r:40,v:()=>S.stats.focusMin||0,g:300},
  {id:"hide10",n:"בלש",d:"לנצח 10 פעמים במחבואים",r:25,v:()=>S.stats.hideWins||0,g:10},
  {id:"hide20",n:"עין חדה",d:"למצוא את כולם במחבואים בפחות מ-20 שניות",r:30,v:()=>S.stats.hideBest&&S.stats.hideBest<20?1:0,g:1},
  {id:"recall10",n:"זוכרים",d:"להיזכר ביחד 10 פעמים",r:25,v:()=>(S.moments||[]).reduce((a,m)=>a+(m.shared||0),0)+(S.stats.recalled||0),g:10},
  {id:"letters5",n:"דואר",d:"5 מכתבים מ-pip_001",r:20,v:()=>Object.keys(S.letters||{}).length,g:5},
  {id:"ending",n:"סוף",d:"להגיע לסוף של הסיפור",r:40,v:()=>endingsFound().size,g:1},
  {id:"endings3",n:"כל הסופים",d:"בחוץ, בפנים ואיפוס",r:150,v:()=>endingsFound().size,g:3},
  {id:"lantern3",n:"אור בלילה",d:"להדליק 3 פנסים עם גחליליות",r:20,v:()=>S.lanterns||0,g:3},
  {id:"stars1",n:"אסטרונום",d:"לצייר קבוצת כוכבים",r:15,v:()=>(S.constellations||[]).length,g:1},
  {id:"dream10",n:"שומר החלומות",d:"להציץ ל-10 חלומות",r:20,v:()=>S.stats.dreams||0,g:10},
  {id:"daily10",n:"קבוע",d:"לסיים את כל מטרות היום 10 פעמים",r:40,v:()=>S.stats.dailyDone||0,g:10}
];
const achGoal=a=>typeof a.g==="function"?a.g():a.g;
let achT=4;
function achTick(dt){
  achT-=dt;if(achT>0)return;achT=5;
  S.ach=S.ach||{};
  for(const a of ACH){
    if(S.ach[a.id])continue;
    let v=0;try{v=a.v()}catch(_){continue}
    if(v>=achGoal(a)){unlockAch(a);return} // one at a time, so each gets its moment
  }
}
function unlockAch(a){
  S.ach[a.id]=Date.now();S.sparks+=a.r;
  SFX.level();burst(cam.x+CW/cam.z/2,cam.y+CH/cam.z/2,"confetti",30);
  toast(`הישג חדש: ${a.n}! ${a.d}. ‎+${a.r} ניצוצות`,1);
  if(tab==="farm")renderFarm();renderHead();dirty();
}
function achHtml(){
  S.ach=S.ach||{};const got=ACH.filter(a=>S.ach[a.id]).length;
  return `<h3>הישגים<small>${got}/${ACH.length}</small></h3><div class="achs">`+ACH.map(a=>{
    const done=!!S.ach[a.id];let v=0;try{v=a.v()}catch(_){}const g=achGoal(a),pc=done?100:Math.min(100,Math.round(v/g*100));
    return `<div class="ach${done?" done":""}"><b>${done?"★ ":""}${esc(a.n)}</b><span>${esc(a.d)}</span><i><em style="width:${pc}%"></em></i><small>${done?ago(S.ach[a.id]):`${Math.min(v,g)}/${g}`} · ‎+${a.r}</small></div>`}).join("")+`</div>`;
}

/* daily goals */
const DAILY={
  pet:{n:"ללטף פיפים",g:10},
  feed:{n:"להאכיל פיפים",g:5},
  harvest:{n:"לקטוף מהשדה",g:6},
  need:{n:"לענות לבקשות של פיפים",g:5},
  chop:{n:"לכרות עצים",g:8,ok:()=>TREES.some((t,i)=>zoneOpen(t.z)&&treeUp(i))},
  forage:{n:"לאסוף אוכל מהטבע",g:4},
  talk:{n:"לדבר עם פיפים בצ'אט",g:3},
  hide:{n:"לנצח במחבואים",g:1,ok:()=>S.pips.length>=3},
  remember:{n:"להיזכר ביחד ברגע משותף",g:1,ok:()=>(S.moments||[]).length>0},
  task:{n:"לסיים משימה אמיתית",g:1},
  focus:{n:"זמן ריכוז אחד עד הסוף",g:1},
  decode:{n:"לפענח מילה פיפית",g:1,ok:()=>Object.values(S.lex||{}).some((w:any)=>!w.ok)},
  flies:{n:"לתפוס גחליליות בלילה",g:5},
  dream:{n:"להציץ לחלום של פיפ ישן",g:1},
  split:{n:"שפיפ יתפצל",g:1,ok:()=>S.pips.length<cap()}
};
function dailyToday(){
  const today=dayKey(Date.now());
  if(S.daily&&S.daily.day===today)return S.daily;
  // the same three goals all day, chosen from the date
  const seed=[...today].reduce((a,c)=>a*31+c.charCodeAt(0),7)+(S.loop||0),r=mulberry(seed);
  const pool=Object.keys(DAILY).filter(k=>!DAILY[k].ok||DAILY[k].ok()),goals=[];
  while(goals.length<3&&pool.length){const k=pool.splice(Math.floor(r()*pool.length),1)[0];goals.push({k,g:DAILY[k].g,p:0})}
  S.daily={day:today,goals,all:false};dirty();
  return S.daily;
}
function goal(k,n=1){
  if(!S)return;const d=dailyToday(),q=d.goals.find(x=>x.k===k);
  if(!q||q.p>=q.g)return;
  q.p=Math.min(q.g,q.p+n);
  if(q.p>=q.g){S.sparks+=10;SFX.coin();toast(`מטרת היום הושלמה: ${DAILY[k].n}. ‎+10 ניצוצות`,1);
    if(!d.all&&d.goals.every(x=>x.p>=x.g)){d.all=true;S.sparks+=25;S.stats.dailyDone=(S.stats.dailyDone||0)+1;
      setTimeout(()=>{SFX.level();toast("כל מטרות היום הושלמו! ‎+25 ניצוצות, והיום נספר ברצף",1);streakTick();renderStreak()},1500)}}
  if(tab==="tasks")renderDaily();dirty();
}
function renderDaily(){
  const el=$("dailyBox");if(!el||!S)return;const d=dailyToday();
  el.innerHTML=`<h3>מטרות היום<small>${d.all?"הכל הושלם ✓":"מתחלפות בחצות"}</small></h3>`+d.goals.map(q=>{const done=q.p>=q.g;return`<div class="dgoal${done?" done":""}"><span>${done?"✓ ":""}${esc(DAILY[q.k].n)}</span><i><em style="width:${Math.round(q.p/q.g*100)}%"></em></i><small>${q.p}/${q.g}</small></div>`}).join("");
}
