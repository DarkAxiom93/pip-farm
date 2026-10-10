// The farm slowly turns digital as the story goes on: circuit traces creep through the
// grass, the pond starts raining code, and the trees grow cable roots.
function digi(){const s=S&&S.story;if(!s)return 0;if(s.ending)return 1;return clamp((s.ch||0)/6,0,1)}
const DIGI_STEPS=[{at:.15,msg:"משהו מזמזם מתחת לדשא..."},{at:.45,msg:"הבריכה מתחילה לטפטף קוד"},{at:.75,msg:"לעצים צמחו כבלים במקום שורשים"},{at:1,msg:"החווה כמעט כולה דיגיטלית עכשיו"}];
const TRACES=(()=>{let seed=7331;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
  const land=(x,y)=>x>4&&x<WW-4&&y>8&&y<WH-4&&!inPond(x,y)&&Math.abs(x-riverX(y))>16;
  const out=[];let tries=0;
  while(out.length<90&&tries++<2000){let x=Math.round(8+rnd()*(WW-16)),y=Math.round(10+rnd()*(WH-16));if(!land(x,y))continue;
    const pts=[[x,y]];let dir=Math.floor(rnd()*4),ok=true;
    for(let s=0;s<3+Math.floor(rnd()*3);s++){const len=6+Math.floor(rnd()*16),dx=[1,0,-1,0][dir],dy=[0,1,0,-1][dir];
      x+=dx*len;y+=dy*len;if(!land(x,y)){ok=false;break}pts.push([x,y]);dir=(dir+(rnd()<.5?1:3))%4}
    if(ok&&pts.length>2){let L=0;for(let i=1;i<pts.length;i++)L+=Math.abs(pts[i][0]-pts[i-1][0])+Math.abs(pts[i][1]-pts[i-1][1]);out.push({pts,L,o:rnd()*9})}}
  return out})();
function tracePoint(tr,d){for(let i=1;i<tr.pts.length;i++){const a=tr.pts[i-1],b=tr.pts[i],l=Math.abs(b[0]-a[0])+Math.abs(b[1]-a[1]);if(d<=l){const f=d/l;return[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f]}d-=l}return tr.pts[tr.pts.length-1]}
function drawDigital(t){
  const lv=digi();if(lv<=0)return;
  const n=Math.floor(TRACES.length*Math.min(1,lv*1.15));
  for(let k=0;k<n;k++){const tr=TRACES[k];const p0=tr.pts[0];if(!inView(p0[0],p0[1],70))continue;
    if(tr.pts.some(q=>!zoneOpen(ZONES[zid(q[0],q[1])].id)))continue;
    for(let i=1;i<tr.pts.length;i++){const a=tr.pts[i-1],b=tr.pts[i];const x=Math.min(a[0],b[0]),y=Math.min(a[1],b[1]);
      R(x,y,Math.abs(b[0]-a[0])+.5,Math.abs(b[1]-a[1])+.5,"rgba(16,50,34,.45)");R(x-.5,y-.5,Math.abs(b[0]-a[0])+.5,Math.abs(b[1]-a[1])+.5,"rgba(120,255,195,.38)")}
    const e=tr.pts[tr.pts.length-1];R(p0[0]-1,p0[1]-1,2,2,"rgba(255,207,74,.55)");R(e[0]-1,e[1]-1,2,2,"rgba(255,207,74,.55)");R(e[0]-.5,e[1]-.5,1,1,"rgba(20,40,30,.7)");
    const d=((t*14+tr.o*30)%(tr.L+30));if(d<tr.L){const q=tracePoint(tr,d);R(q[0]-.5,q[1]-.5,1,1,"#bfffe0");R(q[0]-1,q[1]-.25,2,.5,"rgba(140,255,200,.5)")}}
  // the pond rains code
  if(lv>=.45&&inView(POND.x,POND.y,30)){const a=Math.min(1,(lv-.35)*2);
    for(let c=0;c<9;c++){const x=POND.x-18+c*4.5,sp=6+(c*7)%5,y0=POND.y-14+((t*sp+c*13)%26);
      for(let j=0;j<4;j++){const y=y0-j*2;if(!inPond(x,y)||!inPond(x+1,y))continue;ctx.globalAlpha=a*(1-j*.22);R(x,y,((c+j+Math.floor(t*3))&1)?1:.5,1.5,j?"#3fdc8f":"#d6ffe9")}}
    ctx.globalAlpha=1}
  // and so does the river, near the end
  if(lv>=.85&&inView(548,0,300)){ctx.globalAlpha=.6;for(let i=0;i<14;i++){const y=(t*22+i*23.7)%WH,x=riverX(y)-7+((i*29)%14);R(x,y,.5,1.5,"#7dffbf");R(x,y-2,.5,1,"rgba(125,255,191,.5)")}ctx.globalAlpha=1}
  // cable roots under the trees
  if(lv>=.6){const m=Math.floor(BGTREES.length*Math.min(1,(lv-.5)*2));
    for(let i=0;i<m;i++){const tr=BGTREES[i];if(!inView(tr.x,tr.y,20))continue;if(!zoneOpen(ZONES[zid(tr.x,tr.y)].id))continue;
      const by=tr.y+6;for(let s=-1;s<=1;s+=2){const len=3+((i*5+s+7)%4);R(tr.x+(s<0?-len:1),by,len,.5,"#232a33");R(tr.x+(s<0?-len:1+len)-.5,by-.25,1,1,(Math.sin(t*3+i+s)>.3)?"#5dffb0":"#2d6b4f")}}}
}
function digiTick(){
  if(!S||!S.story)return;const lv=digi(),seen=S.story.digi||0;
  let k=seen;while(k<DIGI_STEPS.length&&lv>=DIGI_STEPS[k].at)k++;
  if(k>seen){S.story.digi=k;toast(DIGI_STEPS[k-1].msg,1);dirty()}
}
