# The evening campfire: lights by itself in the evening, pips gather, one tells a story, wood makes it bigger.
import asyncio,json,datetime
from branch_test import *
async def run(b,errs,hour):
    d=save(base(ch=2,frag=3,choices=["wave"],kind=1),{"wood":10})
    pg=await b.new_page(viewport={"width":1280,"height":800});pg.on("pageerror",lambda e:errs.append(str(e)))
    await pg.clock.install(time=datetime.datetime.now().replace(hour=hour,minute=0));await pg.clock.resume()
    await pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('pipfarm.v1',"+json.dumps(json.dumps(d))+")}")
    await pg.goto("file://"+os.path.join(os.path.dirname(os.path.abspath(__file__)),"t.html"));await pg.wait_for_timeout(1500);await pg.mouse.click(5,5)
    await pg.evaluate("__pip.S.pips.forEach(p=>{const r=__pip.rt(p);r.state='idle';r.need=null;r.job=null;r.goal=null})")
    return pg
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();errs=[]
        # noon: no fire
        pg=await run(b,errs,12);f=await pg.evaluate("__pip.FIRE")
        await tapw(pg,f["x"],f["y"]-3);await pg.wait_for_timeout(500);print("NOON no fire",await pg.evaluate("!__pip.fire"));await pg.close()
        # evening
        pg=await run(b,errs,19);await pg.evaluate("__pip.endFire();__pip.S.fireDay=''");await pg.wait_for_timeout(2500)
        print("EVENING lit",await pg.evaluate("!!__pip.fire&&__pip.fire.phase"))
        await pg.wait_for_timeout(9000)
        st=await pg.evaluate("({phase:__pip.fire&&__pip.fire.phase,sit:__pip.S.pips.filter(p=>__pip.rt(p).act==='sit').length})");print("GATHER sitting",st["sit"]>=2,"phase",st["phase"])
        await pg.wait_for_timeout(12500)
        print("STORY told",await pg.evaluate("__pip.S.stats.fires"),"moment",await pg.evaluate("(__pip.S.moments||[]).some(m=>m.k==='fire')"))
        wd=await pg.evaluate("__pip.S.wood");await tapw(pg,f["x"],f["y"]-3);await pg.wait_for_timeout(300)
        print("WOOD thrown",wd-await pg.evaluate("__pip.S.wood"),"logs",await pg.evaluate("__pip.fire&&__pip.fire.logs>0"))
        await pg.screenshot(path=os.path.join(os.path.dirname(os.path.abspath(__file__)),"fire.png"))
        print("ERR",errs[:8])
        await b.close()
if __name__=="__main__": asyncio.run(main())
