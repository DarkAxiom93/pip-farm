/* ================= the pips' language, as a game =================
   No more test with a list of options. Words are learned by listening:
   - every time a pip says a word you get closer: after 2 times you may guess between 4 pictures,
     after 5 times between 3, after 9 times between 2
   - when a pip says a new word, a little "?" shows on its bubble: tap the pip right then and guess
     on the spot
   - a pip that loves you (trust 60+) sometimes acts the word out, and then you just know it
   - your level grows with every word: tourist, getting it, speaks pip, honorary pip */
const ICON={food:"🍎",sleep:"💤",love:"💛",play:"⚽",fear:"😨",day:"☀️",night:"🌙",keeper:"🧑",friend:"🤝",water:"💧",work:"🌱",screen:"🖥️",outside:"🚪",game:"🎮"};
const LEVELS:[number,string][]=[[0,"תייר"],[3,"מבין קצת"],[8,"מדבר פיפית"],[15,"כמעט פיפ"],[25,"פיפ של כבוד"]];
function langLevel(){
  const n=Object.values(S.lex||{}).filter((e:any)=>e.ok).length;let i=0;for(let k=0;k<LEVELS.length;k++)if(n>=LEVELS[k][0])i=k;
  const next=LEVELS[i+1];return{n,name:LEVELS[i][1] as string,next:next?next[0] as number:null,nextName:next?next[1] as string:null,from:LEVELS[i][0] as number};
}
// how many pictures to choose from, by how often you heard the word (0 = listen more first)
function choiceCount(e){const h=e.heard||0;return h<2?0:h<5?4:h<9?3:2}
const shownChoices={};
function wordChoices(w){
  const e=S.lex[w],n=choiceCount(e);if(!n)return[];
  const kept=shownChoices[w];if(kept&&kept.includes(e.c))return kept; // keep what you are looking at
  const keys=Object.keys(CONCEPTS).filter(k=>k!==e.c),r=mulberry([...w].reduce((a,c)=>a*31+c.charCodeAt(0),n));
  const out=[e.c];while(out.length<n&&keys.length)out.push(keys.splice(Math.floor(r()*keys.length),1)[0]);
  shownChoices[w]=out.sort(()=>r()-.5);return shownChoices[w];
}
const guessWait={};
// one guess, from the language tab or from the little popup over a pip
function guessWord(w,c,p?){
  const e=S.lex[w];if(!e||e.ok)return null;
  if(guessWait[w]&&Date.now()<guessWait[w]){toast("רגע, הם עוד מבולבלים 😅");return null}
  if(c===e.c){learnWord(w,"guess");return true}
  guessWait[w]=Date.now()+15000;delete shownChoices[w];SFX.mood(440,"curious",.3);
  if(p){const r=rt(p);r.state="act";r.act="spin";r.ct=.8;say(p,"?",1.2,"snd","curious")}
  toast(pick(["לא זה 🙃 תקשיב עוד קצת","לא... הם מטים את הראש","כמעט! נסה שוב עוד מעט"]));
  return false;
}
function learnWord(w,how){
  const e=S.lex[w];if(!e||e.ok)return;
  const before=langLevel().name;
  e.ok=true;quest("decode");S.sparks+=8;S.stats.decoded=(S.stats.decoded||0)+1;goal("decode");if(S.stats.decoded===1)moment("word",null,w);
  SFX.level();
  toast(how==="taught"?`הפיפ הראה לך! "${w}" זה ${ICON[e.c]||""} ${CONCEPTS[e.c]} ‎+8`:`כן! "${w}" זה ${ICON[e.c]||""} ${CONCEPTS[e.c]} ‎+8`,1);
  S.pips.filter(p=>Object.values(p.lang).includes(w)).slice(0,6).forEach((p,i)=>setTimeout(()=>{if(byId(p.id)){say(p,w+"!",1.8,"lang","excited");const r=rt(p);if(r.state==="idle"){r.state="celebrate";r.ct=.8}}},i*180));
  const after=langLevel();if(after.name!==before){S.sparks+=15;setTimeout(()=>{SFX.level();toast(`רמה חדשה בשפת הפיפים: ${after.name}! ‎+15`,1)},1600)}
  delete shownChoices[w];langTouch=0;renderLangCount();if(tab==="lang")renderLang();if(sel)renderHead();dirty();
}
// called when a pip says a word: maybe it acts it out, and the bubble invites a guess
function wordSaid(p,w,c){
  const e=S.lex[w];if(!e||e.ok)return;
  const b=bubbleEls.get(p.id);
  if((p.trust??30)>=60&&(e.heard||0)>=4&&Math.random()<.12){
    if(b)b.textContent=`${w} ${ICON[c]||""}`;S.stats.taught=(S.stats.taught||0)+1;setTimeout(()=>learnWord(w,"taught"),900);return;
  }
  if(choiceCount(e)&&b){b.classList.add("ask");const r=rt(p);if(!r.said||performance.now()>r.said.until||r.said.w===w||!S.lex[r.said.w]||S.lex[r.said.w].ok)r.said={w,until:performance.now()+12000}}
}
function openWordGuess(p){
  const r=rt(p);if(!r.said||performance.now()>r.said.until)return false;
  const w=r.said.w,e=S.lex[w];r.said=null;if(!e||e.ok)return false;
  const m=popAt(p.x,p.y-14);
  m.innerHTML=`<h4>"${esc(w)}"</h4><p>מה ${esc(p.name)} אומר?</p><div class="wchoices">${wordChoices(w).map(c=>`<button class="btn" data-wguess="${c}" data-w="${esc(w)}" data-p="${p.id}">${ICON[c]||"?"}<small>${CONCEPTS[c]}</small></button>`).join("")}</div>`;
  return true;
}
function renderLangNew(){
  renderLangCount();langSig=langSignature();
  const L=langLevel(),ul=$("lexList"),ws=Object.keys(S.lex);
  const head=`<li class="langlvl"><b>${L.name}</b><span>${L.n===1?"מילה אחת":`${L.n} מילים`}${L.next!=null?` · עוד ${L.next-L.n} עד "${L.nextName}"`:""}</span><i><em style="width:${L.next!=null?Math.round((L.n-L.from)/(L.next-L.from)*100):100}%"></em></i></li>`;
  if(!ws.length){ul.innerHTML=head+`<li class="empty">עוד אין מילים. הם ממציאים מילים כשקורה להם משהו: אוכל, שינה, ליטוף, משחק 💬</li>`;return}
  const rows=ws.map(w=>({w,n:speakers(w),e:S.lex[w]})).sort((a,b)=>(a.e.ok-b.e.ok)||(b.n-a.n)||((b.e.heard||0)-(a.e.heard||0)));
  ul.innerHTML=head+rows.map(({w,n,e})=>{
    if(e.ok)return`<li class="lexi ok" data-w="${esc(w)}"><span class="lw">${esc(w)}</span><span class="meaning">${ICON[e.c]||""} ${CONCEPTS[e.c]}</span></li>`;
    const ch=n?wordChoices(w):[],h=e.heard||0;
    return`<li class="lexi${n?"":" dead"}" data-w="${esc(w)}"><span class="lw">${esc(w)}</span><span class="lm">${n?`👂 ${h}`:"נשכחה"}</span>`+
      (!n?"":ch.length?`<div class="wchoices">${ch.map(c=>`<button class="btn" type="button" data-wguess="${c}" data-w="${esc(w)}">${ICON[c]||"?"}<small>${CONCEPTS[c]}</small></button>`).join("")}</div>`:`<span class="lm" style="grid-column:1/-1">תקשיב עוד קצת. ${2-h===1?"עוד פעם אחת":`עוד ${2-h} פעמים`} ותוכל לנחש</span>`)+`</li>`}).join("");
}

/* the language tab must not jump around while you are choosing:
   when a word is heard again only the little numbers change; a full redraw waits until your
   pointer leaves the list or you have not touched it for a few seconds */
let langTouch=0,langSig="";
function langSignature(){return Object.keys(S.lex).map(w=>{const e=S.lex[w];return w+(e.ok?"1":"0")+(choiceCount(e)?"c":"")+(speakers(w)?"":"x")}).join("|")}
function langSoft(){
  const ul=$("lexList");if(!ul)return;
  for(const li of ul.querySelectorAll(".lexi[data-w]")){const e=S.lex[(li as HTMLElement).dataset.w];const h=li.querySelector(".lm");if(e&&!e.ok&&h&&/👂/.test(h.textContent))h.textContent=`👂 ${e.heard||0}`}
}
function langRefresh(){
  if(tab!=="lang")return;
  const sig=langSignature(),busy=Date.now()-langTouch<6000;
  if(sig===langSig||busy){langSoft();if(busy&&sig!==langSig){clearTimeout(lexT);lexT=setTimeout(langRefresh,1500)}return}
  langSig=sig;renderLangNew();
}
