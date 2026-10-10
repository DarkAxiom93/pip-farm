/* ================= boot ================= */
function boot(){
  let local=null;try{local=JSON.parse(localStorage.getItem(KEY))}catch(e){}
  if(local&&local.pips)hydrate(local);else freshState();
  catchUp();
  sel=S.pips[0].id;
  soundBtn();renderAll();curSeason=calcSeason();S.lastSeason=S.lastSeason||curSeason;$("hWeather").textContent=weatherLabel();clampCam();
  if(!local)setTimeout(()=>toast("הקש על פיפי כדי לענות לו. הקש שוב כדי ללטף"),900);
  if(!S.tipKeys&&matchMedia("(pointer:fine)").matches){S.tipKeys=1;setTimeout(()=>toast("טיפ: גלגלת לזום, גרירה להזזת המפה, חיצים ו-WASD לזוז, מקשים 1 עד 5 ללשוניות",1),local?4000:9000)}
  requestAnimationFrame(frame);
  storyInit();
  if(S.story.ending==="free"&&S.story.site){const today=dayKey(Date.now());if(S.story.note!==today){S.story.note=today;const a=pick(S.pips);if(a){S.drawings.push({x:S.story.site.x-14,y:S.story.site.y+12,k:pick(["heart","keeper","sun"]),by:a.id,name:a.name,t:Date.now(),away:0});setTimeout(()=>toast("הפיפים השאירו לך הודעה ליד השער",1),3000);dirty()}}}
  streakCheck();renderStreak();renderFocus();renderQuest();setTimeout(holidayTick,2500);
  if(pendingWelcome)setTimeout(()=>{welcome(pendingWelcome);pendingWelcome=0},800);
  if(platformBoot(local))return;
  if(!window.claude)return;
  (async()=>{
    try{
      const [d,u]=await Promise.all([claude.use("db"),claude.use("user")]);
      if(!d||!u)return;
      const id=await u.id();if(!id)return;
      db=d;userId=id;
      const snap=await db.doc("data/users/"+id+"/pipfarm").get();
      if(snap.exists){
        const remote=snap.data();
        if(!local||(remote.lastSeen||0)>(local.lastSeen||0)+5000){
          for(const el of needEls.values())el.remove();needEls.clear();choir=null;
          RT.clear();jobs.length=0;for(const k of [...bubbleEls.keys()])clearBubble(k);
          hydrate(remote);catchUp();sel=S.pips[0].id;soundBtn();renderAll();
        }
      }
      saveNow();
    }catch(e){}
  })();
  (async()=>{try{sample=await claude.use("sample")}catch(e){sample=null}voiceNote()})();
}
