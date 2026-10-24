# Pips look clearly different: shape, size, eye colour and an accent colour; children stay close to their parent.
import asyncio,json,datetime
from branch_test import *
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();errs=[]
        d=save(base(ch=0),{"sound":False})
        for q in d["pips"]: q.get("g",{}).pop("shape",None)
        pg=await page(b,d,errs,"g");await pg.mouse.click(5,5)
        print("OLD SAVE genes",await pg.evaluate("__pip.S.pips.every(p=>p.g.shape!=null&&p.g.size!=null&&p.g.eyec!=null&&p.hue2!=null)"))
        r=await pg.evaluate("""(()=>{const P=__pip,S=P.S;let close=0,same=0,n=0;
          for(let i=0;i<200;i++){const par=S.pips[i%S.pips.length];const c=P.newPipFrom(par);n++;
            const dh=Math.min(Math.abs(c.hue-par.hue),360-Math.abs(c.hue-par.hue));if(dh<=80)close++;
            same+=['shape','size','eyec','pattern'].filter(k=>c.g[k]===par.g[k]).length/4}
          return {close:close/n,same:same/n}})()""")
        print("CHILD close colour",r["close"]>=.95,"mostly same genes",r["same"]>=.65)
        v=await pg.evaluate("(()=>{const S=__pip.S;const k=new Set(S.pips.map(p=>[p.g.shape,p.g.size,p.g.eyec,p.g.pattern,p.sprout].join()));return k.size})()")
        print("VARIETY",v>=6)
        print("ALBUM sections",await pg.evaluate("['shape','size','eyec'].every(k=>Object.keys(__pip.S.album).some(a=>a.startsWith(k+':')))"))
        print("ERR",errs[:8]);await b.close()
asyncio.run(main())
