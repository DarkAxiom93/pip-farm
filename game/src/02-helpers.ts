/* ================= helpers ================= */
const $=(id:string):any=>document.getElementById(id);
const rand=(a,b)=>a+Math.random()*(b-a);
const ri=(a,b)=>Math.floor(rand(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid=()=>Math.random().toString(36).slice(2,9);
const level=p=>1+Math.floor(Math.sqrt(p.xp/15));
const stageOf=lv=>lv>=10?"פיפ חכם":lv>=6?"פיפ גדול":lv>=3?"פיפ":"נבט";
const CAPX=0;
const splitNeed=()=>(45+8*S.pips.length)*(curSeason==="spring"?.85:1);
const col=(p,l,s?)=>`hsl(${p.hue},${s??80}%,${l}%)`;
function dom(p){let k=null,m=2;for(const t in p.c){if(p.c[t]>m){m=p.c[t];k=t}}return k}
function traits(p){return Object.keys(p.c).filter(k=>p.c[k]>=3).sort((a,b)=>p.c[b]-p.c[a]).slice(0,2)}
function fmtT(s){s=Math.max(0,Math.ceil(s));const m=Math.floor(s/60);return m+":"+String(s%60).padStart(2,"0")}
function isNight(){const d=new Date(),h=d.getHours()+d.getMinutes()/60;return h>=20.5||h<6}
function words(text){
  return text.replace(/[^\p{L}\p{N}'"׳״ ]+/gu," ").split(/\s+/).map(w=>w.replace(/^['"׳״]+|['"׳״]+$/g,"")).filter(w=>w.length>=2&&w.length<=14&&!STOP.has(w.toLowerCase())&&!(/^[ובהלמש]/.test(w)&&STOP.has(w.slice(1))));
}

