/* ================= persistence ================= */
let db=null,userId=null,writing=false,again=false,dirtyT=null;
function saveNow(){
  const d=serialize();
  try{localStorage.setItem(KEY,JSON.stringify(d))}catch(e){}
  platformSave(d);
  if(!db||!userId)return;
  if(writing){again=true;return}
  let body=d;try{if(JSON.stringify(d).length>230000){body=Object.assign({},d,{pips:d.pips.map(p=>Object.assign({},p,{convo:p.convo.slice(-2),vocab:p.vocab.slice(-12),mem:p.mem.slice(-2)})),stars:d.stars.slice(-30),drawings:[]})}}catch(_){}
  writing=true;
  db.doc("data/users/"+userId+"/pipfarm").set(body).catch(()=>{}).finally(()=>{writing=false;if(again){again=false;saveNow()}});
}
function dirty(){clearTimeout(dirtyT);dirtyT=setTimeout(saveNow,1500)}
setInterval(saveNow,30000);
addEventListener("pagehide",()=>{try{localStorage.setItem(KEY,JSON.stringify(serialize()))}catch(e){}});

function catchUp(){
  const el=(Date.now()-(S.lastSeen||Date.now()))/1000;
  if(el<120)return;
  const e=Math.min(el,7*86400);
  let shared=0;
  S.pips.forEach(p=>{p.food=Math.max(0,p.food-e/360);p.energy=100});
  const swaps=Math.min(12,Math.floor(e/600));
  for(let i=0;i<swaps&&S.pips.length>1;i++){
    const a=pick(S.pips),b=pick(S.pips);if(a===b||!a.vocab.length)continue;
    const w=pick(a.vocab);if(!b.vocab.includes(w)){b.vocab.push(w);shared++;S.stats.shared++}
  }
  const ripe=S.plots.filter(pl=>pl.crop&&cropFrac(pl.crop)>=1).length;
  const hrs=e>=3600?Math.round(e/3600)+" שעות":Math.round(e/60)+" דקות";
  let msg=`בזמן שלא היית (${hrs})`;
  const bits=[];
  if(ripe)bits.push(`${ripe} חלקות הבשילו`);
  const gone=[];for(const p of [...S.pips]){if(S.pips.length<=6)break;if(!p.founder&&ageOf(p)>p.life)gone.push(becomeStar(p,true).name)}
  if(gone.length)bits.push(`${gone.slice(0,3).join(", ")}${gone.length>3?` ועוד ${gone.length-3}`:""} הפכו לכוכבים`);
  if(shared)bits.push(`${shared} מילים עברו בין הפיפים`);
  const hungry=S.pips.filter(p=>p.food<25).length;
  if(hungry)bits.push(`${hungry} פיפים רעבים`);
  const hrsN=e/3600,dr=makeDrawings(hrsN);
  if(dr)bits.push(`הם ציירו לך ${dr} ציורים על האדמה`);
  if(hrsN>=48){const days=Math.floor(hrsN/24);S.pips.forEach(p=>{bond(p,-Math.min(15,5*(days-1)),"missed");p.mood=Math.max(0,p.mood-20)});bits.push("הם התגעגעו מאוד")}
  toast(bits.length?msg+": "+bits.join(", "):msg+" הפיפים חיכו לך");
  pendingWelcome=e/60;
}
let pendingWelcome=0;

