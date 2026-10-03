/* onboarding */
const QUESTS=[
 {k:"chat",t:"הקש על פיפי וכתוב לו משהו בצ'אט",r:5},
 {k:"pet",t:"הקש פעמיים על פיפי כדי ללטף אותו",r:3},
 {k:"plant",t:"הקש על חלקה ריקה ובחר מה לשתול",r:5},
 {k:"harvest",t:"חכה שהירק יבשיל, הקש עליו ובחר לקטוף",r:5},
 {k:"feed",t:"האכל פיפ מהסל (כפתור להאכיל)",r:5},
 {k:"split",t:"תמשיך לעבוד ולדבר עם פיפי עד שהוא מתפצל",r:10},
 {k:"task",t:"בלשונית משימות, הוסף משימה אמיתית שלך",r:5},
 {k:"zone",t:"פתח את היער (גרור את המפה ימינה או הקש על הערפל)",r:10},
 {k:"decode",t:"בלשונית שפה, נחש מה אומרת מילה פיפית",r:15},
 {k:"wood",t:"הקש 3 פעמים על עץ כדי לכרות אותו",r:5},
 {k:"build",t:"הקש על אחד המבנים המסומנים מעל השדה ובנה אותו מעץ",r:10},
 {k:"cuddle",t:"החזק את האצבע על פיפ כדי לחבק אותו",r:5},
 {k:"carry",t:"גרור פיפ כדי להרים ולהעביר אותו",r:5},
 {k:"call",t:"לחיצה ארוכה על הקרקע קוראת לפיפים אליך",r:5}];
function quest(k){
  const i=S.quest??0;if(i>=QUESTS.length||QUESTS[i].k!==k)return;
  S.quest=i+1;S.sparks+=QUESTS[i].r;SFX.coin();
  toast(`משימת פתיחה הושלמה! ‎+${QUESTS[i].r} ניצוצות`,1);
  if(S.quest>=QUESTS.length)setTimeout(()=>toast("סיימת את כל משימות הפתיחה. החווה שלך",1),1500);
  renderQuest();dirty();
}
function renderQuest(){
  const i=S.quest??0,b=$("questBar");
  if(i>=QUESTS.length){b.hidden=true;return}
  b.hidden=false;$("questN").textContent=`${i+1}/${QUESTS.length}`;$("questText").textContent=QUESTS[i].t;
}
$("questSkip").addEventListener("click",()=>{S.quest=QUESTS.length;renderQuest();dirty()});

/* shop */
const SHOP=[
 {k:"fert",n:"דשן",d:"כל הירקות בשדה מבשילים עכשיו",base:15},
 {k:"feast",n:"משתה",d:"כל הפיפים אוכלים עד שובע",base:12},
 {k:"lull",n:"שיר ערש",d:"אנרגיה מלאה ומצב רוח טוב לכולם",base:10}];
function price(it){return Math.round(it.base*Math.pow(1.18,(S.buys||{})[it.k]||0))}
function renderShop(){
  $("shopBox").innerHTML=SHOP.map(it=>{const pr=price(it);return`<button class="btn" type="button" data-shop="${it.k}" ${S.sparks<pr?"disabled":""}><b>${it.n} · ${pr}</b><span>${it.d}</span></button>`}).join("");
}
$("shopBox").addEventListener("click",e=>{
  const b=e.target.closest("button[data-shop]");if(!b||b.disabled)return;audio();
  const it=SHOP.find(x=>x.k===b.dataset.shop),pr=price(it);if(S.sparks<pr)return;
  S.sparks-=pr;S.buys=S.buys||{};S.buys[it.k]=(S.buys[it.k]||0)+1;
  if(it.k==="fert"){let n=0;S.plots.forEach(pl=>{if(pl.crop&&cropFrac(pl.crop)<1){pl.crop.planted=Date.now()-CROPS[pl.crop.type].grow*1000*2;n++}});toast(n?`הדשן הבשיל ${n} חלקות`:"אין כרגע מה להבשיל, הדשן נשמר לשדה",1)}
  else if(it.k==="feast"){S.pips.forEach(p=>{p.food=Math.min(100,p.food+40);p.mood=Math.min(100,p.mood+5)});SFX.crunch();toast("משתה! כולם שבעים",1)}
  else{S.pips.forEach(p=>{p.energy=100;p.mood=Math.min(100,p.mood+10);p.trust=clamp((p.trust??30)+1,-100,100)});SFX.purr(500);toast("שיר ערש. כולם רגועים",1)}
  renderShop();renderFarm();refresh();dirty();
});

/* backup */
function b64e(str){return btoa(unescape(encodeURIComponent(str)))}
function b64d(str){return decodeURIComponent(escape(atob(str.trim())))}
$("bkCopy").addEventListener("click",async()=>{
  const code="PIPS1:"+b64e(JSON.stringify(serialize()));$("bkArea").hidden=false;$("bkText").value=code;$("bkRow").innerHTML="";
  try{await navigator.clipboard.writeText(code);toast("קוד הגיבוי הועתק. שמור אותו במקום בטוח",1)}catch(_){$("bkText").select();toast("סמן את הקוד והעתק אותו",1)}
});
$("bkOpen").addEventListener("click",()=>{
  $("bkArea").hidden=false;$("bkText").value="";$("bkText").placeholder="הדבק כאן קוד גיבוי שמתחיל ב-PIPS1:";
  $("bkRow").innerHTML=`<button class="btn main" type="button" id="bkGo">לשחזר. החווה הנוכחית תוחלף</button>`;
  $("bkGo").onclick=()=>{
    try{const v=$("bkText").value.trim();if(!v.startsWith("PIPS1:"))throw 0;const d=JSON.parse(b64d(v.slice(6)));if(!d.pips||!d.pips.length)throw 0;
      for(const el of needEls.values())el.remove();needEls.clear();choir=null;args.length=0;claims.clear();RT.clear();jobs.length=0;for(const k of [...bubbleEls.keys()])clearBubble(k);
      hydrate(d);S.lastSeen=Date.now();sel=S.pips[0].id;saveNow();renderAll();renderQuest();$("bkArea").hidden=true;toast(`החווה שוחזרה: ${S.pips.length} פיפים`,1)}
    catch(_){toast("הקוד לא תקין. ודא שהעתקת את כולו, כולל PIPS1:",1)}
  };
});

