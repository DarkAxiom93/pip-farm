/* tasks */
function renderTasks(){
  renderStreak();renderFocus();renderDaily();
  const s=$("taskPip"),cur=s.value||sel;
  s.innerHTML=S.pips.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("");
  if(cur&&byId(cur))s.value=cur;
  const ul=$("taskList");
  const list=[...S.tasks].sort((a,b)=>(a.done-b.done)||(b.created-a.created));
  if(!list.length){ul.innerHTML=`<li class="empty">אין משימות. הוסף משימה אמיתית, וכשתסמן שסיימת הפיפ שלך יקבל המון כוח לגדול</li>`;return}
  ul.innerHTML=list.map(t=>{const p=byId(t.pip);return`<li class="task${t.done?" done":""}" data-id="${t.id}">
    <input type="checkbox" ${t.done?"checked":""} aria-label="סיימתי">
    <span class="t">${esc(t.text)}</span><span class="who">${p?esc(p.name):""}</span>
    <button class="x" type="button" aria-label="למחוק">×</button></li>`}).join("");
}
$("taskForm").addEventListener("submit",e=>{
  e.preventDefault();audio();
  const text=$("taskText").value.trim();if(!text)return;
  const p=byId($("taskPip").value)||S.pips[0];
  S.tasks.push({id:uid(),text,pip:p.id,created:Date.now(),done:false});quest("task");
  $("taskText").value="";
  for(const w of words(text).slice(0,2))if(!p.vocab.includes(w))p.vocab.push(w);
  award(p,4,"task");Math.random()<.35?say(p,"יאללה!",2,"word","excited"):say(p,pick(["♪♫","פיפ!","יאיי!"]),1.6,"snd","excited");
  renderTasks();renderCount();if(sel===p.id)renderHead();dirty();
});
$("taskList").addEventListener("click",e=>{
  const li=e.target.closest(".task");if(!li)return;
  const t=S.tasks.find(x=>x.id===li.dataset.id);if(!t)return;
  if(e.target.matches(".x")){S.tasks=S.tasks.filter(x=>x!==t);renderTasks();renderCount();dirty();return}
  if(e.target.matches("input[type=checkbox]")){
    audio();t.done=e.target.checked;
    const p=byId(t.pip);
    if(t.done){S.stats.tasksDone++;goal("task");S.sparks+=5;setTimeout(streakTick,1200);$("focusDone").hidden=true;if(p){award(p,35,"task");bond(p,3,"task");const r=rt(p);if(r.state!=="work"&&r.state!=="split"){r.state="celebrate";r.ct=1.6}burst(p.x,p.y-10,"confetti",22);SFX.split(p.pitch);say(p,pick(["וואו!","אלוף!","יאי!"]),2.4,"word","excited")}toast("משימה הושלמה: ‎+5 ניצוצות")}
    renderTasks();renderCount();dirty();
  }
});
function renderCount(){const n=S.tasks.filter(t=>!t.done).length;$("taskCount").textContent=n?n:""}

