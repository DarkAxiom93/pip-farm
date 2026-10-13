/* ================= the farm's timeline =================
   The first section in the album tab: a small graph of pips and network per day, and the
   whole story of the farm in order (moments, pips that became stars or uploaded, research,
   songs, photos). The graph data is a few numbers per day. */
function histTick(){
  const k=dayKey(Date.now());S.hist=S.hist||{};const h=S.hist[k]||(S.hist[k]={p:0,n:0});
  h.p=Math.max(h.p,S.pips.length);h.n=Math.max(h.n,S.net||0);
  const keys=Object.keys(S.hist).sort();if(keys.length>120)for(const old of keys.slice(0,keys.length-120))delete S.hist[old];
}
function timelineEvents(){
  const ev=[];
  for(const m of S.moments||[])if(!m.old)ev.push({t:m.t,i:"✦",x:momentText(m)});
  for(const s of S.stars||[])ev.push({t:s.died,i:"★",x:`${s.name} הפך לכוכב אחרי ${s.days} ימים`});
  for(const u of S.uploaded||[])ev.push({t:u.t,i:"⌁",x:`${u.name} עלה לרשת`});
  for(const id in S.research||{}){const R=RESEARCH.find(q=>q.id===id);if(R)ev.push({t:S.research[id],i:"⚙",x:`מחקר: ${R.n}`})}
  for(const s of S.songs||[])ev.push({t:s.t,i:"♫",x:`נכתב ${s.n}`});
  if(S.born)ev.push({t:S.born,i:"🌱",x:"החווה נולדה"});
  return ev.filter(e=>e.t).sort((a,b)=>b.t-a.t);
}
function histSvg(){
  const keys=Object.keys(S.hist||{}).sort();if(keys.length<2)return `<p class="albtop">הגרף יתמלא אחרי יומיים של משחק</p>`;
  const W=300,H=90,pad=4,ps=keys.map(k=>S.hist[k].p),ns=keys.map(k=>S.hist[k].n),pm=Math.max(10,...ps);
  const X=i=>pad+i*(W-pad*2)/(keys.length-1),Y=(v,m)=>H-pad-v/m*(H-pad*2);
  const line=(arr,m)=>arr.map((v,i)=>`${X(i).toFixed(1)},${Y(v,m).toFixed(1)}`).join(" ");
  return `<svg viewBox="0 0 ${W} ${H}" class="histsvg" role="img" aria-label="פיפים ורשת לפי ימים">
    <line x1="${pad}" y1="${H-pad}" x2="${W-pad}" y2="${H-pad}" stroke="#4a3a52" stroke-width="1"/>
    <polyline points="${line(ps,pm)}" fill="none" stroke="#b9a2f0" stroke-width="2" stroke-linejoin="round"/>
    <polyline points="${line(ns,100)}" fill="none" stroke="#5dffb0" stroke-width="2" stroke-linejoin="round" stroke-dasharray="${S.net?"":"3 3"}"/>
  </svg><p class="albtop" style="margin-top:2px"><span style="color:#b9a2f0">━ פיפים (עד ${pm})</span> · <span style="color:#5dffb0">━ רשת %</span> · ${keys.length} ימים</p>`;
}
function timelineHtml(){
  const ev=timelineEvents();
  return `<h3>ציר הזמן<small>${ev.length}</small></h3>${histSvg()}<ul class="mem tl">${ev.slice(0,40).map(e=>`<li><span>${e.i} ${esc(e.x)}</span><small>${new Date(e.t).toLocaleDateString("he-IL")}</small></li>`).join("")}</ul>`;
}
