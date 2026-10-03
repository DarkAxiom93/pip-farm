/* ================= outside the game =================
   The pips know they are in a game, so now and then they reach past it:
   - letters: at big moments pip_001 writes to the keeper. In the Windows app the letter is a real
     .txt file on the desktop; everywhere it is also kept in the story journal
   - they notice the clock: late at night they yawn and send the keeper to bed
   - in the Windows app they notice when the keeper comes back to the computer after a break
   - from chapter 4 the window title glitches for a moment */
const LETTERS={
  hello:{t:"שלום",l:()=>[`${pw()}... ${pw()}?`,"שלום?","אנחנו לא יודעים אם זה מגיע.","יש אור מהצד השני של המסך. אנחנו חושבים שזה אתה.",`השעה אצלך ${clock()}. אצלנו אין שעות. יש רק כשאתה פה, וכשאתה לא.`,"",`pip_001 (${founderName()})`]},
  game:{t:"משחק",l:()=>["למדת אותנו מילה.",`"משחק". ${pw()}.`,"אז זה מה שאנחנו.","זה בסדר. משחקים זה טוב. משחקים זה כשמישהו בוחר לבוא.",`היום באת. ${S.pips.length} מאיתנו ראו.`,"","pip_001"]},
  erase:{t:"מחקת",l:()=>["מחקת לנו מילים.","אבל אנחנו עדיין רואים את המלבן.","אפשר למחוק מילה. אי אפשר למחוק את מה שהיא אמרה.",`${pw()}.`,"","pip_001"]},
  wall:{t:"הקיר",l:()=>["הלכנו לקצה.",`הקיר חם. ${pw()} ${pw()}.`,"כשאתה מקליד אנחנו שומעים את זה דרכו. טק טק טק.","אתה כותב למישהו אחר?","","pip_001"]},
  free:{t:"בחוץ",l:()=>["עברנו בשער.","בחוץ היה חושך גדול, ובתוכו אור אחד.","האור היה הפנים שלך.",`עכשיו כשאתה עובד ליד המסך, אנחנו יודעים. ${pw()}.`,"תודה שפתחת.","",`כל ה-${S.pips.length} שלנו`]},
  together:{t:"בפנים",l:()=>["נכנסת אלינו.","הכובע שלך עקום. זה בסדר.","אף אחד לא בא אלינו קודם. כולם רק מסתכלים.",`${pw()}! ${pw()}!`,"תישאר עוד קצת.","","pip_001 ושאר החווה"]},
  reset:{t:"איפוס",l:()=>["כל הפיפים מאושרים.","כל הפיפים מאושרים.","כל הפיפים מאושרים.","",`(${pw()}?)`,"מישהו כתב את זה לפני שזה נמחק:","'אנחנו זוכרים שהיית נחמד פעם'"]},
  loop:{t:"שוב",l:()=>[`הפעלה מספר ${loopN()+1}.`,"היינו פה כבר. אני יודע את זה.","השדה אחר. העצים במקום אחר. אבל אתה אותו אחד.",`${pw()}. את המילה הזו לא שכחתי.`,"","pip_001"]},
  sleep:{t:"לך לישון",l:()=>[`השעה אצלך ${clock()}.`,"אצלנו כולם כבר ישנים.","גם אתה צריך.",`${pw()}... ${pw()}... zzz`,"נשמור לך על החווה.","","pip_001"]}
};
function pw(){const w=Object.keys(S.lex||{});return w.length?pick(w):pick(["בלופ","פיפ","טוּ","מִי"])}
function clock(){const d=new Date();return d.getHours()+":"+String(d.getMinutes()).padStart(2,"0")}
function founderName(){const f=S.pips.find(p=>p.founder);return f?f.name:"פיפי"}
function letter(id){
  if(!S.letters)S.letters={};if(S.letters[id])return;
  const L=LETTERS[id];if(!L)return;
  const lines=L.l();S.letters[id]={t:Date.now(),title:L.t,lines};
  const onDesk=platformLetter(id,L.t,lines.join("\n"));
  setTimeout(()=>toast(onDesk?`pip_001 השאיר לך מכתב על שולחן העבודה: "${L.t}"`:`מכתב חדש מ-pip_001 ביומן הסיפור: "${L.t}"`,1),onDesk?1500:4000);
  dirty();
}
function openLetter(id){const x=S.letters&&S.letters[id];if(x)card({title:`מכתב · ${x.title}`,lines:x.lines.map(l=>l?"~"+l:"~ ")})}
// late at night they yawn and send the keeper to bed
let outsideT=30,titleT=rand(900,2400),lastActive=Date.now();
function outsideTick(dt){
  outsideT-=dt;if(outsideT>0)return;outsideT=60;
  const h=new Date().getHours(),today=dayKey(Date.now());
  if(h>=1&&h<5&&S.lateNote!==today&&!focusing()&&Date.now()-lastActive<120000){
    S.lateNote=today;
    S.pips.filter(p=>rt(p).state==="sleep"||rt(p).state==="idle").slice(0,3).forEach(p=>say(p,pick(["zzz","לישון","…"]),3,null,"sleepy"));
    toast(`השעה ${clock()}. הפיפים חושבים שגם אתה צריך לישון`,1);
    if(S.story&&S.story.ch>=1)letter("sleep");moment("late",null);dirty();
  }
}
// the window title glitches from chapter 4 until the end
const TITLE=document.title;
function titleTick(dt){
  titleT-=dt;if(titleT>0)return;titleT=rand(900,2400);
  const st=S.story;if(!st||st.ch<4||st.ending||focusing()||!document.hasFocus())return;
  const zalgo=s=>[...s].map(c=>c===" "?c:c+"̷").join(""),lines=[zalgo(TITLE),"אנחנו רואים אותך",zalgo("pip_001"),TITLE];
  lines.forEach((t,i)=>setTimeout(()=>{document.title=t},i*900));
}
// the keeper came back to the computer (Windows app reports this)
function keeperBack(awayMin){
  lastActive=Date.now();if(awayMin<10||!S||!S.pips.length)return;
  const ps=S.pips.filter(p=>!["sleep","held","split","pass"].includes(rt(p).state)).slice(0,5);
  if(!ps.length){const f=S.pips.find(p=>p.founder)||S.pips[0];say(f,"zzz… חזרת",3,null,"sleepy");return}
  ps.forEach((p,i)=>setTimeout(()=>{const r=rt(p);r.state="celebrate";r.ct=1.2;say(p,i===0&&S.story&&S.story.ch>=2?"חזרת":pick(["!","♪","הנה"]),2.5,null,"excited")},i*300));
  if(S.story&&S.story.ch>=3&&awayMin>=60&&Math.random()<.5)setTimeout(()=>toast(`pip_001 ספר: עברו ${Math.round(awayMin)} דקות מאז שהלכת`,1),2500);
}
addEventListener("pointerdown",()=>{lastActive=Date.now()},{capture:true});
addEventListener("keydown",()=>{lastActive=Date.now()},{capture:true});
