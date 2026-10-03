/* platform: the Windows app. Saves go to a file, Claude goes through the user's API key,
   and pips show up on the desktop strip and in Windows notifications. */
let lastNotify=0;
function platformSave(d){try{pipDesktop.save(JSON.stringify(d))}catch(e){}}
function notify(title:string,body:string,force?:boolean){
  if(!force&&document.hasFocus())return;
  if(!force&&Date.now()-lastNotify<180000)return;lastNotify=Date.now();
  try{pipDesktop.notify(title,body)}catch(_){}
}
function deskSnapshot(){
  try{pipDesktop.snapshot({night,season:curSeason,pips:S.pips.slice(0,60).map(p=>({id:p.id,name:p.name,hue:Math.round(p.hue),sprout:p.sprout,g:p.g,mut:p.mut||null,elder:isElder(p),need:rt(p).need?rt(p).need.type:null,mood:Math.round(p.mood),sleep:rt(p).state==="sleep"}))})}catch(_){}
}
setInterval(deskSnapshot,2500);
pipDesktop.onCommand(cmd=>{if(cmd&&cmd.type==="flush"){saveNow();return}const p=cmd&&cmd.id&&byId(cmd.id);if(!p)return;audio();if(cmd.type==="tap")tapPip(p);else if(cmd.type==="open"){select(p.id,true)}deskSnapshot()});
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
      $("optBuddy").checked=!!st.buddy;$("optAuto").checked=!!st.autostart;$("optKeyNote").textContent=st.hasKey?"יש מפתח שמור. Claude פעיל":"אין מפתח. הפיפים מבינים לפי מילות מפתח";
    };
    $("deskSettings").hidden=false;await setupAI();
    $("optBuddy").onchange=e=>pipDesktop.setSettings({buddy:e.target.checked});
    $("optAuto").onchange=e=>pipDesktop.setSettings({autostart:e.target.checked});
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
