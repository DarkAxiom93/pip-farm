/* ================= music =================
   Background music written live from the state of the farm, not a recording:
   - chords and tempo follow day and night and the season
   - the melody is a short motif that repeats and changes a little, played with a pip-like voice
   - rain darkens the sound, a focus session turns it into calm study music
   - the story leaks in: from chapter 3 some notes glitch, after a reset it is a lonely music box
   It goes quiet while a story card is open, during a choir, and when the window is hidden. */
const MUS={gain:null as GainNode|null,filter:null as BiquadFilterNode|null,step:0,next:0,timer:0 as any,chord:0,motif:[] as number[],motifAge:0,level:0};
const MUS_PROG:Record<string,number[][]>={
  day:[[0,4,7,11],[9,12,16,19],[5,9,12,16],[7,11,14,17]],        // Imaj7 vi IV V
  night:[[9,12,16,19],[5,9,12,16],[0,4,7,12],[7,11,14,19]],      // vi IV I V, slower and lower
  focus:[[0,4,7,11],[5,9,12,16],[9,12,16,19],[5,9,12,14]],       // gentle loop for focus time
  sad:[[9,12,16],[5,9,12],[9,12,16],[4,7,11]]                    // after the reset ending
};
const MUS_PENTA=[0,2,4,7,9,12,14,16,19,21,24];
function musicOn(){return !!(S&&S.sound&&S.music!==false)}
function musicMode(){
  if(S.story&&S.story.ending==="reset"&&!S.story.redeemed)return "sad";
  if(focusing())return "focus";
  return night?"night":"day";
}
function musicTarget(){
  if(!musicOn()||document.hidden)return 0;
  if(choir)return 0;
  if(cardOn)return .25;
  return 1;
}
function musicInit(){
  if(MUS.gain||!AC)return;
  MUS.gain=AC.createGain();MUS.gain.gain.value=0;
  MUS.filter=AC.createBiquadFilter();MUS.filter.type="lowpass";MUS.filter.frequency.value=2600;
  MUS.gain.connect(MUS.filter);MUS.filter.connect(master);
  MUS.next=AC.currentTime+.3;MUS.step=0;
  MUS.timer=setInterval(musicTick,120);
}
const mhz=(semi,base?)=>(base||196)*Math.pow(2,semi/12); // G3 is the home note
function mnote(f,t,dur,type,vol,att?,glide?){
  const o=AC.createOscillator(),g=AC.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t);if(glide)o.frequency.exponentialRampToValueAtTime(f*glide,t+Math.min(dur,.12));
  const a=att||.01;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+a);
  if(a>.3){g.gain.setValueAtTime(vol,t+dur-.7);g.gain.linearRampToValueAtTime(.0001,t+dur)} // pads hold, then let go
  else g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g);g.connect(MUS.gain);o.start(t);o.stop(t+dur+.05);
}
function newMotif(mode){
  // 8 eighth-note slots; -1 is a rest. Night and focus leave more space.
  const density=mode==="day"?.55:mode==="sad"?.3:.38,m=[];
  let i=ri(2,5);
  for(let k=0;k<8;k++){if(Math.random()<density){i=clamp(i+pick([-2,-1,-1,1,1,2,0]),0,MUS_PENTA.length-1);m.push(i)}else m.push(-1)}
  if(m.every(v=>v<0))m[0]=3;
  return m;
}
function musicTick(){
  if(!AC||!MUS.gain)return;
  // fade toward the level the farm wants right now
  const want=musicTarget();MUS.level+=(want-MUS.level)*.2;if(Math.abs(want-MUS.level)<.01)MUS.level=want;
  MUS.gain.gain.setTargetAtTime(1.0*MUS.level,AC.currentTime,.25);
  const wet=rainy()?900:S.weather&&S.weather.k==="cloudy"?1700:night?1900:2800;MUS.filter.frequency.setTargetAtTime(wet,AC.currentTime,1.5);
  if(MUS.level<.02){MUS.next=AC.currentTime+.2;return}
  const mode=musicMode(),bpm=mode==="day"?(curSeason==="summer"?84:76):mode==="focus"?66:mode==="sad"?54:60,eighth=60/bpm/2;
  const prog=MUS_PROG[mode],glitchy=S.story&&S.story.ch>=3&&!S.story.ending,winter=curSeason==="winter";
  while(MUS.next<AC.currentTime+.4){
    const t=MUS.next,s=MUS.step%16;
    if(s===0){MUS.chord=Math.floor(MUS.step/16)%prog.length;
      if(MUS.chord===0&&(MUS.motifAge++%2===0||!MUS.motif.length))MUS.motif=newMotif(mode);
      else if(Math.random()<.35){const k=ri(0,7);MUS.motif[k]=MUS.motif[k]<0?ri(2,7):clamp(MUS.motif[k]+pick([-1,1]),0,MUS_PENTA.length-1)}}
    const ch=prog[MUS.chord],bar=eighth*16;
    // pad: the whole chord, slow in and out
    if(s===0&&mode!=="sad")ch.forEach((n,i)=>mnote(mhz(n),t,bar+.5,i%2?"sine":"triangle",.035,.9));
    // bass on 1 and 3
    if(mode!=="sad"&&(s===0||s===8))mnote(mhz(ch[0]-12),t,eighth*3.5,"sine",.3,.02);
    // melody: the motif twice per bar, pip voice (quick upward glide)
    const v=MUS.motif[s%8];
    if(v!=null&&v>=0&&!(mode==="night"&&s>=8&&Math.random()<.4)){
      let f=mhz(MUS_PENTA[v],392);
      if(glitchy&&Math.random()<.08){mnote(f*pick([.94,1.06]),t,eighth*.6,"square",.06,.005,pick([.5,2]))}
      else if(mode==="sad"||winter){mnote(f,t,eighth*3,"sine",.16,.004);mnote(f*2,t,eighth*1.5,"sine",.05,.004)} // music box, bells in winter
      else mnote(f,t,eighth*(mode==="day"?1.4:2.2),"triangle",.14,.008,1.03);
    }
    // a soft shaker on the off-beats in the day
    if(mode==="day"&&s%4===2&&!rainy())mnote(rand(5200,6400),t,.03,"square",.012,.002);
    MUS.next+=eighth;MUS.step++;
  }
}
document.addEventListener("visibilitychange",()=>{if(MUS.gain&&document.hidden)MUS.gain.gain.setTargetAtTime(0,AC.currentTime,.1)});
