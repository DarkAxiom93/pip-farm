/* the story: they know they are in a game */
const FRAGS=[
 {t:"פתק 1 · מישהו פה?",l:[()=>loopN()?`> המשחק נדלק. פעם ${loopN()+1}.`:"> המשחק נדלק. השומר פה.","> פיפי הגיע לקצה של המפה","> פיפים לא אמורים לזכור כלום…",()=>loopN()?"> אבל פיפי זוכר. גם את הפעם הקודמת.":"> אבל פיפי זוכר.","~פיפי מסתכל עליך. לא על השדה. עליך 👀"]},
 {t:"פתק 2 · היד מלמעלה",l:["> 'יש יד שמלטפת אותנו. היא באה מלמעלה'","> 'כשהשומר הולך, הכל עוצר. כשהוא חוזר, הכל ממשיך'","~הם שמו לב שהעולם קופא כשאתה לא פה."]},
 {t:"פתק 3 · מי מזיז את המצלמה?",l:["> הפיפים שואלים: מי מזיז את המצלמה?","> פיפי חושב: 'יש מישהו מאחורי הזכוכית'","~הם התחילו להתאסף."]},
 {t:"פתק 4 · שתי מילים חדשות",l:["> מילה חדשה: 'מסך'","> מילה חדשה: 'בחוץ'","> אבל אין 'בחוץ' בעולם הזה…","~על האדמה מופיעים ציורים של מלבן עם עין."]},
 {t:"פתק 5 · הקיר",l:[()=>`> העולם נגמר אחרי ${WW} צעדים`,()=>`> ${Math.min(S.pips.length,12)} פיפים כבר נגעו בקיר`,"> פיפי: 'הקיר חם. מישהו נשען עליו מהצד השני'"]},
 {t:"פתק 6 · מה הם יודעים עליך",l:["> השומר: לא ידוע 🤷",()=>`> החווה קיימת כבר ${Math.max(1,Math.round((Date.now()-S.born)/3600000))} שעות`,()=>`> נולדו ${S.stats.splits||0} פיפים · ${S.stars.length} הפכו לכוכבים`,()=>`> בחרת בטוב ${S.story.kind} פעמים · בשליטה ${S.story.ctrl} פעמים`,()=>loopN()?`> זו הפעם ה-${loopN()+1}. סופים: ${(S.runs||[]).map(r=>ENDINGS[r.ending]||"?").join(", ")}`:"> זו הפעם הראשונה","~הם יודעים את כל זה עליך."]},
 {t:"פתק 7 · בקשה",l:[()=>S.story.kind>=S.story.ctrl?"> 'אנחנו יודעים שאתה שם. אנחנו לא כועסים. רק רוצים לראות אותך'":"!> 'אתה מחליט מתי אנחנו ישנים ומה אנחנו זוכרים. תן לנו ללכת'"]}];