/* album */
function albumTotal(){return ALBUM.reduce((a,s)=>a+s.items.length,0)}
function renderAlbCount(){const n=Object.keys(S.album).length;$("albCount").textContent=n+"/"+albumTotal()}
function samplePip(key){
  const[c,v]=key.split(":");
  const p={hue:84,sprout:1,xp:60,mood:70,food:80,c:{work:0,talk:0,pet:0,task:0},g:{pattern:0,tail:2,eyes:0,body:0},mut:null,born:3};
  if(c==="head")p.sprout=+v;else if(c==="mut")p.mut=v;else{p.g[c]=+v;if(c!=="tail")p.g.tail=0}
  if(c==="tail")p.sprout=0;
  return p;
}
function renderAlbum(){
  renderAlbCount();
  const have=Object.keys(S.album).length;
  $("albTop").innerHTML=`גילית <b>${have}/${albumTotal()}</b>. כל פיפ שנולד יורש את רוב הגנים מההורה, ולפעמים משהו משתנה. פיפ מאושר במיוחד (מצב רוח מעל 90) כשהוא מתפצל מוליד מוטציה פי 2 יותר`;
  const body=$("albBody");body.innerHTML="";
  {const sec=document.createElement("div");sec.className="alb-sec";sec.innerHTML=collectionHtml();body.appendChild(sec)}
  if(S.moments&&S.moments.length){const sec=document.createElement("div");sec.className="alb-sec";
    sec.innerHTML=`<h3>ספר הרגעים<small>${S.moments.length}</small></h3><ul class="mem">${momentsHtml(S.moments,20)}</ul><p class="albtop">רגעים גדולים שעברתם ביחד. מדי פעם פיפ שהיה שם נזכר באחד מהם. כשזה קורה, הקש עליו כדי להיזכר איתו</p>`;
    body.appendChild(sec)}
  if(S.stars.length){const sec=document.createElement("div");sec.className="alb-sec";
    sec.innerHTML=`<h3>שמי הזיכרון<small>${S.stars.length}</small></h3><ul class="mem">${S.stars.slice().reverse().slice(0,20).map(st=>`<li><span>✦ ${esc(st.name)} · דור ${st.gen} · חי ${st.days} ימים</span><small>${ago(st.died)}</small></li>`).join("")}</ul><p class="albtop" style="margin-top:4px">בלילה הם זורחים בשמיים. הקש על כוכב כדי לראות של מי הוא</p>`;
    body.appendChild(sec)}
  for(const sec of ALBUM){
    const keys=sec.items.map((_,i)=>sec.k+":"+(sec.k==="mut"?MUTS[i]:i));
    const got=keys.filter(k=>S.album[k]).length;
    const div=document.createElement("div");div.className="alb-sec";
    div.innerHTML=`<h3>${sec.t}<small>${got}/${keys.length}</small></h3><div class="alb"></div>`;
    const grid=div.querySelector(".alb");
    keys.forEach((k,i)=>{
      const ok=!!S.album[k],n=S.pips.filter(p=>traitKeys(p).includes(k)).length;
      const card=document.createElement("button");card.type="button";card.className="card"+(ok?"":" locked")+(sec.rare?" rare":"");card.dataset.k=k;
      card.appendChild(portrait(samplePip(k)));(card.lastChild as HTMLElement).className="";
      const b=document.createElement("b");b.textContent=ok?sec.items[i]:"???";card.appendChild(b);
      const sm=document.createElement("small");sm.textContent=ok?(n?`${n} בחווה`:"אין כרגע"):(sec.rare?"נדיר":"לא התגלה");card.appendChild(sm);
      grid.appendChild(card);
    });
    body.appendChild(div);
  }
}
$("albBody").addEventListener("click",e=>{const c=e.target.closest(".card");if(!c||c.classList.contains("locked"))return;const p=S.pips.find(x=>traitKeys(x).includes(c.dataset.k));if(p){audio();select(p.id,true)}else toast("אין כרגע פיפ כזה בחווה")});

/* language tab */
const guessCd={};
function renderLangCount(){const n=Object.keys(S.lex).filter(w=>!S.lex[w].ok&&speakers(w)>0).length;$("langCount").textContent=n?n:""}
function renderLang(){
  renderLangCount();
  const ul=$("lexList"),ws=Object.keys(S.lex);
  if(!ws.length){ul.innerHTML=`<li class="empty">עוד אין מילים. הפיפים ממציאים מילים כשקורה להם משהו: כשהם אוכלים, הולכים לישון, מקבלים ליטוף או משחקים עם חבר</li>`;return}
  const rows=ws.map(w=>({w,n:speakers(w),e:S.lex[w]})).sort((a,b)=>(a.e.ok-b.e.ok)||(b.n-a.n)||((b.e.heard||0)-(a.e.heard||0)));
  const opts=Object.entries(CONCEPTS).map(([k,v])=>`<option value="${k}">${v}</option>`).join("");
  ul.innerHTML=rows.map(({w,n,e})=>`<li class="lexi${n?"":" dead"}" data-w="${esc(w)}">
    <span class="lw">${esc(w)}</span>${e.ok?`<span class="meaning">${CONCEPTS[e.c]}</span>`:`<span class="lm">מה זה?</span>`}
    <span class="lm">${n?`${n} פיפים אומרים`:"נשכחה"} · נשמעה ${e.heard||0} פעמים${e.used?` · השתמשת בה ${e.used}`:""}</span><span></span>
    ${e.ok||!n?"":`<div class="guess"><select aria-label="מה המילה ${esc(w)} אומרת"><option value="">לנחש משמעות…</option>${opts}</select><button class="btn" type="button">לנחש</button></div>`}
  </li>`).join("");
}
$("lexList").addEventListener("click",e=>{
  const b=e.target.closest(".guess button");if(!b)return;audio();
  const li=b.closest(".lexi"),w=li.dataset.w,sel_=li.querySelector("select").value,e2=S.lex[w];if(!sel_||!e2)return;
  if(guessCd[w]&&Date.now()<guessCd[w]){toast("הם עוד מסתכלים עליך מוזר. חכה רגע");return}
  if(sel_===e2.c){e2.ok=true;quest("decode");S.sparks+=8;S.stats.decoded++;goal("decode");if(S.stats.decoded===1)moment("word",null,w);SFX.level();toast(`פיענחת! "${w}" זה ${CONCEPTS[e2.c]}. ‎+8 ניצוצות`);
    S.pips.filter(p=>Object.values(p.lang).includes(w)).slice(0,6).forEach((p,i)=>setTimeout(()=>{if(byId(p.id)){say(p,w+"!",1.8,"lang","excited");const r=rt(p);if(r.state==="idle"){r.state="celebrate";r.ct=.8}}},i*180));
    renderLang();if(sel)renderHead();dirty()}
  else{guessCd[w]=Date.now()+20000;li.classList.remove("no");void li.offsetWidth;li.classList.add("no");SFX.mood(440,"curious",.3);toast("לא. הם מטים את הראש בבלבול")}
});

