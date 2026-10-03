/* ================= render ================= */
function drawPlot(i,t){
  const g=PLOTS[i],pl=S.plots[i];
  if(!pl.owned){
    for(let x=0;x<PW;x+=4){R(g.x+x,g.y,2,1,"rgba(255,255,255,.28)");R(g.x+x,g.y+PH-1,2,1,"rgba(255,255,255,.28)")}
    for(let y=0;y<PH;y+=4){R(g.x,g.y+y,1,2,"rgba(255,255,255,.28)");R(g.x+PW-1,g.y+y,1,2,"rgba(255,255,255,.28)")}
    R(g.x+PW/2-3,g.y+PH/2,7,1,"rgba(255,255,255,.5)");R(g.x+PW/2,g.y+PH/2-3,1,7,"rgba(255,255,255,.5)");
    return;
  }
  const c=pl.crop,wet=c&&c.water;
  R(g.x-1,g.y-1,PW+2,PH+2,"#3d2819");
  R(g.x,g.y,PW,PH,wet?"#4e3423":"#6b4a32");
  for(let y=4;y<PH;y+=6)R(g.x+2,g.y+y,PW-4,2,wet?"#3f2a1c":"#5a3d29");
  if(!c){if(pl.pending)R(g.x+PW/2-1,g.y+PH/2-1,3,3,"#c89c63");return}
  const cr=CROPS[c.type],f=cropFrac(c),st=f>=1?3:Math.floor(f*3);
  for(let j=0;j<2;j++)for(let k=0;k<4;k++){
    const x=g.x+7+k*11,y=g.y+11+j*12;
    if(st===0){R(x,y-1,1,2,cr.leaf)}
    else if(st===1){R(x,y-2,1,3,cr.leaf);R(x-1,y-2,1,1,cr.leaf);R(x+1,y-3,1,1,cr.leaf)}
    else if(st===2){R(x,y-4,1,5,cr.leaf);R(x-2,y-3,2,1,cr.leaf);R(x+1,y-4,2,1,cr.leaf);R(x,y-5,1,1,cr.fruit)}
    else{R(x,y-4,1,4,cr.leaf);R(x-2,y-3,2,1,cr.leaf);R(x+1,y-3,2,1,cr.leaf);
      if(cr.star){R(x-1,y-7,3,1,cr.fruit);R(x,y-8,1,3,cr.fruit);R(x,y-7,1,1,"#fff7c2")}
      else{R(x-1,y-6,3,3,cr.fruit);R(x-1,y-6,1,1,"rgba(255,255,255,.55)")}
      if(Math.sin(t*3+k*1.7+j)>.92)R(x+2,y-8,1,1,"#fff")}
  }
  if(st<3){const w=Math.round(PW*clamp(f,0,1));R(g.x,g.y+PH+2,PW,2,"rgba(0,0,0,.35)");R(g.x,g.y+PH+2,w,2,wet?"#6aaedc":"#86d47f")}
}
function drawPip(p,t,isSel,r?,px?,py?){
  r=r||rt(p);px=px??p.x;py=py??p.y;
  const g=p.g||{},mut=p.mut,lv=level(p);
  const bw=Math.max(5,7+Math.floor(Math.min(lv,10)*.4)+(g.body?2:0)-(mut==="tiny"?2:0)),bh=bw-1-(g.body?1:0);
  let hop=0;
  if(r.state==="walk")hop=Math.abs(Math.sin(r.anim*11))*1.6;
  if(r.state==="celebrate")hop=Math.abs(Math.sin(r.anim*12))*5;
  if(r.state==="act"){if(r.act==="dance"&&Math.random()<.2)r.dir=-r.dir;if(r.act==="hop")hop=Math.abs(Math.sin(r.anim*12))*5;else if(r.act==="dance")hop=Math.abs(Math.sin(r.anim*16))*3;else if(r.act==="nuzzle")hop=Math.abs(Math.sin(r.anim*6))*1.5}
  if(r.state==="work")hop=Math.abs(Math.sin(r.anim*16))*1;
  if(r.state==="eat")hop=Math.abs(Math.sin(r.anim*20))*.8;
  if(r.state==="choir")hop=r.sing>0?Math.abs(Math.sin(r.anim*14))*1.5:0;
  if(r.state==="argue")hop=Math.abs(Math.sin(r.anim*18))*2;
  if(mut==="wings"&&r.state!=="sleep")hop+=2+Math.sin(t*4+(p.born%7))*1;
  let wob=r.state==="split"?Math.round(Math.sin(r.anim*34)*(1+(2.2-r.ct))):0;
  const sleep=r.state==="sleep";
  const breath=sleep?Math.round((Math.sin(t*2)+1)*.5):(r.state==="act"&&r.act==="hide"?2:0);
  const bww=bw+Math.abs(wob),x0=Math.round(px-bww/2+(wob>0?1:0));let y0=Math.round(py-bh-hop)+breath;
  r.head=y0-3;
  const hue=mut==="rainbow"?(p.hue+t*70)%360:p.hue;
  const eld=p.born&&p.life!=null&&isElder(p),fade=r.state==="pass"?Math.max(0,r.ct/6):1;
  if(r.state==="pass")y0-=Math.round((1-fade)*10);
  const C=(l,sat?)=>mut==="gold"?`hsl(46,${sat??92}%,${l}%)`:`hsl(${hue},${sat??(eld?45:80)}%,${l}%)`;
  if(r.state==="pass")CX.globalAlpha=.25+.75*fade;
  const body=C(72),dark=C(52,46),lite=C(86,80),out=C(24,55);
  R(px-bw/2+1,py-1,bw-2,2,"rgba(0,0,0,.28)");
  if(mut==="glow"){const a=.2+.14*Math.sin(t*3);R(x0-2,y0-1,bww+4,bh+3,`hsla(${hue},100%,82%,${a})`);R(x0-1,y0-3,bww+2,bh+6,`hsla(${hue},100%,82%,${a})`)}
  if(lv>=10){const gl=.35+.25*Math.sin(t*2);R(x0+1,y0-6,bww-2,1,`rgba(255,226,140,${gl})`);R(x0,y0-5,1,1,`rgba(255,226,140,${gl})`);R(x0+bww-1,y0-5,1,1,`rgba(255,226,140,${gl})`)}
  const bh2=bh-breath,dir=r.dir||1,ax=dir>0?x0-1:x0+bww;
  const TR=(o,dy,w,h,c)=>R(dir>0?ax-o-w+1:ax+o,y0+dy,w,h,c);
  // tail, behind the body, on the side it walks away from
  if(g.tail===1){TR(0,bh2-4,2,1,out);TR(1,bh2-6,1,2,out);TR(0,bh2-7,1,1,out)}
  else if(g.tail===2){TR(0,bh2-5,3,3,lite);TR(2,bh2-5,1,1,out)}
  else if(g.tail===3){TR(0,bh2-4,2,1,"#3f8f3a");TR(1,bh2-6,3,2,"#6fcf5a")}
  if(mut==="wings"){const f=Math.floor(t*9+(p.born%5))%2;R(x0-3,y0+1-f,3,2+f,"#eef7ff");R(x0+bww,y0+1-f,3,2+f,"#eef7ff");R(x0-3,y0+1-f,1,1,"#bcdcff");R(x0+bww+2,y0+1-f,1,1,"#bcdcff")}
  if(mut==="crystal")CX.globalAlpha=.6;
  R(x0,y0-1,bww,bh2+2,out);R(x0-1,y0,bww+2,bh2,out);
  R(x0+1,y0,bww-2,bh2,body);R(x0,y0+1,bww,bh2-2,body);
  R(x0+1,y0+bh2-2,bww-2,2,dark);R(x0,y0+bh2-3,1,1,dark);R(x0+bww-1,y0+bh2-3,1,1,dark);
  CX.globalAlpha=1;
  R(x0+1,y0+1,2,1,lite);R(x0+1,y0+2,1,1,lite);
  if(mut==="crystal"){const k=Math.floor(t*3)%Math.max(1,bww-2);R(x0+1+k,y0+1+(k%3),1,1,"#ffffff")}
  if(mut==="gold"){const k=Math.floor(t*7)%(bww+8)-4;if(k>=0&&k<bww)R(x0+k,y0+1,1,Math.max(1,bh2-2),"rgba(255,255,225,.75)")}
  const cx=x0+(bww>>1);
  // coat pattern
  if(g.pattern===1){R(x0+1,y0+bh2-4,1,1,dark);R(x0+bww-2,y0+bh2-5,1,1,dark);R(x0+bww-3,y0+1,1,1,dark)}
  else if(g.pattern===2){R(x0+1,y0,bww-2,1,dark);R(x0,y0+1,bww,1,dark)}
  else if(g.pattern===3){R(cx-2,y0+bh2-3,4,2,lite)}
  // head feature
  if(p.sprout===0){R(cx,y0-2,1,2,"#3f8f3a");R(cx-2,y0-3,2,1,"#6fcf5a");R(cx+1,y0-4,2,1,"#6fcf5a")}
  else if(p.sprout===1){R(x0+1,y0-2,2,2,body);R(x0+bww-3,y0-2,2,2,body);R(x0+1,y0-1,1,1,"#ff9db5");R(x0+bww-2,y0-1,1,1,"#ff9db5")}
  else if(p.sprout===2){R(cx,y0-3,1,3,dark);const gl=.6+.4*Math.sin(t*4+p.hue);R(cx-1,y0-5,3,2,`hsla(${hue},90%,82%,${gl})`)}
  else if(p.sprout===3){R(cx-1,y0-1,1,1,dark);R(cx,y0-2,1,2,dark);R(cx+1,y0-1,1,1,dark)}
  else if(p.sprout===4){R(cx,y0-1,1,1,"#3f8f3a");R(cx-1,y0-3,3,1,"#ff9db5");R(cx,y0-4,1,3,"#ff9db5");R(cx,y0-3,1,1,"#ffd166")}
  else if(p.sprout===5){R(x0+1,y0-2,1,2,"#f5eddc");R(x0+bww-2,y0-2,1,2,"#f5eddc");R(x0+1,y0-3,1,1,"#cdbfa8");R(x0+bww-2,y0-3,1,1,"#cdbfa8")}
  if(lv>=6){const d=dom(p),cc=d?TRAIT_COL[d]:"#ffd166";R(x0+bww-3,y0-1,2,2,cc);R(x0+bww-2,y0-2,1,1,cc)}
  // face
  const big=g.eyes===1,ey=y0+Math.max(2,Math.floor(bh*.36)),off=dir>0?1:0,el=cx-(big?3:2)+off,er=cx+1+off,ew=big?2:1,eye="#2a1830";
  const happy=r.state==="celebrate"||r.state==="cuddle"||(p.mood>88&&r.state!=="work");
  const stare=r.state==="stare"||r.state==="form";
  if(sleep){R(el,ey+1,2,1,eye);R(er,ey+1,2,1,eye)}
  else if(stare){const sl=cx-3,sr=cx+1;R(sl,ey,2,2,eye);R(sr,ey,2,2,eye);R(sl,ey,1,1,p.awake?"#9fe8ff":"#ffffff");R(sr,ey,1,1,p.awake?"#9fe8ff":"#ffffff")}
  else if(p.blank){R(el,ey,ew,1,eye);R(er,ey,ew,1,eye)}
  else if(happy){R(el,ey+1,1,1,eye);R(el+1,ey,1,1,eye);R(er,ey,1,1,eye);R(er+1,ey+1,1,1,eye)}
  else if(r.blink<0||r.state==="split"){R(el,ey+1,ew,1,eye);R(er,ey+1,ew,1,eye)}
  else if(g.eyes===2){R(el,ey,1,1,dark);R(er,ey,1,1,dark);R(el,ey+1,1,1,eye);R(er,ey+1,1,1,eye)}
  else{R(el,ey,ew,2,eye);R(er,ey,ew,2,eye);R(el,ey,1,1,"#ffffff");if(big)R(er,ey,1,1,"#ffffff")}
  if(p.awake&&!sleep&&!stare){R(el,ey,1,1,"#9fe8ff");R(er,ey,1,1,"#9fe8ff")}
  if(p.mood>55&&!sleep&&!p.blank){R(el-1,ey+2,1,1,"#ff9db5");R(er+ew,ey+2,1,1,"#ff9db5")}
  if(p.blank&&!sleep)R(cx-1+off,ey+3,3,1,"#5a2a3a");
  if(g.pattern===4){R(el,ey+3,1,1,dark);R(er+ew-1,ey+3,1,1,dark)}
  if(eld&&!sleep){R(cx-2+off,ey+3,4,2,"#f4f1ea");R(cx-1+off,ey+5,2,1,"#f4f1ea");R(el,ey-1,ew,1,"#f4f1ea");R(er,ey-1,ew,1,"#f4f1ea")}
  if((p.trust??30)<-20&&r.state!=="argue"&&!sleep){R(el,ey-1,ew,1,dark);R(er,ey-1,ew,1,dark)}
  if((p.trust??30)>75&&RT.get(p.id)===r&&Math.random()<.002){burst(px,y0-4,"heart",1);const hh=parts[parts.length-1];hh.vx=0;hh.vy=-10}
  if(r.state==="argue"){R(el-1+off,ey-1,2,1,eye);R(er,ey-1,2,1,eye);R(el-1,ey+2,1,1,"#ff5d73");R(er+ew,ey+2,1,1,"#ff5d73")}
  if(p.tribe&&S.tribes){const tt=tribeOf(p);if(tt)R(x0+1,y0+bh2-3,bww-2,1,TRIBE_COL[tt.k])}
  if(RT.get(p.id)===r){if(curSeason==="winter"){R(x0,y0+bh2-4,bww,1,"#e8433f");R(dir>0?x0-1:x0+bww,y0+bh2-4,1,3,"#e8433f")}holidayLook(p,x0,y0,bww,ey)}
  if(r.talk>0&&!sleep)R(cx-1+off,ey+3,2,(Math.floor(t*12)%2)+1,"#5a2a3a");
  else if(p.food<20&&!sleep)R(cx-1+off,ey+3,2,1,"#5a2a3a");
  if(r.state==="walk"&&mut!=="wings"){const st=Math.floor(r.anim*10)%2;R(x0+1+st,py-1,2,1,dark);R(x0+bww-3-st,py-1,2,1,dark)}
  if(rainy()&&RT.get(p.id)===r&&r.state!=="sleep"&&r.state!=="choir"&&S.weather){R(cx-4,y0-7,9,1,"#3f8f3a");R(cx-3,y0-8,7,1,"#6fcf5a");R(cx-1,y0-9,3,1,"#6fcf5a");R(cx,y0-6,1,4,"#2f6a33")}
  if(r.state==="gather"&&NODES[r.node]&&NODES[r.node].k==="fish"){const fx=dir>0?x0+bww:x0-1;for(let k=0;k<5;k++)R(fx+dir*k,y0+1-k,1,1,"#8a6a45");R(fx+dir*5,y0-4,1,7,"rgba(230,230,230,.7)")}
  if(r.state==="work"||r.state==="gather"||r.state==="build"||r.state==="sbuild"||r.state==="construct"||r.state==="sbuild3"){const pr=1-r.workT/(r.workMax||1);R(x0-1,y0-6,bww+2,2,"rgba(20,14,24,.7)");R(x0-1,y0-6,Math.round((bww+2)*pr),2,"#86d47f");
    R(dir>0?x0+bww:x0-2,y0+bh-4+Math.round(Math.sin(r.anim*16)),2,2,"#c89c63")}
  if(r.state==="eat")R(dir>0?x0+bww-1:x0-1,ey+3,2,2,"#ff5d73");
  if(isSel){const b=Math.round(Math.sin(t*5)*1.2),ty=y0-(lv>=10?11:9)+b;R(cx-2,ty,5,1,"#ffd166");R(cx-1,ty+1,3,1,"#ffd166");R(cx,ty+2,1,1,"#ffd166")}
  CX.globalAlpha=1;
}
function drawCamp(tr,t){
  const c=TCAMPS[tr.camp],col=TRIBE_COL[tr.k];
  for(let i=0;i<3;i++){
    const h=hutSpot(tr,i);
    if(i<tr.huts){
      for(let dy=-9;dy<=0;dy++){const hw=Math.round(7*Math.sqrt(1-(dy/9.5)**2));R(h.x-hw,h.y+dy,hw*2,1,dy<-6?"#b88a4e":"#c89c63")}
      for(let dy=-8;dy<=0;dy+=3)R(h.x-6,h.y+dy,12,1,"#a87a42");
      R(h.x-2,h.y-4,4,4,"#3a2416");R(h.x-1,h.y-5,2,1,"#3a2416");R(h.x-1,h.y-11,2,2,col);
      if(night)R(h.x-1,h.y-3,2,2,"#ffd166");
    }else if(i===tr.huts&&tr.build>0){
      const n=Math.ceil(tr.build/100*6);for(let k=0;k<n;k++)R(h.x-6+k*2,h.y-1-(k%3)*3,1,3+(k%2)*2,"#a87a42");
    }
  }
  const f=Math.floor(t*3)%2;
  R(c.x+26,c.y-14,1,14,"#5a3d2b");R(c.x+27,c.y-14,6,2,col);R(c.x+27,c.y-12,5-f,2,col);R(c.x+27,c.y-14,1,1,"#fff7d6");
}
function drawParticles(){
  for(const q of parts){
    if(q.kind==="heart"){R(q.x-2,q.y,2,1,"#ff7aa2");R(q.x+1,q.y,2,1,"#ff7aa2");R(q.x-2,q.y+1,5,1,"#ff7aa2");R(q.x-1,q.y+2,3,1,"#ff7aa2");R(q.x,q.y+3,1,1,"#ff7aa2")}
    else if(q.kind==="z"){ctx.globalAlpha=clamp(q.life,0,1);R(q.x,q.y,3,1,"#e9e3ff");R(q.x+1,q.y+1,1,1,"#e9e3ff");R(q.x,q.y+2,3,1,"#e9e3ff");ctx.globalAlpha=1}
    else if(q.kind==="drop")R(q.x,q.y,1,2,"#8cc4ea");
    else if(q.kind==="dust")R(q.x,q.y,1,1,"#a07c55");
    else if(q.kind==="spark")R(q.x,q.y,1,1,Math.random()<.5?"#ffd166":"#fff7c2");
    else if(q.kind==="note"){ctx.globalAlpha=clamp(q.life,0,1);R(q.x,q.y,1,3,"#ffd166");R(q.x-1,q.y+2,2,2,"#ffd166");R(q.x+1,q.y,1,1,"#ffd166");ctx.globalAlpha=1}
    else R(q.x,q.y,1,1,q.c);
  }
}
const flies=Array.from({length:40},()=>({x:rand(0,WW),y:rand(10,WH),a:rand(0,9)}));
function render(t){
  ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;ctx.fillStyle="#16221a";ctx.fillRect(0,0,CW,CH);
  const W2=()=>ctx.setTransform(cam.z,0,0,cam.z,-cam.x*cam.z,-cam.y*cam.z);W2();
  ctx.drawImage(bg,0,0);
  const rp=Math.floor(t*1.2)%3;R(POND.x-14+rp*9,POND.y+4-rp,5,1,"rgba(160,210,240,.55)");
  R(BURROW.x+7,BURROW.y-12,1,3,"#5a3d2b");R(BURROW.x+6,BURROW.y-14,3,2,night?"#ffd166":"#b88a3b");
  // river shimmer
  if(inView(548,0,300))for(let i=0;i<10;i++){const y=(t*18+i*34)%WH,c=riverX(y);R(c-8+Math.sin(t+i)*5,y,4,1,"rgba(170,215,245,.6)")}
  // resource nodes
  NODES.forEach((n,i)=>{if(!inView(n.x,n.y,20))return;const ok=nodeReady(i);
    if(n.k==="berry"){for(let dy=-5;dy<=0;dy++){const hw=Math.round(7*Math.sqrt(1-(dy/5.5)**2));R(n.x-hw,n.y+dy,hw*2,1,"#2f6a33")}if(ok){[[-3,-3],[2,-2],[0,-5],[-5,-1],[4,-4]].forEach(([dx,dy])=>R(n.x+dx,n.y+dy,1,1,"#ff5d73"))}}
    else if(n.k==="fish"){if(ok){const k=Math.floor(t*2+i)%3;const c=riverX(n.y)+(n.x<riverX(n.y)?-4:4);R(c-2-k,n.y-1,4+2*k,1,"rgba(220,240,255,.55)");if(Math.sin(t*3+i)>.9)R(c,n.y-2,1,1,"#ffd166")}}
    else{if(ok){R(n.x-2,n.y-6,2,6,"#9fe8ff");R(n.x+1,n.y-8,2,8,"#c9a2ff");R(n.x+3,n.y-4,2,4,"#9fe8ff");if(Math.sin(t*4+i)>.7)R(n.x+1,n.y-8,1,1,"#fff")}else{R(n.x-2,n.y-2,6,2,"#857a6c")}}
  });
  drawSeasonGround(t);drawWild(t);drawBuildings(t);drawDoodles(t);drawStreakBed(t);drawHoliday(t);drawMeteor(t);
  for(let i=0;i<PLOTS.length;i++){if(PLOTS[i].z&&!zoneOpen(PLOTS[i].z))continue;drawPlot(i,t)}
  drawStatue(t);
  for(const tr of S.tribes)drawCamp(tr,t);
  drawTrees(t);
  drawStory(t);drawHide(t);drawLanterns(t);drawNature(t);drawDecor(t);
  const ord=S.pips.filter(p=>inView(p.x,p.y,24)&&rt(p).state!=="hidden").sort((a,b)=>a.y-b.y);
  for(const p of ord)drawPip(p,t,p.id===sel);
  drawVisitor(t);
  drawParticles();
  // cloud shadows
  if(S.weather.k==="cloudy"||rainy()){for(let i=0;i<4;i++){const x=((t*6+i*190)%(WW+160))-80,y=40+i*80;ctx.fillStyle="rgba(0,0,0,.08)";ctx.beginPath();ctx.ellipse(x,y,60,22,0,0,7);ctx.fill()}}
  // fog over locked zones
  // the fog follows the same soft, wandering edge as the ground (zoneMask)
  drawLockFog(t);
  // light and weather tint, in screen space
  ctx.setTransform(1,0,0,1,0,0);
  const d=new Date(),h=d.getHours()+d.getMinutes()/60;
  let tint=null;
  if(night)tint="rgba(18,22,70,.46)";else if(h<7.5)tint="rgba(255,150,90,.16)";else if(h>18.5)tint="rgba(255,120,80,.18)";
  if(tint){ctx.fillStyle=tint;ctx.fillRect(0,0,CW,CH)}
  if(S.weather.k==="cloudy"){ctx.fillStyle="rgba(90,100,120,.12)";ctx.fillRect(0,0,CW,CH)}
  if(S.weather.k==="rain"){ctx.fillStyle="rgba(60,80,120,.2)";ctx.fillRect(0,0,CW,CH)}
  if(stormy()){ctx.fillStyle="rgba(20,24,50,.38)";ctx.fillRect(0,0,CW,CH)}
  if(focusing()){const g=ctx.createRadialGradient(CW/2,CH/2,CH*.35,CW/2,CH/2,CH*.85);g.addColorStop(0,"rgba(10,14,40,0)");g.addColorStop(1,"rgba(10,14,40,.35)");ctx.fillStyle=g;ctx.fillRect(0,0,CW,CH)}
  W2();
  if(night){
    for(const p of S.pips)if(p.mut==="glow"&&inView(p.x,p.y,20)){const rg=ctx.createRadialGradient(p.x,p.y-5,1,p.x,p.y-5,16);rg.addColorStop(0,`hsla(${p.hue},100%,80%,.45)`);rg.addColorStop(1,`hsla(${p.hue},100%,80%,0)`);ctx.fillStyle=rg;ctx.fillRect(p.x-16,p.y-21,32,32)}
    const gl=ctx.createRadialGradient(BURROW.x+7,BURROW.y-13,1,BURROW.x+7,BURROW.y-13,26);gl.addColorStop(0,"rgba(255,209,102,.35)");gl.addColorStop(1,"rgba(255,209,102,0)");ctx.fillStyle=gl;ctx.fillRect(BURROW.x-20,BURROW.y-40,54,54);drawLanternGlow(t);drawDecorGlow(t);
    if(zoneOpen("cave"))for(const m of CMUSH){const a=.35+.15*Math.sin(t*2+m.x);const g2=ctx.createRadialGradient(m.x,m.y,1,m.x,m.y,10);g2.addColorStop(0,`rgba(120,240,255,${a})`);g2.addColorStop(1,"rgba(120,240,255,0)");ctx.fillStyle=g2;ctx.fillRect(m.x-10,m.y-10,20,20)}
    for(const f of flies){f.a+=.016;f.x+=Math.cos(f.a*1.3)*.25;f.y+=Math.sin(f.a)*.18;if(f.x<0)f.x=WW;if(f.x>WW)f.x=0;if(f.y<4)f.y=WH;if(f.y>WH)f.y=4;
      if(Math.sin(f.a*3)>-.2)R(f.x,f.y,1,1,"#f6ff9a")}
  }
  if(zoneOpen("cave"))for(const m of CMUSH){R(m.x,m.y,1,2,"#d9f7ff");R(m.x-1,m.y-1,3,1,"#7ff0ff")}
  drawSky(t);
  if(night&&S.stars.length){ctx.setTransform(1,0,0,1,0,0);
    for(const st of S.stars){const{fx,fy}=starPos(st),x=Math.round(fx*CW),y=Math.round(fy*CH),tw=.55+.45*Math.sin(t*1.7+fx*40),fresh=Date.now()-st.died<86400000;
      ctx.fillStyle=`hsla(${st.hue},90%,88%,${tw})`;ctx.fillRect(x,y,3,3);ctx.fillStyle=`hsla(${st.hue},90%,88%,${tw*.5})`;ctx.fillRect(x-2,y+1,7,1);ctx.fillRect(x+1,y-2,1,7);if(fresh){ctx.fillRect(x-3,y+1,9,1);ctx.fillRect(x+1,y-3,1,9)}}
    W2()}
  // rain, lightning, rainbow in screen space
  ctx.setTransform(1,0,0,1,0,0);
  if(rainy()){const n=stormy()?170:90;while(drops.length<n)drops.push({x:rand(0,CW),y:rand(-CH,0),v:rand(260,360)});drops.length=n;
    ctx.fillStyle=stormy()?"rgba(200,215,255,.55)":"rgba(190,210,255,.45)";
    const snow=curSeason==="winter";if(snow)ctx.fillStyle="rgba(255,255,255,.85)";
    for(const q of drops){q.y+=q.v/(snow?220:60);q.x+=snow?Math.sin(q.y/20)*.5+(stormy()?1.2:0):stormy()?2:.6;if(q.y>CH){q.y=rand(-40,0);q.x=rand(0,CW)}if(q.x>CW)q.x-=CW;if(q.x<0)q.x+=CW;if(snow)ctx.fillRect(Math.round(q.x),Math.round(q.y),2,2);else ctx.fillRect(Math.round(q.x),Math.round(q.y),1,stormy()?7:5)}}
  drawSeasonSky();
  if(flash>0){ctx.fillStyle=`rgba(240,245,255,${flash*.55})`;ctx.fillRect(0,0,CW,CH)}
  if(S.weather.k==="rainbow"){const cols=["#ff5d73","#ffb347","#ffd166","#86d47f","#8fbfff","#c9a2ff"];ctx.globalAlpha=.32;cols.forEach((c,i)=>{ctx.strokeStyle=c;ctx.lineWidth=5;ctx.beginPath();ctx.arc(CW/2,CH*1.05,CH*.95-i*5,Math.PI,2*Math.PI);ctx.stroke()});ctx.globalAlpha=1}
  drawHideHud();
}