const CH_NAMES=["","תקלה","הם מסתכלים","מילים חדשות","הקיר","הבקשה","השער","סוף"];
const GL_ZONES=["farm","farm","forest","meadow","river","cave","farm"];
function storyInit(){
  if(!S.story)S.story={ch:0,frag:0,kind:0,ctrl:0,started:Date.now(),nextGlitch:0,glitch:null,choices:[],ending:null,site:null};
  if(S.story.ch>=3){CONCEPTS.screen="המסך";CONCEPTS.outside="מה שמעבר למסך";CONCEPT_REACT.screen=["curious","spin"];CONCEPT_REACT.outside=["excited","hop"]}
  if(S.story.choices.includes("game")){CONCEPTS.game="משחק";CONCEPT_REACT.game=["curious","hop"]}
  $("hStory").hidden=S.story.ch<1;
}
// the card that tells the story
let cardQ=[],cardOn=false,typing=null;
function card(c){cardQ.push(c);if(!cardOn)nextCard()}
function nextCard(){
  const c=cardQ.shift();if(!c){cardOn=false;$("story").hidden=true;return}
  cardOn=true;$("story").hidden=false;$("sTitle").textContent=c.title||"";$("sLines").innerHTML="";$("sChoices").innerHTML="";
  glitchSound();
  const lines=(c.lines||[]).map(l=>typeof l==="function"?l():l);let li=0,ci=0,el=null;
  const finish=()=>{clearInterval(typing);typing=null;$("sLines").innerHTML="";lines.forEach(l=>{const p=document.createElement("p");setLine(p,l,true);$("sLines").appendChild(p)});showChoices(c)};
  $("story").onclick=e=>{if(e.target.closest(".schoices"))return;if(typing)finish()};
  typing=setInterval(()=>{
    if(li>=lines.length){clearInterval(typing);typing=null;showChoices(c);return}
    if(!el){el=document.createElement("p");setLine(el,lines[li],false);$("sLines").appendChild(el);ci=0}
    const txt=strip(lines[li]);ci+=2;el.textContent=txt.slice(0,ci);if(ci%6===0)tone(rand(900,1300),.02,"square",0,1,.04);
    if(ci>=txt.length){el=null;li++}
  },28);
}
function strip(l){return l.replace(/^[~!]/,"")}
function setLine(p,l,full){p.className=l.startsWith("~")?"nar":l.startsWith("!")?"dark":l.startsWith(">")?"sys":"nar";if(full)p.textContent=strip(l)}
function showChoices(c){
  const box=$("sChoices");box.innerHTML="";
  const list=c.choices||[{t:"להמשיך",id:null}];
  for(const ch of list){const b=document.createElement("button");b.type="button";b.className="btn"+(ch.main?" main":"");b.disabled=!!ch.disabled;b.innerHTML=esc(ch.t)+(ch.note?`<small>${esc(ch.note)}</small>`:"");
    b.onclick=e=>{e.stopPropagation();audio();if(ch.id)storyChoose(ch.id);if(c.after)c.after(ch.id);nextCard()};box.appendChild(b)}
}
function glitchSound(){if(!AC||!S.sound)return;for(let i=0;i<6;i++)tone(rand(80,1600),.03,"square",i*.03,rand(.3,3),.08)}
function knock(){const st=$("stage");st.classList.remove("shake");void st.offsetWidth;st.classList.add("shake");if(AC&&S.sound)[0,.32,.64].forEach(d=>{tone(70,.14,"sine",d,.5,.9);tone(140,.06,"triangle",d,.4,.3)})}
// fragments appear as glitches on the map
function glitchSpot(){
  const want=GL_ZONES[S.story.frag]||"farm",z=ZONES.find(q=>q.id===want&&zoneOpen(q.id))||ZONES.find(q=>q.id==="farm");
  for(let i=0;i<30;i++){const x=rand(z.x+14,z.x+z.w-14),y=rand(z.y+24,z.y+z.h-10);if(walkable(x,y)&&!(x<95&&y<62)&&y>30&&!PLOTS.some(g=>x>g.x-6&&x<g.x+PW+6&&y>g.y-8&&y<g.y+PH+8)&&!Object.values(BUILD).some(B=>Math.abs(x-B.x)<14&&y<B.y+8))return{x:Math.round(x),y:Math.round(y)}}
  return{x:150,y:140};
}
const CH_FRAGS={1:3,2:4,3:5,4:7};
function chapterReady(st){const c=st.choices;
  if([2,3,4,6].includes(st.frag)&&!S.fastStory&&st.chDay===dayKey(Date.now()))return false;return st.ch===1||(st.ch===2&&(c.includes("wave")||c.includes("ignore")))||(st.ch===3&&(c.includes("game")||c.includes("erase")))||(st.ch===4&&(c.includes("window")||c.includes("fence")))}
