/* ================= easier controls =================
   - with a mouse, whatever you can click lights up with corner marks, and the cursor turns to a hand
   - keyboard: arrows or WASD move the map, + and - zoom, Space jumps to the selected pip,
     1 to 5 switch the side tabs
   - the map keeps gliding a little after you drag and let go */
let hover=null,camVel=null;
function hoverAt(x,y){
  const ord=S.pips.filter(p=>inView(p.x,p.y,20)&&rt(p).state!=="hidden").sort((a,b)=>b.y-a.y);
  for(const p of ord){const bw=7+Math.floor(Math.min(level(p),10)*.4);if(Math.abs(x-p.x)<bw/2+3&&y>p.y-bw-6&&y<p.y+3)return{k:"pip",p}}
  if(Math.hypot(x-FIRE.x,y-(FIRE.y-3))<=7)return{k:"box",x:FIRE.x-8,y:FIRE.y-10,w:16,h:12};
  for(const d of S.digs||[])if(Math.hypot(d.x-x,d.y-1-y)<7)return{k:"box",x:d.x-4,y:d.y-5,w:8,h:7};
  for(const c of critters)if(Math.hypot(c.x-x,c.y-y)<6)return{k:"box",x:c.x-4,y:c.y-4,w:8,h:7};
  for(const f of fishes)if(Math.hypot(f.x-x,f.y-y)<6)return{k:"box",x:f.x-5,y:f.y-3,w:10,h:6};
  {const f=FLOWERS.find(f=>{const z=zoneAt(f.x,f.y);return z&&zoneOpen(z.id)&&Math.hypot(f.x-x,f.y-6-y)<6});if(f)return{k:"box",x:f.x-4,y:f.y-11,w:9,h:12}}
  {const d=decorAt(x,y);if(d)return{k:"box",x:d.x-8,y:d.y-19,w:16,h:21}}
  for(let i=0;i<PLOTS.length;i++){const g=PLOTS[i];if(g.z&&!zoneOpen(g.z))continue;if(x>=g.x-2&&x<=g.x+PW+2&&y>=g.y-2&&y<=g.y+PH+4)return{k:"box",x:g.x-2,y:g.y-2,w:PW+4,h:PH+5}}
  {const ti=hitTree(x,y);if(ti>=0){const t=TREES[ti];return{k:"box",x:t.x-t.s-2,y:t.y-7-t.s*2-1,w:t.s*2+4,h:t.s*2+9}}}
  {const w=S.wild.find(q=>Math.abs(q.x-x)<5&&Math.abs(q.y-2-y)<5);if(w)return{k:"box",x:w.x-4,y:w.y-5,w:8,h:7}}
  {const bk=hitBuilding(x,y);if(bk&&zoneOpen("farm")){const B=BUILD[bk];return{k:"box",x:B.x-12,y:B.y-17,w:24,h:21}}}
  if(S.story&&S.story.glitch&&Math.hypot(x-S.story.glitch.x,y-(S.story.glitch.y-6))<11){const g=S.story.glitch;return{k:"box",x:g.x-7,y:g.y-13,w:14,h:14}}
  return null;
}
function drawHover(t){
  if(!hover||placing||starMode)return;
  const a=.55+.25*Math.sin(t*6),c=`rgba(255,247,214,${a})`;
  if(hover.k==="pip"){const p=hover.p;if(!byId(p.id))return;const bw=7+Math.floor(Math.min(level(p),10)*.4);
    CX.strokeStyle=c;CX.lineWidth=.5;CX.beginPath();CX.ellipse(p.x,p.y-.5,bw/2+2.5,2.2,0,0,Math.PI*2);CX.stroke();return}
  const {x,y,w,h}=hover,L=Math.min(3,w/3,h/3);
  R(x,y,L,.5,c);R(x,y,.5,L,c);R(x+w-L,y,L,.5,c);R(x+w-.5,y,.5,L,c);
  R(x,y+h-.5,L,.5,c);R(x,y+h-L,.5,L,c);R(x+w-L,y+h-.5,L,.5,c);R(x+w-.5,y+h-L,.5,L,c);
}
cv.addEventListener("pointermove",e=>{
  if(e.pointerType!=="mouse"||drag){hover=null;return}
  const[x,y]=toWorld(e);hover=hoverAt(x,y);cv.style.cursor=hover||placing||starMode?"pointer":"grab";
});
cv.addEventListener("pointerleave",()=>{hover=null});
// the map glides on after a drag
function glideTick(dt){
  if(!camVel)return;
  cam.x+=camVel.x*dt;cam.y+=camVel.y*dt;clampCam();
  const k=Math.pow(.04,dt);camVel.x*=k;camVel.y*=k;
  if(Math.hypot(camVel.x,camVel.y)<3)camVel=null;
}
addEventListener("keydown",e=>{
  const tg=e.target as HTMLElement;if(tg&&(tg.tagName==="INPUT"||tg.tagName==="TEXTAREA"||tg.tagName==="SELECT"||tg.isContentEditable))return;
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  const step=60/cam.z,k=e.key.toLowerCase();let dx=0,dy=0;
  if(k==="arrowleft"||k==="a")dx=-step;else if(k==="arrowright"||k==="d")dx=step;else if(k==="arrowup"||k==="w")dy=-step;else if(k==="arrowdown"||k==="s")dy=step;
  if(dx||dy){const vw=CW/cam.z,vh=CH/cam.z;camVel=null;lookAt(cam.x+vw/2+dx,cam.y+vh/2+dy);e.preventDefault();return}
  if(k==="+"||k==="="){zoomAt(cam.z*1.25,.5,.5);e.preventDefault();return}
  if(k==="-"||k==="_"){zoomAt(cam.z/1.25,.5,.5);e.preventDefault();return}
  if(k===" "){const p=sel&&byId(sel);if(p){lookAt(p.x,p.y);e.preventDefault()}return}
  const tabs=["pip","tasks","lang","album","farm"],n=+e.key;if(n>=1&&n<=5){audio();setTab(tabs[n-1])}
});
