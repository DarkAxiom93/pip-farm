/* random events: a meteor, a visitor */
function eventTick(){
  if(Date.now()<S.nextEvent||S.visitor||(S.meteor&&!S.meteor.taken)||focusing())return;
  S.nextEvent=Date.now()+rand(8,16)*60000;
  if(night||Math.random()<.45)meteorEvent();else visitorEvent();
}
function viewSpot(){for(let i=0;i<30;i++){const x=cam.x+rand(30,CW/cam.z-30),y=cam.y+rand(30,CH/cam.z-20);if(walkable(x,y)&&!PLOTS.some(g=>x>g.x-6&&x<g.x+PW+6&&y>g.y-6&&y<g.y+PH+8))return[x,y]}return[150,80]}
function meteorEvent(){
  const[x,y]=viewSpot();S.meteor={x:Math.round(x),y:Math.round(y),t0:Date.now(),landed:false,taken:false};
  toast("משהו נופל מהשמיים!",1);notify("מטאור!","משהו נפל בחווה. בוא לראות");dirty();
}
function updateMeteor(){
  const m=S.meteor;if(!m||m.taken)return;
  if(!m.landed&&Date.now()-m.t0>1600){m.landed=true;flash=.8;thunder();burst(m.x,m.y-2,"spark",30);
    S.pips.filter(p=>rt(p).state==="idle"&&Math.hypot(p.x-m.x,p.y-m.y)<120).slice(0,8).forEach((p,i)=>{const r=rt(p),a=i/8*6.28;r.goal="wander";r.state="walk";setT(p,m.x+Math.cos(a)*14,m.y+Math.sin(a)*8+3);setTimeout(()=>{if(byId(p.id))say(p,pick(["?!","!!","בופ?"]),1.6,"snd","curious")},1500)});
    toast("מטאור נחת בחווה. הקש על האבן הזוהרת",1);dirty()}
}
function drawMeteor(t){
  const m=S.meteor;if(!m||m.taken)return;
  const k=Math.min(1,(Date.now()-m.t0)/1600);
  if(!m.landed){const sx=m.x+140*(1-k),sy=m.y-160*(1-k);for(let i=0;i<14;i++){R(sx+i*3,sy-i*3.4,2,2,`rgba(255,${200-i*8},120,${1-i/14})`)}R(sx-1,sy-1,4,4,"#fff7c2");return}
  for(let dy=-3;dy<=3;dy++){const hw=Math.round(9*Math.sqrt(1-(dy/3.5)**2));R(m.x-hw,m.y+dy,hw*2,1,dy<0?"#3a2a22":"#4f3a2c")}
  const gl=.5+.5*Math.sin(t*5);R(m.x-2,m.y-4,5,4,"#6a5aa0");R(m.x-1,m.y-5,3,1,"#8f7fd0");R(m.x,m.y-3,1,1,`rgba(220,240,255,${gl})`);R(m.x+1,m.y-4,1,1,`rgba(255,240,180,${gl})`);
  if(Math.random()<.08)parts.push({x:m.x+rand(-3,3),y:m.y-5,vx:0,vy:-8,life:1,kind:"spark"});
}
function takeMeteor(){
  const m=S.meteor;if(!m||!m.landed||m.taken)return;m.taken=true;
  S.sparks+=25;S.meteorBoost=(S.meteorBoost||0)+3;SFX.level();burst(m.x,m.y-4,"confetti",30);
  toast("אבן כוכב! ‎+25 ניצוצות, ו-3 ההתפצלויות הבאות עם סיכוי כפול למוטציה",1);dirty();
}
const VNAMES=["ויולט","קוסמו","לומי","אזורה","נבולה","טוֹפָּז"];
function visitorEvent(){
  const fromLeft=Math.random()<.5,y=cam.y+rand(40,CH/cam.z-30);
  S.visitor={x:fromLeft?cam.x+4:cam.x+CW/cam.z-4,y,tx:0,ty:0,wait:1,until:Date.now()+150000,hue:pick([200,225,250,280,305,330])+rand(-8,8),name:pick(VNAMES),done:false,leaving:false,moving:false};
  toast(`יצור זר נכנס לחווה: ${S.visitor.name}. הקש עליו`,1);notify("אורח בחווה",`${S.visitor.name} הגיע מרחוק. יש לך שתי דקות`);SFX.q(300);
}
function updateVisitor(dt){
  const v=S.visitor;if(!v)return;
  if(!v.leaving&&(Date.now()>v.until||v.done)){v.leaving=true;v.tx=v.x<cam.x+CW/cam.z/2?cam.x-30:cam.x+CW/cam.z+30;v.ty=v.y;if(!v.done)toast(`${v.name} המשיך בדרכו`)}
  if(!v.leaving){v.wait-=dt;if(v.wait<=0){const[x,y]=viewSpot();v.tx=x;v.ty=y;v.wait=rand(4,9)}}
  const dx=v.tx-v.x,dy=v.ty-v.y,d=Math.hypot(dx,dy);v.moving=d>1;
  if(d>1){const s=Math.min(d,10*dt);v.x+=dx/d*s;v.y+=dy/d*s}else if(v.leaving){S.visitor=null;return}
  if(Math.random()<dt*.6){const p=S.pips.find(q=>rt(q).state==="idle"&&Math.hypot(q.x-v.x,q.y-v.y)<30);if(p){rt(p).dir=v.x>p.x?1:-1;say(p,pick(["?","!?","בופ?","♪?"]),1.4,"snd","curious")}}
}
function drawVisitor(t){
  const v=S.visitor;if(!v||!inView(v.x,v.y,20))return;
  const x=Math.round(v.x),y=Math.round(v.y),bob=v.moving?Math.round(Math.abs(Math.sin(t*7))*1.5):0,y0=y-14-bob;
  const c=`hsl(${v.hue},55%,64%)`,d=`hsl(${v.hue},45%,42%)`,o=`hsl(${v.hue},45%,22%)`;
  R(x-4,y-1,8,2,"rgba(0,0,0,.28)");
  R(x-4,y0-1,8,15,o);R(x-5,y0,10,13,o);R(x-4,y0,8,14,c);R(x-3,y0+10,6,3,d);
  R(x-4,y0-6,2,6,o);R(x+2,y0-6,2,6,o);R(x-3,y0-5,1,5,c);R(x+3,y0-5,1,5,c);
  R(x-2,y0+4,1,2,"#ffffff");R(x+1,y0+4,1,2,"#ffffff");R(x-2,y0+4,1,1,"#9fe8ff");R(x+1,y0+4,1,1,"#9fe8ff");
  R(x-4,y0+8,8,1,"#ffd166");R(x-7,y0+4,2,6,"#a87a42");
  R(x+5,y0+1,1,13,"#8a6a45");R(x+4,y0-1,3,2,`rgba(160,232,255,${.6+.4*Math.sin(t*4)})`);
}
function openVisitor(){
  const v=S.visitor,m=popAt(v.x,v.y-16);
  m.innerHTML=`<h4>${esc(v.name)}, אורח מרחוק</h4><p>יצור מעולם אחר עצר בחווה. הפיפים סקרנים מאוד</p>`+(v.done?`<p>הוא כבר קיבל ממך מתנה</p>`:`<button class="btn main" data-visit="1" ${S.basket<3?"disabled":""}>לתת לו 3 ירקות מהסל</button>${S.basket<3?"<p>צריך לפחות 3 ירקות בסל</p>":""}`);
}
function visitGift(){
  const v=S.visitor;if(!v||v.done||S.basket<3)return;S.basket-=3;v.done=true;moment("visitor",null,v.name,false);
  const stayP=.25+(avgTrust()>50?.15:0),roll=Math.random();
  if(roll<stayP&&S.pips.length<cap()){
    const p=newPip(null);Object.assign(p,{name:v.name,hue:v.hue,exotic:true,x:v.x,y:v.y,trust:60,mood:90,gen:1,sprout:5,g:rollGenes()});
    S.pips.push(p);discover(p,false);S.visitor=null;SFX.split(500);burst(p.x,p.y-10,"confetti",30);
    toast(`${v.name} החליט להישאר בחווה! עכשיו יש לך פיפ בצבע שאין לאף אחד אחר`,1);select(p.id);
  }else if(roll<stayP+.25){
    const counts={};for(const k in CONCEPTS)counts[k]=0;for(const p of S.pips)for(const c in p.lang)counts[c]++;
    const c=Object.keys(counts).sort((a,b)=>counts[a]-counts[b])[0],w=newWord();
    S.lex[w]={c,ok:true,born:Date.now(),heard:1};S.pips.forEach(p=>{if(Math.random()<.6)p.lang[c]=w});
    toast(`${v.name} לימד את כולם מילה: "${w}" זה ${CONCEPTS[c]}`,1);renderLangCount();
  }else if(roll<stayP+.4&&S.seeds.includes(false)){
    const k=S.seeds.indexOf(false);S.seeds[k]=true;toast(`${v.name} השאיר לך זרעי ${CROPS[k].name}`,1);
  }else{S.sparks+=20;toast(`${v.name} השאיר לך אבן נוצצת: ‎+20 ניצוצות`,1)}
  SFX.happy(400);dirty();refresh();
}