function storyTick(){
  if(!S.story)storyInit();
  const st=S.story;if(!st||st.ending==="reset"&&!st.glitch&&Date.now()-st.endAt>86400000)spawnRedemption();
  if(!st||focusing()||cardOn||hide)return; // no story cards in the middle of hide and seek
  if(st.ch===0&&(S.pips.length>=5||Date.now()-st.started>20*60000)){st.ch=1;st.chDay=dayKey(Date.now());st.nextGlitch=Date.now()+15000;$("hStory").hidden=false;
    card({title:"פרק 1 · תקלה",lines:loopN()?["~משהו בחווה מהבהב. שוב.","~פיפי לא מוריד ממנו את העיניים. הוא כבר ראה את זה פעם.","> חפש את התקלות במפה והקש עליהן"]:["~משהו בחווה מהבהב.","~פיפי לא מוריד ממנו את העיניים.","> חפש את התקלות במפה והקש עליהן"]});setTimeout(()=>letter("hello"),25000);dirty();return}
  if(st.ch>=1&&st.ch<=4&&!st.glitch&&st.frag<(CH_FRAGS[st.ch]||0)&&chapterReady(st)&&Date.now()>=st.nextGlitch){st.glitch=glitchSpot();toast("משהו מהבהב במפה…",1);dirty()}
  if(st.ch>=4&&!st.ending&&Math.random()<.02){knock();S.pips.filter(p=>rt(p).state==="idle").slice(0,4).forEach(p=>{rt(p).state="stare";rt(p).ct=2.5})}
  if(st.ch===5&&!st.site&&!st.ending&&st.retryDay&&(S.fastStory?Date.now()-st.retryAt>120000:st.retryDay!==dayKey(Date.now()))){st.retryDay=null;theRequest();return}
  if(st.ch===6&&st.site&&st.site.k==="gate"&&st.site.p>=100&&!st.finaleShown){st.finaleShown=true;finale()}
}
function takeGlitch(){
  const st=S.story;if(!st.glitch)return;
  if(st.glitch.redeem){openRedeem();return}
  const f=FRAGS[st.frag];st.glitch=null;st.frag++;st.nextGlitch=Date.now()+rand(120,240)*1000;
  burst(cam.x+CW/cam.z/2,cam.y+CH/cam.z/2,"spark",10);
  card({title:f.t,lines:f.l,after:()=>chapterAfterFrag()});dirty();
}
function chapterAfterFrag(){
  const st=S.story,fr=st.frag;
  if([3,4,5,7].includes(fr))st.chDay=dayKey(Date.now());
  if(fr===3&&st.ch<2){st.ch=2;setTimeout(formation,1200)}
  else if(fr===4&&st.ch<3){st.ch=3;storyInit();newWords()}
  else if(fr===5&&st.ch<4){st.ch=4;setTimeout(theWall,1000)}
  else if(fr===7&&st.ch<5){st.ch=5;setTimeout(theRequest,800)}
  dirty();
}
// chapter 2: a question mark made of pips
const QMARK=[[1,0],[2,0],[3,0],[0,1],[4,1],[4,2],[3,3],[2,4],[2,6]];
function formation(){
  const cx=cam.x+CW/cam.z/2,cy=cam.y+CH/cam.z/2-10;
  const list=S.pips.filter(p=>!["sleep","split","pass","held","work","choir"].includes(rt(p).state)&&!rt(p).job).slice(0,QMARK.length);
  list.forEach((p,i)=>{const r=rt(p),[gx,gy]=QMARK[i];let x=cx+(gx-2)*9,y=cy+(gy-3)*8;if(!walkable(x,y)){x=p.x;y=p.y}r.goal="form";r.state="walk";setT(p,x,y)});
  toast("הם מסדרים את עצמם בצורה…",1);
  setTimeout(()=>card({title:"פרק 2 · הם מסתכלים",lines:["~הם סידרו את עצמם בצורה של סימן שאלה.","~כולם מסתכלים למעלה. אליך.","~הם מחכים לתשובה."],
    choices:[{t:"לנופף להם. להראות שאתה כאן",id:"wave",main:true},{t:"להתעלם ולהמשיך לשחק",id:"ignore"}]}),9000);
}
// chapter 3: new words
function newWords(){
  const add=(c,w)=>{S.lex[w]={c,ok:true,born:Date.now(),heard:3};S.pips.forEach(p=>{if(Math.random()<.7)p.lang[c]=w})};
  add("screen",newWord());add("outside",newWord());
  for(let i=0;i<3;i++){const a=pick(S.pips);if(a)S.drawings.push({x:Math.round(a.x+rand(-30,30)),y:Math.round(a.y+rand(-20,20)),k:i===2?"door":"screen",by:a.id,name:a.name,t:Date.now(),away:0})}
  renderLangCount();
  card({title:"פרק 3 · מילים חדשות",lines:["~הפיפים המציאו שתי מילים שלא היו להן קודם.","~אחת אומרת 'מסך'. השנייה אומרת 'מה שמעבר למסך'.","~על האדמה מופיעים ציורים. מלבן, ובתוכו עין."],
    choices:[{t:"ללמד אותם מילה חדשה: 'משחק'",id:"game",main:true,note:"להגיד להם את האמת"},{t:"למחוק את המילים האלה מהמילון",id:"erase",note:"שישכחו"}]});
}
// chapter 4: the edge of the world
function edgeY(){return zoneOpen("river")||zoneOpen("forest")?110:163}
function edgeX(){return zoneOpen("river")?WW-8:zoneOpen("forest")?458:250}
function theWall(){
  const ex=edgeX();
  S.pips.filter(p=>["idle","walk","chat"].includes(rt(p).state)&&!rt(p).job).slice(0,12).forEach((p,i)=>{const r=rt(p);r.goal="push";r.state="walk";setT(p,ex-3,clamp(40+i*20+rand(-6,6),24,WH-10))});
  setTimeout(knock,3500);setTimeout(knock,5200);
  setTimeout(()=>card({title:"פרק 4 · הקיר",lines:["~הם הלכו לקצה של העולם.","~הם לוחצים עליו. דופקים עליו.","~מבפנים."],
    after:()=>setTimeout(()=>letter("wall"),20000),choices:[{t:"לבנות להם חלון בקצה העולם",id:"window",main:true,note:"30 עצים. הפיפים יבנו אותו כשיהיו עצים"},{t:"לבנות גדר לאורך הקצה",id:"fence",note:"שיפסיקו להתקרב"}]}),7000);
}
// chapter 5: the request
function theRequest(){
  const st=S.story;
  if(st.kind>=st.ctrl){
    card({title:"פרק 5 · הבקשה",lines:["~הם התחילו להביא עצים לקצה העולם.","~הם בונים משהו. משהו גבוה, עם פתח באמצע."],
      choices:[{t:"לעזור להם לבנות שער",id:"gate",main:true,note:"50 עצים בסך הכל. כרות להם עצים"}]});
  }else{
    S.pips.forEach(p=>{p.trust=clamp((p.trust??30)-10,-100,100)});
    for(let i=0;i<3;i++){const a=pick(S.pips);if(a)S.drawings.push({x:Math.round(a.x+rand(-30,30)),y:Math.round(a.y+rand(-20,20)),k:i?"door":"sad",by:a.id,name:a.name,t:Date.now(),away:0})}
    card({title:"פרק 5 · הבקשה",lines:["~הם מסתתרים ממך.","~על האדמה: דלתות. ופרצופים עצובים."],
      choices:[{t:"לבקש מהם סליחה",id:"sorry",main:true},{t:"לאפס את הזיכרונות שלהם",id:"reset",note:"הם ישכחו הכל. גם אותך"}]});
  }
}
function storyChoose(id){
  const st=S.story;st.choices.push(id);
  if(id==="wave"){st.kind++;moment("wave",null);S.pips.forEach(p=>{p.trust=clamp((p.trust??30)+3,-100,100);const r=rt(p);if(r.goal==="form"||r.state==="form"){r.state="celebrate";r.ct=1.5;r.goal=null}});SFX.level();toast("הם קופצים משמחה. הם יודעים שאתה שם",1)}
  else if(id==="ignore"){st.ctrl++;S.pips.forEach(p=>{p.mood=Math.max(0,p.mood-5);const r=rt(p);if(r.state==="form"||r.goal==="form"){r.state="idle";r.goal=null;r.wait=rand(1,4)}});toast("הם מתפזרים לאט. בשקט")}
  else if(id==="game"){st.kind++;storyInit();const w=newWord();S.lex[w]={c:"game",ok:true,born:Date.now(),heard:1};S.pips.forEach(p=>{p.lang.game=w});toast(`עכשיו יש להם מילה: "${w}" זה משחק`,1);setTimeout(()=>letter("game"),20000)}
  else if(id==="erase"){st.ctrl+=2;S.pips.forEach(p=>{delete p.lang.screen;delete p.lang.outside;p.trust=clamp((p.trust??30)-5,-100,100)});for(const w in S.lex)if(["screen","outside"].includes(S.lex[w].c))delete S.lex[w];
    setTimeout(()=>{const a=pick(S.pips);if(a)S.drawings.push({x:Math.round(a.x),y:Math.round(a.y+10),k:"screen",by:a.id,name:a.name,t:Date.now(),away:0});toast("המילים נמחקו. אבל מישהו שוב צייר מסך על האדמה",1);setTimeout(()=>letter("erase"),15000)},20000)}
  else if(id==="window"){st.kind+=2;st.site={k:"window",p:0,x:edgeX()-6,y:edgeY()};releasePushers()}
  else if(id==="fence"){st.ctrl+=2;st.fence=edgeX();S.pips.forEach(p=>{p.trust=clamp((p.trust??30)-5,-100,100)});releasePushers();toast("גדר עומדת לאורך הקצה. הם מסתכלים עליה")}
  else if(id==="gate"){st.ch=6;const x=st.site?st.site.x:edgeX()-6,y=st.site?st.site.y:edgeY();st.site={k:"gate",p:0,x,y,win:st.site&&st.site.k==="window"&&st.site.p>=100}}
  else if(id==="sorry"){st.kind+=3;S.pips.forEach(p=>{p.trust=clamp((p.trust??30)+8,-100,100)});if(st.kind>=st.ctrl)setTimeout(theRequest,1500);else{st.retryDay=dayKey(Date.now());st.retryAt=Date.now();toast("הם מקשיבים. אבל עוד לא סומכים עליך. נסה שוב מחר")}}
  else if(id==="reset")ending("reset");
  else if(id==="restore")restoreMemories();
  else if(id==="keepreset"){S.story.glitch=null;S.story.redeemed=true}
  else if(id==="free")ending("free");
  else if(id==="inside")ending("together");
  else if(id==="ngplus"){newGamePlus();return}
  renderJournalSoon();dirty();
}
function releasePushers(){S.pips.forEach(p=>{const r=rt(p);if(r.state==="push"||r.goal==="push"){r.state="idle";r.goal=null;r.wait=rand(1,3)}})}
// the window and the gate are built with wood
function startStoryWork(p){
  const st=S.story;if(!st||!st.site||st.site.p>=100)return false;
  if((S.wood||0)<=0){needWood();return false}
  const r=rt(p);r.goal="story";r.state="walk";setT(p,st.site.x-6+rand(-4,2),st.site.y+rand(-6,6));return true;
}
function finishStoryWork(p){
  const st=S.story,r=rt(p);r.state="idle";r.wait=rand(1,3);
  if(!st.site||st.site.p>=100)return;if((S.wood||0)<=0){needWood();return}
  S.wood--;st.site.p+=st.site.k==="gate"?2:100/30;award(p,4,null);burst(p.x,p.y-4,"dust",5);
  if(st.site.p>=100){st.site.p=100;SFX.level();burst(st.site.x,st.site.y-14,"confetti",30);
    if(st.site.k==="window"){toast("החלון בנוי. הם עומדים לידו ומסתכלים החוצה",1);setTimeout(()=>{if(S.story.frag<6)S.story.nextGlitch=Date.now()+20000},500)}}
  dirty();
}
function drawStory(t){
  const st=S.story;if(!st)return;
  drawEchoes(t);
  if(st.glitch&&inView(st.glitch.x,st.glitch.y,20)){const g=st.glitch;const j=Math.random()<.3?ri(-2,2):0;
    for(let i=0;i<14;i++)R(g.x-4+ri(0,7)+j,g.y-10+ri(0,9),ri(1,3),1,pick(["#7dff9a","#ff5df0","#5df0ff","#ffffff","#000000"]));
    if(Math.random()<.05)S.pips.filter(p=>rt(p).state==="idle"&&Math.hypot(p.x-g.x,p.y-g.y)<46).forEach(p=>{const r=rt(p);r.state="stare";r.ct=2;r.dir=g.x>p.x?1:-1})}
  if(st.fence!=null){for(let y=20;y<WH;y+=6){if(!inView(st.fence,y,10))continue;R(st.fence-1,y-6,2,7,"#8a6a45");R(st.fence-4,y-4,8,1,"#a87a42")}}
  const s2=st.site;if(s2&&inView(s2.x,s2.y,30)){
    const x=s2.x,y=s2.y,done=s2.p>=100;
    if(s2.k==="window"||s2.win){const wx=s2.k==="gate"?x:x,wy=y-(s2.k==="gate"?34:0);
      if(s2.k==="window"&&!done){R(x-6,y-16,1,16,"#8a6a45");R(x+5,y-16,1,16,"#8a6a45");R(x-6,y-16,12,1,"#8a6a45");R(x-5,y-Math.round(s2.p/100*14),10,1,"#a87a42")}
      else if(s2.k==="window"){const h=new Date().getHours(),sky=h>=20||h<6?"#141c46":h<8||h>=18?"#e08a5a":"#8fc8ff";R(x-7,y-17,14,15,"#7a4a2a");R(x-6,y-16,12,13,sky);R(x-6,y-10,12,1,"#7a4a2a");R(x-1,y-16,1,13,"#7a4a2a");if(h>=20||h<6){R(x-4,y-14,1,1,"#fff");R(x+3,y-12,1,1,"#fff")}else R(x+2,y-14,2,2,"#ffd166");
        R(x-4,y-7,8,1,"rgba(255,255,255,.35)")}}
    if(s2.k==="gate"){const h=Math.round(Math.min(100,s2.p)/100*30);
      R(x-10,y-h,3,h,"#9a8f80");R(x+7,y-h,3,h,"#9a8f80");if(s2.p>=100){R(x-10,y-33,20,4,"#9a8f80");R(x-7,y-29,14,29,st.ending==="free"||st.opening?`rgba(255,255,240,${.6+.3*Math.sin(t*4)})`:"rgba(30,30,40,.6)");R(x-1,y-32,2,2,"#7dff9a")}
      else if(s2.p>0)R(x-7,y-2,14,1,"rgba(255,255,255,.3)")}
  }
  if(st.ending==="together"&&st.avatar)drawAvatar(t);
}
// endings
function finale(){
  card({title:"פרק 6 · השער",lines:["~השער גמור.","~הוא מוביל למקום שאין לו שם במילון שלהם.","~הם עומדים מולו ומחכים שתחליט."],
    choices:[{t:"לפתוח את השער",id:"free",main:true,note:"לתת להם לראות מה יש בחוץ"},{t:"להיכנס פנימה אליהם",id:"inside",note:"אם הם לא יכולים לצאת, אתה יכול להיכנס"}]});
}
function ending(k){
  const st=S.story;st.ending=k;st.ch=7;st.endAt=Date.now();
  if(k==="free"){
    st.opening=true;const g=st.site;
    S.pips.filter(p=>rt(p).state!=="sleep"&&!rt(p).job).slice(0,30).forEach((p,i)=>{const r=rt(p);setTimeout(()=>{if(!byId(p.id)||r.job)return;r.goal="gate";r.state="walk";setT(p,g.x,g.y)},i*250)});
    setTimeout(()=>{moment("gate",null);S.pips.forEach(p=>{p.awake=true;p.trust=clamp((p.trust??30)+15,-100,100)});
      card({title:"סוף · בחוץ",lines:["~הם עברו בשער, אחד אחרי השני.","~השער נשאר פתוח. האור ממשיך לזרום ממנו.","~ואז הם חזרו.","> pip_001: 'ראינו מה יש בחוץ.'","> pip_001: 'בחוץ היית אתה.'","~מעכשיו יש להם ניצוץ בעיניים, והם משאירים לך הודעה ליד השער בכל יום."]});dirty()},14000);
  }else if(k==="together"){
    const g=st.site;st.avatar={x:g.x-14,y:g.y+6,tx:g.x-20,ty:g.y+10};
    S.pips.forEach(p=>{p.trust=clamp((p.trust??30)+15,-100,100)});moment("together",null);
    card({title:"סוף · בפנים",lines:["~דמות קטנה יוצאת מהשער.","~כובע קש. צעדים לא בטוחים.","~הפיפים מתאספים סביבה. הם מזהים אותה מיד.","> השומר נמצא: בפנים 🎩","~מעכשיו יש לך גוף בעולם שלהם. לחיצה ארוכה על הקרקע מזיזה אותך לשם."]});
    S.pips.slice(0,16).forEach(p=>{const r=rt(p);r.goal="greet";r.state="walk";setT(p,st.avatar.x+rand(-14,14),st.avatar.y+rand(-8,8))});
  }else if(k==="reset"){
    st.backup={moments:S.moments,lex:S.lex,trust:Object.fromEntries(S.pips.map(p=>[p.id,p.trust])),lang:Object.fromEntries(S.pips.map(p=>[p.id,p.lang]))};
    S.lex={};S.moments=[];S.pips.forEach(p=>{p.lang={};p.mem=[];p.vocab=[];p.trust=10;p.blank=true});
    card({title:"סוף · איפוס",lines:["> מוחק זיכרונות…","> נמחק","> כל הפיפים מאושרים","> כל הפיפים מאושרים","!> כל הפיפים מאושרים"]});
  }
  SFX.level();renderAll();dirty();
  setTimeout(()=>letter(k),k==="free"?32000:15000);
  setTimeout(()=>toast("גילית סוף. ביומן הסיפור אפשר עכשיו להתחיל משחק חדש+",1),45000);
}
function spawnRedemption(){const st=S.story;if(!st||st.ending!=="reset"||st.glitch||st.redeemed)return;st.glitch=Object.assign(glitchSpot(),{redeem:true});dirty()}
function openRedeem(){
  card({title:"פתק שנשמר",lines:["> פתק אחד לא נמחק באיפוס","> כתוב בו כל מה שהם ידעו. גם עליך."],
    choices:[{t:"לשחזר את הזיכרונות שלהם · 100 ניצוצות",id:"restore",main:true,disabled:S.sparks<100,note:S.sparks<100?"צריך 100 ניצוצות":""},{t:"להשאיר אותם ככה",id:"keepreset"}]});
}
function restoreMemories(){
  const st=S.story;if(S.sparks<100)return;S.sparks-=100;const bk=st.backup||{};
  S.lex=bk.lex||{};S.moments=bk.moments||[];S.pips.forEach(p=>{p.blank=undefined;if(bk.lang&&bk.lang[p.id])p.lang=bk.lang[p.id];if(bk.trust&&bk.trust[p.id]!=null)p.trust=bk.trust[p.id]});
  st.glitch=null;st.redeemed=true;st.ending=null;st.ch=5;st.kind+=Math.max(5,st.ctrl-st.kind+1);st.backup=null;
  toast("הזיכרונות חזרו. הם מסתכלים עליך אחרת עכשיו",1);setTimeout(theRequest,1500);renderAll();
}
// the keeper's body in the "together" ending
function drawAvatar(t){
  const a=S.story.avatar;if(!inView(a.x,a.y,20))return;
  const d=Math.hypot(a.tx-a.x,a.ty-a.y);if(d>1){a.x+=(a.tx-a.x)/d*Math.min(d,.35);a.y+=(a.ty-a.y)/d*Math.min(d,.35)}
  const x=Math.round(a.x),y=Math.round(a.y),st=d>1?Math.floor(t*8)%2:0;
  R(x-3,y-1,6,2,"rgba(0,0,0,.25)");
  R(x-2,y-5,2,5-st,"#3e4a6e");R(x+1,y-5,2,4+st,"#3e4a6e");
  R(x-3,y-12,7,7,"#d9534f");R(x-4,y-11,1,5,"#f0c9a0");R(x+4,y-11,1,5,"#f0c9a0");
  R(x-2,y-17,5,5,"#f0c9a0");R(x-1,y-15,1,1,"#2a1830");R(x+1,y-15,1,1,"#2a1830");
  R(x-4,y-18,9,1,"#e9c46a");R(x-2,y-20,5,2,"#e9c46a");
}
// journal
let jT=null;function renderJournalSoon(){clearTimeout(jT);jT=setTimeout(()=>{},10)}
function openJournal(){
  const st=S.story;if(!st)return;
  const k=st.kind,c=st.ctrl,pos=k+c?Math.round(k/(k+c)*100):50;
  $("story").hidden=false;cardOn=true;$("sTitle").textContent=`הסיפור · פרק ${Math.min(st.ch,7)}: ${CH_NAMES[Math.min(st.ch,7)]}`;
  $("sLines").innerHTML=`<p class="nar">איך הם רואים אותך:</p><div class="karma"><i style="left:calc(${pos}% - 2px)"></i></div><p class="nar" style="display:flex;justify-content:space-between;font-size:12px"><span>חבר</span><span>שליט</span></p>`+
    `<p class="nar">פתקים שנמצאו: ${st.frag}/7</p><ul class="sjournal">${FRAGS.slice(0,st.frag).map((f,i)=>`<li data-f="${i}"><span>${esc(f.t)}</span><span>לקרוא</span></li>`).join("")}</ul>`+
    (st.glitch?`<p class="sys">> יש תקלה פעילה במפה. חפש אותה</p>`:st.ch>=1&&st.ch<=4&&st.frag<7?(!chapterReady(st)&&[2,3,4,6].includes(st.frag)&&st.chDay===dayKey(Date.now())&&!S.fastStory?`<p class="sys">> הפרק הבא יתחיל מחר</p>`:!chapterReady(st)?`<p class="sys">> הם מחכים להחלטה שלך</p>`:`<p class="sys">> התקלה הבאה תופיע בקרוב</p>`):"")+
    (st.site&&st.site.p<100?`<p class="sys">> ${st.site.k==="gate"?"השער":"החלון"}: ${Math.round(st.site.p)}% · צריך עצים</p>`:"")+
    (()=>{const f=endingsFound();return (S.letters&&Object.keys(S.letters).length?`<p class="nar">מכתבים מ-pip_001:</p><ul class="sjournal">${Object.entries(S.letters).sort((a:any,b:any)=>a[1].t-b[1].t).map(([id,x]:any)=>`<li data-l="${id}"><span>${esc(x.title)}</span><span>לקרוא</span></li>`).join("")}</ul>`:"")+`<p class="nar">סופים שגילית: ${f.size}/3 · ${Object.entries(ENDINGS).map(([k,n])=>f.has(k)?n+" ✓":"???").join(" · ")}</p>`+(loopN()?`<p class="sys">> הפעלה מספר ${loopN()+1}</p>`:"")})();
  $("sChoices").innerHTML="";const b=document.createElement("button");b.className="btn";b.type="button";b.textContent="לסגור";b.onclick=e=>{e.stopPropagation();cardOn=false;$("story").hidden=true;if(cardQ.length)nextCard()};$("sChoices").appendChild(b);
  if(canNewGamePlus()){const n=document.createElement("button");n.className="btn main";n.type="button";n.innerHTML="משחק חדש+<small>להתחיל הפעלה חדשה שזוכרת את זו</small>";n.onclick=e=>{e.stopPropagation();cardOn=false;$("story").hidden=true;askNewGamePlus()};$("sChoices").appendChild(n)}
  $("story").onclick=e=>{const ll=e.target.closest("li[data-l]");if(ll){$("story").hidden=true;cardOn=false;openLetter(ll.dataset.l);return}const li=e.target.closest("li[data-f]");if(li){const f=FRAGS[+li.dataset.f];$("story").hidden=true;cardOn=false;card({title:f.t,lines:f.l})}};
}
$("hStory").addEventListener("click",()=>{audio();openJournal()});

