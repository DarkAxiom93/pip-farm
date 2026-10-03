/* ================= state ================= */
let S=null, sel=null, tab="pip", night=isNight();
const RT=new Map(); // runtime per pip id

function wpick(ws){let k=Math.random()*ws.reduce((a,b)=>a+b,0);for(let i=0;i<ws.length;i++){if((k-=ws[i])<=0)return i}return 0}
function rollGenes(){const g={};for(const k in GENE_W)g[k]=wpick(GENE_W[k]);return g}
function inherit(pg){const g={};for(const k in GENE_W)g[k]=Math.random()<.78?(pg&&pg[k]!=null?pg[k]:0):wpick(GENE_W[k]);return g}
function rollMut(par){if(par.mut&&Math.random()<.45)return par.mut;if((par.cave||0)>=3&&Math.random()<.1)return "crystal";return Math.random()<.04*(par.mood>90?2:1)*(S.meteorBoost>0?2:1)?pick(MUTS):null}
function traitKeys(p){const g=p.g||{};const k=[`head:${p.sprout}`,`pattern:${g.pattern||0}`,`tail:${g.tail||0}`,`eyes:${g.eyes||0}`,`body:${g.body||0}`];if(p.mut)k.push("mut:"+p.mut);return k}
function traitLabel(key){const[c,v]=key.split(":"),sec=ALBUM.find(a=>a.k===c);if(!sec)return key;const i=c==="mut"?MUTS.indexOf(v):+v;return sec.items[i]||key}
function discover(p,announce){
  let found=[];
  for(const k of traitKeys(p))if(!S.album[k]){S.album[k]=Date.now();found.push(k)}
  if(!announce||!found.length)return;
  for(const k of found){
    if(k.startsWith("mut:")){S.sparks+=20;SFX.level();burst(p.x,p.y-10,"confetti",30);toast(`מוטציה נדירה! ${p.name} נולד ${traitLabel(k)}. ‎+20 ניצוצות`)}
    else{S.sparks+=3;toast(`גילוי חדש באלבום: ${traitLabel(k)}. ‎+3`)}
  }
  renderAlbCount();if(tab==="album")renderAlbum();
}
function pipName(){const used=new Set(S?S.pips.map(p=>p.name):[]);for(let i=0;i<30;i++){const n=pick(NA)+pick(NB);if(!used.has(n))return n}return pick(NA)+pick(NB)+ri(2,9)}
function newPip(parent){
  const p={id:uid(),name:pipName(),hue:parent?(parent.exotic?(parent.hue+rand(-14,14)+360)%360:clamp(parent.hue+rand(-16,16),HMIN,HMAX)):56,exotic:parent?parent.exotic||undefined:undefined,
    sprout:parent?(Math.random()<.22?wpick(HEAD_W):parent.sprout):0,
    g:parent?inherit(parent.g):{pattern:0,tail:0,eyes:0,body:0},mut:parent?rollMut(parent):null,
    pitch:parent?clamp(parent.pitch*rand(.86,1.17),320,1100):640,
    xp:0,growth:0,food:parent?parent.food:80,mood:75,energy:100,
    c:parent?{work:parent.c.work>>1,talk:parent.c.talk>>1,pet:parent.c.pet>>1,task:parent.c.task>>1}:{work:0,talk:0,pet:0,task:0},
    vocab:parent?parent.vocab.filter(()=>Math.random()<.55):[],
    gen:parent?parent.gen+1:1,parent:parent?parent.id:null,born:Date.now(),convo:[],lang:parent?Object.assign({},parent.lang||{}):{},tribe:parent?parent.tribe||null:null,awake:parent?parent.awake||undefined:undefined,life:Math.round(rand(6,9)*86400000),trust:parent?Math.round((parent.trust??30)*.7+10):30,mem:parent?[{k:'born',t:Date.now(),v:Math.round(parent.trust??30)}]:[],
    x:parent?parent.x+6:150,y:parent?parent.y:84};
  return p;
}
function freshState(){
  S={v:1,sparks:5,basket:2,plots:PLOTS.map((_,i)=>({owned:i<2,crop:null})),seeds:[true,false,false],pips:[],tasks:[],
     stats:{splits:0,harvests:0,tasksDone:0,shared:0,asked:0,decoded:0,choirs:0,needs:0,calmed:0,fights:0},quest:0,buys:{},hol:{},meteorBoost:0,nextEvent:Date.now()+6*60000,snowmen:[],fastSeasons:false,fastStory:false,story:null,stars:[],wood:0,treeCut:{},wild:[],builds:{},items:{},craftQ:[],lex:{},album:{},tribes:[],zones:{},streak:{days:0,last:"",best:0},focus:null,drawings:[],statue:null,nodeCd:{},weather:{k:"clear",until:Date.now()+150000},lastSeed:0,ai:true,sound:true,music:true,lastSeen:Date.now(),born:Date.now()};
  const p:any=newPip(null);p.name="פיפי";p.x=128;p.y=82;p.question="?";p.founder=true;
  S.pips.push(p);
  S.plots[0].crop={type:0,planted:Date.now()-70000,water:false};
  discover(p,false);
  return S;
}
function hydrate(d){
  const base=freshState();
  S=Object.assign(base,d);
  S.stats=Object.assign({splits:0,harvests:0,tasksDone:0,shared:0,asked:0,decoded:0,choirs:0,needs:0,calmed:0,fights:0},d.stats||{});
  S.lex=d.lex||{};S.album=d.album||{};S.tribes=d.tribes||[];S.zones=d.zones||{};S.nodeCd=d.nodeCd||{};S.weather=d.weather&&d.weather.k?d.weather:{k:"clear",until:Date.now()+150000};
  S.plots=PLOTS.map((_,i)=>Object.assign({owned:i<2,crop:null},(d.plots||[])[i]||{}));
  S.plots.forEach(pl=>delete pl.pending);
  S.pips=(d.pips&&d.pips.length?d.pips:base.pips).map(p=>Object.assign(newPip(null),p,{c:Object.assign({work:0,talk:0,pet:0,task:0},p.c||{}),vocab:p.vocab||[],convo:p.convo||[],lang:p.lang||{},g:p.g||(p.name==="פיפי"&&p.gen===1?{pattern:0,tail:0,eyes:0,body:0}:rollGenes()),mut:p.mut||null})).map(p=>{if(!p.exotic&&(p.hue<HMIN||p.hue>HMAX))p.hue=HMIN+((p.hue%360+360)%360)/360*(HMAX-HMIN);return p});
  S.tasks=d.tasks||[];
  S.drawings=d.drawings||[];S.statue=d.statue||null;S.buys=d.buys||{};S.story=d.story||null;S.fastStory=!!d.fastStory;S.loop=d.loop||0;S.runs=d.runs||[];S.letters=d.letters||{};S.moments=d.moments||[];S.ach=d.ach||{};S.daily=d.daily||null;S.lateNote=d.lateNote||"";S.music=d.music!==false;S.wood=d.wood||0;S.treeCut=d.treeCut||{};S.wild=d.wild||[];S.builds=d.builds||{};S.items=d.items||{};S.craftQ=d.craftQ||[];S.hol=d.hol||{};S.meteorBoost=d.meteorBoost||0;S.nextEvent=d.nextEvent||Date.now()+5*60000;S.snowmen=d.snowmen||[];S.fastSeasons=!!d.fastSeasons;S.meteor=d.meteor||null;S.visitor=null;S.stars=d.stars||[];S.quest=d.quest!=null?d.quest:((S.stats.splits||0)>0?99:0);if(S.quest>=9&&!d.wood&&!d.builds)S.quest=9;S.streak=d.streak||{days:0,last:"",best:0};S.focus=d.focus||null;S.stats.focusMin=S.stats.focusMin||0;S.stats.focusRuns=S.stats.focusRuns||0;
  S.pips.forEach(p=>{discover(p,false);if(p.tribe&&!S.tribes.some(t=>t.id===p.tribe))p.tribe=null;if(p.trust==null)p.trust=30;if(!p.mem)p.mem=[];if(!p.life)p.life=Math.round(rand(6,9)*86400000)});
  if(!S.pips.some(p=>p.founder)){const f=S.pips.find(p=>p.gen===1&&!p.parent);if(f)f.founder=true}
  return S;
}
function rt(p){
  let r=RT.get(p.id);
  if(!r){r={state:"idle",wait:rand(.5,2),tx:p.x,ty:p.y,dir:1,anim:rand(0,9),blink:rand(1,4),talk:0,ct:0,nextTalk:rand(4,12),nextQ:rand(40,90),job:null,nap:false,goal:null,xpCd:0,petCd:0,need:null,nextNeed:rand(25,70),sing:0};RT.set(p.id,r)}
  return r;
}
function serialize(){
  S.lastSeen=Date.now();
  const big=S.pips.length>60,vN=big?24:40,cN=big?4:8;
  const tasks=[...S.tasks.filter(t=>!t.done),...S.tasks.filter(t=>t.done).slice(-15)].slice(-60);
  return {v:1,sparks:S.sparks,basket:S.basket,seeds:S.seeds,lastSeed:S.lastSeed||0,lex:S.lex,album:S.album,tribes:S.tribes,drawings:S.drawings.slice(-14),streak:S.streak,quest:S.quest,buys:S.buys,hol:S.hol,meteorBoost:S.meteorBoost,nextEvent:S.nextEvent,snowmen:S.snowmen,fastSeasons:S.fastSeasons,meteor:S.meteor,stars:S.stars.slice(-60),story:S.story,fastStory:S.fastStory,wood:S.wood,treeCut:S.treeCut,wild:S.wild,builds:S.builds,items:S.items,craftQ:S.craftQ,focus:S.focus,statue:S.statue,zones:S.zones,nodeCd:S.nodeCd,weather:S.weather,stats:S.stats,ai:S.ai,sound:S.sound,music:S.music,loop:S.loop||0,runs:S.runs||[],letters:S.letters||{},moments:(S.moments||[]).slice(-60),ach:S.ach||{},daily:S.daily||null,lateNote:S.lateNote||"",lastSeen:S.lastSeen,born:S.born,
    plots:S.plots.map(p=>({owned:p.owned,crop:p.crop})),tasks,
    pips:S.pips.map(p=>({id:p.id,name:p.name,hue:Math.round(p.hue),sprout:p.sprout,pitch:Math.round(p.pitch),xp:p.xp,growth:p.growth,
      food:Math.round(p.food*10)/10,mood:Math.round(p.mood),energy:Math.round(p.energy),c:p.c,vocab:p.vocab.slice(-vN),gen:p.gen,parent:p.parent,born:p.born,
      convo:p.convo.slice(-cN).map(m=>({r:m.r,t:String(m.t).slice(0,120),w:m.w})),lang:p.lang,g:p.g,mut:p.mut||null,tribe:p.tribe||null,cave:p.cave||0,trust:Math.round(p.trust??30),life:p.life,founder:p.founder||undefined,echo:p.echo||undefined,awake:p.awake||undefined,blank:p.blank||undefined,exotic:p.exotic||undefined,mem:(p.mem||[]).slice(-4),question:p.question||null,x:Math.round(p.x),y:Math.round(p.y)}))};
}

