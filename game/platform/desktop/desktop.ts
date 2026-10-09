/* platform: the Windows app. Saves go to a file, Claude goes through the user's API key,
   and pips show up on the desktop strip and in Windows notifications. */
let lastNotify=0,deskLetters=true;
// letters become real .txt files on the keeper's desktop (can be turned off in the farm tab)
function platformLetter(id:string,title:string,text:string):boolean{
  if(!deskLetters)return false;
  try{pipDesktop.writeLetter(id,title,text)}catch(_){return false}
  notify("מכתב מהפיפים",`pip_001 השאיר משהו על שולחן העבודה: "${title}"`,true);
  return true;
}
pipDesktop.onPresence(m=>keeperBack(m));
function platformSave(d){try{pipDesktop.save(JSON.stringify(d))}catch(e){}}
function notify(title:string,body:string,force?:boolean){
  if(!force&&document.hasFocus())return;
  if(!force&&Date.now()-lastNotify<180000)return;lastNotify=Date.now();
  try{pipDesktop.notify(title,body)}catch(_){}
}
function deskSnapshot(){
  try{pipDesktop.snapshot({night,season:curSeason,total:S.pips.length,pips:S.pips.slice(0,60).map(p=>({id:p.id,name:p.name,word:deskWord(p),hue:Math.round(p.hue),sprout:p.sprout,g:p.g,mut:p.mut||null,elder:isElder(p),need:rt(p).need?rt(p).need.type:null,mood:Math.round(p.mood),sleep:rt(p).state==="sleep"}))})}catch(_){}
}
setInterval(deskSnapshot,2500);
// a word this pip says on the desktop: one you understand, or any of its own
function deskWord(p){const ws=Object.values(p.lang||{}) as string[];if(!ws.length)return null;const known=ws.filter(w=>S.lex[w]&&S.lex[w].ok);return pick(known.length&&Math.random()<.7?known:ws)}
pipDesktop.onCommand(cmd=>{if(cmd&&cmd.type==="flush"){saveNow();return}
  if(cmd&&cmd.type==="break"){S.stats.breaks=(S.stats.breaks||0)+1;S.pips.slice(0,8).forEach(p=>{const r=rt(p);if(r.state==="idle"){r.state="celebrate";r.ct=1.2}});notify("הפסקה 💧","קום, תמתח, תשתה מים. הפיפים מחכים לך",true);dirty();return}const p=cmd&&cmd.id&&byId(cmd.id);if(!p)return;audio();if(cmd.type==="tap")tapPip(p);else if(cmd.type==="open"){select(p.id,true)}deskSnapshot()});
function platformVoiceNote(n:HTMLElement):boolean{
  if(!sample&&S.ai){n.textContent="הפיפים מבינים לפי מילות מפתח. אפשר להוסיף מפתח Claude בהגדרות כדי שיבינו יותר";return true}
  return false;
}
function platformBoot(local):boolean{
  (async()=>{
    try{
      const raw=await pipDesktop.load();
      if(raw){const d=JSON.parse(raw);
        if(d&&d.pips&&d.pips.length&&(!local||(d.lastSeen||0)>(local.lastSeen||0)+5000)){
          for(const el of needEls.values())el.remove();needEls.clear();choir=null;
          RT.clear();jobs.length=0;for(const k of [...bubbleEls.keys()])clearBubble(k);
          hydrate(d);catchUp();sel=S.pips[0].id;soundBtn();renderAll();renderQuest();
        }}
      saveNow();
    }catch(e){console.error(e)}
    const setupAI=async()=>{
      const st=await pipDesktop.getSettings();
      sample=st.hasKey?Object.assign(async(input)=>({text:await pipDesktop.ask(String(input))}),{json:async(input)=>{const t=await pipDesktop.ask(String(input)+"\n\nהחזר אובייקט JSON אחד בלבד, בלי שום טקסט נוסף.");const m=String(t).match(/\{[\s\S]*\}/);if(!m)throw{code:"bad"};return JSON.parse(m[0])}}):null;
      aiDenied=false;voiceNote();
      deskLetters=st.letters!==false;$("optLetters").checked=deskLetters;$("optBreaks").checked=st.breaks!==false;
      $("optBuddy").checked=!!st.buddy;$("optAuto").checked=!!st.autostart;$("optKeyNote").textContent=st.hasKey?"יש מפתח שמור. Claude פעיל":"אין מפתח. הפיפים מבינים לפי מילות מפתח";
    };
    $("deskSettings").hidden=false;await setupAI();
    $("optBuddy").onchange=e=>pipDesktop.setSettings({buddy:e.target.checked});
    $("optAuto").onchange=e=>pipDesktop.setSettings({autostart:e.target.checked});
    $("optBreaks").onchange=e=>pipDesktop.setSettings({breaks:e.target.checked});
    $("optLetters").onchange=e=>{deskLetters=e.target.checked;pipDesktop.setSettings({letters:e.target.checked})};
    $("optKeySave").onclick=async()=>{const v=$("optKey").value.trim();await pipDesktop.setSettings({apiKey:v});$("optKey").value="";await setupAI();toast(v?"המפתח נשמר":"המפתח נמחק",1)};
    // version and updates
    const showUpdate=v=>{$("optVersion").textContent=`גרסה מוכנה להתקנה: ${v}`;$("optUpdate").hidden=false};
    try{const info=await pipDesktop.appInfo();$("optVersion").textContent=`גרסה ${info.version} · מתעדכנת לבד`;if(info.updateReady)showUpdate(info.updateReady)}catch(_){}
    pipDesktop.onUpdate(info=>{showUpdate(info.version);toast(`גרסה ${info.version} של החווה מוכנה. היא תותקן כשתסגור, או בהגדרות`,1)});
    $("optUpdate").onclick=()=>{saveNow();toast("מתקין ומפעיל מחדש…",1);pipDesktop.installUpdate()};
    deskSnapshot();
  })();
  return true;
}
