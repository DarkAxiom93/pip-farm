# Hide and seek: pips hide, count, give themselves away, get found; and the time-out ending.
import asyncio,json,datetime
from branch_test import *
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();errs=[]
        d=save(base(ch=2,frag=3,choices=["wave"],kind=1),{"sound":True})
        pg=await b.new_page(viewport={"width":1280,"height":800});pg.on("pageerror",lambda e:errs.append(str(e)))
        await pg.clock.install(time=datetime.datetime.now().replace(hour=12,minute=0));await pg.clock.resume()
        await pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('pipfarm.v1',"+json.dumps(json.dumps(d))+")}")
        await pg.goto("file://"+os.path.join(os.path.dirname(os.path.abspath(__file__)),"t.html"));await pg.wait_for_timeout(2000)
        await pg.evaluate("__pip.S.pips.forEach(p=>{const r=__pip.rt(p);r.state='idle';r.need=null;r.job=null;r.goal=null})")
        await pg.locator("#hHide").click();await pg.wait_for_timeout(300)
        h=await pg.evaluate("__pip.hide&&{phase:__pip.hide.phase,n:__pip.hide.spots.filter(s=>s.pip).length,spots:__pip.hide.spots.length}")
        print("START",h and h["phase"],"hiders",h and h["n"],"more spots than pips",h and h["spots"]>h["n"])
        await pg.wait_for_timeout(8000)
        st=await pg.evaluate("({phase:__pip.hide.phase,hidden:__pip.S.pips.filter(p=>__pip.rt(p).state==='hidden').length,total:__pip.hide.total})")
        print("SEEK",st["phase"],"all hidden",st["hidden"]==st["total"])
        await pg.screenshot(path=os.path.join(os.path.dirname(os.path.abspath(__file__)),"hide1.png"))
        # an empty bush
        e=await pg.evaluate("(()=>{const s=__pip.hide.spots.find(s=>!s.pip&&s.k==='bush');return s?[s.x,s.y]:null})()")
        if e: await tapw(pg,e[0],e[1]-4);await pg.wait_for_timeout(200)
        print("EMPTY bush",await pg.evaluate("__pip.hide.found"),"marked",await pg.evaluate("__pip.hide.spots.some(s=>s.empty)") if e else True)
        sp0=await pg.evaluate("__pip.S.sparks")
        spots=await pg.evaluate("__pip.hide.spots.filter(s=>s.pip).map(s=>[s.x,s.y])")
        for x,y in spots: await tapw(pg,x,y-4);await pg.wait_for_timeout(250)
        await pg.wait_for_timeout(600)
        r=await pg.evaluate("({hide:!!__pip.hide,best:__pip.S.stats.hideBest,hides:__pip.S.stats.hides,m:(__pip.S.moments||[]).some(m=>m.k==='hide'),hidden:__pip.S.pips.filter(p=>__pip.rt(p).state==='hidden').length,sp:__pip.S.sparks})")
        print("WON over",not r["hide"],"best set",(r["best"] or 0)>0,"moment",r["m"],"none hidden",r["hidden"]==0,"sparks up",r["sp"]>sp0)
        # time runs out
        await pg.wait_for_timeout(2500);await pg.evaluate("__pip.S.pips.forEach(p=>{const r=__pip.rt(p);r.state='idle';r.need=null;r.goal=null})");await pg.evaluate("__pip.startHide()")
        await pg.wait_for_timeout(8000);await pg.evaluate("__pip.hide.t=1");await pg.wait_for_timeout(1800)
        r=await pg.evaluate("({hide:!!__pip.hide,hides:__pip.S.stats.hides,hidden:__pip.S.pips.filter(p=>__pip.rt(p).state==='hidden').length})")
        print("TIMEOUT over",not r["hide"],"hides",r["hides"],"none hidden",r["hidden"]==0)
        # night: they won't play
        await pg.clock.set_system_time(datetime.datetime.now().replace(hour=23,minute=30));await pg.wait_for_timeout(6500)
        await pg.evaluate("__pip.startHide()");print("NIGHT blocked",await pg.evaluate("!__pip.hide"))
        print("ERR",errs[:8])
        await b.close()
asyncio.run(main())
