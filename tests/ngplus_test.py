# New Game+ and music: start a new run after an ending and check what carries over.
import asyncio,json
from branch_test import *
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"]);errs=[]
        d=save(base(ch=7,frag=7,choices=["wave","game","window","gate","free"],kind=5,ending="free",endAt=now-3600000,site={"k":"gate","p":100,"x":244,"y":163,"win":True}))
        d["lex"]={"בלופ":{"c":"food","ok":True},"זיגי":{"c":"screen","ok":True},"טופ":{"c":"sleep","ok":False}}
        d["album"]={"head:0":1,"head:3":1,"mut:gold":1};d["tasks"]=[{"id":"t1","text":"לקנות חלב","done":False}];d["streak"]={"days":4,"last":"","best":6}
        pg=await page(b,d,errs,"N")
        await pg.locator("#hStory").click();await pg.wait_for_timeout(500)
        print("journal endings line", "1/3" in await pg.locator("#sLines").inner_text())
        await pg.locator("#sChoices button",has_text="משחק חדש+").click()
        await btn(pg,"להתחיל הפעלה חדשה");await pg.wait_for_timeout(1500)
        title=await pg.locator("#sTitle").inner_text();print("intro card",title)
        await skip(pg);lines=await pg.locator("#sLines").inner_text();print("intro mentions gate","שער" in lines)
        await btn(pg,"להמשיך")
        st=await state(pg);f=st["pips"][0]
        print("NG loop",st["loop"],"runs",len(st["runs"]),"run ending",st["runs"][0]["ending"],"pips",len(st["pips"]))
        print("NG founder echo",f.get("echo"),"trust",f["trust"],"lang",sorted(f["lang"].keys()))
        print("NG kept lex",sorted(st["lex"].keys()),"album",len(st["album"])>=3,"tasks",len(st["tasks"]),"streak",st["streak"]["days"])
        print("NG story ch",st["story"]["ch"],"ending",st["story"]["ending"],"wood",st["wood"],"sparks",st["sparks"])
        
        # reload: the new run must be what loads
        await pg.evaluate("localStorage.setItem('pf.noinject','1')");pg2=pg;await pg.reload();await pg.wait_for_timeout(2500)
        print("NG reload loop",await pg2.evaluate("__pip.S.loop"),"pips",await pg2.evaluate("__pip.S.pips.length"),"stored loop",await pg2.evaluate("JSON.parse(localStorage.getItem('pipfarm.v1')).loop"))
        # music: mode follows the farm, and a reset ending turns it sad
        await pg2.mouse.click(5,5);await pg2.evaluate("__pip.S.sound=true;__pip.audio()");await pg2.wait_for_timeout(1500)
        print("MUSIC steps>0",await pg2.evaluate("__pip.MUS.step>0"),"mode",await pg2.evaluate("__pip.musicMode()"))
        await pg2.evaluate("__pip.S.story.ending='reset'");print("MUSIC reset mode",await pg2.evaluate("__pip.musicMode()"))
        await pg2.evaluate("__pip.S.story.ending=null;__pip.S.music=false");await pg2.wait_for_timeout(2500);print("MUSIC off level",await pg2.evaluate("__pip.MUS.level"))
        print("ERR",errs[:8])
        await b.close()
asyncio.run(main())
