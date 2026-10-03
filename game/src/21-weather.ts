/* weather */
const WNAME={clear:"בהיר",cloudy:"מעונן",rain:"גשם",storm:"סערה",rainbow:"קשת"};
const WNEXT={clear:[["cloudy",.6],["clear",.4]],cloudy:[["rain",.55],["storm",.2],["clear",.25]],rain:[["rainbow",.5],["cloudy",.25],["clear",.25]],storm:[["rain",1]],rainbow:[["clear",1]]};
const WDUR={clear:[180,420],cloudy:[60,160],rain:[90,180],storm:[45,90],rainbow:[35,45]};
let wT=0,flash=0,boltT=5,rainSrc=null,rainGain=null,drops=[];
const stormy=()=>S.weather.k==="storm",rainy=()=>S.weather.k==="rain"||S.weather.k==="storm";
function setWeather(k){
  const[a,b]=WDUR[k];S.weather={k,until:Date.now()+rand(a,b)*1000,watered:false};
  $("hWeather").textContent=weatherLabel();
  if(k==="storm"){toast("סערה! הפיפים רצים להסתתר");S.pips.forEach(p=>{const r=rt(p);if(r.state==="idle"&&Math.random()<.4)say(p,pick(SOUNDS.scared),1.4,"snd","scared")})}
  else if(k==="rain")toast("מתחיל לרדת גשם");
  else if(k==="rainbow"){toast("קשת! כל הפיפים שמחים");S.pips.forEach(p=>p.mood=Math.min(100,p.mood+10));SFX.level()}
  dirty();
}
function rainSound(level){
  if(!AC)return;
  if(level>0&&S.sound){
    if(!rainSrc){const len=AC.sampleRate*2,buf=AC.createBuffer(1,len,AC.sampleRate),d=buf.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
      rainSrc=AC.createBufferSource();rainSrc.buffer=buf;rainSrc.loop=true;const f=AC.createBiquadFilter();f.type="lowpass";f.frequency.value=1400;rainGain=AC.createGain();rainGain.gain.value=0;rainSrc.connect(f);f.connect(rainGain);rainGain.connect(master);rainSrc.start()}
    rainGain.gain.setTargetAtTime(level,AC.currentTime,.8);
  }else if(rainGain)rainGain.gain.setTargetAtTime(0,AC.currentTime,.4);
}
function thunder(){
  if(!AC||!S.sound)return;
  const len=AC.sampleRate*1.8,buf=AC.createBuffer(1,len,AC.sampleRate),d=buf.getChannelData(0);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2);
  const src=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();src.buffer=buf;f.type="lowpass";f.frequency.value=180;g.gain.value=1.4;src.connect(f);f.connect(g);g.connect(master);src.start(AC.currentTime+rand(.1,.5));
}
function updateWeather(dt){
  if(Date.now()>=S.weather.until){let k=Math.random(),nx="clear";for(const[n,w] of WNEXT[S.weather.k]){if((k-=w)<=0){nx=n;break}}if(S.streak.days>=3){if(nx==="storm"&&Math.random()<.7)nx="rain";if(S.weather.k==="rain"&&Math.random()<.3)nx="rainbow"}setWeather(nx)}
  wT-=dt;if(wT<=0){wT=1;
    rainSound(rainy()?(stormy()?.5:.28):0);
    if(rainy()){let n=0;S.plots.forEach(pl=>{if(pl.crop&&!pl.crop.water&&cropFrac(pl.crop)<1){pl.crop.water=true;n++}});if(n&&!S.weather.watered){S.weather.watered=true;toast("הגשם השקה את השדה")}}
  }
  flash=Math.max(0,flash-dt*2.5);
  if(stormy()){boltT-=dt;if(boltT<=0){boltT=rand(4,10);flash=1;thunder();S.pips.forEach(p=>{const r=rt(p);if(r.state!=="sleep"&&Math.random()<.2){r.state="act";r.act="hide";r.ct=1.2;r.fx=p.x+1}})}}
}

