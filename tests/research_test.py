# Research: digital bites fill the data bank, research costs data, needs prerequisites, and changes the game.
import asyncio,json,datetime
from branch_test import *
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();errs=[]
        d=save(base(ch=2),{"sound":False,"basket":10,"bin":[10,0,0]})
        pg=await b.new_page(viewport={"width":1280,"height":800});pg.on("pageerror",lambda e:errs.append(str(e)))
        await pg.clock.install(time=datetime.datetime.now().replace(hour=12,minute=0));await pg.clock.resume()
        await pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('pipfarm.v1',"+json.dumps(json.dumps(d))+")}")
        await pg.goto("file://"+os.path.join(os.path.dirname(os.path.abspath(__file__)),"t.html"));await pg.wait_for_timeout(1500);await pg.mouse.click(5,5)
        await pg.evaluate("(()=>{const p=__pip.S.pips[0];for(let i=0;i<4;i++)__pip.eatFood(p)})()")
        print("BANK",await pg.evaluate("__pip.S.dataBank"))
        await pg.evaluate("__pip.setTab('farm')");await pg.wait_for_timeout(300)
        print("SHOWN",await pg.locator("#researchBox [data-res]").count(),"locked",await pg.locator("#researchBox [data-res='antivirus'][disabled]").count())
        await pg.evaluate("__pip.S.dataBank=200;__pip.renderResearch()")
        await pg.locator("#researchBox [data-res='basket']").click();await pg.wait_for_timeout(200)
        print("DONE basket",await pg.evaluate("!!__pip.S.research.basket"),"paid",await pg.evaluate("__pip.S.dataBank")==120)
        print("PREREQ blocked",await pg.locator("#researchBox [data-res='antivirus'][disabled]").count()==1)
        await pg.locator("#researchBox [data-res='water']").click();await pg.wait_for_timeout(200)
        print("WATER",await pg.evaluate("!!__pip.S.research.water"))
        r=await pg.evaluate("(()=>{const before=__pip.S.pips[1].data=0;__pip.S.research.fastc=1;const p=__pip.S.pips[1];p.data=12;p.ds=0;return __pip.dReady(p)})()")
        print("FASTC ready at 12",r)
        await pg.wait_for_timeout(2200);s=json.loads(await pg.evaluate("localStorage.getItem('pipfarm.v1')"))
        print("SAVED research",sorted(s.get("research",{}).keys()),"bank",s.get("dataBank"))
        print("ERR",errs[:8]);await b.close()
asyncio.run(main())
