/* ================= art helpers for the sharper look =================
   The canvas has 2 real pixels per world pixel, so sprites here use half-pixel detail:
   rounded pip bodies with shading, soft shadows, and a finer ground texture. */

// the ground at double resolution: the painted world, plus fine grass blades and soft light
const bg2=document.createElement("canvas");bg2.width=WW*2;bg2.height=WH*2;
(function fineGround(){
  const g=bg2.getContext("2d"),r=mulberry(2024);g.imageSmoothingEnabled=false;g.drawImage(bg,0,0,WW*2,WH*2);
  const zoneId=(x,y)=>ZONES[zid(x/2,y/2)].id;
  for(let i=0;i<52000;i++){
    const x=Math.floor(r()*WW*2),y=Math.floor(r()*WH*2),z=zoneId(x,y);
    if(inPond(x/2,y/2)||inRiver(x/2,y/2))continue;
    if(z==="cave"){g.fillStyle=r()<.5?"rgba(255,255,255,.06)":"rgba(0,0,0,.08)";g.fillRect(x,y,1,1);continue}
    // grass blades: a dark root and a light tip
    g.fillStyle="rgba(20,50,20,.16)";g.fillRect(x,y,1,2);
    g.fillStyle=z==="forest"?"rgba(150,200,120,.10)":"rgba(190,235,150,.14)";g.fillRect(x,y-1,1,1);
  }
  // the painted trees again, with shading and leaves
  g.save();g.scale(2,2);const F=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x*2)/2,Math.round(y*2)/2,w,h)};
  for(const t of BGTREES){const z=ZONES[zid(t.x,t.y)].id;treeArt(F,t.x,t.y-t.rr,t.rr,treePal(z==="forest"?"forest":"summer"),t.x*7+t.y,0,t.y+6)}
  for(const b of BGBUSH)bushArt(F,b.x,b.y,b.x*13+b.y);
  pondArt(F);
  g.restore();
  // soft light from the top-left, so the world feels round
  const lg=g.createLinearGradient(0,0,WW*2,WH*2);lg.addColorStop(0,"rgba(255,250,220,.07)");lg.addColorStop(.6,"rgba(0,0,0,0)");lg.addColorStop(1,"rgba(0,0,30,.08)");
  g.fillStyle=lg;g.fillRect(0,0,WW*2,WH*2);
})();

// a soft round shadow under something standing on the ground
function softShadow(x,y,rx,ry,a){CX.fillStyle=`rgba(10,20,10,${a??.25})`;CX.beginPath();CX.ellipse(x,y,rx,ry,0,0,Math.PI*2);CX.fill()}

// a rounded pip body built from half-pixel rows: outline, body, belly shade, top light, rim light
function blob(x0,y0,w,h,out,body,dark,lite){
  const rr=Math.min(2.5,w/2.6),inset=(d,rad)=>d>=rad?0:rad-Math.sqrt(Math.max(0,rad*rad-(rad-d)*(rad-d)));
  for(let yy=-.5;yy<h+.5;yy+=.5){const d=Math.min(yy+.5,h+.5-yy-.5),i=Math.round(inset(d,rr+.5)*2)/2;R(x0-.5+i,y0+yy,w+1-2*i,.5,out)}
  for(let yy=0;yy<h;yy+=.5){const d=Math.min(yy,h-yy-.5),i=Math.round(inset(d,rr)*2)/2;R(x0+i,y0+yy,w-2*i,.5,yy>h*.66?dark:body)}
  // top light and rim
  const ti=Math.round(inset(.5,rr)*2)/2;
  R(x0+ti+.5,y0+.5,Math.max(1,w*.32),.5,lite);R(x0+1,y0+1,.5,Math.max(1,h*.25),lite);
  R(x0+w-1-ti,y0+h*.45,.5,h*.2,"rgba(255,255,255,.18)");
}

