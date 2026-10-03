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
(function paintBg(){
  const g=bg.getContext("2d"),r=mulberry(7),B=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)};
  B(0,0,WW,WH,"#4b7d40");
  for(let i=0;i<4400;i++)B(r()*WW,r()*WH,1,1,r()<.5?"#437338":"#558a48");
  for(let i=0;i<800;i++){const x=r()*WW,y=r()*WH;B(x,y,1,2,"#3c6a33");B(x+1,y-1,1,2,"#5f964f")}
  // path from burrow to field
  for(let t=0;t<=1;t+=.01){const x=BURROW.x+12+t*(80-BURROW.x-12),y=BURROW.y+12+Math.sin(t*3)*6+t*20;B(x-3,y-2,7,5,"#8a6a45");B(x-2,y-1,5,3,"#9c7a52")}
  // field soil apron
  B(76,24,176,108,"rgba(60,40,24,.18)");
  // flowers
  const fl=["#ffd166","#ff9db5","#ffffff","#c9a2ff"];
  for(let i=0;i<46;i++){const x=r()*W,y=r()*H;if(x>74&&x<254&&y>22&&y<134)continue;B(x,y,1,1,fl[Math.floor(r()*4)]);B(x,y+1,1,1,"#2f5a29")}
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
  // forest: darker floor, dense canopy with clearings around the berry bushes
  B(256,0,208,168,"#3a6a33");for(let i=0;i<900;i++)B(256+r()*208,r()*168,1,1,r()<.5?"#335f2d":"#447a3b");
  for(let i=0;i<70;i++){const x=262+r()*196,y=6+r()*160;if(NODES.some(n=>n.z==="forest"&&Math.hypot(n.x-x,n.y-y)<20))continue;tree(x,y,5+Math.floor(r()*5))}
  for(let i=0;i<30;i++){const x=260+r()*200,y=r()*168;B(x,y,2,1,"#e85a5a");B(x,y+1,2,1,"#f3e6d0")}
  // meadow: bright grass, flowers, soil apron for its plots
  B(256,168,208,168,"#5a9147");for(let i=0;i<900;i++)B(256+r()*208,168+r()*168,1,1,r()<.5?"#4f8640":"#69a455");
  for(let i=0;i<220;i++){const x=258+r()*204,y=170+r()*164;B(x,y,1,1,fl[Math.floor(r()*4)])}
  B(276,190,176,44,"rgba(60,40,24,.18)");
  // cave zone: rocky floor, cliff band, cave mouth, scattered stones
  B(0,168,256,168,"#6b6257");for(let i=0;i<1800;i++)B(r()*256,168+r()*168,1,1,r()<.5?"#5f574d":"#776d61");
  B(0,168,256,7,"#4f483f");for(let x=0;x<256;x+=3)B(x,175,2,1+Math.floor(r()*3),"#4f483f");
  for(let dy=-16;dy<=0;dy++){const hw=Math.round(20*Math.sqrt(1-(dy/16.5)**2));B(128-hw,196+dy,hw*2,1,"#3a332c")}
  for(let dy=-13;dy<=0;dy++){const hw=Math.round(16*Math.sqrt(1-(dy/13.5)**2));B(128-hw,196+dy,hw*2,1,"#120d0a")}
  for(let i=0;i<40;i++){const x=r()*254,y=180+r()*152;B(x,y,3,2,"#857a6c");B(x,y+2,3,1,"#4f483f")}
  // river: banks, water, lily pads, reeds, wooden bridge
  for(let y=0;y<WH;y++){const c=riverX(y);B(c-16,y,32,1,"#7d8a7a");B(c-14,y,28,1,"#3e7db1");B(c-6+Math.round(Math.sin(y/9)*4),y,3,1,"#4a8fc4")}
  for(let i=0;i<26;i++){const y=r()*WH,c=riverX(y);B(c-10+r()*20,y,3,2,"#5fae58")}
  for(let i=0;i<60;i++){const y=r()*WH,c=riverX(y),x=r()<.5?c-18-r()*3:c+16+r()*3;B(x,y,1,3,"#4f8644")}
  for(let y=148;y<=168;y+=3){const c=riverX(y);B(c-18,y,36,2,"#8a6a45");B(c-18,y+2,36,1,"#5a3d2b")}
  B(riverX(148)-18,146,36,1,"#5a3d2b");B(riverX(168)-18,170,36,1,"#5a3d2b");
})();
const fog=document.createElement("canvas");fog.width=96;fog.height=96;
(function(){const g=fog.getContext("2d"),r=mulberry(11);for(let i=0;i<46;i++){const x0=r()*96,y0=r()*96,rr=8+r()*16;for(const ox of[-96,0,96])for(const oy of[-96,0,96]){const x=x0+ox,y=y0+oy,gr=g.createRadialGradient(x,y,1,x,y,rr);gr.addColorStop(0,"rgba(190,200,215,.22)");gr.addColorStop(1,"rgba(190,200,215,0)");g.fillStyle=gr;g.fillRect(x-rr,y-rr,rr*2,rr*2)}}})();

