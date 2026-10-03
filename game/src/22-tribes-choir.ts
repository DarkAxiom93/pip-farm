/* tribes */
const TCAMPS=[{x:58,y:100},{x:104,y:152},{x:160,y:152},{x:212,y:148},{x:300,y:296,z:"meadow"},{x:410,y:296,z:"meadow"}];
function openCamps(){return TCAMPS.map((c,i)=>i).filter(i=>zoneOpen(TCAMPS[i].z||"farm"))}
const TRAIT_TRIBE={work:"החרוצים",talk:"הפטפטנים",pet:"המתרפקים",task:"השאפתנים",free:"הנוודים"};
const TRIBE_COL={work:"#ffb347",talk:"#8fbfff",pet:"#ff7aa2",task:"#86d47f",free:"#c9a2ff"};
const args=[];
function tribeOf(p){return p.tribe?S.tribes.find(t=>t.id===p.tribe):null}
function tName(t){return `${t.name} (${TRAIT_TRIBE[t.k]})`}
function members(t){return S.pips.filter(p=>p.tribe===t.id)}
function foundTribe(k,seed){
  const used=new Set(S.tribes.map(t=>t.camp)),camp=openCamps().find(i=>!used.has(i));
  if(camp==null)return null;
  const t={id:uid(),k,name:newWord(),camp,build:0,huts:0,born:Date.now()};
  S.tribes.push(t);
  seed.forEach(p=>p.tribe=t.id);
  SFX.split(520);burst(TCAMPS[camp].x,TCAMPS[camp].y-10,"confetti",20);
  toast(`נוסד שבט חדש: ${tName(t)}`);
  if(tab==="farm")renderFarm();if(sel)renderHead();dirty();
  return t;
}
function updateTribes(){
  for(const t of [...S.tribes])if(!members(t).length){S.tribes.splice(S.tribes.indexOf(t),1);toast(`שבט ${t.name} התפרק`)}
  const free=S.pips.filter(p=>!p.tribe);
  // kin and like-minded pips join an existing tribe
  for(const p of free){
    const par=p.parent&&byId(p.parent),d=dom(p);
    const t=(d&&S.tribes.find(x=>x.k===d))||(par&&tribeOf(par));
    if(t)p.tribe=t.id;
  }
  // a shared personality founds a tribe
  const max=Math.min(openCamps().length,Math.floor(S.pips.length/5));
  if(S.tribes.length<max){
    for(const k of ["work","talk","pet","task"]){
      if(S.tribes.some(t=>t.k===k))continue;
      const g=S.pips.filter(p=>!p.tribe&&dom(p)===k);
      if(g.length>=3){foundTribe(k,g);return}
    }
    const left=S.pips.filter(p=>!p.tribe);
    if(left.length>=4&&S.pips.length>=8){
      const lead=left.sort((a,b)=>level(b)-level(a))[0],k=dom(lead)&&!S.tribes.some(t=>t.k===dom(lead))?dom(lead):"free";
      if(k==="free"&&S.tribes.some(t=>t.k==="free"))return;
      const g=left.sort((a,b)=>Math.hypot(a.x-lead.x,a.y-lead.y)-Math.hypot(b.x-lead.x,b.y-lead.y)).slice(0,4);
      foundTribe(k,g);
    }
  }
  // a pip whose character changed may move to the tribe that fits it
  for(const p of S.pips){const d=dom(p),t=tribeOf(p);if(d&&t&&t.k!==d&&t.k!=="free"&&Math.random()<.1){const nt=S.tribes.find(x=>x.k===d);if(nt){p.tribe=nt.id;toast(`${p.name} עבר לשבט ${nt.name}`);dirty()}}}
}
function hutSpot(t,i){const c=TCAMPS[t.camp];return{x:c.x-16+i*14,y:c.y}}
function startGather(p){
  const r=rt(p);let best=null,bd=1e9;
  NODES.forEach((n,i)=>{if(!zoneOpen(n.z)||claims.has(i)||!nodeReady(i))return;const d=Math.hypot(n.x-p.x,n.y-p.y);if(d<260&&d<bd){bd=d;best=i}});
  if(best==null)return false;
  claims.add(best);r.node=best;r.goal="gather";r.state="walk";const n=NODES[best];
  setT(p,n.k==="fish"?n.x:n.x+rand(-6,6),n.k==="fish"?n.y:n.y+6);return true;
}
function finishGather(p){
  const r=rt(p),i=r.node,n=NODES[i];claims.delete(i);r.node=null;r.state="idle";r.wait=rand(1,3);
  S.nodeCd[i]=Date.now()+NODE_T[n.k].cd*1000*rand(.8,1.2);
  award(p,5,null);p.energy=Math.max(0,p.energy-5);
  if(n.k==="berry"){addFood(1);SFX.crunch();burst(n.x,n.y-6,"spark",4);langSpeak(p,"food",.2)}
  else if(n.k==="fish"){addFood(S.items&&S.items.rod?3:2);SFX.water();if(Math.random()<.18){S.sparks+=4;SFX.coin();toast(`${p.name} דג דג זהב! ‎+4 ניצוצות`)}langSpeak(p,"water",.25)}
  else{S.sparks+=2;p.cave=(p.cave||0)+1;SFX.coin();burst(n.x,n.y-6,"spark",10)}
  dirty();
}
function startBuild(p){
  const t=tribeOf(p),r=rt(p);if(!t||t.huts>=3)return false;
  if((S.wood||0)<=0){needWood();return false}
  const h=hutSpot(t,t.huts);r.goal="build";r.state="walk";setT(p,h.x+rand(-5,5),h.y+5);return true;
}
function finishBuild(p){
  const t=tribeOf(p),r=rt(p);r.state="idle";r.wait=rand(1,3);
  if(!t||t.huts>=3)return;
  if((S.wood||0)<=0){needWood();return}
  S.wood--;t.build+=dom(p)==="work"?18:12;award(p,4,null);burst(p.x,p.y-4,"dust",6);
  if(t.build>=100){t.build=0;t.huts++;SFX.coin();const h=hutSpot(t,t.huts-1);burst(h.x,h.y-8,"spark",16);toast(`שבט ${t.name} בנה בקתה! (${t.huts}/3)`);
    members(t).forEach(m=>{m.mood=Math.min(100,m.mood+8)});if(tab==="farm")renderFarm()}
  dirty();
}
function startArg(a,b,c){
  const ra=rt(a),rb=rt(b);ra.state=rb.state="argue";ra.ct=rb.ct=5;ra.dir=b.x>a.x?1:-1;rb.dir=-ra.dir;
  args.push({a:a.id,b:b.id,c,t:0,turn:0,next:0});S.stats.fights++;
}
function updateArgs(dt){
  for(let i=args.length-1;i>=0;i--){
    const g=args[i],a=byId(g.a),b=byId(g.b);
    if(!a||!b||rt(a).state!=="argue"||rt(b).state!=="argue"){args.splice(i,1);continue}
    g.t+=dt;g.next-=dt;
    if(g.next<=0){g.next=.9;const p=g.turn%2?b:a;g.turn++;say(p,(p.lang[g.c]||"?")+"!!",.85,"lang","scared");SFX.mood(p.pitch,"scared",.3)}
    if(g.t>=4.6){
      args.splice(i,1);
      const ta=tribeOf(a),tb=tribeOf(b),sa=ta?members(ta).length:1,sb=tb?members(tb).length:1;
      const [win,lose]=Math.random()<sa/(sa+sb)?[a,b]:[b,a],w=win.lang[g.c];
      const tl=tribeOf(lose),tw=tribeOf(win);
      if(w&&Math.random()<.6){lose.lang[g.c]=w;if(tl&&Math.random()<.5)members(tl).forEach(m=>{if(m.lang[g.c]&&Math.random()<.4)m.lang[g.c]=w})}
      [a,b].forEach(p=>{const r=rt(p);r.state="idle";r.wait=rand(1,2);p.mood=Math.max(0,p.mood-6)});
      say(win,(w||"!")+"!",1.6,"lang","excited");say(lose,pick(SOUNDS.sad),1.6,"snd","sad");
      if(tw&&tl)toast(`ויכוח: "${w}" של ${tw.name} ניצחה את "${tl&&lose.lang[g.c]!==w?lose.lang[g.c]:"…"}" של ${tl.name}`);
      if(tab==="lang")renderLangSoon();dirty();
    }
  }
}
function calm(p){
  const g=args.find(x=>x.a===p.id||x.b===p.id);if(!g)return false;
  args.splice(args.indexOf(g),1);
  [byId(g.a),byId(g.b)].filter(Boolean).forEach(q=>{const r=rt(q);r.state="act";r.act="nuzzle";r.ct=1.6;q.mood=Math.min(100,q.mood+10);award(q,6,"pet");bond(q,4,"calm");burst(q.x,q.y-10,"heart",1)});
  S.stats.calmed++;SFX.purr(p.pitch);toast("הרגעת את הוויכוח. הם התחבקו");dirty();return true;
}

