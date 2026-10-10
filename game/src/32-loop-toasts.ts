/* ================= loop ================= */
let last=performance.now();
let errCount=0;
function frame(now){
  const dt=Math.min(.1,(now-last)/1000);last=now;
  try{update(dt)}catch(e){if(errCount++<5)console.error("update",e)}
  try{render(now/1000)}catch(e){if(errCount++<5)console.error("render",e);try{ctx.setTransform(PR,0,0,PR,0,0);CX=ctx;ctx.globalAlpha=1}catch(_){}}
  requestAnimationFrame(frame);
}

/* ================= toasts ================= */
const LOG=[];let lastToast=0;
const IMPORTANT=/משימת פתיחה|נפתח:|מוטציה|פסל|רצף|ריכוז|התפצל|נוסד שבט|פיענחת|קשת|סערה|הם ציירו|בזמן שלא היית/;
function toast(msg,imp?){
  imp=imp||IMPORTANT.test(msg);
  LOG.push({t:Date.now(),msg,imp});if(LOG.length>120)LOG.shift();
  if(!$("logBox").hidden)renderLog();
  const now=performance.now();
  if(!imp&&now-lastToast<2600)return;
  lastToast=now;
  const box=$("toasts");const el=document.createElement("div");el.className="toast";el.textContent=msg;box.appendChild(el);
  while(box.children.length>2)box.firstChild.remove();
  setTimeout(()=>{el.classList.add("out");setTimeout(()=>el.remove(),450)},imp?4600:3200);
}
function renderLog(){$("logList").innerHTML=LOG.slice().reverse().map(e=>`<li class="${e.imp?"imp":""}"><span>${esc(e.msg)}</span><small>${new Date(e.t).toLocaleTimeString("he-IL",{hour:"2-digit",minute:"2-digit"})}</small></li>`).join("")||"<li>עוד לא קרה כלום</li>"}
$("hMore").addEventListener("click",()=>{const h=document.querySelector(".hud"),o=!h.classList.contains("open");h.classList.toggle("open",o);$("hMore").setAttribute("aria-expanded",String(o))});
$("hLog").addEventListener("click",()=>{const b=$("logBox");b.hidden=!b.hidden;if(!b.hidden)renderLog()});
$("logClose").addEventListener("click",()=>{$("logBox").hidden=true});

