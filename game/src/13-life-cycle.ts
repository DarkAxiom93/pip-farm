/* life cycle */
const ageOf=p=>Date.now()-(p.born||Date.now());
const isElder=p=>p.founder?ageOf(p)>3*86400000:ageOf(p)>p.life*.62;
function ageText(p){const d=ageOf(p)/86400000;return d<1?`בן ${Math.max(1,Math.round(d*24))} שעות`:`בן ${d.toFixed(1)} ימים`}
function starPos(st){let h=0;for(const c of st.id)h=(h*31+c.charCodeAt(0))>>>0;return{fx:.04+((h%1000)/1000)*.92,fy:.04+(((h>>10)%1000)/1000)*.3}}
function becomeStar(p,quiet?){
  const st={id:p.id,name:p.name,hue:p.hue,gen:p.gen,days:+(ageOf(p)/86400000).toFixed(1),died:Date.now(),trust:Math.round(p.trust??30),words:Object.keys(p.lang||{}).length,mut:p.mut||null};
  S.stars.push(st);
  if((p.trust??30)>60){S.sparks+=10}
  S.pips.forEach(q=>{if(q.parent===p.id)bond(q,0,"lost")});
  {const r=RT.get(p.id);if(r){if(r.job){const j=r.job;if(jobs.includes(j))jobs.splice(jobs.indexOf(j),1);if(S.plots[j.plot])S.plots[j.plot].pending=false}if(r.node!=null)claims.delete(r.node)}}
  dropNeed(p);clearBubble(p.id);RT.delete(p.id);
  S.pips.splice(S.pips.indexOf(p),1);
  if(sel===p.id){sel=S.pips[0]?S.pips[0].id:null;renderAll()}
  if(!quiet){toast(`${p.name} הפך לכוכב בשמיים. הוא חי ${st.days} ימים${(p.trust??30)>60?" והשאיר לך מתנה של 10 ניצוצות":""}`,1);if(tab==="album")renderAlbum()}
  dirty();return st;
}
function startPassing(p){
  const r=rt(p);r.state="pass";r.ct=6;r.goal=null;dropNeed(p);
  SFX.mood(p.pitch,"sleepy",.35);
  S.pips.forEach(q=>{if(q!==p&&Math.hypot(q.x-p.x,q.y-p.y)<46){const rq=rt(q);if(rq.state==="idle"||rq.state==="walk"){rq.state="chat";rq.ct=5;rq.dir=p.x>q.x?1:-1;setTimeout(()=>{if(byId(q.id))say(q,pick(["…","מיו…","♪…"]),2,"snd","sad")},rand(300,2000));q.mood=Math.max(0,q.mood-8)}}});
}
function lifeTick(){
  if(S.pips.length<6)return;
  if(S.pips.some(p=>rt(p).state==="pass")||Date.now()-lastPass<60000)return;
  const p=S.pips.find(q=>!q.founder&&ageOf(q)>q.life&&(rt(q).state==="idle"||rt(q).state==="sleep"));
  if(p){lastPass=Date.now();startPassing(p)}
}
let lastPass=0;
function updateLoyalty(){
  lifeTick();
  const pop=S.pips.length,a=avgTrust();
  if(!S.statue&&pop>=20&&a>=30){S.statue={p:0,done:false,by:[],offer:0,started:Date.now()};toast("הפיפים התחילו לבנות משהו באמצע החווה…");dirty()}
  if(S.statue&&S.statue.done&&Math.random()<.08){
    const p=S.pips.filter(q=>(q.trust??30)>50&&rt(q).state==="idle")[0];
    if(p){const r=rt(p);r.goal="offer";r.state="walk";setT(p,STATUE.x+rand(-8,8),STATUE.y+rand(3,7))}
  }
}
function startStatueWork(p){
  if(!S.statue||S.statue.done||(p.trust??30)<40)return false;
  if((S.wood||0)<=0){needWood();return false}
  const r=rt(p);r.goal="statue";r.state="walk";setT(p,STATUE.x+rand(-8,8),STATUE.y+rand(2,6));return true;
}
function finishStatue(p){
  const r=rt(p);r.state="idle";r.wait=rand(1,3);
  if(!S.statue||S.statue.done)return;
  if((S.wood||0)<=0){needWood();return}
  S.wood--;S.statue.p+=4;if(!S.statue.by.includes(p.id))S.statue.by.push(p.id);burst(STATUE.x,STATUE.y-10,"dust",8);award(p,4,null);
  if(S.statue.p>=100){S.statue.p=100;S.statue.done=true;SFX.level();burst(STATUE.x,STATUE.y-20,"confetti",50);
    toast(`הפיפים סיימו פסל שלך! ${S.statue.by.length} פיפים בנו אותו`);
    const cx=STATUE.x,cy=STATUE.y+18;
    S.pips.filter(q=>rt(q).state!=="sleep").slice(0,32).forEach((q,i,arr)=>{const rr=rt(q),a=Math.PI*(i/Math.max(1,arr.length-1));let x=cx+Math.cos(a)*34,y=cy+Math.sin(a)*10+4;if(!walkable(x,y)){x=q.x;y=q.y}rr.state="walk";rr.goal="greet";setT(q,x,y)});
    setTimeout(()=>toast("טקס! הם חוגגים את הפסל שלך"),4000);
  }
  dirty();
}
function drawStatue(t){
  const st=S.statue;if(!st||!inView(STATUE.x,STATUE.y,40))return;
  const x=STATUE.x,y=STATUE.y,sty=statueStyle();
  R(x-5,y-3,10,3,"#857a6c");R(x-4,y-4,8,1,"#9a8f80");
  if(!st.done){
    const h=Math.round(st.p/100*24);
    R(x-5,y-4-26,1,26,"#8a6a45");R(x+4,y-4-26,1,26,"#8a6a45");R(x-5,y-4-26,10,1,"#8a6a45");R(x-5,y-4-14,10,1,"#8a6a45");
    if(st.p>33)R(x-4,y-4-h,8,h,"#9a8f80");
    if(st.p>66){R(x-2,y-4-h-3,4,3,"#9a8f80");R(x-4,y-4-h,1,h,"#857a6c")}
    return;
  }
  const C=sty==="gold"?["#ffd166","#d9a83a","#fff1c2"]:sty==="stone"?["#a79c8c","#7f7466","#c9bfb0"]:["#4a4248","#2f2a30","#6a6068"];
  R(x-3,y-14,2,10,C[1]);R(x+1,y-14,2,10,C[1]);
  R(x-4,y-24,8,11,C[0]);R(x-4,y-24,1,11,C[1]);R(x-5,y-23,1,7,C[0]);R(x+4,y-23,1,7,C[0]);
  R(x-3,y-31,6,7,C[0]);R(x-3,y-31,1,7,C[1]);R(x-2,y-30,1,1,C[2]);
  R(x-5,y-33,10,2,C[1]);R(x-3,y-36,6,3,C[0]);
  if(sty==="dark"){R(x-2,y-28,1,1,"#ff5d73");R(x+1,y-28,1,1,"#ff5d73");R(x-1,y-26,3,1,"#1a161a");R(x,y-20,1,4,"#1a161a");R(x+1,y-17,1,3,"#1a161a")}
  else{R(x-2,y-28,1,1,"#2a1830");R(x+1,y-28,1,1,"#2a1830");R(x-1,y-26,1,1,"#2a1830");R(x,y-25,2,1,"#2a1830")}
  if(sty==="gold"&&Math.sin(t*3)>.8)R(x+2,y-34,1,1,"#fff");
  const fl=["#ff7aa2","#ffd166","#c9a2ff","#8fbfff","#ffffff"];
  for(let i=0;i<Math.min(10,st.offer||0);i++){const fx=x-12+((i*7)%24),fy=y-1+(i%2);R(fx,fy,1,1,fl[i%5]);R(fx,fy+1,1,1,"#3f8f3a")}
}

