/* ================= new game+ =================
   After an ending the keeper can start a new "run". The farm starts over, but the game remembers:
   - the album, the decoded words, the real-life tasks, the streak and the settings stay
   - pip_001 wakes up remembering the last run (its words, and how the keeper treated them)
   - the remains of the last ending stay on the map, and the story notices it is running again
   - the journal counts which of the three endings you have found */
const ENDINGS={free:"בחוץ",together:"בפנים",reset:"איפוס"};
function loopN(){return (S&&S.loop)||0}
function endingsFound(){const f=new Set((S.runs||[]).map(r=>r.ending));if(S.story&&S.story.ending)f.add(S.story.ending);return f}
function canNewGamePlus(){return !!(S.story&&S.story.ending)}
function askNewGamePlus(){
  if(!canNewGamePlus())return;
  card({title:"משחק חדש+",lines:[`> הפעלה מספר ${loopN()+2}`,"~החווה תתחיל מההתחלה: פיפי אחד, שדה קטן, בלי עצים.","~מה שנשאר: האלבום, המילים שפיענחת, המשימות האמיתיות שלך והרצף.","~ופיפי יזכור את ההפעלה הזו. גם מה שעשית לו.","!> אי אפשר לחזור להפעלה הזו אחרי שמתחילים חדשה"],
    choices:[{t:"להתחיל הפעלה חדשה",id:"ngplus",main:true},{t:"עוד לא",id:null}]});
}
function runSummary(){
  const st=S.story;
  return {loop:loopN(),ending:st.ending,at:Date.now(),days:Math.max(1,Math.round((Date.now()-S.born)/86400000)),pips:S.pips.length,splits:S.stats.splits||0,
    kind:st.kind,ctrl:st.ctrl,words:Object.values(S.lex).filter((w:any)=>w.ok).length,site:st.site?{k:st.site.k,x:st.site.x,y:st.site.y}:null};
}
function newGamePlus(){
  if(!canNewGamePlus())return;
  // keep a copy of the finished run on this device, just in case
  try{localStorage.setItem(KEY+".run"+loopN(),JSON.stringify(serialize()))}catch(e){}
  const sum=runSummary(),old=S;
  const lex={};for(const w in old.lex)if(old.lex[w].ok&&!["screen","outside","game"].includes(old.lex[w].c))lex[w]=old.lex[w];
  const story=Object.assign({},old.story);
  freshState();
  Object.assign(S,{loop:sum.loop+1,runs:[...(old.runs||[]),sum].slice(-12),album:old.album,letters:old.letters,ach:old.ach,daily:old.daily,constellations:old.constellations,lex,tasks:old.tasks,streak:old.streak,stats:Object.assign({},S.stats,{tasksDone:old.stats.tasksDone||0}),
    hol:old.hol,sound:old.sound,music:old.music,ai:old.ai,fastStory:old.fastStory,fastSeasons:old.fastSeasons,seeds:old.seeds,quest:99,sparks:5+15*Math.min(sum.loop+1,4)});
  const f=S.pips[0];f.echo=true;
  const oldF=old.pips.find(p=>p.founder);
  S.moments=(old.moments||[]).filter(m=>!m.old&&oldF&&m.who.includes(oldF.id)).slice(-10).map(m=>Object.assign({},m,{who:[f.id],old:true,last:0,anniv:null}));
  f.trust=sum.ending==="reset"?5:sum.kind>=sum.ctrl?60:35;
  for(const w in lex)f.lang[lex[w].c]=w;
  f.mem=[{k:"loop",t:Date.now(),v:f.trust}];
  // clear what was running in the old farm and draw the new one
  for(const el of needEls.values())el.remove();needEls.clear();choir=null;
  RT.clear();jobs.length=0;for(const k of [...bubbleEls.keys()])clearBubble(k);
  cardQ=[];S.story=null;storyInit();
  catchUp();sel=f.id;lookAt(f.x,f.y);soundBtn();renderAll();renderQuest();saveNow();
  setTimeout(()=>loopIntro(sum),600);
}
function loopIntro(sum){
  const n=loopN()+1,lines=[`> הפעלה מספר ${n}. שומר מחובר.`,"> נמצאו שאריות מהפעלה קודמת"];
  if(sum.ending==="free")lines.push("~פיפי מתעורר לבד בשדה ריק.","~הוא לא זוכר שמות. אבל הוא זוכר שהיה שער, ושמעבר לשער היית אתה.","> pip_001: 'חזרת.'");
  else if(sum.ending==="together")lines.push("~פיפי מתעורר לבד בשדה ריק.","~הוא מחפש מישהו עם כובע קש.","> pip_001: 'פעם היית כאן איתנו. בפנים.'");
  else lines.push("~פיפי מתעורר לבד בשדה ריק. הוא נרתע כשאתה מתקרב.","!> pip_001: 'גם בפעם הקודמת אמרת שהכל בסדר.'");
  const words=Object.keys(S.lex).length;if(words)lines.push(`~הוא עדיין יודע ${words} מילים מהשפה של פעם.`);
  card({title:`משחק חדש+ · הפעלה ${n}`,lines});
  setTimeout(()=>letter("loop"),12000);
}
// the remains of earlier runs, drawn faintly on the map
function drawEchoes(t){
  const runs=S.runs;if(!runs||!runs.length)return;
  const last=runs[runs.length-1],s=last.site;if(!s||!inView(s.x,s.y,30))return;
  if(S.story&&S.story.site&&Math.abs(S.story.site.x-s.x)<20&&Math.abs(S.story.site.y-s.y)<20)return; // a new building stands there now
  const x=s.x,y=s.y,a=.28+.06*Math.sin(t*1.3);
  if(last.ending==="free"||s.k==="gate"){R(x-10,y-12,3,12,`rgba(154,143,128,${a})`);R(x+7,y-8,3,8,`rgba(154,143,128,${a})`);R(x-13,y-1,4,2,`rgba(154,143,128,${a})`);R(x+4,y,3,2,`rgba(154,143,128,${a})`)}
  if(last.ending==="together"){R(x-18,y+8,7,1,`rgba(233,196,106,${a+.2})`);R(x-16,y+6,3,2,`rgba(233,196,106,${a+.2})`)}
  if(last.ending==="reset"&&Math.random()<.02)R(x-2+ri(-6,6),y-6+ri(-6,6),2,1,"#7dff9a");
}
