# Pips eat bits -> data -> compile into stages (gated by story), module by diet, children inherit half.
import asyncio,json,datetime
from branch_test import *
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();errs=[]
        d=save(base(ch=1),{"sound":False,"basket":0})
        pg=await b.new_page(viewport={"width":1280,"height":800});pg.on("pageerror",lambda e:errs.append(str(e)))
        await pg.clock.install(time=datetime.datetime.now().replace(hour=12,minute=0));await pg.clock.resume()
        await pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('pipfarm.v1',"+json.dumps(json.dumps(d))+")}")
        await pg.goto("file://"+os.path.join(os.path.dirname(os.path.abspath(__file__)),"t.html"));await pg.wait_for_timeout(1500);await pg.mouse.click(5,5)
        # basket knows its bits
        await pg.evaluate("__pip.S.basket=0;__pip.S.bin=[0,0,0];__pip.addBits(1,5);__pip.S.basket+=3")
        r=await pg.evaluate("({b:__pip.S.basket,bin:__pip.S.bin.join(',')})");print("BASKET",r["b"],"bin",r["bin"])
        k=await pg.evaluate("(()=>{const ks=[];for(let i=0;i<8;i++)ks.push(__pip.takeFood());return ks.sort().join(',')})()");print("TAKE",k)
        # eating gives data and diet
        await pg.evaluate("__pip.S.basket=10;__pip.S.bin=[0,10,0]");p0=await pg.evaluate("__pip.S.pips[0].id")
        await pg.evaluate("(()=>{const p=__pip.S.pips[0];for(let i=0;i<3;i++)__pip.eatFood(p)})()")
        print("DATA",await pg.evaluate("__pip.S.pips[0].data"),"diet",await pg.evaluate("__pip.S.pips[0].diet.join(',')"))
        # compile stage 1 (open at ch 1), stage 2 waits for ch 2
        await pg.evaluate("__pip.S.pips.forEach(p=>{p.data=0});const p=__pip.S.pips[0];p.data=70;p.diet=[1,9,2]")
        print("READY",await pg.evaluate("__pip.dReady(__pip.S.pips[0])"))
        await pg.evaluate("(()=>{const p=__pip.S.pips[0];__pip.startCompile(p);__pip.finishCompile(p)})()");await pg.wait_for_timeout(600)
        print("STAGE1",await pg.evaluate("__pip.S.pips[0].ds"),"card",await pg.locator("#story").is_visible(),"blocked",not await pg.evaluate("__pip.dReady(__pip.S.pips[0])"))
        await skip(pg);await pg.locator('#sChoices button').first.click();await pg.wait_for_timeout(300)
        print("CARD closed",not await pg.locator("#story").is_visible())
        await pg.evaluate("__pip.S.story.ch=2")
        # it compiles on its own when idle
        await pg.evaluate("(()=>{const p=__pip.S.pips[0],r=__pip.rt(p);r.state='idle';r.job=null;r.goal=null;r.wait=0})()")
        await pg.wait_for_function("__pip.S.pips[0].ds==2",timeout=15000)
        print("STAGE2",await pg.evaluate("__pip.S.pips[0].ds"),"module",await pg.evaluate("__pip.pipMod(__pip.S.pips[0])"),"album",await pg.evaluate("!!__pip.S.album['dig:2']"))
        print("GATE s3 ch3",await pg.evaluate("(()=>{const p=__pip.S.pips[0];p.data=999;__pip.S.story.ch=3;return __pip.dReady(p)})()"),"ch4",await pg.evaluate("(()=>{__pip.S.story.ch=4;return __pip.dReady(__pip.S.pips[0])})()"))
        print("GATE s4 no end",await pg.evaluate("(()=>{const p=__pip.S.pips[0];p.ds=3;return __pip.dReady(p)})()"),"end",await pg.evaluate("(()=>{__pip.S.story.ending='free';const r=__pip.dReady(__pip.S.pips[0]);__pip.S.story.ending=null;__pip.S.pips[0].ds=2;__pip.S.pips[0].data=100;__pip.S.story.ch=2;return r})()"))
        # stage 3 rides the circuits on a long walk
        r=await pg.evaluate("""(()=>{const p=__pip.S.pips[1],r=__pip.rt(p);p.ds=3;p.dmod=0;__pip.S.story.ch=4;p.x=100;p.y=150;r.state='walk';r.goal=null;r.tx=260;r.ty=200;return __pip.rideStart(p,r,Math.hypot(160,50))})()""")
        await pg.wait_for_function("(__pip.S.stats.rides||0)>=1",timeout=8000);print("RIDE started",r,"arrived",await pg.evaluate("!__pip.rt(__pip.S.pips[1]).ride"))
        # child inherits half
        await skip(pg);await pg.locator('#sChoices button').first.click();await pg.wait_for_timeout(300)
        await pg.evaluate("(()=>{const p=__pip.S.pips[0];p.data=100;p.growth=9999;p.food=90;__pip.doSplit(p)})()");await pg.wait_for_timeout(300)
        c=await pg.evaluate("(()=>{const ps=__pip.S.pips;const c=ps[ps.length-1];return {d:c.data,m:c.dmod,ds:c.ds||0}})()");print("CHILD data",c["d"],"mod",c["m"],"stage",c["ds"])
        await pg.evaluate("__pip.select(__pip.S.pips[0].id,true)") if await pg.evaluate("!!__pip.select") else None
        await pg.wait_for_timeout(2500);s=json.loads(await pg.evaluate("localStorage.getItem('pipfarm.v1')"))
        sp=[q for q in s["pips"] if q["id"]==p0][0];print("SAVED ds",sp.get("ds"),"mod",sp.get("dmod"),"bin",s.get("bin") is not None)
        await pg.evaluate("(()=>{const ps=__pip.S.pips;[0,1,2,3].forEach(i=>{const p=ps[i],r=__pip.rt(p);p.x=150+i*14;p.y=170;r.state='celebrate';r.ct=999;if(i>0){p.ds=[0,3,2,4][i];p.dmod=[0,0,2,1][i];p.diet=[1,0,0]}});__pip.cam.x=130;__pip.cam.y=145;__pip.cam.z=6})()");await pg.wait_for_timeout(400);await pg.screenshot(path=os.path.join(os.path.dirname(os.path.abspath(__file__)),"pipdata.png"))
        print("ERR",errs[:8]);await b.close()
asyncio.run(main())
