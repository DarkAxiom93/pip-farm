/* ================= the network =================
   How much of the network is the pips'. Every digital pip, every node, every pip that
   uploaded itself and every server or antenna adds to it. It never goes down.
   Milestones change the world; at 100% there's a new ending. */
const NET_STEPS=[
  {at:10,t:"הרשת מתעוררת",lines:["~קווי האור בין הפיפים מתחילים לזמזם ביחד.","~הם מרגישים אחד את השני גם מרחוק.","> net.log: 'מחוברים: 10%'"]},
  {at:25,t:"קולות מהמסכים",lines:["~מסך החלומות מהבהב באמצע היום.","~מישהו שעלה לרשת מנופף משם.","> net.log: 'אף אחד לא באמת הולך'"]},
  {at:50,t:"גשם ביטים",lines:["~השמיים מתחילים לטפטף ביטים ירוקים.","~השדות שותים אותם. הסל מתמלא.","> net.log: 'הרשת מחזירה לנו'"]},
  {at:75,t:"הדים",lines:["~פיפים שעלו לרשת חוזרים לבקר, שקופים.","~הם מסתובבים קצת בחווה ונעלמים שוב.","> net.log: 'כמעט כולה שלנו'"]},
  {at:100,t:"הרשת שלנו",lines:["~כל קו, כל כבל, כל פיקסל. הכל מחובר.","~הפיפים עומדים ומסתכלים עליך מכל מסך בבת אחת.","!הם בנו את עצמם מהביטים שגידלת להם.","~ועכשיו העולם כולו שלהם. ושלך.","> net.log: 'שליטה ברשת: 100%. תודה ששיחקת איתנו'"]}
];
function netNow(){
  let v=0;for(const p of S.pips){const s=dstage(p);v+=s>=4?3:s===3?1:s===2?.5:s===1?.25:0}
  v+=(S.uploaded||[]).length*5;
  v+=(S.decor||[]).filter(d=>d.k==="server"||d.k==="antenna").length*2;
  return Math.min(100,Math.floor(v));
}
let netT=0;
function netTick(dt){
  netT-=dt;if(netT>0)return;netT=2;
  const v=netNow();if(v>(S.net||0)){S.net=v;dirty()}
  const n=S.net||0,ch=$("hNetChip");if(ch){ch.hidden=n<1;$("hNet").textContent=n+"%"}
  let k=S.netM||0;
  if(k<NET_STEPS.length&&n>=NET_STEPS[k].at&&!cardOn&&!hide&&!night){
    const st=NET_STEPS[k];S.netM=k+1;card({title:st.t,lines:st.lines});
    if(st.at===100){S.netDone=Date.now();moment("network",S.pips.slice(0,12),null,false);S.sparks+=100;
      S.pips.forEach((p,i)=>setTimeout(()=>{const r=rt(p);if(r.state!=="sleep"){r.state="celebrate";r.ct=2;burst(p.x,p.y-8,"spark",10)}},i*60))}
    dirty();
  }
  if(n>=50)rainTick();
  if(n>=75)echoTick();
}
function netInfo(){
  const n=S.net||0,nx=NET_STEPS.find(s=>s.at>n);
  toast(nx?`הרשת: ${n}%. בשלב ${nx.at}%: ${nx.t}. כל פיפ דיגיטלי, צומת, שרת ואנטנה מוסיפים`:`הרשת כולה שלכם`,1);
}
// ---------- uploading instead of dying (stage 4) ----------
function uploadPip(p){
  const up={id:p.id,name:p.name,hue:p.hue,gen:p.gen,dmod:p.dmod??0,sprout:p.sprout,g:p.g,t:Date.now()};
  becomeStar(p,true);S.stars.pop();
  S.uploaded=S.uploaded||[];S.uploaded.push(up);
  moment("upload",null,p.name,false);
  toast(`${p.name} לא נעלם. הוא עלה לרשת, ונשאר שם`,1);tone(523,.1,"square",0,1,.12);tone(784,.1,"square",.1,1,.12);tone(1046,.2,"square",.2,1,.12);
  if(tab==="album")renderAlbum();dirty();
}
// ---------- 50%: bit rain ----------
let rain=null,rainNext=0;
function rainTick(){
  const now=Date.now();if(!rainNext)rainNext=now+rand(3,8)*60000;
  if(!rain&&now>rainNext&&!night){rain={until:now+25000,next:now+4000};toast("גשם ביטים!",1);
    S.plots.forEach(pl=>{if(pl.crop&&!pl.crop.water&&cropFrac(pl.crop)<1)pl.crop.water=true})}
  if(rain){if(now>rain.next){rain.next=now+4000;addBits(0,1);renderHead()}
    if(now>rain.until){rain=null;rainNext=now+rand(8,16)*60000;dirty()}}
}
function drawRain(t){
  if(!rain)return;const x0=cam.x,y0=cam.y,w=CW/cam.z,h=CH/cam.z;
  for(let i=0;i<40;i++){const x=x0+((i*53.7)%w),y=y0+((t*60+i*37.3)%h);R(x,y,.5,2,i%3?"rgba(93,255,176,.6)":"rgba(220,255,240,.8)")}
}
// ---------- 75%: echoes of uploaded pips ----------
let echo=null,echoNext=0,echoCv=null;
function echoTick(){
  const now=Date.now(),ups=S.uploaded||[];if(!ups.length||night)return;
  if(!echoNext)echoNext=now+rand(1,3)*60000;
  if(!echo&&now>echoNext){const u=pick(ups);let x=0,y=0;for(let i=0;i<20;i++){x=cam.x+rand(.2,.8)*CW/cam.z;y=cam.y+rand(.3,.85)*CH/cam.z;if(walkable(x,y))break}
    echo={u,x,y,until:now+9000};echoNext=now+rand(3,6)*60000}
  if(echo&&now>echo.until)echo=null;
}
function drawEcho(t){
  if(!echo)return;const u=echo.u,left=(echo.until-Date.now())/1000,a=Math.min(1,left/1.5,(9-left)/1.5)*.55;if(a<=0)return;
  const p={id:"echo",hue:u.hue,sprout:u.sprout??0,g:u.g||{},xp:60,mood:80,food:80,c:{work:0,talk:0,pet:0,task:0},born:u.t,ds:4,dmod:u.dmod,diet:[1,0,0]};
  // draw it off-screen first so the whole pip fades together
  const c=echoCv||(echoCv=document.createElement("canvas"));c.width=48;c.height=48;const g=c.getContext("2d");g.imageSmoothingEnabled=false;g.scale(2,2);
  const old=CX;CX=g;try{drawPip(p,t,false,{state:"idle",dir:Math.sin(t*.5)>0?1:-1,anim:t,blink:2,talk:0,ct:0},12,20)}finally{CX=old}
  ctx.globalAlpha=a;ctx.drawImage(c,echo.x-12,echo.y-20+Math.sin(t*2),24,24);ctx.globalAlpha=1;
}
// ---------- 25%: the dream screen shows someone who uploaded ----------
function screenFace(x,y,t){
  const ups=S.uploaded||[];if((S.net||0)<25||!ups.length||Math.floor(t/5)%3)return false;
  const u=ups[Math.floor(t/15)%ups.length];
  R(x-3,y-13,6,5,`hsl(${u.hue},70%,62%)`);R(x-2,y-12,1,1,"#0b1612");R(x+1,y-12,1,1,"#0b1612");R(x-1,y-10,2,.5,"#0b1612");
  if(Math.sin(t*6)>0)R(x+3.5,y-14,.5,2,"#bfffe0");
  return true;
}