const fogTmp=document.createElement("canvas");fogTmp.width=WW;fogTmp.height=WH;
function drawLockFog(t){
  const m=lockedMask();if(!m)return;
  // only the part of the world that is on screen
  const x0=Math.max(0,Math.floor(cam.x)-2),y0=Math.max(0,Math.floor(cam.y)-2),w=Math.min(WW,Math.ceil(cam.x+CW/cam.z)+2)-x0,h=Math.min(WH,Math.ceil(cam.y+CH/cam.z)+2)-y0;
  if(w<=0||h<=0)return;
  const g=fogTmp.getContext("2d");
  g.globalCompositeOperation="source-over";g.clearRect(x0,y0,w,h);
  g.fillStyle="rgba(22,26,34,.7)";g.fillRect(x0,y0,w,h);
  const ox=(t*4)%96;for(let x=Math.floor(x0/96)*96-96;x<x0+w;x+=96)for(let y=Math.floor(y0/96)*96;y<y0+h;y+=96)g.drawImage(fog,x+ox,y);
  g.globalCompositeOperation="destination-in";g.drawImage(m,x0,y0,w,h,x0,y0,w,h);g.globalCompositeOperation="source-over";
  ctx.drawImage(fogTmp,x0,y0,w,h,x0,y0,w,h);
}
