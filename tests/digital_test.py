# Digital farm: crops are bits/chips, the world digitizes with the story chapters.
import asyncio,json
from branch_test import *
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();errs=[]
        d=save(base(ch=0),{"sound":False})
        d["plots"]=[{"owned":True,"crop":{"type":k%3,"planted":now-9e9,"water":False}} for k in range(3)]+[{"owned":False,"crop":None}]*6
        pg=await page(b,d,errs,"dg");await pg.mouse.click(5,5)
        print("CROPS digital",await pg.evaluate("__pip.CROPS.map(c=>c.kind).join(',')"))
        await pg.locator("[data-tab='farm']").first.click();await pg.wait_for_timeout(300)
        print("LOCKED early",await pg.locator("#decorBox .btn.digi[disabled]").count())
        print("LEVEL start",await pg.evaluate("__pip.digi()"),"traces",await pg.evaluate("__pip.TRACES.length")>20)
        await pg.evaluate("__pip.cam.x=60;__pip.cam.y=10;__pip.cam.z=2.2");await pg.wait_for_timeout(400)
        await pg.screenshot(path="digital0.png")
        await pg.evaluate("__pip.S.story.ch=3");await pg.wait_for_timeout(1200)
        print("LEVEL mid",await pg.evaluate("__pip.digi()")==0.5,"steps",await pg.evaluate("__pip.S.story.digi"))
        await pg.evaluate("__pip.S.story.ending='free';__pip.cam.x=0;__pip.cam.y=90;__pip.cam.z=2.2");await pg.wait_for_timeout(1200)
        print("LEVEL end",await pg.evaluate("__pip.digi()"),"steps",await pg.evaluate("__pip.S.story.digi"))
        await pg.screenshot(path="digital1.png")
        t=await pg.locator(".hud .chip").nth(1).get_attribute("title");print("HUD",t)
        s=await state(pg);print("SAVED digi",s["story"].get("digi"))
        # digital buildings: locked early, open at the end
        await pg.locator(".tab[data-tab='farm'], [data-tab='farm']").first.click();await pg.wait_for_timeout(300)
        print("SHOP digital",await pg.locator("#decorBox .btn.digi").count(),"open",await pg.locator("#decorBox .btn.digi:not([disabled])").count())
        await pg.evaluate("__pip.S.sparks=500;__pip.S.wood=100");await pg.locator("#decorBox [data-decor-buy='server']").click()
        await pg.evaluate("__pip.cam.x=60;__pip.cam.y=10;__pip.cam.z=2.2");await pg.wait_for_timeout(200)
        await tapw(pg,200,150);await pg.wait_for_timeout(300)
        await pg.locator("#decorBox [data-decor-buy='screen']").click();await tapw(pg,240,150);await pg.wait_for_timeout(300)
        await pg.locator("#decorBox [data-decor-buy='antenna']").click();await tapw(pg,160,150);await pg.wait_for_timeout(300)
        print("PLACED digital",await pg.evaluate("__pip.S.decor.map(d=>d.k).sort().join(',')"))
        bk=await pg.evaluate("__pip.S.basket");await pg.evaluate("__pip.srvAt=Date.now()-200000;__pip.serverTick()")
        print("SERVER bit",await pg.evaluate("__pip.S.basket")-bk==1)
        await pg.evaluate("__pip.cam.x=130;__pip.cam.y=110;__pip.cam.z=3");await pg.wait_for_timeout(400);await pg.screenshot(path="digital2.png")
        print("ERR",errs[:8]);await b.close()
asyncio.run(main())