/* farm tab */
function renderFarm(){
  renderShop();$("achBox").innerHTML=achHtml();
  const words=new Set(S.pips.flatMap(p=>p.vocab)).size,maxGen=Math.max(...S.pips.map(p=>p.gen));
  $("farmStats").innerHTML=[...(loopN()?[[loopN()+1,"הפעלה"]]:[]),[S.pips.length+"/"+cap(),"פיפים"],[maxGen,"דורות"],[words,"מילים בחווה"],[S.stats.splits,"התפצלויות"],[S.stats.harvests,"קטיפים"],[S.stats.tasksDone,"משימות שסיימת"],[Object.keys(S.lex).length,"מילים פיפיות"],[S.stats.decoded,"פוענחו"],[S.stats.choirs,"מקהלות"],[S.pips.filter(p=>p.mut).length,"מוטנטים"],[S.tribes.length,"שבטים"],[S.wood||0,"עצים"],[Object.values(S.builds).filter((b:any)=>b.done).length+"/3","מבנים"],[Math.round(avgTrust()),"אמון ממוצע"],[S.streak.best||0,"רצף שיא"],[S.stats.focusMin||0,"דקות ריכוז"],[S.statue?(S.statue.done?"גמור":Math.round(S.statue.p)+"%"):"—","פסל"],[unlockedCount()+1+"/"+ZONES.length,"אזורים"],[S.stats.calmed,"ויכוחים שהרגעת"]]
    .map(([v,l])=>`<div class="stat"><b>${v}</b><span>${l}</span></div>`).join("");
  $("seedShop").innerHTML=CROPS.map((c,k)=>S.seeds[k]?`<button class="btn" disabled>${c.name}<small>יש</small></button>`:`<button class="btn" data-seed="${k}" ${S.sparks<c.cost?"disabled":""}>${c.name}<small>${c.cost}</small></button>`).join("");
  $("tribeList").innerHTML=S.tribes.length?S.tribes.map(t=>{const m=members(t),lead=m.sort((a,b)=>level(b)-level(a))[0];return`<button type="button" class="tribe" data-lead="${lead?lead.id:""}"><span class="flag" style="background:${TRIBE_COL[t.k]}"></span><b>${esc(t.name)}</b><em>${m.length} פיפים</em><small>${TRAIT_TRIBE[t.k]} · ${(t2=>t2>=60?"אוהבים אותך":t2>=25?"סומכים עליך":t2>=-10?"מהססים":"חוששים ממך")(avgTrust(m))} · ${t.huts}/3 בקתות${t.huts<3?` · בנייה ${Math.round(t.build)}%`:""}${lead?` · מנהיג: ${esc(lead.name)}`:""}</small></button>`}).join(""):`<p class="empty">עוד אין שבטים. כשיהיו מספיק פיפים עם אופי דומה, הם יתאגדו</p>`;
  $("pipList").innerHTML=S.pips.map(p=>`<button class="pcard" type="button" data-id="${p.id}" aria-current="${p.id===sel}"><span class="dot" style="background:${col(p,72)}"></span><span>${esc(p.name)}<small>LV ${level(p)} · ${stageOf(level(p))}</small></span></button>`).join("");
  $("optSound").checked=S.sound;$("optMusic").checked=S.music!==false;$("optAi").checked=S.ai;$("optSeason").checked=!!S.fastSeasons;$("optStory").checked=!!S.fastStory;
}
$("seedShop").addEventListener("click",e=>{const b=e.target.closest("button[data-seed]");if(!b||b.disabled)return;const k=+b.dataset.seed;if(S.sparks>=CROPS[k].cost){S.sparks-=CROPS[k].cost;S.seeds[k]=true;SFX.coin();toast(`זרעי ${CROPS[k].name} נפתחו`);renderFarm();dirty()}});
$("tribeList").addEventListener("click",e=>{const b=e.target.closest(".tribe");if(b&&b.dataset.lead){audio();select(b.dataset.lead,true)}});
$("pipList").addEventListener("click",e=>{const b=e.target.closest(".pcard");if(b){audio();select(b.dataset.id,true)}});
$("optSound").addEventListener("change",e=>{S.sound=e.target.checked;soundBtn();dirty()});
$("optMusic").addEventListener("change",e=>{audio();S.music=e.target.checked;dirty()});
$("optStory").addEventListener("change",e=>{S.fastStory=e.target.checked;dirty()});
$("optSeason").addEventListener("change",e=>{S.fastSeasons=e.target.checked;seasonT=0;dirty()});
$("optAi").addEventListener("change",e=>{S.ai=e.target.checked;voiceNote();dirty()});
function soundBtn(){const b=$("hSound");b.textContent="צליל: "+(S.sound?"פועל":"כבוי");b.setAttribute("aria-pressed",String(S.sound))}
$("hStars").addEventListener("click",()=>{audio();toggleStarMode()});
$("hHide").addEventListener("click",()=>{if(hide){toast(hide.phase==="seek"?"משחקים! חפש אותם במפה":"הם עוד מתחבאים…");return}startHide()});
$("hChoir").addEventListener("click",()=>{audio();if(choir){toast("המקהלה כבר מתאספת");return}startChoir(true)});
$("hSound").addEventListener("click",()=>{audio();S.sound=!S.sound;soundBtn();if(tab==="farm")renderFarm();dirty()});
$("resetBtn").addEventListener("click",()=>{
  const box=$("resetBox");
  box.innerHTML=`<p class="label">למחוק את כל הפיפים ולהתחיל מאפס? אי אפשר לבטל.</p><div class="row"><button class="btn" id="rNo" type="button">לא</button><button class="btn" id="rYes" type="button"><span class="danger">כן, חווה חדשה</span></button></div>`;
  $("rNo").onclick=()=>{box.innerHTML=`<button class="btn" type="button" id="resetBtn2"><span class="danger">להתחיל חווה חדשה</span></button>`;$("resetBtn2").onclick=()=>$("resetBtn").click()};
  $("rYes").onclick=()=>{cardQ=[];cardOn=false;$("story").hidden=true;for(const el of needEls.values())el.remove();needEls.clear();choir=null;args.length=0;claims.clear();RT.clear();jobs.length=0;for(const id of [...bubbleEls.keys()])clearBubble(id);freshState();sel=S.pips[0].id;saveNow();box.innerHTML=`<p class="label">חווה חדשה נוצרה</p>`;renderAll()};
});

