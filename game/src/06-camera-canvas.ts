/* ================= camera ================= */
const cam={x:0,y:0,z:2};let camGoal=null;
function zmin(){return Math.max(CW/WW,CH/WH)}
function clampCam(){const vw=CW/cam.z,vh=CH/cam.z;cam.x=vw>=WW?(WW-vw)/2:clamp(cam.x,0,WW-vw);cam.y=vh>=WH?(WH-vh)/2:clamp(cam.y,0,WH-vh)}
function scr(x,y){return[(x-cam.x)*cam.z/CW*100,(y-cam.y)*cam.z/CH*100]}
function zoomAt(nz,fx,fy){const wx=cam.x+fx*CW/cam.z,wy=cam.y+fy*CH/cam.z;cam.z=clamp(nz,zmin(),4);cam.x=wx-fx*CW/cam.z;cam.y=wy-fy*CH/cam.z;clampCam();closePlot()}
function lookAt(x,y){camGoal={x:x-CW/cam.z/2,y:y-CH/cam.z/2};const vw=CW/cam.z,vh=CH/cam.z;camGoal.x=vw>=WW?(WW-vw)/2:clamp(camGoal.x,0,WW-vw);camGoal.y=vh>=WH?(WH-vh)/2:clamp(camGoal.y,0,WH-vh)}
function inView(x,y,m){return x>cam.x-m&&x<cam.x+CW/cam.z+m&&y>cam.y-m&&y<cam.y+CH/cam.z+m}

/* ================= canvas ================= */
const cv=$("cv"),ctx=cv.getContext("2d");ctx.imageSmoothingEnabled=false;
let CX=ctx;
const R=(x,y,w,h,c)=>{CX.fillStyle=c;CX.fillRect(Math.round(x),Math.round(y),w,h)};
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const bg=document.createElement("canvas");bg.width=WW;bg.height=WH;
/* ground: every zone has its own texture over the whole world, and a warped zone map decides which one
   shows at each pixel, so the borders wander and fray like real ground instead of straight lines.
   The same map gives each locked zone a soft mask for its fog (zoneMask). */
