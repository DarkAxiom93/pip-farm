/* ================= the composer =================
   An 8x8 grid in the farm tab: each column is a beat, each row a note. Tap to place notes,
   play it and the pips sing it (each note by a different pip, hopping), save it and it joins
   the background music: now and then the tune is yours, and the pips hum it too. */
const COMP_ROWS=8,COMP_STEPS=8;
let comp=Array(COMP_STEPS).fill(-1),compPlaying=false;
function compNoteF(v,oct=0){return 392*Math.pow(2,MUS_PENTA[v]/12+oct)}
function renderComposer(){
  const el=$("composerBox");if(!el)return;S.songs=S.songs||[];
  let grid=`<div class="comp" role="grid" aria-label="מלחין">`;
  for(let r=COMP_ROWS-1;r>=0;r--)for(let c=0;c<COMP_STEPS;c++)grid+=`<button type="button" class="cc${comp[c]===r?" on":""}${c%4===0?" bt":""}" data-cc="${c}" data-cr="${r}" aria-label="צעד ${c+1} תו ${r+1}"></button>`;
  grid+=`</div>`;
  el.innerHTML=grid+`<div class="row" style="margin-top:6px;gap:6px"><button class="btn main" type="button" data-comp="play">▶ לנגן</button><button class="btn" type="button" data-comp="save" ${comp.some(v=>v>=0)&&S.songs.length<6?"":"disabled"}>לשמור</button><button class="btn" type="button" data-comp="clear">לנקות</button></div>`+
    (S.songs.length?`<ul class="mem" style="margin-top:6px">${S.songs.map((s,i)=>`<li><span>♫ ${esc(s.n)}</span><small><button class="linkbtn" type="button" data-comp="load" data-i="${i}">לטעון</button> · <button class="linkbtn" type="button" data-comp="del" data-i="${i}">למחוק</button></small></li>`).join("")}</ul><p class="albtop" style="margin-top:4px">השירים שלך מתנגנים לפעמים במוזיקת הרקע, והפיפים מזמזמים אותם</p>`:`<p class="albtop" style="margin-top:6px">הקש על הריבועים כדי לכתוב מנגינה. כל עמודה היא צעד, כל שורה תו</p>`);
}
function compClick(b){
  audio();
  if(b.dataset.cc!=null){const c=+b.dataset.cc,r=+b.dataset.cr;comp[c]=comp[c]===r?-1:r;if(comp[c]>=0)tone(compNoteF(r),.18,"triangle",0,1.02,.3);renderComposer();return}
  const a=b.dataset.comp;
  if(a==="play")playSong(comp);
  else if(a==="clear"){comp=Array(COMP_STEPS).fill(-1);renderComposer()}
  else if(a==="save"){S.songs=S.songs||[];if(S.songs.length>=6)return;const s={n:`שיר ${(S.stats.songs||0)+1}`,m:comp.slice(),t:Date.now()};S.songs.push(s);S.stats.songs=(S.stats.songs||0)+1;
    toast(`נשמר: ${s.n}. הוא יתנגן לפעמים ברקע`,1);moment("song",null,s.n);renderComposer();dirty()}
  else if(a==="load"){const s=S.songs[+b.dataset.i];if(s){comp=s.m.slice();renderComposer();playSong(comp)}}
  else if(a==="del"){S.songs.splice(+b.dataset.i,1);renderComposer();dirty()}
}
// the pips in view sing it, one note each
function playSong(m){
  if(compPlaying||!m.some(v=>v>=0))return;compPlaying=true;
  const singers=S.pips.filter(p=>!["sleep","held","pass","hidden"].includes(rt(p).state)&&inView(p.x,p.y,-10)).slice(0,8);
  const step=.32;
  m.forEach((v,i)=>setTimeout(()=>{
    if(v<0)return;const p=singers.length?singers[i%singers.length]:null;
    const oct=p?Math.max(-1,Math.min(1,Math.round(Math.log2(p.pitch/640)))):0;
    tone(compNoteF(v,oct),step*.9,digi()>.5?"square":"triangle",0,1.02,digi()>.5?.15:.3);
    if(p){const r=rt(p);if(r.state==="idle"||r.state==="walk"){r.state="celebrate";r.ct=.35}parts.push({x:p.x,y:p.y-12,vx:rand(-4,4),vy:-18,life:1,kind:"note"})}
    const el=document.querySelectorAll(`#composerBox [data-cc="${i}"]`);el.forEach(e=>e.classList.add("hit"));setTimeout(()=>el.forEach(e=>e.classList.remove("hit")),step*900);
  },i*step*1000));
  setTimeout(()=>{compPlaying=false},m.length*step*1000+200);
  S.stats.songsPlayed=(S.stats.songsPlayed||0)+1;
}
// background music picks a saved song as its motif now and then (see 07-music)
function songMotif(){const ss=S.songs||[];if(!ss.length||Math.random()>.35)return null;return pick(ss).m.slice()}