/* choir */
let choir=null,choirT=rand(120,240),tribeT=3;
function startChoir(manual){
  if(choir)return;
  const ok=S.pips.filter(p=>{const r=rt(p);return ["idle","walk","chat","act","celebrate"].includes(r.state)&&!r.job&&r.goal!=="job"});
  if(ok.length<3){if(manual)toast(night?"בלילה הם ישנים. נסה בבוקר":"צריך לפחות 3 פיפים פנויים");return}
  const lead=(sel&&ok.find(p=>p.id===sel))||pick(ok);
  const mem=ok.sort((a,b)=>Math.hypot(a.x-lead.x,a.y-lead.y)-Math.hypot(b.x-lead.x,b.y-lead.y)).slice(0,manual?10:8);
  let cx=clamp(lead.x,40,WW-40),cy=clamp(lead.y,58,WH-20);if(inPond(cx,cy)){cx=110;cy=80}
  const n=mem.length,rad=12+n*1.6;
  mem.sort((a,b)=>a.pitch-b.pitch);
  mem.forEach((p,i)=>{const r=rt(p),a=Math.PI*(1.1+.8*(n===1?.5:i/(n-1)));
    if(r.need)dropNeed(p);
    r.state="walk";r.goal="choir";r.nap=false;setT(p,clamp(cx+Math.cos(a)*rad*1.3,8,WW-8),clamp(cy+Math.sin(a)*rad*.7+rad*.4,18,WH-4));
    r.role=i===0?"bass":i===n-1?"melody":"harm";r.hi=i;});
  choir={mem:mem.map(p=>p.id),cx,cy,phase:"gather",t:0,beat:0,next:0,key:pick([0,2,5,7,-3]),tempo:.42,mel:2};
  say(lead,pick(["♪?","♪♫","לה לה?"]),1.6,"snd","excited");
  if(manual)toast("הפיפים מתאספים למקהלה");
}
function hz(s){return 261.63*Math.pow(2,(s+choir.key)/12)}
function voice(p,f,dur,vol){
  if(AC&&S.sound){const t=AC.currentTime,o=AC.createOscillator(),o2=AC.createOscillator(),g=AC.createGain(),lfo=AC.createOscillator(),lg=AC.createGain();
    o.type="triangle";o2.type="sine";o.frequency.value=f;o2.frequency.value=f*2;lfo.frequency.value=5+p.pitch%3;lg.gain.value=f*.012;lfo.connect(lg);lg.connect(o.frequency);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.03);g.gain.setValueAtTime(vol,t+dur*.6);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    const g2=AC.createGain();g2.gain.value=.25;o.connect(g);o2.connect(g2);g2.connect(g);g.connect(master);
    [o,o2,lfo].forEach(x=>{x.start(t);x.stop(t+dur+.05)})}
  const r=rt(p);r.sing=Math.min(dur,.5);r.talk=Math.min(dur,.5);
  parts.push({x:p.x+rand(-3,3),y:(r.head??p.y-12)-2,vx:rand(-4,4),vy:-12,life:1.1,kind:"note"});
}
function choirBeat(){
  const mem=choir.mem.map(byId).filter(p=>p&&rt(p).state==="choir");
  if(!mem.length)return;
  const b=choir.beat,bar=Math.floor(b/4)%4,bi=b%4,ch=PROG[bar],v=.34/Math.sqrt(mem.length),T=choir.tempo;
  const harm=mem.filter(p=>rt(p).role==="harm");
  for(const p of mem){
    const r=rt(p);
    if(r.role==="bass"&&(bi===0||bi===2))voice(p,hz(ch[0]-12),T*1.8,v*1.1);
    else if(r.role==="harm"&&(bi===0||bi===2))voice(p,hz(ch[harm.indexOf(p)%3]),T*1.9,v*.7);
    else if(r.role==="melody"&&Math.random()>.12){
      const tones=PENTA.filter(x=>x<=24);choir.mel=clamp(choir.mel+pick([-1,-1,0,1,1,2,-2]),0,tones.length-1);
      if(bi===0)choir.mel=tones.indexOf(tones.reduce((a,x)=>Math.abs(x%12-ch[0]%12)<Math.abs(a%12-ch[0]%12)?x:a,tones[choir.mel]));
      voice(p,hz(tones[choir.mel]),T*.9,v*1.05);
      if(Math.random()<.25)setTimeout(()=>{if(choir)voice(p,hz(tones[clamp(choir.mel+1,0,tones.length-1)]),T*.45,v)},T*500);
    }
  }
}
function updateChoir(dt){
  if(!choir)return;
  choir.t+=dt;
  const mem=choir.mem.map(byId).filter(Boolean);
  if(choir.phase==="gather"){
    const arrived=mem.filter(p=>rt(p).state==="choir");
    if(arrived.length===mem.length||choir.t>8){
      mem.forEach(p=>{const r=rt(p);if(r.state!=="choir"){r.goal=null;r.state="idle";r.wait=1}});
      choir.mem=arrived.map(p=>p.id);
      if(arrived.length<3){arrived.forEach(p=>{const r=rt(p);r.state="idle";r.wait=1});choir=null;return}
      const srt=arrived.sort((a,b)=>a.pitch-b.pitch);srt.forEach((p,i)=>rt(p).role=i===0?"bass":i===srt.length-1?"melody":"harm");
      choir.phase="sing";choir.next=.2;
    }
    return;
  }
  if(choir.phase==="sing"){
    choir.next-=dt;
    while(choir.next<=0&&choir.beat<16){choirBeat();choir.beat++;choir.next+=choir.tempo}
    if(choir.beat>=16&&choir.next<=-.6){
      const live=mem.filter(p=>rt(p).state==="choir");
      if(live.length&&AC&&S.sound){const f=[0,4,7,12];live.forEach((p,i)=>voice(p,hz(f[i%4]+(i>3?12:0)),1.4,.3/Math.sqrt(live.length)))}
      live.forEach(p=>{const r=rt(p);r.state="celebrate";r.ct=1.3;r.goal=null;p.mood=Math.min(100,p.mood+10);award(p,3,"talk")});
      const lead=pick(live);if(lead)setTimeout(()=>{if(byId(lead.id))langSpeak(lead,"friend",.7)||chatter(lead,"excited")},600);
      S.stats.choirs++;burst(choir.cx,choir.cy-10,"confetti",20);choir=null;choirT=rand(160,300);dirty();
    }
  }
}

