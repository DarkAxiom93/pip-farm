/* ================= panel ================= */
function setTab(t){
  tab=t;
  for(const b of document.querySelectorAll<HTMLElement>(".tabs button"))b.setAttribute("aria-selected",String(b.dataset.tab===t));
  $("tab-pip").hidden=t!=="pip";$("tab-tasks").hidden=t!=="tasks";$("tab-farm").hidden=t!=="farm";$("tab-lang").hidden=t!=="lang";$("tab-album").hidden=t!=="album";
  if(t==="tasks")renderTasks();if(t==="farm")renderFarm();if(t==="lang")renderLang();if(t==="album")renderAlbum();
}
document.querySelector(".tabs").addEventListener("click",(e:any)=>{const b=e.target.closest("button");if(b){audio();setTab(b.dataset.tab)}});

function portrait(p){
  const c=document.createElement("canvas");c.width=20;c.height=20;c.className="portrait";
  const g=c.getContext("2d");g.imageSmoothingEnabled=false;g.fillStyle="#3f6e38";g.fillRect(0,0,20,20);g.fillStyle="#35612e";g.fillRect(0,15,20,5);
  const old=CX;CX=g;
  try{drawPip(p,performance.now()/1000,false,{state:"idle",dir:1,anim:0,blink:2,talk:0,ct:0},10,16)}finally{CX=old}
  return c;
}
let moreOpen=false;
function renderHead(){
  const box=$("pipHead");const p=sel&&byId(sel);
  if(!p){box.innerHTML=`<p class="empty">הקש על פיפ בחווה כדי לדבר איתו</p>`;return}
  const lv=level(p),tr=traits(p),par=p.parent&&byId(p.parent);
  box.innerHTML=`
  <div class="pip-head">
    <span id="portraitSlot"></span>
    <div style="min-width:0">
      <p class="pip-name">${esc(p.name)}<span class="lv">LV ${lv}</span></p>
      <div class="pip-sub">${isElder(p)?"זקן":stageOf(lv)} · ${ageText(p)} · דור ${p.gen}${p.founder?" · המייסד":""}${tribeOf(p)?` · שבט ${esc(tribeOf(p).name)}`:" · נווד"}${par?` · נולד מ${esc(par.name)}`:p.parent?" · ההורה כבר לא כאן":" · הפיפ הראשון"}</div>
    </div>
    <button class="icon-btn" id="renameBtn" type="button">שם</button>
  </div>
  <form class="rename" id="renameForm" hidden><input id="renameInput" maxlength="14" value="${esc(p.name)}" aria-label="שם חדש"><button class="btn" type="submit">שמור</button></form>
  <div class="bars" style="margin-top:10px">
    <span>אוכל</span><div class="bar"><i id="bFood" style="background:var(--ember)"></i></div><em id="nFood"></em>
    <span>מצב רוח</span><div class="bar"><i id="bMood" style="background:var(--berry)"></i></div><em id="nMood"></em>
    <span>אנרגיה</span><div class="bar"><i id="bEnergy" style="background:var(--sky)"></i></div><em id="nEnergy"></em>
    <span>התפצלות</span><div class="bar"><i id="bSplit" style="background:var(--leaf)"></i></div><em id="nSplit"></em>
    <span>אמון בך</span><div class="bar"><i id="bTrust" style="background:var(--butter)"></i></div><em id="nTrust"></em>
  </div>
  <div class="hint" id="pipHint"></div>
  <details class="more" id="moreBox"${moreOpen?" open":""}><summary>עוד על ${esc(p.name)}: אופי, זיכרונות, גנים ושפה</summary>
  <div style="margin-top:8px"><p class="label">אופי</p><div class="chips">${tr.length?tr.map(k=>`<span class="tag trait">${TRAIT_NAME[k]}</span>`).join(""):`<span class="tag">עוד לא ברור. תעבדו, תדברו, תלטפו</span>`}</div></div>
  <div style="margin-top:8px"><p class="label">אסף ${p.vocab.length} מילים (קופצות לפעמים כשהוא מרגש)</p><div class="chips">${p.vocab.length?p.vocab.slice(-14).reverse().map(w=>`<span class="tag">${esc(w)}</span>`).join(""):`<span class="tag">כל מילה שתכתוב לו הוא לומד</span>`}</div></div>
  <div style="margin-top:8px"><p class="label">זוכר</p><ul class="mem" id="memList">${memHtml(p)}</ul></div>
  <div style="margin-top:8px"><p class="label">גנים</p><div class="chips">${p.mut?`<span class="tag mut">✦ ${traitLabel("mut:"+p.mut)}</span>`:""}${traitKeys(p).filter(k=>!k.startsWith("mut")&&!/:0$/.test(k)||k==="head:0").map(k=>`<span class="tag">${traitLabel(k)}</span>`).join("")}</div></div>
  <div style="margin-top:8px"><p class="label">מדבר בשפת הפיפים</p><div class="chips">${Object.keys(p.lang).length?Object.entries(p.lang).map(([c,w]:[string,string])=>`<span class="tag lang">${esc(w)}${S.lex[w]&&S.lex[w].ok?" · "+CONCEPTS[c]:""}</span>`).join(""):`<span class="tag">עוד לא המציא מילים</span>`}</div></div>
  </details>
  <div class="row" style="margin-top:10px">
    <button class="btn" id="petBtn" type="button">ללטף</button>
    <button class="btn" id="feedBtn" type="button" ${S.basket?"":"disabled"}>להאכיל <small>סל ${S.basket}</small></button>
  </div>`;
  $("portraitSlot").replaceWith(portrait(p));
  $("moreBox").addEventListener("toggle",e=>{moreOpen=e.target.open});
  $("renameBtn").onclick=()=>{$("renameForm").hidden=!$("renameForm").hidden;if(!$("renameForm").hidden)$("renameInput").focus()};
  $("renameForm").onsubmit=e=>{e.preventDefault();const v=$("renameInput").value.trim().slice(0,14);if(v){p.name=v;say(p,v+"!",2,"word","excited");renderAll();dirty()}};
  $("petBtn").onclick=()=>{audio();pet(p);if(rt(p).need&&rt(p).need.type==="pet")fulfill(p)};
  $("feedBtn").onclick=()=>{audio();if(S.basket>0){feed(p);if(rt(p).need&&rt(p).need.type==="food")fulfill(p)}};
  refresh();
}
function renderChat(){
  const p=sel&&byId(sel),log=$("chatLog");
  log.innerHTML="";
  if(!p){log.innerHTML=`<p class="empty">אין פיפ נבחר</p>`;return}
  if(!p.convo.length&&!p.question){log.innerHTML=`<p class="empty">דבר עם ${esc(p.name)}. הוא לא יודע לדבר, אבל הוא מבין רגשות ואוסף את המילים שלך</p>`}
  for(const m of p.convo)addMsg(m.r,m.t,false,m.r==="p"&&"w"in m?m.w:undefined);
  if(p.question)addMsg("p",p.question,true);
  $("chatInput").placeholder=p.question?`תענה ל${p.name}…`:`תגיד ל${p.name} משהו…`;
  voiceNote();
}
function addMsg(r,t,q?,w?){const log=$("chatLog");log.querySelector(".empty")?.remove();const d=document.createElement("div");d.className="msg "+r+(q?" q":"");
  if(r==="p"&&w!==undefined){const a=document.createElement("span");a.className="s";a.textContent=t;d.appendChild(a);if(w){const b=document.createElement("span");b.className="w";b.textContent=w;d.appendChild(b)}}else d.textContent=t;
  log.appendChild(d);log.scrollTop=log.scrollHeight;return d}

