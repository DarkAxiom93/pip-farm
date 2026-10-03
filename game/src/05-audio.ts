/* ================= audio ================= */
let AC=null,master=null;
function audio(){
  if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.gain.value=.16;master.connect(AC.destination)}catch(e){AC=null}}
  if(AC&&AC.state==="suspended")AC.resume().catch(()=>{});
}
function tone(f,dur,type,when,glide,vol){
  if(!AC||!S.sound)return;
  const t=AC.currentTime+(when||0),o=AC.createOscillator(),g=AC.createGain();
  o.type=type||"sine";o.frequency.setValueAtTime(f,t);
  if(glide)o.frequency.exponentialRampToValueAtTime(Math.max(40,f*glide),t+dur);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol||.5,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+.03);
}
const SFX={
  chirp:p=>tone(p,.13,"sine",0,1.6,.5),
  babble:(p,n)=>{for(let i=0;i<n;i++)tone(p*rand(.8,1.35),.07,"triangle",i*.085,rand(.9,1.4),.4)},
  happy:p=>{tone(p,.09,"square",0,1,.18);tone(p*1.5,.14,"square",.09,1,.18)},
  coin:()=>{tone(988,.07,"square",0,1,.2);tone(1319,.2,"square",.07,1,.2)},
  plop:()=>tone(260,.14,"sine",0,.45,.5),
  water:()=>{for(let i=0;i<4;i++)tone(rand(900,1500),.05,"sine",i*.06,.6,.25)},
  split:p=>[1,1.26,1.5,2,2.52].forEach((m,i)=>tone(p*m,.13,"triangle",i*.08,1,.38)),
  level:()=>[1,1.26,1.5,1.89,2].forEach((m,i)=>tone(523*m,.1,"square",i*.07,1,.16)),
  purr:p=>{tone(p*.42,.35,"sawtooth",0,.85,.1);tone(p*1.2,.12,"sine",.25,1.4,.3)},
  crunch:()=>{for(let i=0;i<3;i++)tone(rand(180,320),.04,"square",i*.07,.5,.15)},
  q:p=>{tone(p,.1,"sine",0,1.15,.4);tone(p*1.2,.16,"sine",.11,1.35,.4)},
  mood:(p,m,vol)=>{const pat=MOOD_SFX[m]||MOOD_SFX.content,type=m==="sad"||m==="sleepy"?"sine":m==="scared"?"square":"triangle",gap=m==="excited"?.06:m==="sleepy"?.16:.09;
    pat.forEach((k,i)=>tone(p*k*rand(.97,1.03),m==="sleepy"?.16:.08,type,i*gap,m==="curious"&&i===pat.length-1?1.3:m==="sad"?.85:1.1,(vol||.4)*(type==="square"?.4:1)))}
};
let lastBlip=0;
function blip(p,m){if(focusing())return;const now=performance.now(),n=S.pips.length;if(now-lastBlip<(n>12?260:150))return;lastBlip=now;SFX.mood(p.pitch,m,.42/Math.sqrt(Math.max(1,n/4)))}

