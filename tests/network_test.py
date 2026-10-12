# The network: grows with digital pips, never goes down, milestones, uploading instead of dying, bit rain, echoes, the 100% ending.
import asyncio,json,datetime
from branch_test import *
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();errs=[]
        d=save(base(ch=7,ending="free"),{"sound":False})
        pg=await b.new_page(viewport={"width":1280,"height":800});pg.on("pageerror",lambda e:errs.append(str(e)))
        await pg.clock.install(time=datetime.datetime.now().replace(hour=12,minute=0));await pg.clock.resume()
        await pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('pipfarm.v1',"+json.dumps(json.dumps(d))+")}")
        await pg.goto("file://"+os.path.join(os.path.dirname(os.path.abspath(__file__)),"t.html"));await pg.wait_for_timeout(1500);await pg.mouse.click(5,5)
        print("NET start",await pg.evaluate("__pip.netNow()"),"chip hidden",await pg.locator("#hNetChip").is_hidden())
        # 4 nodes -> 12%
        await pg.evaluate("__pip.S.pips.slice(0,4).forEach(p=>{p.ds=4;p.dmod=0;p.diet=[1,0,0]})")
        await pg.wait_for_timeout(2600)
        print("NET nodes",await pg.evaluate("__pip.S.net"),"chip",await pg.locator("#hNetChip").is_visible(),"milestone",await pg.evaluate("__pip.S.netM"),"card",await pg.locator("#sTitle").inner_text())
        await skip(pg);await pg.locator('#sChoices button').first.click()
        # never goes down
        await pg.evaluate("__pip.S.pips.slice(0,4).forEach(p=>{p.ds=0})");await pg.wait_for_timeout(2300)
        print("NET kept",await pg.evaluate("__pip.S.net"))
        # a node pip uploads instead of dying
        await pg.evaluate("__pip.S.pips[5].ds=4");n0=await pg.evaluate("__pip.S.stars.length");nm=await pg.evaluate("__pip.S.pips[5].name")
        await pg.evaluate("__pip.uploadPip(__pip.S.pips[5])")
        print("UPLOAD up",await pg.evaluate("__pip.S.uploaded.length"),"no star",await pg.evaluate("__pip.S.stars.length")==n0,"gone",await pg.evaluate(f"!__pip.S.pips.some(p=>p.name=='{nm}')"))
        # pass state routes to upload
        await pg.evaluate("(()=>{const p=__pip.S.pips[6];p.ds=4;__pip.startPassing(p);__pip.rt(p).ct=.2})()");await pg.wait_for_timeout(1200)
        print("PASS uploads",await pg.evaluate("__pip.S.uploaded.length"))
        # 50%: rain
        await pg.evaluate("__pip.S.net=60;__pip.S.netM=3;__pip.rainNext=1");await pg.wait_for_timeout(2500)
        print("RAIN on",await pg.evaluate("!!__pip.rain"))
        # 75%: echo
        await pg.evaluate("__pip.S.net=80;__pip.S.netM=4;__pip.echoNext=1");await pg.wait_for_timeout(2500)
        print("ECHO on",await pg.evaluate("!!__pip.echo"))
        await pg.evaluate("(()=>{const e=__pip.echo;if(e){__pip.cam.x=e.x-50;__pip.cam.y=e.y-30;__pip.cam.z=4}})()");await pg.wait_for_timeout(1500)
        await pg.screenshot(path=os.path.join(os.path.dirname(os.path.abspath(__file__)),"network.png"))
        # 100%: the ending
        await pg.evaluate("__pip.S.net=100");await pg.wait_for_timeout(2600)
        print("END",await pg.evaluate("!!__pip.S.netDone"),"title",await pg.locator("#sTitle").inner_text(),"moment",await pg.evaluate("__pip.S.moments.some(m=>m.k==='network')"))
        await pg.wait_for_timeout(2000);s=json.loads(await pg.evaluate("localStorage.getItem('pipfarm.v1')"))
        print("SAVED net",s.get("net"),"uploaded",len(s.get("uploaded",[])),"done",bool(s.get("netDone")))
        print("ERR",errs[:8]);await b.close()
asyncio.run(main())