// tree colours: dark, mid, light, highlight
function treePal(k){return k==="autumn"?["#7a3a1c","#a85a28","#c9772f","#e8a457"]:k==="winter"?["#1c381b","#264a24","#2f5a2c","#43723d"]:k==="forest"?["#24491f","#2f5c29","#3a6e32","#4f8a43"]:["#2b5a26","#336a2d","#3f7c37","#5c9c4c"]}
// a round, shaded tree crown and trunk. f draws a rectangle; groundY is where the trunk meets the ground
function treeArt(f,x,cy,s,pal,seed,sh,groundY){
  const disc=(dx,dy,r,c)=>{for(let y=-r;y<=r;y+=.5){const hw=Math.round(Math.sqrt(Math.max(0,r*r-y*y))*2)/2;if(hw>0)f(x+dx-hw+sh,cy+dy+y,hw*2,.5,c)}};
  // trunk with a darker side
  const ty=cy+s*.6;f(x-1,ty,3,groundY-ty,"#5a3d2b");f(x+.5,ty,1,groundY-ty,"#46301f");f(x-1.5,groundY-1,4,1,"#46301f");
  disc(0,.5,s+.5,"rgba(20,35,15,.55)");
  disc(0,0,s,pal[0]);disc(-s*.08,-s*.1,s*.86,pal[1]);disc(-s*.28,-s*.32,s*.55,pal[2]);disc(-s*.4,-s*.45,s*.26,pal[3]);
  // leaf texture: a few light and dark specks that stay put
  let h=seed|0;const rnd=()=>{h=(h*1103515245+12345)&0x7fffffff;return h/0x7fffffff};
  for(let i=0;i<Math.round(s*2.2);i++){const a=rnd()*Math.PI*2,d=Math.sqrt(rnd())*s*.85,px=Math.cos(a)*d,py=Math.sin(a)*d;f(x+px+sh,cy+py,.5,.5,py<0&&px<0?pal[3]:pal[0])}
}

// a berry bush: shaded mound with a few red berries
function bushArt(f,x,y,seed){
  const row=(dy,hw,c)=>f(x-hw,y+dy,hw*2,.5,c);
  for(let dy=-5;dy<=0;dy+=.5){const hw=Math.round(6.5*Math.sqrt(Math.max(0,1-((dy+.3)/5.5)**2))*2)/2;row(dy,hw,"#1f4a22")}
  for(let dy=-4.5;dy<=-.5;dy+=.5){const hw=Math.round(5.8*Math.sqrt(Math.max(0,1-((dy+.3)/5)**2))*2)/2;row(dy,hw,dy<-2.5?"#3a7d38":"#2f6a33")}
  f(x-3,y-4,2,.5,"#5a9a4c");f(x-3.5,y-3.5,.5,1,"#5a9a4c");
  [[-3,-3],[2,-2],[0,-4.5],[-4.5,-1.5],[4,-3.5]].forEach(([dx,dy],i)=>{f(x+dx,y+dy,1,1,"#e8433f");f(x+dx,y+dy,.5,.5,"#ff9a9a")});
}
// the pond: stone rim, deep and shallow water, a soft reflection and a lily pad
function pondArt(f){
  const {x,y,rx,ry}=POND,ring=(r1,r2,c,fill?)=>{for(let dy=-r2;dy<=r2;dy+=.5){const hw=Math.round(r1*Math.sqrt(Math.max(0,1-(dy/r2)**2))*2)/2;if(hw>0)f(x-hw,y+dy,hw*2,.5,c)}};
  ring(rx+1.5,ry+1.5,"#5f6b5c");ring(rx+1,ry+1,"#8a978a");ring(rx,ry,"#2f6a9a");ring(rx-1,ry-1,"#3e7db1");
  for(let dy=-ry+1;dy<=-2;dy+=.5){const hw=Math.round((rx-2)*Math.sqrt(Math.max(0,1-(dy/(ry-1))**2))*2)/2;f(x-hw,y+dy,hw*2,.5,"#4a8fc4")}
  ring(rx*.55,ry*.45,"rgba(30,70,110,.35)");
  f(x-13,y-6,6,.5,"#a8d4f2");f(x-10,y-5,4,.5,"#8cc4ea");f(x+4,y+3,7,.5,"#6aaedc");
  // lily pad with a notch, and a flower
  for(let dy=-1.5;dy<=1;dy+=.5){const hw=Math.round(3*Math.sqrt(Math.max(0,1-(dy/2)**2))*2)/2;f(x+10.5-hw,y-2+dy,hw*2,.5,"#4f9a48")}
  f(x+10.5,y-3,1.5,1,"#3e7db1");f(x+9,y-3,1,1,"#ff9db5");f(x+9.5,y-3.5,.5,.5,"#ffffff");
}
