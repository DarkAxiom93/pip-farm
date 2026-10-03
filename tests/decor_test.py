# Decorating: buy and place, invalid spots, move to storage and place again for free, pips use them.
import asyncio,json,datetime
from branch_test import *
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();errs=[]
        d=save(base(ch=2,frag=3,choices=["wave"],kind=1),{"sparks":250,"wood":60})
        pg=await b.new_page(viewport={"width":1280,"height":800});pg.on("pageerror",lambda e:errs.append(str(e)))
        await pg.clock.install(time=datetime.datetime.now().replace(hour=12,minute=0));await pg.clock.resume()
        await pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('pipfarm.v1',"+json.dumps(json.dumps(d))+")}")
        await pg.goto("file://"+os.path.join(os.path.dirname(os.path.abspath(__file__)),"t.html"));await pg.wait_for_timeout(2000);await pg.mouse.click(5,5)
        await pg.evaluate("__pip.S.pips.forEach(p=>{p.x=235;p.y=20})")
        await pg.evaluate("__pip.setTab('farm')");await pg.wait_for_timeout(300)
        print("SHOP items",await pg.locator("#decorBox [data-decor-buy]").count())
        sp,wd=await pg.evaluate("[__pip.S.sparks,__pip.S.wood]")
        await pg.locator("#decorBox [data-decor-buy='bench']").click();print("PLACING",await pg.evaluate("!!__pip.placing"))
        await tapw(pg,110,104);await pg.wait_for_timeout(200)  # on a plot: not allowed
        print("BAD spot refused",await pg.evaluate("(__pip.S.decor||[]).length")==0,"still placing",await pg.evaluate("!!__pip.placing"))
        await tapw(pg,180,150);await pg.wait_for_timeout(300)
        r=await pg.evaluate("({n:__pip.S.decor.length,sp:__pip.S.sparks,wd:__pip.S.wood})");print("PLACED",r["n"],"paid",sp-r["sp"]==15 and wd-r["wd"]==6)
        # tap it: popup, back to storage
        await tapw(pg,180,146);await pg.wait_for_timeout(300)
        await pg.locator("#pmenu button",has_text="להחזיר למחסן").click();await pg.wait_for_timeout(200)
        print("STORED",await pg.evaluate("__pip.S.decor.length==0&&__pip.S.decorInv.bench==1"))
        sp=await pg.evaluate("__pip.S.sparks");await pg.locator("#decorBox [data-decor-buy='bench']").click();await tapw(pg,180,150);await pg.wait_for_timeout(200)
        print("FREE from storage",await pg.evaluate("__pip.S.decor.length")==1 and await pg.evaluate("__pip.S.sparks")==sp)
        # a swing, and a pip uses it
        await pg.locator("#decorBox [data-decor-buy='swing']").click();await tapw(pg,60,120);await pg.wait_for_timeout(200)
        await pg.evaluate("(()=>{const P=__pip,p=P.S.pips[2],r=P.rt(p);p.x=70;p.y=118;r.state='idle';r.need=null;r.job=null;P.S.decor=P.S.decor.filter(d=>d.k==='swing');P.decorWander(p,r)})()")
        used=False
        for i in range(12):
            await pg.wait_for_timeout(500)
            if await pg.evaluate("__pip.rt(__pip.S.pips[2]).act==='swing'"): used=True;break
        print("PIP swings",used)
        await pg.wait_for_timeout(2500);s=json.loads(await pg.evaluate("localStorage.getItem('pipfarm.v1')"))
        print("SAVED decor",len(s.get("decor",[])))
        await pg.screenshot(path=os.path.join(os.path.dirname(os.path.abspath(__file__)),"decor.png"))
        print("ERR",errs[:8])
        await b.close()
asyncio.run(main())
