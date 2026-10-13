/* ================= photo mode =================
   The camera button next to the zoom: the bars and bubbles hide, a frame shows what will be
   in the picture, and you can name the farm. Save makes a PNG with a frame and a caption
   (farm name, day, how many pips, the network). The picture also stays in the card, so it can
   be saved with a right click where downloads are blocked. */
let photoOn=false;
function farmName(){if(S.farmName)return S.farmName;const f=S.pips.find(p=>p.founder);return f?`החווה של ${f.name}`:"חוות הפיפים"}
function togglePhoto(on?){
  photoOn=on??!photoOn;document.body.classList.toggle("photo",photoOn);
  const ov=$("photoBar");ov.hidden=!photoOn;
  if(photoOn){($("photoName") as HTMLInputElement).value=farmName();closePlot();tone(1200,.04,"square",0,1,.1)}
}
function photoCaption(){
  const d=new Date(),days=Math.max(1,Math.ceil((Date.now()-(S.born||Date.now()))/86400000));
  return [`${S.pips.length} פיפים`,`יום ${days} בחווה`,(S.net||0)>0?`רשת ${S.net}%`:null,d.toLocaleDateString("he-IL")].filter(Boolean).join(" · ");
}
function takePhoto(){
  const name=(($("photoName") as HTMLInputElement).value||"").trim().slice(0,30);if(name){S.farmName=name;dirty()}
  const cv=$("cv") as HTMLCanvasElement,pad=20,band=64,W=cv.width+pad*2,H=cv.height+pad+band;
  const c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");
  g.fillStyle="#2a1f33";g.fillRect(0,0,W,H);
  g.fillStyle="#8a6a45";g.fillRect(pad-6,pad-6,cv.width+12,cv.height+12);g.fillStyle="#3d2819";g.fillRect(pad-3,pad-3,cv.width+6,cv.height+6);
  g.imageSmoothingEnabled=false;g.drawImage(cv,pad,pad);
  // a few pixel corners in the network colour once the farm is digital
  if(digi()>0){g.fillStyle="#5dffb0";[[pad-6,pad-6],[W-pad,pad-6],[pad-6,pad+cv.height],[W-pad,pad+cv.height]].forEach(([x,y])=>g.fillRect(x,y,6,6))}
  g.direction="rtl";g.textAlign="center";g.fillStyle="#f5eddc";g.font="bold 26px system-ui,'Segoe UI',sans-serif";
  g.fillText(farmName(),W/2,cv.height+pad+34);
  g.fillStyle="#cdbfa8";g.font="15px system-ui,'Segoe UI',sans-serif";g.fillText(photoCaption(),W/2,cv.height+pad+56);
  const url=c.toDataURL("image/png");
  S.stats.photos=(S.stats.photos||0)+1;
  const filename=`${farmName().replace(/[\\/:*?"<>|]/g,"")||"pip-farm"}.png`;
  const anchor=()=>{try{const a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove()}catch(_){}};
  // inside a claude.ai artifact a plain download does nothing: ask the viewer through the downloads capability
  const cl=(window as any).claude;
  if(cl&&cl.use){c.toBlob(blob=>{cl.use("downloads").then(d=>{if(d&&blob)d.save({filename,data:blob}).catch(()=>{});else anchor()}).catch(anchor)},"image/png")}
  else anchor();
  // flash
  const fl=$("photoFlash");fl.hidden=false;fl.classList.remove("go");void fl.offsetWidth;fl.classList.add("go");setTimeout(()=>{fl.hidden=true},500);
  tone(1600,.05,"square",0,1,.12);tone(900,.12,"square",.05,1,.1);
  togglePhoto(false);
  const pv=$("photoPrev");pv.hidden=false;($("photoImg") as HTMLImageElement).src=url;
  dirty();
}
