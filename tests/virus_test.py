# Virus: starts on a field, freezes it, spreads, keeper sends pips to clean, antenna pips are faster and vaccinate.
import asyncio,json,datetime
from branch_test import *
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();errs=[]
        d=save(base(ch=3),{"sound":False})
        d["plots"]=[{"owned":True,"crop":{"type":0,"planted":now,"water":False}} for k in range(4)]+[{"owned":False,"crop":None}]*5
        pg=await b.new_page(viewport={"width":1280,"height":800});pg.on("pageerror",lambda e:errs.append(str(e)))
        await pg.clock.install(time=datetime.datetime.now().replace(hour=12,minute=0));await pg.clock.resume()
        await pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('pipfarm.v1',"+json.dumps(json.dumps(d))+")}")
        await pg.goto("file://"+os.path.join(os.path.dirname(os.path.abspath(__file__)),"t.html"));await pg.wait_for_timeout(1500);await pg.mouse.click(5,5)
        await pg.evaluate("__pip.startVirus(0)");await pg.wait_for_timeout(400)
        print("VIRUS card",await pg.locator("#sTitle").inner_text())
        await skip(pg);await pg.locator('#sChoices button').first.click();await pg.wait_for_timeout(200)
        pl0=await pg.evaluate("__pip.S.plots[0].crop.planted");await pg.wait_for_timeout(1500)
        print("FROZEN",await pg.evaluate("__pip.S.plots[0].crop.planted")>pl0)
        await pg.evaluate("__pip.S.virus.next=Date.now()-1");await pg.wait_for_timeout(1500)
        print("SPREAD",len(await pg.evaluate("__pip.S.virus.plots")))
        # tap the infected field, popup, send a pip (an antenna pip goes first)
        await pg.evaluate("(()=>{const p=__pip.S.pips[4],r=__pip.rt(p);p.ds=2;p.dmod=2;r.state='idle';r.job=null;r.goal=null;r.wait=9})()")
        f=await pg.evaluate("__pip.PLOTS[0]");await tapw(pg,f["x"]+24,f["y"]+15);await pg.wait_for_timeout(300)
        print("POPUP",await pg.locator("#pmenu [data-act='clean']").count())
        await pg.locator("#pmenu [data-act='clean']").click()
        who=await pg.evaluate("__pip.S.pips.filter(p=>__pip.rt(p).goal==='clean').map(p=>p.dmod)")
        print("SENT antenna first",who==[2])
        # send for the second field too
        other=await pg.evaluate("__pip.S.virus.plots.find(i=>i!==0)");await pg.evaluate(f"__pip.sendCleaner({other})")
        await pg.wait_for_function("!__pip.S.virus",timeout=30000)
        print("CLEAN done",await pg.evaluate("__pip.S.stats.virusWins"),"vaccinated",await pg.evaluate("!!(__pip.S.vacc&&__pip.S.vacc[0])"))
        print("ERR",errs[:8]);await b.close()
asyncio.run(main())
