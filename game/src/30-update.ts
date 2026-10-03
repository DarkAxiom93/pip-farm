/* ================= update ================= */
let socialT=2,assignT=0,nightT=0,uiT=0,qGlobal=0,toastShareT=0;
function update(dt){
  nightT-=dt;if(nightT<=0){nightT=5;const n=isNight();if(n!==night){night=n;toast(n?"לילה. הפיפים הולכים לישון במאורה":"בוקר! הפיפים מתעוררים")}$("hClock").textContent=(night?"לילה ":"יום ")+new Date().toLocaleTimeString("he-IL",{hour:"2-digit",minute:"2-digit"})}
  assignT-=dt;if(assignT<=0){assignT=.4;assignJobs()}
  qGlobal=Math.max(0,qGlobal-dt);
  for(const p of [...S.pips]){try{updPip(p,dt)}catch(e){if(errCount++<5)console.error("pip",e);const r=rt(p);r.state="idle";r.wait=1;r.goal=null}}
  socialT-=dt;if(socialT<=0){socialT=rand(2,4);social()}
  updateChoir(dt);updateArgs(dt);updateWeather(dt);updateFocus(dt);seasonTick(dt);spawnWild(dt);
  storyT-=dt;if(storyT<=0){storyT=2;try{storyTick()}catch(e){console.error(e)}}
  if(drag&&drag.hold&&drag.pip&&!drag.held){const p=byId(drag.pip);if(p&&rt(p).state==="cuddle")cuddleTick(p,dt)}updateMeteor();updateVisitor(dt);outsideTick(dt);titleTick(dt);recallTick(dt);hideTick(dt);
  if(camGoal){const k=Math.min(1,dt*5);cam.x+=(camGoal.x-cam.x)*k;cam.y+=(camGoal.y-cam.y)*k;clampCam();if(Math.hypot(camGoal.x-cam.x,camGoal.y-cam.y)<.5)camGoal=null}
  tribeT-=dt;if(tribeT<=0){tribeT=6;updateTribes();updateLoyalty()}
  choirT-=dt;if(choirT<=0){choirT=rand(150,300);if(!night&&!focusing()&&S.pips.length>=4)startChoir(false)}
  for(let i=parts.length-1;i>=0;i--){const q=parts[i];q.life-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=(q.kind==="z"?-4:60)*dt;if(q.life<=0)parts.splice(i,1)}
  const now=performance.now();
  for(const [id,el] of needEls){const p=byId(id);if(!p){el.remove();needEls.delete(id);continue}const r=rt(p),[l,tp]=scr(p.x+3,(r.head??p.y-12)-1);el.style.left=l+"%";el.style.top=tp+"%";el.style.visibility=l<-5||l>105||tp<-5||tp>110?"hidden":"visible";el.classList.toggle("late",!!r.need&&r.need.left<12)}
  for(const [id,b] of bubbleEls){const p=byId(id);if(!p){b.remove();bubbleEls.delete(id);continue}placeBubble(p,b);if(now>b._until){if(!b.classList.contains("out")){b.classList.add("out");b._until=now+400}else{b.remove();bubbleEls.delete(id)}}}
  syncLocks();
  uiT-=dt;if(uiT<=0){uiT=.5;refresh();drawMini()}
}
function updPip(p,dt){
  const r=rt(p);
  r.anim+=dt;r.blink-=dt;if(r.blink<-.14)r.blink=rand(2,5);
  r.talk=Math.max(0,r.talk-dt);r.xpCd=Math.max(0,r.xpCd-dt);r.petCd=Math.max(0,r.petCd-dt);
  p.food=Math.max(0,p.food-dt/240);
  p.mood=clamp(p.mood-(p.food<20?dt/90:dt/900),0,100);
  const speed=14*(isElder(p)?.7:1)*(dom(p)==="work"?1.3:1)*(p.food<15?.6:1)*(r.goal==="job"?1.25:1);
  switch(r.state){
    case "idle":
      if(r.node!=null){claims.delete(r.node);r.node=null}
      if(r.wid){wildClaims.delete(r.wid);r.wid=null}
      if(r.site&&r.goal!=="site"){r.site=null}
      if(r.job){if(jobs.includes(r.job)){r.state="walk";r.goal="job";const g=PLOTS[r.job.plot];setT(p,g.x+8+ri(0,30),g.y+PH+6);break}r.job=null}
      p.energy=Math.min(100,p.energy+dt*.6);r.wait-=dt;
      if(p.growth>=splitNeed()&&p.food>=30&&S.pips.length<cap()){r.state="split";r.ct=2.2;SFX.chirp(p.pitch*1.5);say(p,"?!",1.6,"snd","curious");break}
      if(p.food<25&&S.basket>0){S.basket--;p.food=Math.min(100,p.food+30);p.mood=Math.min(100,p.mood+6);r.state="eat";r.ct=1.4;SFX.crunch();langSpeak(p,"food",.55);dirty();break}
      if(night&&!stormy()&&S.items&&S.items.lamp&&p.energy>55&&Math.random()<.3&&r.wait<=0&&autoWork(p))break;
      if(night||stormy()){r.goal="sleep";r.state="walk";const tt=tribeOf(p);if(tt&&tt.huts){const h=hutSpot(tt,ri(0,tt.huts-1));setT(p,h.x+rand(-6,6),h.y+rand(2,7))}else setT(p,rand(16,52),rand(56,70));langSpeak(p,"night",.2);break}
      if(p.energy<12){r.state="sleep";r.nap=true;langSpeak(p,"sleep",.45);break}
      if(r.wait<=0&&(p.food<50||Math.random()<.12)&&startForage(p))break;
      if(r.wait<=0&&p.food<10){r.wait=rand(2,4);say(p,pick(["…","מיו…","גררר"]),1.4,"snd","hungry");break}
      if(r.wait<=0&&p.energy>30&&Math.random()<.3&&startConstruct(p))break;
      if(r.wait<=0&&p.energy>30&&S.story&&S.story.site&&Math.random()<.35&&startStoryWork(p))break;
      if(S.story&&S.story.ch>=1&&!S.story.ending&&Math.random()<dt*.004){r.state="stare";r.ct=2.4;break}
      if(S.story&&S.story.ch>=2&&mouseW&&Math.random()<dt*.012&&Math.hypot(mouseW[0]-p.x,mouseW[1]-p.y)<130&&walkable(mouseW[0],mouseW[1])){r.goal="wander";r.state="walk";setT(p,mouseW[0]+rand(-8,8),mouseW[1]+rand(4,10));break}
      if(S.story&&S.story.ending==="together"&&S.story.avatar&&Math.random()<dt*.02){const a=S.story.avatar;r.goal="wander";r.state="walk";setT(p,a.x+rand(-16,16),a.y+rand(-10,10));break}
      if(r.wait<=0&&p.energy>30&&Math.random()<(focusing()?.7:.35)&&autoWork(p))break;
      if(r.wait<=0&&p.tribe&&p.energy>30&&Math.random()<.12&&startBuild(p))break;
      if(r.wait<=0&&p.energy>30&&Math.random()<.15&&startStatueWork(p))break;
      if(r.wait<=0&&p.energy>30&&Math.random()<.2&&startGather(p))break;
      if(r.wait<=0&&inPond(p.x-8,p.y)||r.wait<=0&&Math.hypot(p.x-POND.x,p.y-POND.y)<34)langSpeak(p,"water",.25);
      if(r.wait<=0){const[x,y]=wanderTarget(p);r.goal="wander";r.state="walk";setT(p,x,y)}
      break;
    case "walk":{
      const dx=r.tx-p.x,dy=r.ty-p.y,d=Math.hypot(dx,dy);
      if(d<1.2){p.x=r.tx;p.y=r.ty;
        if(r.goal==="job")startWork(p);
        else if(r.goal==="build"){r.state="build";r.workT=r.workMax=3}
        else if(r.goal==="form"){r.state="form";r.ct=60;r.dir=1}
        else if(r.goal==="push"){r.state="push";r.ct=rand(10,16);r.dir=1}
        else if(r.goal==="hide"){r.state="hidden";r.goal=null;clearBubble(p.id)}
        else if(r.goal==="story"){r.state="sbuild3";r.workT=r.workMax=3}
        else if(r.goal==="gate"){r.state="act";r.act="hop";r.ct=1;r.goal=null;p.x+=rand(-6,6);burst(p.x,p.y-6,"spark",6)}
        else if(r.goal==="site"){r.state="construct";r.workT=r.workMax=r.site==="craft"?5:3}
        else if(r.goal==="forage"){const w=S.wild.find(q=>q.id===r.wid);r.wid=null;if(w)pickWild(w,p);r.state="eat";r.ct=.8}
        else if(r.goal==="statue"){r.state="sbuild";r.workT=r.workMax=3}
        else if(r.goal==="greet"){r.state="celebrate";r.ct=1.4;r.goal=null;if(!langSpeak(p,"keeper",.45))chatter(p,"excited")}
        else if(r.goal==="offer"){r.state="celebrate";r.ct=1;r.goal=null;if(S.statue){S.statue.offer=(S.statue.offer||0)+1;S.sparks+=1;burst(STATUE.x,STATUE.y-6,"spark",6);dirty()}}
        else if(r.goal==="gather"){r.state="gather";r.workT=r.workMax=NODE_T[NODES[r.node].k].work*(dom(p)==="work"?.7:1);r.dir=NODES[r.node].k==="fish"?(riverX(p.y)>p.x?1:-1):r.dir}
        else if(r.goal==="choir"){r.state="choir";r.dir=choir&&choir.cx>p.x?1:-1}
        else if(r.goal==="sleep"){r.state="sleep";r.nap=false}
        else{r.state="idle";r.wait=rand(1.5,5)}
      }else{const s=Math.min(d,speed*dt);p.x+=dx/d*s;p.y+=dy/d*s;if(Math.abs(dx)>.5)r.dir=dx>0?1:-1}
      break}
    case "work":r.workT-=dt;if(Math.random()<dt*3)burst(p.x+r.dir*5,p.y-2,"dust",1);if(r.workT<=0)finishJob(p);break;
    case "sleep":
      p.energy=Math.min(100,p.energy+dt*4);
      if(Math.random()<dt*.7)parts.push({x:p.x+3,y:p.y-10,vx:rand(2,6),vy:-6,life:1.6,kind:"z"});
      if(r.nap?p.energy>85:!(night||stormy())){r.state="idle";r.wait=rand(.5,2.5);if(!r.nap){SFX.chirp(p.pitch);langSpeak(p,"day",.3)}}
      break;
    case "act":r.ct-=dt;
      if(r.act==="spin"&&Math.random()<dt*10)r.dir=-r.dir;
      if(r.act==="nuzzle"&&Math.random()<dt*2){burst(p.x,p.y-10,"heart",1);const h=parts[parts.length-1];h.vx=rand(-6,6);h.vy=-14}
      if(r.act==="hide"){const dx=p.x-(r.fx??p.x+1),d=Math.abs(dx)||1;p.x=clamp(p.x+dx/d*10*dt,6,WW-6)}
      if(r.ct<=0){r.state="idle";r.act=null;r.wait=rand(1,3)}break;
    case "argue":r.ct-=dt;if(r.ct<=0){r.state="idle";r.wait=1}break;
    case "gather":r.workT-=dt;if(NODES[r.node].k!=="fish"&&Math.random()<dt*3)burst(p.x+r.dir*5,p.y-3,"dust",1);if(r.workT<=0)finishGather(p);break;
    case "sbuild":r.workT-=dt;if(Math.random()<dt*4)burst(p.x,p.y-4,"dust",1);if(r.workT<=0)finishStatue(p);break;
    case "construct":r.workT-=dt;if(Math.random()<dt*4)burst(p.x+r.dir*5,p.y-3,"dust",1);if(r.workT<=0)finishConstruct(p);break;
    case "held":case "cuddle":break;
    case "form":r.ct-=dt;if(r.ct<=0){r.state="idle";r.goal=null}break;
    case "push":r.ct-=dt;r.dir=1;if(Math.random()<dt*2)burst(p.x+4,p.y-5,"dust",1);if(r.ct<=0){r.state="idle";r.goal=null;r.wait=rand(1,3)}break;
    case "hidden":if(!hide){r.state="idle";r.wait=1;r.spot=null}break;
    case "stare":r.ct-=dt;if(r.ct<=0){r.state="idle";r.wait=rand(1,3)}break;
    case "sbuild3":r.workT-=dt;if(Math.random()<dt*4)burst(p.x+4,p.y-3,"dust",1);if(r.workT<=0)finishStoryWork(p);break;
    case "build":r.workT-=dt;if(Math.random()<dt*4)burst(p.x+r.dir*5,p.y-3,"dust",1);if(r.workT<=0)finishBuild(p);break;
    case "celebrate":case "chat":case "eat":r.ct-=dt;if(r.ct<=0){r.state="idle";r.wait=rand(1,3)}break;
    case "split":r.ct-=dt;if(r.ct<=0)doSplit(p);break;
    case "pass":r.ct-=dt;if(Math.random()<dt*6)parts.push({x:p.x+rand(-4,4),y:p.y-6,vx:0,vy:-16,life:1.4,kind:"spark"});if(r.ct<=0){burst(p.x,p.y-8,"spark",24);becomeStar(p)}break;
    case "choir":r.sing=Math.max(0,r.sing-dt);if(!choir)r.state="idle";break;
  }
  const awake=r.state!=="sleep"&&r.state!=="split";
  if(awake&&!p.question&&!focusing()){
    r.nextTalk-=dt;
    if(r.nextTalk<=0){r.nextTalk=(dom(p)==="talk"?rand(5,11):rand(9,20))*Math.max(1,Math.sqrt(S.pips.length/6));if(Math.random()<.85)chatter(p)}
  }
  if(r.need){
    if(r.state==="sleep"||r.state==="choir"||r.goal==="choir")dropNeed(p);
    else if(!focusing()){r.need.left-=dt;if(r.need.left<=0){dropNeed(p);p.mood=Math.max(0,p.mood-10);bond(p,-3,"ignored");say(p,pick(SOUNDS.sad),1.6,"snd","sad")}}
  }else if(awake&&!night&&!focusing()&&r.state!=="hidden"&&r.goal!=="hide"&&r.state!=="choir"&&r.goal!=="choir"&&!p.question){
    r.nextNeed-=dt;
    if(r.nextNeed<=0){r.nextNeed=rand(55,140);if(needCount()<2+Math.floor(S.pips.length/6))giveNeed(p)}
  }
  if(p.question&&!bubbleEls.get(p.id)?.classList.contains("q")&&awake)say(p,p.question,0,"q");
}
function social(){
  if(focusing()&&Math.random()<.8)return;
  const idle=S.pips.filter(p=>rt(p).state==="idle");
  if(idle.length<2)return;
  const a=pick(idle);
  const b=idle.filter(q=>q!==a&&Math.hypot(q.x-a.x,q.y-a.y)<34).sort((x,y)=>Math.hypot(x.x-a.x,x.y-a.y)-Math.hypot(y.x-a.x,y.y-a.y))[0];
  if(!b||Math.random()<.45)return;
  if(a.tribe&&b.tribe&&a.tribe!==b.tribe){const cs=Object.keys(a.lang).filter(c=>b.lang[c]&&b.lang[c]!==a.lang[c]);if(cs.length&&Math.random()<.6){startArg(a,b,pick(cs));return}}
  if(a.tribe&&!b.tribe&&Math.random()<.25){const t=tribeOf(a);if(t){b.tribe=t.id;if(Math.random()<.4)toast(`${b.name} הצטרף לשבט ${t.name}`);dirty()}}
  const ra=rt(a),rb=rt(b);ra.state=rb.state="chat";ra.ct=rb.ct=2.6;ra.dir=b.x>a.x?1:-1;rb.dir=-ra.dir;
  const lk=Object.keys(a.lang);
  if(lk.length&&Math.random()<.55){
    const c=Math.random()<.35&&a.lang.friend?"friend":pick(lk),lw=a.lang[c];
    say(a,lw,2,"lang","happy");if(S.lex[lw]){S.lex[lw].heard=(S.lex[lw].heard||0)+1}
    setTimeout(()=>{
      if(!byId(b.id))return;
      if(b.lang[c]===lw){say(b,lw+"!",1.8,"lang","happy");return}
      if(!b.lang[c]||Math.random()<(isElder(a)?.85:a.tribe&&a.tribe===b.tribe?.75:.3)){b.lang[c]=lw;say(b,lw+"?",1.8,"lang","curious");if(tab==="lang")renderLangSoon();dirty()}
      else say(b,b.lang[c]+"!",1.8,"lang","curious");
    },1000);
    return;
  }
  if(Math.random()<.12&&langSpeak(a,"friend",1))return;
  const spoke=a.vocab.length&&Math.random()<.4,w=spoke?pick(a.vocab):null;
  if(spoke)say(a,w+"!",1.8,"word","happy");else say(a,pick(SOUNDS.content),1.4,"snd","content");
  setTimeout(()=>{
    if(!byId(b.id))return;
    if(!w){say(b,pick(SOUNDS.happy),1.4,"snd","happy");return}
    const knew=b.vocab.includes(w);
    knew?say(b,pick(["♪","פיפ!","♥"]),1.4,"snd","happy"):say(b,w+"?",1.8,"word","curious");
    if(!knew&&a.vocab.includes(w)){b.vocab.push(w);if(b.vocab.length>60)b.vocab.shift();S.stats.shared++;
      if(performance.now()-toastShareT>9000){toastShareT=performance.now();toast(`${b.name} למד מ${a.name} את המילה "${w}"`)}
      if(sel===b.id)renderHead();dirty()}
    if(a.xp<40){a.xp+=1;b.xp+=1}
    if((a.trust??30)<-10)b.trust=clamp((b.trust??30)-1,-100,100);else if((a.trust??30)>60)b.trust=clamp((b.trust??30)+.5,-100,100);
  },1000);
}