/* chat: Claude reads what you say, the pip answers with sounds and maybe one word */
let sample=null,aiDenied=false,pending=false;
function voiceNote(){
  const n=$("voiceNote");
  if(platformVoiceNote(n))return;
  if(!S.ai)n.textContent="הפיפים מבינים לפי מילות מפתח (Claude כבוי בהגדרות)";
  else if(aiDenied)n.textContent="הפיפים מבינים לפי מילות מפתח (Claude לא אושר)";
  else if(sample)n.textContent="Claude עוזר להם להבין אותך. הם עונים בצלילים";
  else n.textContent="הפיפים מבינים לפי מילות מפתח";
}
function buildPrompt(p,text){
  const lv=level(p),tr=traits(p).map(k=>TRAIT_NAME[k]).join(", ")||"עוד לא מגובש";
  const hist=p.convo.slice(-6).map(m=>(m.r==="u"?"השומר: ":p.name+": ")+(m.t||"")+(m.w?" ["+m.w+"]":"")).join("\n");
  return `במשחק חווה יש יצור זעיר בשם ${p.name} שלא יודע לדבר. הוא מגיב רק בצלילים, ולפעמים פולט מילה אחת.
${S.story&&S.story.ch>=2?"הפיפים חושדים שהם חיים בתוך משחק ושהשומר נמצא מאחורי מסך"+(S.story.ending==="free"?", והם כבר ראו מה יש בחוץ":S.story.ending==="reset"?", אבל הזיכרון שלהם אופס והם ריקים ומנומסים":"")+". ":""}רמה ${lv}, אופי: ${tr}, יחס לשומר: ${trustWord(p.trust??30)} (אמון ${Math.round(p.trust??30)} מתוך 100), זוכר: ${(p.mem||[]).slice(-3).map(m=>m.k==="born"?"נולד מהורה ש"+trustWord(m.v):(MEM[m.k]||[m.k])[0]).join(", ")||"כלום"}, אוכל ${Math.round(p.food)}/100, מצב רוח ${Math.round(p.mood)}/100, ${night?"לילה":"יום"}.
מילים שהוא מכיר: ${p.vocab.slice(-30).join(", ")||"אין"}.
מילים בשפת הפיפים שהוא משתמש בהן: ${Object.entries(p.lang).map(([c,w])=>w+"="+CONCEPTS[c]).join(", ")||"אין"}.
${hist?"מה שקרה עד עכשיו:\n"+hist+"\n":""}השומר אומר לו עכשיו: ${text}

החלט איך ${p.name} מרגיש ומגיב. החזר JSON בלבד:
{"mood":"happy|excited|content|curious|sad|hungry|sleepy|scared","act":"hop|dance|spin|nuzzle|hide|none","word":""}
word: מילה עברית אחת בלבד, או מחרוזת ריקה. תן מילה רק כשהרגש חזק, בערך בפעם אחת מתוך שלוש. עדיף מילה משפת הפיפים כשהיא מתאימה לרגש, אחרת מילה שהוא מכיר או מילה מהמשפט של השומר.`;
}
function react(p,res){
  const r=rt(p),m=SOUNDS[res.mood]?res.mood:"content";
  const dm={happy:6,excited:9,content:3,curious:2,sad:-6,hungry:0,sleepy:0,scared:-8}[m]||0;
  p.mood=clamp(p.mood+dm,0,100);
  if(m==="sad"||m==="scared")bond(p,-6,"hurt");else if(m==="happy"||m==="excited")bond(p,2,"talk");
  if(res.act&&res.act!=="none"&&["idle","walk","chat","act"].includes(r.state)){
    r.state="act";r.act=res.act;r.ct=res.act==="hide"?2:1.8;
    if(res.act==="hide"){const q=S.pips.find(x=>x!==p&&Math.hypot(x.x-p.x,x.y-p.y)<40);r.fx=q?q.x:p.x+(Math.random()<.5?-1:1)}
  }
  const snd=Array.from({length:ri(1,2)},()=>pick(SOUNDS[m])).join(" ");
  let w=(res.word||"").trim().split(/\s+/)[0]||"";
  w=w.replace(/[^\p{L}\p{N}?!]/gu,"").slice(0,14);
  if(w&&S.lex[w])say(p,w+(m==="curious"?"?":"!"),2.4,"lang",m);
  else if(w)say(p,w+(m==="curious"?"?":"!"),2.4,"word",m);else say(p,snd,1.8,"snd",m);
  return{snd,w,m};
}
$("chatForm").addEventListener("submit",async e=>{
  e.preventDefault();audio();
  const p=sel&&byId(sel),inp=$("chatInput"),text=inp.value.trim();
  if(!p||!text||pending)return;
  inp.value="";
  addMsg("u",text);
  const hadQ=p.question;
  p.convo.push({r:"u",t:text});quest("chat");
  const pw=lexIn(text);
  if(rt(p).need&&rt(p).need.type==="talk")fulfill(p);
  const ws=words(text).filter(w=>!S.lex[w]);let learned=0;
  for(const w of ws.slice(0,4)){if(!p.vocab.includes(w)){p.vocab.push(w);learned++}}
  while(p.vocab.length>60)p.vocab.shift();
  const r=rt(p);
  if(r.xpCd<=0){award(p,hadQ?12:6,"talk");r.xpCd=3}
  if(hadQ){p.question=null;clearBubble(p.id);document.querySelectorAll("#chatLog .msg.q").forEach(m=>m.classList.remove("q"))}
  say(p,pick(SOUNDS.curious),1,"snd","curious");
  let res=null;
  if(pw){const c=S.lex[pw].c,[m,a]=CONCEPT_REACT[c]||["happy","hop"];res={mood:m,act:a,word:p.lang[c]||pw};S.lex[pw].used=(S.lex[pw].used||0)+1;award(p,4,"talk");
    if(c==="food"&&S.basket>0&&p.food<85)setTimeout(()=>{if(byId(p.id))feed(p)},900)}
  pending=true;$("chatSend").disabled=true;
  if(!res&&S.ai&&sample&&!aiDenied){
    const t=addMsg("p","…");t.classList.add("typing");
    try{res=await sample.json(buildPrompt(p,text),{modelTier:"quick",cache:false})}
    catch(err){if(err&&err.code==="not_granted"){aiDenied=true;voiceNote()}else if(err&&err.code==="rate_limited")toast("Claude עמוס רגע, הפיפ מנחש לבד")}
    t.remove();
  }else await new Promise(z=>setTimeout(z,450));
  if(!res||typeof res!=="object"){res=localRead(p,text);if(Math.random()<.3)res.word=wordFor(p,res.mood)}
  pending=false;$("chatSend").disabled=false;
  const out=react(p,res);
  p.convo.push({r:"p",t:out.snd,w:out.w});while(p.convo.length>12)p.convo.shift();
  if(sel===p.id)addMsg("p",out.snd,false,out.w);
  if(learned&&sel===p.id)renderHead();
  dirty();
});

