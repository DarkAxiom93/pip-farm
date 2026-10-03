/* real life: daily streak and focus timer */
const dayKey=d=>new Date(d).toLocaleDateString("en-CA");
const focusing=()=>!!(S&&S.focus&&Date.now()<S.focus.endAt);
function streakTick(){
  const today=dayKey(Date.now()),yest=dayKey(Date.now()-86400000),st=S.streak;
  if(st.last===today)return false;
  st.days=st.last===yest?st.days+1:1;st.last=today;st.best=Math.max(st.best||0,st.days);
  const bonus=Math.min(50,5*st.days);S.sparks+=bonus;
  SFX.level();toast(st.days===1?`רצף התחיל! ‎+${bonus} ניצוצות`:`רצף של ${st.days} ימים! ‎+${bonus} ניצוצות`);
  if([3,7,30,100].includes(st.days))moment("streak",null,st.days,false);
  if(st.days===3)setTimeout(()=>toast("רצף 3: מזג האוויר בחווה נהיה נעים יותר"),2500);
  if(st.days===7)setTimeout(()=>toast("רצף 7: הירקות גדלים מהר יותר ב-20%"),2500);
  renderStreak();dirty();return true;
}
function streakCheck(){
  const st=S.streak;if(!st.days)return;
  const today=dayKey(Date.now()),yest=dayKey(Date.now()-86400000);
  if(st.last!==today&&st.last!==yest){toast(`הרצף של ${st.days} ימים נשבר. סיים משימה היום כדי להתחיל מחדש`);st.days=0;S.pips.forEach(p=>p.mood=Math.max(0,p.mood-5));dirty()}
}
function renderStreak(){
  const st=S.streak,b=$("streakBox"),h=$("hStreak");
  const today=st.last===dayKey(Date.now());
  b.className="streak"+(st.days>=3?" hot":"");
  b.innerHTML=`<b>${st.days}</b><div><strong>${st.days?`רצף של ${st.days} ימים`:"אין רצף עדיין"}</strong><p>${today?"היום כבר נספר. חזור מחר":"סיים משימה אמיתית היום כדי "+(st.days?"להמשיך את הרצף":"להתחיל רצף")} · שיא: ${st.best||0}${st.days>=7?" · ירקות גדלים מהר יותר":st.days>=3?" · מזג אוויר נעים":""}</p></div>`;
  h.hidden=!st.days;h.textContent="רצף "+st.days;
}
function startFocus(min){
  if(focusing())return;
  const task=$("focusTask").value||null;
  S.focus={endAt:Date.now()+min*60000,len:min,task,start:Date.now()};
  S.pips.forEach(p=>dropNeed(p));
  toast(`זמן ריכוז של ${min} דקות. הפיפים עובדים בשקט איתך`);SFX.mood(520,"content",.3);
  renderFocus();dirty();
}
function stopFocus(){
  if(!S.focus)return;S.focus=null;document.title="חוות הפיפים";
  S.pips.slice(0,6).forEach(p=>say(p,pick(SOUNDS.sad),1.4,"snd","sad"));toast("עצרת את זמן הריכוז");renderFocus();dirty();
}
function finishFocus(){
  const f=S.focus;S.focus=null;document.title="חוות הפיפים";
  const reward=Math.round(f.len/5*2);S.sparks+=reward;S.stats.focusMin+=f.len;S.stats.focusRuns++;
  S.pips.forEach(p=>{p.xp+=5;p.growth+=5;p.mood=Math.min(100,p.mood+8);p.trust=clamp((p.trust??30)+2,-100,100);const r=rt(p);if(r.state==="idle"||r.state==="walk"){r.state="celebrate";r.ct=1.5}});
  SFX.level();burst(cam.x+CW/cam.z/2,cam.y+CH/cam.z/2,"confetti",40);
  toast(`סיימת ${f.len} דקות ריכוז! ‎+${reward} ניצוצות`);if(f.len>=25)moment("focus",null,f.len,false);notify("זמן הריכוז נגמר",`סיימת ${f.len} דקות. הפיפים חוגגים איתך`,true);
  setTimeout(()=>startChoir(false),1500);
  const t=f.task&&S.tasks.find(x=>x.id===f.task&&!x.done);
  const box=$("focusDone");box.hidden=false;
  box.innerHTML=`<p class="label" style="margin:0">כל הכבוד! ${f.len} דקות של ריכוז.</p>${t?`<button class="btn main" type="button" id="fdTask">סיימתי את "${esc(t.text)}"</button>`:""}<button class="btn" type="button" id="fdBreak">הפסקה של 5 דקות עם הפיפים</button>`;
  if(t)$("fdTask").onclick=()=>{const li=document.querySelector<HTMLInputElement>(`.task[data-id="${t.id}"] input[type=checkbox]`);if(li){li.checked=true;li.dispatchEvent(new Event("click",{bubbles:true}))}else{t.done=true;S.stats.tasksDone++;streakTick();renderTasks()}box.hidden=true};
  $("fdBreak").onclick=()=>{box.hidden=true;breakUntil=Date.now()+5*60000;toast("הפסקה! הפיפים רוצים לשחק");S.pips.slice(0,4).forEach(p=>{if(!rt(p).need)giveNeed(p)})};
  renderFocus();dirty();
}
let breakUntil=0,focusT=0,storyT=3;
function updateFocus(dt){
  focusT-=dt;if(focusT>0)return;focusT=.5;
  if(S.focus&&Date.now()>=S.focus.endAt){finishFocus();return}
  if(!focusing()){$("hFocus").hidden=true;return}
  const left=(S.focus.endAt-Date.now())/1000,txt=fmtT(left);
  $("hFocus").hidden=false;$("hFocus").textContent="ריכוז "+txt;document.title=txt+" · חוות הפיפים";
  if(!$("focusRun").hidden){$("focusClock").textContent=txt;$("focusBar").style.width=(100-left/(S.focus.len*60)*100)+"%"}
}
function renderFocus(){
  const on=focusing();
  $("focusBox").classList.toggle("on",on);$("focusIdle").hidden=on;$("focusRun").hidden=!on;
  const open=S.tasks.filter(t=>!t.done);
  $("focusTask").innerHTML=`<option value="">בלי משימה מסוימת</option>`+open.map(t=>`<option value="${t.id}">${esc(t.text)}</option>`).join("");
  if(on){const t=S.focus.task&&S.tasks.find(x=>x.id===S.focus.task);$("focusOn").textContent=t?"מתרכז ב: "+t.text:"מתרכז";updateFocus(1)}
}
$("focusIdle").addEventListener("click",e=>{const b=e.target.closest("button[data-min]");if(b){audio();startFocus(+b.dataset.min)}});
$("focusStop").addEventListener("click",()=>{audio();stopFocus()});
$("hFocus").addEventListener("click",()=>setTab("tasks"));
function drawStreakBed(t){
  const n=Math.min(14,S.streak.days),cols=["#ff7aa2","#ffd166","#c9a2ff","#8fbfff","#ffffff","#ffb347"];
  for(let i=0;i<n;i++){const x=6+i*3,y=74+(i%2);R(x,y,1,3,"#3f8f3a");const gold=S.streak.days>=7&&i>=6;R(x-1,y-1,3,1,gold?"#ffd166":cols[i%6]);R(x,y-2,1,3,gold?"#ffd166":cols[i%6]);R(x,y-1,1,1,gold?"#fff7c2":"#ffd166");if(gold&&Math.sin(t*3+i)>.9)R(x+1,y-3,1,1,"#fff")}
}