/* periodic refresh */
function refresh(){
  $("hSparks").textContent=S.sparks;$("hBasket").textContent=S.basket+"/"+basketMax();$("hWood").textContent=S.wood||0;$("hPop").textContent=S.pips.length;
  const p=sel&&byId(sel);
  if(p&&$("bFood")){
    const set=(k,v,n?)=>{$("b"+k).style.width=clamp(v,0,100)+"%";$("n"+k).textContent=n??Math.round(v)};
    set("Food",p.food);set("Mood",p.mood);set("Energy",p.energy);
    set("Trust",((p.trust??30)+100)/2,trustWord(p.trust??30));
    const need=splitNeed();set("Split",p.growth/need*100,Math.min(100,Math.round(p.growth/need*100))+"%");
    const r=rt(p);let h="";
    if(S.pips.length>=cap())h="החווה מלאה, אין מקום לפיפים חדשים";
    else if(p.growth>=need&&p.food<30)h="מוכן להתפצל, אבל רעב מדי. תאכיל אותו";
    else if(r.state==="split")h="מתפצל עכשיו!";
    else if(r.state==="sleep")h=r.nap?"ישן שנ״צ להחזיר אנרגיה":"ישן במאורה עד הבוקר";
    else if(r.state==="work")h="עובד בשדה";
    $("pipHint").textContent=h;
    const fb=$("feedBtn");if(fb){fb.disabled=!S.basket;fb.querySelector("small").textContent="סל "+S.basket}
  }
  if(openPlotIdx>=0&&$("pmLeft")){const pl=S.plots[openPlotIdx];if(pl.crop){const l=cropLeft(pl.crop);if(l<=0)openPlot(openPlotIdx);else $("pmLeft").textContent="בשל בעוד "+fmtT(l)}}
}
function renderAll(){renderHead();renderChat();renderCount();renderLangCount();renderAlbCount();if(tab==="album")renderAlbum();if(tab==="lang")renderLang();if(tab==="tasks")renderTasks();if(tab==="farm")renderFarm();refresh()}