function vnoise(seed,scale){
  const r=mulberry(seed),cols=Math.ceil(WW/scale)+3,rows=Math.ceil(WH/scale)+3,G=new Float32Array(cols*rows);
  for(let i=0;i<G.length;i++)G[i]=r()*2-1;
  const sm=t=>t*t*(3-2*t);
  return (x,y)=>{const gx=x/scale+1,gy=y/scale+1,x0=Math.floor(gx),y0=Math.floor(gy),fx=sm(gx-x0),fy=sm(gy-y0),
    a=G[y0*cols+x0],b=G[y0*cols+x0+1],c=G[(y0+1)*cols+x0],d=G[(y0+1)*cols+x0+1];
    return a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy};
}
const ZMAP=new Uint8Array(WW*WH);
(function zoneMap(){
  const n1=vnoise(31,28),n2=vnoise(32,28),n3=vnoise(33,9),n4=vnoise(34,9);
  const idx=(x,y)=>{x=clamp(x,0,WW-1);y=clamp(y,0,WH-1);for(let k=0;k<ZONES.length;k++){const z=ZONES[k];if(x>=z.x&&x<z.x+z.w&&y>=z.y&&y<z.y+z.h)return k}return 0};
  for(let y=0;y<WH;y++)for(let x=0;x<WW;x++)ZMAP[y*WW+x]=idx(x+n1(x,y)*11+n3(x,y)*3,y+n2(x,y)*11+n4(x,y)*3);
})();
const zid=(x,y)=>ZMAP[clamp(Math.round(y),0,WH-1)*WW+clamp(Math.round(x),0,WW-1)];
const zIs=(x,y,id)=>ZONES[zid(x,y)].id===id;
const zoneMask={};
// one mask for all locked zones together, feathered, so neighbouring locked zones don't leave a seam
let lockMaskKey="",lockMask=null;
function lockedMask(){
  const ids=ZONES.filter(z=>z.id!=="farm"&&!zoneOpen(z.id)).map(z=>z.id),key=ids.join(",");
  if(key===lockMaskKey)return lockMask;
  lockMaskKey=key;if(!ids.length){lockMask=null;return null}
  const raw=document.createElement("canvas");raw.width=WW;raw.height=WH;const rg=raw.getContext("2d");ids.forEach(id=>rg.drawImage(zoneMask[id],0,0));
  const f=document.createElement("canvas");f.width=WW;f.height=WH;const fg=f.getContext("2d");try{fg.filter="blur(5px)"}catch(_){}fg.drawImage(raw,0,0);
  lockMask=f;return f;
}
(function masks(){
  for(let k=0;k<ZONES.length;k++){
    const z=ZONES[k];if(z.id==="farm")continue;
    const m=document.createElement("canvas");m.width=WW;m.height=WH;const g=m.getContext("2d"),im=g.createImageData(WW,WH);
    for(let p=0;p<ZMAP.length;p++)if(ZMAP[p]===k)im.data[p*4+3]=255;
    g.putImageData(im,0,0);
    zoneMask[z.id]=m;
  }
})();
(function paintBg(){
  const g=bg.getContext("2d"),r=mulberry(7),B=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)};
  // one texture per kind of ground, painted over the whole world
  const layer=(base,a,b,n,extra?)=>{const c=document.createElement("canvas");c.width=WW;c.height=WH;const q=c.getContext("2d"),rr=mulberry(base.length*97+n);
    q.fillStyle=base;q.fillRect(0,0,WW,WH);for(let i=0;i<n;i++){q.fillStyle=rr()<.5?a:b;q.fillRect(Math.floor(rr()*WW),Math.floor(rr()*WH),1,1)}if(extra)extra(q,rr);return q.getImageData(0,0,WW,WH).data};
  const tufts=(q,rr)=>{for(let i=0;i<2000;i++){const x=Math.floor(rr()*WW),y=Math.floor(rr()*WH);q.fillStyle="#3c6a33";q.fillRect(x,y,1,2);q.fillStyle="#5f964f";q.fillRect(x+1,y-1,1,2)}};
  const L={
    grass:layer("#4b7d40","#437338","#558a48",17000,tufts),
    forest:layer("#3a6a33","#335f2d","#447a3b",15000,(q,rr)=>{for(let i=0;i<900;i++){q.fillStyle=rr()<.5?"#2f5629":"#4a7f40";q.fillRect(Math.floor(rr()*WW),Math.floor(rr()*WH),2,1)}}),
    meadow:layer("#5a9147","#4f8640","#69a455",15000,(q,rr)=>{for(let i=0;i<1400;i++){const x=Math.floor(rr()*WW),y=Math.floor(rr()*WH);q.fillStyle="#4c853d";q.fillRect(x,y,1,2);q.fillStyle="#73ad5e";q.fillRect(x+1,y-1,1,2)}}),
    rock:layer("#6b6257","#5f574d","#776d61",30000,(q,rr)=>{for(let i=0;i<500;i++){q.fillStyle=rr()<.5?"#655c51":"#71675b";q.fillRect(Math.floor(rr()*WW),Math.floor(rr()*WH),2,2)}})
  };
  const kind=ZONES.map(z=>z.id==="forest"?L.forest:z.id==="meadow"?L.meadow:z.id==="cave"?L.rock:L.grass);
  const out=g.createImageData(WW,WH),o=out.data,jr=mulberry(99);
  for(let y=0;y<WH;y++)for(let x=0;x<WW;x++){
    const p=y*WW+x,k=ZMAP[p];
    // near a border, sometimes take the neighbour's ground (a frayed, dithered edge), and blend right at the line
    const ox=x+Math.round((jr()*2-1)*4),oy=y+Math.round((jr()*2-1)*4),k2=zid(ox,oy);
    let src=kind[k],i4=p*4;
    if(k2!==k&&jr()<.45)src=kind[k2];
    const e=x+1<WW?ZMAP[p+1]:k,s2=y+1<WH?ZMAP[p+WW]:k;
    if(e!==k||s2!==k){const other=kind[e!==k?e:s2];o[i4]=(src[i4]+other[i4])>>1;o[i4+1]=(src[i4+1]+other[i4+1])>>1;o[i4+2]=(src[i4+2]+other[i4+2])>>1}
    else{o[i4]=src[i4];o[i4+1]=src[i4+1];o[i4+2]=src[i4+2]}
    o[i4+3]=255;
  }
  g.putImageData(out,0,0);
  // path from burrow to field
  for(let t=0;t<=1;t+=.01){const x=BURROW.x+12+t*(80-BURROW.x-12),y=BURROW.y+12+Math.sin(t*3)*6+t*20;B(x-3,y-2,7,5,"#8a6a45");B(x-2,y-1,5,3,"#9c7a52")}
  // field soil apron
  const apron=(x,y,w,h)=>{try{g.filter="blur(3px)"}catch(_){}g.fillStyle="rgba(60,40,24,.2)";g.fillRect(x,y,w,h);try{g.filter="none"}catch(_){}};
  apron(76,24,176,108);
  // flowers
  const fl=["#ffd166","#ff9db5","#ffffff","#c9a2ff"];
  for(let i=0;i<46;i++){const x=r()*W,y=r()*H;if(x>74&&x<254&&y>22&&y<134||!zIs(x,y,"farm"))continue;B(x,y,1,1,fl[Math.floor(r()*4)]);B(x,y+1,1,1,"#2f5a29")}
  // burrow mound
  for(let dy=-16;dy<=0;dy++){const hw=Math.round(24*Math.sqrt(1-(dy/16)**2));B(BURROW.x-hw,BURROW.y+dy,hw*2,1,dy>-3?"#35612e":"#3f7037")}
  for(let i=0;i<40;i++){const a=r()*Math.PI,x=BURROW.x+Math.cos(a)*r()*22,y=BURROW.y-Math.sin(a)*r()*14;B(x,y,1,1,"#4f8644")}
  B(BURROW.x-5,BURROW.y-9,10,9,"#5a3d2b");B(BURROW.x-4,BURROW.y-10,8,1,"#5a3d2b");
  B(BURROW.x-4,BURROW.y-8,8,8,"#21140e");B(BURROW.x-3,BURROW.y-9,6,1,"#21140e");
  B(BURROW.x+7,BURROW.y-6,1,6,"#5a3d2b");B(BURROW.x+5,BURROW.y-9,5,3,"#c89c63");
  // pond
  for(let dy=-POND.ry;dy<=POND.ry;dy++){const hw=Math.round(POND.rx*Math.sqrt(1-(dy/POND.ry)**2));B(POND.x-hw-1,POND.y+dy,hw*2+2,1,"#7d8a7a");}
  for(let dy=-POND.ry+1;dy<=POND.ry-1;dy++){const hw=Math.round((POND.rx-1)*Math.sqrt(1-(dy/(POND.ry-1))**2));B(POND.x-hw,POND.y+dy,hw*2,1,dy<-3?"#4a8fc4":"#3e7db1")}
  B(POND.x-12,POND.y-5,6,1,"#8cc4ea");B(POND.x+4,POND.y+2,8,1,"#6aaedc");
  B(POND.x+10,POND.y-3,5,3,"#5fae58");B(POND.x+11,POND.y-4,2,1,"#5fae58");
  // trees and bushes
  const tree=(x,y,rr)=>{B(x-1,y,3,6,"#5a3d2b");for(let dy=-rr;dy<=rr;dy++){const hw=Math.round(rr*Math.sqrt(1-(dy/rr)**2));B(x-hw,y-rr+dy,hw*2,1,dy<0?"#3d7a35":"#336a2d")}for(let i=0;i<10;i++)B(x-rr/2+r()*rr,y-rr*1.6+r()*rr,1,1,"#4f9446")};
  tree(10,12,9);tree(64,10,7);tree(250,150,10);tree(232,164,7);
  const bush=(x,y)=>{for(let dy=-4;dy<=0;dy++){const hw=Math.round(6*Math.sqrt(1-(dy/4.5)**2));B(x-hw,y+dy,hw*2,1,"#2f6a33")}B(x-3,y-3,1,1,"#ff5d73");B(x+2,y-2,1,1,"#ff5d73");B(x,y-4,1,1,"#ff5d73")};
  bush(70,160);bush(122,162);bush(178,160);bush(8,92);
  const circ=(x,y,rr,c)=>{for(let dy=-rr;dy<=rr;dy++){const hw=Math.round(rr*Math.sqrt(1-(dy/rr)**2));B(x-hw,y+dy,hw*2,1,c)}};
  // forest: trees and mushrooms where the forest ground is
  for(let i=0;i<70;i++){const x=262+r()*196,y=6+r()*160;if(NODES.some(n=>n.z==="forest"&&Math.hypot(n.x-x,n.y-y)<20)||!zIs(x,y+2,"forest"))continue;tree(x,y,5+Math.floor(r()*5))}
  for(let i=0;i<30;i++){const x=260+r()*200,y=r()*168;if(!zIs(x,y,"forest"))continue;B(x,y,2,1,"#e85a5a");B(x,y+1,2,1,"#f3e6d0")}
  // a few young trees and bushes spill over the forest edge
  for(let i=0;i<14;i++){const x=240+r()*240,y=r()*180;if(zIs(x,y,"forest")||!zIs(x+rand(-14,14),y+rand(-14,14),"forest")||!(zIs(x,y,"farm")||zIs(x,y,"meadow")||zIs(x,y,"river")))continue;if(r()<.5)tree(x,y,3+Math.floor(r()*2));else bush(x,y)}
  // meadow: flowers and the soil apron for its plots
  for(let i=0;i<260;i++){const x=250+r()*220,y=160+r()*176;if(!zIs(x,y,"meadow")||r()<.15&&!zIs(x+8,y+8,"meadow"))continue;B(x,y,1,1,fl[Math.floor(r()*4)])}
  apron(276,190,176,44);
  // cave: a cliff along its wandering top edge, the cave mouth, scattered stones
  for(let x=0;x<WW;x++){let top=-1;for(let y=140;y<215;y++){if(zIs(x,y,"cave")){top=y;break}}if(top<0||top===140)continue;
    const h=6+Math.floor(r()*3);B(x,top,1,h,"#4f483f");if(r()<.5)B(x,top+h,1,1+Math.floor(r()*2),"#4f483f");B(x,top-1,1,1,"#3e6a35")}
  for(let dy=-16;dy<=0;dy++){const hw=Math.round(20*Math.sqrt(1-(dy/16.5)**2));B(128-hw,196+dy,hw*2,1,"#3a332c")}
  for(let dy=-13;dy<=0;dy++){const hw=Math.round(16*Math.sqrt(1-(dy/13.5)**2));B(128-hw,196+dy,hw*2,1,"#120d0a")}
  for(let i=0;i<50;i++){const x=r()*254,y=180+r()*152;if(!zIs(x,y,"cave"))continue;B(x,y,3,2,"#857a6c");B(x,y+2,3,1,"#4f483f")}
  // pebbles and grass tufts across the cave edge
  for(let i=0;i<120;i++){const x=r()*270,y=150+r()*186;const c=zIs(x,y,"cave"),near=c!==zIs(x+rand(-8,8),y+rand(-8,8),"cave");if(!near)continue;if(c){B(x,y,1,2,"#4f8644")}else{B(x,y,2,1,"#857a6c")}}
  // river: banks, water, lily pads, reeds, wooden bridge
  for(let y=0;y<WH;y++){const c=riverX(y);B(c-16,y,32,1,"#7d8a7a");B(c-14,y,28,1,"#3e7db1");B(c-6+Math.round(Math.sin(y/9)*4),y,3,1,"#4a8fc4")}
  for(let i=0;i<26;i++){const y=r()*WH,c=riverX(y);B(c-10+r()*20,y,3,2,"#5fae58")}
  for(let i=0;i<60;i++){const y=r()*WH,c=riverX(y),x=r()<.5?c-18-r()*3:c+16+r()*3;B(x,y,1,3,"#4f8644")}
  for(let y=148;y<=168;y+=3){const c=riverX(y);B(c-18,y,36,2,"#8a6a45");B(c-18,y+2,36,1,"#5a3d2b")}
  B(riverX(148)-18,146,36,1,"#5a3d2b");B(riverX(168)-18,170,36,1,"#5a3d2b");
})();
const fog=document.createElement("canvas");fog.width=96;fog.height=96;
(function(){const g=fog.getContext("2d"),r=mulberry(11);for(let i=0;i<46;i++){const x0=r()*96,y0=r()*96,rr=8+r()*16;for(const ox of[-96,0,96])for(const oy of[-96,0,96]){const x=x0+ox,y=y0+oy,gr=g.createRadialGradient(x,y,1,x,y,rr);gr.addColorStop(0,"rgba(190,200,215,.22)");gr.addColorStop(1,"rgba(190,200,215,0)");g.fillStyle=gr;g.fillRect(x-rr,y-rr,rr*2,rr*2)}}})();

