/* ================= research =================
   The pips share what they learn: every digital bite also goes into the farm's data bank.
   Spend it on research in the farm tab. Some research needs other research first. */
const RESEARCH=[
  {id:"water",n:"השקיה אוטומטית",d:"כל שתילה חדשה מתחילה מושקית",c:60},
  {id:"basket",n:"סל דחוס",d:"עוד 30 מקום בסל",c:80},
  {id:"bugtrap",n:"מלכודת באגים",d:"באגים גונבים לאט פי שניים",c:90},
  {id:"fastc",n:"קימפול מהיר",d:"פיפים צריכים 20% פחות דאטה לשלב הבא",c:120},
  {id:"antivirus",n:"אנטי-וירוס",d:"וירוס מתפשט לאט פי שניים",c:140,req:["bugtrap"]},
  {id:"chipsrv",n:"שרת שבבים",d:"שרתים מייצרים גם שבבים, לא רק ביטים",c:150},
  {id:"yield",n:"זרעים יעילים",d:"כל קטיף נותן ביט נוסף",c:260,req:["water","basket"]},
  {id:"strongnet",n:"רשת חזקה",d:"שרתים ואנטנות שווים כפול ברשת",c:300,req:["chipsrv"]}
];
const res=id=>!!(S&&S.research&&S.research[id]);
function bankData(n){S.dataBank=(S.dataBank||0)+n}
function canResearch(R){return !res(R.id)&&(R.req||[]).every(res)&&(S.dataBank||0)>=R.c}
function doResearch(id){
  const R=RESEARCH.find(q=>q.id===id);if(!R||!canResearch(R))return;
  S.dataBank-=R.c;S.research=S.research||{};S.research[id]=Date.now();S.stats.researched=(S.stats.researched||0)+1;
  SFX.level();[0,4,7,12].forEach((m,i)=>tone(523*Math.pow(2,m/12),.08,"square",i*.07,0,.1));
  toast(`מחקר הושלם: ${R.n}. ${R.d}`,1);renderResearch();renderHead();dirty();
}
function renderResearch(){
  const el=$("researchBox");if(!el)return;
  el.innerHTML=`<p class="albtop" style="margin:0 0 6px">בנק הדאטה: <b>${S.dataBank||0}</b>. כל ביט, שבב או פיקסל שפיפ אוכל נכנס גם לבנק</p><div class="shop">`+
    RESEARCH.map(R=>{const done=res(R.id),lock=!(R.req||[]).every(res);
      const sub=done?"✓ נחקר":lock?`🔒 צריך קודם: ${R.req.map(q=>RESEARCH.find(x=>x.id===q).n).join(", ")}`:`${R.c} דאטה`;
      return`<button class="btn digi${done?" done":""}" type="button" data-res="${R.id}" ${canResearch(R)?"":"disabled"}><b>${R.n}</b><span>${R.d}</span><span>${sub}</span></button>`}).join("")+`</div>`;
}
